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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6 sm:mb-10">
          <Link href="/">
            <img src="/logo_azul.png" alt="Mesa de Estudos" className="h-36 sm:h-48 w-auto mx-auto mb-4 sm:mb-6" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Recuperar Senha</h2>
          <p className="text-slate-500 mt-2 font-medium">
            {isSent ? 'Verifique sua caixa de entrada.' : 'Enviaremos um link de acesso para seu e-mail.'}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-5 sm:p-8 rounded-[32px] border border-slate-100 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">
          {!isSent ? (
            <form onSubmit={handleRecover} noValidate className="space-y-6">

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
                  className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border focus:bg-white outline-none transition-all font-medium text-slate-900 autofill:shadow-[inset_0_0_0px_1000px_#f8fafc]
                    ${emailError ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-cyan-500'}`}
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
                className={`w-full py-4 sm:py-5 text-white font-black rounded-2xl shadow-xl transition-all duration-300
                  ${isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.02] shadow-cyan-200'}`}
              >
                {isLoading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <p className="text-slate-600 font-bold mb-6">
                Enviamos as instruções para <strong>{email}</strong>
              </p>
              <Link href="/login" className="block w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">
                VOLTAR AO LOGIN
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <Link href="/login" className="text-sm text-indigo-600 font-bold hover:underline">
              Lembrei minha senha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
