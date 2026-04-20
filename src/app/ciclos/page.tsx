'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Search, ChevronDown, ChevronRight, Check,
  Lock, Zap, SlidersHorizontal, Info, CheckCircle2, Menu, AlertCircle,
  Pencil,
} from 'lucide-react';

interface Edital      { id: number; nome: string; banca: string; status: string; data: string; }
interface Disciplina  { id: number; nome: string; tipo: string; peso: number | null; qtd_questoes: number | null; }
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

interface ConcursoApi {
  id: number;
  nome: string;
  banca?: string | null;
  status?: string | null;
  data?: string | null;
}

interface DisciplinaApi {
  id_disciplina?: number;
  id?: number;
  nome: string;
  tipo?: string | null;
  peso?: number | null;
  qtd_questoes?: number | null;
}

interface CargoApi {
  id_cargo?: number;
  id?: number;
  nome: string;
  disciplina?: DisciplinaApi[];
}

interface ConcursoDetalheApi {
  edital?: Array<{
    cargo?: CargoApi[];
  }>;
}

const STEPS = [
  { num: 1, label: 'Carga horária' },
  { num: 2, label: 'Edital e cargo' },
  { num: 3, label: 'Método' },
  { num: 4, label: 'Organização' },
];

const getTipoDisciplinaLabel = (tipo?: string | null) => {
  const normalizado = tipo?.toUpperCase();
  if (normalizado === 'B' || normalizado === 'BASICA' || normalizado === 'BÁSICA') return 'Básica';
  if (normalizado === 'E' || normalizado === 'ESPECIFICA' || normalizado === 'ESPECÍFICA') return 'Específica';
  return null;
};

const getRitmoLabel = (ritmo: 'focado' | 'equilibrado' | 'variado') => ({
  focado: 'Focado',
  equilibrado: 'Equilibrado',
  variado: 'Variado',
})[ritmo];

const getRitmoRecomendado = (horas: number): 'focado' | 'equilibrado' | 'variado' => {
  if (horas <= 3) return 'variado';
  if (horas >= 8) return 'focado';
  return 'equilibrado';
};

export default function CiclosEstudo() {
  const router = useRouter();
  const [mounted, setMounted]             = useState(false);
  const [etapa, setEtapa]                 = useState(1);
  const [direcao, setDirecao]             = useState<'frente' | 'atras'>('frente');
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Estado global da página
  const [estado, setEstado]                       = useState<'loading' | 'visualizacao' | 'criacao'>('loading');
  const [cicloAtivo, setCicloAtivo]               = useState<CicloAtivo | null>(null);
  const [confirmandoEdicao, setConfirmandoEdicao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  // Etapa 1
  const [horasDiarias, setHorasDiarias] = useState(2);
  const [ritmo, setRitmo]               = useState<'focado' | 'equilibrado' | 'variado'>(() => getRitmoRecomendado(2));
  const [ritmoManual, setRitmoManual]   = useState(false);

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
  const [buscaDisciplina, setBuscaDisciplina]                 = useState('');
  const [salvando, setSalvando]                               = useState(false);
  const [erroSalvar, setErroSalvar]                           = useState<string | null>(null);

  const horasDiariasLimitadas = Math.min(horasDiarias, 8);

  // Computed — espelha a lógica do servidor
  const discsPorDia          = useMemo(() => Math.min(horasDiariasLimitadas, 4), [horasDiariasLimitadas]);
  const maxDisciplinas       = useMemo(() => horasDiariasLimitadas * 2,          [horasDiariasLimitadas]);
  const minutosPerDisciplina = 60;
  const disciplinas = useMemo(() => cargoSelecionado?.disciplinas ?? [], [cargoSelecionado]);
  const disciplinasOrdenadas = useMemo(() =>
    [...disciplinas].sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'B' ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    }),
  [disciplinas]);
  const disciplinasPersonalizadasFiltradas = useMemo(
    () => buscaDisciplina
      ? disciplinasOrdenadas.filter(disc => disc.nome.toLowerCase().includes(buscaDisciplina.toLowerCase()))
      : disciplinasOrdenadas,
    [buscaDisciplina, disciplinasOrdenadas]
  );
  const resumoTiposDisciplinas = useMemo(() => {
    const especificas = disciplinas.filter(disc => getTipoDisciplinaLabel(disc.tipo) === 'Específica').length;
    const basicas = disciplinas.length - especificas;
    return { especificas, basicas };
  }, [disciplinas]);
  const resumoTiposSelecionadas = useMemo(() => {
    const selecionadas = disciplinas.filter(disc => disciplinasSelecionadas.includes(disc.id));
    const especificas = selecionadas.filter(disc => getTipoDisciplinaLabel(disc.tipo) === 'Específica').length;
    const basicas = selecionadas.length - especificas;
    return { especificas, basicas };
  }, [disciplinas, disciplinasSelecionadas]);
  const disciplinasAutomatico = useMemo(() => {
    if (disciplinas.length === 0) return { selecionadas: [] as Disciplina[], foraDociclo: [] as Disciplina[] };
    const n       = Math.min(disciplinas.length, Math.max(1, horasDiariasLimitadas * 2));
    const allIs   = disciplinas.map(d => (d.peso ?? 1) * (d.qtd_questoes ?? 0));
    const allImax = Math.max(...allIs, 1);
    // dificFator = 2 (Médio) é constante no automático — não afeta ordenação relativa
    const scoreMap    = new Map(disciplinas.map((d, i) =>
      [d.id, (1 + allIs[i] / allImax) * (d.tipo === 'E' ? 1.5 : 1.0)]));
    const porScore    = (a: Disciplina, b: Disciplina) =>
      (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0);
    const especificas  = disciplinas.filter(d => d.tipo === 'E').sort(porScore);
    const basicas      = disciplinas.filter(d => d.tipo !== 'E').sort(porScore);
    const maxE         = Math.ceil(n * 0.6);
    const selecionadas = [...especificas.slice(0, maxE), ...basicas].slice(0, n);
    const idsNoCiclo   = new Set(selecionadas.map(d => d.id));
    const foraDociclo  = disciplinas.filter(d => !idsNoCiclo.has(d.id));
    return { selecionadas, foraDociclo };
  }, [disciplinas, horasDiariasLimitadas]);
  const disciplinasSelecionadasDetalhadas = useMemo(
    () => disciplinasSelecionadas
      .map(id => disciplinas.find(disc => disc.id === id))
      .filter((disc): disc is Disciplina => Boolean(disc)),
    [disciplinas, disciplinasSelecionadas]
  );
  const dificuldadesPendentesCount = useMemo(
    () => disciplinasSelecionadas.filter(id => !dificuldades[id]).length,
    [disciplinasSelecionadas, dificuldades]
  );
  const disciplinasSelecionadasPreview = useMemo(
    () => disciplinasSelecionadasDetalhadas.slice(0, 5),
    [disciplinasSelecionadasDetalhadas]
  );
  const disciplinasSelecionadasRestantes = Math.max(0, disciplinasSelecionadasDetalhadas.length - disciplinasSelecionadasPreview.length);

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
  }, []);
  useEffect(() => { if (mounted) fetchCicloAtivo(); }, [mounted]);
  useEffect(() => { if (etapa === 2 && editais.length === 0) fetchEditais(); }, [etapa, editais.length]);
  useEffect(() => { if (!ritmoManual) setRitmo(getRitmoRecomendado(horasDiarias)); }, [horasDiarias, ritmoManual]);
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
      const data = await res.json() as ConcursoApi[];
      setEditais(data.map((c) => ({
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
      const data = await res.json() as ConcursoDetalheApi;
      const lista: Cargo[] = data.edital?.[0]?.cargo?.flatMap((c) => {
        const idCargo = c.id_cargo ?? c.id;
        if (!idCargo) return [];

        return [{
          id: idCargo,
          nome: c.nome,
          disciplinas: c.disciplina?.flatMap((d) => {
            const idDisciplina = d.id_disciplina ?? d.id;
            if (!idDisciplina) return [];

            return [{
              id: idDisciplina,
              nome: d.nome,
              tipo: d.tipo ?? 'B',
              peso: d.peso ?? null,
              qtd_questoes: d.qtd_questoes ?? null,
            }];
          }) ?? [],
        }];
      }) ?? [];
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

  const editaisFiltradosBase = useMemo(
    () => busca
      ? editais.filter(e => {
        const termo = busca.toLowerCase();
        return e.nome.toLowerCase().includes(termo) || e.banca.toLowerCase().includes(termo);
      })
      : editais,
    [busca, editais]
  );
  const editaisFiltrados = useMemo(() => editaisFiltradosBase.slice(0, 5), [editaisFiltradosBase]);

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  const handleFinalizar = async () => {
    if (!cargoSelecionado) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
      const payload = {
        horasDiarias: horasDiariasLimitadas,
        idCargo: cargoSelecionado.id,
        modo:    modoCiclo,
        ritmo,
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
      setHorasDiarias(2); setRitmo(getRitmoRecomendado(2)); setRitmoManual(false); setEditalSelecionado(null); setCargoSelecionado(null);
      setModoCiclo('automatico'); setDisciplinasSelecionadas([]); setDificuldades({});
      setEstado('loading');
      await fetchCicloAtivo();
    } catch (err: unknown) {
      setErroSalvar(err instanceof Error ? err.message : 'Erro ao salvar ciclo.');
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
      setHorasDiarias(2); setRitmo(getRitmoRecomendado(2)); setRitmoManual(false); setEditalSelecionado(null); setCargoSelecionado(null);
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
    { icon: <User size={18} />,            label: 'Perfil',            active: false, href: '/dashboard' },
  ];

  if (!mounted) return <div className="min-h-screen w-full bg-slate-50" />;

  /* ═══════════════════════════════════════════════════════ RENDER */
  return (
    <div className="h-screen w-full flex bg-slate-50 text-[#475569] font-sans overflow-hidden">

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
                className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
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
          <div className="flex items-center justify-center py-6 px-4 shrink-0">
            <Image src="/logo_azul.png" alt="Logo" width={160} height={96} className="h-24 w-auto" priority />
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
            <h1 className="text-lg font-bold text-slate-700">Ciclos de Estudo</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />}     label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-linear-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer">
                <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                  <User size={20} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Conteúdo principal ── */}
        <div className="flex justify-center flex-1">
          <div className="flex gap-6 w-full max-w-7xl items-start">

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
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-400">

                  {/* Grade principal */}
                  <div className="grid grid-cols-12 items-start gap-4">

                    {/* ── Cabeçalho ── */}
                    <div className="col-span-12 xl:col-span-8 rounded-lg border border-slate-100 bg-white px-6 py-4 shadow-sm flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0 max-w-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                            Ciclo Ativo
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-black uppercase tracking-wide">
                            {cicloAtivo.totalSlots} sessões
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 truncate">{cicloAtivo.cargoNome}</h2>
                        {(cicloAtivo.concursoNome || cicloAtivo.bancaSigla) && (
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {[cicloAtivo.concursoNome, cicloAtivo.bancaSigla].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                          Acompanhe seu ciclo e siga a próxima sessão sem perder o ritmo.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setConfirmandoEdicao(true)}
                          aria-label="Editar ciclo"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
                        >
                          <Pencil size={13} /> Editar ciclo
                        </button>
                      </div>
                    </div>

                    {/* ── Resumo compacto ── */}
                    <div className="col-span-12 xl:col-span-4 rounded-lg border border-slate-100 bg-white p-3.5 shadow-sm">
                      <div className="mb-2.5 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-700">Resumo do ciclo</p>
                          <p className="text-[11px] font-semibold text-slate-500">Visão geral</p>
                        </div>
                        {cicloAtivo.posicaoAtual / cicloAtivo.totalSlots >= 0.8 && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            Reta final
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sessões</p>
                          <p className="text-base font-black leading-tight text-slate-800">{cicloAtivo.totalSlots}</p>
                          <p className="text-[10px] font-semibold text-slate-500">no ciclo</p>
                        </div>
                        <div className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-2 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-700">Meta de hoje</p>
                          <p className="text-base font-black leading-tight text-sky-700">{cicloAtivo.horasPorDia} sessões</p>
                          <p className="text-[10px] font-semibold text-sky-700">{cicloAtivo.horasPorDia} horas hoje</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)] xl:items-start">
                      <div className="flex min-w-0 flex-col gap-4">

                        {/* ── Sessão atual ── */}
                        <div className="relative overflow-hidden rounded-lg border border-sky-100 bg-linear-to-br from-sky-50 via-white to-white p-5 shadow-sm">
                          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sky-100/70" />
                          {cicloAtivo.hojeSlots[0] && (() => {
                            const s = cicloAtivo.hojeSlots[0];
                            const proximaSessao = cicloAtivo.hojeSlots[1];
                            const tipoLabel = getTipoDisciplinaLabel(s.tipo);
                            const nivelCores: Record<string, string> = { ALTO: 'bg-red-100 text-red-700', MEDIO: 'bg-amber-100 text-amber-700', BAIXO: 'bg-emerald-100 text-emerald-700' };
                            const nivelLabel: Record<string, string> = { ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' };

                            return (
                              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                  <p className="mb-2 text-sm font-black uppercase tracking-wide text-sky-700">Sessão atual</p>
                                  <h3 className="text-2xl font-black leading-tight text-slate-900">{s.nome}</h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
                                    <span>Você está na sessão {cicloAtivo.posicaoAtual} de {cicloAtivo.totalSlots}</span>
                                    <span className="text-slate-300">·</span>
                                    <span>1h</span>
                                    {tipoLabel && (
                                      <>
                                        <span className="text-slate-300">·</span>
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                                          {tipoLabel}
                                        </span>
                                      </>
                                    )}
                                    {s.nivel && (
                                      <>
                                        <span className="text-slate-300">·</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-black uppercase ${nivelCores[s.nivel] ?? 'bg-slate-100 text-slate-600'}`}>
                                          {nivelLabel[s.nivel] ?? s.nivel}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-slate-500">
                                    {proximaSessao
                                      ? `Ao concluir, você avança para a disciplina: ${proximaSessao.nome}.`
                                      : 'Depois desta sessão, o ciclo avança para a próxima disciplina.'}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <button
                                    onClick={() => router.push('/dashboard')}
                                    aria-label="Estudar sessão atual na Minha Mesa"
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-black text-white shadow-md shadow-sky-100 transition-all hover:bg-sky-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                                  >
                                    Estudar na Minha Mesa <ChevronRight size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* ── Plano de hoje ── */}
                        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <div className="mb-1 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-sky-500" />
                                <p className="text-base font-black text-slate-800">Plano de hoje</p>
                              </div>
                              <p className="text-sm text-slate-500">
                                Próximas sessões na ordem recomendada. Cada sessão dura 1h.
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              Hoje: {cicloAtivo.horasPorDia} sessões
                            </span>
                          </div>

                          <div className="space-y-0">
                            {cicloAtivo.hojeSlots.map((s, i) => {
                              const sessao = cicloAtivo.posicaoAtual + i > cicloAtivo.totalSlots
                                ? ((cicloAtivo.posicaoAtual + i - 1) % cicloAtivo.totalSlots) + 1
                                : cicloAtivo.posicaoAtual + i;
                              const atual = i === 0;
                              const etapaLabel = atual ? 'Agora' : i === 1 ? 'Próxima' : 'Depois';

                              return (
                                <div key={i} className="relative flex gap-3 pb-3 last:pb-0">
                                  {i < cicloAtivo.hojeSlots.length - 1 && (
                                    <div className="absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px bg-slate-200" />
                                  )}
                                  <div className={`relative z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black ${atual ? 'bg-sky-500 text-white shadow-sm shadow-sky-100' : 'bg-slate-100 text-slate-500'}`}>
                                    {sessao}
                                  </div>
                                  <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2 transition-colors ${atual ? 'border-sky-200 bg-sky-50 shadow-sm shadow-sky-50 ring-1 ring-sky-100' : 'border-transparent bg-white hover:border-slate-100 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`shrink-0 text-[11px] font-black uppercase tracking-wide ${atual ? 'text-sky-700' : 'text-slate-400'}`}>
                                        {etapaLabel}
                                      </span>
                                      <p className="truncate text-sm font-bold text-slate-700">{s.nome}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                            Use a Minha Mesa para registrar cada sessão concluída.
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col gap-4">
                        {/* ── Distribuição ── */}
                        <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                          {(() => {
                            const disciplinasOrdenadas = [...cicloAtivo.disciplinas].sort((a, b) => b.frequencia - a.frequencia);
                            const gruposDistribuicao = Array.from(new Set(disciplinasOrdenadas.map(d => d.frequencia)))
                              .map(frequencia => ({
                                frequencia,
                                disciplinas: disciplinasOrdenadas.filter(d => d.frequencia === frequencia),
                              }));

                            return (
                              <>
                                <p className="text-base font-black text-slate-800 mb-1">
                                  Distribuição das disciplinas
                                </p>
                                <p className="mb-3 text-xs text-slate-500">
                                  Este ciclo reúne {cicloAtivo.disciplinas.length} {cicloAtivo.disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}, agrupadas por frequência no ciclo.
                                </p>
                                <div className="relative">
                                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                                    {gruposDistribuicao.map(({ frequencia, disciplinas }) => (
                                      <div key={frequencia} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                                        <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                            {frequencia} {frequencia === 1 ? 'sessão' : 'sessões'} no ciclo
                                          </p>
                                          <span className="text-[11px] font-bold text-slate-400">
                                            {disciplinas.length} {disciplinas.length === 1 ? 'disciplina' : 'disciplinas'}
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          {disciplinas.map(d => {
                                            const colorIndex = disciplinasOrdenadas.findIndex(item => item.idDisciplina === d.idDisciplina);
                                            const color = WHEEL_COLORS[colorIndex % WHEEL_COLORS.length];
                                            const eAtual = d.idDisciplina === cicloAtivo.hojeSlots[0]?.idDisciplina;

                                            return (
                                              <div key={d.idDisciplina} className={`rounded-md px-2.5 py-2 transition-colors ${eAtual ? 'bg-sky-50 ring-1 ring-sky-100' : 'bg-white/70 hover:bg-white'}`}>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                  <p className={`flex-1 text-sm font-bold truncate min-w-0 ${eAtual ? 'text-slate-900' : 'text-slate-700'}`}>{d.nome}</p>
                                                  {eAtual && (
                                                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                                                      atual
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {cicloAtivo.disciplinas.length > 8 && (
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white to-white/0" />
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>

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
                                atual     ? 'bg-sky-500 text-white shadow-md shadow-sky-200' :
                                            'bg-slate-100 text-slate-400'
                              }`}>
                                {concluida ? <Check size={14} /> : step.num}
                              </div>
                              <span className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                atual     ? 'text-sky-600' :
                                concluida ? 'text-emerald-600 group-hover:text-emerald-500' : 'text-slate-400'
                              }`}>{step.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-3 self-start mt-4 rounded-full transition-all duration-500 ${
                                etapa > step.num ? 'bg-sky-500' : 'bg-slate-100'
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
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 1 de 4</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Defina sua meta diária de estudo</h2>
                      <p className="text-sm text-slate-400 mb-8">Escolha quantas horas você pretende estudar por dia. O ciclo será montado a partir dessa disponibilidade.</p>

                      <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-stretch">
                        <div className="min-w-0">
                          <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 p-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Meta diária</p>
                            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                              <p className="text-3xl font-black text-sky-700">
                                {horasDiariasLimitadas} {horasDiariasLimitadas === 1 ? 'hora' : 'horas'} por dia
                              </p>
                              <p className="text-sm font-semibold text-sky-700">
                                {horasDiariasLimitadas} {horasDiariasLimitadas === 1 ? 'sessão' : 'sessões'} por dia
                              </p>
                            </div>
                            <p className="mt-3 text-xs font-semibold text-sky-700">
                              Cada sessão é um bloco de estudo de 1h.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-white p-5">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ajuste sua disponibilidade</label>
                              <span className="text-sm font-black text-sky-600">{horasDiariasLimitadas}h</span>
                            </div>
                            <input
                              type="range" min="1" max="8" step="1"
                              value={horasDiariasLimitadas}
                              onChange={e => setHorasDiarias(Math.min(Number(e.target.value), 8))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 mb-1.5"
                            />
                            <div className="mb-4 flex justify-between text-[11px] font-bold text-slate-400">
                              <span>1h</span>
                              <span>8h</span>
                            </div>

                            <p className="mb-2 text-xs font-semibold text-slate-500">
                              Escolha um perfil ou ajuste manualmente.
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
                              {[
                                { h: 1, label: 'Leve' },
                                { h: 2, label: 'Essencial' },
                                { h: 4, label: 'Moderado' },
                                { h: 6, label: 'Intenso' },
                                { h: 8, label: 'Máximo' },
                              ].map(({ h, label }) => (
                                <button key={h} onClick={() => setHorasDiarias(h)}
                                  className={`rounded-xl px-3 py-2 text-left transition-all ${
                                    horasDiariasLimitadas === h
                                      ? h === 8 ? 'bg-amber-500 text-white shadow-sm shadow-amber-100' : 'bg-sky-500 text-white shadow-sm shadow-sky-100'
                                      : 'bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600'
                                  }`}
                                >
                                  <span className="block text-xs font-black">{label}</span>
                                  <span className={`text-lg font-black leading-tight ${horasDiariasLimitadas === h ? 'text-white' : 'text-slate-700'}`}>
                                    {h}h
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="text-sm font-black text-slate-700">Impacto da escolha</p>
                          <p className="mb-3 mt-1 text-xs font-medium text-slate-500">
                            Com essa meta, seu ciclo será calculado para {horasDiariasLimitadas} {horasDiariasLimitadas === 1 ? 'sessão' : 'sessões'} por dia.
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <StatCard cor="sky"   label="Sessões por dia"      valor={String(horasDiariasLimitadas)} />
                            <StatCard cor="sky"   label="Disciplinas no ciclo" valor={`até ${maxDisciplinas}`} />
                          </div>

                          <div className={`mt-4 flex items-start gap-2 rounded-xl bg-white p-3 ${horasDiariasLimitadas === 8 ? 'mb-3' : 'mb-5'}`}>
                            <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs font-medium text-slate-500">
                              Depois, escolha o edital e o cargo para montar a distribuição.
                            </p>
                          </div>

                          {horasDiariasLimitadas === 8 && (
                            <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl p-3 mb-5">
                              <Info size={14} className="text-sky-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-sky-700">
                                8 horas é uma carga alta. Para manter qualidade, distribua o estudo ao longo do dia e faça pausas entre as sessões.
                              </p>
                            </div>
                          )}

                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => irParaEtapa(2)}
                          className="w-full justify-center px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 sm:w-auto"
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══ ETAPA 2 ══ */}
                  {etapa === 2 && (
                    <div key="etapa2" className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 2 de 4</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Escolha seu edital e cargo</h2>
                      <p className="text-sm text-slate-400 mb-6">O cargo define quais disciplinas poderão entrar no ciclo.</p>

                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-start">
                        <div className="min-w-0">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Encontre seu edital</label>
                          <div className="relative mb-4 w-full">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text" placeholder="Digite o nome do edital ou banca..."
                              value={busca} onChange={e => setBusca(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 transition-colors bg-slate-50"
                            />
                            {busca && (
                              <button
                                type="button"
                                onClick={() => setBusca('')}
                                aria-label="Limpar busca"
                                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {loadingEditais ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                              <RefreshCw size={14} className="animate-spin" /> Carregando editais...
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-2">
                                {editaisFiltrados.length === 0
                                  ? <p className="text-sm text-slate-400 italic py-2">Nenhum edital encontrado.</p>
                                  : editaisFiltrados.map(edital => (
                                    <button
                                      key={edital.id}
                                      onClick={() => setEditalSelecionado(editalSelecionado?.id === edital.id ? null : edital)}
                                      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                                        editalSelecionado?.id === edital.id ? 'border-sky-400 bg-sky-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                          editalSelecionado?.id === edital.id ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                                        }`}>
                                          {editalSelecionado?.id === edital.id && <Check size={9} className="text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-bold text-slate-800">{edital.nome}</p>
                                          {edital.banca && <p className="truncate text-xs text-slate-500 font-medium">{edital.banca}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                          edital.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}>{edital.status}</span>
                                        <span className="text-xs text-slate-400 hidden sm:block">{edital.data}</span>
                                      </div>
                                    </button>
                                  ))
                                }
                              </div>
                              {editaisFiltradosBase.length > 5 && editaisFiltrados.length > 0 && (
                                <p className="mt-3 text-xs font-medium text-slate-400">
                                  Mostrando até 5 resultados. Use a busca para refinar.
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="text-base font-black text-slate-800">Agora escolha o cargo</p>
                          <p className="mt-1 text-sm text-slate-500">Depois do edital, selecione o cargo para carregar as disciplinas corretas.</p>

                          <div className="mt-4">
                            {!editalSelecionado ? (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                                <div className="flex gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">1</div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-600">Escolha um edital à esquerda.</p>
                                    <p className="mt-1 text-xs text-slate-400">Depois selecione o cargo aqui.</p>
                                  </div>
                                </div>
                              </div>
                            ) : loadingCargos ? (
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
                                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 outline-none text-sm font-medium text-slate-800 bg-white appearance-none cursor-pointer transition-colors"
                                >
                                  <option value="">Selecione um cargo...</option>
                                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                            )}
                          </div>

                          {editalSelecionado && !cargoSelecionado && (
                            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="text-xs font-black uppercase tracking-wide text-sky-700">Edital selecionado</p>
                              <p className="mt-1 text-sm font-bold text-slate-800">{editalSelecionado.nome}</p>
                              {editalSelecionado.banca && <p className="mt-0.5 text-xs font-medium text-slate-500">{editalSelecionado.banca}</p>}
                            </div>
                          )}

                          {editalSelecionado && cargoSelecionado && (
                            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="mb-3 flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-sky-600" />
                                <p className="text-sm font-black text-sky-700">Edital e cargo selecionados</p>
                              </div>
                              <p className="text-sm font-bold text-slate-800">{cargoSelecionado.nome}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">{editalSelecionado.nome}</p>
                              <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                                <span className="text-xs font-bold text-slate-500">Disciplinas disponíveis</span>
                                <span className="text-sm font-black text-sky-600">{cargoSelecionado.disciplinas.length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                        <button onClick={() => irParaEtapa(1)} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all sm:w-auto">
                          ← Voltar
                        </button>
                        <button
                          onClick={() => irParaEtapa(3)} disabled={!podeContinuarEtapa2}
                          className={`flex w-full items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all sm:w-auto ${
                            podeContinuarEtapa2 ? 'bg-sky-500 hover:bg-sky-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                      {!podeContinuarEtapa2 && (
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          Selecione um edital e um cargo para continuar.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ══ ETAPA 3 ══ */}
                  {etapa === 3 && (
                    <div key="etapa3" className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 3 de 4</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Quanto controle você quer ter?</h2>
                      <p className="text-sm text-slate-500 mb-2">
                        Escolha se o sistema deve montar o ciclo por você ou se prefere selecionar as disciplinas manualmente.
                      </p>
                      <p className="text-sm text-slate-400 mb-6">
                        <strong className="text-slate-600">{editalSelecionado?.nome}</strong> · <strong className="text-slate-600">{cargoSelecionado?.nome}</strong> · <strong className="text-sky-600">{horasDiariasLimitadas}h/dia</strong>
                      </p>

                      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2">
                        {([
                          { key: 'automatico',    icon: <Zap size={16} />,               titulo: 'Automático',    sub: 'Ideal para quem está começando e quer montar o ciclo sem configuração.',                              tag: 'Recomendado' },
                          { key: 'personalizado', icon: <SlidersHorizontal size={16} />, titulo: 'Personalizado', sub: 'Ideal para quem já conhece o edital e quer controlar a prioridade de cada disciplina.', tag: null },
                        ] as const).map(opt => (
                          <button key={opt.key} onClick={() => setModoCiclo(opt.key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${modoCiclo === opt.key ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${modoCiclo === opt.key ? 'bg-sky-100' : 'bg-slate-100'}`}>
                              <span className={modoCiclo === opt.key ? 'text-sky-500' : 'text-slate-400'}>{opt.icon}</span>
                            </div>
                            <p className={`text-sm font-bold mb-0.5 ${modoCiclo === opt.key ? 'text-sky-700' : 'text-slate-700'}`}>{opt.titulo}</p>
                            <p className="text-xs text-slate-500 leading-snug mb-1">{opt.sub}</p>
                            {opt.tag && modoCiclo === opt.key && (
                              <span className="text-[10px] font-black text-sky-500 uppercase tracking-wider">{opt.tag}</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className={`rounded-xl border-2 p-4 mb-6 transition-all ${modoCiclo === 'automatico' ? 'border-sky-100 bg-sky-50' : 'border-violet-100 bg-violet-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {modoCiclo === 'automatico'
                            ? <Zap size={15} className="text-sky-500" />
                            : <SlidersHorizontal size={15} className="text-violet-500" />}
                          <p className={`text-sm font-black ${modoCiclo === 'automatico' ? 'text-sky-700' : 'text-violet-700'}`}>
                            {modoCiclo === 'automatico' ? 'O que o sistema faz por você' : 'O que você controla'}
                          </p>
                        </div>
                        {modoCiclo === 'automatico' ? (
                          <ul className="space-y-2">
                            {[
                              'Seleciona as disciplinas automaticamente com base no edital',
                              'Define dificuldade como Média para todas — sem configuração',
                              'Distribui as sessões priorizando disciplinas mais relevantes',
                              'Bom ponto de partida para quem está começando a estudar para concursos',
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-sky-700">
                                <Check size={12} className="mt-0.5 shrink-0 text-sky-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-2">
                            {[
                              'Você escolhe quais disciplinas entram no ciclo',
                              'Você define a dificuldade de cada disciplina individualmente',
                              'Disciplinas com dificuldade Alta recebem maior frequência no ciclo',
                              'Para quem conhece o edital e sabe exatamente onde precisa focar',
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-violet-700">
                                <Check size={12} className="mt-0.5 shrink-0 text-violet-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button onClick={() => irParaEtapa(2)} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all sm:w-auto">
                          ← Voltar
                        </button>
                        <button
                          onClick={() => irParaEtapa(4)}
                          className="flex w-full items-center justify-center gap-2 px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 sm:w-auto"
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ══ ETAPA 4 ══ */}
                  {etapa === 4 && (
                    <div key="etapa4" className={`relative bg-white rounded-2xl p-8 pb-32 shadow-sm border border-slate-100 lg:pb-8 ${animClass}`}>
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Etapa 4 de 4</p>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Organize as disciplinas do ciclo</h2>
                      <p className="text-sm text-slate-400 mb-6">
                        Escolha como as disciplinas serão distribuídas ao longo do ciclo.
                      </p>

                      {modoCiclo === 'automatico' && (
                        <div className="mb-6">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Como prefere organizar seu dia?</label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {([
                              { value: 'focado',      icon: <Zap size={16} />,          label: 'Focado',      sub: 'Menos disciplinas, mais repetição' },
                              { value: 'equilibrado', icon: <CheckCircle2 size={16} />,  label: 'Equilibrado', sub: 'Mistura entre repetição e variedade' },
                              { value: 'variado',     icon: <RefreshCw size={16} />,     label: 'Variado',     sub: 'Mais disciplinas, maior alternância' },
                            ] as const).map((opt) => {
                              const recomendado = getRitmoRecomendado(horasDiariasLimitadas) === opt.value;
                              return (
                              <button
                                key={opt.value}
                                onClick={() => { setRitmo(opt.value); setRitmoManual(true); }}
                                className={`rounded-xl border-2 p-4 text-left transition-all ${
                                  ritmo === opt.value ? 'border-sky-400 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                              >
                                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${ritmo === opt.value ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {opt.icon}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-black ${ritmo === opt.value ? 'text-sky-700' : 'text-slate-700'}`}>{opt.label}</span>
                                  {recomendado && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600">
                                      Recomendado
                                    </span>
                                  )}
                                </div>
                                <p className={`mt-1 text-xs leading-snug ${ritmo === opt.value ? 'text-sky-600' : 'text-slate-400'}`}>{opt.sub}</p>
                              </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {disciplinas.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                          <RefreshCw size={14} className="animate-spin" /> Carregando disciplinas...
                        </div>
                      ) : modoCiclo === 'automatico' ? (
                        <div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                              <div>
                                <p className="text-sm font-black text-slate-700">
                                  {disciplinasAutomatico.selecionadas.length}{' '}
                                  {disciplinasAutomatico.selecionadas.length === 1 ? 'disciplina entrará' : 'disciplinas entrarão'} no ciclo
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Selecionadas automaticamente com base nas {horasDiariasLimitadas}h/dia
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-600 shrink-0">
                                {getRitmoLabel(ritmo)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {disciplinasAutomatico.selecionadas.map(disc => (
                                <span key={disc.id} className={`rounded-full px-3 py-1 text-xs font-bold ${disc.tipo === 'E' ? 'bg-sky-100 text-sky-700' : 'bg-white text-slate-600'}`}>
                                  {disc.nome}
                                </span>
                              ))}
                            </div>
                            {disciplinasAutomatico.foraDociclo.length > 0 && (
                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <p className="text-xs font-bold text-slate-400 mb-2">
                                  {disciplinasAutomatico.foraDociclo.length}{' '}
                                  {disciplinasAutomatico.foraDociclo.length === 1 ? 'disciplina disponível não entrará' : 'disciplinas disponíveis não entrarão'} no ciclo
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {disciplinasAutomatico.foraDociclo.map(disc => (
                                    <span key={disc.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">
                                      {disc.nome}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-2">
                            <p className="text-xs text-slate-500">
                              Escolha as disciplinas e informe o nível de dificuldade de cada uma.
                            </p>
                          </div>
                          {disciplinasSelecionadas.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                {disciplinasSelecionadas.length} selecionadas
                              </span>
                              {resumoTiposSelecionadas.especificas > 0 && (
                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                  {resumoTiposSelecionadas.especificas} específicas selecionadas
                                </span>
                              )}
                              {resumoTiposSelecionadas.basicas > 0 && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {resumoTiposSelecionadas.basicas} básicas selecionadas
                                </span>
                              )}
                            </div>
                          )}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full transition-all duration-500"
                              style={{ width: `${(disciplinasSelecionadas.length / maxDisciplinas) * 100}%` }} />
                          </div>

                          <div className="relative mb-4">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text"
                              placeholder="Buscar disciplina..."
                              value={buscaDisciplina}
                              onChange={e => setBuscaDisciplina(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:border-sky-400"
                            />
                            {buscaDisciplina && (
                              <button
                                type="button"
                                onClick={() => setBuscaDisciplina('')}
                                aria-label="Limpar busca de disciplina"
                                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {disciplinasSelecionadas.length === 0 && (
                            <div className="flex items-center gap-2 mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <Info size={14} className="text-slate-400 shrink-0" />
                              <p className="text-xs text-slate-500 font-medium">Selecione pelo menos uma disciplina para finalizar.</p>
                            </div>
                          )}

                          {(() => {
                            const grupos = [
                              {
                                titulo: 'Disciplinas específicas do cargo',
                                disciplinas: disciplinasPersonalizadasFiltradas.filter(disc => getTipoDisciplinaLabel(disc.tipo) === 'Específica'),
                              },
                              {
                                titulo: 'Disciplinas básicas/comuns',
                                disciplinas: disciplinasPersonalizadasFiltradas.filter(disc => getTipoDisciplinaLabel(disc.tipo) !== 'Específica'),
                              },
                            ].filter(grupo => grupo.disciplinas.length > 0);

                            const renderDisciplina = (disc: Disciplina) => {
                              const selecionada = disciplinasSelecionadas.includes(disc.id);
                              const bloqueada   = !selecionada && disciplinasSelecionadas.length >= maxDisciplinas;
                              const dific       = dificuldades[disc.id];
                              const semDific    = selecionada && !dific;

                              return (
                                <div key={disc.id}
                                  onClick={() => !bloqueada && toggleDisciplina(disc.id)}
                                  className={`rounded-xl border-2 transition-all ${
                                    selecionada ? semDific ? 'border-amber-300 bg-amber-50 cursor-pointer' : 'border-sky-400 bg-sky-50 cursor-pointer' :
                                    bloqueada   ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed' :
                                                  'border-slate-200 bg-white hover:border-sky-200 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                                        selecionada ? semDific ? 'bg-amber-400' : 'bg-sky-500' :
                                        bloqueada   ? 'bg-slate-200' : 'border-2 border-slate-300'
                                      }`}>
                                        {selecionada && !semDific && <Check size={9} className="text-white" />}
                                        {selecionada && semDific  && <AlertCircle size={9} className="text-white" />}
                                        {bloqueada   && <Lock size={8} className="text-slate-400" />}
                                      </div>
                                      <span className={`text-sm font-semibold ${
                                        selecionada ? semDific ? 'text-amber-700' : 'text-sky-800' :
                                        bloqueada   ? 'text-slate-400' : 'text-slate-700'
                                      }`}>{disc.nome}</span>
                                    </div>
                                    {disc.peso && !selecionada && <span className="text-[11px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full shrink-0">Peso {disc.peso}</span>}
                                  </div>

                                  {selecionada && (
                                    <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${semDific ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {semDific ? 'Agora informe o nível de dificuldade.' : 'Dificuldade desta disciplina'}
                                      </p>
                                      <div className="flex gap-1.5">
                                        {(['Baixo', 'Médio', 'Alto'] as const).map(nivel => (
                                          <button key={nivel}
                                            onClick={e => { e.stopPropagation(); setDificuldades(prev => ({ ...prev, [disc.id]: nivel })); }}
                                            className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase border transition-all ${
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
                            };

                            return (
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-black text-slate-800">Escolha as disciplinas</p>
                                    <p className="mt-1 text-xs text-slate-500">As disciplinas estão separadas por tipo para facilitar sua seleção.</p>
                                  </div>
                                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                                    disciplinasSelecionadas.length === maxDisciplinas ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {disciplinasSelecionadas.length} de {maxDisciplinas} selecionadas
                                  </span>
                                </div>
                                {grupos.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
                                    <p className="text-sm font-bold text-slate-600">
                                      {buscaDisciplina
                                        ? `Nenhuma disciplina encontrada para "${buscaDisciplina}".`
                                        : 'Nenhuma disciplina encontrada.'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">Tente ajustar a busca.</p>
                                  </div>
                                ) : (
                                  grupos.map(grupo => (
                                    <div key={grupo.titulo} className="border-t border-slate-100 pt-4 mt-6 first:mt-0 first:border-t-0 first:pt-0">
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{grupo.titulo}</p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                          {grupo.disciplinas.length} {grupo.disciplinas.length === 1 ? 'disponível' : 'disponíveis'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4 last:pb-0">
                                        {grupo.disciplinas.map(renderDisciplina)}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })()}

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

                          {disciplinasSelecionadas.length > 0 && todasDificuldadesDefinidas && (
                            <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <p className="text-xs text-emerald-700 font-medium">
                                Tudo certo: todas as disciplinas selecionadas têm dificuldade definida.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {modoCiclo === 'personalizado' && (
                        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Como alternar as disciplinas</label>
                          <p className="mb-3 text-xs text-slate-500">Escolha como alternar as disciplinas ao longo das sessões.</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {([
                              { value: 'focado',      icon: <Zap size={16} />, label: 'Focado',      sub: 'Menos disciplinas, mais repetição' },
                              { value: 'equilibrado', icon: <CheckCircle2 size={16} />, label: 'Equilibrado', sub: 'Repetição e variedade', tag: true },
                              { value: 'variado',     icon: <RefreshCw size={16} />, label: 'Variado',     sub: 'Maior alternância' },
                            ] as const).map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => { setRitmo(opt.value); setRitmoManual(true); }}
                                className={`rounded-xl border-2 p-3 text-left transition-all ${
                                  ritmo === opt.value ? 'border-sky-400 bg-sky-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={ritmo === opt.value ? 'text-sky-600' : 'text-slate-400'}>{opt.icon}</span>
                                  <span className={`text-sm font-black ${ritmo === opt.value ? 'text-sky-700' : 'text-slate-700'}`}>{opt.label}</span>
                                  {'tag' in opt && opt.tag && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600">
                                      Recomendado
                                    </span>
                                  )}
                                </div>
                                <p className={`mt-1 text-xs leading-snug ${ritmo === opt.value ? 'text-sky-600' : 'text-slate-400'}`}>{opt.sub}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {erroSalvar && (
                        <div className="flex items-center gap-2 mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                          <AlertCircle size={14} className="text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-medium">{erroSalvar}</p>
                        </div>
                      )}

                      <div className="sticky bottom-0 -mx-8 -mb-32 mt-6 rounded-b-2xl border-t border-slate-100 bg-white/95 px-8 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-700">
                              {modoCiclo === 'personalizado'
                                ? `${disciplinasSelecionadas.length} de ${maxDisciplinas} disciplinas selecionadas`
                                : `${disciplinasOrdenadas.length} disciplinas serão consideradas`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {modoCiclo === 'personalizado' && disciplinasSelecionadas.length > 0 && !todasDificuldadesDefinidas
                                ? 'Defina o nível das disciplinas selecionadas.'
                                : 'Revise as escolhas e finalize para criar seu ciclo.'}
                            </p>
                          </div>
                          <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button onClick={() => irParaEtapa(3)} disabled={salvando} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 sm:w-auto">
                              ← Voltar
                            </button>
                            <button
                              onClick={handleFinalizar} disabled={!podeFinalizar || salvando}
                              className={`flex w-full items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all sm:w-auto ${
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
                      </div>
                    </div>
                  )}

                </div>

                {/* Painel lateral direito — criação */}
                <div className="hidden lg:flex w-72 shrink-0 flex-col gap-4 sticky top-6">
                  {etapa === 1 && (
                    <>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Por que ciclos funcionam?</p>
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
                        <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Seu ciclo estimado</p>
                        {[
                          { l: 'Sessões por dia',      v: discsPorDia },
                          { l: 'Disciplinas no ciclo', v: maxDisciplinas },
                          { l: 'Min por sessão',        v: '60min' },
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
                          <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Dicas de seleção</p>
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
                          <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Edital selecionado</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              editalSelecionado.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>{editalSelecionado.status}</span>
                            <span className="text-xs text-slate-500">{editalSelecionado.data}</span>
                          </div>
                          <p className="text-sm font-black text-slate-800 mb-1">{editalSelecionado.nome}</p>
                          {editalSelecionado.banca && <p className="text-xs text-slate-500 font-medium mb-3">{editalSelecionado.banca}</p>}
                          {cargoSelecionado && (
                            <>
                              <div className="border-t border-slate-100 pt-3 mt-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo</p>
                                <p className="text-xs font-bold text-slate-700">{cargoSelecionado.nome}</p>
                              </div>
                              <div className="border-t border-slate-100 pt-3 mt-3">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Disciplinas disponíveis</p>
                                <p className="text-xl font-black text-sky-600">{cargoSelecionado.disciplinas.length}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Etapa 1 — resumo</p>
                        {[{ l: 'Horas/dia', v: `${horasDiariasLimitadas}h` }, { l: 'Disciplinas/dia', v: String(discsPorDia) }].map(r => (
                          <div key={r.l} className="flex justify-between items-center mb-1 last:mb-0">
                            <span className="text-xs text-slate-500">{r.l}</span>
                            <span className="text-xs font-black text-slate-700">{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(etapa === 3 || etapa === 4) && (
                    <>
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-4">Resumo do ciclo</p>
                        <div className="space-y-3">
                          <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Edital</p><p className="text-xs font-bold text-slate-700 leading-snug">{editalSelecionado?.nome}</p></div>
                          <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cargo</p><p className="text-xs font-bold text-slate-700">{cargoSelecionado?.nome}</p></div>
                          <div className="flex gap-3">
                            <div className="flex-1"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sessões por dia</p><p className="text-sm font-black text-sky-600">{discsPorDia}</p></div>
                            <div className="flex-1"><p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Disciplinas no ciclo</p><p className="text-sm font-black text-sky-600">{maxDisciplinas}</p></div>
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Modo</p>
                            <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${modoCiclo === 'automatico' ? 'bg-sky-100 text-sky-600' : 'bg-violet-100 text-violet-600'}`}>
                              {modoCiclo === 'automatico' ? 'Automático' : 'Personalizado'}
                            </span>
                          </div>
                          {etapa === 4 && (
                            <div>
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Organização</p>
                              <span className="text-xs font-black text-slate-700 capitalize">{ritmo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {etapa === 4 && (
                        <div className={`rounded-2xl p-4 shadow-sm border transition-colors ${
                          podeFinalizar
                            ? 'border-emerald-100 bg-emerald-50/60'
                            : 'border-amber-100 bg-amber-50/60'
                        }`}>
                          <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                            podeFinalizar ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {podeFinalizar
                              ? 'Tudo pronto para criar o ciclo'
                              : disciplinasSelecionadas.length === 0
                                ? 'Selecione disciplinas para continuar'
                                : 'Falta definir níveis'}
                          </p>
                          <p className="text-xs text-slate-500 leading-snug mb-4">
                            {modoCiclo === 'personalizado' && dificuldadesPendentesCount > 0
                              ? `${dificuldadesPendentesCount} ${dificuldadesPendentesCount === 1 ? 'disciplina ainda está sem nível definido.' : 'disciplinas ainda estão sem nível definido.'}`
                              : 'Revise o resumo acima e crie seu ciclo quando estiver tudo certo.'}
                          </p>
                          <div className="space-y-2">
                            <button
                              onClick={handleFinalizar}
                              disabled={!podeFinalizar || salvando}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-md transition-all ${
                                podeFinalizar && !salvando
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98]'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                              }`}
                            >
                              {salvando
                                ? <><RefreshCw size={15} className="animate-spin" /> Salvando...</>
                                : <><CheckCircle2 size={16} /> Finalizar ciclo</>
                              }
                            </button>
                            <button
                              onClick={() => irParaEtapa(3)}
                              disabled={salvando}
                              className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                            >
                              ← Voltar
                            </button>
                          </div>
                        </div>
                      )}

                      {modoCiclo === 'personalizado' && disciplinasSelecionadas.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                          <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Disciplinas no ciclo</p>
                          <div className="space-y-2">
                            {disciplinasSelecionadasPreview.map(disc => {
                              const dific = dificuldades[disc.id];
                              return (
                                <div key={disc.id} className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">{disc.nome}</p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {dific ? (
                                      <span className={`text-xs font-black uppercase px-1.5 py-0.5 rounded-full ${
                                        dific === 'Baixo' ? 'bg-emerald-100 text-emerald-600' :
                                        dific === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                      }`}>{dific}</span>
                                    ) : (
                                      <span className="text-xs font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-500">Pendente</span>
                                    )}
                                    <span className="text-[11px] text-slate-400">{minutosPerDisciplina}min</span>
                                  </div>
                                </div>
                              );
                            })}
                            {disciplinasSelecionadasRestantes > 0 && (
                              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                                + {disciplinasSelecionadasRestantes} {disciplinasSelecionadasRestantes === 1 ? 'disciplina selecionada' : 'disciplinas selecionadas'}
                              </div>
                            )}
                          </div>
                          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase">Total</span>
                            <span className="text-xs font-black text-sky-600">{horasDiariasLimitadas}h/dia</span>
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

/* ── Paleta e roda do ciclo ── */

const WHEEL_COLORS = ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#f43f5e','#06b6d4','#f97316','#84cc16','#6366f1','#ec4899'];

/* ── Componentes de suporte ── */

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 ${active ? 'text-sky-600 bg-sky-50 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <div className={`shrink-0 transition-all ${active ? 'p-1.5 rounded-lg bg-sky-100' : 'group-hover:text-sky-500'}`}>{icon}</div>
      <span className="text-[13px] truncate">{label}</span>
    </button>
  );
}

function HeaderIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex flex-col items-center gap-0.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 rounded-md">
      <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ cor, label, valor }: { cor: 'sky' | 'slate'; label: string; valor: string }) {
  const s = {
    sky:   { wrap: 'bg-sky-50 border-sky-100',     label: 'text-sky-400',   valor: 'text-sky-600' },
    slate: { wrap: 'bg-slate-50 border-slate-200', label: 'text-slate-400', valor: 'text-slate-700' },
  }[cor];
  return (
    <div className={`rounded-xl p-4 text-center border ${s.wrap}`}>
      <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${s.label}`}>{label}</p>
      <p className={`text-2xl font-black ${s.valor}`}>{valor}</p>
    </div>
  );
}
