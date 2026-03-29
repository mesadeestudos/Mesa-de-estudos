'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Adicione esta importação

export default function PlanejamentoEditais() {
  // Estados para controle da lógica de planejamento e navegação entre etapas
  const [horasDiarias, setHorasDiarias] = useState(4);
  const [editalSelecionado, setEditalSelecionado] = useState<any>(null);
  const [etapa, setEtapa] = useState(1);
  const [niveisDificuldade, setNiveisDificuldade] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState(''); // Novo estado para pesquisa
  const router = useRouter(); // Inicializa o roteador
  
  // ... seus outros estados (horasDiarias, editalSelecionado, etc)

  const finalizarPlanejamento = () => {
    // 1. Criamos o objeto com tudo o que o usuário escolheu
    const dadosPlanejamento = {
      horasDiarias,
      edital: editalSelecionado,
      niveisDificuldade,
      dataCriacao: new Date().toISOString()
    };

    // 2. Salvamos no localStorage (transformando o objeto em texto)
    localStorage.setItem('meu_planejamento', JSON.stringify(dadosPlanejamento));

    // 3. Agora sim, navegamos para o dashboard
    router.push('/dashboard');
  };

  // Lista de editais disponíveis
  const editais = [
    { id: 'pcsp', nome: 'PC-SP 2026', data: '20/05/2026', cargo: 'Investigador', status: 'Aberto', disciplinas: ['D. Constitucional', 'D. Administrativo', 'Português', 'Informática'] },
    { id: 'prf', nome: 'PRF 2026', data: '15/08/2026', cargo: 'Policial Rodoviário', status: 'Previsto', disciplinas: ['Física', 'Raciocínio Lógico', 'D. Penal', 'Geopolítica'] },
    { id: 'pf', nome: 'PF 2026', data: '10/09/2026', cargo: 'Agente', status: 'Previsto', disciplinas: ['Contabilidade', 'Informática', 'D. Penal', 'Redação'] },
    { id: 'depen', nome: 'DEPEN', data: '05/12/2026', cargo: 'Policial Penal', status: 'Aberto', disciplinas: ['Execução Penal', 'D. Humanos', 'Português', 'D. Penal'] },
    { id: 'agepen', nome: 'AGEPEN-MG', data: '12/10/2026', cargo: 'Policial Penal', status: 'Previsto', disciplinas: ['D. Penal', 'D. Administrativo', 'Português', 'Informática'] },
  ];

  // Filtra editais pelo nome conforme o termo de busca
  const editaisFiltrados = useMemo(() => 
    editais.filter(e => e.nome.toLowerCase().includes(busca.toLowerCase())),
  [busca]);

  // Função auxiliar para definir as cores dos botões de nível de dificuldade
  const getButtonClass = (disciplina: string, nivel: string) => {
    const isSelected = niveisDificuldade[disciplina] === nivel;
    const base = "px-4 py-2 rounded-lg text-[8px] font-black uppercase border transition-all";
    if (!isSelected) return `${base} border-white/20 hover:border-cyan-400 hover:text-cyan-400`;
    if (nivel === 'Baixo') return `${base} border-emerald-500 bg-emerald-500/20 text-emerald-400`;
    if (nivel === 'Médio') return `${base} border-cyan-500 bg-cyan-500/20 text-cyan-400`;
    if (nivel === 'Alto') return `${base} border-red-500 bg-red-500/20 text-red-400`;
    return base;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Header Fixo */}
      <header className="h-20 bg-[#082040] fixed top-0 w-full z-50 px-10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-5">
          <img src="/logo_azul.png" alt="Logo" className="h-40 w-auto" />
          <div className="h-6 w-[1px] bg-white/10" />
          <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
            Planejamento <span className="text-cyan-400">de Editais</span>
          </h1>
        </div>
        <Link href="/dashboard" className="text-white/60 text-white text-[10px] font-black uppercase tracking-widest transition-all">
          ← Voltar ao Dashboard
        </Link>
      </header>

      <main className="pt-32 pb-20 px-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
        
        {/* Seção 01: Configuração de tempo */}
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mb-10 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
           <p className="text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] mb-4">01. Configuração de Tempo</p>
           <div className="flex flex-col md:flex-row gap-12 items-center">
             <div className="flex-1 w-full">
               <label className="block text-2xl font-black italic tracking-tighter text-slate-800 mb-6 uppercase">Quantas horas você vai dedicar por dia?</label>
               <div className="flex items-center gap-6">
                 <input type="range" min="1" max="12" step="0.0166" value={horasDiarias} onChange={(e) => setHorasDiarias(parseFloat(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                 <div className="flex items-center gap-2">
                   <input type="number" step="0.0166" value={horasDiarias.toFixed(2)} onChange={(e) => setHorasDiarias(parseFloat(e.target.value))} className="w-20 p-2 border border-slate-200 rounded-xl text-center text-sm font-black text-slate-800 outline-none focus:border-cyan-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase">H</span>
                 </div>
               </div>
             </div>
             <div className="flex items-center gap-8 bg-slate-50 p-8 rounded-[32px] border border-slate-100 min-w-[320px]">
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estimativa Semanal</span>
                  <p className="text-4xl font-black text-[#082040] italic tracking-tighter">{(horasDiarias * 7).toFixed(1)}h</p>
                </div>
             </div>
           </div>
        </section>

        {/* Seção 02: Editais com campo de pesquisa */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">02. Selecione seu edital</h3>
            <input 
              type="text" 
              placeholder="PESQUISAR EDITAL..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="px-6 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:border-cyan-500"
            />
          </div>
          
          <div className="flex flex-row gap-6 w-full">
            {editaisFiltrados.slice(0, 5).map((edital) => (
              <div 
                key={edital.id} 
                onClick={() => {setEditalSelecionado(edital); setEtapa(2);}} 
                className={`cursor-pointer bg-white p-6 rounded-[32px] border-2 transition-all flex-1 aspect-square flex flex-col justify-between ${editalSelecionado?.id === edital.id ? 'border-cyan-500 shadow-xl' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${edital.status === 'Aberto' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{edital.status}</span>
                  <div className="text-2xl">📄</div>
                </div>
                <div>
                  <h4 className="text-md font-black text-slate-800 italic uppercase tracking-tighter">{edital.nome}</h4>
                  <p className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md inline-block mt-2">{edital.data}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{edital.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 03: Configuração de Dificuldade */}
        {etapa === 2 && (
          <section className="animate-in slide-in-from-bottom-8 duration-700 bg-[#082040] p-12 rounded-[48px] text-white shadow-2xl relative overflow-hidden w-full">
            <div className="relative z-10">
              <h3 className="text-3xl font-black italic uppercase text-white mb-10">Nível de Domínio: <span className="text-cyan-400">{editalSelecionado.nome}</span></h3>
              <div className="grid grid-cols-2 gap-4 mb-12">
                {editalSelecionado.disciplinas.map((disc: string) => (
                  <div key={disc} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-bold uppercase">{disc}</span>
                    <div className="flex gap-2">
                      {['Baixo', 'Médio', 'Alto'].map((nivel) => (
                        <button key={nivel} onClick={() => setNiveisDificuldade({...niveisDificuldade, [disc]: nivel})} className={getButtonClass(disc, nivel)}>
                          {nivel}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Substitua o <Link> por este <button> */}
<button 
  onClick={finalizarPlanejamento}
  className="block w-full text-center bg-cyan-500 text-[#082040] py-6 rounded-2xl font-black uppercase text-[12px] tracking-[0.4em] hover:bg-cyan-400 transition-colors"
>
  Finalizar e Gerar Dashboard
</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}