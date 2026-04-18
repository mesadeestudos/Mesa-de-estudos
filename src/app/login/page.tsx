'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setCookie } from "cookies-next"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailError, setEmailError] = useState('');
  const [senhaError, setSenhaError] = useState('');

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  );

  const validateEmail = (value: string) => {
    if (!value) return 'Informe seu e-mail.';
    if (!EMAIL_REGEX.test(value)) return 'Digite um e-mail válido.';
    return '';
  };

  const validateSenha = (value: string) => {
    if (!value) return 'Informe sua senha.';
    if (value.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    return '';
  };

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const sErr = validateSenha(senha);
    setEmailError(eErr);
    setSenhaError(sErr);
    if (eErr || sErr) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      console.log("RESPOSTA LOGIN:", data)

      if (!response.ok) {
        throw new Error(data.message);
      }

      setCookie("authorization", data.token, {
        path: "/",
        maxAge: 60 * 60,
        sameSite: "lax",
      });

      if (data.primeiroAcesso === true) {
        router.push('/editais');
      } else {
        router.push('/dashhboard');
      }

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-linear-to-br from-cyan-50/50 via-white to-indigo-50/50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">


      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-300 rounded-full blur-[120px] opacity-15" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[100px] opacity-15" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo_azul.png" alt="Mesa de Estudos" className="h-20 sm:h-24 w-auto mx-auto mb-6 sm:mb-8 hover:scale-105 transition-all duration-300" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Bem-vindo</h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">Entre na sua mesa de estudos</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl">
          <form onSubmit={handleLogin} noValidate className="space-y-5">

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">E-mail</label>
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

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Senha</label>
                <Link href="/recuperar-senha" className="text-xs font-bold text-cyan-600 hover:text-indigo-600 transition">Esqueceu a senha?</Link>
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setSenhaError(''); setErrorMsg(''); }}
                  onBlur={() => setSenhaError(validateSenha(senha))}
                  placeholder="••••••••"
                  className={`w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white border outline-none transition-all text-slate-900 autofill:shadow-[inset_0_0_0px_1000px_#ffffff]
                    ${senhaError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-cyan-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors p-1"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {senhaError && (
                <p className="mt-2 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 4.5zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  {senhaError}
                </p>
              )}
            </div>

            {errorMsg && (
              <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold text-red-600 flex-1">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => setErrorMsg('')}
                  className="text-red-300 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Fechar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center tracking-wider uppercase
                ${isLoading ? 'bg-slate-400 animate-pulse' : 'bg-linear-to-r from-cyan-500 to-indigo-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98] shadow-lg shadow-cyan-200'}`}
            >
              {isLoading ? "AUTENTICANDO..." : "ACESSAR MINHA MESA"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Ainda não tem uma mesa?{' '}
              <Link href="/assinatura" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">

        </p>
      </div>
    </div>
  );
}
