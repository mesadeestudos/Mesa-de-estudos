'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Bell, BookOpen, Calendar, CalendarDays, CheckCircle2, ClipboardCheck,
  FileCheck2, LayoutDashboard, Lightbulb, LineChart, LogOut, Menu, MessageCircle,
  NotebookTabs, Pencil, RefreshCw, Settings, Target, User, XCircle,
} from 'lucide-react';
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
  diagnostico?: {
    piorDisciplina: {
      idDisciplina: number;
      disciplina: string;
      total: number;
      acertos: number;
      erros: number;
      percentual: number;
      sessoes: number;
    } | null;
    piorTopico: {
      idTopico: number | null;
      topico: string;
      disciplina: string;
      total: number;
      acertos: number;
      erros: number;
      percentual: number;
    } | null;
    quedaRecente: Array<{ percentual: number; disciplina: string; topico: string }>;
    sugestao: string;
    recomendacaoTeorica: boolean;
  };
  opcoes?: {
    topicos: Array<{ idDisciplina: number; disciplina: string; idTopico: number; topico: string }>;
  };
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
  const [idTopico, setIdTopico] = useState('');
  const [total, setTotal] = useState(10);
  const [acertos, setAcertos] = useState(0);
  const [motivoErro, setMotivoErro] = useState('NAO_INFORMADO');
  const [confianca, setConfianca] = useState('MEDIA');
  const [observacao, setObservacao] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  };

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
          motivoErro,
          confianca,
          observacao: observacao || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível registrar as questões.');
      setSucesso(`${editandoId ? 'Bateria atualizada' : 'Bateria registrada'} com ${data.percentual}% de aproveitamento.`);
      setEditandoId(null);
      setIdTopico('');
      setAcertos(0);
      setMotivoErro('NAO_INFORMADO');
      setConfianca('MEDIA');
      setObservacao('');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar as questões.');
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
    setMotivoErro('NAO_INFORMADO');
    setConfianca('MEDIA');
    setEditandoId(item.id);
    setSucesso('');
    setErro('');
  };


  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#475569] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      <div className="relative flex h-full w-full overflow-hidden">
        {sidebarAberta && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarAberta(false)} />
        )}

        <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex min-h-0 grow flex-col items-center overflow-hidden">
            <div className="w-full shrink-0 px-4 pb-3 pt-4">
              <div className="rounded-[20px] border border-white/10 bg-white/95 px-4 py-2.5 shadow-xl shadow-sky-950/20">
                <img src="/logo_azul.png" alt="Logo" className="mx-auto h-16 w-auto" />
              </div>
            </div>
            <nav className="w-full space-y-0.5 px-3">
              <MenuItem icon={<LayoutDashboard size={18} />} label="Visão Geral" active={false} onClick={() => router.push('/dashboard')} />
              <MenuItem icon={<BookOpen size={18} />} label="Minha Mesa" active={false} onClick={() => router.push('/minha-mesa')} />
              <MenuItem icon={<RefreshCw size={18} />} label="Ciclos de estudo" active={false} onClick={() => router.push('/ciclos')} />
              <MenuItem icon={<ClipboardCheck size={18} />} label="Questões" active onClick={() => setSidebarAberta(false)} />
              <MenuItem icon={<NotebookTabs size={18} />} label="Caderno de erros" active={false} onClick={() => router.push('/caderno-erros')} />
              <MenuItem icon={<FileCheck2 size={18} />} label="Simulados" active={false} onClick={() => router.push('/simulados')} />
              <MenuItem icon={<MessageCircle size={18} />} label="Assistente IA" active={false} onClick={() => router.push('/assistente')} />
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
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Prática inteligente</p>
                <h1 className="truncate text-lg font-black text-slate-800">Questões</h1>
              </div>
            </div>
            <div className="flex gap-4 border-r border-slate-200 pr-6">
              <HeaderIcon icon={<Bell size={18} />} label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" onClick={() => router.push('/configuracoes')} />
            </div>
          </header>

          {carregando ? (
            <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Carregando suas questões..." />
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
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Tópico</span>
                    <select value={idTopico} onChange={e => setIdTopico(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none">
                      <option value="" className="text-slate-900">Sem tópico específico</option>
                      {topicosDisponiveis.map(item => (
                        <option key={item.idTopico} value={item.idTopico} className="text-slate-900">{item.topico}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Total" value={total} onChange={setTotal} min={1} />
                    <NumberField label="Acertos" value={acertos} onChange={setAcertos} min={0} max={total} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Principal motivo"
                      value={motivoErro}
                      onChange={setMotivoErro}
                      options={[
                        ['NAO_INFORMADO', 'Não informado'],
                        ['FALTA_TEORIA', 'Falta de teoria'],
                        ['DISTRACAO', 'Distração'],
                        ['INTERPRETACAO', 'Interpretação'],
                        ['DECOREBA', 'Decoreba'],
                        ['CHUTE_ACERTEI', 'Chutei e acertei'],
                      ]}
                    />
                    <SelectField
                      label="Confiança"
                      value={confianca}
                      onChange={setConfianca}
                      options={[
                        ['BAIXA', 'Baixa'],
                        ['MEDIA', 'Média'],
                        ['ALTA', 'Alta'],
                        ['CHUTE', 'Chute'],
                      ]}
                    />
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Observação</span>
                    <textarea value={observacao} onChange={e => setObservacao(e.target.value)} className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none" placeholder="Ex.: errei por confundir exceção com regra geral." />
                  </label>
                  <button onClick={registrar} disabled={salvando || !idDisciplina || acertos > total || dados?.configuracaoPendente} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition-all hover:bg-emerald-300 disabled:opacity-60">
                    {salvando ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {editandoId ? 'Atualizar lançamento' : 'Registrar questões'}
                  </button>
                  {editandoId && (
                    <button onClick={() => { setEditandoId(null); setIdTopico(''); setAcertos(0); }} className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-black text-white transition-all hover:bg-white/15">
                      Cancelar edição
                    </button>
                  )}
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
                {dados?.diagnostico && (
                  <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-700">Sinal para o assistente</p>
                    <p className="mt-2 text-sm font-black text-slate-800">{dados.diagnostico.sugestao}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {dados.diagnostico.recomendacaoTeorica
                        ? 'Como o aproveitamento esta baixo por topico, o sistema recomenda teoria antes de outra bateria.'
                        : 'Esses dados entram no motor de decisao da Minha Mesa, Agenda e Dashboard.'}
                    </p>
                  </div>
                )}
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

function HeaderIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex shrink-0 flex-col items-center gap-0.5">
      <div className="text-slate-400 transition-colors group-hover:text-sky-500">{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400 lg:text-[11px]">{label}</span>
    </button>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max?: number }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span><input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white outline-none">{options.map(([optionValue, labelText]) => <option key={optionValue} value={optionValue} className="text-slate-900">{labelText}</option>)}</select></label>;
}

function ProgressCard({ title, detail, value, compact = false }: { title: string; detail: string; value: number; compact?: boolean }) {
  return <div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-slate-800">{title}</p><p className={`${compact ? 'line-clamp-2' : 'truncate'} text-xs font-semibold text-slate-500`}>{detail}</p></div><span className={`text-sm font-black ${value < 65 ? 'text-amber-600' : 'text-emerald-600'}`}>{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-400" style={{ width: `${Math.min(100, value)}%` }} /></div></div>;
}
