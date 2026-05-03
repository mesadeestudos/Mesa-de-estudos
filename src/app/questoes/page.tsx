'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  BarChart3, BookOpen, CheckCircle2, ClipboardCheck,
  LayoutDashboard, LineChart, LogOut, Menu, RefreshCw, Settings,
  Target, User, XCircle, Calendar, CalendarDays,
} from 'lucide-react';

interface DisciplinaCiclo {
  idDisciplina: number;
  nome: string;
}

interface QuestoesData {
  configuracaoPendente?: boolean;
  disciplinas: Array<{
    idDisciplina: number;
    disciplina: string;
    total: number;
    acertos: number;
    erros: number;
    percentual: number;
    sessoes: number;
  }>;
  topicos: Array<{
    idTopico: number | null;
    topico: string;
    disciplina: string;
    total: number;
    acertos: number;
    erros: number;
    percentual: number;
  }>;
  recentes: Array<{
    id: number;
    disciplina: string;
    topico: string;
    total: number;
    acertos: number;
    erros: number;
    percentual: number;
    dataRegistro: string;
  }>;
}

export default function QuestoesPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [dados, setDados] = useState<QuestoesData | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaCiclo[]>([]);
  const [idDisciplina, setIdDisciplina] = useState('');
  const [total, setTotal] = useState(10);
  const [acertos, setAcertos] = useState(0);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [questoesRes, cicloRes] = await Promise.all([
        fetch('/api/questoes'),
        fetch('/api/ciclos'),
      ]);
      const questoesData = await questoesRes.json();
      if (!questoesRes.ok) throw new Error(questoesData.message || 'Não foi possível carregar questões.');
      setDados(questoesData);

      if (cicloRes.ok) {
        const ciclo = await cicloRes.json();
        const mapa = new Map<number, DisciplinaCiclo>();
        for (const slot of ciclo?.cicloSlots ?? []) {
          mapa.set(slot.idDisciplina, { idDisciplina: slot.idDisciplina, nome: slot.nome });
        }
        const lista = [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
        setDisciplinas(lista);
        if (!idDisciplina && lista[0]) setIdDisciplina(String(lista[0].idDisciplina));
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar questões.');
    } finally {
      setCarregando(false);
    }
  }, [idDisciplina]);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = useMemo(() => {
    const lista = dados?.disciplinas ?? [];
    const totalQuestoes = lista.reduce((soma, item) => soma + item.total, 0);
    const totalAcertos = lista.reduce((soma, item) => soma + item.acertos, 0);
    const erros = Math.max(0, totalQuestoes - totalAcertos);
    const percentual = totalQuestoes > 0 ? Number(((totalAcertos / totalQuestoes) * 100).toFixed(1)) : 0;
    return { totalQuestoes, totalAcertos, erros, percentual };
  }, [dados]);

  const disciplinaCritica = dados?.disciplinas[0] ?? null;
  const topicosCriticos = dados?.topicos.filter(item => item.percentual < 70).slice(0, 6) ?? [];

  const registrar = async () => {
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const res = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idDisciplina: Number(idDisciplina),
          total,
          acertos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível registrar as questões.');
      setSucesso(`Bateria registrada com ${data.percentual}% de aproveitamento.`);
      setAcertos(0);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar as questões.');
    } finally {
      setSalvando(false);
    }
  };

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_42%,#ecfdf5_100%)] text-slate-600">
      <div className="relative flex h-full overflow-hidden">
        {sidebarAberta && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="min-h-0 grow overflow-y-auto px-3">
            <div className="px-1 pb-4 pt-5"><div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20"><img src="/logo_azul.png" alt="Logo" className="mx-auto h-20 w-auto" /></div></div>
            <nav className="space-y-1">
              <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" onClick={() => router.push('/dashboard')} />
              <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" onClick={() => router.push('/minha-mesa')} />
              <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" onClick={() => router.push('/ciclos')} />
              <MenuItem icon={<ClipboardCheck size={18} />} label="Questões" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<CalendarDays size={18} />} label="Agenda" onClick={() => router.push('/agenda')} />
              <MenuItem icon={<LineChart size={18} />} label="Desempenho" onClick={() => router.push('/desempenho')} />
              <MenuItem icon={<Calendar size={18} />} label="Revisões" onClick={() => router.push('/revisoes')} />
              <MenuItem icon={<Settings size={18} />} label="Configurações" onClick={() => router.push('/configuracoes')} />
              <MenuItem icon={<User size={18} />} label="Perfil" onClick={() => router.push('/perfil')} />
            </nav>
          </div>
          <div className="p-4"><button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200"><div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20"><LogOut size={18} /></div>Sair</button></div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setSidebarAberta(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
              <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Prática inteligente</p><h1 className="truncate text-lg font-black text-slate-800">Questões</h1></div>
            </div>
          </header>

          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Carregando suas questões..." />
          ) : (
            <div className="grid grid-cols-12 gap-5 pb-8">
              <Metric icon={<Target size={20} />} label="Questões feitas" value={String(resumo.totalQuestoes)} />
              <Metric icon={<CheckCircle2 size={20} />} label="Acertos" value={String(resumo.totalAcertos)} />
              <Metric icon={<XCircle size={20} />} label="Erros" value={String(resumo.erros)} />
              <Metric icon={<BarChart3 size={20} />} label="Aproveitamento" value={`${resumo.percentual}%`} />

              {dados?.configuracaoPendente && (
                <section className="col-span-12 rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-xl shadow-amber-100/50">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">Configuração pendente</p>
                      <h2 className="mt-1 text-lg font-black text-slate-800">A tabela de questões ainda não existe no banco.</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Depois de criar a tabela, esta tela registra acertos, erros, histórico e diagnósticos automaticamente.</p>
                    </div>
                    <button onClick={() => router.push('/desempenho')} className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-amber-700 shadow-sm transition-all hover:bg-amber-100">
                      Ver desempenho
                    </button>
                  </div>
                </section>
              )}

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Registrar bateria</p>
                <h2 className="mt-1 text-xl font-black">Como foi sua prática?</h2>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Disciplina</span>
                    <select value={idDisciplina} onChange={e => setIdDisciplina(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none">
                      {disciplinas.length === 0 ? <option value="">Crie um ciclo primeiro</option> : disciplinas.map(item => (
                        <option key={item.idDisciplina} value={item.idDisciplina} className="text-slate-900">{item.nome}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Total" value={total} onChange={setTotal} min={1} />
                    <NumberField label="Acertos" value={acertos} onChange={setAcertos} min={0} max={total} />
                  </div>
                  <button onClick={registrar} disabled={salvando || !idDisciplina || acertos > total || dados?.configuracaoPendente} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition-all hover:bg-emerald-300 disabled:opacity-60">
                    {salvando ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Registrar questões
                  </button>
                  {erro && <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{erro}</p>}
                  {sucesso && <p className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-bold text-emerald-100">{sucesso}</p>}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Diagnóstico automático</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">
                  {disciplinaCritica ? `Priorize ${disciplinaCritica.disciplina}` : 'Registre questões para gerar diagnóstico'}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {disciplinaCritica
                    ? `Aproveitamento atual de ${disciplinaCritica.percentual}% com ${disciplinaCritica.erros} erros registrados.`
                    : 'O assistente usará seus acertos e erros para ajustar recomendações.'}
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {(dados?.disciplinas ?? []).map(item => (
                    <ProgressCard key={item.idDisciplina} title={item.disciplina} detail={`${item.acertos}/${item.total} acertos · ${item.sessoes} baterias`} value={item.percentual} />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Pontos fracos</p>
                <div className="mt-5 space-y-3">
                  {topicosCriticos.length === 0 ? <p className="text-sm font-semibold text-slate-500">Os tópicos com maior erro aparecerão aqui.</p> : topicosCriticos.map(item => (
                    <ProgressCard key={`${item.idTopico}-${item.disciplina}`} title={item.disciplina} detail={item.topico} value={item.percentual} compact />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Histórico recente</p>
                <div className="mt-5 space-y-3">
                  {(dados?.recentes ?? []).length === 0 ? <p className="text-sm font-semibold text-slate-500">Suas baterias recentes aparecerão aqui.</p> : dados?.recentes.map(item => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">{item.disciplina}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{item.acertos}/{item.total} acertos · {new Date(item.dataRegistro).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className={`text-sm font-black ${item.percentual < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{item.percentual}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${active ? 'bg-white/16 font-bold text-white ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className={active ? 'rounded-xl bg-sky-400 p-1.5 text-white' : 'text-slate-400 group-hover:text-sky-200'}>{icon}</span><span className="truncate text-[13px]">{label}</span></button>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="col-span-6 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-3"><div className="text-sky-500">{icon}</div><p className="mt-3 text-2xl font-black text-slate-800">{value}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p></div>;
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max?: number }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span><input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none" /></label>;
}

function ProgressCard({ title, detail, value, compact = false }: { title: string; detail: string; value: number; compact?: boolean }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{title}</p><p className={`${compact ? 'line-clamp-2' : 'truncate'} text-xs font-semibold text-slate-500`}>{detail}</p></div><span className={`text-sm font-black ${value < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-400" style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/75 text-center shadow-xl shadow-slate-200/60 backdrop-blur-xl"><div className="text-sky-500">{icon}</div><p className="text-sm font-black text-slate-500">{title}</p></div>;
}
