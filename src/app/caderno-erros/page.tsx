'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, NotebookTabs, RefreshCw } from 'lucide-react';
import AppShell from '@/src/components/app/AppShell';
import EmptyState from '@/src/components/ui/EmptyState';

interface CadernoData {
  configuracaoPendente?: boolean;
  itens: Array<{
    topico: string;
    disciplina: string;
    erros: number;
    percentual: number;
    motivoErro: string;
    recomendacao: string;
  }>;
  resumo: { totalErros: number; mensagem: string };
}

export default function CadernoErrosPage() {
  const [dados, setDados] = useState<CadernoData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/caderno-erros')
      .then(res => res.json())
      .then(setDados)
      .finally(() => setCarregando(false));
  }, []);

  return (
    <AppShell active="caderno-erros" title="Caderno de Erros" eyebrow="Correção inteligente">
      {carregando ? (
        <EmptyState icon={<RefreshCw className="animate-spin" size={26} />} title="Montando seu caderno de erros..." />
      ) : (
        <div className="grid grid-cols-12 gap-5 pb-8">
          <section className="col-span-12 rounded-[32px] bg-slate-950 p-6 text-white shadow-xl shadow-sky-200/50">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">Prioridade de correção</p>
            <h2 className="mt-2 text-2xl font-black">{dados?.resumo.mensagem}</h2>
            {dados?.configuracaoPendente && <p className="mt-3 rounded-2xl bg-amber-400/15 p-4 text-sm font-bold text-amber-100">Execute scripts/create-ia-orientadora-tables.sql para ativar motivos de erro.</p>}
          </section>

          {(dados?.itens ?? []).length === 0 ? (
            <div className="col-span-12"><EmptyState icon={<NotebookTabs size={26} />} title="Ainda não há erros registrados por tópico. Registre baterias na tela de questões para gerar recomendações." /></div>
          ) : dados?.itens.map(item => (
            <article key={`${item.disciplina}-${item.topico}-${item.motivoErro}`} className="col-span-12 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/60 md:col-span-6 xl:col-span-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">{item.topico}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.disciplina}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{item.erros} erros</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-black text-slate-500">
                <AlertTriangle size={15} className="text-amber-500" /> {item.motivoErro}
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">{item.recomendacao}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-linear-to-r from-amber-400 to-emerald-400" style={{ width: `${Math.min(100, item.percentual)}%` }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
