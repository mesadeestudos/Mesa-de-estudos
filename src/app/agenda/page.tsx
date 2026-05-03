'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  BookOpen, CalendarDays, CheckCircle2, ClipboardCheck,
  Clock, LayoutDashboard, LineChart, LogOut, Menu, RefreshCw,
  Settings, Target, User, AlertTriangle, ChevronRight,
} from 'lucide-react';

interface AgendaData {
  assistente: { titulo: string; mensagem: string; destino: string; tipo: string };
  planoHoje: {
    sessoesPrevistas: Array<{ ordem: number; disciplina: string; minutos: number; tipo: string }>;
    revisoesVencidas: Array<{ idTopico: number; disciplina: string; topico: string; vencimento: string }>;
    revisoesHoje: Array<{ idTopico: number; disciplina: string; topico: string; vencimento: string }>;
    questaoRecomendada: { disciplina: string; percentual: number; erros: number } | null;
  };
  semana: {
    metaMinutos: number;
    minutosRegistrados: number;
    dias: Array<{ data: string; label: string; minutos: number; sessoes: number; semEstudo: boolean; revisoes: number }>;
  };
  revisoes: {
    vencidas: Array<{ idTopico: number; disciplina: string; topico: string; vencimento: string }>;
    futuras: Array<{ idTopico: number; disciplina: string; topico: string; vencimento: string }>;
  };
  edital: {
    cargo: string | null;
    concurso: string | null;
    banca: string | null;
    dataProva: string | null;
    conclusaoPrevista: string | null;
    topicosRestantes: number;
  };
}

export default function AgendaPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [remarcando, setRemarcando] = useState(false);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<AgendaData | null>(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível carregar a agenda.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar a agenda.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const remarcarSessao = async () => {
    setRemarcando(true);
    setErro('');
    try {
      const res = await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'remarcar' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível remarcar a sessão.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível remarcar a sessão.');
    } finally {
      setRemarcando(false);
    }
  };

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };
  const pctSemana = dados?.semana.metaMinutos ? Math.min(100, Math.round((dados.semana.minutosRegistrados / dados.semana.metaMinutos) * 100)) : 0;

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
              <MenuItem icon={<ClipboardCheck size={18} />} label="Questões" onClick={() => router.push('/questoes')} />
              <MenuItem icon={<CalendarDays size={18} />} label="Agenda" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<LineChart size={18} />} label="Desempenho" onClick={() => router.push('/desempenho')} />
              <MenuItem icon={<CalendarDays size={18} />} label="Revisões" onClick={() => router.push('/revisoes')} />
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
              <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Planejamento automático</p><h1 className="truncate text-lg font-black text-slate-800">Agenda</h1></div>
            </div>
          </header>

          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Organizando sua agenda..." />
          ) : erro ? (
            <EmptyState icon={<AlertTriangle size={26} />} title={erro} />
          ) : dados ? (
            <div className="grid grid-cols-12 gap-5 pb-8">
              <section className="col-span-12 rounded-[32px] border border-emerald-100 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">Orientação inteligente</p>
                    <h2 className="mt-1 text-xl font-black text-slate-800">{dados.assistente.titulo}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{dados.assistente.mensagem}</p>
                  </div>
                  <button onClick={() => router.push(dados.assistente.destino)} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-emerald-600">
                    Abrir tarefa <ChevronRight size={16} />
                  </button>
                </div>
              </section>

              <Metric icon={<Target size={20} />} label="Meta semanal" value={`${Math.round(dados.semana.metaMinutos / 60)}h`} />
              <Metric icon={<Clock size={20} />} label="Registrado" value={`${Math.round(dados.semana.minutosRegistrados / 60)}h`} />
              <Metric icon={<CheckCircle2 size={20} />} label="Progresso" value={`${pctSemana}%`} />
              <Metric icon={<BookOpen size={20} />} label="Tópicos restantes" value={String(dados.edital.topicosRestantes)} />

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Plano do dia</p>
                <h2 className="mt-1 text-xl font-black">Hoje</h2>
                <div className="mt-5 space-y-3">
                  {dados.planoHoje.sessoesPrevistas.length === 0 ? <p className="text-sm font-semibold text-slate-300">Crie um ciclo para gerar sessões previstas.</p> : dados.planoHoje.sessoesPrevistas.map(item => (
                    <div key={`${item.ordem}-${item.disciplina}`} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-sm font-black text-white">{item.ordem}. {item.disciplina}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{item.minutos} min previstos</p>
                    </div>
                  ))}
                  <button onClick={remarcarSessao} disabled={remarcando || dados.planoHoje.sessoesPrevistas.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-sky-800 transition-all hover:bg-sky-50 disabled:opacity-60">
                    {remarcando ? <RefreshCw className="animate-spin" size={16} /> : <CalendarDays size={16} />}
                    Remarcar sessão atual
                  </button>
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Semana</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Histórico e dias sem estudo</h2>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {dados.semana.dias.map(dia => (
                    <div key={dia.data} className={`rounded-2xl border p-3 text-center ${dia.semEstudo ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white/80'}`}>
                      <p className="text-[10px] font-black uppercase text-slate-400">{dia.label}</p>
                      <p className="mt-2 text-lg font-black text-slate-800">{Math.round(dia.minutos / 60)}h</p>
                      <p className="text-[10px] font-bold text-slate-500">{dia.sessoes} sessões</p>
                      {dia.revisoes > 0 && <p className="mt-1 text-[10px] font-black text-sky-600">{dia.revisoes} rev.</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Revisões</p>
                <div className="mt-5 space-y-3">
                  {[...dados.revisoes.vencidas, ...dados.revisoes.futuras].slice(0, 8).map(item => (
                    <div key={`${item.idTopico}-${item.vencimento}`} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="text-sm font-black text-slate-800">{item.disciplina}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.topico}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">{new Date(item.vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
                  {dados.revisoes.vencidas.length + dados.revisoes.futuras.length === 0 && <p className="text-sm font-semibold text-slate-500">Nenhuma revisão programada agora.</p>}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Edital e questões</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InfoCard title="Prova" value={dados.edital.dataProva ? new Date(dados.edital.dataProva).toLocaleDateString('pt-BR') : 'A definir'} detail={[dados.edital.cargo, dados.edital.concurso || dados.edital.banca].filter(Boolean).join(' · ') || 'Sem edital ativo'} />
                  <InfoCard title="Conclusão prevista" value={dados.edital.conclusaoPrevista ? new Date(dados.edital.conclusaoPrevista).toLocaleDateString('pt-BR') : 'A definir'} detail="Estimativa pelo ritmo atual do ciclo" />
                  <InfoCard title="Questões recomendadas" value={dados.planoHoje.questaoRecomendada?.disciplina ?? 'Sem dados'} detail={dados.planoHoje.questaoRecomendada ? `${dados.planoHoje.questaoRecomendada.percentual}% de aproveitamento` : 'Registre questões para calibrar'} />
                  <InfoCard title="Ação" value={dados.assistente.tipo} detail="Definida pelo assistente" />
                </div>
              </section>
            </div>
          ) : null}
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

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p><p className="mt-2 text-lg font-black text-slate-800">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></div>;
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/75 text-center shadow-xl shadow-slate-200/60 backdrop-blur-xl"><div className="text-sky-500">{icon}</div><p className="text-sm font-black text-slate-500">{title}</p></div>;
}
