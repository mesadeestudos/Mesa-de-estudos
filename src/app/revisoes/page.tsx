'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';
import MetricCard from '@/src/components/ui/MetricCard';

interface RevisaoItem {
  idTopico: number;
  idDisciplina: number;
  disciplina: string;
  topico: string;
  intervaloDias: number;
  etapa: number;
  vencimento: string;
  atrasada: boolean;
  hoje: boolean;
  motivo: string;
  explicacao: string;
  statusAnterior: string | null;
  diasDesdeBase: number;
}

interface RevisoesData {
  pendentes: RevisaoItem[];
  proximas: RevisaoItem[];
  resumo: { pendentes: number; atrasadas: number; proximas: number };
}

export default function RevisoesPage() {
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState<RevisoesData | null>(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/revisoes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Nao foi possivel carregar suas revisoes.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar suas revisoes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const concluirRevisao = async (idTopico: number, resultado: 'facil' | 'medio' | 'dificil' | 'errei') => {
    setRegistrando(idTopico);
    setErro('');
    try {
      const res = await fetch('/api/revisoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idTopico, duracaoMinutos: 20, resultado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Nao foi possivel registrar a revisao.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel registrar a revisao.');
    } finally {
      setRegistrando(null);
    }
  };

  return (
    <AppShell active="revisoes" title="Revisoes" eyebrow="Memorizacao ativa">
      {carregando ? (
        <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Montando sua fila de revisoes..." />
      ) : erro ? (
        <EmptyState icon={<AlertTriangle size={26} />} title={erro} />
      ) : dados ? (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <MetricCard icon={<Calendar size={20} />} label="Pendentes" value={String(dados.resumo.pendentes)} tone="sky" className="col-span-4" />
          <MetricCard icon={<AlertTriangle size={20} />} label="Atrasadas" value={String(dados.resumo.atrasadas)} tone="amber" className="col-span-4" />
          <MetricCard icon={<Clock size={20} />} label="Proximas" value={String(dados.resumo.proximas)} tone="emerald" className="col-span-4" />

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-7">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Fila de hoje</p>
            <h2 className="mt-1 text-xl font-black">Revisoes pendentes</h2>
            <div className="mt-5 space-y-3">
              {dados.pendentes.length === 0 ? (
                <p className="text-sm font-semibold text-slate-300">Nenhuma revisao pendente agora. Bom sinal.</p>
              ) : dados.pendentes.map(item => (
                <RevisaoCard
                  key={`${item.idTopico}-${item.intervaloDias}`}
                  item={item}
                  dark
                  loading={registrando === item.idTopico}
                  onConcluir={(resultado) => concluirRevisao(item.idTopico, resultado)}
                />
              ))}
            </div>
          </section>

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Proximos 14 dias</p>
            <h2 className="mt-1 text-xl font-black text-slate-800">Revisoes futuras</h2>
            <div className="mt-5 space-y-3">
              {dados.proximas.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">Conclua topicos para gerar revisoes futuras.</p>
              ) : dados.proximas.map(item => (
                <RevisaoCard key={`${item.idTopico}-${item.intervaloDias}`} item={item} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

function RevisaoCard({ item, dark = false, loading = false, onConcluir }: { item: RevisaoItem; dark?: boolean; loading?: boolean; onConcluir?: (resultado: 'facil' | 'medio' | 'dificil' | 'errei') => void }) {
  const dificuldadeHistorica = {
    REVISAO_FACIL: 'Histórico: fácil',
    REVISAO_MEDIO: 'Histórico: médio',
    REVISAO_DIFICIL: 'Histórico: difícil',
    REVISAO_ERREI: 'Histórico: errou',
    REVISAO: 'Histórico: revisado',
  }[item.statusAnterior ?? ''] ?? 'Primeira revisão';
  const botoes = [
    { label: 'Facil', value: 'facil' as const, cls: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300' },
    { label: 'Medio', value: 'medio' as const, cls: 'bg-sky-400 text-slate-950 hover:bg-sky-300' },
    { label: 'Dificil', value: 'dificil' as const, cls: 'bg-amber-400 text-slate-950 hover:bg-amber-300' },
    { label: 'Errei', value: 'errei' as const, cls: 'bg-red-400 text-white hover:bg-red-300' },
  ];

  return (
    <div className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-white/10' : 'border-slate-100 bg-white/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-black ${dark ? 'text-white' : 'text-slate-800'}`}>{item.disciplina}</p>
          <p className={`mt-1 line-clamp-2 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{item.topico}</p>
          <p className={`mt-2 text-[10px] font-black uppercase tracking-widest ${item.atrasada ? 'text-amber-400' : dark ? 'text-sky-200' : 'text-sky-600'}`}>
            etapa {item.etapa} | {item.intervaloDias} dias | {new Date(item.vencimento).toLocaleDateString('pt-BR')}
          </p>
          <p className={`mt-1 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-emerald-200' : 'text-emerald-600'}`}>
            {dificuldadeHistorica} | {item.diasDesdeBase} dia(s) desde a base
          </p>
          <p className={`mt-2 text-xs font-semibold ${dark ? 'text-sky-100/80' : 'text-slate-500'}`}>
            {item.explicacao}
          </p>
        </div>
        {onConcluir && (
          <div className="grid shrink-0 grid-cols-2 gap-1.5">
            {botoes.map(botao => (
              <button
                key={botao.value}
                onClick={() => onConcluir(botao.value)}
                disabled={loading}
                className={`flex items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[10px] font-black transition disabled:opacity-60 ${botao.cls}`}
              >
                {loading ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
                {botao.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
