'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // ✅ pegar token da URL

export default function RedefinirSenhaPage() {

  const params = useSearchParams();
  const token = params.get("token"); // ✅ token vindo do link

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [novaSenha, setNovaSenha] = useState({ senha: '', confirmar: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

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
  const handleReset = async (e: React.FormEvent) => {

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

        alert(data.error || "Erro ao redefinir");

        setIsLoading(false);
        return;
      }

      setSucesso(true);
      setIsLoading(false);

    } catch (err) {

      setIsLoading(false);
      alert("Erro ao conectar com servidor");

    }

  };


  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden text-left">
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/">
            <img src="/logo_azul.png" alt="Logo" className="h-50 mx-auto mb-6" />
          </Link>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            Nova Senha
          </h2>
          <p className="text-slate-500 mt-2 font-medium italic text-sm">
            Crie uma senha mestre para sua segurança.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-slate-100 shadow-xl">
          {!sucesso ? (
            <form
              onSubmit={handleReset}
              className="space-y-6 animate-in slide-in-from-right-4 duration-500"
            >

              {/* Campo: Nova Senha */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nova Senha
                </label>

                <div className="relative group">
                  <input
                    required
                    type={showPass ? "text" : "password"}
                    value={novaSenha.senha}
                    onChange={(e) =>
                      setNovaSenha({
                        ...novaSenha,
                        senha: e.target.value
                      })
                    }
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none font-medium transition-all pr-12 group-hover:bg-white"
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPass(!showPass)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-600 transition-colors text-xl"
                  >
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>

                <br />

                <div className="bg-slate-50/50 p-3 rounded-x1 border border-slate-100">
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
                    required
                    type={showConfirm ? "text" : "password"}
                    value={novaSenha.confirmar}
                    onChange={(e) =>
                      setNovaSenha({
                        ...novaSenha,
                        confirmar: e.target.value
                      })
                    }
                    className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border outline-none font-medium transition-all pr-12 group-hover:bg-white
                      ${novaSenha.confirmar && !regras.match
                        ? 'border-rose-300'
                        : 'border-slate-100 focus:border-cyan-500'
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
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>

                {novaSenha.confirmar && !regras.match && (
                  <p className="text-[10px] text-rose-500 font-black uppercase mt-2 ml-1 italic tracking-widest">
                    As senhas não coincidem
                  </p>
                )}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={isLoading || !formValido}
                className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all duration-300
                  ${isLoading || !formValido
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.02]'
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
                className="block w-full py-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 text-white font-black rounded-2xl text-center"
              >
                ACESSAR MINHA CONTA
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