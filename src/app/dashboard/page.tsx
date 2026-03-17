'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function DashboardQuantumV23() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSent, setIsSent] = useState(false); // Novo estado para o Check
  const [seconds, setSeconds] = useState(0);
  const [semanaAtual, setSemanaAtual] = useState(1);
  
  const TEMPO_META_TOPICO = 1800; 

  const [disciplinas, setDisciplinas] = useState([
    { 
      id: 1, nome: "D. Constitucional", cor: "#0284C7", corFinal: "#10B981", semana: 1, metaHoras: 7200,
      topicos: [
        { id: 101, nome: "Direitos Fundamentais", tempoSec: 4500, status: 'concluido' },
        { id: 102, nome: "Controle de Const.", tempoSec: 2900, status: 'revisar' },
        { id: 103, nome: "Poder Judiciário", tempoSec: 0, status: 'pendente' },
      ]
    },
    { 
      id: 2, nome: "D. Administrativo", cor: "#4361EE", corFinal: "#4CC9F0", semana: 1, metaHoras: 7200,
      topicos: [
        { id: 201, nome: "Atos Administrativos", tempoSec: 3600, status: 'concluido' },
        { id: 202, nome: "Licitações", tempoSec: 540, status: 'pendente' },
      ]
    }
  ]);

  const [idDiscAtiva, setIdDiscAtiva] = useState(1);
  const [idTopicoAtivo, setIdTopicoAtivo] = useState(101);

  const discAtual = disciplinas.find(d => d.id === idDiscAtiva);
  const topicoAtivo = discAtual?.topicos.find(t => t.id === idTopicoAtivo);

  const radarRevisao = disciplinas.flatMap(d => 
    d.topicos.filter(t => t.status === 'revisar')
      .map(t => ({ ...t, idMateria: d.id, nomeMateria: d.nome, corMateria: d.cor, corFinalMateria: d.corFinal }))
  );

  const moverParaRevisao = useCallback((idTop: number) => {
    setDisciplinas(prev => prev.map(d => ({
      ...d,
      topicos: d.topicos.map(t => {
        if (t.id === idTop) {
          return { ...t, status: t.status === 'revisar' ? 'pendente' : 'revisar' };
        }
        return t;
      })
    })));
  }, []);

  useEffect(() => {
    let interval: any = null; 
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev + 1 >= TEMPO_META_TOPICO) {
            setIsRunning(false);
            moverParaRevisao(idTopicoAtivo);
            return 0;
          }
          return prev + 1;
        });

        setDisciplinas(prev => prev.map(d => ({
          ...d,
          topicos: d.topicos.map(t => 
            t.id === idTopicoAtivo ? { ...t, tempoSec: t.tempoSec + 1, status: 'estudando' } : t
          )
        })));
      }, 1000);
    }
    return () => { if(interval) clearInterval(interval); };
  }, [isRunning, idTopicoAtivo, moverParaRevisao]);

  const formatarTempo = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const handleSendFeedback = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsFeedbackOpen(false);
      setTimeout(() => setIsSent(false), 300); 
    }, 2000);
  };
// Consolidamos todos os tópicos em uma lista plana para busca
  const todosOsTopicos = disciplinas.flatMap(d => 
    d.topicos.map(t => ({ ...t, nomeMateria: d.nome, discId: d.id }))
  );

  // PRIORIDADE 1: Se houver algo sendo estudado agora, focar nele
  // PRIORIDADE 2: Se não, buscar o primeiro pendente
  const proximoSugerido = todosOsTopicos.find(t => t.status === 'estudando') || 
                          todosOsTopicos.find(t => t.status === 'pendente') || 
                          { 
                            nome: "Edital Completo", 
                            nomeMateria: "Parabéns", 
                            status: "Finalizado",
                            discId: null 
                          };

  const iniciarSugerido = () => {
    if (proximoSugerido.discId) {
      setIdDiscAtiva(proximoSugerido.discId);
      setIdTopicoAtivo(proximoSugerido.id);
      setIsRunning(true);
      // setSeconds(0); <- Removido para não zerar se você apenas pausar e voltar
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      
      {!isRunning && (
        <header className="h-20 bg-[#082040] fixed top-0 w-full z-50 px-10 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-5">
            <div className="">
              <img src="/logo_azul.png" alt="Logo" className="h-40 w-auto" />
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
              Dashboard <span className="text-cyan-400">Inteligente</span>
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <Link href="/radar" className="flex items-center gap-3 group transition-all border-r border-white/10 pr-6">
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-base group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-all border border-white/10 group-hover:border-cyan-500/50">
                📊
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Radar</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight -mt-0.5">Desempenho</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>
        </header>
      )}

      <main className={`transition-all duration-700 ${isRunning ? 'pt-0' : 'pt-32 pb-20 px-10 max-w-[1900px] mx-auto'}`}>
        {/* NOVO BLOCO: ESTRATÉGIA DO EDITAL (CORAÇÃO DO SISTEMA) */}
        {!isRunning && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
    
    {/* Card de Foco do Dia */}
    <div className="lg:col-span-2 bg-gradient-to-br from-[#082040] to-[#164F73] p-8 rounded-[40px] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-cyan-500/20 transition-all duration-700" />
      
      <div className="relative z-10">
        <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2">Sugestão da Inteligência Quantum</p>
        <h3 className="text-3xl font-black italic tracking-tighter uppercase">
          {proximoSugerido?.nomeMateria}: <span className="text-cyan-200">{proximoSugerido?.nome}</span>
        </h3>
        <p className="text-slate-300 text-xs mt-1 font-medium">
          Status: <span className="text-white italic uppercase tracking-widest text-[9px]">{proximoSugerido?.status || 'Pendente'}</span>
        </p>
      </div>

      <button 
        onClick={iniciarSugerido}
        disabled={!proximoSugerido?.discId}
        className="relative z-10 mt-6 md:mt-0 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 text-[#082040] px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
      >
        {proximoSugerido?.discId ? 'Começar Agora' : 'Edital Vencido'}
      </button>
    </div>
    {/* Saúde do Edital Dinâmica */}
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Saúde do Edital (Progresso Geral)</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-5xl font-black italic text-slate-900 tracking-tighter">
          {todosOsTopicos.length > 0 
            ? Math.round((todosOsTopicos.filter(t => t.status === 'concluido').length / todosOsTopicos.length) * 100) 
            : 0}%
        </span>
        <span className="text-emerald-500 text-[11px] font-black mb-1.5 uppercase">+3% esta semana</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_10px_#06b6d4]" 
          style={{ 
            width: `${todosOsTopicos.length > 0 
              ? (todosOsTopicos.filter(t => t.status === 'concluido').length / todosOsTopicos.length) * 100 
              : 0}%` 
          }} 
        />
      </div>
      <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-tight">
        {todosOsTopicos.filter(t => t.status === 'concluido').length} de {todosOsTopicos.length} tópicos vencidos
      </p>
    </div>
  </div>
        )}

        <div className={`grid grid-cols-12 gap-8 items-start ${isRunning ? 'hidden' : ''}`}>
          
          {/* ESQUERDA: DISCIPLINAS */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Ciclo de estudos</h3>
            {disciplinas.map((disc) => {
              const tempoTotal = disc.topicos.reduce((acc, t) => acc + t.tempoSec, 0);
              const progresso = Math.min((tempoTotal / disc.metaHoras) * 100, 100);

              return (
                <div key={disc.id} className={`bg-white rounded-[24px] border transition-all duration-500 ${idDiscAtiva === disc.id ? 'border-slate-200 shadow-xl shadow-slate-200/50 scale-[1.02]' : 'border-transparent opacity-60'}`}>
                  <button onClick={() => setIdDiscAtiva(disc.id)} className="w-full p-6 text-left">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-1.5 h-7 rounded-full" style={{ background: `linear-gradient(to bottom, ${disc.cor}, ${disc.corFinal})` }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-black uppercase text-slate-800 tracking-tight">{disc.nome}</span>
                        <span className="text-[9px] text-slate-400 font-bold tabular-nums">{formatarTempo(tempoTotal)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${progresso}%`, background: `linear-gradient(to right, ${disc.cor}, ${disc.corFinal})` }} />
                    </div>
                  </button>

                  <div className={`transition-all overflow-hidden ${idDiscAtiva === disc.id ? 'max-h-[600px] p-5 pt-0' : 'max-h-0'}`}>
                    <div className="space-y-2 pt-2">
                      {disc.topicos.map(t => (
                        <div key={t.id} onClick={() => setIdTopicoAtivo(t.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${idTopicoAtivo === t.id ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
                          <p className="text-[11px] font-bold text-slate-600 mb-4">{t.nome}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moverParaRevisao(t.id); }} 
                            className={`w-full py-2 rounded-xl text-[8px] font-black uppercase transition-all ${t.status === 'revisar' ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm'}`}
                          >
                            {t.status === 'revisar' ? '✓ Na Fila' : 'Concluir Tópico'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CENTRO: CRONÔMETRO */}
          <div className="col-span-12 lg:col-span-6 sticky top-32">
            <div className="bg-white border border-white rounded-[56px] p-16 flex flex-col items-center shadow-2xl shadow-slate-200/60 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${discAtual?.cor}, ${discAtual?.corFinal})` }} />
              
              <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase">{discAtual?.nome}</h2>
              <p className="text-cyan-600 font-bold text-[10px] uppercase tracking-[0.5em] mb-12">{topicoAtivo?.nome}</p>

              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/10 blur-[60px] rounded-full animate-pulse" />
                <div className="relative text-[10rem] font-medium text-slate-900 leading-none mb-16 tracking-tighter tabular-nums">
                  {new Date(seconds * 1000).toISOString().substr(11, 8)}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => {setIsRunning(true); setSeconds(0)}} className="bg-cyan-50 text-cyan-600 border border-cyan-200 px-16 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.5em] transition-all hover:bg-cyan-600 hover:text-white hover:shadow-xl active:scale-95">
                  Iniciar Foco
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Hoje</span>
                  <p className="text-xl font-black text-slate-800 tracking-tight">04h 22m</p>
               </div>
               <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Média Semanal</span>
                  <p className="text-xl font-black text-slate-800 tracking-tight">05h 10m</p>
               </div>
            </div>
          </div>

          {/* DIREITA: FILA DE REVISÕES + CARD DE SUGESTÕES */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
            <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Fila de revisões</h3>
                 <div className="h-6 w-6 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-[10px] font-black text-cyan-600">
                    {radarRevisao.length}
                 </div>
              </div>
              
              <div className="space-y-4">
                {radarRevisao.length > 0 ? radarRevisao.map((item) => (
                  <div key={item.id} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:border-cyan-300 transition-all group relative overflow-hidden animate-in fade-in slide-in-from-right-2">
                    <div className="absolute top-0 left-0 h-full w-1.5" style={{ background: `linear-gradient(to bottom, ${item.corMateria}, ${item.corFinalMateria})` }} />
                    <span className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest">{item.nomeMateria}</span>
                    <p className="text-[14px] font-bold italic text-slate-800 leading-tight mb-4">{item.nome}</p>
                    <button className="w-full py-2 bg-slate-50 border border-slate-100 rounded-lg text-[7px] font-black uppercase text-slate-500 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600 transition-all">
                      Iniciar Revisão
                    </button>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma revisão pendente</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <button 
                  onClick={() => setIsFeedbackOpen(true)}
                  className="w-full bg-white p-5 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">💡</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-tight">Sugestões MVP</h4>
                      <p className="text-[9px] text-slate-400 font-medium leading-tight">Envie sua ideia agora</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL DE SUGESTÕES */}
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSent && setIsFeedbackOpen(false)} />
            
            <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-lg rounded-[48px] p-12 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
               <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, transparent, ${discAtual?.cor || '#0284C7'}, transparent)` }} />
               
               {!isSent ? (
                 <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Feedback <span className="text-cyan-600">do Usuário</span></h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Colabore com o nosso MVP</p>
                      </div>
                      <button onClick={() => setIsFeedbackOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
                    </div>

                    <div className="space-y-6">
                      <textarea 
                        placeholder="O que falta para sua experiência ser perfeita?"
                        className="w-full h-40 bg-white/50 border border-slate-200 rounded-[32px] p-6 text-sm text-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all placeholder:text-slate-300 resize-none shadow-inner"
                      />
                      <button 
                        onClick={handleSendFeedback}
                        className="w-full py-5 rounded-full bg-[#164F73] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-cyan-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Enviar Sugestão
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
                    <div className="h-20 w-20 rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-500 text-4xl shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce mb-6">
                        ✓
                    </div>
                    <h4 className="text-xl font-black text-slate-800 italic uppercase">Enviado com sucesso!</h4>
                 </div>
               )}
            </div>
          </div>
        )}

        {/* MODO IMERSÃO */}
        {isRunning && (
          <div className="fixed inset-0 bg-[#0F172A] z-[100] flex flex-col items-center justify-center p-12 overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)]" />
             <div className="relative mb-12 text-center">
                <h2 className="text-6xl lg:text-8xl font-black text-white italic tracking-tighter mb-4">{discAtual?.nome}</h2>
                <p className="text-cyan-400 font-bold text-2xl italic uppercase tracking-[0.5em]">{topicoAtivo?.nome}</p>
             </div>
             <div className="relative">
               <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] animate-pulse" />
               <div className="relative text-[22vw] font-medium text-white leading-none tracking-tighter mb-20 tabular-nums">
                  {new Date(seconds * 1000).toISOString().substr(11, 8)}
               </div>
             </div>
             <button onClick={() => setIsRunning(false)} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-32 py-10 rounded-full font-black text-[13px] uppercase tracking-[0.8em] transition-all hover:bg-rose-600/50 hover:border-rose-500">
                Pausar Sessão
             </button>
          </div>
        )}
      </main>
    </div>
  );
}