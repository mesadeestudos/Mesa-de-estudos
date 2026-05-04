'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const plans = [
  {
    id: 'MENSAL',
    name: 'Plano Mensal',
    price: '39',
    totalValue: '39',
    period: '/mês',
    description: 'Flexibilidade total para organizar seus estudos mês a mês.',
    features: ['Cronogramas ilimitados', 'Ciclos automatizados', 'Revisões inteligentes', 'Questões e desempenho', 'Suporte via chat'],
    button: 'Assinar Mensal',
    highlight: false,
    tag: 'Flexível',
  },
  {
    id: 'ANUAL',
    name: 'Plano Anual',
    price: '24',
    totalValue: '288',
    period: '/mês',
    subtext: 'Cobrado anualmente (R$ 288)',
    description: 'O melhor custo-benefício para quem busca aprovação.',
    features: ['Tudo do Plano Mensal', 'IA para otimização de ciclos', 'Previsão de conclusão', 'Agenda automática', '40% de desconto'],
    button: 'Assinar Anual',
    highlight: true,
    tag: 'Melhor Valor',
  },
  {
    id: 'TRIMESTRAL',
    name: 'Plano Trimestral',
    price: '32',
    totalValue: '96',
    period: '/mês',
    subtext: 'Cobrado a cada 3 meses (R$ 96)',
    description: 'Ideal para planejamento de médio prazo.',
    features: ['Tudo do Plano Mensal', 'Diagnóstico por questões', 'Gráficos comparativos', 'Prioridade no suporte', '15% de economia'],
    button: 'Assinar Trimestral',
    highlight: false,
    tag: 'Popular',
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
      if (!res.ok) throw new Error(data.message || 'Não foi possível iniciar o pagamento.');
      window.location.href = data.redirectUrl || '/pagamento';
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento.');
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
          Acesso total à Mesa de Estudos, com ciclo inteligente, revisões, questões, agenda e orientação automática.
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
            }`}>
              {plan.tag}
            </span>
            <h3 className="text-2xl font-black">{plan.name}</h3>
            <p className={`mt-2 min-h-12 text-sm font-semibold ${plan.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
              {plan.description}
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-black">R$ {plan.price}</span>
              <span className={`text-sm font-bold ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
            </div>
            <p className={`mt-2 h-5 text-xs font-bold ${plan.highlight ? 'text-cyan-300' : 'text-slate-400'}`}>
              {plan.subtext ?? 'Cobrança mensal'}
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
