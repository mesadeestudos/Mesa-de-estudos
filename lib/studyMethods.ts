export const METODOS_ESTUDO = [
  'CICLO_INTELIGENTE',
  'PLANO_POR_PRAZO',
  'MODO_QUESTOES',
  'REVISAO_INTENSIVA',
  'RECUPERACAO_ATRASO',
  'RETA_FINAL',
  'POMODORO_BLOCOS',
  'TRILHA_OBJETIVO',
  'MANUAL_ASSISTIDO',
] as const;

export type MetodoEstudo = typeof METODOS_ESTUDO[number];

export const MOMENTOS_ESTUDO = [
  'COMECO_ZERO',
  'PROVA_DATA',
  'ATRASADO',
  'REVISAR',
  'QUESTOES',
  'CICLO_AUTOMATICO',
] as const;

export type MomentoEstudo = typeof MOMENTOS_ESTUDO[number];

export interface MetodoEstudoConfig {
  metodo: MetodoEstudo;
  titulo: string;
  descricao: string;
  ritmo: 'focado' | 'equilibrado' | 'variado';
  foco: 'CONTEUDO' | 'QUESTOES' | 'REVISAO' | 'RECUPERACAO' | 'RETA_FINAL' | 'HABITO' | 'MANUAL';
  minutosSessao: number;
  explicacao: string;
}

export const METODOS_CONFIG: Record<MetodoEstudo, MetodoEstudoConfig> = {
  CICLO_INTELIGENTE: {
    metodo: 'CICLO_INTELIGENTE',
    titulo: 'Ciclo Inteligente',
    descricao: 'Rotina equilibrada entre disciplinas, revisoes e questoes.',
    ritmo: 'equilibrado',
    foco: 'CONTEUDO',
    minutosSessao: 60,
    explicacao: 'Melhor para concursos, editais grandes e estudo continuo.',
  },
  PLANO_POR_PRAZO: {
    metodo: 'PLANO_POR_PRAZO',
    titulo: 'Plano por Prazo',
    descricao: 'Organiza o ritmo com foco em concluir antes da data da prova.',
    ritmo: 'variado',
    foco: 'CONTEUDO',
    minutosSessao: 60,
    explicacao: 'Melhor para quem tem prova marcada e precisa controlar atraso.',
  },
  MODO_QUESTOES: {
    metodo: 'MODO_QUESTOES',
    titulo: 'Modo Questões',
    descricao: 'Prioriza treino, erros recentes e revisao teorica quando necessario.',
    ritmo: 'variado',
    foco: 'QUESTOES',
    minutosSessao: 50,
    explicacao: 'Melhor para alunos intermediarios, avancados e reta final.',
  },
  REVISAO_INTENSIVA: {
    metodo: 'REVISAO_INTENSIVA',
    titulo: 'Revisão Intensiva',
    descricao: 'Protege memoria e reduz conteudo novo quando ha muito material visto.',
    ritmo: 'focado',
    foco: 'REVISAO',
    minutosSessao: 45,
    explicacao: 'Melhor para consolidar conteudo ja estudado.',
  },
  RECUPERACAO_ATRASO: {
    metodo: 'RECUPERACAO_ATRASO',
    titulo: 'Recuperação de Atraso',
    descricao: 'Reorganiza prioridades para voltar ao plano sem acumular tarefas impossiveis.',
    ritmo: 'focado',
    foco: 'RECUPERACAO',
    minutosSessao: 45,
    explicacao: 'Melhor para quem ficou dias sem estudar ou acumulou revisoes.',
  },
  RETA_FINAL: {
    metodo: 'RETA_FINAL',
    titulo: 'Reta Final',
    descricao: 'Aumenta peso de revisoes, questoes, topicos criticos e simulados.',
    ritmo: 'variado',
    foco: 'RETA_FINAL',
    minutosSessao: 50,
    explicacao: 'Melhor para os ultimos dias antes da prova.',
  },
  POMODORO_BLOCOS: {
    metodo: 'POMODORO_BLOCOS',
    titulo: 'Pomodoro / Blocos de Foco',
    descricao: 'Divide o estudo em blocos curtos de foco com pausas planejadas.',
    ritmo: 'focado',
    foco: 'HABITO',
    minutosSessao: 50,
    explicacao: 'Melhor para criar habito, concentracao e consistencia.',
  },
  TRILHA_OBJETIVO: {
    metodo: 'TRILHA_OBJETIVO',
    titulo: 'Trilha por Objetivo',
    descricao: 'Guia o aluno iniciante com passos simples ate a primeira rotina.',
    ritmo: 'equilibrado',
    foco: 'CONTEUDO',
    minutosSessao: 60,
    explicacao: 'Melhor para quem esta comecando do zero.',
  },
  MANUAL_ASSISTIDO: {
    metodo: 'MANUAL_ASSISTIDO',
    titulo: 'Plano Semanal Manual Assistido',
    descricao: 'Da mais controle ao aluno, mas mantem alertas inteligentes.',
    ritmo: 'equilibrado',
    foco: 'MANUAL',
    minutosSessao: 60,
    explicacao: 'Melhor para alunos experientes ou acompanhamento por mentoria.',
  },
};

export const MOMENTO_PARA_METODO: Record<MomentoEstudo, MetodoEstudo> = {
  COMECO_ZERO: 'TRILHA_OBJETIVO',
  PROVA_DATA: 'PLANO_POR_PRAZO',
  ATRASADO: 'RECUPERACAO_ATRASO',
  REVISAR: 'REVISAO_INTENSIVA',
  QUESTOES: 'MODO_QUESTOES',
  CICLO_AUTOMATICO: 'CICLO_INTELIGENTE',
};

export function normalizarMetodoEstudo(valor?: string | null): MetodoEstudo {
  if (valor && (METODOS_ESTUDO as readonly string[]).includes(valor)) return valor as MetodoEstudo;
  if (valor && (MOMENTOS_ESTUDO as readonly string[]).includes(valor)) return MOMENTO_PARA_METODO[valor as MomentoEstudo];
  return 'CICLO_INTELIGENTE';
}

export function metodoPorMomento(momento?: string | null): MetodoEstudo {
  if (momento && (MOMENTOS_ESTUDO as readonly string[]).includes(momento)) {
    return MOMENTO_PARA_METODO[momento as MomentoEstudo];
  }
  return normalizarMetodoEstudo(momento);
}

export function getMetodoConfig(valor?: string | null) {
  return METODOS_CONFIG[normalizarMetodoEstudo(valor)];
}
