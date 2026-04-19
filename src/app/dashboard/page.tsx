'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Clock, Target, TrendingUp,
  ChevronRight, Info, CheckCircle2, Zap, BarChart3,
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

export default function PainelEstudante() {
  const router = useRouter();
  const [temCiclo, setTemCiclo]         = useState(false);
  const [ciclo, setCiclo]               = useState<CicloResumo | null>(null);
  const [mounted, setMounted]           = useState(false);
  const [carregandoCiclo, setCarregandoCiclo] = useState(true);
  const [abaAtiva, setAbaAtiva]         = useState('Dashboard');
  const [nomeUsuario, setNomeUsuario]   = useState('');

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  useEffect(() => {
    setMounted(true);
    setNomeUsuario(getNomeUsuario());
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
  }, []);

  if (!mounted) return <div className="min-h-screen w-full bg-[#F0F2F5]" />;

  const progresso = ciclo ? Math.round((ciclo.posicaoAtual / ciclo.totalSlots) * 100) : 0;
  const passosConcluidos = temCiclo ? 2 : 1; // conta criada + ciclo
  const totalPassos = 4;
  const pctAtivacao = Math.round((passosConcluidos / totalPassos) * 100);

  return (
    <div className="min-h-screen w-full flex bg-[#F0F2F5] text-[#475569] font-sans">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="flex flex-col items-center grow overflow-y-auto min-h-0">
          <div className="w-40 h-40 flex items-center justify-center shrink-0">
            <img src="/logo_azul.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <nav className="space-y-1 w-full px-2">
            <MenuItem icon={<LayoutDashboard size={18} />} label="Dashboard"        active={abaAtiva === 'Dashboard'}   onClick={() => setAbaAtiva('Dashboard')} />
            <MenuItem icon={<BookOpen size={18} />}        label="Minha Mesa"       active={abaAtiva === 'Minha Mesa'}  onClick={() => setAbaAtiva('Minha Mesa')} />
            <MenuItem icon={<RefreshCw size={18} />}       label="Ciclos de estudo" active={abaAtiva === 'Ciclos'}      onClick={() => router.push('/ciclos')} />
            <MenuItem icon={<LineChart size={18} />}       label="Desempenho"       active={abaAtiva === 'Desempenho'}  onClick={() => setAbaAtiva('Desempenho')} />
            <MenuItem icon={<Calendar size={18} />}        label="Revisões"         active={abaAtiva === 'Revisões'}    onClick={() => setAbaAtiva('Revisões')} />
            <MenuItem icon={<Settings size={18} />}        label="Configurações"    active={abaAtiva === 'Config'}      onClick={() => setAbaAtiva('Config')} />
            <MenuItem icon={<User size={18} />}            label="Perfil"           active={abaAtiva === 'Perfil'}      onClick={() => setAbaAtiva('Perfil')} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full font-bold text-sm group">
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-red-100 transition-colors"><LogOut size={18} /></div>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto bg-[#F0F2F5]">

        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0">
          <h1 className="text-xl font-bold text-sky-500/80">Painel do Estudante</h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />}     label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" onClick={() => setAbaAtiva('Config')} />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">Olá, {nomeUsuario}!</p>
                <div className="flex items-center gap-1 justify-end">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-medium italic">Ativo</span>
                </div>
              </div>
              <div className="p-0.5 rounded-full bg-linear-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer" onClick={() => setAbaAtiva('Perfil')}>
                <img src="https://github.com/shadcn.png" alt="User" className="w-9 h-9 rounded-full border-2 border-white object-cover" />
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
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex items-center justify-between shadow-sm border-l-4 border-l-sky-500 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-sky-500" />
              <p className="text-xs text-slate-600 font-medium">Crie seu ciclo de estudos para desbloquear as funções.</p>
            </div>
            <button onClick={() => router.push('/ciclos')} className="bg-[#3b82f6] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95">
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
                <span className="text-3xl leading-none">👋</span> Bem-vindo de volta, {nomeUsuario}!
              </h2>
              <p className="text-slate-400 text-xs italic ml-1 mt-0.5">
                {temCiclo ? 'Seu ciclo está ativo e pronto para continuar.' : 'Seu painel ainda está se preparando.'}
              </p>
            </div>

            {/* ══ COM CICLO ══ */}
            {temCiclo && ciclo ? (
              <>
                {/* Hero — próxima sessão */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in duration-500">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Próxima na fila</p>
                      <h3 className="text-xl font-bold text-slate-800 truncate">
                        {ciclo.proximaSessao?.nome ?? '—'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {[ciclo.cargoNome, ciclo.concursoNome || ciclo.bancaSigla].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {ciclo.proximaSessao && (
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        ciclo.proximaSessao.categoria === 'R' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {ciclo.proximaSessao.categoria === 'R' ? 'Raciocínio' : 'Memorização'}
                      </span>
                    )}
                  </div>

                  {/* Progresso na fila */}
                  <div className="mb-5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                      <span>Posição na fila</span>
                      <span className="text-slate-600">#{ciclo.posicaoAtual} de {ciclo.totalSlots} · {progresso}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/ciclos')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                      <RefreshCw size={14} /> Ver ciclo
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
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

                {/* Placeholders de funcionalidades futuras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PlaceholderCard
                    icon={<BarChart3 size={20} />}
                    title="Desempenho"
                    description="Taxa de acerto por disciplina, evolução ao longo do tempo e pontos de melhoria."
                  />
                  <PlaceholderCard
                    icon={<Calendar size={20} />}
                    title="Revisões"
                    description="Revisões espaçadas baseadas no seu histórico de estudo, no momento certo."
                  />
                </div>
              </>
            ) : (
              /* ══ SEM CICLO — Onboarding ══ */
              <div className="bg-white rounded-2xl py-10 px-8 shadow-sm border border-slate-100 text-center flex flex-col items-center">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Para começar, crie o seu ciclo de estudos.</h3>
                  <p className="text-slate-400 text-sm italic">É rápido, fácil e personalizado para o seu edital.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                  <FeatureItem icon={<Clock size={20} />}      title="Organize seu tempo"     description="Defina quantas horas por dia você pode estudar." />
                  <FeatureItem icon={<Target size={20} />}     title="Foque no que importa"   description="Disciplinas e pesos automáticos baseados no edital." />
                  <FeatureItem icon={<TrendingUp size={20} />} title="Acompanhe sua evolução" description="Dashboard, metas e revisões inteligentes." />
                </div>
                <button
                  onClick={() => router.push('/ciclos')}
                  className="px-8 py-3 rounded-xl font-bold text-base shadow-md transition-all flex items-center gap-2 mb-3 hover:scale-105 active:scale-95 bg-[#3b82f6] text-white shadow-blue-200"
                >
                  Criar meu ciclo de estudos <ChevronRight size={18} />
                </button>
                <button className="text-sky-600 font-semibold text-xs hover:underline">Explorar primeiro</button>
              </div>
            )}
          </div>

          {/* ── Sidebar direita ── */}
          <div className="hidden lg:flex col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col w-full h-fit sticky top-6">
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
  );
}

/* ── Componentes ── */

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

function StatCard({ icon, label, valor, cor }: { icon: React.ReactNode; label: string; valor: string; cor: 'sky' | 'emerald' | 'slate' }) {
  const s = {
    sky:     { wrap: 'bg-sky-50 border-sky-100',         text: 'text-sky-600',     sub: 'text-sky-400' },
    emerald: { wrap: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', sub: 'text-emerald-400' },
    slate:   { wrap: 'bg-slate-50 border-slate-200',     text: 'text-slate-700',   sub: 'text-slate-400' },
  }[cor];
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-2 ${s.wrap}`}>
      <div className={`${s.sub}`}>{icon}</div>
      <p className={`text-xl font-black ${s.text}`}>{valor}</p>
      <p className={`text-[9px] font-black uppercase tracking-widest ${s.sub}`}>{label}</p>
    </div>
  );
}

function PlaceholderCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-dashed border-slate-200 flex flex-col gap-3 opacity-60">
      <div className="flex items-center gap-2">
        <div className="text-slate-300">{icon}</div>
        <h4 className="text-sm font-bold text-slate-500">{title}</h4>
        <span className="ml-auto text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Em breve</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
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
