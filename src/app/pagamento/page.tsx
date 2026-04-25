'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Dados recebidos da URL da tela de assinatura
  const planoNome = searchParams.get('plano') || 'Plano Premium';
  const planoValor = searchParams.get('valor') || '00';
  const planoSubtext = searchParams.get('subtext') || 'Acesso imediato após aprovação';

  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Função de Finalização com Modal de Sucesso em Tailwind
  const handleFinalizar = () => {
    setIsLoading(true);

    // Simula o processamento
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true); // Ativa o modal construído em Tailwind
    }, 2500);
  };

  const irParaCadastro = () => {
    // 🔥 atualiza o fluxo
    document.cookie = "step=CADASTRO; path=/"

    // 🔁 mantém sua navegação original
    router.push('/cadastro');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#1E293B] font-sans relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      
      {/* MODAL DE SUCESSO (CUSTOM TAILWIND) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop com Blur */}
          <div className="absolute inset-0 bg-[#082040]/80 backdrop-blur-sm animate-in fade-in duration-300" />
          
          {/* Conteúdo do Modal */}
          <div className="relative bg-white w-full max-w-md p-10 rounded-[40px] shadow-2xl text-center animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 mb-2">
              Pagamento <span className="text-emerald-500">Aprovado</span>
            </h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-tight mb-8">
              Sua licença foi ativada. Vamos configurar seu perfil agora.
            </p>
            
            <button 
              onClick={irParaCadastro}
              className="w-full py-5 bg-[#082040] text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase text-[10px] tracking-[0.3em] shadow-xl"
            >
              Iniciar Configuração
            </button>
          </div>
        </div>
      )}

      {/* HEADER QUANTUM */}
      <header className="fixed top-0 z-50 mx-4 mt-4 flex h-20 w-[calc(100%-2rem)] items-center justify-between rounded-[28px] border border-white/20 bg-slate-950/90 px-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:px-10">
        <div className="flex items-center gap-5">
          <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
            Checkout <span className="text-cyan-400">Seguro</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest uppercase text-[9px]">Criptografia SSL Ativa</span>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 md:px-10 max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white/78 p-8 md:p-10 rounded-[32px] border border-white/70 shadow-2xl shadow-slate-200/60 backdrop-blur-xl">
              
              <div className="flex items-center gap-4 mb-10">
                <Link href="/" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-all">
                  <svg width="18" height="18" fill="none" stroke="#1E293B" strokeWidth="3" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                </Link>
                <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                  Dados de <span className="text-cyan-600">Faturamento</span>
                </h2>
              </div>

              <div className="space-y-8">
                {/* IDENTIFICAÇÃO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-100">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome Completo</label>
                    <input type="text" placeholder="TITULAR DA CONTA" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none transition-all font-bold text-slate-800 uppercase text-xs placeholder:text-slate-300" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">CPF / CNPJ</label>
                    <input type="text" placeholder="000.000.000-00" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none transition-all font-bold text-slate-800 text-xs placeholder:text-slate-300" />
                  </div>
                </div>

                {/* MÉTODO DE PAGAMENTO */}
                <div className="space-y-6">
                  <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setMethod('card')}
                      className={`flex-1 py-4 rounded-xl font-black text-[10px] tracking-widest transition-all ${method === 'card' ? 'bg-[#082040] text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      CARTÃO DE CRÉDITO
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMethod('pix')}
                      className={`flex-1 py-4 rounded-xl font-black text-[10px] tracking-widest transition-all ${method === 'pix' ? 'bg-[#082040] text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      PIX
                    </button>
                  </div>

                  <div className="mt-8">
                    {method === 'card' ? (
                      <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome no Cartão</label>
                          <input type="text" placeholder="COMO IMPRESSO NO CARTÃO" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none font-bold text-slate-800 uppercase text-xs" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Número do Cartão</label>
                          <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none font-bold text-slate-800 text-sm" />
                        </div>
                        <div className="col-span-2 md:col-span-1 flex gap-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Validade</label>
                            <input type="text" placeholder="MM/AA" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none font-bold text-slate-800 text-sm" />
                          </div>
                          <div className="w-24">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">CVV</label>
                            <input type="text" placeholder="123" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none font-bold text-slate-800 text-sm" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 animate-in zoom-in-95 duration-500">
                        <div className="text-4xl mb-4">⚡</div>
                        <p className="text-slate-900 font-black text-xs uppercase tracking-widest">QR Code Pronto para gerar</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase">Aprovação imediata após o pagamento</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleFinalizar}
                  disabled={isLoading}
                  className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-[#082040] font-black rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 uppercase text-[11px] tracking-[0.3em] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-[#082040]/30 border-t-[#082040] rounded-full animate-spin" />
                      <span>Validando Dados...</span>
                    </div>
                  ) : (
                    <>
                      Confirmar Pagamento
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 12h14m-7-7l7 7-7 7" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: RESUMO DO PEDIDO */}
          <div className="col-span-12 lg:col-span-5 space-y-6 sticky top-32">
            <div className="bg-linear-to-br from-slate-950 via-sky-950 to-sky-700 p-10 rounded-[32px] text-white shadow-2xl shadow-sky-200/50 border border-white/20 relative overflow-hidden">
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Plano Selecionado</p>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2 leading-none">
                {planoNome}
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">Pagamento Único / Vitalício</p>
              
              <div className="space-y-4 border-t border-white/10 pt-8 mt-8 mb-10 text-[10px] font-black uppercase tracking-widest">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white">R$ {planoValor},00</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Desconto</span>
                  <span className="text-emerald-400">- R$ 0,00</span>
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total a pagar</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-6xl font-black italic tracking-tighter text-white">R$ {planoValor}</span>
                   <span className="text-cyan-400 font-bold text-xl">,00</span>
                </div>
              </div>

              <div className="mt-8 p-5 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-slate-200 font-bold italic leading-relaxed">
                  &quot;{planoSubtext}&quot;
                </p>
              </div>
            </div>

            <div className="bg-white/78 p-6 rounded-[28px] border border-white/70 shadow-xl shadow-slate-200/50 backdrop-blur-xl flex items-center gap-5">
               <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">🛡️</div>
               <div>
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Compra Segura</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase">Seus dados estão protegidos</p>
               </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

export default function CheckoutFinalPage() {
  return (
    <Suspense fallback={<div className="bg-[#082040] min-h-screen flex items-center justify-center text-white font-black uppercase text-xs tracking-widest animate-pulse">Sincronizando Protocolos...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
