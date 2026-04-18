import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-cyan-50/50 via-white to-indigo-50/50 font-sans text-slate-900 selection:bg-cyan-100">

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-300 rounded-full blur-[120px] opacity-15" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-indigo-300 rounded-full blur-[100px] opacity-15" />
      </div>

      <nav className="shrink-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <img
              src="/logo_azul.png"
              alt="Mesa de Estudos"
              className="h-16 w-auto object-contain"
            />
            <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-500">
              <Link href="#" className="hover:text-cyan-600 transition">Editais</Link>
              <Link href="#" className="hover:text-cyan-600 transition">Tutoriais</Link>
              <Link href="#" className="hover:text-cyan-600 transition">Blog</Link>
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
              <button className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold tracking-wide hover:bg-slate-50 active:scale-[0.98] transition-all">
                Ver Vídeo
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center h-full">
            <div
              className="relative w-full overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm"
              style={{ maxHeight: 'calc(100vh - 15.5rem)' }}
            >
              <img
                src="/imagem_home.png"
                alt="Dashboard Preview"
                className="w-full h-auto drop-shadow-xl animate-float"
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
