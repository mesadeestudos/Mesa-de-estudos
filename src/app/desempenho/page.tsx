'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';
import {
  BarChart3, BookOpen, Calendar, Clock, LayoutDashboard, LineChart,
  LogOut, Menu, RefreshCw, Settings, Target, TrendingUp, User,
  ClipboardCheck, CalendarDays,
} from 'lucide-react';

interface DesempenhoData {
  resumo: {
    minutosTotais: number;
    horasTotais: number;
    sessoesConcluidas: number;
    topicosConcluidos: number;
    disciplinasComProgresso: number;
  };
  semana: Array<{ data: string; minutos: number; sessoes: number }>;
  disciplinas: Array<{
    idDisciplina: number;
    nome: string;
    topicosConcluidos: number;
    percentual: number;
    concluida: boolean;
    minutos: number;
    sessoes: number;
  }>;
  inteligencia: {
    tendencia: 'SUBINDO' | 'CAINDO' | 'ESTAVEL';
    pontosFracos: Array<{ idDisciplina: number; nome: string; percentual: number; motivo: string }>;
    recomendacoes: string[];
    topicos: Array<{ idTopico: number; disciplina: string; topico: string; concluidoEm: string | null }>;
  };
  recentes: Array<{
    idSessao: number;
    disciplina: string;
    topico: string;
    minutos: number;
    status: string;
    inicio: string;
  }>;
}

interface QuestoesData {
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
}

export default function DesempenhoPage() {
  const router = useRouter();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<DesempenhoData | null>(null);
  const [questoes, setQuestoes] = useState<QuestoesData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/desempenho'),
      fetch('/api/questoes'),
    ])
      .then(async ([desempenhoRes, questoesRes]) => {
        const data = await desempenhoRes.json();
        if (!desempenhoRes.ok) throw new Error(data.message || 'Não foi possível carregar seu desempenho.');
        setDados(data);
        if (questoesRes.ok) setQuestoes(await questoesRes.json());
      })
      .catch((error) => setErro(error instanceof Error ? error.message : 'Não foi possível carregar seu desempenho.'))
      .finally(() => setCarregando(false));
  }, []);

  const maiorMinutoSemana = useMemo(() => Math.max(1, ...(dados?.semana.map(dia => dia.minutos) ?? [1])), [dados]);
  const disciplinasCriticas = useMemo(() => [...(dados?.disciplinas ?? [])].sort((a, b) => a.percentual - b.percentual).slice(0, 4), [dados]);
  const tendenciaTexto = {
    SUBINDO: 'Ritmo subindo',
    CAINDO: 'Ritmo caindo',
    ESTAVEL: 'Ritmo estável',
  }[dados?.inteligencia.tendencia ?? 'ESTAVEL'];

  const handleLogout = () => { deleteCookie('authorization'); router.push('/login'); };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_38%,#ecfdf5_100%)] text-slate-600">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_30%)]" />
      <div className="relative flex h-full overflow-hidden">
        {sidebarAberta && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="min-h-0 grow overflow-y-auto px-3">
            <div className="px-1 pb-4 pt-5">
              <div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20">
                <img src="/logo_azul.png" alt="Logo" className="mx-auto h-20 w-auto" />
              </div>
            </div>
            <nav className="space-y-1">
              <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" onClick={() => router.push('/dashboard')} />
              <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" onClick={() => router.push('/minha-mesa')} />
              <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" onClick={() => router.push('/ciclos')} />
              <MenuItem icon={<ClipboardCheck size={18} />} label="Questões" onClick={() => router.push('/questoes')} />
              <MenuItem icon={<CalendarDays size={18} />} label="Agenda" onClick={() => router.push('/agenda')} />
              <MenuItem icon={<LineChart size={18} />} label="Desempenho" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<Calendar size={18} />} label="Revisões" onClick={() => router.push('/revisoes')} />
              <MenuItem icon={<Settings size={18} />} label="Configurações" onClick={() => router.push('/configuracoes')} />
              <MenuItem icon={<User size={18} />} label="Perfil" onClick={() => router.push('/perfil')} />
            </nav>
          </div>
          <div className="p-4">
            <button onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-red-500/15 hover:text-red-200">
              <div className="rounded-lg bg-white/10 p-1.5 transition-colors group-hover:bg-red-500/20"><LogOut size={18} /></div>
              Sair
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <header className="mb-6 flex items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setSidebarAberta(true)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Evolução do estudo</p>
                <h1 className="truncate text-lg font-black text-slate-800">Desempenho</h1>
              </div>
            </div>
          </header>

          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Calculando seu desempenho..." />
          ) : erro ? (
            <EmptyState icon={<BarChart3 size={26} />} title={erro} />
          ) : dados ? (
            <div className="grid grid-cols-12 gap-5 pb-8">
              <Metric icon={<Clock size={20} />} label="Horas estudadas" value={`${dados.resumo.horasTotais}h`} />
              <Metric icon={<Target size={20} />} label="Sessões concluídas" value={String(dados.resumo.sessoesConcluidas)} />
              <Metric icon={<BookOpen size={20} />} label="Tópicos concluídos" value={String(dados.resumo.topicosConcluidos)} />
              <Metric icon={<TrendingUp size={20} />} label="Disciplinas ativas" value={String(dados.resumo.disciplinasComProgresso)} />

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Central de inteligência</p>
                <h2 className="mt-1 text-xl font-black">{tendenciaTexto}</h2>
                <div className="mt-5 space-y-3">
                  {(dados.inteligencia.recomendacoes.length > 0 ? dados.inteligencia.recomendacoes : ['Continue registrando sessões para gerar recomendações automáticas.']).map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-sm font-bold leading-relaxed text-slate-100">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Pontos fracos</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Prioridades por disciplina</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {dados.inteligencia.pontosFracos.length === 0 ? <p className="text-sm font-semibold text-slate-500">Ainda não há pontos fracos suficientes para destacar.</p> : dados.inteligencia.pontosFracos.map((item) => (
                    <div key={item.idDisciplina} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">{item.nome}</p>
                          <p className="text-xs font-semibold text-slate-400">{item.motivo}</p>
                        </div>
                        <span className="text-sm font-black text-amber-600">{item.percentual}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-sky-400" style={{ width: `${Math.min(100, item.percentual)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Últimos 7 dias</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Ritmo semanal</h2>
                <div className="mt-6 flex h-56 items-end gap-3">
                  {dados.semana.map((dia) => (
                    <div key={dia.data} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-44 w-full items-end rounded-2xl bg-slate-100/80 p-1">
                        <div className="w-full rounded-xl bg-linear-to-t from-sky-500 to-emerald-300" style={{ height: `${Math.max(8, (dia.minutos / maiorMinutoSemana) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{new Date(`${dia.data}T00:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className="text-xs font-black text-slate-700">{Math.round(dia.minutos / 60)}h</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Atenção recomendada</p>
                <h2 className="mt-1 text-xl font-black">Disciplinas críticas</h2>
                <div className="mt-5 space-y-3">
                  {disciplinasCriticas.length === 0 ? <p className="text-sm font-semibold text-slate-300">Conclua sessões para gerar este ranking.</p> : disciplinasCriticas.map((disciplina) => (
                    <ProgressRow key={disciplina.idDisciplina} nome={disciplina.nome} percentual={disciplina.percentual} detalhe={`${disciplina.topicosConcluidos} tópicos`} dark />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Desempenho por tópico</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {dados.inteligencia.topicos.length === 0 ? <p className="text-sm font-semibold text-slate-500">Tópicos concluídos aparecerão aqui.</p> : dados.inteligencia.topicos.map((item) => (
                    <div key={item.idTopico} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="text-sm font-black text-slate-800">{item.disciplina}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.topico}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {item.concluidoEm ? new Date(item.concluidoEm).toLocaleDateString('pt-BR') : 'Concluído'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Questões</p>
                <h2 className="mt-1 text-xl font-black">Aproveitamento por disciplina</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {!questoes || questoes.disciplinas.length === 0 ? <p className="text-sm font-semibold text-slate-300">Registre questões pela API para o assistente calibrar recomendações.</p> : questoes.disciplinas.map((item) => (
                    <div key={item.idDisciplina} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{item.disciplina}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-300">{item.acertos}/{item.total} acertos · {item.erros} erros</p>
                        </div>
                        <span className={`text-sm font-black ${item.percentual < 65 ? 'text-amber-300' : 'text-emerald-300'}`}>{item.percentual}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full rounded-full bg-linear-to-r from-amber-300 to-emerald-300" style={{ width: `${Math.min(100, item.percentual)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Progresso por disciplina</p>
                <div className="mt-5 space-y-3">
                  {dados.disciplinas.length === 0 ? <p className="text-sm font-semibold text-slate-500">Ainda não há progresso registrado.</p> : dados.disciplinas.map((disciplina) => (
                    <ProgressRow key={disciplina.idDisciplina} nome={disciplina.nome} percentual={disciplina.percentual} detalhe={`${disciplina.sessoes} sessões | ${Math.round(disciplina.minutos / 60)}h`} />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Histórico recente</p>
                <div className="mt-5 space-y-3">
                  {dados.recentes.length === 0 ? <p className="text-sm font-semibold text-slate-500">Suas sessões concluídas aparecerão aqui.</p> : dados.recentes.map((sessao) => (
                    <div key={sessao.idSessao} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="text-sm font-black text-slate-800">{sessao.disciplina}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{sessao.topico}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">{sessao.minutos} min | {new Date(sessao.inicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
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

function ProgressRow({ nome, percentual, detalhe, dark = false }: { nome: string; percentual: number; detalhe: string; dark?: boolean }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className={`truncate text-sm font-black ${dark ? 'text-white' : 'text-slate-800'}`}>{nome}</p><p className={`text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-400'}`}>{detalhe}</p></div><span className={`text-sm font-black ${dark ? 'text-emerald-300' : 'text-sky-600'}`}>{percentual}%</span></div><div className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-slate-100'}`}><div className="h-full rounded-full bg-linear-to-r from-sky-500 to-emerald-300" style={{ width: `${Math.min(100, percentual)}%` }} /></div></div>;
}

function EmptyState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/75 text-center shadow-xl shadow-slate-200/60 backdrop-blur-xl"><div className="text-sky-500">{icon}</div><p className="text-sm font-black text-slate-500">{title}</p></div>;
}

