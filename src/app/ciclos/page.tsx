'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  gerarCicloEstrutural,
  selecionarDisciplinas,
} from '@/lib/cicloAlgorithm';
import {
  Bell, Settings, User, LayoutDashboard, BookOpen, RefreshCw,
  LineChart, Calendar, LogOut, Search, ChevronDown, ChevronRight, Check,
  Lock, Zap, SlidersHorizontal, Info, CheckCircle2, Menu, AlertCircle,
  Pencil, ClipboardCheck, CalendarDays, type LucideIcon,
} from 'lucide-react';

interface Edital      { id: number; nome: string; descricao: string; banca: string; status: string; data: string; }
interface Disciplina  {
  id: number;
  nome: string;
  tipo: string;
  peso: number | null;
  qtd_questoes: number | null;
  qtd_topicos?: number | null;
  categoria_cognitiva?: string | null;
}
interface Cargo       { id: number; nome: string; disciplinas: Disciplina[]; }
type MomentoEstudo = 'COMECO_ZERO' | 'PROVA_DATA' | 'ATRASADO' | 'REVISAR' | 'QUESTOES' | 'CICLO_AUTOMATICO';

const MOMENTOS_ESTUDO_OPCOES: Array<{ key: MomentoEstudo; titulo: string; descricao: string; metodo: string; Icone: LucideIcon; horasSugeridas: number }> = [
  { key: 'COMECO_ZERO',     titulo: 'Estou começando do zero',          descricao: 'Passos guiados para criar rotina sem complicação.',           metodo: 'Trilha por Objetivo',    Icone: BookOpen,      horasSugeridas: 2 },
  { key: 'PROVA_DATA',      titulo: 'Tenho prova com data marcada',     descricao: 'Plano por prazo, previsão de conclusão e alertas de atraso.', metodo: 'Plano por Prazo',        Icone: CalendarDays,  horasSugeridas: 3 },
  { key: 'ATRASADO',        titulo: 'Estou atrasado',                   descricao: 'Recupera revisões e reorganiza prioridades sem sobrecarga.',  metodo: 'Recuperação de Atraso',  Icone: AlertCircle,   horasSugeridas: 4 },
  { key: 'REVISAR',         titulo: 'Quero revisar',                    descricao: 'Prioriza memória, revisões vencidas e tópicos já estudados.', metodo: 'Revisão Intensiva',      Icone: RefreshCw,     horasSugeridas: 2 },
  { key: 'QUESTOES',        titulo: 'Quero resolver questões',          descricao: 'Usa acertos e erros para guiar teoria e prática.',            metodo: 'Modo Questões',          Icone: ClipboardCheck, horasSugeridas: 2 },
  { key: 'CICLO_AUTOMATICO', titulo: 'Quero seguir um ciclo automático', descricao: 'Mantém a rotação inteligente entre disciplinas.',            metodo: 'Ciclo Inteligente',      Icone: Zap,           horasSugeridas: 2 },
];

interface HojeSlot {
  ordem:           number;
  idDisciplina:    number;
  nome:            string;
  tipo:            string;
  categoria:       string;
  nivel:           string | null;
  minutosAlocados: number;
}

interface DiscCiclo {
  idDisciplina: number;
  nome:         string;
  tipo:         string;
  categoria:    string;
  nivel:        string | null;
  frequencia:   number;
}

interface CicloAtivo {
  idCiclo:      number;
  idPlano:      number;
  metodo:       string;
  horasPorDia:  number;
  cargoNome:    string;
  concursoNome: string;
  bancaSigla:   string;
  dataCriacao:  string;
  posicaoAtual: number;
  totalSlots:   number;
  discsPorDia:  number;
  diasPorCiclo: number;
  hojeSlots:    HojeSlot[];
  cicloSlots:   HojeSlot[];
  disciplinas:  DiscCiclo[];
}

interface DisciplinaPreview extends Disciplina {
  dificuldade: 'Baixo' | 'Médio' | 'Alto';
}

interface SessaoPreview {
  ordem: number;
  id: number;
  nome: string;
  tipo: string;
  dificuldade: 'Baixo' | 'Médio' | 'Alto';
}

interface ConcursoApi {
  id: number;
  nome: string;
  descricao?: string | null;
  banca?: string | null;
  status?: string | null;
  data?: string | null;
}

interface DisciplinaApi {
  id_disciplina?: number;
  id?: number;
  nome: string;
  tipo?: string | null;
  peso?: number | null;
  qtd_questoes?: number | null;
  qtd_topicos?: number | null;
  categoria_cognitiva?: string | null;
}

interface CargoApi {
  id_cargo?: number;
  id?: number;
  nome: string;
  disciplina?: DisciplinaApi[];
}

interface ConcursoDetalheApi {
  edital?: Array<{
    cargo?: CargoApi[];
  }>;
}

const STEPS = [
  { num: 1, label: 'Perfil', title: 'Defina seu perfil', description: 'Escolha seu momento e disponibilidade.' },
  { num: 2, label: 'Edital', title: 'Escolha edital e cargo', description: 'O cargo define as disciplinas disponíveis.' },
  { num: 3, label: 'Método', title: 'Escolha o nível de controle', description: 'Deixe o sistema decidir ou personalize as prioridades.' },
  { num: 4, label: 'Resumo', title: 'Revise e crie o ciclo', description: 'Confira a composição antes de finalizar.' },
];

const getTipoDisciplinaLabel = (tipo?: string | null) => {
  const normalizado = tipo?.toUpperCase();
  if (normalizado === 'B' || normalizado === 'BASICA' || normalizado === 'BÁSICA') return 'Básica';
  if (normalizado === 'E' || normalizado === 'ESPECIFICA' || normalizado === 'ESPECÍFICA') return 'Específica';
  return null;
};

const gerarPreviewCiclo = (
  disciplinas: DisciplinaPreview[],
  horasDiarias: number,
): SessaoPreview[] => {
  if (disciplinas.length === 0) return [];
  const { ciclo } = gerarCicloEstrutural(disciplinas, horasDiarias, 'equilibrado', true);
  return ciclo.map((disciplina, indice) => ({
    ordem: indice + 1,
    id: disciplina.id,
    nome: disciplina.nome,
    tipo: disciplina.tipo,
    dificuldade: disciplina.dificuldade,
  }));
};

export default function CiclosEstudo() {
  const router = useRouter();
  const [mounted, setMounted]             = useState(false);
  const [etapa, setEtapa]                 = useState(1);
  const [direcao, setDirecao]             = useState<'frente' | 'atras'>('frente');
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Estado global da página
  const [estado, setEstado]                       = useState<'loading' | 'visualizacao' | 'criacao'>('loading');
  const [cicloAtivo, setCicloAtivo]               = useState<CicloAtivo | null>(null);
  const [confirmandoEdicao, setConfirmandoEdicao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [rebalanceando, setRebalanceando] = useState(false);

  // Etapa 1
  const [horasDiarias, setHorasDiarias] = useState(2);
  const [momentoEstudo, setMomentoEstudo] = useState<MomentoEstudo>('CICLO_AUTOMATICO');

  // Etapa 2
  const [editais, setEditais]                         = useState<Edital[]>([]);
  const [busca, setBusca]                             = useState('');
  const [editalSelecionado, setEditalSelecionado]     = useState<Edital | null>(null);
  const [cargos, setCargos]                           = useState<Cargo[]>([]);
  const [cargoSelecionado, setCargoSelecionado]       = useState<Cargo | null>(null);
  const [loadingEditais, setLoadingEditais]           = useState(false);
  const [loadingCargos, setLoadingCargos]             = useState(false);

  // Etapa 3
  const [modoCiclo, setModoCiclo]                             = useState<'automatico' | 'personalizado'>('automatico');
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [dificuldades, setDificuldades]                       = useState<Record<number, string>>({});
  const [buscaDisciplina, setBuscaDisciplina]                 = useState('');
  const [salvando, setSalvando]                               = useState(false);
  const [erroSalvar, setErroSalvar]                           = useState<string | null>(null);
  const [previewExpandida, setPreviewExpandida]               = useState(false);
  const [previewModalAberta, setPreviewModalAberta]           = useState(false);
  const [previewPinnedId, setPreviewPinnedId]                 = useState<number | null>(null);
  const [previewHighlightId, setPreviewHighlightId]           = useState<number | null>(null);
  const [visualizacaoHoverOrdem, setVisualizacaoHoverOrdem]   = useState<number | null>(null);
  const [visualizacaoHoverDisciplinaId, setVisualizacaoHoverDisciplinaId] = useState<number | null>(null);
  const visualizacaoHoverTimeoutRef                           = useRef<ReturnType<typeof setTimeout> | null>(null);

  const horasDiariasLimitadas = Math.min(horasDiarias, 8);
  const opcaoMomentoAtual = MOMENTOS_ESTUDO_OPCOES.find(o => o.key === momentoEstudo) ?? MOMENTOS_ESTUDO_OPCOES[5];

  // Computed — espelha a lógica do servidor
  const maxDisciplinas       = useMemo(() => horasDiariasLimitadas * 2,          [horasDiariasLimitadas]);
  const minutosPerDisciplina = 60;
  const disciplinas = useMemo(() => cargoSelecionado?.disciplinas ?? [], [cargoSelecionado]);
  const disciplinasOrdenadas = useMemo(() =>
    [...disciplinas].sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'B' ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    }),
  [disciplinas]);
  const disciplinasPersonalizadasFiltradas = useMemo(
    () => buscaDisciplina
      ? disciplinasOrdenadas.filter(disc => disc.nome.toLowerCase().includes(buscaDisciplina.toLowerCase()))
      : disciplinasOrdenadas,
    [buscaDisciplina, disciplinasOrdenadas]
  );
  const resumoTiposSelecionadas = useMemo(() => {
    const selecionadas = disciplinas.filter(disc => disciplinasSelecionadas.includes(disc.id));
    const especificas = selecionadas.filter(disc => getTipoDisciplinaLabel(disc.tipo) === 'Específica').length;
    const basicas = selecionadas.length - especificas;
    return { especificas, basicas };
  }, [disciplinas, disciplinasSelecionadas]);
  const disciplinasAutomatico = useMemo(() => {
    if (disciplinas.length === 0) return { selecionadas: [] as Disciplina[], foraDociclo: [] as Disciplina[] };
    const { selecionadas } = selecionarDisciplinas(disciplinas, horasDiariasLimitadas, false);
    const idsNoCiclo = new Set(selecionadas.map(d => d.id));
    const foraDociclo = disciplinas.filter(d => !idsNoCiclo.has(d.id));
    return { selecionadas, foraDociclo };
  }, [disciplinas, horasDiariasLimitadas]);
  const disciplinasSelecionadasDetalhadas = useMemo(
    () => disciplinasSelecionadas
      .map(id => disciplinas.find(disc => disc.id === id))
      .filter((disc): disc is Disciplina => Boolean(disc)),
    [disciplinas, disciplinasSelecionadas]
  );
  const dificuldadesPendentesCount = useMemo(
    () => disciplinasSelecionadas.filter(id => !dificuldades[id]).length,
    [disciplinasSelecionadas, dificuldades]
  );
  const disciplinasSelecionadasPreview = useMemo(
    () => disciplinasSelecionadasDetalhadas.slice(0, 5),
    [disciplinasSelecionadasDetalhadas]
  );
  const disciplinasSelecionadasRestantes = Math.max(0, disciplinasSelecionadasDetalhadas.length - disciplinasSelecionadasPreview.length);
  const disciplinasPreview = useMemo<DisciplinaPreview[]>(() => {
    if (modoCiclo === 'automatico') {
      return disciplinasAutomatico.selecionadas.map(disciplina => ({
        ...disciplina,
        dificuldade: 'Médio',
      }));
    }

    return disciplinasSelecionadasDetalhadas.map(disciplina => ({
      ...disciplina,
      dificuldade: (dificuldades[disciplina.id] as 'Baixo' | 'Médio' | 'Alto' | undefined) ?? 'Médio',
    }));
  }, [modoCiclo, disciplinasAutomatico.selecionadas, disciplinasSelecionadasDetalhadas, dificuldades]);
  const cicloPreview = useMemo(
    () => gerarPreviewCiclo(disciplinasPreview, horasDiariasLimitadas),
    [disciplinasPreview, horasDiariasLimitadas]
  );
  const limiteSequenciaPreview = 12;
  const cicloPreviewVisivel = previewExpandida ? cicloPreview : cicloPreview.slice(0, limiteSequenciaPreview);
  const disciplinasResumoPreview = useMemo(() => {
    const mapa = new Map<number, { id: number; nome: string; tipo: string; dificuldade: string; sessoes: number; primeiraOrdem: number }>();
    for (const sessao of cicloPreview) {
      const atual = mapa.get(sessao.id);
      if (atual) {
        atual.sessoes += 1;
      } else {
        mapa.set(sessao.id, {
          id: sessao.id,
          nome: sessao.nome,
          tipo: sessao.tipo,
          dificuldade: sessao.dificuldade,
          sessoes: 1,
          primeiraOrdem: sessao.ordem,
        });
      }
    }
    return [...mapa.values()].sort((a, b) => b.sessoes - a.sessoes || a.primeiraOrdem - b.primeiraOrdem);
  }, [cicloPreview]);
  const sessaoInicialPreview = cicloPreview[0] ?? null;
  const previewHighlightAtivo = previewHighlightId ?? previewPinnedId ?? sessaoInicialPreview?.id ?? null;
  const disciplinaHighlightPreview = disciplinasResumoPreview.find(item => item.id === previewHighlightAtivo) ?? null;
  const disciplinasAutomaticasAgrupadas = useMemo(() => ({
    especificas: disciplinasPreview.filter(disciplina => getTipoDisciplinaLabel(disciplina.tipo) === 'Específica'),
    basicas: disciplinasPreview.filter(disciplina => getTipoDisciplinaLabel(disciplina.tipo) !== 'Específica'),
  }), [disciplinasPreview]);

  const todasDificuldadesDefinidas = useMemo(
    () => disciplinasSelecionadas.every(id => Boolean(dificuldades[id])),
    [disciplinasSelecionadas, dificuldades]
  );
  const podeContinuarEtapa2 = editalSelecionado !== null && cargoSelecionado !== null;
  const podeFinalizar = modoCiclo === 'automatico'
    || (disciplinasSelecionadas.length > 0 && todasDificuldadesDefinidas);
  const visualizacaoProximasSessoes = useMemo(() => {
    if (!cicloAtivo?.cicloSlots?.length) return [] as HojeSlot[];
    return Array.from({ length: cicloAtivo.totalSlots }, (_, indice) => {
      const posicao = (cicloAtivo.posicaoAtual - 1 + indice) % cicloAtivo.totalSlots;
      return {
        ...cicloAtivo.cicloSlots[posicao],
        ordem: posicao + 1,
      };
    });
  }, [cicloAtivo]);
  const visualizacaoDiscResumo = useMemo(() => {
    if (!cicloAtivo?.cicloSlots?.length) return [] as Array<{ idDisciplina: number; nome: string; tipo: string; nivel: string | null; frequencia: number; primeiraOrdem: number }>;
    const mapa = new Map<number, { idDisciplina: number; nome: string; tipo: string; nivel: string | null; frequencia: number; primeiraOrdem: number }>();
    cicloAtivo.cicloSlots.forEach((slot, indice) => {
      const atual = mapa.get(slot.idDisciplina);
      if (atual) {
        atual.frequencia += 1;
      } else {
        mapa.set(slot.idDisciplina, {
          idDisciplina: slot.idDisciplina,
          nome: slot.nome,
          tipo: slot.tipo,
          nivel: slot.nivel,
          frequencia: 1,
          primeiraOrdem: indice + 1,
        });
      }
    });
    return [...mapa.values()].sort((a, b) => b.frequencia - a.frequencia || a.primeiraOrdem - b.primeiraOrdem);
  }, [cicloAtivo]);
  const visualizacaoOrdemAtiva = visualizacaoHoverDisciplinaId ? null : (visualizacaoHoverOrdem ?? cicloAtivo?.posicaoAtual ?? null);
  const visualizacaoSessaoAtiva = useMemo(
    () => {
      if (visualizacaoHoverDisciplinaId) {
        return cicloAtivo?.cicloSlots?.find(slot => slot.idDisciplina === visualizacaoHoverDisciplinaId) ?? null;
      }
      return cicloAtivo?.cicloSlots?.find(slot => slot.ordem === visualizacaoOrdemAtiva) ?? null;
    },
    [cicloAtivo, visualizacaoHoverDisciplinaId, visualizacaoOrdemAtiva]
  );
  const visualizacaoDisciplinaAtivaId = visualizacaoHoverDisciplinaId ?? visualizacaoSessaoAtiva?.idDisciplina ?? cicloAtivo?.hojeSlots[0]?.idDisciplina ?? null;
  const indicadorAtualAnel = useMemo(() => {
    if (!cicloAtivo?.totalSlots) return null;
    const segmento = 360 / cicloAtivo.totalSlots;
    const angulo = -90 + ((cicloAtivo.posicaoAtual - 1) * segmento) + (segmento / 2);
    const radianos = (angulo * Math.PI) / 180;
    const raioCard = 43;
    return {
      left: `${50 + Math.cos(radianos) * raioCard}%`,
      top: `${50 + Math.sin(radianos) * raioCard}%`,
      rotation: `${angulo + 90}deg`,
    };
  }, [cicloAtivo]);

  const irParaEtapa = (nova: number) => {
    setDirecao(nova > etapa ? 'frente' : 'atras');
    setEtapa(nova);
  };

  const limparHoverVisualizacao = () => {
    if (visualizacaoHoverTimeoutRef.current) {
      clearTimeout(visualizacaoHoverTimeoutRef.current);
      visualizacaoHoverTimeoutRef.current = null;
    }
    visualizacaoHoverTimeoutRef.current = setTimeout(() => {
      setVisualizacaoHoverOrdem(null);
      setVisualizacaoHoverDisciplinaId(null);
      visualizacaoHoverTimeoutRef.current = null;
    }, 70);
  };

  const ativarHoverSessaoVisualizacao = (ordem: number) => {
    if (visualizacaoHoverTimeoutRef.current) {
      clearTimeout(visualizacaoHoverTimeoutRef.current);
      visualizacaoHoverTimeoutRef.current = null;
    }
    setVisualizacaoHoverDisciplinaId(null);
    setVisualizacaoHoverOrdem(ordem);
  };

  const ativarHoverDisciplinaVisualizacao = (idDisciplina: number) => {
    if (visualizacaoHoverTimeoutRef.current) {
      clearTimeout(visualizacaoHoverTimeoutRef.current);
      visualizacaoHoverTimeoutRef.current = null;
    }
    setVisualizacaoHoverOrdem(null);
    setVisualizacaoHoverDisciplinaId(idDisciplina);
  };

  const animClass = direcao === 'frente'
    ? 'animate-in fade-in slide-in-from-right-4 duration-300'
    : 'animate-in fade-in slide-in-from-left-4 duration-300';

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const opcao = MOMENTOS_ESTUDO_OPCOES.find(o => o.key === momentoEstudo);
    if (opcao) setHorasDiarias(opcao.horasSugeridas);
  }, [momentoEstudo]);
  useEffect(() => { if (mounted) fetchCicloAtivo(); }, [mounted]);
  useEffect(() => { if (etapa === 2 && editais.length === 0) fetchEditais(); }, [etapa, editais.length]);
  useEffect(() => { if (editalSelecionado) fetchCargos(editalSelecionado.id); }, [editalSelecionado]);
  useEffect(() => { setPreviewExpandida(false); }, [modoCiclo, cargoSelecionado, disciplinasSelecionadas.length, horasDiariasLimitadas]);
  useEffect(() => { setPreviewHighlightId(null); }, [cicloPreview]);
  useEffect(() => { setPreviewPinnedId(null); }, [cicloPreview]);
  useEffect(() => { setPreviewModalAberta(false); }, [modoCiclo, cargoSelecionado, disciplinasSelecionadas.length, horasDiariasLimitadas]);
  useEffect(() => {
    setVisualizacaoHoverOrdem(null);
    setVisualizacaoHoverDisciplinaId(null);
  }, [cicloAtivo?.idCiclo, cicloAtivo?.posicaoAtual]);
  useEffect(() => () => {
    if (visualizacaoHoverTimeoutRef.current) {
      clearTimeout(visualizacaoHoverTimeoutRef.current);
    }
  }, []);
  useEffect(() => {
    if (!previewModalAberta) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewModalAberta(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewModalAberta]);

  const fetchCicloAtivo = async () => {
    try {
      const res  = await fetch('/api/ciclos');
      const data = await res.json();
      if (res.ok) {
        if (data) {
          setCicloAtivo(data);
          setEstado('visualizacao');
        } else {
          setEstado('criacao');
        }
      } else {
        setEstado('criacao');
      }
    } catch {
      setEstado('criacao');
    }
  };

  const fetchEditais = async () => {
    setLoadingEditais(true);
    try {
      const res  = await fetch('/api/concursos');
      const data = await res.json() as ConcursoApi[];
      setEditais(data.map((c) => ({
        id: c.id, nome: c.nome, descricao: c.descricao || c.nome, banca: c.banca || '',
        status: c.status ? c.status.toUpperCase() : 'PREVISTO',
        data: c.data ? c.data.split('T')[0].split('-').reverse().join('/') : 'A definir',
      })));
    } catch (e) { console.error(e); } finally { setLoadingEditais(false); }
  };

  const fetchCargos = async (id: number) => {
    setLoadingCargos(true);
    setCargoSelecionado(null); setDisciplinasSelecionadas([]); setDificuldades({});
    try {
      const res  = await fetch(`/api/concursos/${id}`);
      const data = await res.json() as ConcursoDetalheApi;
      const lista: Cargo[] = data.edital?.[0]?.cargo?.flatMap((c) => {
        const idCargo = c.id_cargo ?? c.id;
        if (!idCargo) return [];

        return [{
          id: idCargo,
          nome: c.nome,
          disciplinas: c.disciplina?.flatMap((d) => {
            const idDisciplina = d.id_disciplina ?? d.id;
            if (!idDisciplina) return [];

            return [{
              id: idDisciplina,
              nome: d.nome,
              tipo: d.tipo ?? 'B',
              peso: d.peso ?? null,
              qtd_questoes: d.qtd_questoes ?? null,
              qtd_topicos: d.qtd_topicos ?? null,
              categoria_cognitiva: d.categoria_cognitiva ?? null,
            }];
          }) ?? [],
        }];
      }) ?? [];
      setCargos(lista);
    } catch (e) { console.error(e); } finally { setLoadingCargos(false); }
  };

  const toggleDisciplina = (id: number) => {
    if (disciplinasSelecionadas.includes(id)) {
      setDisciplinasSelecionadas(prev => prev.filter(d => d !== id));
      setDificuldades(prev => { const n = { ...prev }; delete n[id]; return n; });
    } else if (disciplinasSelecionadas.length < maxDisciplinas) {
      setDisciplinasSelecionadas(prev => [...prev, id]);
    }
  };

  const editaisFiltradosBase = useMemo(
    () => busca
      ? editais.filter(e => {
        const termo = busca.toLowerCase();
        return e.nome.toLowerCase().includes(termo) || e.banca.toLowerCase().includes(termo);
      })
      : editais,
    [busca, editais]
  );
  const editaisFiltrados = useMemo(() => editaisFiltradosBase.slice(0, 5), [editaisFiltradosBase]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  };

  const handleFinalizar = async () => {
    if (!cargoSelecionado) return;
    setSalvando(true);
    setErroSalvar(null);
    try {
        const payload = {
          horasDiarias: horasDiariasLimitadas,
          idCargo: cargoSelecionado.id,
          modo:    modoCiclo,
          momentoEstudo,
          disciplinas: modoCiclo === 'personalizado'
            ? disciplinasSelecionadas.map(id => ({ id, dificuldade: dificuldades[id] }))
            : disciplinas.map(d => ({ id: d.id })), // algoritmo seleciona as melhores
      };
      const res  = await fetch('/api/ciclos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Resetar form e ir para visualização
      setEtapa(1); setDirecao('frente');
      setHorasDiarias(2); setMomentoEstudo('CICLO_AUTOMATICO'); setEditalSelecionado(null); setCargoSelecionado(null);
      setModoCiclo('automatico'); setDisciplinasSelecionadas([]); setDificuldades({});
      setEstado('loading');
      await fetchCicloAtivo();
    } catch (err: unknown) {
      setErroSalvar(err instanceof Error ? err.message : 'Erro ao salvar ciclo.');
    } finally {
      setSalvando(false);
    }
  };


  const handleEditar = async () => {
    setEncerrando(true);
    try {
      await fetch('/api/ciclos', { method: 'DELETE' });
      setCicloAtivo(null);
      setEtapa(1); setDirecao('frente');
      setHorasDiarias(2); setMomentoEstudo('CICLO_AUTOMATICO'); setEditalSelecionado(null); setCargoSelecionado(null);
      setModoCiclo('automatico'); setDisciplinasSelecionadas([]); setDificuldades({});
      setEstado('criacao');
    } finally {
      setEncerrando(false);
      setConfirmandoEdicao(false);
    }
  };

  const handleRebalancear = async () => {
    setRebalanceando(true);
    try {
      const res = await fetch('/api/ciclos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'rebalancear' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Não foi possível rebalancear o ciclo.');
      await fetchCicloAtivo();
    } catch (err) {
      console.error(err);
    } finally {
      setRebalanceando(false);
    }
  };

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Visão Geral',        active: false, href: '/dashboard' },
    { icon: <BookOpen size={18} />,        label: 'Minha Mesa',       active: false, href: '/minha-mesa' },
    { icon: <RefreshCw size={18} />,       label: 'Ciclos de estudo', active: true,  href: '/ciclos' },
    { icon: <ClipboardCheck size={18} />,  label: 'Questões',         active: false, href: '/questoes' },
    { icon: <CalendarDays size={18} />,    label: 'Agenda',           active: false, href: '/agenda' },
    { icon: <LineChart size={18} />,       label: 'Desempenho',       active: false, href: '/desempenho' },
    { icon: <Calendar size={18} />,        label: 'Revisões',         active: false, href: '/revisoes' },
    { icon: <Settings size={18} />,        label: 'Configurações',    active: false, href: '/configuracoes' },
    { icon: <User size={18} />,            label: 'Perfil',            active: false, href: '/perfil' },
  ];

  if (!mounted) return <div className="min-h-screen w-full bg-slate-50" />;

  const etapaAtual = STEPS.find(step => step.num === etapa) ?? STEPS[0];
  const progressoEtapas = ((etapa - 1) / (STEPS.length - 1)) * 100;

  /* ------------------------------------------------------- RENDER */
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[linear-gradient(135deg,#eef9ff_0%,#f8fafc_34%,#f4f7ff_68%,#ecfdf5_100%)] text-[#475569] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08)_0%,transparent_28%,rgba(16,185,129,0.07)_58%,transparent_100%)]" />
      <div className="relative flex h-full w-full overflow-hidden">

      {/* -- Modal de confirmação de edição -- */}
      {confirmandoEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Pencil size={20} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Editar ciclo?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              O ciclo atual será desativado e você poderá configurar um novo. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoEdicao(false)}
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar} disabled={encerrando}
                className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {encerrando
                  ? <><RefreshCw size={13} className="animate-spin" /> Aguarde...</>
                  : 'Confirmar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {previewModalAberta && cicloPreview.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => setPreviewModalAberta(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-ciclo-title"
            className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)] sm:rounded-[32px]"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 lg:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Prévia do ciclo</p>
                <p id="preview-ciclo-title" className="mt-1 text-lg font-black text-slate-800 lg:text-xl">Veja o ciclo completo antes de finalizar</p>
                <p className="mt-1 text-sm text-slate-500">
                  O anel mostra o ciclo completo e a lateral destaca o início da sequência.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalAberta(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xl text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
                aria-label="Fechar prévia do ciclo"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
                <p className="text-xs font-medium text-slate-600">
                  {cicloPreview.length > limiteSequenciaPreview
                    ? `O anel mostra o ciclo completo. À direita, você vê as ${limiteSequenciaPreview} primeiras sessões.`
                    : 'O anel abaixo já representa o ciclo completo.'}
                </p>
                  {modoCiclo === 'personalizado' && dificuldadesPendentesCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    Esta é uma prévia provisória: disciplinas sem nível definido aparecem como médio.
                  </p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.05fr)] lg:gap-4">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-4 shadow-sm sm:p-5 lg:rounded-[32px] lg:p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {cicloPreview.length} {cicloPreview.length === 1 ? 'sessão' : 'sessões'}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {disciplinasPreview.length} {disciplinasPreview.length === 1 ? 'disciplina' : 'disciplinas'}
                      </span>
                    </div>

                    <div className="mt-5 flex w-full justify-center">
                      <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px]">
                        <div className="absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-full border border-sky-100 bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sky-700 shadow-sm">
                          Início
                        </div>
                        <svg
                          viewBox="0 0 260 260"
                          role="img"
                          aria-label={`Anel do ciclo com ${cicloPreview.length} ${cicloPreview.length === 1 ? 'sessão' : 'sessões'}. ${sessaoInicialPreview ? `${sessaoInicialPreview.nome} inicia o ciclo.` : ''}`}
                          className="h-full w-full -rotate-90 drop-shadow-[0_24px_54px_rgba(14,165,233,0.12)]"
                        >
                          <circle cx="130" cy="130" r="92" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                          {cicloPreview.map((sessao, index) => {
                            const cor = WHEEL_COLORS[sessao.id % WHEEL_COLORS.length];
                            const total = cicloPreview.length;
                            const circunferencia = 2 * Math.PI * 92;
                            const gap = Math.max(3, total > 24 ? 1.2 : 2.2);
                            const segmento = circunferencia / total;
                            const dash = Math.max(segmento - gap, 4);
                            const offset = -(index * segmento);
                            const destaque = previewHighlightAtivo === sessao.id;
                            const primeiraSessao = index === 0;

                            return (
                              <circle
                                key={`${sessao.id}-${sessao.ordem}`}
                                cx="130"
                                cy="130"
                                r="92"
                                fill="none"
                                stroke={cor}
                                strokeWidth={primeiraSessao || destaque ? 24 : 18}
                                strokeLinecap="round"
                                strokeDasharray={`${dash} ${Math.max(circunferencia - dash, 0)}`}
                                strokeDashoffset={offset}
                                className="transition-all duration-300"
                                style={{ opacity: previewHighlightAtivo && !destaque ? 0.28 : 0.96, filter: primeiraSessao || destaque ? 'drop-shadow(0 0 10px rgba(14,165,233,0.25))' : 'none' }}
                                onMouseEnter={() => setPreviewHighlightId(sessao.id)}
                                onMouseLeave={() => setPreviewHighlightId(null)}
                                onClick={() => setPreviewPinnedId(prev => prev === sessao.id ? null : sessao.id)}
                              />
                            );
                          })}
                        </svg>
                        <div className="absolute inset-[21%] rounded-full border border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(148,163,184,0.18)] backdrop-blur">
                          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                              Volta do ciclo
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-800 lg:text-4xl">{cicloPreview.length}</p>
                            <p className="text-sm font-bold text-slate-500">{cicloPreview.length === 1 ? 'sessão' : 'sessões'}</p>
                            <div className="mt-4 h-px w-20 bg-slate-200" />
                            <p className="mt-4 text-base font-black leading-tight text-slate-800 lg:text-lg">
                              {disciplinaHighlightPreview?.nome ?? sessaoInicialPreview?.nome ?? 'Volta do ciclo'}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {disciplinaHighlightPreview
                                ? `${disciplinaHighlightPreview.sessoes} ${disciplinaHighlightPreview.sessoes === 1 ? 'sessão' : 'sessões'} no ciclo`
                                : `Sessão ${sessaoInicialPreview?.ordem ?? 1} inicia o ciclo`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 max-w-md text-center">
                      <p className="text-base font-black text-slate-800 lg:text-lg">
                        A estrutura completa do seu ciclo
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Ao concluir a última sessão, o ciclo reinicia do início.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:rounded-[28px]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Início da sequência</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">Confira como o ciclo começa antes de continuar estudando.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {previewPinnedId && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPinnedId(null);
                              setPreviewHighlightId(null);
                            }}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                          >
                            Voltar ao início
                          </button>
                        )}
                        {cicloPreview.length > limiteSequenciaPreview && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                            {cicloPreviewVisivel.length} de {cicloPreview.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1 sm:max-h-[372px]">
                      {cicloPreviewVisivel.map(sessao => {
                        const cor = WHEEL_COLORS[sessao.id % WHEEL_COLORS.length];
                        const tipoLabel = getTipoDisciplinaLabel(sessao.tipo);
                        const ativo = previewHighlightAtivo === sessao.id;
                        const inicio = sessao.ordem === (sessaoInicialPreview?.ordem ?? 1);

                        return (
                          <button
                            key={`${sessao.id}-${sessao.ordem}`}
                            type="button"
                            aria-label={`${inicio ? 'Sessão inicial' : `Sessão ${sessao.ordem}`}: ${sessao.nome}`}
                            aria-pressed={previewPinnedId === sessao.id}
                            onMouseEnter={() => setPreviewHighlightId(sessao.id)}
                            onMouseLeave={() => setPreviewHighlightId(null)}
                            onClick={() => setPreviewPinnedId(prev => prev === sessao.id ? null : sessao.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                              ativo
                                ? 'border-sky-200 bg-sky-50'
                                : inicio
                                  ? 'border-sky-100 bg-sky-50/50 hover:border-sky-200'
                                  : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                            }`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                              inicio ? 'bg-sky-500 text-white' : 'bg-white text-slate-700'
                            }`}>
                              {sessao.ordem}
                            </div>
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-800">{sessao.nome}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {inicio ? 'Início do ciclo' : (tipoLabel ?? 'Disciplina')} · {sessao.dificuldade}
                              </p>
                            </div>
                            {inicio && (
                              <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">
                                início
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {cicloPreview.length > limiteSequenciaPreview && (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setPreviewExpandida(prev => !prev)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                          {previewExpandida ? 'Mostrar menos' : `Ver sequência completa (${cicloPreview.length} sessões)`}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:rounded-[28px]">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Disciplinas no ciclo</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Frequência de cada disciplina no ciclo.
                      </p>
                    </div>

                    <div className="mt-4 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                      {disciplinasResumoPreview.map(item => {
                        const cor = WHEEL_COLORS[item.id % WHEEL_COLORS.length];
                        const tipoLabel = getTipoDisciplinaLabel(item.tipo);
                        const ativo = previewHighlightAtivo === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={`${item.nome}, ${item.sessoes} ${item.sessoes === 1 ? 'sessão' : 'sessões'} no ciclo`}
                            aria-pressed={previewPinnedId === item.id}
                            onMouseEnter={() => setPreviewHighlightId(item.id)}
                            onMouseLeave={() => setPreviewHighlightId(null)}
                            onClick={() => setPreviewPinnedId(prev => prev === item.id ? null : item.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                              ativo ? 'border-sky-200 bg-sky-50 shadow-sm' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                            }`}
                          >
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-800">{item.nome}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {item.sessoes} {item.sessoes === 1 ? 'sessão' : 'sessões'}{tipoLabel ? ` · ${tipoLabel}` : ''}
                              </p>
                            </div>
                            {item.primeiraOrdem === (sessaoInicialPreview?.ordem ?? 1) && (
                              <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">
                                início
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -- Overlay mobile -- */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* -- Sidebar -- */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 border-r border-white/30 bg-slate-950/90 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl flex flex-col shrink-0 h-screen transition-transform duration-300 lg:translate-x-0 ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center grow overflow-y-auto min-h-0">
          <div className="w-full px-4 pt-5 pb-4 shrink-0">
            <div className="rounded-[24px] border border-white/10 bg-white/95 px-4 py-3 shadow-xl shadow-sky-950/20">
              <Image src="/logo_azul.png" alt="Logo" width={160} height={96} className="h-20 w-auto mx-auto" priority />
            </div>
          </div>
          <nav className="space-y-1 w-full px-3">
            {navItems.map(item => (
              <MenuItem
                key={item.label}
                icon={item.icon} label={item.label} active={item.active}
                onClick={() => { router.push(item.href); setSidebarAberta(false); }}
              />
            ))}
          </nav>
        </div>
        <div className="p-4 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-red-200 hover:bg-red-500/15 rounded-xl transition-all w-full font-bold text-sm group">
            <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-red-500/20 transition-colors"><LogOut size={18} /></div>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* -- Main -- */}
      <main className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-y-auto">

        {/* Header */}
        <header className="mb-6 flex shrink-0 items-center justify-between rounded-[28px] border border-white/70 bg-white/70 px-4 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarAberta(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Mesa de Estudos</p>
              <h1 className="truncate text-lg font-black text-slate-800">Ciclos de estudo</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 border-r pr-6 border-slate-200">
              <HeaderIcon icon={<Bell size={18} />}     label="Notificações" />
              <HeaderIcon icon={<Settings size={18} />} label="Ajustes" />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-linear-to-tr from-sky-400 to-sky-100 shadow-sm border border-white cursor-pointer">
                <div className="w-9 h-9 rounded-full border-2 border-white bg-linear-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
                  <User size={20} className="text-sky-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* -- Conteúdo principal -- */}
        <div className="flex justify-center flex-1">
          <div className="flex gap-6 w-full max-w-7xl items-start">

            {/* -- LOADING -- */}
            {estado === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
                  <RefreshCw size={22} className="animate-spin text-sky-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Carregando seu ciclo...</p>
              </div>
            )}

            {/* -- VISUALIZAÇÃO -- */}
            {estado === 'visualizacao' && cicloAtivo && (
              <>
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-400">

                  {/* Grade principal */}
                  <div className="grid grid-cols-12 items-start gap-4">

                    {/* -- Cabeçalho compacto -- */}
                    <div className="col-span-12 rounded-[24px] border border-white/70 bg-white/78 px-4 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                          <span className="flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Ciclo ativo
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-black text-slate-800">{cicloAtivo.cargoNome}</h2>
                            {(cicloAtivo.concursoNome || cicloAtivo.bancaSigla) && (
                              <p className="truncate text-xs font-semibold text-slate-400">
                                {[cicloAtivo.concursoNome, cicloAtivo.bancaSigla].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {cicloAtivo.hojeSlots[0] && (() => {
                          const s = cicloAtivo.hojeSlots[0];
                          const tipoLabel = getTipoDisciplinaLabel(s.tipo);
                          const nivelCores: Record<string, string> = {
                            ALTO: 'bg-red-50 text-red-700 ring-red-100',
                            MEDIO: 'bg-amber-50 text-amber-700 ring-amber-100',
                            BAIXO: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
                          };
                          const nivelLabel: Record<string, string> = {
                            ALTO: 'Alto',
                            MEDIO: 'Médio',
                            BAIXO: 'Baixo',
                          };

                          return (
                            <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                              <div className="min-w-0 rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Sessão atual</p>
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                                  <p className="max-w-[360px] truncate text-sm font-black text-slate-900">{s.nome}</p>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                    {cicloAtivo.posicaoAtual}/{cicloAtivo.totalSlots}
                                  </span>
                                  {tipoLabel && (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                      {tipoLabel}
                                    </span>
                                  )}
                                  {s.nivel && (
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase ring-1 ${nivelCores[s.nivel] ?? 'bg-white text-slate-600 ring-slate-100'}`}>
                                      {nivelLabel[s.nivel] ?? s.nivel}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  onClick={() => router.push('/minha-mesa')}
                                  aria-label="Estudar sessão atual na Minha Mesa"
                                  className="flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-sky-100 transition-all hover:bg-sky-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                                >
                                  Estudar <ChevronRight size={14} />
                                </button>
                                <button
                                  onClick={handleRebalancear}
                                  disabled={rebalanceando}
                                  aria-label="Rebalancear ciclo com base no desempenho"
                                  className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 transition-all hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2"
                                >
                                  <RefreshCw size={13} className={rebalanceando ? 'animate-spin' : ''} />
                                  {rebalanceando ? 'Ajustando...' : 'Rebalancear'}
                                </button>
                                <button
                                  onClick={() => setConfirmandoEdicao(true)}
                                  aria-label="Editar ciclo"
                                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
                                >
                                  <Pencil size={13} /> Editar
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="col-span-12 flex min-w-0 flex-col gap-4">

                      {/* -- Visualização do ciclo -- */}
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(460px,1.02fr)_minmax(380px,0.98fr)] xl:items-stretch">
                        <div className="overflow-hidden rounded-[28px] border border-sky-100 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_38%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.10),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-5 shadow-sm transition-all duration-300 sm:p-6 lg:rounded-[32px] lg:p-7 hover:shadow-md">
                          <div className="flex h-full flex-col gap-4">
                            <div className="flex flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between">
                              <div className="max-w-sm">
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Estrutura do ciclo</p>
                                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">Veja a ordem das sessões e acompanhe sua posição atual dentro do ciclo.</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                                  {cicloAtivo.totalSlots} {cicloAtivo.totalSlots === 1 ? 'sessão' : 'sessões'}
                                </span>
                                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                                  {visualizacaoDiscResumo.length} {visualizacaoDiscResumo.length === 1 ? 'disciplina' : 'disciplinas'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-1 items-start justify-center pt-1">
                              <div className="relative aspect-square w-full max-w-[290px] sm:max-w-[344px] lg:max-w-[392px]">
                                {indicadorAtualAnel && (
                                  <div
                                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: indicadorAtualAnel.left, top: indicadorAtualAnel.top }}
                                  >
                                    <div
                                      className="flex h-8 w-8 items-center justify-center"
                                      style={{ transform: `rotate(${indicadorAtualAnel.rotation})` }}
                                      aria-hidden="true"
                                    >
                                      <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-b-0 border-t-[18px] border-l-transparent border-r-transparent border-t-sky-500 drop-shadow-[0_4px_10px_rgba(14,165,233,0.18)] [filter:drop-shadow(0_1px_0_rgba(15,23,42,0.9))]" />
                                    </div>
                                  </div>
                                )}
                                <svg
                                  viewBox="0 0 260 260"
                                  role="img"
                                  aria-label={`Anel do ciclo em andamento com ${cicloAtivo.totalSlots} sessões. ${cicloAtivo.hojeSlots[0] ? `${cicloAtivo.hojeSlots[0].nome} é a sessão atual.` : ''}`}
                                  className="h-full w-full -rotate-90 drop-shadow-[0_24px_54px_rgba(14,165,233,0.12)]"
                                >
                                  <circle cx="130" cy="130" r="92" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                                  {cicloAtivo.cicloSlots.map((sessao, index) => {
                                    const colorIndex = visualizacaoDiscResumo.findIndex(item => item.idDisciplina === sessao.idDisciplina);
                                    const cor = WHEEL_COLORS[(colorIndex >= 0 ? colorIndex : sessao.idDisciplina) % WHEEL_COLORS.length];
                                    const total = cicloAtivo.cicloSlots.length;
                                    const circunferencia = 2 * Math.PI * 92;
                                    const gap = Math.max(3, total > 24 ? 1.2 : 2.2);
                                    const segmento = circunferencia / total;
                                    const dash = Math.max(segmento - gap, 4);
                                    const offset = -(index * segmento);
                                    const destaque = visualizacaoHoverDisciplinaId
                                      ? sessao.idDisciplina === visualizacaoHoverDisciplinaId
                                      : visualizacaoOrdemAtiva === sessao.ordem;
                                    return (
                                      <circle
                                        key={`${sessao.idDisciplina}-${index}`}
                                        cx="130"
                                        cy="130"
                                        r="92"
                                        fill="none"
                                        stroke={cor}
                                        strokeWidth={destaque ? 20 : 18}
                                        strokeLinecap="round"
                                        strokeDasharray={`${dash} ${Math.max(circunferencia - dash, 0)}`}
                                        strokeDashoffset={offset}
                                        className="transition-all duration-200 ease-out"
                                        style={{ opacity: destaque ? 1 : 0.24, filter: destaque ? 'drop-shadow(0 0 10px rgba(14,165,233,0.24))' : 'none' }}
                                        onMouseEnter={() => ativarHoverSessaoVisualizacao(sessao.ordem)}
                                        onMouseLeave={limparHoverVisualizacao}
                                      />
                                    );
                                  })}
                                </svg>
                                <div className="absolute inset-[18%] rounded-full border border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(148,163,184,0.18)] backdrop-blur">
                                  <div className="flex h-full flex-col items-center justify-center px-5 text-center sm:px-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                      {visualizacaoOrdemAtiva === cicloAtivo.posicaoAtual ? 'Disciplina atual' : 'Disciplina'}
                                    </p>
                                    <div className="mt-4 h-px w-16 bg-slate-200" />
                                    <p
                                      className="mt-4 max-w-[170px] text-sm font-black leading-tight text-slate-800 sm:max-w-[190px] sm:text-base"
                                      title={visualizacaoSessaoAtiva?.nome ?? cicloAtivo.hojeSlots[0]?.nome ?? 'Sessão atual'}
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {visualizacaoSessaoAtiva?.nome ?? cicloAtivo.hojeSlots[0]?.nome ?? 'Sessão atual'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[20px] border border-white/70 bg-white/70 px-4 py-2.5 text-left shadow-sm">
                              <p className="text-sm font-black text-slate-800">Seu ciclo segue em ordem contínua</p>
                              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                                Ao concluir a última sessão, o ciclo reinicia do começo.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-sky-100 bg-linear-to-br from-white via-sky-50/60 to-white p-4 shadow-sm transition-all duration-300 sm:p-5 lg:rounded-[32px] hover:shadow-md">
                          <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Próximas sessões</p>
                                <p className="mt-1 text-sm font-semibold text-slate-600">Acompanhe a sequência completa a partir da sessão atual.</p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-sky-700 shadow-sm">
                                {visualizacaoProximasSessoes.length} visíveis
                              </span>
                            </div>

                            <div className="mt-4 max-h-[468px] space-y-1.5 overflow-y-auto pr-1">
                              {visualizacaoProximasSessoes.map((sessao, indice) => {
                                const colorIndex = visualizacaoDiscResumo.findIndex(item => item.idDisciplina === sessao.idDisciplina);
                                const cor = WHEEL_COLORS[(colorIndex >= 0 ? colorIndex : sessao.idDisciplina) % WHEEL_COLORS.length];
                                const tipoLabel = getTipoDisciplinaLabel(sessao.tipo);
                                const atual = indice === 0;
                                const destaque = visualizacaoOrdemAtiva === sessao.ordem;

                                return (
                                  <button
                                    key={`${sessao.idDisciplina}-${sessao.ordem}-${indice}`}
                                    type="button"
                                    onMouseEnter={() => ativarHoverSessaoVisualizacao(sessao.ordem)}
                                    onMouseLeave={limparHoverVisualizacao}
                                    className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 ease-out ${
                                      destaque
                                        ? 'border-sky-200 bg-white shadow-sm ring-1 ring-sky-100'
                                        : atual
                                          ? 'border-sky-100 bg-sky-50/50'
                                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                                    }`}
                                  >
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${
                                      destaque || atual ? 'bg-sky-500 text-white' : 'bg-white text-slate-700'
                                    }`}>
                                      {sessao.ordem}
                                    </div>
                                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-black text-slate-800">{sessao.nome}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {atual ? 'Agora' : indice === 1 ? 'Próxima' : 'Depois'} · {tipoLabel ?? 'Disciplina'}
                                      </p>
                                    </div>
                                    {atual && (
                                      <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">
                                        atual
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 sm:p-5 lg:rounded-[32px]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Disciplinas no ciclo</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">Veja a composição do ciclo e quantas sessões cada disciplina ocupa.</p>
                          </div>
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                            {visualizacaoDiscResumo.length} {visualizacaoDiscResumo.length === 1 ? 'disciplina' : 'disciplinas'}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
                          {visualizacaoDiscResumo.map(item => {
                            const colorIndex = visualizacaoDiscResumo.findIndex(disc => disc.idDisciplina === item.idDisciplina);
                            const cor = WHEEL_COLORS[colorIndex % WHEEL_COLORS.length];
                            const tipoLabel = getTipoDisciplinaLabel(item.tipo);
                            const destaque = item.idDisciplina === visualizacaoDisciplinaAtivaId;
                            const motivo = item.frequencia >= 3
                              ? 'Alta prioridade no ciclo'
                              : item.frequencia === 2
                                ? 'Prioridade intermediária'
                                : 'Presença de manutenção';

                            return (
                              <button
                                key={item.idDisciplina}
                                type="button"
                                onMouseEnter={() => ativarHoverDisciplinaVisualizacao(item.idDisciplina)}
                                onMouseLeave={limparHoverVisualizacao}
                                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ease-out ${
                                  destaque
                                    ? 'border-sky-200 bg-sky-50/60 shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                                }`}
                              >
                                <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black text-slate-800">{item.nome}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.frequencia} {item.frequencia === 1 ? 'sessão' : 'sessões'}{tipoLabel ? ` · ${tipoLabel}` : ''}
                                  </p>
                                  <p className="mt-1 text-[11px] font-bold text-sky-600">{motivo}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* -- Plano de hoje -- */}
                      <div className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-sky-500" />
                              <p className="text-base font-black text-slate-800">Plano de hoje</p>
                            </div>
                            <p className="text-sm text-slate-500">
                              Próximas sessões da sua meta diária. Cada sessão dura 1h.
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Hoje: {cicloAtivo.horasPorDia} sessões
                          </span>
                        </div>

                        <div className="space-y-0">
                          {cicloAtivo.hojeSlots.map((s, i) => {
                            const sessao = cicloAtivo.posicaoAtual + i > cicloAtivo.totalSlots
                              ? ((cicloAtivo.posicaoAtual + i - 1) % cicloAtivo.totalSlots) + 1
                              : cicloAtivo.posicaoAtual + i;
                            const atual = i === 0;
                            const etapaLabel = atual ? 'Agora' : i === 1 ? 'Próxima' : 'Depois';

                            return (
                              <div key={i} className="relative flex gap-3 pb-3 last:pb-0">
                                {i < cicloAtivo.hojeSlots.length - 1 && (
                                  <div className="absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px bg-slate-200" />
                                )}
                                <div className={`relative z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-black ${atual ? 'bg-sky-500 text-white shadow-sm shadow-sky-100' : 'bg-slate-100 text-slate-500'}`}>
                                  {sessao}
                                </div>
                                <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2 transition-colors ${atual ? 'border-sky-200 bg-sky-50 shadow-sm shadow-sky-50 ring-1 ring-sky-100' : 'border-transparent bg-white hover:border-slate-100 hover:bg-slate-50'}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`shrink-0 text-[11px] font-black uppercase tracking-wide ${atual ? 'text-sky-700' : 'text-slate-400'}`}>
                                      {etapaLabel}
                                    </span>
                                    <p className="truncate text-sm font-bold text-slate-700">{s.nome}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                          Use a Minha Mesa para registrar cada sessão concluída.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </>
            )}

            {/* -- CRIAÇÃO -- */}
            {estado === 'criacao' && (
              <>
                <div className="flex-1 min-w-0 flex flex-col">

                  <div className="mb-5 overflow-hidden rounded-[32px] border border-white/70 bg-white/72 shadow-xl shadow-sky-100/50 backdrop-blur-xl">
                    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-6">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sky-700">
                            Etapa {etapa} de {STEPS.length}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                            {etapaAtual.label}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
                          {etapaAtual.title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                          {etapaAtual.description}
                        </p>
                      </div>
                      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-linear-to-br from-sky-500 to-emerald-400 p-4 text-white shadow-lg shadow-sky-200/60">
                        <div className="absolute inset-y-0 right-0 w-28 opacity-35">
                          <Image src="/imagem_home.png" alt="Rotina de estudos" fill className="object-cover" sizes="112px" />
                        </div>
                        <div className="relative">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-white/75">Progresso</span>
                          <span className="text-sm font-black text-white">{Math.round(progressoEtapas)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/30">
                          <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progressoEtapas}%` }} />
                        </div>
                        <p className="mt-3 text-xs font-medium leading-snug text-white/85">
                          Avance pelas etapas para gerar um ciclo pronto para uso na Minha Mesa.
                        </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* -- Indicador de etapas -- */}
                  <div className="mb-5 rounded-[28px] border border-white/70 bg-white/70 px-3 py-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl sm:px-5">
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {STEPS.map((step) => {
                        const concluida = etapa > step.num;
                        const atual     = etapa === step.num;
                        const clicavel  = concluida;
                        return (
                          <button
                            key={step.num}
                            type="button"
                            disabled={!clicavel}
                            onClick={() => clicavel && irParaEtapa(step.num)}
                            title={clicavel ? `Voltar para ${step.label}` : undefined}
                            className={`flex min-h-[76px] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                              atual
                                ? 'border-sky-200 bg-sky-50 shadow-sm'
                                : concluida
                                  ? 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-200'
                                  : 'border-slate-100 bg-slate-50/70 opacity-70'
                            }`}
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black ${
                              concluida ? 'bg-emerald-500 text-white' :
                              atual     ? 'bg-sky-500 text-white shadow-sm shadow-sky-100' :
                                          'bg-white text-slate-400'
                            }`}>
                              {concluida ? <Check size={14} /> : step.num}
                            </div>
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-black ${atual ? 'text-sky-800' : concluida ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {step.label}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{step.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* -- ETAPA 1 -- */}
                  {etapa === 1 && (
                    <div key="etapa1" className={`rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:p-8 ${animClass}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Configuração inicial</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Qual é o seu momento de estudo?</h2>
                      <p className="mt-2 mb-6 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                        Escolha a situação que melhor descreve agora. O sistema ativa a estratégia certa e sugere a carga ideal.
                      </p>

                      {/* Momento de estudo — escolha primária */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {MOMENTOS_ESTUDO_OPCOES.map(opcao => {
                          const selecionado = momentoEstudo === opcao.key;
                          return (
                            <button
                              key={opcao.key}
                              type="button"
                              onClick={() => setMomentoEstudo(opcao.key)}
                              className={`rounded-2xl border p-4 text-left transition-all ${
                                selecionado
                                  ? 'border-sky-300 bg-sky-50 shadow-sm shadow-sky-100 ring-1 ring-sky-200/60'
                                  : 'border-slate-100 bg-white hover:border-sky-200 hover:bg-sky-50/50'
                              }`}
                            >
                              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                                selecionado ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <opcao.Icone size={17} />
                              </div>
                              <p className="text-sm font-black text-slate-800">{opcao.titulo}</p>
                              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{opcao.descricao}</p>
                              <span className={`mt-2 inline-block text-[10px] font-black uppercase tracking-widest ${
                                selecionado ? 'text-sky-600' : 'text-slate-400'
                              }`}>{opcao.metodo}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Disponibilidade — escolha secundária */}
                      <div className="mt-6 rounded-[28px] border border-slate-200/70 bg-white/86 p-5 shadow-sm backdrop-blur">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-700">Quanto tempo você tem por dia?</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-400">
                              Sugestão para este momento:{' '}
                              <span className="font-bold text-sky-600">{opcaoMomentoAtual.horasSugeridas}h</span>
                            </p>
                          </div>
                          <span className="text-2xl font-black text-sky-600">{horasDiariasLimitadas}h/dia</span>
                        </div>

                        <input
                          type="range" min="1" max="8" step="1"
                          value={horasDiariasLimitadas}
                          onChange={e => setHorasDiarias(Math.min(Number(e.target.value), 8))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 mb-1.5"
                        />
                        <div className="mb-4 flex justify-between text-[11px] font-bold text-slate-400">
                          <span>1h</span>
                          <span>8h</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                          {[
                            { h: 1, label: 'Leve' },
                            { h: 2, label: 'Essencial' },
                            { h: 4, label: 'Moderado' },
                            { h: 6, label: 'Intenso' },
                            { h: 8, label: 'Máximo' },
                          ].map(({ h, label }) => (
                            <button key={h} onClick={() => setHorasDiarias(h)}
                              className={`rounded-xl px-3 py-2 text-left transition-all ${
                                horasDiariasLimitadas === h
                                  ? h === 8 ? 'bg-amber-500 text-white shadow-sm shadow-amber-100' : 'bg-sky-500 text-white shadow-sm shadow-sky-100'
                                  : 'bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-600'
                              }`}
                            >
                              <span className="block text-xs font-black">{label}</span>
                              <span className={`text-lg font-black leading-tight ${horasDiariasLimitadas === h ? 'text-white' : 'text-slate-700'}`}>
                                {h}h
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sessões/dia</p>
                            <p className="text-xl font-black text-slate-800">{horasDiariasLimitadas}</p>
                          </div>
                          <div className="h-8 w-px bg-slate-200" />
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Máx. disciplinas</p>
                            <p className="text-xl font-black text-slate-800">até {maxDisciplinas}</p>
                          </div>
                        </div>

                        {horasDiariasLimitadas === 8 && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-3">
                            <Info size={14} className="mt-0.5 shrink-0 text-sky-500" />
                            <p className="text-xs text-sky-700">
                              8 horas é uma carga alta. Para manter qualidade, distribua o estudo ao longo do dia e faça pausas entre as sessões.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => irParaEtapa(2)}
                          className="w-full justify-center px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 sm:w-auto"
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -- ETAPA 2 -- */}
                  {etapa === 2 && (
                    <div key="etapa2" className={`rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:p-8 ${animClass}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Base do ciclo</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Qual edital você está estudando?</h2>
                      <p className="mt-2 mb-6 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">Escolha o edital e depois o cargo. Essa seleção carrega exatamente as disciplinas que poderão entrar no ciclo.</p>

                      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] xl:items-start">
                        <div className="min-w-0">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Encontre seu edital</label>
                          <div className="relative mb-4 w-full">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text" placeholder="Digite o nome do edital ou banca..."
                              value={busca} onChange={e => setBusca(e.target.value)}
                              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 transition-colors bg-slate-50"
                            />
                            {busca && (
                              <button
                                type="button"
                                onClick={() => setBusca('')}
                                aria-label="Limpar busca"
                                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {loadingEditais ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                              <RefreshCw size={14} className="animate-spin" /> Carregando editais...
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 gap-2">
                                {editaisFiltrados.length === 0
                                  ? <p className="text-sm text-slate-400 italic py-2">Nenhum edital encontrado.</p>
                                  : editaisFiltrados.map(edital => (
                                    <button
                                      key={edital.id}
                                      onClick={() => setEditalSelecionado(editalSelecionado?.id === edital.id ? null : edital)}
                                      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                                        editalSelecionado?.id === edital.id ? 'border-sky-400 bg-sky-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                                      }`}
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                          editalSelecionado?.id === edital.id ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                                        }`}>
                                          {editalSelecionado?.id === edital.id && <Check size={9} className="text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-bold text-slate-800">{edital.nome}</p>
                                          {edital.banca && <p className="truncate text-xs text-slate-500 font-medium">{edital.banca}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                          edital.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}>{edital.status}</span>
                                        <span className="text-xs text-slate-400 hidden sm:block">{edital.data}</span>
                                      </div>
                                    </button>
                                  ))
                                }
                              </div>
                              {editaisFiltradosBase.length > 5 && editaisFiltrados.length > 0 && (
                                <p className="mt-3 text-xs font-medium text-slate-400">
                                  Mostrando até 5 resultados. Use a busca para refinar.
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        <div className="min-w-0 rounded-[28px] border border-white/70 bg-white/64 p-5 shadow-sm backdrop-blur">
                          <p className="text-base font-black text-slate-800">Agora escolha o cargo</p>
                          <p className="mt-1 text-sm text-slate-500">Depois do edital, selecione o cargo para carregar as disciplinas corretas.</p>

                          <div className="mt-4">
                            {!editalSelecionado ? (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4">
                                <div className="flex gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">1</div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-600">Escolha um edital à esquerda.</p>
                                    <p className="mt-1 text-xs text-slate-400">Depois selecione o cargo aqui.</p>
                                  </div>
                                </div>
                              </div>
                            ) : loadingCargos ? (
                              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                                <RefreshCw size={14} className="animate-spin" /> Carregando cargos...
                              </div>
                            ) : cargos.length === 0 ? (
                              <p className="text-sm text-slate-400 italic">Nenhum cargo disponível.</p>
                            ) : (
                              <div className="relative">
                                <select
                                  value={cargoSelecionado?.id ?? ''}
                                  onChange={e => {
                                    const cargo = cargos.find(c => c.id === Number(e.target.value)) ?? null;
                                    setCargoSelecionado(cargo); setDisciplinasSelecionadas([]); setDificuldades({});
                                  }}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-400 outline-none text-sm font-medium text-slate-800 bg-white appearance-none cursor-pointer transition-colors"
                                >
                                  <option value="">Selecione um cargo...</option>
                                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                            )}
                          </div>

                          {editalSelecionado && !cargoSelecionado && (
                            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <p className="text-xs font-black uppercase tracking-wide text-sky-700">Edital selecionado</p>
                              <p className="mt-1 text-sm font-bold leading-snug text-slate-800">{editalSelecionado.descricao}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase text-sky-700">
                                  {editalSelecionado.nome}
                                </span>
                                {editalSelecionado.banca && <span className="text-xs font-medium text-slate-500">{editalSelecionado.banca}</span>}
                              </div>
                            </div>
                          )}

                          {editalSelecionado && cargoSelecionado && (
                            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="mb-3 flex items-center gap-2">
                                <CheckCircle2 size={15} className="text-sky-600" />
                                <p className="text-sm font-black text-sky-700">Edital e cargo selecionados</p>
                              </div>
                              <p className="text-sm font-bold text-slate-800">{cargoSelecionado.nome}</p>
                              <p className="mt-1 text-xs font-medium leading-snug text-slate-500">{editalSelecionado.descricao}</p>
                              <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-sky-600">{editalSelecionado.nome}</p>
                              <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                                <span className="text-xs font-bold text-slate-500">Disciplinas disponíveis</span>
                                <span className="text-sm font-black text-sky-600">{cargoSelecionado.disciplinas.length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                        <button onClick={() => irParaEtapa(1)} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all sm:w-auto">
                          ? Voltar
                        </button>
                        <button
                          onClick={() => irParaEtapa(3)} disabled={!podeContinuarEtapa2}
                          className={`flex w-full items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all sm:w-auto ${
                            podeContinuarEtapa2 ? 'bg-sky-500 hover:bg-sky-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                      {!podeContinuarEtapa2 && (
                        <p className="mt-2 text-xs font-medium text-slate-400">
                          Selecione um edital e um cargo para continuar.
                        </p>
                      )}
                    </div>
                  )}

                  {/* -- ETAPA 3 -- */}
                  {etapa === 3 && (
                    <div key="etapa3" className={`rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:p-8 ${animClass}`}>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Método de criação</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Você quer rapidez ou controle?</h2>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                        Escolha se o sistema deve montar o ciclo por você ou se prefere selecionar as disciplinas manualmente.
                      </p>
                      <p className="text-sm text-slate-400 mb-6">
                        <strong className="text-slate-600">{editalSelecionado?.nome}</strong> · <strong className="text-slate-600">{cargoSelecionado?.nome}</strong> · <strong className="text-sky-600">{horasDiariasLimitadas}h/dia</strong>
                      </p>

                      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2">
                        {([
                          { key: 'automatico',    icon: <Zap size={16} />,               titulo: 'Automático',    sub: 'Ideal para quem está começando e quer montar o ciclo sem configuração.',                              tag: 'Recomendado' },
                          { key: 'personalizado', icon: <SlidersHorizontal size={16} />, titulo: 'Personalizado', sub: 'Ideal para quem já conhece o edital e quer controlar a prioridade de cada disciplina.', tag: null },
                        ] as const).map(opt => (
                          <button key={opt.key} onClick={() => setModoCiclo(opt.key)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${modoCiclo === opt.key ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${modoCiclo === opt.key ? 'bg-sky-100' : 'bg-slate-100'}`}>
                              <span className={modoCiclo === opt.key ? 'text-sky-500' : 'text-slate-400'}>{opt.icon}</span>
                            </div>
                            <p className={`text-sm font-bold mb-0.5 ${modoCiclo === opt.key ? 'text-sky-700' : 'text-slate-700'}`}>{opt.titulo}</p>
                            <p className="text-xs text-slate-500 leading-snug mb-1">{opt.sub}</p>
                            {opt.tag && modoCiclo === opt.key && (
                              <span className="text-[10px] font-black text-sky-500 uppercase tracking-wider">{opt.tag}</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className={`rounded-xl border-2 p-4 mb-6 transition-all ${modoCiclo === 'automatico' ? 'border-sky-100 bg-sky-50' : 'border-violet-100 bg-violet-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {modoCiclo === 'automatico'
                            ? <Zap size={15} className="text-sky-500" />
                            : <SlidersHorizontal size={15} className="text-violet-500" />}
                          <p className={`text-sm font-black ${modoCiclo === 'automatico' ? 'text-sky-700' : 'text-violet-700'}`}>
                            {modoCiclo === 'automatico' ? 'O que o sistema faz por você' : 'O que você controla'}
                          </p>
                        </div>
                        {modoCiclo === 'automatico' ? (
                          <ul className="space-y-2">
                            {[
                              'Seleciona as disciplinas automaticamente com base no edital',
                              'Define dificuldade como Média para todas — sem configuração',
                              'Distribui as sessões priorizando disciplinas mais relevantes',
                              'Bom ponto de partida para quem está começando a estudar para concursos',
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-sky-700">
                                <Check size={12} className="mt-0.5 shrink-0 text-sky-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-2">
                            {[
                              'Você escolhe quais disciplinas entram no ciclo',
                              'Você define a dificuldade de cada disciplina individualmente',
                              'Disciplinas com dificuldade Alta recebem maior frequência no ciclo',
                              'Para quem conhece o edital e sabe exatamente onde precisa focar',
                            ].map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-violet-700">
                                <Check size={12} className="mt-0.5 shrink-0 text-violet-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button onClick={() => irParaEtapa(2)} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all sm:w-auto">
                          ? Voltar
                        </button>
                        <button
                          onClick={() => irParaEtapa(4)}
                          className="flex w-full items-center justify-center gap-2 px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95 sm:w-auto"
                        >
                          Continuar <ChevronDown size={16} className="-rotate-90" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -- ETAPA 4 -- */}
                    {etapa === 4 && (
                      <div key="etapa4" className={`relative rounded-[32px] border border-white/70 bg-white/78 p-6 pb-32 shadow-xl shadow-slate-200/60 backdrop-blur-xl lg:p-8 lg:pb-8 ${animClass}`}>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-500">Revisão final</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                          {modoCiclo === 'automatico'
                            ? 'Revise seu ciclo automático'
                            : 'Organize as disciplinas do ciclo'}
                        </h2>
                        <p className="mt-2 mb-6 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                          {modoCiclo === 'automatico'
                            ? 'O sistema já preparou uma sugestão. Revise a composição e finalize quando estiver pronto.'
                            : 'Selecione as disciplinas, defina o nível de dificuldade e finalize quando tudo estiver completo.'}
                        </p>

                        {disciplinas.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                          <RefreshCw size={14} className="animate-spin" /> Carregando disciplinas...
                        </div>
                      ) : modoCiclo === 'automatico' ? (
                        <div />
                      ) : (
                        <div>
                          <div className="mb-2">
                            <p className="text-xs text-slate-500">
                              Escolha as disciplinas e informe o nível de dificuldade de cada uma.
                            </p>
                          </div>
                          {disciplinasSelecionadas.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                                {disciplinasSelecionadas.length} selecionadas
                              </span>
                              {resumoTiposSelecionadas.especificas > 0 && (
                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                  {resumoTiposSelecionadas.especificas} específicas selecionadas
                                </span>
                              )}
                              {resumoTiposSelecionadas.basicas > 0 && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {resumoTiposSelecionadas.basicas} básicas selecionadas
                                </span>
                              )}
                            </div>
                          )}
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full transition-all duration-500"
                              style={{ width: `${(disciplinasSelecionadas.length / maxDisciplinas) * 100}%` }} />
                          </div>

                          <div className="relative mb-4">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text"
                              placeholder="Buscar disciplina..."
                              value={buscaDisciplina}
                              onChange={e => setBuscaDisciplina(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition-colors focus:border-sky-400"
                            />
                            {buscaDisciplina && (
                              <button
                                type="button"
                                onClick={() => setBuscaDisciplina('')}
                                aria-label="Limpar busca de disciplina"
                                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {disciplinasSelecionadas.length === 0 && (
                            <div className="flex items-center gap-2 mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                              <Info size={14} className="text-slate-400 shrink-0" />
                              <p className="text-xs text-slate-500 font-medium">Selecione pelo menos uma disciplina para finalizar.</p>
                            </div>
                          )}

                          {(() => {
                            const grupos = [
                              {
                                titulo: 'Disciplinas específicas do cargo',
                                disciplinas: disciplinasPersonalizadasFiltradas.filter(disc => getTipoDisciplinaLabel(disc.tipo) === 'Específica'),
                              },
                              {
                                titulo: 'Disciplinas básicas/comuns',
                                disciplinas: disciplinasPersonalizadasFiltradas.filter(disc => getTipoDisciplinaLabel(disc.tipo) !== 'Específica'),
                              },
                            ].filter(grupo => grupo.disciplinas.length > 0);

                            const renderDisciplina = (disc: Disciplina) => {
                              const selecionada = disciplinasSelecionadas.includes(disc.id);
                              const bloqueada   = !selecionada && disciplinasSelecionadas.length >= maxDisciplinas;
                              const dific       = dificuldades[disc.id];
                              const semDific    = selecionada && !dific;

                              return (
                                <div key={disc.id}
                                  onClick={() => !bloqueada && toggleDisciplina(disc.id)}
                                  className={`rounded-xl border-2 transition-all ${
                                    selecionada ? semDific ? 'border-amber-300 bg-amber-50 cursor-pointer' : 'border-sky-400 bg-sky-50 cursor-pointer' :
                                    bloqueada   ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed' :
                                                  'border-slate-200 bg-white hover:border-sky-200 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                                        selecionada ? semDific ? 'bg-amber-400' : 'bg-sky-500' :
                                        bloqueada   ? 'bg-slate-200' : 'border-2 border-slate-300'
                                      }`}>
                                        {selecionada && !semDific && <Check size={9} className="text-white" />}
                                        {selecionada && semDific  && <AlertCircle size={9} className="text-white" />}
                                        {bloqueada   && <Lock size={8} className="text-slate-400" />}
                                      </div>
                                      <span className={`text-sm font-semibold ${
                                        selecionada ? semDific ? 'text-amber-700' : 'text-sky-800' :
                                        bloqueada   ? 'text-slate-400' : 'text-slate-700'
                                      }`}>{disc.nome}</span>
                                    </div>
                                    {disc.peso && !selecionada && <span className="text-[11px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full shrink-0">Peso {disc.peso}</span>}
                                  </div>

                                  {selecionada && (
                                    <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                      <p className={`text-[11px] font-black uppercase tracking-widest mb-1.5 ${semDific ? 'text-amber-500' : 'text-slate-400'}`}>
                                        {semDific ? 'Agora informe o nível de dificuldade.' : 'Dificuldade desta disciplina'}
                                      </p>
                                      <div className="flex gap-1.5">
                                        {(['Baixo', 'Médio', 'Alto'] as const).map(nivel => (
                                          <button key={nivel}
                                            onClick={e => { e.stopPropagation(); setDificuldades(prev => ({ ...prev, [disc.id]: nivel })); }}
                                            className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase border transition-all ${
                                              dific === nivel
                                                ? nivel === 'Baixo' ? 'bg-emerald-500 border-emerald-500 text-white'
                                                  : nivel === 'Médio' ? 'bg-amber-400 border-amber-400 text-white'
                                                  : 'bg-red-500 border-red-500 text-white'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300'
                                            }`}
                                          >{nivel}</button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            };

                            return (
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-black text-slate-800">Escolha as disciplinas</p>
                                    <p className="mt-1 text-xs text-slate-500">As disciplinas estão separadas por tipo para facilitar sua seleção.</p>
                                  </div>
                                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                                    disciplinasSelecionadas.length === maxDisciplinas ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {disciplinasSelecionadas.length} de {maxDisciplinas} selecionadas
                                  </span>
                                </div>
                                {grupos.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
                                    <p className="text-sm font-bold text-slate-600">
                                      {buscaDisciplina
                                        ? `Nenhuma disciplina encontrada para "${buscaDisciplina}".`
                                        : 'Nenhuma disciplina encontrada.'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">Tente ajustar a busca.</p>
                                  </div>
                                ) : (
                                  grupos.map(grupo => (
                                    <div key={grupo.titulo} className="border-t border-slate-100 pt-4 mt-6 first:mt-0 first:border-t-0 first:pt-0">
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{grupo.titulo}</p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                          {grupo.disciplinas.length} {grupo.disciplinas.length === 1 ? 'disponível' : 'disponíveis'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-4 last:pb-0">
                                        {grupo.disciplinas.map(renderDisciplina)}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            );
                          })()}

                          {disciplinasSelecionadas.length === maxDisciplinas && (
                            <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <p className="text-xs text-emerald-700 font-medium">Limite atingido! As demais disciplinas foram bloqueadas.</p>
                            </div>
                          )}

                          {disciplinasSelecionadas.length > 0 && !todasDificuldadesDefinidas && (
                            <div className="flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <AlertCircle size={14} className="text-amber-500 shrink-0" />
                              <p className="text-xs text-amber-700 font-medium">
                                Defina o nível de dificuldade em todas as disciplinas selecionadas para continuar.
                              </p>
                            </div>
                          )}

                          {disciplinasSelecionadas.length > 0 && todasDificuldadesDefinidas && (
                            <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              <p className="text-xs text-emerald-700 font-medium">
                                Tudo certo: todas as disciplinas selecionadas têm dificuldade definida.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                        {modoCiclo === 'automatico' ? (
                          cicloPreview.length === 0 ? (
                            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                              <p className="text-sm font-bold text-slate-700">
                                O resumo do ciclo automático será exibido assim que as disciplinas forem carregadas.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-base font-black text-slate-800">Resumo do ciclo automático</p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Estas são as disciplinas que entrarão no ciclo, já organizadas por tipo e com dificuldade média.
                                  </p>
                                </div>
                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                                  Dificuldade padrão: Médio
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {[
                                  {
                                    titulo: 'Disciplinas específicas',
                                    quantidade: disciplinasAutomaticasAgrupadas.especificas.length,
                                    disciplinas: disciplinasAutomaticasAgrupadas.especificas,
                                    chipClass: 'bg-sky-50 text-sky-700',
                                  },
                                  {
                                    titulo: 'Disciplinas básicas',
                                    quantidade: disciplinasAutomaticasAgrupadas.basicas.length,
                                    disciplinas: disciplinasAutomaticasAgrupadas.basicas,
                                    chipClass: 'bg-slate-100 text-slate-700',
                                  },
                                ].map(grupo => (
                                  <div key={grupo.titulo} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-black text-slate-800">{grupo.titulo}</p>
                                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                                        {grupo.quantidade}
                                      </span>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                      {grupo.disciplinas.length > 0 ? grupo.disciplinas.map(disciplina => (
                                        <div key={disciplina.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                          <p className="min-w-0 flex-1 text-sm font-bold text-slate-800">{disciplina.nome}</p>
                                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${grupo.chipClass}`}>
                                            Médio
                                          </span>
                                        </div>
                                      )) : (
                                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-center text-xs font-medium text-slate-400">
                                          Nenhuma disciplina neste grupo.
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ) : null}

                      {erroSalvar && (
                        <div className="flex items-center gap-2 mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                          <AlertCircle size={14} className="text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-medium">{erroSalvar}</p>
                        </div>
                      )}

                      <div className="sticky bottom-0 -mx-8 -mb-32 mt-6 rounded-b-2xl border-t border-slate-100 bg-white/95 px-8 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-700">
                              {modoCiclo === 'personalizado'
                                ? `${disciplinasSelecionadas.length} de ${maxDisciplinas} disciplinas selecionadas`
                                : `${disciplinasOrdenadas.length} disciplinas serão consideradas`}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {modoCiclo === 'personalizado' && disciplinasSelecionadas.length > 0 && !todasDificuldadesDefinidas
                                ? 'Defina o nível das disciplinas selecionadas.'
                                : 'Revise as escolhas e finalize para criar seu ciclo.'}
                            </p>
                          </div>
                          <div className="flex flex-col-reverse gap-3 sm:flex-row">
                            <button onClick={() => irParaEtapa(3)} disabled={salvando} className="w-full px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50 sm:w-auto">
                              ? Voltar
                            </button>
                            <button
                              onClick={handleFinalizar} disabled={!podeFinalizar || salvando}
                              className={`flex w-full items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all sm:w-auto ${
                                podeFinalizar && !salvando ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {salvando
                                ? <><RefreshCw size={15} className="animate-spin" /> Salvando...</>
                                : <><CheckCircle2 size={16} /> Finalizar ciclo</>
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Painel lateral direito — criação */}
                <div className="hidden lg:flex w-80 shrink-0 flex-col gap-4 sticky top-6">
                  {etapa === 1 && (
                    <>
                      <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">O que acontece depois</p>
                        <p className="mt-2 text-sm font-black text-slate-800">Sua meta diária vira a regra do ciclo.</p>
                        <div className="mt-4 space-y-3">
                          {[
                            { t: 'Sessões por dia', d: 'Cada hora escolhida vira uma sessão de estudo.' },
                            { t: 'Tamanho do ciclo', d: 'Quanto mais tempo disponível, mais disciplinas entram na rotação.' },
                            { t: 'Rotina prática', d: 'Depois de criado, a Visão Geral mostra a próxima sessão automaticamente.' },
                          ].map(item => (
                            <div key={item.t} className="flex items-start gap-2">
                              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-sky-500" />
                              <p className="text-xs leading-snug text-slate-600"><strong className="text-slate-800">{item.t}</strong> — {item.d}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-sky-100 bg-sky-50 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-600">Prévia rápida</p>
                        {[
                          { l: 'Sessões por dia',      v: horasDiariasLimitadas },
                          { l: 'Disciplinas no ciclo', v: maxDisciplinas },
                          { l: 'Min por sessão',       v: '60min' },
                        ].map(row => (
                          <div key={row.l} className="flex justify-between items-center mb-2 last:mb-0">
                            <span className="text-xs text-slate-500">{row.l}</span>
                            <span className="text-sm font-black text-sky-600">{row.v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {etapa === 2 && (
                    <>
                      {!editalSelecionado ? (
                        <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Como escolher</p>
                          <div className="mt-4 space-y-3">
                            {[
                              { t: 'Edital atual', d: 'Use o edital que você pretende estudar agora.' },
                              { t: 'Cargo correto', d: 'O cargo define as disciplinas que aparecem na próxima etapa.' },
                              { t: 'Busca objetiva', d: 'Pesquise por nome ou banca para reduzir a lista.' },
                            ].map(item => (
                              <div key={item.t} className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-sky-500" />
                                <p className="text-xs leading-snug text-slate-600"><strong className="text-slate-800">{item.t}</strong> — {item.d}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Seleção atual</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              editalSelecionado.status === 'ABERTO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>{editalSelecionado.status}</span>
                            <span className="text-xs text-slate-500">{editalSelecionado.data}</span>
                          </div>
                          <p className="text-sm font-black text-slate-800 mb-1">{editalSelecionado.nome}</p>
                          {editalSelecionado.banca && <p className="text-xs text-slate-500 font-medium mb-3">{editalSelecionado.banca}</p>}
                          {cargoSelecionado && (
                            <>
                              <div className="border-t border-slate-100 pt-3 mt-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo</p>
                                <p className="text-xs font-bold text-slate-700">{cargoSelecionado.nome}</p>
                              </div>
                              <div className="border-t border-slate-100 pt-3 mt-3">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Disciplinas disponíveis</p>
                                <p className="text-xl font-black text-sky-600">{cargoSelecionado.disciplinas.length}</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Etapa 1 — resumo</p>
                        {[{ l: 'Horas/dia', v: `${horasDiariasLimitadas}h` }].map(r => (
                          <div key={r.l} className="flex justify-between items-center mb-1 last:mb-0">
                            <span className="text-xs text-slate-500">{r.l}</span>
                            <span className="text-xs font-black text-slate-700">{r.v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(etapa === 3 || etapa === 4) && (
                    <>
                      <div className="rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-500">Resumo até aqui</p>
                        <div className="space-y-3">
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Edital</p>
                            <p className="mt-1 text-xs font-bold leading-snug text-slate-700">{editalSelecionado?.nome}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cargo</p>
                            <p className="mt-1 text-xs font-bold text-slate-700">{cargoSelecionado?.nome}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-sky-50 px-3 py-3">
                              <p className="text-[11px] font-black uppercase tracking-widest text-sky-500">Sessões/dia</p>
                              <p className="mt-1 text-xl font-black text-sky-700">{horasDiariasLimitadas}</p>
                            </div>
                            <div className="rounded-2xl bg-sky-50 px-3 py-3">
                              <p className="text-[11px] font-black uppercase tracking-widest text-sky-500">Disciplinas</p>
                              <p className="mt-1 text-xl font-black text-sky-700">{maxDisciplinas}</p>
                            </div>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-400">Modo</p>
                            <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${modoCiclo === 'automatico' ? 'bg-sky-100 text-sky-600' : 'bg-violet-100 text-violet-600'}`}>
                              {modoCiclo === 'automatico' ? 'Automático' : 'Personalizado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {etapa === 4 && (
                        <div className={`rounded-[24px] p-5 shadow-sm border transition-colors ${
                          podeFinalizar
                            ? 'border-emerald-100 bg-emerald-50'
                            : 'border-amber-100 bg-amber-50'
                        }`}>
                          <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                            podeFinalizar ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {podeFinalizar
                              ? 'Tudo pronto para criar o ciclo'
                              : disciplinasSelecionadas.length === 0
                                ? 'Selecione disciplinas para continuar'
                                : 'Falta definir níveis'}
                          </p>
                          <p className="text-xs text-slate-500 leading-snug mb-4">
                            {modoCiclo === 'personalizado' && dificuldadesPendentesCount > 0
                              ? `${dificuldadesPendentesCount} ${dificuldadesPendentesCount === 1 ? 'disciplina ainda está sem nível definido.' : 'disciplinas ainda estão sem nível definido.'}`
                              : 'Revise o resumo acima e crie seu ciclo quando estiver tudo certo.'}
                          </p>
                          <div className="space-y-2">
                            {cicloPreview.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setPreviewModalAberta(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-700 transition-all hover:border-sky-300 hover:bg-sky-50"
                              >
                                Ver prévia do ciclo
                                <ChevronRight size={16} />
                              </button>
                            )}
                            <button
                              onClick={handleFinalizar}
                              disabled={!podeFinalizar || salvando}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-md transition-all ${
                                podeFinalizar && !salvando
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98]'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                              }`}
                            >
                              {salvando
                                ? <><RefreshCw size={15} className="animate-spin" /> Salvando...</>
                                : <><CheckCircle2 size={16} /> Finalizar ciclo</>
                              }
                            </button>
                            <button
                              onClick={() => irParaEtapa(3)}
                              disabled={salvando}
                              className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                            >
                              ? Voltar
                            </button>
                          </div>
                        </div>
                      )}

                      {modoCiclo === 'personalizado' && disciplinasSelecionadas.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                          <p className="text-[11px] font-black text-sky-500 uppercase tracking-widest mb-3">Disciplinas no ciclo</p>
                          <div className="space-y-2">
                            {disciplinasSelecionadasPreview.map(disc => {
                              const dific = dificuldades[disc.id];
                              return (
                                <div key={disc.id} className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-slate-700 truncate flex-1 mr-2">{disc.nome}</p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {dific ? (
                                      <span className={`text-xs font-black uppercase px-1.5 py-0.5 rounded-full ${
                                        dific === 'Baixo' ? 'bg-emerald-100 text-emerald-600' :
                                        dific === 'Médio' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                      }`}>{dific}</span>
                                    ) : (
                                      <span className="text-xs font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-500">Pendente</span>
                                    )}
                                    <span className="text-[11px] text-slate-400">{minutosPerDisciplina}min</span>
                                  </div>
                                </div>
                              );
                            })}
                            {disciplinasSelecionadasRestantes > 0 && (
                              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                                + {disciplinasSelecionadasRestantes} {disciplinasSelecionadasRestantes === 1 ? 'disciplina selecionada' : 'disciplinas selecionadas'}
                              </div>
                            )}
                          </div>
                          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between">
                            <span className="text-[11px] font-black text-slate-400 uppercase">Total</span>
                            <span className="text-xs font-black text-sky-600">{horasDiariasLimitadas}h/dia</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

/* -- Paleta e roda do ciclo -- */

const WHEEL_COLORS = ['#0f9bd7','#14b87a','#7c5cff','#f39c12','#ef476f','#00b8d9','#ff7a00','#7cb518','#4361ee','#d946ef','#2a9d8f','#ff595e'];

/* -- Componentes de suporte -- */

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 ${
        active
          ? 'text-white bg-white/16 font-bold shadow-sm ring-1 ring-white/15'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className={`shrink-0 transition-all ${active ? 'p-1.5 rounded-xl bg-sky-400 text-white' : 'text-slate-400 group-hover:text-sky-200'}`}>{icon}</div>
      <span className="text-[13px] truncate">{label}</span>
    </button>
  );
}

function HeaderIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex flex-col items-center gap-0.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 rounded-md">
      <div className="text-slate-400 group-hover:text-sky-500 transition-colors">{icon}</div>
      <span className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ cor, label, valor }: { cor: 'sky' | 'slate'; label: string; valor: string }) {
  const s = {
    sky:   { wrap: 'bg-sky-50 border-sky-100',     label: 'text-sky-400',   valor: 'text-sky-600' },
    slate: { wrap: 'bg-slate-50 border-slate-200', label: 'text-slate-400', valor: 'text-slate-700' },
  }[cor];
  return (
    <div className={`rounded-xl p-4 text-center border ${s.wrap}`}>
      <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${s.label}`}>{label}</p>
      <p className={`text-2xl font-black ${s.valor}`}>{valor}</p>
    </div>
  );
}



