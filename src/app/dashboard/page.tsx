'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Clock, Target, TrendingUp,
  ChevronRight, Info, CheckCircle2, Zap, BarChart3, Menu,
  ClipboardCheck, CalendarDays,
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

interface ResumoPainel {
  revisoesPendentes: number;
  revisoesAtrasadas: number;
  sessoesConcluidas: number;
  horasTotais: number;
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
  const [resumo, setResumo] = useState<ResumoPainel>({
    revisoesPendentes: 0,
    revisoesAtrasadas: 0,
    sessoesConcluidas: 0,
    horasTotais: 0,
  });

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setNomeUsuario(getNomeUsuario());
    });
    fetch('/api/ciclos')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
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
      })
      .catch(() => {})
      .finally(() => setCarregandoCiclo(false));

    Promise.all([
      fetch('/api/revisoes').then(r => r.ok ? r.json() : null),
      fetch('/api/desempenho').then(r => r.ok ? r.json() : null),
      fetch('/api/perfil').then(r => r.ok ? r.json() : null),
    ])
      .then(([revisoes, desempenho, perfil]) => {
        setResumo({
          revisoesPendentes: revisoes?.resumo?.pendentes ?? 0,
          revisoesAtrasadas: revisoes?.resumo?.atrasadas ?? 0,
          sessoesConcluidas: desempenho?.resumo?.sessoesConcluidas ?? 0,
          horasTotais: desempenho?.resumo?.horasTotais ?? 0,
        });
        if (perfil?.nomeCompleto) {
          setNomeUsuario(perfil.nomeCompleto.split(' ').slice(0, 2).join(' '));
        }
      })
      .catch(() => {});
  }, []);

  if (!mounted) return <div className="min-h-screen w-full bg-slate-50" />;

  const progresso = ciclo ? Math.round((ciclo.posicaoAtual / ciclo.totalSlots) * 100) : 0;
  const passosConcluidos = temCiclo ? 2 : 1; // conta criada + ciclo
  const totalPassos = 4;
  const pctAtivacao = Math.round((passosConcluidos / totalPassos) * 100);

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
        <div className="flex flex-col items-center grow overflow-y-auto min-h-0">
          <div className="w-full px-4 pt-5 pb-4 shrink-0">
            <div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20">
              <img src="/logo_azul.png" alt="Logo" className="h-20 w-auto mx-auto" />
            </div>
          </div>
          <nav className="space-y-1 w-full px-3">
            <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral"        active={abaAtiva === 'Visão Geral'}   onClick={() => { setAbaAtiva('Visão Geral');   setSidebarAberta(false); }} />
            <MenuItem icon={<BookOpen size={18} />}        label="Minha Mesa"       active={false}                      onClick={() => { router.push('/minha-mesa'); setSidebarAberta(false); }} />
            <MenuItem icon={<RefreshCw size={18} />}       label="Ciclos de estudo" active={abaAtiva === 'Ciclos'}      onClick={() => { router.push('/ciclos');    setSidebarAberta(false); }} />
            <MenuItem icon={<ClipboardCheck size={18} />}  label="Questões"         active={false}                      onClick={() => { router.push('/questoes'); setSidebarAberta(false); }} />
            <MenuItem icon={<CalendarDays size={18} />}    label="Agenda"           active={false}                      onClick={() => { router.push('/agenda'); setSidebarAberta(false); }} />
            <MenuItem icon={<LineChart size={18} />}       label="Desempenho"       active={false}                      onClick={() => { router.push('/desempenho'); setSidebarAberta(false); }} />
            <MenuItem icon={<Calendar size={18} />}        label="Revisões"         active={false}                      onClick={() => { router.push('/revisoes');   setSidebarAberta(false); }} />
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

        {!carregandoCiclo && <div className="grid grid-cols-12 gap-6 pb-8">

          {/* ── Coluna principal ── */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-5">

            {/* Saudação */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100">
                  <span className="text-xl leading-none">👋</span>
                </span>
                Bem-vindo de volta, {nomeUsuario}!
              </h2>
              <p className="text-slate-400 text-xs italic ml-1 mt-0.5">
                {temCiclo ? 'Seu ciclo está ativo e pronto para continuar.' : 'Seu painel ainda está se preparando.'}
              </p>
            </div>

            {/* ══ COM CICLO ══ */}
            {temCiclo && ciclo ? (
              <>
                {/* Hero — próxima sessão */}
                <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-linear-to-br from-slate-950 via-sky-950 to-sky-700 p-6 text-white shadow-2xl shadow-sky-200/50 animate-in fade-in duration-500">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Próxima na fila</p>
                      <h3 className="text-xl font-bold text-white truncate">
                        {ciclo.proximaSessao?.nome ?? '—'}
                      </h3>
                      <p className="text-xs text-sky-100/75 mt-0.5 truncate">
                        {[ciclo.cargoNome, ciclo.concursoNome || ciclo.bancaSigla].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {ciclo.proximaSessao && (
                      <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ring-1 ring-white/20 ${
                        ciclo.proximaSessao.categoria === 'R' ? 'bg-violet-400/20 text-violet-100' : 'bg-amber-300/20 text-amber-100'
                      }`}>
                        {ciclo.proximaSessao.categoria === 'R' ? 'Raciocínio' : 'Memorização'}
                      </span>
                    )}
                  </div>

                  {/* Progresso na fila */}
                  <div className="mb-5">
                    <div className="flex justify-between text-[10px] font-bold text-sky-100/80 mb-1.5 [&>span:last-child]:text-white">
                      <span>Posição na fila</span>
                      <span className="text-slate-600">#{ciclo.posicaoAtual} de {ciclo.totalSlots} · {progresso}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-emerald-300 to-sky-300 rounded-full transition-all duration-700"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/ciclos')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-sky-700 hover:bg-sky-50 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                      <RefreshCw size={14} /> Ver ciclo
                    </button>
                    <button onClick={() => router.push('/minha-mesa')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl font-bold text-sm transition-all shadow-sm">
                      <Zap size={14} /> Minha Mesa
                    </button>
                  </div>
                </div>

                {/* Stats do ciclo */}
                <div className="grid grid-cols-3 gap-4">
                  <StatCard icon={<RefreshCw size={16} />} label="Sessões no ciclo" valor={String(ciclo.totalSlots)}           cor="sky" />
                  <StatCard icon={<Target size={16} />}    label="Meta diária"      valor={`${ciclo.horasPorDia} sessões`}      cor="emerald" />
                  <StatCard icon={<Clock size={16} />}     label="Por sessão"       valor="60 min"                              cor="slate" />
                </div>

                {/* Resumos de acompanhamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ResumoCard
                    icon={<Calendar size={20} />}
                    title="Revisões pendentes"
                    value={String(resumo.revisoesPendentes)}
                    description={resumo.revisoesAtrasadas > 0
                      ? `${resumo.revisoesAtrasadas} atrasadas pedem atenção hoje.`
                      : 'Sua fila de revisões está sob controle.'}
                    actionLabel="Ver revisões"
                    onClick={() => router.push('/revisoes')}
                    tone="sky"
                  />
                  <ResumoCard
                    icon={<BarChart3 size={20} />}
                    title="Sessões concluídas"
                    value={String(resumo.sessoesConcluidas)}
                    description={`${resumo.horasTotais}h registradas no histórico de estudos.`}
                    actionLabel="Ver desempenho"
                    onClick={() => router.push('/desempenho')}
                    tone="emerald"
                  />
                </div>
              </>
            ) : (
              /* ══ SEM CICLO — Onboarding ══ */
              <div className="rounded-[32px] border border-white/70 bg-white/78 py-10 px-8 text-center shadow-2xl shadow-slate-200/60 backdrop-blur-xl flex flex-col items-center">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Para começar, crie o seu ciclo de estudos.</h3>
                  <p className="text-slate-400 text-sm italic">É rápido, fácil e personalizado para o seu edital.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                  <FeatureItem icon={<Clock size={20} />}      title="Organize seu tempo"     description="Defina quantas horas por dia você pode estudar." />
                  <FeatureItem icon={<Target size={20} />}     title="Foque no que importa"   description="Disciplinas e pesos automáticos baseados no edital." />
                  <FeatureItem icon={<TrendingUp size={20} />} title="Acompanhe sua evolução" description="Visão Geral, metas e revisões inteligentes." />
                </div>
                <button
                  onClick={() => router.push('/ciclos')}
                  className="px-8 py-3 rounded-xl font-bold text-base shadow-md transition-all flex items-center gap-2 mb-3 hover:scale-105 active:scale-95 bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200"
                >
                  Criar meu ciclo de estudos <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar direita ── */}
          <div className="hidden lg:flex col-span-3">
            <div className="rounded-[28px] border border-white/70 bg-white/78 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl flex flex-col w-full h-fit sticky top-6">
              <h3 className="font-bold text-slate-800 mb-1 text-sm">
                {temCiclo ? 'Próximos marcos' : 'Progresso de ativação'}
              </h3>
              <p className="text-slate-400 mb-6 text-xs italic">
                {temCiclo
                  ? 'Complete os marcos para aproveitar tudo.'
                  : 'Complete os passos para desbloquear a plataforma.'}
              </p>
              <div className="space-y-5">
                <CheckStep label="Conta criada"    done />
                <CheckStep label="Ciclo criado"    done={temCiclo}  active={!temCiclo} onClick={!temCiclo ? () => router.push('/ciclos') : undefined} />
                <CheckStep label="Primeiro estudo" done={false} />
                <CheckStep label="Primeira revisão" done={false} />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-1000 rounded-full"
                    style={{ width: `${pctAtivacao}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {pctAtivacao}% concluído
                </span>
              </div>
            </div>
          </div>

        </div>}

      </main>
    </div>
    </div>
  );
}

/* ── Componentes ── */

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all group ${active ? 'text-white bg-white/16 font-bold shadow-sm ring-1 ring-white/15' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
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

function StatCard({ icon, label, valor, cor }: { icon: React.ReactNode; label: string; valor: string; cor: 'sky' | 'emerald' | 'slate' }) {
  const s = {
    sky:     { icon: 'text-sky-400',     text: 'text-sky-600' },
    emerald: { icon: 'text-emerald-400', text: 'text-emerald-600' },
    slate:   { icon: 'text-slate-400',   text: 'text-slate-700' },
  }[cor];
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-xl flex flex-col gap-2">
      <div className={s.icon}>{icon}</div>
      <p className={`text-xl font-black ${s.text}`}>{valor}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}

function ResumoCard({
  icon,
  title,
  value,
  description,
  actionLabel,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  tone: 'sky' | 'emerald';
}) {
  const colors = {
    sky: {
      icon: 'text-sky-500 bg-sky-50',
      value: 'text-sky-600',
      button: 'text-sky-700 bg-sky-50 hover:bg-sky-100',
    },
    emerald: {
      icon: 'text-emerald-500 bg-emerald-50',
      value: 'text-emerald-600',
      button: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
    },
  }[tone];

  return (
    <button
      onClick={onClick}
      className="group rounded-[24px] border border-white/70 bg-white/78 p-5 text-left shadow-lg shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${colors.icon}`}>{icon}</div>
          <h4 className="text-sm font-black text-slate-800">{title}</h4>
        </div>
        <p className={`text-4xl font-black leading-none ${colors.value}`}>{value}</p>
      </div>
      <p className="mt-3 min-h-8 text-xs font-semibold leading-relaxed text-slate-400">{description}</p>
      <span className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${colors.button}`}>
        {actionLabel} <ChevronRight size={12} />
      </span>
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

function CheckStep({ label, done = false, active = false, onClick }: { label: string; done?: boolean; active?: boolean; onClick?: () => void }) {
  return (
    <div className={`flex items-center gap-3 ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`} onClick={onClick}>
      {done
        ? <div className="bg-emerald-100 text-emerald-500 rounded-full p-0.5 shrink-0"><CheckCircle2 size={14} /></div>
        : <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${active ? 'border-sky-500 bg-sky-50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-slate-200'}`} />
      }
      <span className={`text-[11px] font-bold transition-colors ${done ? 'text-slate-700 line-through decoration-slate-300' : active ? 'text-slate-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

