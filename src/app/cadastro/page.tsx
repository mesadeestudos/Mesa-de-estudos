'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
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
    minChars: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordValidations).every(v => v === true);

  const requirements = [
    { label: "8+ chars", met: passwordValidations.minChars },
    { label: "Maiúscula", met: passwordValidations.upper },
    { label: "Minúscula", met: passwordValidations.lower },
    { label: "Número", met: passwordValidations.number },
    { label: "Especial", met: passwordValidations.special },
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) newErrors.nome = "O nome é obrigatório.";
    if (!formData.email.trim()) {
      newErrors.email = "E-mail obrigatório.";
    } else if (!formData.email.includes('@')) {
      newErrors.email = "E-mail inválido.";
    }
    if (!formData.password) newErrors.password = "Senha obrigatória.";
    else if (!isPasswordStrong) newErrors.password = "Senha muito fraca.";
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Não coincidem.";
    }
    if (!formData.aceite) newErrors.aceite = "Aceite os termos.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      alert("Conta criada com sucesso!");
    }, 1500);
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

      {/* Container Principal Ajustado (max-w-md) */}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <Link href="../">
            <img src="/logo_azul.png" alt="Logo" className="h-40 w-auto mx-auto mb-2" />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Crie sua conta</h2>
          <p className="text-slate-500 font-medium text-xs">Preencha os dados para começar</p>
        </div>

        {/* Card com Padding Reduzido */}
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

            {/* Grid de Senhas (Lado a lado apenas em telas maiores) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.password ? 'border-red-300 ring-2 ring-red-500/5' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                  onChange={(e) => updateField('password', e.target.value)}
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

            {/* Painel de Requisitos Compacto */}
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

            {/* Checkbox */}
            <div className="py-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div className="relative flex items-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className={`peer appearance-none w-4 h-4 border-2 rounded bg-white checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer ${errors.aceite ? 'border-red-300' : 'border-slate-200'}`}
                    onChange={(e) => updateField('aceite', e.target.checked)}
                  />
                  <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 leading-tight">
                    Aceito os <span className="text-cyan-600 underline">Termos</span> e a <span className="text-cyan-600 underline">Política</span>.
                  </span>
                  <ErrorMsg field="aceite" />
                </div>
              </label>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2
                ${isLoading 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:scale-[1.01] active:scale-95 shadow-indigo-200/50'}`}
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