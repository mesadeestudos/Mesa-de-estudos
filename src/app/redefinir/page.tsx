'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // ✅ pegar token da URL

// --- COMPONENTE DE ÍCONE PERSONALIZADO (SVG) ---
const EyeIcon = ({ visible }: { visible: boolean }) => (
  visible ? (
    // ÍCONE DO OLHO RISCADO (Quando a senha está visível)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    // ÍCONE DO OLHO ABERTO (Quando a senha está oculta)
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
);

export default function RedefinirSenhaPage() {

  const params = useSearchParams();
  const token = params.get("token"); // ✅ token vindo do link

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [novaSenha, setNovaSenha] = useState({ senha: '', confirmar: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- REGRAS DE SENHA FORTE ---
  const regras = {
    min: novaSenha.senha.length >= 8,
    numero: /[0-9]/.test(novaSenha.senha),
    maiuscula: /[A-Z]/.test(novaSenha.senha),
    minuscula: /[a-z]/.test(novaSenha.senha),
    especial: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha.senha),
    match: novaSenha.senha === novaSenha.confirmar && novaSenha.confirmar !== ''
  };

  const formValido =
    regras.min &&
    regras.numero &&
    regras.maiuscula &&
    regras.especial &&
    regras.match &&
    regras.minuscula;


  // ✅ ALTERADO PARA USAR BACKEND
  const handleReset = async (e: { preventDefault(): void }) => {

    e.preventDefault();

    if (!formValido) return;

    setIsLoading(true);

    try {

      const response = await fetch(
        "/api/redefinir-senha",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token,
            senha: novaSenha.senha
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Não foi possível atualizar sua senha. O link pode ter expirado.');
        setIsLoading(false);
        return;
      }

      setSucesso(true);
      setIsLoading(false);

    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Não foi possível conectar ao servidor. Tente novamente.');
    }

  };


  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50/50 via-white to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden text-left">

      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-300 rounded-full blur-[120px] opacity-15" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[100px] opacity-15" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-5">
          <Link href="/">
            <img src="/logo_azul.png" alt="Logo" className="h-20 sm:h-24 w-auto mx-auto mb-5 sm:mb-7" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">
            Nova Senha
          </h2>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Defina sua nova senha de acesso.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xl">
          {!sucesso ? (
            <form
              onSubmit={handleReset}
              noValidate
              className="space-y-4 animate-in slide-in-from-right-4 duration-500"
            >

              {/* Campo: Nova Senha */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nova Senha
                </label>

                <div className="relative group">
                  <input
                    type={showPass ? "text" : "password"}
                    value={novaSenha.senha}
                    onChange={(e) =>
                      setNovaSenha({
                        ...novaSenha,
                        senha: e.target.value
                      })
                    }
                    className="w-full px-5 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-cyan-500 outline-none font-medium transition-all pr-12"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPass(!showPass)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-600 transition-colors text-xl"
                  >
                     {/* AQUI ESTÁ O ÍCONE INTEGRADO */}
                    <EyeIcon visible={showPass} />
                  </button>
                </div>

                <br />

                <div className="">
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                    <RuleCheck label="8+ Caracteres" active={regras.min} />
                    <RuleCheck label="Número" active={regras.numero} />
                    <RuleCheck label="Maiúscula" active={regras.maiuscula} />
                    <RuleCheck label="Minúscula" active={regras.minuscula} />
                    <RuleCheck label="Especial" active={regras.especial} />
                  </div>
                </div>
              </div>

              {/* Campo: Confirmar Senha */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Confirmar Senha
                </label>

                <div className="relative group">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={novaSenha.confirmar}
                    onChange={(e) =>
                      setNovaSenha({
                        ...novaSenha,
                        confirmar: e.target.value
                      })
                    }
                    className={`w-full px-5 py-3.5 rounded-2xl bg-white border outline-none font-medium transition-all pr-12
                      ${novaSenha.confirmar && !regras.match
                        ? 'border-rose-300'
                        : 'border-slate-200 focus:border-cyan-500'
                      }`}
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(!showConfirm)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-600 transition-colors text-xl"
                  >
                     {/* AQUI ESTÁ O ÍCONE INTEGRADO */}
                    <EyeIcon visible={showPass} />
                  </button>
                </div>

                {novaSenha.confirmar && !regras.match && (
                  <p className="mt-2 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 4.5zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    As senhas não coincidem.
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

              {/* Botão */}
              <button
                type="submit"
                disabled={isLoading || !formValido}
                className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all duration-300 tracking-wider uppercase
                  ${isLoading || !formValido
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-linear-to-r from-cyan-500 to-indigo-600 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98] shadow-lg shadow-cyan-200'
                  }`}
              >
                {isLoading ? "SALVANDO..." : "ATUALIZAR SENHA"}
              </button>

            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                ✓
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2 italic">
                Tudo pronto!
              </h3>

              <p className="text-slate-500 font-medium mb-8">
                Sua nova senha foi salva.
              </p>

              <Link
                href="/login"
                className="block w-full py-5 bg-linear-to-r from-cyan-500 to-indigo-600 text-white font-black rounded-2xl text-center shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                ACESSAR MINHA MESA
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function RuleCheck({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'translate-x-1' : ''}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      <span className={`text-[10px] font-bold ${active ? 'text-emerald-500' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
