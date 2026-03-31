'use client';

import React, { useState } from 'react'; // Adicionado useState
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Para navegar até o Dashboard
import { setCookie } from "cookies-next"

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para o "olhinho"

  // Guardar valores de email da tela.
  const [email, setEmail] = useState('');
  // Guardar valores de senha da tela.
  const [senha, setSenha] = useState('');

  // Componente de ícone personalizado (SVG) - Padronizado com o Cadastro
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

  // Função responsável por realizar o login quando o formulário é enviado
  const handleLogin = async (e: React.FormEvent) => {

    // Evita que a página recarregue ao enviar o formulário
    e.preventDefault();

    // Ativa o estado de loading (botão muda para "AUTENTICANDO...")
    setIsLoading(true);

    try {

      // Faz uma requisição para o backend na rota /api/login
      const response = await fetch('/api/login', {

        // Método HTTP usado
        method: 'POST',

        // Define que estamos enviando JSON
        headers: {
          'Content-Type': 'application/json'
        },

        // Corpo da requisição enviado para o backend
        // Envia email e senha digitados pelo usuário
        body: JSON.stringify({
          email,
          senha
        })

      });

      // Converte a resposta da API para JSON
      const data = await response.json();

      console.log("RESPOSTA LOGIN:", data)

      // Se o backend retornar erro (status diferente de 200)
      if (!response.ok) {

        // Lança erro com a mensagem enviada pela API
        throw new Error(data.message);

      }

      // Salva o token JWT no navegador
      // Esse token será usado para autenticar o usuário em outras rotas
      setCookie("authorization", data.token, {
        path: "/",
        maxAge: 60 * 60,
        sameSite: "lax"
      })

      // Redireciona o usuário para o dashboard após login bem sucedido
      if (data.primeiroAcesso === true) {

        router.push('/editais')

      } else {

        router.push('/dashhboard')

      }

    } catch (error: any) {

      // Caso ocorra erro (senha errada, usuário inexistente, etc)
      // mostra um alerta com a mensagem de erro
      alert(error.message);

    } finally {

      // Independentemente de sucesso ou erro, desativa o loading
      setIsLoading(false);

    }

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all font-medium text-slate-900 autofill:shadow-[inset_0_0_0px_1000px_#f8fafc]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Senha</label>
                <Link href="/recuperar-senha" className="text-xs font-bold text-cyan-600 hover:text-indigo-600 transition">Esqueceu?</Link>
              </div>
              
              <div className="relative group">
                <input 
                  required
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all text-slate-900 autofill:shadow-[inset_0_0_0px_1000px_#f8fafc]"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors p-1"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
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