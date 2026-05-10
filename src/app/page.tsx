import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] font-sans text-slate-900 selection:bg-cyan-100">

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      </div>

      <nav className="shrink-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <img
              src="/logo_azul.png"
              alt="Mesa de Estudos"
              className="h-16 w-auto object-contain"
            />
            <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-500">
              <Link href="/tutoriais" className="hover:text-cyan-600 transition">Tutoriais</Link>
              <Link href="/ajuda" className="hover:text-cyan-600 transition">Ajuda</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition">
              Entrar
            </Link>
            <Link
              href="/assinatura"
              className="bg-linear-to-r from-cyan-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-200 hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98] transition-all"
            >
              Assinar Agora
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        <div className="h-full max-w-7xl mx-auto px-6 py-6 grid lg:grid-cols-2 gap-8 items-center">

          <div className="space-y-5">
            <div className="inline-block px-4 py-1 rounded-full bg-cyan-50/80 border border-cyan-200/60 text-cyan-700 text-[10px] font-black uppercase tracking-[0.2em]">
              Tecnologia & Aprendizado
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl 2xl:text-7xl font-black text-slate-900 leading-none tracking-tighter">
              <span className="font-medium text-slate-400">Estude com</span><br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-indigo-600">
                Inteligência.
              </span>
            </h1>

            <p className="text-sm xl:text-base text-slate-400 leading-relaxed max-w-lg">
              A plataforma <span className="text-slate-700 font-semibold">Mesa de Estudos</span> une organização e performance para acelerar sua aprovação.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/assinatura">
                <button className="px-8 py-3.5 bg-linear-to-r from-cyan-500 to-indigo-600 text-white rounded-2xl text-sm font-black tracking-wider shadow-lg shadow-cyan-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-400/40 active:scale-[0.98] transition-all uppercase">
                  Começar Jornada
                </button>
              </Link>
              <Link href="/api/assinatura/trial" className="px-8 py-3.5 bg-white border border-slate-200 text-center text-slate-600 rounded-2xl text-sm font-bold tracking-wide hover:bg-slate-50 active:scale-[0.98] transition-all">
                Testar grátis por 7 dias
              </Link>
            </div>
          </div>

          <div className="flex justify-center items-center h-full">
            <div
              className="relative flex w-full items-center justify-center overflow-hidden bg-white/78 rounded-[32px] shadow-2xl shadow-slate-200/60 backdrop-blur-xl"
              style={{
                width: 'min(100%, min(680px, calc(100vh - 11.5rem)))',
                aspectRatio: '1 / 1',
              }}
            >
              <img
                src="/imagem_home.png"
                alt="Visão Geral Preview"
                className="h-full w-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 py-10 border-t border-slate-100 text-center z-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2026 Mesa de Estudos • Sua Aprovação Garantida
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}

