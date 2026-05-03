'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, CheckCircle2, RefreshCw, Target, XCircle, Pencil,
} from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';
import MetricCard from '@/src/components/ui/MetricCard';

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
  opcoes?: {
    topicos: Array<{ idDisciplina: number; disciplina: string; idTopico: number; topico: string }>;
  };
}

export default function QuestoesPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [dados, setDados] = useState<QuestoesData | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaCiclo[]>([]);
  const [idDisciplina, setIdDisciplina] = useState('');
  const [idTopico, setIdTopico] = useState('');
  const [total, setTotal] = useState(10);
  const [acertos, setAcertos] = useState(0);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const [questoesRes, cicloRes] = await Promise.all([
        fetch('/api/questoes'),
        fetch('/api/ciclos'),
      ]);
      const questoesData = await questoesRes.json();
      if (!questoesRes.ok) throw new Error(questoesData.message || 'NÃ£o foi possÃ­vel carregar questÃµes.');
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
      setErro(error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel carregar questÃµes.');
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
  const topicosDisponiveis = useMemo(
    () => (dados?.opcoes?.topicos ?? []).filter(item => String(item.idDisciplina) === idDisciplina),
    [dados, idDisciplina],
  );

  const registrar = async () => {
    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      const res = await fetch('/api/questoes', {
        method: editandoId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editandoId ?? undefined,
          idDisciplina: Number(idDisciplina),
          idTopico: idTopico ? Number(idTopico) : null,
          total,
          acertos,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'NÃ£o foi possÃ­vel registrar as questÃµes.');
      setSucesso(`${editandoId ? 'Bateria atualizada' : 'Bateria registrada'} com ${data.percentual}% de aproveitamento.`);
      setEditandoId(null);
      setIdTopico('');
      setAcertos(0);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'NÃ£o foi possÃ­vel registrar as questÃµes.');
    } finally {
      setSalvando(false);
    }
  };

  const iniciarEdicao = (item: QuestoesData['recentes'][number]) => {
    const disciplina = dados?.disciplinas.find(d => d.disciplina === item.disciplina);
    if (disciplina) setIdDisciplina(String(disciplina.idDisciplina));
    const topico = dados?.opcoes?.topicos.find(opcao => opcao.topico === item.topico && opcao.disciplina === item.disciplina);
    setIdTopico(topico ? String(topico.idTopico) : '');
    setTotal(item.total);
    setAcertos(item.acertos);
    setEditandoId(item.id);
    setSucesso('');
    setErro('');
  };


  return (
    <AppShell active="questoes" title="Questoes" eyebrow="Pratica inteligente">
          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Carregando suas questÃµes..." />
          ) : (
            <div className="grid grid-cols-12 gap-5 pb-8">
              <MetricCard icon={<Target size={20} />} label="Questoes feitas" value={String(resumo.totalQuestoes)} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<CheckCircle2 size={20} />} label="Acertos" value={String(resumo.totalAcertos)} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<XCircle size={20} />} label="Erros" value={String(resumo.erros)} className="col-span-6 lg:col-span-3" />
              <MetricCard icon={<BarChart3 size={20} />} label="Aproveitamento" value={`${resumo.percentual}%`} className="col-span-6 lg:col-span-3" />

              {dados?.configuracaoPendente && (
                <section className="col-span-12 rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-xl shadow-amber-100/50">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">ConfiguraÃ§Ã£o pendente</p>
                      <h2 className="mt-1 text-lg font-black text-slate-800">A tabela de questÃµes ainda nÃ£o existe no banco.</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-600">Depois de criar a tabela, esta tela registra acertos, erros, histÃ³rico e diagnÃ³sticos automaticamente.</p>
                    </div>
                    <button onClick={() => router.push('/desempenho')} className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-amber-700 shadow-sm transition-all hover:bg-amber-100">
                      Ver desempenho
                    </button>
                  </div>
                </section>
              )}

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Registrar bateria</p>
                <h2 className="mt-1 text-xl font-black">Como foi sua prÃ¡tica?</h2>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Disciplina</span>
                    <select value={idDisciplina} onChange={e => setIdDisciplina(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none">
                      {disciplinas.length === 0 ? <option value="">Crie um ciclo primeiro</option> : disciplinas.map(item => (
                        <option key={item.idDisciplina} value={item.idDisciplina} className="text-slate-900">{item.nome}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">TÃ³pico</span>
                    <select value={idTopico} onChange={e => setIdTopico(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none">
                      <option value="" className="text-slate-900">Sem tÃ³pico especÃ­fico</option>
                      {topicosDisponiveis.map(item => (
                        <option key={item.idTopico} value={item.idTopico} className="text-slate-900">{item.topico}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Total" value={total} onChange={setTotal} min={1} />
                    <NumberField label="Acertos" value={acertos} onChange={setAcertos} min={0} max={total} />
                  </div>
                  <button onClick={registrar} disabled={salvando || !idDisciplina || acertos > total || dados?.configuracaoPendente} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition-all hover:bg-emerald-300 disabled:opacity-60">
                    {salvando ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {editandoId ? 'Atualizar lanÃ§amento' : 'Registrar questÃµes'}
                  </button>
                  {editandoId && (
                    <button onClick={() => { setEditandoId(null); setIdTopico(''); setAcertos(0); }} className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-black text-white transition-all hover:bg-white/15">
                      Cancelar ediÃ§Ã£o
                    </button>
                  )}
                  {erro && <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{erro}</p>}
                  {sucesso && <p className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-bold text-emerald-100">{sucesso}</p>}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">DiagnÃ³stico automÃ¡tico</p>
                <h2 className="mt-1 text-xl font-black text-slate-800">
                  {disciplinaCritica ? `Priorize ${disciplinaCritica.disciplina}` : 'Registre questÃµes para gerar diagnÃ³stico'}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {disciplinaCritica
                    ? `Aproveitamento atual de ${disciplinaCritica.percentual}% com ${disciplinaCritica.erros} erros registrados.`
                    : 'O assistente usarÃ¡ seus acertos e erros para ajustar recomendaÃ§Ãµes.'}
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {(dados?.disciplinas ?? []).map(item => (
                    <ProgressCard key={item.idDisciplina} title={item.disciplina} detail={`${item.acertos}/${item.total} acertos Â· ${item.sessoes} baterias`} value={item.percentual} />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Pontos fracos</p>
                <div className="mt-5 space-y-3">
                  {topicosCriticos.length === 0 ? <p className="text-sm font-semibold text-slate-500">Os tÃ³picos com maior erro aparecerÃ£o aqui.</p> : topicosCriticos.map(item => (
                    <ProgressCard key={`${item.idTopico}-${item.disciplina}`} title={item.disciplina} detail={item.topico} value={item.percentual} compact />
                  ))}
                </div>
              </section>

              <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-6">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">HistÃ³rico recente</p>
                <div className="mt-5 space-y-3">
                  {(dados?.recentes ?? []).length === 0 ? <p className="text-sm font-semibold text-slate-500">Suas baterias recentes aparecerÃ£o aqui.</p> : dados?.recentes.map(item => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-800">{item.disciplina}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{item.acertos}/{item.total} acertos Â· {new Date(item.dataRegistro).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`text-sm font-black ${item.percentual < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{item.percentual}%</span>
                          <button onClick={() => iniciarEdicao(item)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-sky-200 hover:text-sky-600">
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
    </AppShell>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max?: number }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span><input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none" /></label>;
}

function ProgressCard({ title, detail, value, compact = false }: { title: string; detail: string; value: number; compact?: boolean }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{title}</p><p className={`${compact ? 'line-clamp-2' : 'truncate'} text-xs font-semibold text-slate-500`}>{detail}</p></div><span className={`text-sm font-black ${value < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-400" style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}
