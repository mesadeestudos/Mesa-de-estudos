'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Menu, CheckCircle2, Clock, Target,
  ChevronRight, AlertCircle, Play, Pause, ClipboardCheck, CalendarDays, Lightbulb,
} from 'lucide-react';

interface HojeSlot {
  ordem: number;
  idDisciplina: number;
  nome: string;
  tipo: string;
  categoria: string;
  nivel: string | null;
  minutosAlocados: number;
}

interface CicloAtivo {
  idCiclo: number;
  horasPorDia: number;
  cargoNome: string;
  concursoNome: string;
  bancaSigla: string;
  posicaoAtual: number;
  totalSlots: number;
  hojeSlots: HojeSlot[];
  cicloSlots: HojeSlot[];
}

interface AssistenteEstudo {
  tipo: string;
  titulo: string;
  mensagem: string;
  destino: string;
  prioridadeScore?: number;
  explicacao?: {
    principal: string;
    sinaisUsados: string[];
    alternativas: string[];
    consequencia: string;
  };
  sinais: {
    revisoesPendentes: number;
    revisoesAtrasadas: number;
    precisaRebalancear?: boolean;
  };
  recomendacoes: string[];
}

const getTipoDisciplinaLabel = (tipo?: string | null) => {
  const normalizado = tipo?.toUpperCase();
  if (normalizado === 'B' || normalizado === 'BASICA' || normalizado === 'BÁSICA') return 'Básica';
  if (normalizado === 'E' || normalizado === 'ESPECIFICA' || normalizado === 'ESPECÍFICA') return 'Específica';
  return 'Disciplina';
};

const formatarTempo = (segundos: number) => {
  const seguro = Math.max(0, segundos);
  const horas = Math.floor(seguro / 3600);
  const minutos = Math.floor((seguro % 3600) / 60);
  const segs = seguro % 60;
  if (horas > 0) {
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
  }
  return `${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
};

export default function MinhaMesaPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [ciclo, setCiclo] = useState<CicloAtivo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [concluindo, setConcluindo] = useState(false);
  const [acaoSecundaria, setAcaoSecundaria] = useState<'pular' | 'remarcar' | null>(null);
  const [erro, setErro] = useState('');
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(60 * 60);
  const [metaDia, setMetaDia] = useState({
    sessoesConcluidas: 0,
    revisoesPendentes: 0,
    revisoesAtrasadas: 0,
  });
  const [assistente, setAssistente] = useState<AssistenteEstudo | null>(null);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  };

  const carregarCiclo = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/ciclos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível carregar sua mesa.');
      setCiclo(data);
      const [desempenho, revisoes, assistenteData] = await Promise.all([
        fetch('/api/desempenho').then(r => r.ok ? r.json() : null),
        fetch('/api/revisoes').then(r => r.ok ? r.json() : null),
        fetch('/api/assistente').then(r => r.ok ? r.json() : null),
      ]);
      setAssistente(assistenteData);
      const hoje = new Date().toISOString().slice(0, 10);
      setMetaDia({
        sessoesConcluidas: desempenho?.recentes?.filter((sessao: { inicio: string; status: string }) =>
          sessao.status === 'CONCLUIDA' && sessao.inicio.slice(0, 10) === hoje,
        ).length ?? 0,
        revisoesPendentes: revisoes?.resumo?.pendentes ?? 0,
        revisoesAtrasadas: revisoes?.resumo?.atrasadas ?? 0,
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar sua mesa.');
      setCiclo(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    carregarCiclo();
  }, [carregarCiclo]);

  const sessaoAtual = ciclo?.hojeSlots[0] ?? null;
  const proximaSessao = ciclo?.hojeSlots[1] ?? null;
  const progresso = ciclo ? Math.round((ciclo.posicaoAtual / ciclo.totalSlots) * 100) : 0;
  const planoHoje = useMemo(() => ciclo?.hojeSlots ?? [], [ciclo]);
  const totalSegundosSessao = Math.max(60, (sessaoAtual?.minutosAlocados || 60) * 60);
  const segundosEstudados = Math.max(0, totalSegundosSessao - segundosRestantes);
  const progressoCronometro = Math.min(100, Math.round((segundosEstudados / totalSegundosSessao) * 100));
  const chaveSessaoAtual = sessaoAtual ? `${ciclo?.idCiclo}-${ciclo?.posicaoAtual}-${sessaoAtual.idDisciplina}` : '';

  const executarAcaoCiclo = useCallback(async (acao?: 'pular' | 'remarcar') => {
    setCronometroAtivo(false);
    if (acao) setAcaoSecundaria(acao);
    else setConcluindo(true);
    setErro('');
    try {
      const res = await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: acao ? { 'Content-Type': 'application/json' } : undefined,
        body: acao ? JSON.stringify({ acao }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível avançar o ciclo.');
      await carregarCiclo();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível avançar o ciclo.');
    } finally {
      setConcluindo(false);
      setAcaoSecundaria(null);
    }
  }, [carregarCiclo]);

  const concluirSessao = useCallback(() => executarAcaoCiclo(), [executarAcaoCiclo]);

  useEffect(() => {
    setCronometroAtivo(false);
    setSegundosRestantes(totalSegundosSessao);
  }, [chaveSessaoAtual, totalSegundosSessao]);

  useEffect(() => {
    if (!cronometroAtivo || concluindo) return;

    if (segundosRestantes <= 0) {
      concluirSessao();
      return;
    }

    const timer = window.setTimeout(() => {
      setSegundosRestantes((atual) => Math.max(0, atual - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cronometroAtivo, concluindo, segundosRestantes, concluirSessao]);

  if (!mounted) return <div className="min-h-screen w-full bg-slate-50" />;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#475569] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      <div className="relative flex h-full w-full overflow-hidden">
        {sidebarAberta && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="no-scrollbar flex min-h-0 grow flex-col items-center overflow-y-auto">
            <div className="w-full shrink-0 px-4 pb-3 pt-4">
              <div className="rounded-[20px] border border-white/10 bg-white/95 px-4 py-2.5 shadow-xl shadow-sky-950/20">
                <img src="/logo_azul.png" alt="Logo" className="mx-auto h-16 w-auto" />
              </div>
            </div>
            <nav className="w-full space-y-0.5 px-3">
              <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" active={false} onClick={() => router.push('/dashboard')} />
              <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" active={false} onClick={() => router.push('/ciclos')} />
              <MenuItem icon={<ClipboardCheck size={18} />} label="Questões" active={false} onClick={() => router.push('/questoes')} />
              <MenuItem icon={<CalendarDays size={18} />} label="Agenda" active={false} onClick={() => router.push('/agenda')} />
              <MenuItem icon={<LineChart size={18} />} label="Desempenho" active={false} onClick={() => router.push('/desempenho')} />
              <MenuItem icon={<Calendar size={18} />} label="Revisões" active={false} onClick={() => router.push('/revisoes')} />
              <MenuItem icon={<Lightbulb size={18} />} label="Sugestões" active={false} onClick={() => router.push('/sugestoes')} />
              <MenuItem icon={<Settings size={18} />} label="Configurações" active={false} onClick={() => router.push('/configuracoes')} />
              <MenuItem icon={<User size={18} />} label="Perfil" active={false} onClick={() => router.push('/perfil')} />
            </nav>
          </div>
          <div className="shrink-0 p-4">
            <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200">
              <div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20"><LogOut size={18} /></div>
              <span>Sair</span>
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6">
          <header className="mb-6 flex shrink-0 items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarAberta(true)} className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden">
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Execução do estudo</p>
                <h1 className="truncate text-lg font-black text-slate-800">Minha Mesa</h1>
              </div>
            </div>
            <div className="flex gap-4 border-r border-slate-200 pr-6">
              <HeaderIcon icon={<Bell size={18} />} label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" />
            </div>
          </header>

          {carregando ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-sky-500" size={26} />
                <p className="text-sm font-bold text-slate-400">Carregando sua mesa...</p>
              </div>
            </div>
          ) : !ciclo || !sessaoAtual ? (
            <div className="rounded-[32px] border border-white/70 bg-white/78 p-8 text-center shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
              <AlertCircle className="mx-auto mb-4 text-sky-500" size={34} />
              <h2 className="text-xl font-black text-slate-800">Você ainda não tem um ciclo ativo.</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Crie um ciclo para liberar sua mesa de estudo.</p>
              <button onClick={() => router.push('/ciclos')} className="mt-6 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:bg-sky-600">
                Criar ciclo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-5 pb-8">
              {assistente && (
                <section className="col-span-12 rounded-[28px] border border-emerald-100 bg-white/85 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Assistente de estudo</p>
                      <h2 className="mt-1 truncate text-lg font-black text-slate-800">{assistente.titulo}</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{assistente.mensagem}</p>
                      {assistente.explicacao && (
                        <div className="mt-3 grid gap-2 lg:grid-cols-2">
                          <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-slate-700">
                            {assistente.explicacao.principal}
                          </p>
                          <p className="rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs font-bold text-slate-700">
                            {assistente.explicacao.consequencia}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {assistente.tipo}{assistente.prioridadeScore ? ` · ${assistente.prioridadeScore}` : ''}
                      </span>
                      <button onClick={() => router.push(assistente.destino)} className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600">
                        Fazer agora <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className="col-span-12 overflow-hidden rounded-[28px] border border-white/70 bg-linear-to-br from-slate-950 via-sky-950 to-sky-700 p-5 text-white shadow-2xl shadow-sky-200/50 lg:col-span-8">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Sessão em andamento</p>
                    <h2 className="mt-2 truncate text-2xl font-black leading-tight">{sessaoAtual.nome}</h2>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge>{getTipoDisciplinaLabel(sessaoAtual.tipo)}</Badge>
                  <Badge>{sessaoAtual.minutosAlocados || 60} min</Badge>
                  <Badge>Sessão {ciclo.posicaoAtual} de {ciclo.totalSlots}</Badge>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-bold text-sky-100/80">
                    <span>Progresso no ciclo</span>
                    <span>{progresso}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-linear-to-r from-emerald-300 to-sky-300 transition-all" style={{ width: `${progresso}%` }} />
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-white/15 bg-white/10 p-3 shadow-lg shadow-slate-950/10 backdrop-blur">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-100/70">Cronômetro da disciplina</p>
                      <div className="mt-1 flex flex-wrap items-end gap-3">
                        <p className="text-3xl font-black tabular-nums text-white">{formatarTempo(segundosRestantes)}</p>
                        <p className="pb-1 text-xs font-bold text-sky-100/75">
                          estudado: {formatarTempo(segundosEstudados)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCronometroAtivo((ativo) => !ativo)}
                      disabled={concluindo || segundosRestantes <= 0}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-sky-800 shadow-lg transition-all hover:bg-sky-50 disabled:opacity-60"
                    >
                      {cronometroAtivo ? <Pause size={16} /> : <Play size={16} />}
                      {cronometroAtivo ? 'Pausar cronômetro' : segundosEstudados > 0 ? 'Continuar cronômetro' : 'Iniciar cronômetro'}
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-300 to-cyan-200 transition-all"
                        style={{ width: `${progressoCronometro}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-sky-100/70">
                      Ao atingir o tempo previsto, a sessão será concluída automaticamente.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={concluirSessao}
                    disabled={concluindo || Boolean(acaoSecundaria)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg transition-all hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {concluindo ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {concluindo ? 'Concluindo...' : 'Concluir sessão'}
                  </button>
                  <button
                    onClick={() => executarAcaoCiclo('pular')}
                    disabled={concluindo || Boolean(acaoSecundaria)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-black text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-60"
                  >
                    {acaoSecundaria === 'pular' ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                    {acaoSecundaria === 'pular' ? 'Pulando...' : 'Pular'}
                  </button>
                  <button
                    onClick={() => executarAcaoCiclo('remarcar')}
                    disabled={concluindo || Boolean(acaoSecundaria)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-black text-sky-700 transition-all hover:bg-sky-50 disabled:opacity-60"
                  >
                    {acaoSecundaria === 'remarcar' ? <RefreshCw size={16} className="animate-spin" /> : <Calendar size={16} />}
                    {acaoSecundaria === 'remarcar' ? 'Remarcando...' : 'Remarcar'}
                  </button>
                  <button onClick={() => router.push('/ciclos')} className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-sky-700 transition-all hover:bg-sky-50">
                    Ver ciclo <ChevronRight size={16} />
                  </button>
                </div>
                {erro && <p className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{erro}</p>}
              </section>

              <aside className="col-span-12 rounded-[28px] border border-white/70 bg-white/78 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Resumo do fluxo</p>
                <h3 className="mt-2 truncate text-lg font-black text-slate-800">
                  {proximaSessao?.nome ?? ciclo.cicloSlots[0]?.nome ?? 'Volta para o início do ciclo'}
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {proximaSessao
                    ? `${getTipoDisciplinaLabel(proximaSessao.tipo)} · ${proximaSessao.minutosAlocados || 60} min`
                    : 'Próxima volta do ciclo'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <MiniStat icon={<Clock size={16} />} label="Tempo estudado" value={formatarTempo(segundosEstudados)} />
                  <MiniStat icon={<Target size={16} />} label="Meta hoje" value={`${ciclo.horasPorDia}h`} />
                  <MiniStat icon={<CheckCircle2 size={16} />} label="Concluídas" value={`${metaDia.sessoesConcluidas}/${ciclo.horasPorDia}`} />
                  <MiniStat icon={<Calendar size={16} />} label="Revisões" value={String(metaDia.revisoesPendentes)} />
                  <MiniStat icon={<RefreshCw size={16} />} label="Posição" value={`${ciclo.posicaoAtual}/${ciclo.totalSlots}`} />
                  <MiniStat icon={<BookOpen size={16} />} label="Sessões no ciclo" value={String(ciclo.totalSlots)} />
                </div>

                <div className={`mt-4 rounded-[20px] border px-3 py-2.5 ${metaDia.revisoesAtrasadas > 0 ? 'border-amber-100 bg-amber-50/80' : 'border-sky-100 bg-sky-50/70'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${metaDia.revisoesAtrasadas > 0 ? 'text-amber-700' : 'text-sky-700'}`}>Prioridade</span>
                    <span className="text-xs font-black text-slate-700">
                      {metaDia.revisoesAtrasadas > 0 ? `${metaDia.revisoesAtrasadas} revisão atrasada` : 'Executar sessão atual'}
                    </span>
                  </div>
                </div>
              </aside>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/78 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Plano de hoje</p>
                    <h3 className="mt-1 text-lg font-black text-slate-800">Sessões da sua mesa</h3>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">{planoHoje.length} sessões</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {planoHoje.map((slot, index) => (
                    <div key={`${slot.idDisciplina}-${index}`} className={`rounded-2xl border p-4 ${index === 0 ? 'border-sky-200 bg-sky-50/70' : 'border-slate-100 bg-white/70'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${index === 0 ? 'text-sky-700' : 'text-slate-400'}`}>
                        {index === 0 ? 'Agora' : index === 1 ? 'Próxima' : 'Depois'}
                      </p>
                      <p className="mt-2 truncate text-sm font-black text-slate-800">{slot.nome}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{getTipoDisciplinaLabel(slot.tipo)} · {slot.minutosAlocados || 60} min</p>
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

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all ${active ? 'bg-white/16 font-bold text-white shadow-sm ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
      <div className={`shrink-0 transition-all ${active ? 'rounded-xl bg-sky-400 p-1.5 text-white' : 'text-slate-400 group-hover:text-sky-200'}`}>{icon}</div>
      <span className="truncate text-[13px]">{label}</span>
    </button>
  );
}

function HeaderIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="group flex shrink-0 flex-col items-center gap-0.5">
      <div className="text-slate-400 transition-colors group-hover:text-sky-500">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 lg:text-[11px]">{label}</span>
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-black text-sky-50 ring-1 ring-white/15">
      {children}
    </span>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
      <div className="text-sky-500">{icon}</div>
      <p className="mt-2 text-xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

