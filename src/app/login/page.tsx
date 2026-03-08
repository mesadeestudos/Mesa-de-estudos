'use client';

import React, { useState } from 'react'; // Adicionado useState
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Para navegar até o Dashboard

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulação de Login - Em 1.5s ele vai para o Dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard'); // Ajuste aqui para a rota do seu Dashboard
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-50 rounded-full blur-[120px] opacity-60" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] opacity-60" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/">
            <img src="/logo_azul.png" alt="Mesa de Estudos" className="h-50 w-auto mx-auto mb-6 hover:scale-105 transition-all duration-300" />
          </Link>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter ">Bem Vindo</h2>
          <p className="text-slate-500 mt-2 font-medium">Acesse sua área de alta performance</p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[32px] border border-slate-100 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">E-mail</label>
              <input 
                required
                type="email" 
                placeholder="exemplo@email.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Senha</label>
                <Link href="/recuperar-senha" className="text-xs font-bold text-cyan-600 hover:text-indigo-600 transition">Esqueceu?</Link>
              </div>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center
                ${isLoading ? 'bg-slate-400 animate-pulse' : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:scale-[1.02] shadow-cyan-200'}`}
            >
              {isLoading ? "AUTENTICANDO..." : "ENTRAR NO SISTEMA"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Ainda não tem acesso?{' '}
              {/* Ajustei o link para /cadastro abaixo */}
              <Link href="/assinatura" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          Protegido por criptografia de ponta
        </p>
      </div>
    </div>
  );
}