'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Search, ChevronDown, Check,
  Lock, Zap, SlidersHorizontal, Info, CheckCircle2, Menu, AlertCircle,
  Pencil, BookMarked, Clock, BarChart3,
} from 'lucide-react';

interface Edital      { id: number; nome: string; banca: string; status: string; data: string; }
interface Disciplina  { id: number; nome: string; peso: number | null; qtd_questoes: number | null; }
interface Cargo       { id: number; nome: string; disciplinas: Disciplina[]; }

interface HojeSlot {
  ordem:           number;
  idDisciplina:    number;
  nome:            string;
  tipo:            string;
  categoria:       string;
  nivel:           string | null;
  minutosAlocados: number;
}

interface DiscCiclo {
  idDisciplina: number;
  nome:         string;
  tipo:         string;
  categoria:    string;
  nivel:        string | null;
  frequencia:   number;
}

interface CicloAtivo {
  idCiclo:      number;
  idPlano:      number;
  metodo:       string;
  horasPorDia:  number;
  cargoNome:    string;
  concursoNome: string;
  bancaSigla:   string;
  dataCriacao:  string;
  posicaoAtual: number;
  totalSlots:   number;
  discsPorDia:  number;
  diasPorCiclo: number;
  hojeSlots:    HojeSlot[];
  disciplinas:  DiscCiclo[];
}

const STEPS = [
  { num: 1, label: 'Carga horária' },
  { num: 2, label: 'Edital e cargo' },
  { num: 3, label: 'Montar ciclo' },
];

function getNomeUsuario(): string {
  try {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('authorization='));
    if (!cookie) return '';
    const token  = cookie.split('=')[1];
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json   = decodeURIComponent(atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    const payload = JSON.parse(json);
    return (payload.nome as string).split(' ').slice(0, 2).join(' ');
  } catch {
    return '';
  }
}

export default function CiclosEstudo() {
  const router = useRouter();
  const [mounted, setMounted]             = useState(false);
  const [nomeUsuario, setNomeUsuario]     = useState('');
  const [etapa, setEtapa]                 = useState(1);
  const [direcao, setDirecao]             = useState<'frente' | 'atras'>('frente');
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Estado global da página
  const [estado, setEstado]                       = useState<'loading' | 'visualizacao' | 'criacao'>('loading');
  const [cicloAtivo, setCicloAtivo]               = useState<CicloAtivo | null>(null);
  const [confirmandoEdicao, setConfirmandoEdicao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  // Etapa 1
  const [horasDiarias, setHorasDiarias] = useState(4);

  // Etapa 2
  const [editais, setEditais]                         = useState<Edital[]>([]);
  const [busca, setBusca]                             = useState('');
  const [editalSelecionado, setEditalSelecionado]     = useState<Edital | null>(null);
  const [cargos, setCargos]                           = useState<Cargo[]>([]);
  const [cargoSelecionado, setCargoSelecionado]       = useState<Cargo | null>(null);
  const [loadingEditais, setLoadingEditais]           = useState(false);
  const [loadingCargos, setLoadingCargos]             = useState(false);

  // Etapa 3
  const [modoCiclo, setModoCiclo]                             = useState<'automatico' | 'personalizado'>('automatico');
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [dificuldades, setDificuldades]                       = useState<Record<number, string>>({});
  const [salvando, setSalvando]                               = useState(false);
  const [erroSalvar, setErroSalvar]                           = useState<string | null>(null);

  // Computed — espelha a lógica do servidor
  const discsPorDia          = useMemo(() => Math.min(horasDiarias, 4), [horasDiarias]);
  const maxDisciplinas       = useMemo(() => horasDiarias * 2,          [horasDiarias]);
  const minutosPerDisciplina = 60;
  const disciplinas = useMemo(() => cargoSelecionado?.disciplinas ?? [], [cargoSelecionado]);

  const todasDificuldadesDefinidas = useMemo(
    () => disciplinasSelecionadas.every(id => Boolean(dificuldades[id])),
    [disciplinasSelecionadas, dificuldades]
  );
  const podeContinuarEtapa2 = editalSelecionado !== null && cargoSelecionado !== null;
  const podeFinalizar = modoCiclo === 'automatico'
    || (disciplinasSelecionadas.length > 0 && todasDificuldadesDefinidas);

  const irParaEtapa = (nova: number) => {
    setDirecao(nova > etapa ? 'frente' : 'atras');
    setEtapa(nova);
  };

  const animClass = direcao === 'frente'
    ? 'animate-in fade-in slide-in-from-right-4 duration-300'
    : 'animate-in fade-in slide-in-from-left-4 duration-300';

  useEffect(() => {
    setMounted(true);
    setNomeUsuario(getNomeUsuario());
  }, []);
  useEffect(() => { if (mounted) fetchCicloAtivo(); }, [mounted]);
  useEffect(() => { if (etapa === 2 && editais.length === 0) fetchEditais(); }, [etapa]);
  useEffect(() => { if (editalSelecionado) fetchCargos(editalSelecionado.id); }, [editalSelecionado]);

  const fetchCicloAtivo = async () => {
    try {
      const res  = await fetch('/api/ciclos');
      const data = await res.json();
      if (res.ok) {
        if (data) {
          setCicloAtivo(data);
          setEstado('visualizacao');
        } else {
          setEstado('criacao');
        }
      } else {
        console.error('[fetchCicloAtivo] erro GET /api/ciclos:', data);
        setEstado('criacao');
      }
    } catch (e) {
      console.error('[fetchCicloAtivo] exceção:', e);
      setEstado('criacao');
    }
  };

  const fetchEditais = async () => {
    setLoadingEditais(true);
    try {
      const res  = await fetch('/api/concursos');
      const data = await res.json();
      setEditais(data.map((c: any) => ({
        id: c.id, nome: c.nome, banca: c.banca || '',
        status: c.status ? c.status.toUpperCase() : 'PREVISTO',
        data: c.data ? c.data.split('T')[0].split('-').reverse().join('/') : 'A definir',
      })));
    } catch (e) { console.error(e); } finally { setLoadingEditais(false); }
  };

  const fetchCargos = async (id: number) => {
    setLoadingCargos(true);
    setCargoSelecionado(null); setDisciplinasSelecionadas([]); setDificuldades({});
    try {
      const res  = await fetch(`/api/concursos/${id}`);
      const data = await res.json();
      const lista: Cargo[] = data.edital?.[0]?.cargo?.map((c: any) => ({
        id: c.id_cargo ?? c.id, nome: c.nome,
        disciplinas: c.disciplina?.map((d: any) => ({
          id: d.id_disciplina ?? d.id, nome: d.nome,
          peso: d.peso ?? null, qtd_questoes: d.qtd_questoes ?? null,
        })) ?? [],
      })) ?? [];
      setCargos(lista);
    } catch (e) { console.error(e); } finally { setLoadingCargos(false); }
  };

  const toggleDisciplina = (id: number) => {
    if (disciplinasSelecionadas.includes(id)) {
      setDisciplinasSelecionadas(prev => prev.filter(d => d !== id));
      setDificuldades(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else if (disciplinasSelecionadas.length < maxDisciplinas) {
      setDisciplinasSelecionadas(prev => [...prev, id]);
    }
  };

  const editaisFiltrados = useMemo(() => {
    const f = busca ? editais.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())) : editais;
    return f.slice(0, 5);
  }, [busca, editais]);

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  const handleFinalizar = async () => {
    if (!cargoSelecionado) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const payload = {
        horasDiarias,
        idCargo: cargoSelecionado.id,
        modo:    modoCiclo,
        disciplinas: modoCiclo === 'personalizado'
          ? disciplinasSelecionadas.map(id => ({ id, dificuldade: dificuldades[id] }))
          : disciplinas.map(d => ({ id: d.id })), // algoritmo seleciona as melhores
      };
      const res  = await fetch('/api/ciclos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Resetar form e ir para visualização
      setEtapa(1); setDirecao('frente');
      setHorasDiarias(4); setEditalSelecionado(null); setCargoSelecionado(null);
      setModoCiclo('automatico'); setDisciplinasSelecionadas([]); setDificuldades({});
      setEstado('loading');
      await fetchCicloAtivo();
    } catch (err: any) {
      setErroSalvar(err.message ?? 'Erro ao salvar ciclo.');
    } finally {
      setSalvando(false);
    }
  };


  const handleEditar = async () => {
    setEncerrando(true);
    try {
      await fetch('/api/ciclos', { method: 'DELETE' });
      setCicloAtivo(null);
      setEtapa(1); setDirecao('frente');
      setHorasDiarias(4); setEditalSelecionado(null); setCargoSelecionado(null);
      setModoCiclo('automatico'); setDisciplinasSelecionadas([]); setDificuldades({});
      setEstado('criacao');
    } finally {
      setEncerrando(false);
      setConfirmandoEdicao(false);
    }
  };

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard',        active: false, href: '/dashboard' },
    { icon: <BookOpen size={18} />,        label: 'Minha Mesa',       active: false, href: '/dashboard' },
    { icon: <RefreshCw size={18} />,       label: 'Ciclos de estudo', active: true,  href: '/ciclos' },
    { icon: <LineChart size={18} />,       label: 'Desempenho',       active: false, href: '/dashboard' },
    { icon: <Calendar size={18} />,        label: 'Revisões',         active: false, href: '/dashboard' },
    { icon: <Settings size={18} />,        label: 'Configurações',    active: false, href: '/dashboard' },
    { icon: <User size={18} />,            label: 'Perfil de usuario', active: false, href: '/dashboard' },
  ];

  if (!mounted) return <div className="min-h-screen w-full bg-[#F0F2F5]" />;

  /* ═══════════════════════════════════════════════════════ RENDER */
  return (
    <div className="min-h-screen w-full flex bg-[#F0F2F5] text-[#475569] font-sans">

      {/* ── Modal de confirmação de edição ── */}
      {confirmandoEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Pencil size={20} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Editar ciclo?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              O ciclo atual será desativado e você poderá configurar um novo. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoEdicao(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar} disabled={encerrando}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {encerrando
                  ? <><RefreshCw size={13} className="animate-spin" /> Aguarde...</>
                  : 'Confirmar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overlay mobile ── */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen transition-transform duration-300 lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center grow overflow-y-auto min-h-0">
          <div className="w-40 h-40 flex items-center justify-center shrink-0">
            <img src="/logo_azul.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <nav className="space-y-1 w-full px-2">
            {navItems.map(item => (
              <MenuItem
                key={item.label}
                icon={item.icon} label={item.label} active={item.active}
                onClick={() => { router.push(item.href); setSidebarAberta(false); }}
              />
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full font-bold text-sm group">
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-red-100 transition-colors"><LogOut size={18} /></div>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAberta(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-sky-500/80">Ciclos de Estudo</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />}     label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Olá, {nomeUsuario}!</p>
                <div className="flex items-center gap-1 justify-end">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-medium italic">Ativo</span>
                </div>
              </div>
              <div className="p-0.5 rounded-full bg-linear-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer">
                <img src="https://github.com/shadcn.png" alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* ── Conteúdo principal ── */}
        <div className="flex justify-center flex-1">
          <div className="flex gap-6 w-full max-w-5xl items-start">

            {/* ── LOADING ── */}
            {estado === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <RefreshCw size={22} className="animate-spin text-sky-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Carregando seu ciclo...</p>
              </div>
            )}

            {/* ── VISUALIZAÇÃO ── */}
            {estado === 'visualizacao' && cicloAtivo && (
              <>
                <div className="flex-1 min-w-0 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-400">

                  {/* Card principal */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            Ciclo Ativo
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            cicloAtivo.metodo === 'PERSONALIZADO' ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700'
                          }`}>
                            {cicloAtivo.metodo === 'PERSONALIZADO' ? 'Personalizado' : 'Automático'}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 truncate">{cicloAtivo.cargoNome}</h2>
                        {(cicloAtivo.concursoNome || cicloAtivo.bancaSigla) && (
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {[cicloAtivo.concursoNome, cicloAtivo.bancaSigla].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmandoEdicao(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-xs font-bold shrink-0"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                    </div>

                    {/* Posição na fila */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posição na fila</span>
                        <span className="text-[10px] font-black text-slate-600">{cicloAtivo.posicaoAtual} / {cicloAtivo.totalSlots}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-700"
                          style={{ width: `${(cicloAtivo.posicaoAtual / cicloAtivo.totalSlots) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-0.5 text-[10px] text-slate-400">
                        <span>{cicloAtivo.discsPorDia} sessões/turno</span>
                        <span className="text-slate-200">·</span>
                        <span>{cicloAtivo.totalSlots} sessões no ciclo</span>
                        <span className="text-slate-200">·</span>
                        <span>60 min/sessão</span>
                      </div>
                    </div>
                  </div>

                  {/* Próximas na fila — leitura apenas */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Próximas na fila</h3>
                      <span className="ml-auto text-[10px] font-bold text-slate-400">
                        meta {cicloAtivo.horasPorDia} sessões/dia
                      </span>
                    </div>
                    <div className="space-y-2">
                      {cicloAtivo.hojeSlots.map((s, i) => {
                        const nivelCores: Record<string, string> = { ALTO: 'bg-red-100 text-red-600', MEDIO: 'bg-amber-100 text-amber-600', BAIXO: 'bg-emerald-100 text-emerald-600' };
                        const nivelLabel: Record<string, string> = { ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' };
                        const catLabel:   Record<string, string> = { R: 'Raciocínio', M: 'Memorização' };
                        const catCor:     Record<string, string> = { R: 'bg-violet-50 text-violet-600', M: 'bg-amber-50 text-amber-600' };
                        const posNaFila = ((cicloAtivo.posicaoAtual - 1 + i) % cicloAtivo.totalSlots) + 1;
                        const eProxima  = i === 0;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${
                              eProxima ? 'bg-sky-50/60 border-sky-100' : 'bg-slate-50/40 border-slate-100'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              eProxima ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${eProxima ? 'text-slate-800' : 'text-slate-400'}`}>{s.nome}</p>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${catCor[s.categoria] ?? 'bg-slate-100 text-slate-500'}`}>
                                {catLabel[s.categoria] ?? s.categoria}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {s.nivel && (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${nivelCores[s.nivel] ?? 'bg-slate-100 text-slate-500'}`}>
                                  {nivelLabel[s.nivel] ?? s.nivel}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-400 tabular-nums">#{posNaFila}</span>
                              <span className="text-[9px] font-bold text-slate-400">60min</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-3 text-center">
                      A execução das sessões fica em <strong className="text-slate-500">Minha Mesa</strong>
                    </p>
                  </div>

                  {/* Fila do ciclo */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">Fila do Ciclo</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cicloAtivo.disciplinas.length} disciplinas · {cicloAtivo.totalSlots} sessões
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {cicloAtivo.disciplinas.map((d) => {
                        const pct       = Math.round((d.frequencia / cicloAtivo.totalSlots) * 100);
                        const nivelCores: Record<string, string> = { ALTO: 'text-red-500', MEDIO: 'text-amber-500', BAIXO: 'text-emerald-500' };
                        const nivelLabel: Record<string, string> = { ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' };
                        const tipoCor:    Record<string, string> = { E: 'bg-sky-50 text-sky-600', B: 'bg-slate-100 text-slate-500' };
                        const tipoLabel:  Record<string, string> = { E: 'Específica', B: 'Básica' };
                        return (
                          <div key={d.idDisciplina} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-xs font-bold text-slate-700 truncate">{d.nome}</p>
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${tipoCor[d.tipo] ?? 'bg-slate-100 text-slate-500'}`}>
                                  {tipoLabel[d.tipo] ?? d.tipo}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{pct}%</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-slate-700">{d.frequencia}×</p>
                              {d.nivel && (
                                <p className={`text-[9px] font-black ${nivelCores[d.nivel] ?? 'text-slate-400'}`}>
                                  {nivelLabel[d.nivel] ?? d.nivel}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Painel lateral direito — visualização */}
                <div className="hidden lg:flex w-72 shrink-0 flex-col gap-4 sticky top-6">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-4">Sobre o ciclo</p>
                    <div className="space-y-3">
                      {[
                        { icon: <BookMarked size={14} />, label: 'Sessões no ciclo', valor: String(cicloAtivo.totalSlots) },
                        { icon: <Zap size={14} />,        label: 'Meta diária',       valor: `${cicloAtivo.horasPorDia} sessões` },
                        { icon: <Clock size={14} />,      label: 'Por sessão',        valor: '60 min' },
                        { icon: <RefreshCw size={14} />,  label: 'Posição na fila',   valor: `#${cicloAtivo.posicaoAtual}` },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-400">{row.icon}<span className="text-xs text-slate-500">{row.label}</span></div>
                          <span className="text-sm font-black text-sky-600">{row.valor}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        <span>Progresso</span>
                        <span>{Math.round((cicloAtivo.posicaoAtual / cicloAtivo.totalSlots) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all"
                          style={{ width: `${(cicloAtivo.posicaoAtual / cicloAtivo.totalSlots) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Como funciona</p>
                    <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                      <p>📌 O ciclo é uma <strong>fila contínua</strong> de sessões de 1h.</p>
                      <p>🎯 Sua meta é <strong>{cicloAtivo.horasPorDia} sessões/dia</strong>.</p>
                      <p>▶ A execução e controle ficam em <strong>Minha Mesa</strong>.</p>
                      <p>🔁 Ao concluir todas as sessões, a fila <strong>recomeça</strong>.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmandoEdicao(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl font-bold text-sm transition-all"
                  >
                    <Pencil size={14} /> Editar ciclo
                  </button>
                </div>
              </>
            )}

            {/* ── CRIAÇÃO ── */}
            {estado === 'criacao' && (
              <>
                <div className="flex-1 min-w-0 flex flex-col">

                  {/* ── Indicador de etapas ── */}
                  <div className="bg-white rounded-2xl px-8 py-5 shadow-sm border border-slate-100 mb-6">
                    <div className="flex">
                      {STEPS.map((step, idx) => {
                        const concluida = etapa > step.num;
                        const atual     = etapa === step.num;
                        const clicavel  = concluida;
                        return (
                          <div key={step.num} className="flex items-center flex-1 last:flex-none">
                            <div
                              className={`flex flex-col items-center gap-1.5 shrink-0 ${clicavel ? 'cursor-pointer group' : ''}`}
                              onClick={() => clicavel && irParaEtapa(step.num)}
                              title={clicavel ? `Voltar para ${step.label}` : undefined}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                concluida ? 'bg-emerald-500 text-white group-hover:bg-emerald-400 group-hover:scale-110' :
                                atual     ? 'bg-[#3b82f6] text-white shadow-md shadow-blue-200' :
                                            'bg-slate-100 text-slate-400'
                              }`}>
                                {concluida ? <Check size={14} /> : step.num}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                atual     ? 'text-blue-600' :
                                concluida ? 'text-emerald-600 group-hover:text-emerald-500' : 'text-slate-400'
                              }`}>{step.label}</span>
                            </div>
                            {idx < 2 && (
                              <div className={`flex-1 h-0.5 mx-3 self-start mt-4 rounded-full transition-all duration-500 ${
                                etapa > step.num ? 'bg-[#3b82f6]' : 'bg-slate-100'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ══ ETAPA 1 ══ */}
                  {etapa === 1 && (
                    <div key="etapa1" className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 1 de 3</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Quanto tempo você pode estudar?</h2>
                      <p className="text-sm text-slate-400 mb-8">Defina sua disponibilidade diária. O sistema calculará quantas disciplinas entrarão no ciclo.</p>

                      <div className="max-w-xl">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Horas por dia</label>
                          <span className="text-2xl font-black text-[#3b82f6]">{horasDiarias}h</span>
                        </div>
                        <input
                          type="range" min="1" max="12" step="1"
                          value={horasDiarias}
                          onChange={e => setHorasDiarias(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-3"
                        />

                        <div className="flex justify-between gap-1 mb-8">
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                            <button key={h} onClick={() => setHorasDiarias(h)}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                                horasDiarias === h ? 'bg-[#3b82f6] text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'
                              }`}
                            >{h}h</button>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <StatCard cor="blue"  label="Sessões/turno"    valor={String(discsPorDia)} />
                          <StatCard cor="sky"   label="Sessões no ciclo" valor={String(maxDisciplinas)} />
                          <StatCard cor="slate" label="Min/sessão"       valor="60min" />
                        </div>

                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-8">
                          <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-700">
                            Com <strong>{horasDiarias}h/dia</strong>, cada turno terá <strong>{discsPorDia} sessões</strong> de 60 min. O ciclo completo tem <strong>{maxDisciplinas} sessões</strong> na fila.
                          </p>
                        </div>

                        <button
                          onClick={() => irParaEtapa(2)}
                          className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══ ETAPA 2 ══ */}
                  {etapa === 2 && (
                    <div key="etapa2" className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 2 de 3</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Qual edital você está estudando?</h2>
                      <p className="text-sm text-slate-400 mb-6">Selecione o concurso e depois escolha o cargo desejado.</p>

                      <div className="relative mb-4 max-w-lg">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input
                          type="text" placeholder="Buscar edital..."
                          value={busca} onChange={e => setBusca(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 transition-colors bg-slate-50"
                        />
                      </div>

                      {loadingEditais ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-4 max-w-lg">
                          <RefreshCw size={14} className="animate-spin" /> Carregando editais...
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 mb-6 max-w-lg">
                          {editaisFiltrados.length === 0
                            ? <p className="text-sm text-slate-400 italic py-2">Nenhum edital encontrado.</p>
                            : editaisFiltrados.map(edital => (
                              <button
                                key={edital.id}
                                onClick={() => setEditalSelecionado(editalSelecionado?.id === edital.id ? null : edital)}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                                  editalSelecionado?.id === edital.id ? 'border-blue-400 bg-blue-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    editalSelecionado?.id === edital.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                                  }`}>
                                    {editalSelecionado?.id === edital.id && <Check size={9} className="text-white" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{edital.nome}</p>
                                    {edital.banca && <p className="text-[10px] text-slate-400 font-medium">{edital.banca}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    edital.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                  }`}>{edital.status}</span>
                                  <span className="text-[10px] text-slate-400 hidden sm:block">{edital.data}</span>
                                </div>
                              </button>
                            ))
                          }
                        </div>
                      )}

                      {editalSelecionado && (
                        <div className="max-w-lg mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cargo</label>
                          {loadingCargos ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                              <RefreshCw size={14} className="animate-spin" /> Carregando cargos...
                            </div>
                          ) : cargos.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Nenhum cargo disponível.</p>
                          ) : (
                            <div className="relative">
                              <select
                                value={cargoSelecionado?.id ?? ''}
                                onChange={e => {
                                  const cargo = cargos.find(c => c.id === Number(e.target.value)) ?? null;
                                  setCargoSelecionado(cargo); setDisciplinasSelecionadas([]); setDificuldades({});
                                }}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 outline-none text-sm font-medium text-slate-800 bg-white appearance-none cursor-pointer transition-colors"
                              >
                                <option value="">Selecione um cargo...</option>
                                {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                              </select>
                              <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => irParaEtapa(1)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                          ← Voltar
                        </button>
                        <button
                          onClick={() => irParaEtapa(3)} disabled={!podeContinuarEtapa2}
                          className={`px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                            podeContinuarEtapa2 ? 'bg-[#3b82f6] hover:bg-blue-700 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══ ETAPA 3 ══ */}
                  {etapa === 3 && (
                    <div key="etapa3" className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 3 de 3</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Como montar seu ciclo?</h2>
                      <p className="text-sm text-slate-400 mb-6">
                        <strong className="text-slate-600">{editalSelecionado?.nome}</strong> · <strong className="text-slate-600">{cargoSelecionado?.nome}</strong> · <strong className="text-blue-600">{horasDiarias}h/dia</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-3 max-w-lg mb-8">
                        {([
                          { key: 'automatico',    icon: <Zap size={16} />,               titulo: 'Automático',    sub: 'Sistema define com base no edital',            tag: 'Recomendado' },
                          { key: 'personalizado', icon: <SlidersHorizontal size={16} />, titulo: 'Personalizado', sub: 'Você escolhe e define o nível de dificuldade', tag: null },
                        ] as const).map(opt => (
                          <button key={opt.key} onClick={() => setModoCiclo(opt.key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${modoCiclo === opt.key ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${modoCiclo === opt.key ? 'bg-blue-100' : 'bg-slate-100'}`}>
                              <span className={modoCiclo === opt.key ? 'text-blue-500' : 'text-slate-400'}>{opt.icon}</span>
                            </div>
                            <p className={`text-sm font-bold mb-0.5 ${modoCiclo === opt.key ? 'text-blue-700' : 'text-slate-700'}`}>{opt.titulo}</p>
                            <p className="text-[10px] text-slate-400 leading-snug mb-1">{opt.sub}</p>
                            {opt.tag && modoCiclo === opt.key && (
                              <span className="text-[8px] font-black text-blue-500 uppercase tracking-wider">{opt.tag}</span>
                            )}
                          </button>
                        ))}
                      </div>

                      {disciplinas.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                          <RefreshCw size={14} className="animate-spin" /> Carregando disciplinas...
                        </div>
                      ) : modoCiclo === 'automatico' ? (
                        <div>
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 max-w-2xl">
                            <Zap size={14} className="text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700">
                              O sistema priorizará disciplinas <strong>específicas do edital</strong> e distribuirá o tempo <strong>proporcionalmente ao peso e dificuldade</strong> de cada uma.
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                            {disciplinas.map(disc => (
                              <div key={disc.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 opacity-60">
                                <div className="flex items-center gap-2">
                                  <Lock size={12} className="text-slate-300 shrink-0" />
                                  <span className="text-sm font-medium text-slate-600">{disc.nome}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {disc.peso && <span className="text-[9px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full">Peso {disc.peso}</span>}
                                  <span className="text-[10px] text-slate-400">{minutosPerDisciplina}min</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">
                              Selecione até <strong className="text-blue-600">{maxDisciplinas} disciplinas</strong>
                            </p>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                              disciplinasSelecionadas.length === maxDisciplinas ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {disciplinasSelecionadas.length} / {maxDisciplinas}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${(disciplinasSelecionadas.length / maxDisciplinas) * 100}%` }} />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {disciplinas.map(disc => {
                              const selecionada = disciplinasSelecionadas.includes(disc.id);
                              const bloqueada   = !selecionada && disciplinasSelecionadas.length >= maxDisciplinas;
                              const dific       = dificuldades[disc.id];
                              const semDific    = selecionada && !dific;

                              return (
                                <div key={disc.id}
                                  onClick={() => !bloqueada && toggleDisciplina(disc.id)}
                                  className={`rounded-xl border-2 transition-all ${
                                    selecionada ? semDific ? 'border-amber-300 bg-amber-50 cursor-pointer' : 'border-blue-400 bg-blue-50 cursor-pointer' :
                                    bloqueada   ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed' :
                                                  'border-slate-200 bg-white hover:border-blue-200 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                                        selecionada ? semDific ? 'bg-amber-400' : 'bg-blue-500' :
                                        bloqueada   ? 'bg-slate-200' : 'border-2 border-slate-300'
                                      }`}>
                                        {selecionada && !semDific && <Check size={9} className="text-white" />}
                                        {selecionada && semDific  && <AlertCircle size={9} className="text-white" />}
                                        {bloqueada   && <Lock size={8} className="text-slate-400" />}
                                      </div>
                                      <span className={`text-sm font-semibold ${
                                        selecionada ? semDific ? 'text-amber-700' : 'text-blue-800' :
                                        bloqueada   ? 'text-slate-400' : 'text-slate-700'
                                      }`}>{disc.nome}</span>
                                    </div>
                                    {disc.peso && <span className="text-[9px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full shrink-0">Peso {disc.peso}</span>}
                                  </div>

                                  {selecionada && (
                                    <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${semDific ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {semDific ? '⚠ Defina seu nível:' : 'Meu nível:'}
                                      </p>
                                      <div className="flex gap-1.5">
                                        {(['Baixo', 'Médio', 'Alto'] as const).map(nivel => (
                                          <button key={nivel}
                                            onClick={e => { e.stopPropagation(); setDificuldades(prev => ({ ...prev, [disc.id]: nivel })); }}
                                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${
                                              dific === nivel
                                                ? nivel === 'Baixo' ? 'bg-emerald-500 border-emerald-500 text-white'
                                                  : nivel === 'Médio' ? 'bg-amber-400 border-amber-400 text-white'
                                                  : 'bg-red-500 border-red-500 text-white'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                          >{nivel}</button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {disciplinasSelecionadas.length === maxDisciplinas && (
                            <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <p className="text-xs text-emerald-700 font-medium">Limite atingido! As demais disciplinas foram bloqueadas.</p>
                            </div>
                          )}

                          {disciplinasSelecionadas.length > 0 && !todasDificuldadesDefinidas && (
                            <div className="flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <AlertCircle size={14} className="text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-700 font-medium">
                                Defina o nível de dificuldade em todas as disciplinas selecionadas para continuar.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preview */}
                      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Confirmação do ciclo</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Edital</span><p className="text-xs font-bold text-slate-700 truncate">{editalSelecionado?.nome}</p></div>
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Cargo</span><p className="text-xs font-bold text-slate-700 truncate">{cargoSelecionado?.nome}</p></div>
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Horas/dia</span><p className="text-xs font-black text-blue-600">{horasDiarias}h</p></div>
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Disciplinas/dia</span><p className="text-xs font-black text-blue-600">{discsPorDia}</p></div>
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Modo</span><p className="text-xs font-black text-slate-700 capitalize">{modoCiclo}</p></div>
                          <div><span className="text-[9px] text-slate-400 uppercase font-bold">Min/disciplina</span><p className="text-xs font-black text-blue-600">{minutosPerDisciplina}min</p></div>
                        </div>
                      </div>

                      {erroSalvar && (
                        <div className="flex items-center gap-2 mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                          <AlertCircle size={14} className="text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-medium">{erroSalvar}</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button onClick={() => irParaEtapa(2)} disabled={salvando} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50">
                          ← Voltar
                        </button>
                        <button
                          onClick={handleFinalizar} disabled={!podeFinalizar || salvando}
                          className={`px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                            podeFinalizar && !salvando ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {salvando
                            ? <><RefreshCw size={15} className="animate-spin" /> Salvando...</>
                            : <><CheckCircle2 size={16} /> Finalizar ciclo</>
                          }
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Painel lateral direito — criação */}
                <div className="hidden lg:flex w-72 shrink-0 flex-col gap-4 sticky top-6">
                  {etapa === 1 && (
                    <>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3">Por que ciclos funcionam?</p>
                        <div className="space-y-3">
                          {[
                            { e: '🧠', t: 'Memória ativa', d: 'Alternar disciplinas evita a fadiga cognitiva e melhora a retenção.' },
                            { e: '🔁', t: 'Revisão natural', d: 'Ao voltar para uma disciplina, o cérebro reconsolida o conteúdo.' },
                            { e: '⏱️', t: 'Sessões ideais', d: 'Blocos de 45–60 min por disciplina maximizam o aprendizado profundo.' },
                          ].map(item => (
                            <div key={item.t} className="flex items-start gap-2">
                              <span className="text-base">{item.e}</span>
                              <p className="text-xs text-slate-600 leading-snug"><strong className="text-slate-800">{item.t}</strong> — {item.d}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3">Seu ciclo estimado</p>
                        {[
                          { l: 'Sessões/turno',    v: discsPorDia },
                          { l: 'Sessões no ciclo', v: maxDisciplinas },
                          { l: 'Min por sessão',   v: '60min' },
                        ].map(row => (
                          <div key={row.l} className="flex justify-between items-center mb-2 last:mb-0">
                            <span className="text-xs text-slate-500">{row.l}</span>
                            <span className="text-sm font-black text-sky-600">{row.v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {etapa === 2 && (
                    <>
                      {!editalSelecionado ? (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                          <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3">Dicas de seleção</p>
                          <div className="space-y-3">
                            {[
                              { e: '🎯', t: 'Estudo ativo', d: 'Escolha o edital que você está ativamente estudando agora.' },
                              { e: '📋', t: 'Cargo = disciplinas', d: 'O cargo define o conjunto de matérias do seu ciclo.' },
                              { e: '🔍', t: 'Busca rápida', d: 'Use o campo de busca para encontrar editais específicos.' },
                            ].map(item => (
                              <div key={item.t} className="flex items-start gap-2">
                                <span className="text-base">{item.e}</span>
                                <p className="text-xs text-slate-600 leading-snug"><strong className="text-slate-800">{item.t}</strong> — {item.d}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                          <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3">Edital selecionado</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              editalSelecionado.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>{editalSelecionado.status}</span>
                            <span className="text-[10px] text-slate-400">{editalSelecionado.data}</span>
                          </div>
                          <p className="text-sm font-black text-slate-800 mb-1">{editalSelecionado.nome}</p>
                          {editalSelecionado.banca && <p className="text-[10px] text-slate-400 font-medium mb-3">{editalSelecionado.banca}</p>}
                          {cargoSelecionado && (
                            <>
                              <div className="border-t border-slate-100 pt-3 mt-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo</p>
                                <p className="text-xs font-bold text-slate-700">{cargoSelecionado.nome}</p>
                              </div>
                              <div className="border-t border-slate-100 pt-3 mt-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Disciplinas disponíveis</p>
                                <p className="text-xl font-black text-sky-600">{cargoSelecionado.disciplinas.length}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Etapa 1 — resumo</p>
                        {[{ l: 'Horas/dia', v: `${horasDiarias}h` }, { l: 'Disciplinas/dia', v: String(discsPorDia) }].map(r => (
                          <div key={r.l} className="flex justify-between items-center mb-1 last:mb-0">
                            <span className="text-xs text-slate-500">{r.l}</span>
                            <span className="text-xs font-black text-slate-700">{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {etapa === 3 && (
                    <>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-4">Resumo do ciclo</p>
                        <div className="space-y-3">
                          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Edital</p><p className="text-xs font-bold text-slate-700 leading-snug">{editalSelecionado?.nome}</p></div>
                          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cargo</p><p className="text-xs font-bold text-slate-700">{cargoSelecionado?.nome}</p></div>
                          <div className="flex gap-3">
                            <div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sessões/turno</p><p className="text-sm font-black text-sky-600">{discsPorDia}</p></div>
                            <div className="flex-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No ciclo</p><p className="text-sm font-black text-sky-600">{maxDisciplinas}</p></div>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Modo</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${modoCiclo === 'automatico' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
                              {modoCiclo === 'automatico' ? 'Automático' : 'Personalizado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {modoCiclo === 'personalizado' && disciplinasSelecionadas.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                          <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-3">Disciplinas no ciclo</p>
                          <div className="space-y-2">
                            {disciplinasSelecionadas.map(id => {
                              const disc = disciplinas.find(d => d.id === id);
                              const dific = dificuldades[id];
                              return disc ? (
                                <div key={id} className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">{disc.nome}</p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {dific ? (
                                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                        dific === 'Baixo' ? 'bg-emerald-100 text-emerald-600' :
                                        dific === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                      }`}>{dific}</span>
                                    ) : (
                                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-500">Pendente</span>
                                    )}
                                    <span className="text-[9px] text-slate-400">{minutosPerDisciplina}min</span>
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                            <span className="text-xs font-black text-sky-600">{horasDiarias}h/dia</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Componentes de suporte ── */

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${active ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
      <div className={`p-1.5 rounded-lg shrink-0 transition-all ${active ? 'bg-sky-100' : 'bg-slate-50 group-hover:bg-white group-hover:text-sky-500'}`}>{icon}</div>
      <span className="text-[13px] truncate">{label}</span>
    </div>
  );
}

function HeaderIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 group shrink-0">
      <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ cor, label, valor }: { cor: 'blue' | 'sky' | 'slate'; label: string; valor: string }) {
  const s = {
    blue:  { wrap: 'bg-blue-50 border-blue-100',   label: 'text-blue-400',  valor: 'text-blue-600' },
    sky:   { wrap: 'bg-sky-50 border-sky-100',     label: 'text-sky-400',   valor: 'text-sky-600' },
    slate: { wrap: 'bg-slate-50 border-slate-200', label: 'text-slate-400', valor: 'text-slate-700' },
  }[cor];
  return (
    <div className={`rounded-xl p-4 text-center border ${s.wrap}`}>
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${s.label}`}>{label}</p>
      <p className={`text-2xl font-black ${s.valor}`}>{valor}</p>
    </div>
  );
}
