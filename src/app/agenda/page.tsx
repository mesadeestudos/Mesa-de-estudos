'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, CalendarDays, CheckCircle2,
  Clock, RefreshCw, Target, AlertTriangle, ChevronRight,
} from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';
import MetricCard from '@/src/components/ui/MetricCard';

interface AgendaData {
  assistente: {
    titulo: string;
    mensagem: string;
    destino: string;
    tipo: string;
    explicacao?: { principal: string; sinaisUsados: string[]; alternativas: string[] };
  };
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
  ajustes: {
    configuracaoPendente: boolean;
    pausaAtiva: { dataInicio: string; dataFim: string; motivo: string | null } | null;
    metaTemporaria: { dataInicio: string; dataFim: string; horasPorDia: number | null; motivo: string | null } | null;
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
  const [carregando, setCarregando] = useState(true);
  const [remarcando, setRemarcando] = useState(false);
  const [salvandoAjuste, setSalvandoAjuste] = useState(false);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<AgendaData | null>(null);
  const hojeInput = new Date().toISOString().slice(0, 10);
  const [pausaFim, setPausaFim] = useState(hojeInput);
  const [metaFim, setMetaFim] = useState(hojeInput);
  const [metaHoras, setMetaHoras] = useState(1);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel carregar a agenda.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel carregar a agenda.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const remarcarSessao = async (ordem?: number) => {
    setRemarcando(true);
    setErro('');
    try {
      const res = await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'remarcar', ordem }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel remarcar a sessÃ£o.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel remarcar a sessÃ£o.');
    } finally {
      setRemarcando(false);
    }
  };

  const criarAjuste = async (tipo: 'PAUSA' | 'META_TEMPORARIA') => {
    setSalvandoAjuste(true);
    setErro('');
    try {
      const res = await fetch('/api/ajustes-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          dataInicio: hojeInput,
          dataFim: tipo === 'PAUSA' ? pausaFim : metaFim,
          horasPorDia: tipo === 'META_TEMPORARIA' ? metaHoras : null,
          motivo: tipo === 'PAUSA' ? 'Pausa criada pela Agenda' : 'Meta reduzida pela Agenda',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel salvar o ajuste.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel salvar o ajuste.');
    } finally {
      setSalvandoAjuste(false);
    }
  };

  const pctSemana = dados?.semana.metaMinutos ? Math.min(100, Math.round((dados.semana.minutosRegistrados / dados.semana.metaMinutos) * 100)) : 0;

  return (
    <AppShell active="agenda" title="Agenda" eyebrow="Planejamento automatico">
      {carregando ? (
        <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Organizando sua agenda..." />
      ) : erro ? (
        <EmptyState icon={<AlertTriangle size={26} />} title={erro} />
      ) : dados ? (
        <div className="grid grid-cols-12 gap-5 pb-8">
              <section className="col-span-12 rounded-[32px] border border-emerald-100 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">OrientaÃ§Ã£o inteligente</p>
                    <h2 className="mt-1 text-xl font-black text-slate-800">{dados.assistente.titulo}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{dados.assistente.mensagem}</p>
                    {dados.assistente.explicacao && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                        <p className="text-xs font-black text-slate-700">{dados.assistente.explicacao.principal}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          Sinais: {dados.assistente.explicacao.sinaisUsados.join(' Â· ') || 'sem sinais adicionais'}
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => router.push(dados.assistente.destino)} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white transition-all hover:bg-emerald-600">
                    Abrir tarefa <ChevronRight size={16} />
                  </button>
                </div>
              </section>

              <MetricCard icon={<Target size={20} />} label="Meta semanal" value={`${Math.round(dados.semana.metaMinutos / 60)}h`} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<Clock size={20} />} label="Registrado" value={`${Math.round(dados.semana.minutosRegistrados / 60)}h`} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<CheckCircle2 size={20} />} label="Progresso" value={`${pctSemana}%`} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<BookOpen size={20} />} label="Topicos restantes" value={String(dados.edital.topicosRestantes)} className="col-span-6 lg:col-span-3" />

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Plano do dia</p>
                <h2 className="mt-1 text-xl font-black">Hoje</h2>
                <div className="mt-5 space-y-3">
                  {dados.planoHoje.sessoesPrevistas.length === 0 ? <p className="text-sm font-semibold text-slate-300">Crie um ciclo para gerar sessÃµes previstas.</p> : dados.planoHoje.sessoesPrevistas.map(item => (
                    <div key={`${item.ordem}-${item.disciplina}`} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-sm font-black text-white">{item.ordem}. {item.disciplina}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{item.minutos} min previstos</p>
                      <button onClick={() => remarcarSessao(item.ordem)} disabled={remarcando} className="mt-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] font-black text-sky-800 transition-all hover:bg-white disabled:opacity-60">
                        Remarcar esta sessÃ£o
                      </button>
                    </div>
                  ))}
                  <button onClick={() => remarcarSessao()} disabled={remarcando || dados.planoHoje.sessoesPrevistas.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-sky-800 transition-all hover:bg-sky-50 disabled:opacity-60">
                    {remarcando ? <RefreshCw className="animate-spin" size={16} /> : <CalendarDays size={16} />}
                    Remarcar sessÃ£o atual
                  </button>
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Semana</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">HistÃ³rico e dias sem estudo</h2>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {dados.semana.dias.map(dia => (
                    <div key={dia.data} className={`rounded-2xl border p-3 text-center ${dia.semEstudo ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white/80'}`}>
                      <p className="text-[10px] font-black uppercase text-slate-400">{dia.label}</p>
                      <p className="mt-2 text-lg font-black text-slate-800">{Math.round(dia.minutos / 60)}h</p>
                      <p className="text-[10px] font-bold text-slate-500">{dia.sessoes} sessÃµes</p>
                      {dia.revisoes > 0 && <p className="mt-1 text-[10px] font-black text-sky-600">{dia.revisoes} rev.</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">RevisÃµes</p>
                <div className="mt-5 space-y-3">
                  {[...dados.revisoes.vencidas, ...dados.revisoes.futuras].slice(0, 8).map(item => (
                    <div key={`${item.idTopico}-${item.vencimento}`} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <p className="text-sm font-black text-slate-800">{item.disciplina}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.topico}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-sky-600">{new Date(item.vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ))}
                  {dados.revisoes.vencidas.length + dados.revisoes.futuras.length === 0 && <p className="text-sm font-semibold text-slate-500">Nenhuma revisÃ£o programada agora.</p>}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Edital e questÃµes</p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InfoCard title="Prova" value={dados.edital.dataProva ? new Date(dados.edital.dataProva).toLocaleDateString('pt-BR') : 'A definir'} detail={[dados.edital.cargo, dados.edital.concurso || dados.edital.banca].filter(Boolean).join(' Â· ') || 'Sem edital ativo'} />
                  <InfoCard title="ConclusÃ£o prevista" value={dados.edital.conclusaoPrevista ? new Date(dados.edital.conclusaoPrevista).toLocaleDateString('pt-BR') : 'A definir'} detail="Estimativa pelo ritmo atual do ciclo" />
                  <InfoCard title="QuestÃµes recomendadas" value={dados.planoHoje.questaoRecomendada?.disciplina ?? 'Sem dados'} detail={dados.planoHoje.questaoRecomendada ? `${dados.planoHoje.questaoRecomendada.percentual}% de aproveitamento` : 'Registre questÃµes para calibrar'} />
                  <InfoCard title="AÃ§Ã£o" value={dados.assistente.tipo} detail="Definida pelo assistente" />
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Ajustes de rotina</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">Pausa e meta temporÃ¡ria</h2>
                {dados.ajustes.configuracaoPendente && (
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    A tabela de ajustes do plano ainda nÃ£o existe no banco. Execute o SQL de criaÃ§Ã£o para ativar pausa e meta temporÃ¡ria.
                  </p>
                )}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-black text-slate-800">Pausar plano</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Use quando nÃ£o puder estudar por alguns dias.</p>
                    <input type="date" value={pausaFim} onChange={e => setPausaFim(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700" />
                    <button onClick={() => criarAjuste('PAUSA')} disabled={salvandoAjuste || dados.ajustes.configuracaoPendente} className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-slate-800 disabled:opacity-60">
                      Pausar atÃ© esta data
                    </button>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-sm font-black text-slate-800">Reduzir meta temporariamente</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">A Agenda recalcula a meta semanal pelo perÃ­odo.</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <input type="number" min={1} max={12} value={metaHoras} onChange={e => setMetaHoras(Number(e.target.value))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700" />
                      <input type="date" value={metaFim} onChange={e => setMetaFim(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700" />
                    </div>
                    <button onClick={() => criarAjuste('META_TEMPORARIA')} disabled={salvandoAjuste || dados.ajustes.configuracaoPendente} className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-emerald-600 disabled:opacity-60">
                      Aplicar meta temporÃ¡ria
                    </button>
                  </div>
                </div>
              </section>
            </div>
      ) : null}
    </AppShell>
  );
}

function InfoCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p><p className="mt-2 text-lg font-black text-slate-800">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></div>;
}
