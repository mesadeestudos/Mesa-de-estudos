'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Clock, Target, TrendingUp,
  ChevronRight, Info, CheckCircle2, Zap, BarChart3, Menu,
  ClipboardCheck, CalendarDays, Lightbulb, NotebookTabs, FileCheck2, MessageCircle,
} from 'lucide-react';

function getNomeUsuario(): string {
  try {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('authorization='));
    if (!cookie) return '';
    const token  = cookie.split('=')[1];
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json   = decodeURIComponent(atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    const payload = JSON.parse(json);
    return (payload.nome as string).split(' ').slice(0, 2).join(' ');
  } catch { return ''; }
}

interface CicloResumo {
  cargoNome:     string;
  concursoNome:  string;
  bancaSigla:    string;
  totalSlots:    number;
  posicaoAtual:  number;
  horasPorDia:   number;
  proximaSessao: { nome: string; categoria: string } | null;
}

interface CicloApiResumo {
  idCiclo?: number;
  cargoNome: string;
  concursoNome: string;
  bancaSigla: string;
  totalSlots: number;
  posicaoAtual: number;
  horasPorDia: number;
  hojeSlots?: Array<{ nome: string; categoria: string }>;
}

interface ResumoPainel {
  revisoesPendentes: number;
  revisoesAtrasadas: number;
  sessoesConcluidas: number;
  horasTotais: number;
}

interface AssistentePainel {
  tipo: string;
  titulo: string;
  mensagem: string;
  destino: string;
  acaoPrimaria?: string;
  narrativa?: string;
  etapaPedagogica?: string;
  prioridadeScore?: number;
  sinais?: { precisaRebalancear?: boolean };
  explicacao?: {
    principal: string;
    sinaisUsados: string[];
    alternativas: string[];
    consequencia: string;
  };
}

export default function PainelEstudante() {
  const router = useRouter();
  const [temCiclo, setTemCiclo]         = useState(false);
  const [ciclo, setCiclo]               = useState<CicloResumo | null>(null);
  const [mounted, setMounted]           = useState(false);
  const [carregandoCiclo, setCarregandoCiclo] = useState(true);
  const [abaAtiva, setAbaAtiva]         = useState('Visão Geral');
  const [nomeUsuario, setNomeUsuario]   = useState('');
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [rebalanceando, setRebalanceando] = useState(false);
  const [mensagemRebalanceamento, setMensagemRebalanceamento] = useState('');
  const [resumo, setResumo] = useState<ResumoPainel>({
    revisoesPendentes: 0,
    revisoesAtrasadas: 0,
    sessoesConcluidas: 0,
    horasTotais: 0,
  });
  const [assistente, setAssistente] = useState<AssistentePainel | null>(null);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  };

  const aplicarCicloResumo = (data: CicloApiResumo | null) => {
    if (data?.idCiclo) {
      setTemCiclo(true);
      setCiclo({
        cargoNome:     data.cargoNome,
        concursoNome:  data.concursoNome,
        bancaSigla:    data.bancaSigla,
        totalSlots:    data.totalSlots,
        posicaoAtual:  data.posicaoAtual,
        horasPorDia:   data.horasPorDia,
        proximaSessao: data.hojeSlots?.[0]
          ? { nome: data.hojeSlots[0].nome, categoria: data.hojeSlots[0].categoria }
          : null,
      });
    }
  };

  const rebalancearCiclo = async () => {
    setRebalanceando(true);
    setMensagemRebalanceamento('');
    try {
      const res = await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'rebalancear' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível rebalancear o ciclo.');
      aplicarCicloResumo(data);
      setMensagemRebalanceamento('Ciclo rebalanceado com sucesso.');
    } catch (error) {
      setMensagemRebalanceamento(error instanceof Error ? error.message : 'Não foi possível rebalancear o ciclo.');
    } finally {
      setRebalanceando(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setNomeUsuario(getNomeUsuario());
    });
    fetch('/api/ciclos')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        aplicarCicloResumo(data);
      })
      .catch(() => {})
      .finally(() => setCarregandoCiclo(false));

    Promise.all([
      fetch('/api/revisoes').then(r => r.ok ? r.json() : null),
      fetch('/api/desempenho').then(r => r.ok ? r.json() : null),
      fetch('/api/perfil').then(r => r.ok ? r.json() : null),
      fetch('/api/assistente').then(r => r.ok ? r.json() : null),
    ])
      .then(([revisoes, desempenho, perfil, assistenteData]) => {
        setResumo({
          revisoesPendentes: revisoes?.resumo?.pendentes ?? 0,
          revisoesAtrasadas: revisoes?.resumo?.atrasadas ?? 0,
          sessoesConcluidas: desempenho?.resumo?.sessoesConcluidas ?? 0,
          horasTotais: desempenho?.resumo?.horasTotais ?? 0,
        });
        if (perfil?.nomeCompleto) {
          setNomeUsuario(perfil.nomeCompleto.split(' ').slice(0, 2).join(' '));
        }
        setAssistente(assistenteData);
      })
      .catch(() => {});
  }, []);

  if (!mounted) return <div className="min-h-screen w-full bg-slate-50" />;

  const progresso = ciclo ? Math.round((ciclo.posicaoAtual / ciclo.totalSlots) * 100) : 0;
  const assistentePedeRebalanceamento = Boolean(
    assistente && (
      assistente.sinais?.precisaRebalancear
      || assistente.tipo === 'AJUSTAR_PLANO'
      || assistente.acaoPrimaria?.toLowerCase().includes('rebalance')
      || assistente.titulo.toLowerCase().includes('rebalance')
    )
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#475569] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      <div className="relative flex h-full w-full overflow-hidden">

      {/* Overlay mobile */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl flex flex-col shrink-0 h-screen transition-transform duration-300 lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex min-h-0 grow flex-col items-center overflow-hidden">
          <div className="w-full shrink-0 px-4 pb-3 pt-4">
            <div className="rounded-[20px] border border-white/10 bg-white/95 px-4 py-2.5 shadow-xl shadow-sky-950/20">
              <img src="/logo_azul.png" alt="Logo" className="mx-auto h-16 w-auto" />
            </div>
          </div>
          <nav className="w-full space-y-0.5 px-3">
            <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral"        active={abaAtiva === 'Visão Geral'}   onClick={() => { setAbaAtiva('Visão Geral');   setSidebarAberta(false); }} />
            <MenuItem icon={<BookOpen size={18} />}        label="Minha Mesa"       active={false}                      onClick={() => { router.push('/minha-mesa'); setSidebarAberta(false); }} />
            <MenuItem icon={<RefreshCw size={18} />}       label="Ciclos de estudo" active={abaAtiva === 'Ciclos'}      onClick={() => { router.push('/ciclos');    setSidebarAberta(false); }} />
            <MenuItem icon={<ClipboardCheck size={18} />}  label="Questões"         active={false}                      onClick={() => { router.push('/questoes'); setSidebarAberta(false); }} />
            <MenuItem icon={<NotebookTabs size={18} />}    label="Caderno de erros" active={false}                      onClick={() => { router.push('/caderno-erros'); setSidebarAberta(false); }} />
            <MenuItem icon={<FileCheck2 size={18} />}      label="Simulados"        active={false}                      onClick={() => { router.push('/simulados'); setSidebarAberta(false); }} />
            <MenuItem icon={<MessageCircle size={18} />}   label="Assistente IA"    active={false}                      onClick={() => { router.push('/assistente'); setSidebarAberta(false); }} />
            <MenuItem icon={<CalendarDays size={18} />}    label="Agenda"           active={false}                      onClick={() => { router.push('/agenda'); setSidebarAberta(false); }} />
            <MenuItem icon={<LineChart size={18} />}       label="Desempenho"       active={false}                      onClick={() => { router.push('/desempenho'); setSidebarAberta(false); }} />
            <MenuItem icon={<Calendar size={18} />}        label="Revisões"         active={false}                      onClick={() => { router.push('/revisoes');   setSidebarAberta(false); }} />
            <MenuItem icon={<Lightbulb size={18} />}       label="Sugestões"        active={false}                      onClick={() => { router.push('/sugestoes'); setSidebarAberta(false); }} />
            <MenuItem icon={<Settings size={18} />}        label="Configurações"    active={abaAtiva === 'Config'}      onClick={() => { router.push('/configuracoes'); setSidebarAberta(false); }} />
            <MenuItem icon={<User size={18} />}            label="Perfil"           active={abaAtiva === 'Perfil'}      onClick={() => { router.push('/perfil'); setSidebarAberta(false); }} />
          </nav>
        </div>
        <div className="p-4 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-red-200 hover:bg-red-500/15 rounded-xl transition-all w-full font-bold text-sm group">
            <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-red-500/20 transition-colors"><LogOut size={18} /></div>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">

        {/* Header */}
        <header className="mb-6 flex shrink-0 items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAberta(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Mesa de Estudos</p>
              <h1 className="truncate text-lg font-black text-slate-800">Visão Geral</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />}     label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" onClick={() => router.push('/configuracoes')} />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-linear-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer" onClick={() => router.push('/perfil')}>
                <div className="w-9 h-9 rounded-full border-2 border-white bg-linear-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
                  <User size={20} className="text-sky-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Skeleton enquanto carrega ── */}
        {carregandoCiclo && (
          <div className="grid grid-cols-12 gap-6 pb-8 animate-pulse">
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-5">
              <div className="h-10 w-64 bg-slate-200 rounded-xl" />
              <div className="h-44 bg-slate-200 rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-slate-200 rounded-2xl" />
                <div className="h-24 bg-slate-200 rounded-2xl" />
                <div className="h-24 bg-slate-200 rounded-2xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-slate-200 rounded-2xl" />
                <div className="h-32 bg-slate-200 rounded-2xl" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-3">
              <div className="h-72 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Alerta — só sem ciclo */}
        {!carregandoCiclo && !temCiclo && (
          <div className="mb-6 flex shrink-0 items-center justify-between rounded-2xl border border-white/70 border-l-4 border-l-sky-500 bg-white/78 p-3 shadow-lg shadow-sky-100/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-sky-500" />
              <p className="text-xs text-slate-600 font-medium">Crie seu ciclo de estudos para desbloquear as funções.</p>
            </div>
            <button onClick={() => router.push('/ciclos')} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95">
              Criar agora
            </button>
          </div>
        )}

        {!carregandoCiclo && <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Controle do estudo</p>
                <h2 className="text-2xl font-black text-slate-800">Olá, {nomeUsuario || 'estudante'}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {temCiclo ? 'Acompanhe o que pede ação e deixe a execução para a Minha Mesa.' : 'Crie o ciclo para liberar a rotina guiada.'}
                </p>
              </div>
              {temCiclo && ciclo && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => router.push('/minha-mesa')} className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600">
                    <Zap size={16} /> Estudar agora
                  </button>
                  <button onClick={() => router.push('/ciclos')} className="flex items-center gap-2 rounded-2xl border border-sky-100 bg-white/80 px-4 py-2.5 text-sm font-black text-sky-700 transition-all hover:bg-sky-50">
                    <RefreshCw size={16} /> Ver ciclo
                  </button>
                </div>
              )}
            </div>
          </section>

          {temCiclo && ciclo ? (
            <>
              <section className="col-span-12 rounded-[30px] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-sky-200/40 lg:col-span-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                      {assistente?.etapaPedagogica ?? 'Próxima melhor ação'}
                    </p>
                    <h3 className="mt-2 text-2xl font-black leading-tight">
                      {assistente?.titulo ?? `Continuar com ${ciclo.proximaSessao?.nome ?? 'a próxima sessão'}`}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-300">
                      {assistente?.narrativa ?? assistente?.mensagem ?? 'A Mesa já sabe qual é a próxima ação do seu ciclo. Abra a execução quando estiver pronto.'}
                    </p>
                    {assistente?.explicacao && (
                      <p className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200">
                        {assistente.explicacao.consequencia}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={assistentePedeRebalanceamento ? rebalancearCiclo : () => router.push(assistente?.destino ?? '/minha-mesa')}
                    disabled={rebalanceando}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-300 disabled:opacity-70"
                  >
                    {rebalanceando && assistentePedeRebalanceamento ? <RefreshCw size={16} className="animate-spin" /> : null}
                    {rebalanceando && assistentePedeRebalanceamento ? 'Rebalanceando...' : (assistente?.acaoPrimaria ?? 'Abrir Minha Mesa')}
                    <ChevronRight size={16} />
                  </button>
                </div>
                {mensagemRebalanceamento && (
                  <p className={`mt-4 rounded-2xl px-4 py-2 text-xs font-black ${mensagemRebalanceamento.includes('sucesso') ? 'bg-emerald-400/15 text-emerald-100' : 'bg-red-400/15 text-red-100'}`}>
                    {mensagemRebalanceamento}
                  </p>
                )}
              </section>

              <section className="col-span-12 rounded-[30px] border border-white/70 bg-white/82 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Sessão atual</p>
                    <h3 className="mt-2 truncate text-xl font-black text-slate-800">{ciclo.proximaSessao?.nome ?? 'Ciclo em ajuste'}</h3>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {[ciclo.cargoNome, ciclo.concursoNome || ciclo.bancaSigla].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {ciclo.proximaSessao && (
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${ciclo.proximaSessao.categoria === 'R' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
                      {ciclo.proximaSessao.categoria === 'R' ? 'Raciocínio' : 'Memorização'}
                    </span>
                  )}
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-black text-slate-500">
                    <span>Posição no ciclo</span>
                    <span>{ciclo.posicaoAtual}/{ciclo.totalSlots}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-sky-400 transition-all" style={{ width: `${progresso}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">{progresso}% do ciclo percorrido.</p>
                </div>
              </section>

              <section className="col-span-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PainelMetric icon={<Target size={18} />} label="Meta diária" value={`${ciclo.horasPorDia} sessões`} detail="Regra do seu ciclo" tone="emerald" />
                <PainelMetric icon={<Calendar size={18} />} label="Revisões" value={String(resumo.revisoesPendentes)} detail={resumo.revisoesAtrasadas > 0 ? `${resumo.revisoesAtrasadas} atrasada(s)` : 'Em dia'} tone={resumo.revisoesAtrasadas > 0 ? 'amber' : 'sky'} />
                <PainelMetric icon={<CheckCircle2 size={18} />} label="Concluídas" value={String(resumo.sessoesConcluidas)} detail="Sessões registradas" tone="sky" />
                <PainelMetric icon={<Clock size={18} />} label="Horas totais" value={`${resumo.horasTotais}h`} detail="Histórico de estudo" tone="slate" />
              </section>

              <section className="col-span-12 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Alertas importantes</p>
                  <div className="mt-4 grid gap-3">
                    <AlertRow
                      icon={<Calendar size={16} />}
                      title={resumo.revisoesAtrasadas > 0 ? 'Revisões atrasadas pedem atenção' : 'Revisões sob controle'}
                      detail={resumo.revisoesAtrasadas > 0 ? `Resolva ${resumo.revisoesAtrasadas} antes de avançar muito conteúdo novo.` : 'Nenhuma revisão crítica agora.'}
                      tone={resumo.revisoesAtrasadas > 0 ? 'amber' : 'emerald'}
                      onClick={() => router.push('/revisoes')}
                    />
                    <AlertRow
                      icon={<RefreshCw size={16} />}
                      title={assistentePedeRebalanceamento ? 'Ciclo pode ser ajustado' : 'Ciclo ativo'}
                      detail={assistentePedeRebalanceamento ? 'Aplique o rebalanceamento sem sair da Visão Geral.' : `${ciclo.totalSlots} sessões organizadas para sua rotina.`}
                      tone={assistentePedeRebalanceamento ? 'sky' : 'emerald'}
                      onClick={assistentePedeRebalanceamento ? rebalancearCiclo : () => router.push('/ciclos')}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Atalhos rápidos</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <QuickLink icon={<BookOpen size={17} />} label="Minha Mesa" onClick={() => router.push('/minha-mesa')} />
                    <QuickLink icon={<ClipboardCheck size={17} />} label="Questões" onClick={() => router.push('/questoes')} />
                    <QuickLink icon={<Calendar size={17} />} label="Revisões" onClick={() => router.push('/revisoes')} />
                    <QuickLink icon={<BarChart3 size={17} />} label="Desempenho" onClick={() => router.push('/desempenho')} />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/82 px-6 py-10 text-center shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
              <h3 className="text-2xl font-black text-slate-800">Crie seu ciclo para liberar a rotina guiada.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">O sistema usa edital, cargo e tempo disponível para montar a sequência de estudos, revisões e acompanhamento.</p>
              <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
                <FeatureItem icon={<Clock size={20} />} title="Organize seu tempo" description="Transforme horas disponíveis em sessões práticas." />
                <FeatureItem icon={<Target size={20} />} title="Priorize o edital" description="Use disciplinas e pesos do cargo escolhido." />
                <FeatureItem icon={<TrendingUp size={20} />} title="Acompanhe evolução" description="Ganhe metas, revisões e recomendações." />
              </div>
              <button onClick={() => router.push('/ciclos')} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-7 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:bg-sky-600">
                Criar ciclo de estudos <ChevronRight size={18} />
              </button>
            </section>
          )}
        </div>}

      </main>
    </div>
    </div>
  );
}

/* ── Componentes ── */

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition-all group ${active ? 'bg-white/16 font-bold text-white shadow-sm ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
      <div className={`shrink-0 transition-all ${active ? 'p-1.5 rounded-xl bg-sky-400 text-white' : 'text-slate-400 group-hover:text-sky-200'}`}>{icon}</div>
      <span className="text-[13px] truncate">{label}</span>
    </div>
  );
}

function HeaderIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 group shrink-0">
      <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function PainelMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'sky' | 'emerald' | 'amber' | 'slate';
}) {
  const colors = {
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[tone];

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/82 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${colors}`}>{icon}</div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-800">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
    </div>
  );
}

function AlertRow({
  icon,
  title,
  detail,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone: 'sky' | 'emerald' | 'amber';
  onClick: () => void;
}) {
  const colors = {
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];

  return (
    <button onClick={onClick} className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3 text-left transition-all hover:border-sky-100 hover:bg-sky-50/60">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colors}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-500">{detail}</p>
      </div>
    </button>
  );
}

function QuickLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/75 px-3 py-3 text-left text-xs font-black text-slate-700 transition-all hover:border-sky-100 hover:bg-sky-50 hover:text-sky-700">
      <span className="text-sky-500">{icon}</span>
      {label}
    </button>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-2xl border border-white/70 bg-white/70 text-center shadow-sm shadow-slate-200/60">
      <div className="text-sky-500 mb-2">{icon}</div>
      <h4 className="text-[11px] lg:text-[12px] font-bold text-slate-700 leading-tight">{title}</h4>
      <p className="text-[10px] text-slate-400 italic mt-1 leading-tight">{description}</p>
    </div>
  );
}

