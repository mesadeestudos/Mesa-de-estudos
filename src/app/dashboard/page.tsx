'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [abaInterna, setAbaInterna] = useState<'estudo' | 'historico'>('estudo');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [xp, setXp] = useState(750);
  const [strike, setStrike] = useState(12);
  const [filtroMateria, setFiltroMateria] = useState('Todas');
  const [showMateriaSelector, setShowMateriaSelector] = useState(false);

  const [materias, setMaterias] = useState([
    { id: 1, nome: 'Direito Constitucional', cor: '#06b6d4', topicos: [{ id: 101, nome: 'Direitos Fundamentais', tempoEstudado: 145, metaMinutos: 240, concluido: false }, { id: 102, nome: 'Organização do Estado', tempoEstudado: 80, metaMinutos: 180, concluido: false }] },
    { id: 2, nome: 'Português', cor: '#6366f1', topicos: [{ id: 201, nome: 'Sintaxe', tempoEstudado: 300, metaMinutos: 300, concluido: true }, { id: 202, nome: 'Morfologia', tempoEstudado: 45, metaMinutos: 200, concluido: false }] },
    { id: 3, nome: 'Direito Administrativo', cor: '#f59e0b', topicos: [{ id: 301, nome: 'Atos Administrativos', tempoEstudado: 10, metaMinutos: 360, concluido: false }] }
  ]);

  const [missoes, setMissoes] = useState([
    { id: 1, tarefa: 'Estudar Constitucional', detalhe: 'Bater meta de 2h', concluida: false },
    { id: 2, tarefa: 'Revisar Sintaxe', detalhe: 'Ciclo de 7 dias', concluida: true },
  ]);

  const [materiaAtivaIdx, setMateriaAtivaIdx] = useState(0);
  const [topicoAtivoIdx, setTopicoAtivoIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
        if (seconds % 60 === 0) setXp(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, seconds]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const concluirTopico = (mIdx: number, tIdx: number) => {
    const novasMaterias = [...materias];
    novasMaterias[mIdx].topicos[tIdx].concluido = true;
    setMaterias(novasMaterias);
  };

  const materiaAtiva = materias[materiaAtivaIdx];
  const topicoAtivo = materiaAtiva.topicos[topicoAtivoIdx];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      
      {/* HEADER PRINCIPAL (XP E STRIKE) */}
      <header className="h-20 bg-white flex items-center justify-between px-8 sticky top-0 z-50 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_azul.png" alt="Logo" className="h-10 w-auto" />
            <span className="text-[#0F172A] font-black text-lg tracking-tighter uppercase italic hidden xl:block">Mesa de Estudos</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 font-black text-orange-600 shadow-sm">🔥 {strike}</div>
          <div className="hidden sm:flex flex-col gap-1 w-32 text-right">
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase"><span>Nível {Math.floor(xp / 100)}</span><span>{xp % 100}%</span></div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${xp % 100}%` }} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">MS</div>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-[1500px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA PRINCIPAL (DINÂMICA) */}
          <div className={`space-y-8 ${isRunning ? 'xl:col-span-12' : 'xl:col-span-8'}`}>
            
            {/* SELETOR DE ABAS INTERNAS NO DASHBOARD */}
            {!isRunning && (
              <div className="flex gap-2 p-1.5 bg-slate-200/50 w-fit rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setAbaInterna('estudo')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${abaInterna === 'estudo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mesa de Estudo
                </button>
                <button 
                  onClick={() => setAbaInterna('historico')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${abaInterna === 'historico' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Análise & Histórico
                </button>
              </div>
            )}

            {abaInterna === 'estudo' || isRunning ? (
              <>
                {/* CARD CRONÔMETRO / FOCO */}
                <section className="bg-white border border-slate-200 p-10 rounded-[40px] shadow-lg relative overflow-hidden">
                  {isRunning && (
                    <button onClick={() => setShowMateriaSelector(!showMateriaSelector)} className="absolute top-8 right-8 bg-slate-50 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase border border-slate-200 hover:bg-slate-100 z-50">🔄 Trocar Matéria</button>
                  )}
                  {showMateriaSelector && isRunning && (
                    <div className="absolute top-20 right-8 w-64 bg-white rounded-[30px] shadow-2xl border border-slate-200 p-5 z-50 animate-in zoom-in-95">
                      {materias.map((m, idx) => (
                        <button key={m.id} onClick={() => { setMateriaAtivaIdx(idx); setShowMateriaSelector(false); }} className={`w-full text-left p-4 rounded-2xl text-[10px] font-bold mb-1 ${materiaAtivaIdx === idx ? 'bg-cyan-50 text-cyan-600' : 'hover:bg-slate-50'}`}>{m.nome}</button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                      <h2 className="text-5xl font-black text-slate-800 tracking-tight leading-tight">{materiaAtiva.nome}</h2>
                      <p className="text-cyan-600 font-black text-md uppercase tracking-[0.2em] mt-3">{topicoAtivo.concluido ? '✅ Concluído' : topicoAtivo.nome}</p>
                    </div>
                    <div className={`font-black font-mono text-slate-900 tabular-nums ${isRunning ? 'text-9xl' : 'text-7xl'}`}>{formatTime(seconds)}</div>
                  </div>
                  
                  <div className={`flex gap-4 mt-12 ${isRunning ? 'justify-center' : ''}`}>
                    <button onClick={() => setIsRunning(!isRunning)} className="px-12 py-6 rounded-[28px] font-black text-sm uppercase tracking-widest bg-[#0F172A] text-white shadow-lg transform transition active:scale-95">{isRunning ? 'Pausar Estudo' : 'Iniciar Modo de Foco'}</button>
                    {isRunning && <button onClick={() => concluirTopico(materiaAtivaIdx, topicoAtivoIdx)} className="px-8 py-6 rounded-[28px] font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white shadow-lg">Concluir Tópico</button>}
                  </div>
                </section>

                {/* LISTA DE TÓPICOS ABAIXO DO CRONÔMETRO */}
                {!isRunning && (
                  <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest italic text-center underline decoration-cyan-400">Progresso da Disciplina</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {materiaAtiva.topicos.map((t, idx) => {
                        const percent = Math.min(Math.round((t.tempoEstudado / t.metaMinutos) * 100), 100);
                        return (
                          <div key={t.id} className={`p-6 rounded-[32px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${topicoAtivoIdx === idx ? 'bg-slate-50 border-cyan-400' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                            <div className="flex-1 cursor-pointer" onClick={() => setTopicoAtivoIdx(idx)}>
                              <div className="flex items-center gap-3 mb-2">
                                <p className={`text-[13px] font-black uppercase ${t.concluido ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.nome}</p>
                                {t.concluido && <span className="bg-emerald-100 text-emerald-600 text-[8px] px-2 py-0.5 rounded-full font-black uppercase">Finalizado</span>}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${t.concluido ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${percent}%` }} /></div>
                                <span className="text-[10px] font-black text-slate-500">{percent}%</span>
                              </div>
                            </div>
                            <button onClick={() => concluirTopico(materiaAtivaIdx, idx)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${t.concluido ? 'bg-slate-100 text-slate-300 pointer-events-none' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white'}`}>{t.concluido ? 'Concluído' : 'Concluir'}</button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* SEÇÃO DE HISTÓRICO (DENTRO DA COLUNA PRINCIPAL) */
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* VOLUME SEMANAL */}
                  <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8 italic border-b border-slate-100 pb-4">Volume Semanal</h3>
                    <div className="flex items-end justify-between h-40 gap-2">
                      {[240, 180, 310, 150, 200, 90, 0].map((min, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                          <div className="w-full bg-slate-50 rounded-t-xl relative flex items-end h-full overflow-hidden border border-slate-100/50">
                            <div className="w-full bg-[#0F172A] transition-all duration-1000" style={{ height: `${(min/350)*100}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* RESUMO TÉCNICO */}
                  <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[11px] font-black text-slate-400 uppercase mb-4 tracking-widest italic">Performance</h3>
                      <div className="space-y-3">
                        {['Total: 19h 30m', 'Meta: 85%', 'Eficiência: +12%'].map(stat => (
                          <div key={stat} className="p-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-700 border border-slate-100">{stat}</div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 mt-6">
                      <p className="text-[9px] font-black text-slate-400 uppercase italic">Filtro Ativo: {filtroMateria}</p>
                    </div>
                  </section>
                </div>

                {/* ANÁLISE DETALHADA POR MATÉRIA E TÓPICO */}
                <section className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-lg">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] mb-10 border-b pb-4">Análise por Disciplina</h3>
                  <div className="space-y-12">
                    {materias.map(m => (
                      <div key={m.id} className="space-y-6">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: m.cor }} />
                            <span className="text-[14px] font-black uppercase text-slate-800 italic">{m.nome}</span>
                          </div>
                          <span className="text-2xl font-black italic text-slate-800">{Math.round((m.topicos.reduce((a,b)=>a+b.tempoEstudado,0)/m.topicos.reduce((a,b)=>a+b.metaMinutos,0))*100)}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div className="h-full transition-all duration-1000 shadow-sm" style={{ width: `${Math.round((m.topicos.reduce((a,b)=>a+b.tempoEstudado,0)/m.topicos.reduce((a,b)=>a+b.metaMinutos,0))*100)}%`, backgroundColor: m.cor }} />
                        </div>
                        {/* MINI-TÓPICOS NO HISTÓRICO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {m.topicos.map(t => (
                            <div key={t.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500 uppercase truncate pr-4">{t.nome}</span>
                              <span className="text-[10px] font-black text-slate-700">{Math.round((t.tempoEstudado/t.metaMinutos)*100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* COLUNA LATERAL FIXA (MISSÕES E REVISÕES) */}
          {!isRunning && (
            <div className="xl:col-span-4 space-y-8 animate-in slide-in-from-right-5">
              
              {/* MISSÕES DE HOJE */}
              <section className="bg-[#0F172A] p-8 rounded-[40px] shadow-xl text-white">
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 italic underline decoration-cyan-400/30">Missões Diárias</h3>
                <div className="space-y-4">
                  {missoes.map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${m.concluida ? 'bg-cyan-500 border-cyan-500 scale-110 shadow-lg' : 'border-white/20 hover:border-white/40'}`}>
                        {m.concluida && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-tight ${m.concluida ? 'line-through text-slate-500' : 'text-white'}`}>{m.tarefa}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* SELETOR DE MATÉRIA LATERAL */}
              <section className="bg-white p-8 rounded-[40px] shadow-md border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest italic text-center">Focar em Disciplina</h3>
                <div className="flex flex-col gap-2">
                  {materias.map((m, idx) => (
                    <button 
                      key={m.id} 
                      onClick={() => { setMateriaAtivaIdx(idx); setAbaInterna('estudo'); }} 
                      className={`p-4 rounded-2xl text-[10px] font-black uppercase text-left border transition-all ${materiaAtivaIdx === idx ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md scale-102' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                    >
                      {m.nome}
                    </button>
                  ))}
                </div>
              </section>

              {/* REVISÕES PENDENTES */}
              <section className="bg-white p-8 rounded-[40px] shadow-md border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Revisões</h3>
                  <span className="text-[8px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-full">3 Hoje</span>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex justify-between items-center group cursor-pointer hover:bg-indigo-100 transition-all">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase">Sintaxe</span>
                    <span className="text-[8px] bg-white text-indigo-600 px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">Revisar</span>
                  </div>
                </div>
              </section>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}