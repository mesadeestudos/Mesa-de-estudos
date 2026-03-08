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

  // Lógica de Validação de Segurança (Reutilizada para consistência)
  const passwordValidations = {
    minChars: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordValidations).every(v => v === true);

  const requirements = [
    { label: "8+ caracteres", met: passwordValidations.minChars },
    { label: "Maiúscula", met: passwordValidations.upper },
    { label: "Minúscula", met: passwordValidations.lower },
    { label: "Número", met: passwordValidations.number },
    { label: "Especial", met: passwordValidations.special },
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    let newErrors: Record<string, string> = {};

    if (formData.nome.length < 3) newErrors.nome = "Digite seu nome completo.";
    if (!formData.email.includes('@')) newErrors.email = "E-mail inválido.";
    if (!isPasswordStrong) newErrors.password = "A senha não cumpre os requisitos de segurança.";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }
    if (!formData.aceite) newErrors.aceite = "Você precisa aceitar os termos.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      console.log("Conta criada:", formData);
      setIsLoading(false);
      alert("Conta criada com sucesso!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-lime-50 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-50 rounded-full blur-[120px] opacity-50 pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <Link href="../">
            <img src="/logo_azul.png" alt="Logo" className="h-50 w-auto mx-auto mb-4" />
          </Link>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Crie sua conta</h2>
          <p className="text-slate-500 font-medium text-sm">Preencha os dados para começar</p>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl p-8 md:p-10 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-100/50">
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-2">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
              <input 
                type="text" 
                placeholder="Como quer ser chamado?"
                className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border outline-none transition-all ${errors.nome ? 'border-red-300' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
              <input 
                type="email" 
                placeholder="exemplo@email.com"
                className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 focus:bg-white outline-none transition-all`}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Grid de Senhas e Validação */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirmar</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-cyan-500 outline-none transition-all"
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            {/* Painel de Requisitos (Mesmo estilo do Login para manter padrão) */}
            <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Segurança da Senha</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${req.met ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-bold ${req.met ? 'text-slate-900' : 'text-slate-400'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkbox de Aceite */}
            <div className="md:col-span-2 py-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex items-center mt-1">
                  <input 
                    type="checkbox" 
                    className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded bg-white checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                    onChange={(e) => setFormData({...formData, aceite: e.target.checked})}
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Aceito os <span className="text-cyan-600 underline">Termos</span> e a <span className="text-cyan-600 underline">Política de Privacidade</span>.
                </span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !formData.aceite}
              className={`md:col-span-2 w-full py-5 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2
                ${isLoading || !formData.aceite 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:scale-[1.01] shadow-indigo-200/50'}`}
            >
              {isLoading ? "PROCESSANDO..." : "CRIAR MINHA MESA"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Já tem conta? <Link href="/login" className="text-cyan-600 font-bold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}