'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FileCheck2, RefreshCw } from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';

interface SimuladosData {
  configuracaoPendente?: boolean;
  simulados: Array<{ id: number; titulo: string; dataRealizacao: string; totalQuestoes: number; totalAcertos: number; percentual: number }>;
  disciplinas: Array<{ disciplina: string; percentual: number; totalAcertos: number; totalQuestoes: number }>;
  analise: { mensagem: string; sugestoes: string[]; quedaRecente: boolean };
}

export default function SimuladosPage() {
  const [dados, setDados] = useState<SimuladosData | null>(null);
  const [form, setForm] = useState({ titulo: 'Simulado', dataRealizacao: new Date().toISOString().slice(0, 10), totalQuestoes: 80, totalAcertos: 0, observacao: '' });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    const res = await fetch('/api/simulados');
    const data = await res.json();
    setDados(data);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const registrar = async () => {
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/simulados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível registrar o simulado.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível registrar o simulado.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell active="simulados" title="Simulados" eyebrow="Análise de evolução">
      {carregando ? (
        <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Carregando simulados..." />
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">Registrar simulado</p>
            <div className="mt-5 space-y-3">
              <Input label="Título" value={form.titulo} onChange={titulo => setForm(prev => ({ ...prev, titulo }))} />
              <Input label="Data" type="date" value={form.dataRealizacao} onChange={dataRealizacao => setForm(prev => ({ ...prev, dataRealizacao }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total" type="number" value={String(form.totalQuestoes)} onChange={totalQuestoes => setForm(prev => ({ ...prev, totalQuestoes: Number(totalQuestoes) }))} />
                <Input label="Acertos" type="number" value={String(form.totalAcertos)} onChange={totalAcertos => setForm(prev => ({ ...prev, totalAcertos: Number(totalAcertos) }))} />
              </div>
              <button onClick={registrar} disabled={salvando || dados?.configuracaoPendente} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60">
                {salvando ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Registrar simulado
              </button>
              {erro && <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{erro}</p>}
            </div>
          </section>

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 lg:col-span-7">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Leitura do assistente</p>
            <h2 className="mt-2 text-2xl font-black text-slate-800">{dados?.analise.mensagem}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(dados?.analise.sugestoes ?? []).map(item => <span key={item} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">{item}</span>)}
            </div>
            {dados?.configuracaoPendente && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">Execute scripts/create-ia-orientadora-tables.sql para ativar simulados.</p>}
          </section>

          {(dados?.simulados ?? []).length === 0 ? (
            <div className="col-span-12"><EmptyState icon={<FileCheck2 size={26} />} title="Nenhum simulado registrado. O histórico aparecerá aqui com queda recente e tendência de evolução." /></div>
          ) : dados?.simulados.map(item => (
            <article key={item.id} className="col-span-12 rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-lg shadow-slate-200/60 md:col-span-4">
              <p className="text-sm font-black text-slate-800">{item.titulo}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{new Date(item.dataRealizacao).toLocaleDateString('pt-BR')} · {item.totalAcertos}/{item.totalQuestoes}</p>
              <p className={`mt-4 text-3xl font-black ${item.percentual < 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{item.percentual}%</p>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none" /></label>;
}
