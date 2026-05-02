'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Adicione esta importação

type ConcursoResumo = {
  id: number;
  nome: string;
  descricao?: string;
  data?: string | null;
  cargo?: string;
  banca?: string;
  status?: string;
};

type Edital = {
  id: number;
  nome: string;
  descricao: string;
  data: string;
  cargo: string;
  banca: string;
  status: string;
  disciplinas: string[];
};

type ConcursoDetalhe = {
  edital?: Array<{
    cargo?: Array<{
      disciplina: Array<{ nome: string }>;
    }>;
  }>;
};

export default function PlanejamentoEditais() {
  // Estados para controle da lógica de planejamento e navegação entre etapas
  const [horasDiarias, setHorasDiarias] = useState(4);
  const [editalSelecionado, setEditalSelecionado] = useState<Edital | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [niveisDificuldade, setNiveisDificuldade] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState(''); // Novo estado para pesquisa
  // Estado que vai armazenar os editais vindos da API
  const [editais, setEditais] = useState<Edital[]>([])
  const router = useRouter(); // Inicializa o roteador

  /**
  * Busca os editais da API quando a página carregar
  */
  useEffect(() => {

    async function fetchEditais() {

      try {

        // Faz requisição para sua API
        const response = await fetch('/api/concursos')

        // Converte para JSON
        const data = await response.json()

        console.log('DADOS DA API:', data) //  importante pra debug

        // Adaptando dados da API para o formato do frontend
        const editaisFormatados = (data as ConcursoResumo[]).map((concurso) => ({
          id: concurso.id,

          nome: concurso.nome, // sigla

          descricao: concurso.descricao || '',

          //  GARANTINDO valores válidos
          data: concurso.data
          ? concurso.data.split('T')[0].split('-').reverse().join('/')
          : 'A definir',

          cargo: concurso.cargo || 'Não informado',
          
          banca: concurso.banca || '',

          /**
          *  STATUS REAL
          */
       status: concurso.status ? concurso.status.toUpperCase() : 'PREVISTO',

          disciplinas: [] // importante pro próximo passo
        }))
        
        console.log('FORMATADO:', editaisFormatados)
        // Atualiza estado
        setEditais(editaisFormatados)

      } catch {
        setEditais([])
      }

    }

    fetchEditais()

  }, [])
  
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

  // Filtra editais pelo nome conforme o termo de busca
  const editaisFiltrados = useMemo(() => {

    // Se não tem busca, retorna tudo
    if (!busca) return editais

    return editais.filter(e =>
      e.nome?.toLowerCase().includes(busca.toLowerCase())
    )

  }, [busca, editais])

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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#1E293B] font-sans">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      {/* Header Fixo */}
      <header className="fixed top-0 z-50 mx-4 mt-4 flex h-20 w-[calc(100%-2rem)] items-center justify-between rounded-[28px] border border-white/20 bg-slate-950/90 px-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl lg:px-10">
        <div className="flex items-center gap-5">
          <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-lg shadow-sky-950/20">
            <img src="/logo_azul.png" alt="Logo" className="h-12 w-auto" />
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
            Planejamento <span className="text-cyan-400">de Editais</span>
          </h1>
        </div>
        <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white">
          ← Voltar à Visão Geral
        </Link>
      </header>

      <main className="relative z-10 pt-32 pb-20 px-4 lg:px-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
        
        {/* Seção 01: Configuração de tempo */}
        <section className="bg-white/78 p-6 lg:p-10 rounded-[32px] border border-white/70 shadow-2xl shadow-slate-200/60 backdrop-blur-xl mb-10 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-2 h-full bg-linear-to-b from-cyan-500 to-emerald-400" />
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
             <div className="flex items-center gap-8 bg-slate-950 p-8 rounded-[28px] border border-white/10 min-w-[320px] shadow-xl shadow-sky-200/40">
                <div className="text-center">
                  <span className="text-[9px] font-black text-sky-200/70 uppercase tracking-widest block mb-1">Estimativa Semanal</span>
                  <p className="text-4xl font-black text-white italic tracking-tighter">{(horasDiarias * 7).toFixed(1)}h</p>
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
              className="px-6 py-2 rounded-2xl border border-white/70 bg-white/80 shadow-sm text-[10px] font-black uppercase outline-none focus:border-cyan-500"
            />
          </div>
          
          <div className="flex flex-row gap-6 w-full flex-wrap">
            {editaisFiltrados.slice(0, 5).map((edital) => (
              <div 
                key={edital.id} 
                onClick={async () => {
                try {
                  /**
                   *  Busca detalhes do concurso pelo ID
                   */
                  const response = await fetch(`/api/concursos/${edital.id}`)

                  const data = await response.json()

                  console.log('DETALHE DO CONCURSO:', data)

                  /**
                   *  Extrai disciplinas da estrutura:
                   * concurso → edital → cargo → disciplina
                   */
                  const detalhe = data as ConcursoDetalhe
                  const disciplinas = detalhe.edital?.[0]?.cargo?.flatMap((cargo) =>
                    cargo.disciplina.map((d) => d.nome)
                  ) || []

                  /**
                   * Atualiza edital selecionado com disciplinas reais
                   */
                  setEditalSelecionado({
                    ...edital,
                    disciplinas
                  })

                  /**
                   * Vai para etapa 2 (tela de dificuldade)
                   */
                  setEtapa(2)

                } catch (error) {

                  console.error('Erro ao buscar disciplinas:', error)

                }
              }} 
                className={`cursor-pointer bg-white/78 p-6 rounded-[28px] border transition-all shadow-lg shadow-slate-200/50 backdrop-blur-xl flex flex-col justify-between ${editalSelecionado?.id === edital.id ? 'border-cyan-500 ring-4 ring-cyan-200/60' : 'border-white/70 hover:border-cyan-200 hover:-translate-y-0.5'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${edital.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{edital.status}</span>
                  <div className="text-2xl"></div>
                </div>
                <div>
                  {/* NOME */}
                  <h4 className="text-md font-black text-slate-800 italic uppercase tracking-tighter">{edital.nome}</h4>
                  {/*  DATA */}
                  <p className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md inline-block mt-2">{edital.data}</p>
                  {/*  BANCA */}
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{edital.banca}</p>
                  {/*  DESCRIÇÃO */}
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 leading-tight">{edital.descricao}</p>
                  {/*  CARGO */}
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{edital.cargo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 03: Configuração de Dificuldade */}
        {etapa === 2 && editalSelecionado && (
          <section className="animate-in slide-in-from-bottom-8 duration-700 bg-linear-to-br from-slate-950 via-sky-950 to-sky-700 p-6 lg:p-12 rounded-[36px] text-white shadow-2xl shadow-sky-200/50 border border-white/20 relative overflow-hidden w-full">
            <div className="relative z-10">
              <h3 className="text-3xl font-black italic uppercase text-white mb-10">Nível de Domínio: <span className="text-cyan-400">{editalSelecionado.nome}</span></h3>
              <div className="grid grid-cols-2 gap-4 mb-12">
                {editalSelecionado.disciplinas?.map((disc: string) => (
                  <div key={disc} className="bg-white/10 border border-white/15 p-6 rounded-2xl flex items-center justify-between backdrop-blur">
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
  Finalizar e Gerar Visão Geral
</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}


