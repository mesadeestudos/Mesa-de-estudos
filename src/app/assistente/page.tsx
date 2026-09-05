'use client';

import { useEffect, useState } from 'react';
import { Bot, ChevronRight, RefreshCw, Send } from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';

interface AssistenteData {
  titulo: string;
  mensagem: string;
  destino: string;
  acaoPrimaria: string;
  narrativa: string;
  etapaPedagogica: string;
  explicacao: { principal: string; consequencia: string; sinaisUsados: string[] };
  recomendacoes: string[];
}

export default function AssistentePage() {
  const [assistente, setAssistente] = useState<AssistenteData | null>(null);
  const [pergunta, setPergunta] = useState('O que devo estudar hoje?');
  const [resposta, setResposta] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [rebalanceando, setRebalanceando] = useState(false);

  useEffect(() => {
    fetch('/api/assistente')
      .then(res => res.json())
      .then(setAssistente)
      .finally(() => setCarregando(false));
  }, []);

  const perguntar = async () => {
    setEnviando(true);
    try {
      const res = await fetch('/api/assistente/conversa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta }),
      });
      const data = await res.json();
      setResposta(data.resposta ?? data.message ?? 'Não consegui responder agora.');
    } finally {
      setEnviando(false);
    }
  };

  const aplicarRebalanceamento = async () => {
    setRebalanceando(true);
    try {
      await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'rebalancear' }),
      });
      window.location.href = '/ciclos';
    } finally {
      setRebalanceando(false);
    }
  };

  return (
    <AppShell active="assistente" title="Assistente IA" eyebrow="Orientação de estudo">
      {carregando ? (
        <div className="flex items-center gap-3 rounded-3xl bg-white/80 p-6 text-sm font-black text-sky-600"><RefreshCw className="animate-spin" size={18} /> Analisando seu contexto...</div>
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/50 lg:col-span-7">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-400 p-3 text-slate-950"><Bot size={24} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">{assistente?.etapaPedagogica}</p>
                <h2 className="mt-2 text-2xl font-black">{assistente?.titulo}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-300">{assistente?.narrativa ?? assistente?.mensagem}</p>
              </div>
            </div>
            <button onClick={() => { if (assistente?.destino) window.location.href = assistente.destino; }} className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950">
              {assistente?.acaoPrimaria ?? 'Abrir próxima ação'} <ChevronRight size={16} />
            </button>
            {assistente?.etapaPedagogica === 'REBALANCEAMENTO' && (
              <button onClick={aplicarRebalanceamento} disabled={rebalanceando} className="ml-0 mt-3 flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60 sm:ml-3 sm:mt-0 sm:inline-flex">
                {rebalanceando ? <RefreshCw className="animate-spin" size={16} /> : null}
                Aplicar ajuste recomendado
              </button>
            )}
          </section>

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 lg:col-span-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Pergunte ao orientador</p>
            <div className="mt-4 space-y-3">
              {['O que devo estudar hoje?', 'Estou atrasado, o que faço?', 'Fui mal em questões, continuo ou reviso?', 'Tenho 2 horas hoje, qual o melhor plano?'].map(item => (
                <button key={item} onClick={() => setPergunta(item)} className="w-full rounded-2xl border border-slate-100 bg-white px-4 py-2.5 text-left text-xs font-black text-slate-600 hover:border-sky-200">{item}</button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={pergunta} onChange={e => setPergunta(e.target.value)} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-sky-500" />
              <button onClick={perguntar} disabled={enviando} className="rounded-2xl bg-slate-950 px-4 text-white disabled:opacity-60">{enviando ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}</button>
            </div>
            {resposta && <p className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm font-bold leading-relaxed text-slate-700">{resposta}</p>}
          </section>

          <section className="col-span-12 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Por que essa orientação?</p>
            <p className="mt-2 text-sm font-bold text-slate-700">{assistente?.explicacao.principal}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">{assistente?.explicacao.consequencia}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(assistente?.recomendacoes ?? assistente?.explicacao.sinaisUsados ?? []).map(item => <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item}</span>)}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
