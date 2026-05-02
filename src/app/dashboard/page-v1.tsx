'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type TopicoStatus = 'pendente' | 'estudando' | 'revisar' | 'concluido';

type Topico = {
  id: number;
  nome: string;
  tempoSec: number;
  status: TopicoStatus;
};

type Disciplina = {
  id: number;
  nome: string;
  dificuldade: string;
  prioridade: number;
  cor: string;
  metaHoras: number;
  topicos: Topico[];
};

type PlanejamentoSalvo = {
  edital: {
    disciplinas: string[];
  };
  niveisDificuldade: Record<string, string>;
  horasDiarias: number;
};

type TopicoComMateria = Topico & {
  discId: number;
  nomeMateria: string;
  corMateria: string;
};

export default function DashboardQuantumV23() {
  const [isRunning, setIsRunning] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [idDiscAtiva, setIdDiscAtiva] = useState<number | null>(null);
  const [idTopicoAtivo, setIdTopicoAtivo] = useState<number | null>(null);

  const TEMPO_META_TOPICO = 1800;

  // Função para enviar feedback corrigida
  const handleSendFeedback = () => {
    if (feedbackText.trim() === '') return;
    setEnviado(true);
    setTimeout(() => {
      setEnviado(false);
      setIsFeedbackOpen(false);
      setFeedbackText('');
    }, 2500);
  };

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('meu_planejamento');
    if (dadosSalvos) {
      try {
        const planejamento = JSON.parse(dadosSalvos) as PlanejamentoSalvo;
        const { edital, niveisDificuldade, horasDiarias } = planejamento;

        const listaMapeada: Disciplina[] = edital.disciplinas.map((nomeDisc: string, index: number) => {
          const dificuldade = niveisDificuldade[nomeDisc] || 'Médio';
          const peso = dificuldade === 'Alto' ? 3 : (dificuldade === 'Médio' ? 2 : 1);
          const corSugerida = dificuldade === 'Alto' ? '#EF4444' : (dificuldade === 'Baixo' ? '#10B981' : '#0284C7');

          return {
            id: index + 1,
            nome: nomeDisc,
            dificuldade,
            prioridade: peso,
            cor: corSugerida,
            metaHoras: (horasDiarias * 3600 * 7) / edital.disciplinas.length,
            topicos: [
              { id: (index + 1) * 100 + 1, nome: `Teoria de ${nomeDisc}`, tempoSec: 0, status: 'pendente' },
              { id: (index + 1) * 100 + 2, nome: `Questões de Fixação`, tempoSec: 0, status: 'pendente' },
              { id: (index + 1) * 100 + 3, nome: `Revisão de Ciclo`, tempoSec: 0, status: 'pendente' }
            ]
          };
        });

        const listaOrdenada = listaMapeada.sort((a, b) => b.prioridade - a.prioridade);
        queueMicrotask(() => {
          setDisciplinas(listaOrdenada);

          if (listaOrdenada.length > 0) {
            setIdDiscAtiva(listaOrdenada[0].id);
            setIdTopicoAtivo(listaOrdenada[0].topicos[0].id);
          }
        });
      } catch (e) { console.error(e); }
    }
  }, []);

  const formatarTempo = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const moverParaRevisao = useCallback((idTop: number) => {
    setDisciplinas(prev => prev.map(d => ({
      ...d,
      topicos: d.topicos.map((t) => t.id === idTop ? { ...t, status: t.status === 'revisar' ? 'concluido' : 'revisar' } : t)
    })));
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && idTopicoAtivo) {
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
          topicos: d.topicos.map((t) => t.id === idTopicoAtivo ? { ...t, tempoSec: t.tempoSec + 1, status: 'estudando' } : t)
        })));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, idTopicoAtivo, moverParaRevisao]);

  const discAtual = disciplinas.find(d => d.id === idDiscAtiva);
  const topicoAtivo = discAtual?.topicos.find((t) => t.id === idTopicoAtivo);
  const todosOsTopicos: TopicoComMateria[] = disciplinas.flatMap(d => d.topicos.map((t) => ({ ...t, discId: d.id, nomeMateria: d.nome, corMateria: d.cor })));
  const radarRevisao = todosOsTopicos.filter(t => t.status === 'revisar');
  const proximoSugerido = todosOsTopicos.find(t => t.status === 'pendente') || { nome: "Concluido", nomeMateria: "Parabéns", discId: null, id: null };
  const porcentagemSaude = todosOsTopicos.length > 0 ? Math.round((todosOsTopicos.filter(t => t.status !== 'pendente').length / todosOsTopicos.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {!isRunning && (
        <header className="h-20 bg-[#082040] fixed top-0 w-full z-50 px-10 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-5">
            <img src="/logo_azul.png" alt="Logo" className="h-40 w-auto" />
            <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">Visão Geral <span className="text-cyan-400">Inteligente</span></h1>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/editais" className="flex items-center gap-3 group border-r border-white/10 pr-6">
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-base border border-white/10 group-hover:bg-cyan-500/20 transition-all"></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-white uppercase tracking-widest">Editais</span><span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">Gestão</span></div>
            </Link>
            <Link href="/radar" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-base border border-white/10 group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex flex-col"><span className="text-[10px] font-black text-white uppercase tracking-widest">Radar</span><span className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">Desempenho</span></div>
            </Link>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>
        </header>
      )}

      <main className={`transition-all duration-700 ${isRunning ? 'pt-0' : 'pt-32 pb-20 px-10 max-w-[1900px] mx-auto'}`}>
        {!isRunning && (
          <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-12 lg:col-span-9 bg-gradient-to-br from-[#082040] to-[#164F73] p-8 rounded-[40px] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
              <div className="relative z-10">
                <p className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2">Sugestão Prioritária</p>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">{proximoSugerido?.nomeMateria}: <span className="text-cyan-200">{proximoSugerido?.nome}</span></h3>
              </div>
              <button onClick={() => { if (proximoSugerido.discId) { setIdDiscAtiva(proximoSugerido.discId); setIdTopicoAtivo(proximoSugerido.id); setSeconds(0); setIsRunning(true); } }} className="relative z-10 bg-cyan-500 hover:bg-cyan-400 text-[#082040] px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all">Começar Agora</button>
            </div>
            <div className="col-span-12 lg:col-span-3 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Saúde do Edital</p>
              <span className="text-5xl font-black italic text-slate-900 tracking-tighter mb-3">{porcentagemSaude}%</span>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${porcentagemSaude}%` }} /></div>
            </div>
          </div>
        )}

        {/* LISTAGEM E FOCO CENTRAL */}
{!isRunning && (
  <div className="grid grid-cols-12 gap-8 items-start">
    {/* COLUNA ESQUERDA: LISTAGEM */}
    <div className="col-span-12 lg:col-span-3 space-y-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Ciclo de Prioridades</h3>
      {disciplinas.map((disc) => (
        <div key={disc.id} className={`bg-white rounded-[24px] border transition-all duration-500 ${idDiscAtiva === disc.id ? 'border-slate-200 shadow-xl scale-[1.02]' : 'border-transparent opacity-60'}`}>
          <button onClick={() => setIdDiscAtiva(disc.id)} className="w-full p-6 text-left">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-7 rounded-full" style={{ background: disc.cor }} />
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase text-slate-800 tracking-tight">{disc.nome}</span>
                <span className="text-[9px] text-cyan-600 font-bold uppercase">Total: {formatarTempo(disc.topicos.reduce((acc, t) => acc + t.tempoSec, 0))}</span>
              </div>
            </div>
          </button>
          {idDiscAtiva === disc.id && (
            <div className="px-5 pb-5 space-y-2">
              {disc.topicos.map((t) => (
                <div key={t.id} onClick={() => setIdTopicoAtivo(t.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${idTopicoAtivo === t.id ? 'bg-slate-50 border-slate-200 shadow-inner' : 'bg-transparent border-transparent'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[11px] font-bold text-slate-600 leading-tight w-2/3">{t.nome}</p>
                    <span className="text-[8px] font-black text-slate-400 tabular-nums">{formatarTempo(t.tempoSec)}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); moverParaRevisao(t.id); }} className={`w-full py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${t.status === 'revisar' || t.status === 'concluido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400'}`}>
                    {t.status === 'revisar' || t.status === 'concluido' ? '✓ Concluído' : 'Marcar Concluído'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* COLUNA CENTRAL: FOCO (COM LUZ E MÉTRICAS) */}
    <div className="col-span-12 lg:col-span-6 sticky top-32 text-center">
      <div className="bg-white border border-white rounded-[56px] p-16 flex flex-col items-center shadow-2xl shadow-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: discAtual?.cor || '#0284C7' }} />
        
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter mb-2 uppercase">{discAtual?.nome || 'Selecione'}</h2>
        <p className="text-cyan-600 font-bold text-[10px] uppercase tracking-[0.5em] mb-12">{topicoAtivo?.nome || 'Tópico'}</p>
        
        {/* Container do Tempo com a Luz de Fundo */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/10 blur-[60px] rounded-full animate-pulse" />
          <div className="relative text-[10rem] font-medium text-slate-900 leading-none mb-16 tracking-tighter tabular-nums">
            {new Date(seconds * 1000).toISOString().substr(11, 8)}
          </div>
        </div>

        <button onClick={() => { setIsRunning(true); setSeconds(0) }} className="bg-cyan-50 text-cyan-600 border border-cyan-200 px-16 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.5em] hover:bg-cyan-600 hover:text-white transition-all active:scale-95 shadow-sm">
          Iniciar Foco
        </button>
      </div>

      {/* OS DOIS NOVOS OBJETOS DE MÉTRICAS */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-left">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Hoje</span>
          <p className="text-xl font-black text-slate-800 tracking-tight">04h 22m</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-left">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Média Semanal</span>
          <p className="text-xl font-black text-slate-800 tracking-tight">05h 10m</p>
        </div>
      </div>
    </div>

    {/* COLUNA DIREITA: REVISÕES */}
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
      <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200 min-h-[400px]">
        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] mb-8">Fila de revisões</h3>
        <div className="space-y-4">
          {radarRevisao.map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-200 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 h-full w-1" style={{ background: item.corMateria }} />
              <span className="text-[8px] font-black text-slate-400 uppercase mb-1 block">{item.nomeMateria}</span>
              <p className="text-[14px] font-bold italic text-slate-800 leading-tight mb-4">{item.nome}</p>
              <button onClick={() => { setIdDiscAtiva(item.discId); setIdTopicoAtivo(item.id); setSeconds(0); setIsRunning(true); }} className="w-full py-2 bg-cyan-50 border border-cyan-100 rounded-lg text-[7px] font-black uppercase text-cyan-600">Iniciar Revisão</button>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-200 mt-8">
          <button onClick={() => setIsFeedbackOpen(true)} className="w-full bg-white p-5 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-cyan-400 transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center text-sm"></div>
              <div><h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Sugestões MVP</h4><p className="text-[9px] text-slate-400 font-medium">Envie sua ideia agora</p></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* MODAL DE SUGESTÕES CORRIGIDO */}
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#082040]/80 backdrop-blur-md" onClick={() => !enviado && setIsFeedbackOpen(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-[48px] p-12 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-cyan-500" />
              {!enviado ? (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 italic uppercase">Sugestões <span className="text-cyan-600">MVP</span></h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sua ideia é fundamental</p>
                    </div>
                    <button onClick={() => setIsFeedbackOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors">×</button>
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="O que podemos melhorar?"
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm text-slate-700 focus:outline-none focus:border-cyan-500 transition-all resize-none mb-6"
                  />
                  <button
                    onClick={handleSendFeedback}
                    className="w-full bg-[#082040] text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-[#164F73] transition-all"
                  >
                    Enviar Sugestão
                  </button>
                </>
              ) : (
                <div className="py-12 text-center animate-pulse">
                  <div className="text-6xl mb-4"></div>
                  <h3 className="text-2xl font-black italic text-slate-900 uppercase">Sugestão Enviada!</h3>
                  <p className="text-slate-400 text-sm mt-2">Obrigado por colaborar.</p>
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

