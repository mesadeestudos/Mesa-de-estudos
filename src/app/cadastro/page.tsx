'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";

type CadastroFormField = keyof CadastroFormData;

type CadastroFormData = {
  nome: string;
  email: string;
  senha: string;
  confirmPassword: string;
  aceite: boolean;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Erro ao realizar cadastro";

export default function CadastroPage() {

  const router = useRouter();

  const [formData, setFormData] = useState<CadastroFormData>({
    nome: '',
    email: '',
    senha: '',
    confirmPassword: '',
    aceite: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // Estado para mensagem de sucesso
  
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = <T extends CadastroFormField>(field: T, value: CadastroFormData[T]) => {
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
    if (apiError) setApiError('');
  };

  const validateField = (field: Exclude<CadastroFormField, 'aceite'>, value: string) => {
    const errorKey = field === 'senha' ? 'password' : field;
    let error = '';

    if (field === 'nome') {
      if (!value || value.trim() === '') error = "Informe seu nome.";
      else if (value.trim().split(' ').length < 2 || value.length < 3) error = "Insira nome e sobrenome.";
    }
    if (field === 'email') {
      if (!value.trim()) error = "Informe seu e-mail.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Digite um e-mail válido.";
    }
    if (field === 'senha') {
      if (!value) error = "Crie uma senha para sua conta.";
      else if (!isPasswordStrong) error = "Sua senha não atende aos requisitos acima.";
    }
    if (field === 'confirmPassword') {
      if (!value) error = "Confirme sua senha antes de continuar.";
      else if (formData.senha !== value) error = "As senhas não coincidem.";
    }

    setErrors(prev => {
      if (error) return { ...prev, [errorKey]: error };
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
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
    { label: "8+ caracteres", met: passwordValidations.minChars },
    { label: "Maiúscula", met: passwordValidations.upper },
    { label: "Minúscula", met: passwordValidations.lower },
    { label: "Número", met: passwordValidations.number },
    { label: "Especial", met: passwordValidations.special },
  ];

  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setIsLoading(true);
    
    const newErrors: Record<string, string> = {};

    // VALIDAÇÃO DO NOME (RESTAURADA E REFORÇADA)
    if (!formData.nome || formData.nome.trim() === '') {
      newErrors.nome = "Informe seu nome.";
    } else if (formData.nome.trim().split(' ').length < 2 || formData.nome.length < 3) {
      newErrors.nome = "Insira nome e sobrenome.";
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Digite um e-mail válido.";
    }

    // Validação da senha
    if (!formData.senha) {
      newErrors.password = "Crie uma senha para sua conta.";
    } else if (!isPasswordStrong) {
      newErrors.password = "Sua senha não atende aos requisitos acima.";
    }
    
    // Confirmação da senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha antes de continuar.";
    } else if (formData.senha !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem.";
    }

    // Termos
    if (!formData.aceite) {
      newErrors.aceite = "Aceite os Termos e Política para prosseguir.";
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

      if (!response.ok) {
        // Verifica se o erro é de email já existente
        if (data.message?.toLowerCase().includes("email") || response.status === 409) {
          setErrors(prev => ({ ...prev, email: "Este e-mail já possui cadastro. Tente fazer login." }));
          throw new Error("E-mail duplicado");
        }
        throw new Error(data.message || "Erro ao realizar cadastro");
      }

      // Sucesso
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000); // Aguarda 3 segundos exibindo a mensagem

    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message !== "E-mail duplicado") {
        setApiError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const ErrorMsg = ({ field }: { field: string }) => (
    errors[field] ? (
      <p className="mt-2 ml-1 text-xs font-semibold text-red-500 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
          <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 018 4.5zm0 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
        {errors[field]}
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] flex items-center justify-center p-4 relative overflow-hidden">


      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />

      <div className="w-full max-w-md z-10">

        <div className="text-center mb-5">
          <Link href="../">
            <img src="/logo_azul.png" alt="Logo" className="h-20 sm:h-24 w-auto mx-auto mb-5 sm:mb-7" />
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">Crie sua mesa de estudos</h2>
          <p className="text-slate-400 font-medium text-xs mt-1">Preencha os dados para começar</p>
        </div>

        <div className="bg-white/80 p-5 sm:p-6 rounded-3xl border border-white/70 shadow-2xl shadow-slate-200/60 backdrop-blur-xl transition-all">

          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900">Sua mesa está pronta!</h3>
              <p className="text-slate-500 text-sm mt-2">Redirecionando você para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} noValidate className="flex flex-col gap-3">

              {/* Nome */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <input 
                  type="text"
                  placeholder="Seu nome completo"
                  className={`w-full px-4 py-3.5 rounded-xl bg-white border outline-none text-sm text-slate-900 transition-all autofill:shadow-[inset_0_0_0px_1000px_#ffffff] ${errors.nome ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                  onChange={(e) => updateField('nome', e.target.value)}
                  onBlur={() => validateField('nome', formData.nome)}
                />
                <ErrorMsg field="nome" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                <input 
                  type="email"
                  placeholder="exemplo@email.com"
                  className={`w-full px-4 py-3.5 rounded-xl bg-white border outline-none text-sm text-slate-900 transition-all autofill:shadow-[inset_0_0_0px_1000px_#ffffff] ${errors.email ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => validateField('email', formData.email)}
                />
                <ErrorMsg field="email" />
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full pl-4 pr-10 py-3.5 rounded-xl bg-white border outline-none text-sm text-slate-900 transition-all autofill:shadow-[inset_0_0_0px_1000px_#ffffff] ${errors.password ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                      onChange={(e) => updateField('senha', e.target.value)}
                      onBlur={() => validateField('senha', formData.senha)}
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

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirmar</label>
                  <div className="relative group">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`w-full pl-4 pr-10 py-3.5 rounded-xl bg-white border outline-none text-sm text-slate-900 transition-all autofill:shadow-[inset_0_0_0px_1000px_#ffffff] ${errors.confirmPassword ? 'border-red-300 ring-2 ring-red-500/5 bg-red-50/30' : 'border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'}`}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
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
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
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
                    Li e aceito os Termos de Uso e a Política de Privacidade.
                  </span>
                </label>
                <ErrorMsg field="aceite" />
              </div>

              {apiError && (
                <div role="alert" className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-red-600 flex-1">{apiError}</p>
                  <button type="button" onClick={() => setApiError('')} className="text-red-300 hover:text-red-500 transition-colors shrink-0" aria-label="Fechar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 text-white text-xs font-black rounded-xl transition-all tracking-wider uppercase
                  ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-linear-to-r from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98]'}`}
              >
                {isLoading ? "PROCESSANDO..." : "CRIAR MINHA MESA"}
              </button>

            </form>
          )}

          {!showSuccess && (
            <p className="mt-6 text-center text-xs text-slate-500 font-medium">
              Já tem uma mesa? <Link href="/login" className="text-cyan-600 font-bold hover:underline">Entrar</Link>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
