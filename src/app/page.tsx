import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-cyan-100">
      
      {/* Background Decorativo Suave (Cores da Logo) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[100px]" />
      </div>

      {/* Navegação Moderna */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Certifique-se que o nome do arquivo na pasta public é exatamente 'logo azul.png' */}
            <img 
              src="/logo_azul.png" 
              alt="Mesa de Estudos" 
              className="h-40 w-auto object-contain" 
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
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-100 hover:scale-105 transition-all"
            >
              Assinar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section Principal */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
        
        <div className="space-y-8">
          <div className="inline-block px-4 py-1 rounded-full bg-lime-50 border border-lime-100 text-lime-700 text-[10px] font-black uppercase tracking-[0.2em]">
            Tecnologia & Aprendizado
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tighter">
            Estude com <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600">
              Inteligência.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-lg">
            A plataforma <span className="text-slate-800 font-semibold">Mesa de Estudos</span> une organização e performance para acelerar sua aprovação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/assinatura">
            <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-lg font-bold shadow-2xl hover:bg-black transition-all active:scale-95">
              Começar Jornada
            </button>
            </Link>
            <button className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">
              Ver Vídeo
            </button>
          </div>
        </div>

        {/* Lado Direito - Destaque da Logo */}
        <div className="flex justify-center items-center">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:h-[580px] overflow-hidden bg-slate-100">
            <img 
              src="/imagem_home.png" 
              alt="Dashboard Preview" 
              className="w-full h-auto drop-shadow-xl animate-bounce-slow" 
            />
            <div />
          </div>
        </div>
      </main>

      {/* Footer Simples para evitar poluição visual */}
      <footer className="py-10 border-t border-slate-50 text-center">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
          © 2026 Mesa de Estudos • Sua Aprovação Garantida
        </p>
      </footer>

      {/* Definindo a animação via Tailwind puro no arquivo (sem style jsx) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}