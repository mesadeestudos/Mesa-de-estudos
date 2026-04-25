'use client';

import React from 'react';

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function AssinaturaPage() {
  const plans = [
    {
      name: "Plano Mensal",
      price: "39",
      displayPrice: "39",
      totalValue: "39",
      period: "/mês",
      description: "Flexibilidade total para organizar seus estudos mês a mês.",
      features: [
        "Cronogramas Ilimitados",
        "Análise de Horas Líquidas",
        "Ciclos de Estudo Automatizados",
        "Métricas de Evolução",
        "Suporte via Chat"
      ],
      button: "Assinar Mensal",
      highlight: false,
      tag: "Flexível"
    },
    {
      name: "Plano Anual",
      price: "24",
      displayPrice: "24",
      totalValue: "288",
      period: "/mês",
      subtext: "Cobrado anualmente (R$ 288)",
      description: "O melhor custo-benefício para quem busca a aprovação.",
      features: [
        "Tudo do Plano Mensal",
        "IA para Otimização de Ciclos",
        "Previsão de Conclusão de Edital",
        "Relatórios em PDF/Excel",
        "40% de Desconto Garantido"
      ],
      button: "Assinar Anual",
      highlight: true,
      tag: "Melhor Valor"
    },
    {
      name: "Plano Trimestral",
      price: "32",
      displayPrice: "32",
      totalValue: "96",
      period: "/mês",
      subtext: "Cobrado a cada 3 meses (R$ 96)",
      description: "Ideal para o planejamento de médio prazo.",
      features: [
        "Tudo do Plano Mensal",
        "Simulador de Ranking de Foco",
        "Gráficos Comparativos",
        "Prioridade no Suporte",
        "15% de Economia"
      ],
      button: "Assinar Trimestral",
      highlight: false,
      tag: "Popular"
    }
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] py-20 px-6 relative overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
          Escolha seu plano de <span className="text-cyan-600">Alta Performance</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          Acesso total a todas as ferramentas de gerenciamento de estudos.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`relative p-8 rounded-[40px] flex flex-col transition-all duration-500 hover:scale-[1.02] ${
              plan.highlight 
              ? 'bg-slate-900 text-white shadow-2xl shadow-blue-200 ring-4 ring-blue-500/10' 
              : 'bg-white/78 border border-white/70 shadow-xl shadow-slate-200/50 backdrop-blur-xl'
            }`}
          >
            <div className="mb-auto">
              <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${
                plan.highlight ? 'bg-cyan-500 text-slate-900' : 'bg-slate-100 text-slate-500'
              }`}>
                {plan.tag}
              </span>

              <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black">R$ {plan.displayPrice}</span>
                <span className={`text-sm font-bold ${plan.highlight ? 'text-slate-500' : 'text-slate-400'}`}>{plan.period}</span>
              </div>
              
              {plan.subtext ? (
                <p className={`text-[11px] font-bold mb-8 ${plan.highlight ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {plan.subtext}
                </p>
              ) : (
                <div className="h-[26px] mb-8" />
              )}

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium text-left">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.highlight ? 'bg-cyan-500 text-slate-900' : 'bg-cyan-100 text-cyan-600'
                    }`}>
                      <CheckIcon />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* 🔥 AQUI FOI AJUSTADO */}
            <div className="block mt-6">
              <button
                onClick={() => {
                  // define o step antes de navegar
                  document.cookie = "step=PAGAMENTO; path=/"

                  // redireciona mantendo sua lógica original
                  window.location.href = `/pagamento?plano=${encodeURIComponent(plan.name)}&valor=${plan.totalValue}&subtext=${encodeURIComponent(plan.subtext || 'Pagamento mensal')}`
                }}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${
                  plan.highlight 
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/30' 
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
                }`}
              >
                {plan.button}
              </button>
            </div>

          </div>
        ))}
      </div>

      <div className="relative z-10 mt-20 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          Assinatura Segura • Cancele a qualquer momento
        </p>
        <div className="flex flex-wrap justify-center gap-10 opacity-30 font-black text-lg italic">
          <span>PIX</span>
          <span>STRIPE</span>
          <span>SSL SECURE</span>
        </div>
      </div>
    </div>
  );
}
