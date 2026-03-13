'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function CadastroPage() {

  const router = useRouter();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmPassword: '',
    aceite: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const passwordValidations = {
    minChars: formData.senha.length >= 8,
    upper: /[A-Z]/.test(formData.senha),
    lower: /[a-z]/.test(formData.senha),
    number: /[0-9]/.test(formData.senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.senha),
  };

  const isPasswordStrong = Object.values(passwordValidations).every(v => v === true);

  const requirements = [
    { label: "8+ chars", met: passwordValidations.minChars },
    { label: "Maiúscula", met: passwordValidations.upper },
    { label: "Minúscula", met: passwordValidations.lower },
    { label: "Número", met: passwordValidations.number },
    { label: "Especial", met: passwordValidations.special },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let newErrors: Record<string, string> = {};

    // Validação do nome
    if (!formData.nome.trim()) {
      newErrors.nome = "O nome é obrigatório.";
    } else if (formData.nome.length < 3) {
      newErrors.nome = "Digite seu nome completo.";
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = "E-mail obrigatório.";
    } else if (!formData.email.includes('@')) {
      newErrors.email = "E-mail inválido.";
    }

    // Validação da senha
    if (!formData.senha) {
      newErrors.password = "Senha obrigatória.";
    } else if (!isPasswordStrong) {
      newErrors.password = "Senha muito fraca.";
    }
    
    // Confirmação da senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme a senha.";
    } else if (formData.senha !== formData.confirmPassword) {
      newErrors.confirmPassword = "Não coincidem.";
    }

    // Termos
    if (!formData.aceite) {
      newErrors.aceite = "Aceite os termos.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {

      // Faz uma requisição HTTP para o backend na rota /api/cadastro
      const response = await fetch('/api/cadastro', {

        // Define o método da requisição
        method: 'POST',

        // Define o tipo de conteúdo enviado para a API
        headers: {
          'Content-Type': 'application/json'
        },

        // Corpo da requisição enviado para o backend
        // Converte os dados do formulário para JSON
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha
        })

      });

      // Converte a resposta da API (JSON) para um objeto JavaScript
      const data = await response.json();

      // Verifica se o backend retornou erro
      if (!response.ok) {
        throw new Error(data.message);
      }

      // Cadastro concluído
      router.push("/login");

    } catch (error: any) {

      // Erro vindo do backend
      alert(error.message);

    } finally {

      // Remove loading
      setIsLoading(false);
        
    }
  };

  const ErrorMsg = ({ field }: { field: string }) => (
    errors[field] ? (
      <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 flex items-center gap-1">
        <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors[field]}
      </p>
    ) : null
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-lime-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-cyan-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />

      <div className="w-full max-w-md z-10">

        <div className="text-center mb-6">
          <Link href="../">
            <img src="/logo_azul.png" alt="Logo" className="h-40 w-auto mx-auto mb-2" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Crie sua conta</h2>
          <p className="text-slate-500 font-medium text-xs">Preencha os dados para começar</p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-2xl shadow-slate-100/50 transition-all">

          <form onSubmit={handleRegister} className="flex flex-col gap-3">

            {/* Nome */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
              <input 
                type="text"
                placeholder="Como quer ser chamado?"
                className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.nome ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                onChange={(e) => updateField('nome', e.target.value)}
              />
              <ErrorMsg field="nome" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
              <input 
                type="email"
                placeholder="exemplo@email.com"
                className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.email ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                onChange={(e) => updateField('email', e.target.value)}
              />
              <ErrorMsg field="email" />
            </div>

            {/* Senhas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.password ? 'border-red-300 ring-2 ring-red-500/5' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                  onChange={(e) => updateField('senha', e.target.value)}
                />
                <ErrorMsg field="password" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirmar</label>
                <input 
                  type="password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.confirmPassword ? 'border-red-300 ring-2 ring-red-500/5' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                />
                <ErrorMsg field="confirmPassword" />
              </div>

            </div>

            {/* Painel de requisitos */}
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full transition-all ${req.met ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                    <span className={`text-[9px] font-bold ${req.met ? 'text-slate-900' : 'text-slate-400'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Termos */}
            <div className="py-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  className={`w-4 h-4 border-2 rounded ${errors.aceite ? 'border-red-300' : 'border-slate-200'}`}
                  onChange={(e) => updateField('aceite', e.target.checked)}
                />
                <span className="text-[10px] font-bold text-slate-500">
                  Aceito os Termos e Política.
                </span>
              </label>
              <ErrorMsg field="aceite" />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 text-white text-xs font-black rounded-xl transition-all
                ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-500'}`}
            >
              {isLoading ? "PROCESSANDO..." : "CRIAR MINHA MESA"}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Já tem conta? <Link href="/login" className="text-cyan-600 font-bold hover:underline">Entrar</Link>
          </p>

        </div>
      </div>
    </div>
  );
}