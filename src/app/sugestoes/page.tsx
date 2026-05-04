'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lightbulb, Loader2, MessageSquarePlus, RefreshCw, Send } from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';
import MetricCard from '@/src/components/ui/MetricCard';

interface Sugestao {
  id: number;
  categoria: string;
  prioridade: string;
  titulo: string;
  descricao: string;
  status: string;
  paginaOrigem: string | null;
  dataCriacao: string;
}

interface SugestoesData {
  configuracaoPendente: boolean;
  sugestoes: Sugestao[];
}

const CATEGORIAS = [
  { value: 'MELHORIA', label: 'Melhoria' },
  { value: 'BUG', label: 'Erro ou bug' },
  { value: 'CONTEUDO', label: 'Conteúdo' },
  { value: 'USABILIDADE', label: 'Usabilidade' },
  { value: 'OUTRO', label: 'Outro' },
];

const PRIORIDADES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'ALTA', label: 'Alta' },
];

export default function SugestoesPage() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [dados, setDados] = useState<SugestoesData | null>(null);
  const [form, setForm] = useState({
    categoria: 'MELHORIA',
    prioridade: 'NORMAL',
    titulo: '',
    descricao: '',
    paginaOrigem: '',
  });

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/sugestoes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível carregar sugestões.');
      setDados(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar sugestões.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = useMemo(() => {
    const lista = dados?.sugestoes ?? [];
    return {
      total: lista.length,
      novas: lista.filter(item => item.status === 'NOVA').length,
      analisadas: lista.filter(item => item.status !== 'NOVA').length,
    };
  }, [dados]);

  const enviar = async () => {
    setSalvando(true);
    setErro('');
    setSucesso('');
    try {
      const res = await fetch('/api/sugestoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível enviar sua sugestão.');
      setSucesso('Sugestão enviada. Obrigado por ajudar a melhorar a Mesa de Estudos.');
      setForm({ categoria: 'MELHORIA', prioridade: 'NORMAL', titulo: '', descricao: '', paginaOrigem: '' });
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar sua sugestão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell active="sugestoes" title="Sugestões" eyebrow="Melhoria contínua">
      {carregando ? (
        <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Carregando sugestões..." />
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <MetricCard icon={<Lightbulb size={20} />} label="Enviadas" value={String(resumo.total)} className="col-span-6 lg:col-span-3" />
          <MetricCard icon={<MessageSquarePlus size={20} />} label="Novas" value={String(resumo.novas)} tone="emerald" className="col-span-6 lg:col-span-3" />
          <MetricCard icon={<CheckCircle2 size={20} />} label="Em análise ou concluídas" value={String(resumo.analisadas)} tone="sky" className="col-span-12 lg:col-span-6" />

          {dados?.configuracaoPendente && (
            <section className="col-span-12 rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-xl shadow-amber-100/40">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-amber-600" size={20} />
                <div>
                  <p className="text-sm font-black text-slate-800">Tabela de sugestões ainda não configurada.</p>
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Execute `scripts/create-sugestoes-table.sql` no banco para ativar o envio de sugestões.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-slate-950 p-5 text-white shadow-xl shadow-sky-200/50 lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-200">Nova sugestão</p>
            <h2 className="mt-1 text-xl font-black">O que podemos melhorar?</h2>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Categoria" value={form.categoria} onChange={value => setForm(prev => ({ ...prev, categoria: value }))} options={CATEGORIAS} />
                <SelectField label="Prioridade" value={form.prioridade} onChange={value => setForm(prev => ({ ...prev, prioridade: value }))} options={PRIORIDADES} />
              </div>
              <TextField label="Título" value={form.titulo} onChange={value => setForm(prev => ({ ...prev, titulo: value }))} placeholder="Ex.: Melhorar revisão por tópico" />
              <label className="block">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Descrição</span>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={6}
                  placeholder="Conte o que você sentiu falta, onde aconteceu e como isso ajudaria seu estudo."
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-400"
                />
              </label>
              <TextField label="Página de origem" value={form.paginaOrigem} onChange={value => setForm(prev => ({ ...prev, paginaOrigem: value }))} placeholder="Opcional: /minha-mesa, /agenda..." />

              {erro && <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100">{erro}</p>}
              {sucesso && <p className="rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-bold text-emerald-100">{sucesso}</p>}

              <button
                onClick={enviar}
                disabled={salvando || dados?.configuracaoPendente}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition-all hover:bg-emerald-300 disabled:opacity-60"
              >
                {salvando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Enviar sugestão
              </button>
            </div>
          </section>

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:col-span-7">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Histórico</p>
            <h2 className="mt-1 text-xl font-black text-slate-800">Suas sugestões</h2>
            <div className="mt-5 space-y-3">
              {(dados?.sugestoes ?? []).length === 0 ? (
                <p className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm font-semibold text-slate-500">
                  Nenhuma sugestão enviada ainda.
                </p>
              ) : dados?.sugestoes.map(item => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800">{item.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.descricao}</p>
                    </div>
                    <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black text-sky-700">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {item.categoria} · {item.prioridade} · {new Date(item.dataCriacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none">
        {options.map(option => <option key={option.value} value={option.value} className="text-slate-900">{option.label}</option>)}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-400"
      />
    </label>
  );
}
