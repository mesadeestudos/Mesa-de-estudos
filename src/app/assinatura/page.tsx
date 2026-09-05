'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const plans = [
  {
    id: 'MENSAL',
    name: 'Plano Mensal',
    price: '19,90',
    totalValue: '19,90',
    period: '/mes',
    description: 'Flexibilidade total para organizar seus estudos mes a mes.',
    features: ['Cronogramas ilimitados', 'Ciclos automatizados', 'Revisoes inteligentes', 'Questoes e desempenho', 'Suporte via chat'],
    button: 'Assinar Mensal',
    highlight: false,
    tag: 'Flexivel',
  },
  {
    id: 'SEMESTRAL',
    name: 'Plano Semestral',
    price: '17,90',
    totalValue: '107,40',
    period: '/mes',
    subtext: 'Cobrado semestralmente (R$ 107,40)',
    description: 'Mais previsibilidade para manter sua rotina por 6 meses.',
    features: ['Tudo do Plano Mensal', 'IA para otimizacao de ciclos', 'Previsao de conclusao', 'Agenda automatica', '10% de economia'],
    button: 'Assinar Semestral',
    highlight: true,
    tag: 'Melhor Valor',
  },
  {
    id: 'ANUAL',
    name: 'Plano Anual',
    price: '15,90',
    totalValue: '190,80',
    period: '/mes',
    subtext: 'Cobrado anualmente (R$ 190,80)',
    description: 'O melhor custo-beneficio para quem busca aprovacao.',
    features: ['Tudo do Plano Mensal', 'Diagnostico por questoes', 'Graficos comparativos', 'Prioridade no suporte', '20% de economia'],
    button: 'Assinar Anual',
    highlight: false,
    tag: 'Economia',
  },
];

export default function AssinaturaPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const iniciarCheckout = async (plano: string) => {
    setLoadingPlan(plano);
    setErro('');
    try {
      const res = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Nao foi possivel iniciar o pagamento.');
      window.location.href = data.redirectUrl || '/pagamento';
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#ecfdf5_100%)] px-6 py-20 text-slate-900">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">
          Escolha seu plano de <span className="text-cyan-600">alta performance</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-slate-500">
          Acesso total a Mesa de Estudos, com ciclo inteligente, revisoes, questoes, agenda e orientacao automatica.
        </p>
        {erro && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{erro}</p>}
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-[32px] p-8 shadow-xl transition hover:-translate-y-1 ${
              plan.highlight
                ? 'bg-slate-950 text-white shadow-blue-200 ring-4 ring-blue-500/10'
                : 'border border-white/70 bg-white/85 text-slate-900 shadow-slate-200/50'
            }`}
          >
            <span className={`mb-6 inline-flex w-fit rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${
              plan.highlight ? 'bg-cyan-400 text-slate-950' : 'bg-slate-100 text-slate-500'
            }`}>{plan.tag}</span>
            <h3 className="text-2xl font-black">{plan.name}</h3>
            <p className={`mt-2 min-h-12 text-sm font-semibold ${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
              {plan.description}
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">R$ {plan.price}</span>
              <span className={`text-sm font-bold ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
            </div>
            <p className={`mt-2 h-5 text-xs font-bold ${plan.highlight ? 'text-cyan-300' : 'text-slate-400'}`}>
              {plan.subtext ?? 'Cobranca mensal'}
            </p>

            <ul className="my-8 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm font-semibold">
                  <CheckCircle2 className={plan.highlight ? 'text-cyan-300' : 'text-cyan-600'} size={18} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => iniciarCheckout(plan.id)}
              disabled={Boolean(loadingPlan)}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition ${
                plan.highlight
                  ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              } disabled:opacity-60`}
            >
              {loadingPlan === plan.id && <Loader2 className="animate-spin" size={16} />}
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
