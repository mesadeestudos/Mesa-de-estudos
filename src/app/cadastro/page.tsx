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
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Mapeamento de erro para garantir que o campo volte à cor normal ao digitar
    const errorKey = field === 'senha' ? 'password' : field;

    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
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

    // VALIDAÇÃO DO NOME (RESTAURADA E REFORÇADA)
    if (!formData.nome || formData.nome.trim() === '') {
      newErrors.nome = "O nome é obrigatório.";
    } else if (formData.nome.trim().split(' ').length < 2 || formData.nome.length < 3) {
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
      const response = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
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

  // Componente de ícone personalizado (SVG)
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      
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

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-10 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.password ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                    onChange={(e) => updateField('senha', e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors p-1"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
                <ErrorMsg field="password" />
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirmar</label>
                <div className="relative group">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-10 py-3.5 rounded-xl bg-slate-50 border outline-none text-sm transition-all ${errors.confirmPassword ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-100 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-cyan-500 transition-colors p-1"
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </button>
                </div>
                <ErrorMsg field="confirmPassword" />
              </div>

            </div>

            {/* Requisitos */}
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
                : 'bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'}`}
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
