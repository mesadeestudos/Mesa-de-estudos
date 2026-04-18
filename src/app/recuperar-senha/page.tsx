'use client';

import { useState } from 'react';
import Link from 'next/link';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (value: string) => {
    if (!value) return 'Informe seu e-mail.';
    if (!EMAIL_REGEX.test(value)) return 'Digite um e-mail válido.';
    return '';
  };

  const handleRecover = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Não foi possível enviar o link. Tente novamente em instantes.');
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      setIsLoading(false);

      console.log('LINK:', data.link);

    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
    }
  };

  return (
    <div className="h-screen bg-linear-to-br from-cyan-50/50 via-white to-indigo-50/50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">

      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-300 rounded-full blur-[120px] opacity-15" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[100px] opacity-15" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo_azul.png" alt="Mesa de Estudos" className="h-20 sm:h-24 w-auto mx-auto mb-6 sm:mb-8" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Recuperar Senha</h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            {isSent ? 'Verifique sua caixa de entrada.' : 'Enviaremos um link de acesso para seu e-mail.'}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl">
          {!isSent ? (
            <form onSubmit={handleRecover} noValidate className="space-y-5">

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
                  E-mail de cadastro
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); setErrorMsg(''); }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  placeholder="exemplo@email.com"
                  className={`w-full px-5 py-3.5 rounded-2xl bg-white border outline-none transition-all font-medium text-slate-900 autofill:shadow-[inset_0_0_0px_1000px_#ffffff]
                    ${emailError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-cyan-500'}`}
                />
                {emailError && (
                  <p className="mt-2 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 4.5zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              {errorMsg && (
                <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-red-600 flex-1">{errorMsg}</p>
                  <button type="button" onClick={() => setErrorMsg('')} className="text-red-300 hover:text-red-500 transition-colors shrink-0" aria-label="Fechar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all duration-300 tracking-wider uppercase
                  ${isLoading ? 'bg-slate-400' : 'bg-linear-to-r from-cyan-500 to-indigo-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98] shadow-lg shadow-cyan-200'}`}
              >
                {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <p className="text-slate-600 font-bold mb-6">
                Enviamos as instruções para <strong>{email}</strong>
              </p>
              <Link href="/login" className="block w-full py-4 bg-white/60 border border-white/60 text-slate-600 font-black rounded-2xl hover:bg-white/80 active:scale-[0.98] transition-all">
                VOLTAR AO LOGIN
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/login" className="text-sm text-indigo-600 font-bold hover:underline">
              Lembrei minha senha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
