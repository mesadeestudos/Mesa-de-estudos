'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planoNome = searchParams.get('plano') || 'Plano Premium';
  const planoValor = searchParams.get('valor') || '19,90';
  const [method, setMethod] = useState<'card' | 'pix'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [erro, setErro] = useState('');

  const handleFinalizar = async () => {
    setIsLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoNome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível confirmar o pagamento.');
      setShowSuccessModal(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível confirmar o pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#ecfdf5_100%)] px-6 py-24 text-slate-800">
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 size={34} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Pagamento aprovado</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Sua licença foi reservada. Agora crie sua conta para ativar a assinatura.
            </p>
            <button
              onClick={() => router.push('/cadastro')}
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
            >
              Criar minha conta
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={26} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600">Checkout seguro</p>
              <h1 className="text-2xl font-black text-slate-900">Dados de pagamento</h1>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-1.5">
            <button onClick={() => setMethod('card')} className={`rounded-xl py-3 text-xs font-black ${method === 'card' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>
              Cartão
            </button>
            <button onClick={() => setMethod('pix')} className={`rounded-xl py-3 text-xs font-black ${method === 'pix' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>
              Pix
            </button>
          </div>

          {method === 'card' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Nome no cartão" placeholder="Como impresso no cartão" className="md:col-span-2" />
              <Input label="Número do cartão" placeholder="0000 0000 0000 0000" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Validade" placeholder="MM/AA" />
                <Input label="CVV" placeholder="123" />
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-black text-slate-900">Pix pronto para aprovação</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">No modo de desenvolvimento, a aprovação é simulada pela API.</p>
            </div>
          )}

          {erro && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{erro}</p>}

          <button
            onClick={handleFinalizar}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
            {isLoading ? 'Validando pagamento...' : 'Confirmar pagamento'}
          </button>
        </section>

        <aside className="rounded-[32px] bg-slate-950 p-8 text-white shadow-xl shadow-sky-200/40">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Plano selecionado</p>
          <h2 className="mt-2 text-3xl font-black">{planoNome}</h2>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</p>
            <p className="mt-2 text-5xl font-black">R$ {planoValor}</p>
          </div>
          <p className="mt-6 rounded-2xl bg-white/5 p-4 text-xs font-semibold text-slate-300">
            A integração está pronta para receber um gateway real via webhook. Em desenvolvimento, o pagamento é aprovado em modo mock.
          </p>
        </aside>
      </main>
    </div>
  );
}

function Input({ label, placeholder, className = '' }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-500" placeholder={placeholder} />
    </label>
  );
}

export default function CheckoutFinalPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-black text-slate-500">Carregando checkout...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
