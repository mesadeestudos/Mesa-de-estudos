export type RitmoCiclo = 'focado' | 'equilibrado' | 'variado';

export interface DisciplinaAlgoritmo {
  id: number;
  nome: string;
  peso?: number | null;
  tipo?: string | null;
  categoria_cognitiva?: string | null;
  dificuldade?: string | null;
  qtd_questoes?: number | null;
  qtd_topicos?: number | null;
}

export interface SessaoAlgoritmo {
  id: number;
  dificuldade: string;
  minutosAlocados: number;
  ordem: number;
}

export interface GeracaoCicloResultado<T extends DisciplinaAlgoritmo> {
  selecionadas: T[];
  scores: Map<number, number>;
  frequencias: Map<number, number>;
  ciclo: T[];
}

const DIFICULDADE_FATOR: Record<string, number> = {
  baixo: 0,
  medio: 0.3,
  'médio': 0.3,
  alto: 0.7,
};

const normalizarTexto = (valor?: string | null) =>
  (valor ?? '').trim().toLowerCase();

const normalizarTipo = (tipo?: string | null) => {
  const valor = normalizarTexto(tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (valor.startsWith('e')) return 'E';
  if (valor.startsWith('b')) return 'B';
  return 'B';
};

const normalizarCategoria = (categoria?: string | null) => {
  const valor = normalizarTexto(categoria);
  if (valor === 'r' || valor.startsWith('racioc')) return 'R';
  if (valor === 'm' || valor.startsWith('memor')) return 'M';
  return 'N';
};

const normalizarDificuldade = (dificuldade?: string | null) => {
  const valor = normalizarTexto(dificuldade);
  if (valor === 'alto') return 'Alto';
  if (valor === 'baixo') return 'Baixo';
  return 'Médio';
};

const getI = (disciplina: DisciplinaAlgoritmo) => {
  const peso = Number(disciplina.peso ?? 1);
  const qtdQuestoes = Number(disciplina.qtd_questoes ?? 0);
  const qtdTopicos = Number(disciplina.qtd_topicos ?? 0);
  return peso * (qtdQuestoes > 0 ? qtdQuestoes : Math.max(1, qtdTopicos));
};

export function calcularDiscsPorDiaAutomatico(horasDiarias: number): number {
  if (horasDiarias <= 1) return 1;
  if (horasDiarias === 2) return 2;
  if (horasDiarias === 3) return 3;
  if (horasDiarias === 4) return 3;
  if (horasDiarias === 5) return 4;
  if (horasDiarias === 6) return 4;
  if (horasDiarias === 7) return 4;
  return 5;
}

export function calcularDiscsPorDia(horasDiarias: number, ritmo: RitmoCiclo): number {
  void ritmo;
  return calcularDiscsPorDiaAutomatico(horasDiarias);
}

export function calcularScore(
  disciplina: Pick<DisciplinaAlgoritmo, 'tipo' | 'dificuldade'>,
  iNorm: number,
  desempenho: number = 1,
): number {
  const tipoFator = normalizarTipo(disciplina.tipo) === 'E' ? 1.5 : 1;
  const dificuldade = normalizarDificuldade(disciplina.dificuldade);
  const dificuldadeFator = DIFICULDADE_FATOR[normalizarTexto(dificuldade)] ?? 0.3;
  return (1 + iNorm + dificuldadeFator) * tipoFator * desempenho;
}

const ordenarPorScore = <T extends DisciplinaAlgoritmo>(scores: Map<number, number>) =>
  (a: T, b: T) => {
    const scoreA = scores.get(a.id) ?? 0;
    const scoreB = scores.get(b.id) ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.nome.localeCompare(b.nome);
  };

export function selecionarDisciplinas<T extends DisciplinaAlgoritmo>(
  disciplinas: T[],
  horasDiarias: number,
  respeitarSelecao: boolean,
): { selecionadas: T[]; scoresPool: Map<number, number> } {
  if (disciplinas.length === 0) {
    return { selecionadas: [], scoresPool: new Map<number, number>() };
  }

  const n = Math.min(disciplinas.length, Math.max(1, horasDiarias * 2));
  const importancias = disciplinas.map(getI);
  const iMaxGlobal = Math.max(...importancias, 1);
  const scoresPool = new Map(
    disciplinas.map((disciplina, indice) => [disciplina.id, calcularScore(disciplina, importancias[indice] / iMaxGlobal)]),
  );

  const porScore = ordenarPorScore<T>(scoresPool);

  if (respeitarSelecao) {
    return {
      selecionadas: [...disciplinas].sort(porScore).slice(0, n),
      scoresPool,
    };
  }

  const especificas = disciplinas.filter(d => normalizarTipo(d.tipo) === 'E').sort(porScore);
  const basicas = disciplinas.filter(d => normalizarTipo(d.tipo) !== 'E').sort(porScore);
  const minimoEspecificas = especificas.length === 0 ? 0 : Math.min(especificas.length, Math.max(1, Math.ceil(n * 0.4)));
  const minimoBasicas = basicas.length === 0 ? 0 : Math.min(basicas.length, n > 1 ? Math.max(1, Math.floor(n * 0.25)) : 1);

  const selecionadas = new Map<number, T>();

  for (const disciplina of especificas.slice(0, minimoEspecificas)) selecionadas.set(disciplina.id, disciplina);
  for (const disciplina of basicas.slice(0, minimoBasicas)) {
    if (selecionadas.size >= n) break;
    selecionadas.set(disciplina.id, disciplina);
  }

  const globalOrdenadas = [...disciplinas].sort(porScore);
  for (const disciplina of globalOrdenadas) {
    if (selecionadas.size >= n) break;
    selecionadas.set(disciplina.id, disciplina);
  }

  return {
    selecionadas: [...selecionadas.values()].sort(porScore).slice(0, n),
    scoresPool,
  };
}

export function calcularFrequenciasHibridas<T extends DisciplinaAlgoritmo>(
  disciplinas: T[],
  scores: Map<number, number>,
): Map<number, number> {
  if (disciplinas.length === 0) return new Map<number, number>();

  const ordenadas = [...disciplinas].sort(ordenarPorScore<T>(scores));
  const valores = ordenadas.map(d => scores.get(d.id) ?? 1);
  const scoreMin = Math.min(...valores);
  const scoreMax = Math.max(...valores);
  const dispersao = Math.max(0, scoreMax - scoreMin);
  const topQuarter = Math.max(1, Math.ceil(ordenadas.length * 0.25));
  const limiteFreq3 = Math.max(1, Math.ceil(ordenadas.length * 0.3));

  const freqMap = new Map<number, number>();
  let usadosFreq3 = 0;

  for (let indice = 0; indice < ordenadas.length; indice++) {
    const disciplina = ordenadas[indice];
    const score = scores.get(disciplina.id) ?? 1;
    const relativo = dispersao > 0 ? (score - scoreMin) / dispersao : 0.5;

    const frequenciaAbsoluta = score >= 2.75 ? 3 : score >= 1.85 ? 2 : 1;
    const frequenciaRelativa = dispersao >= 0.35
      ? relativo >= 0.78
        ? 3
        : relativo >= 0.28
          ? 2
          : 1
      : 1;

    let frequencia = Math.max(frequenciaAbsoluta, frequenciaRelativa);
    const prioridadeAlta = normalizarTipo(disciplina.tipo) === 'E' || normalizarDificuldade(disciplina.dificuldade) === 'Alto';

    if (
      frequencia < 3 &&
      indice < topQuarter &&
      prioridadeAlta &&
      score >= 2.25 &&
      relativo >= 0.45
    ) {
      frequencia = 3;
    }

    if (frequencia === 3) {
      if (usadosFreq3 >= limiteFreq3) {
        frequencia = 2;
      } else {
        usadosFreq3++;
      }
    }

    freqMap.set(disciplina.id, frequencia);
  }

  return freqMap;
}

const getJanelaMinima = (horasDiarias: number, ritmo: RitmoCiclo) => {
  void ritmo;
  const disciplinasDistintas = calcularDiscsPorDiaAutomatico(horasDiarias);
  return Math.max(2, disciplinasDistintas);
};

const getDistanciaDesdeUltima = (historico: number[], idDisciplina: number) => {
  for (let indice = historico.length - 1; indice >= 0; indice--) {
    if (historico[indice] === idDisciplina) {
      return historico.length - 1 - indice;
    }
  }
  return Number.POSITIVE_INFINITY;
};

const distribuirSessoesNoDia = <T extends DisciplinaAlgoritmo>(
  disciplinasDia: T[],
  alocacoes: Map<number, number>,
  scores: Map<number, number>,
): T[] => {
  const restantes = new Map(alocacoes);
  const sessoesDia: T[] = [];

  while (restantes.size > 0) {
    let melhor: T | null = null;
    let melhorPontuacao = Number.NEGATIVE_INFINITY;

    for (const disciplina of disciplinasDia) {
      const restante = restantes.get(disciplina.id) ?? 0;
      if (restante <= 0) continue;

      let pontuacao = (scores.get(disciplina.id) ?? 1) + restante * 0.6;

      if (sessoesDia.length > 0) {
        const anterior = sessoesDia[sessoesDia.length - 1];
        if (anterior.id === disciplina.id) {
          pontuacao -= 100;
        } else {
          const categoriaAtual = normalizarCategoria(disciplina.categoria_cognitiva);
          const categoriaAnterior = normalizarCategoria(anterior.categoria_cognitiva);
          if (categoriaAtual !== 'N' && categoriaAnterior !== 'N') {
            pontuacao += categoriaAtual !== categoriaAnterior ? 0.35 : -0.15;
          }
        }
      }

      if (pontuacao > melhorPontuacao) {
        melhor = disciplina;
        melhorPontuacao = pontuacao;
      }
    }

    const escolhida = melhor ?? disciplinasDia.find(d => (restantes.get(d.id) ?? 0) > 0) ?? null;
    if (!escolhida) break;

    sessoesDia.push(escolhida);
    const novoRestante = (restantes.get(escolhida.id) ?? 1) - 1;
    if (novoRestante <= 0) {
      restantes.delete(escolhida.id);
    } else {
      restantes.set(escolhida.id, novoRestante);
    }
  }

  return sessoesDia;
};

const montarCicloEstrutural = <T extends DisciplinaAlgoritmo>(
  disciplinas: T[],
  scores: Map<number, number>,
  frequencias: Map<number, number>,
  horasDiarias: number,
  ritmo: RitmoCiclo,
) => {
  const totalSlots = disciplinas.reduce((acumulado, disciplina) => acumulado + (frequencias.get(disciplina.id) ?? 1), 0);
  const porScore = ordenarPorScore<T>(scores);
  const ordenadas = [...disciplinas].sort(porScore);
  const restantes = new Map(ordenadas.map(d => [d.id, frequencias.get(d.id) ?? 1]));
  const intervaloIdeal = new Map(ordenadas.map(d => [d.id, totalSlots / Math.max(1, frequencias.get(d.id) ?? 1)]));
  const historicoIds: number[] = [];
  const ciclo: T[] = [];
  const janelaMinima = getJanelaMinima(horasDiarias, ritmo);
  const maxDisciplinasDistintasPorDia = calcularDiscsPorDiaAutomatico(horasDiarias);

  while (ciclo.length < totalSlots) {
    const sessoesRestantes = totalSlots - ciclo.length;
    const slotsDia = Math.min(horasDiarias, sessoesRestantes);
    const disciplinasDisponiveis = ordenadas.filter(d => (restantes.get(d.id) ?? 0) > 0);
    if (disciplinasDisponiveis.length === 0) break;

    const disciplinasDia: T[] = [];
    const targetDistintas = Math.min(maxDisciplinasDistintasPorDia, slotsDia, disciplinasDisponiveis.length);
    const repeticoesNecessarias = Math.max(0, slotsDia - targetDistintas);
    const indiceDia = Math.floor(ciclo.length / horasDiarias);

    while (disciplinasDia.length < targetDistintas) {
      let melhor: T | null = null;
      let melhorPontuacao = Number.NEGATIVE_INFINITY;

      for (const disciplina of disciplinasDisponiveis) {
        if (disciplinasDia.some(item => item.id === disciplina.id)) continue;

        const restante = restantes.get(disciplina.id) ?? 0;
        const frequenciaTotal = frequencias.get(disciplina.id) ?? 1;
        const scoreBase = scores.get(disciplina.id) ?? 1;
        const distancia = getDistanciaDesdeUltima(historicoIds, disciplina.id);
        const alvo = intervaloIdeal.get(disciplina.id) ?? janelaMinima;
        const deficit = Number.isFinite(distancia) ? distancia - alvo : alvo;
        const podeRepetirNoMesmoDia = Math.max(0, restante - 1);
        const candidatosRepetiveisRestantes = disciplinasDisponiveis.filter(item =>
          !disciplinasDia.some(sel => sel.id === item.id) &&
          (restantes.get(item.id) ?? 0) >= 2
        ).length;
        const categoriaAtual = normalizarCategoria(disciplina.categoria_cognitiva);
        const categoriaAnterior = disciplinasDia.length > 0
          ? normalizarCategoria(disciplinasDia[disciplinasDia.length - 1].categoria_cognitiva)
          : (ciclo.length > 0 ? normalizarCategoria(ciclo[ciclo.length - 1].categoria_cognitiva) : 'N');

        let pontuacao = scoreBase + restante * 0.45 + deficit * 0.08;

        if (distancia < janelaMinima) {
          pontuacao -= 80 + (janelaMinima - distancia) * 6;
        }

        if (frequenciaTotal >= 2) {
          pontuacao += frequenciaTotal === 3 ? 2.2 : 1.4;
          pontuacao += Math.min(podeRepetirNoMesmoDia, repeticoesNecessarias) * 0.7;
        } else if (disciplinasDia.length >= targetDistintas - 1) {
          pontuacao -= 0.9;
        }

        // Nos primeiros blocos, segura mais as disciplinas 1x para dar espaço
        // a matérias que conseguem reaparecer no mesmo dia.
        if (indiceDia <= 1 && frequenciaTotal === 1 && repeticoesNecessarias > 0) {
          pontuacao -= 1.8;
        }

        // Se ainda existem candidatas com frequência >= 2 suficientes para completar
        // o conjunto do dia, penaliza abrir disciplina 1x cedo demais.
        if (
          frequenciaTotal === 1 &&
          candidatosRepetiveisRestantes + disciplinasDia.length >= targetDistintas
        ) {
          pontuacao -= 2.2;
        }

        if (categoriaAnterior !== 'N' && categoriaAtual !== 'N') {
          pontuacao += categoriaAnterior !== categoriaAtual ? 0.35 : -0.15;
        }

        if (pontuacao > melhorPontuacao) {
          melhor = disciplina;
          melhorPontuacao = pontuacao;
        }
      }

      const escolhida = melhor ?? disciplinasDisponiveis.find(d => !disciplinasDia.some(item => item.id === d.id)) ?? null;
      if (!escolhida) break;
      disciplinasDia.push(escolhida);
    }

    const alocacoes = new Map<number, number>();
    for (const disciplina of disciplinasDia) {
      alocacoes.set(disciplina.id, 1);
    }

    let extras = slotsDia - disciplinasDia.length;
    while (extras > 0) {
      let melhorExtra: T | null = null;
      let melhorPontuacao = Number.NEGATIVE_INFINITY;

      for (const disciplina of disciplinasDia) {
        const restante = restantes.get(disciplina.id) ?? 0;
        const jaAlocado = alocacoes.get(disciplina.id) ?? 0;
        const disponivelParaExtra = restante - jaAlocado;
        if (disponivelParaExtra <= 0) continue;

        const frequenciaTotal = frequencias.get(disciplina.id) ?? 1;
        const scoreBase = scores.get(disciplina.id) ?? 1;
        const bonusFrequencia = frequenciaTotal === 3 ? 1.1 : frequenciaTotal === 2 ? 0.7 : 0;
        const penalidadeExcesso = jaAlocado * 0.6;
        const pontuacao = scoreBase + bonusFrequencia + disponivelParaExtra * 0.4 - penalidadeExcesso;

        if (pontuacao > melhorPontuacao) {
          melhorExtra = disciplina;
          melhorPontuacao = pontuacao;
        }
      }

      if (melhorExtra) {
        alocacoes.set(melhorExtra.id, (alocacoes.get(melhorExtra.id) ?? 0) + 1);
        extras--;
        continue;
      }

      let melhorNova: T | null = null;
      let melhorPontuacaoNova = Number.NEGATIVE_INFINITY;
      for (const disciplina of disciplinasDisponiveis) {
        if (disciplinasDia.some(item => item.id === disciplina.id)) continue;
        const restante = restantes.get(disciplina.id) ?? 0;
        if (restante <= 0) continue;

        const scoreBase = scores.get(disciplina.id) ?? 1;
        const distancia = getDistanciaDesdeUltima(historicoIds, disciplina.id);
        const frequenciaTotal = frequencias.get(disciplina.id) ?? 1;
        let pontuacao = scoreBase + (Number.isFinite(distancia) ? distancia * 0.05 : 0) - 2.2;
        if (frequenciaTotal === 1) pontuacao -= 1.1;
        if (indiceDia <= 1) pontuacao -= 0.8;

        if (pontuacao > melhorPontuacaoNova) {
          melhorNova = disciplina;
          melhorPontuacaoNova = pontuacao;
        }
      }

      if (!melhorNova) break;
      disciplinasDia.push(melhorNova);
      alocacoes.set(melhorNova.id, 1);
      extras--;
    }

    const sessoesDia = distribuirSessoesNoDia(disciplinasDia, alocacoes, scores);
    for (const sessao of sessoesDia) {
      ciclo.push(sessao);
      historicoIds.push(sessao.id);
      restantes.set(sessao.id, (restantes.get(sessao.id) ?? 1) - 1);
    }
  }

  return ciclo;
};

const pontuarRotacao = <T extends DisciplinaAlgoritmo>(
  ciclo: T[],
  inicio: number,
  horasDiarias: number,
  scores: Map<number, number>,
) => {
  const janela = Math.min(ciclo.length, horasDiarias + 2);
  const vistos = new Set<number>();
  let penalidade = 0;

  for (let indice = 0; indice < janela; indice++) {
    const disciplina = ciclo[(inicio + indice) % ciclo.length];
    if (vistos.has(disciplina.id)) penalidade += 4;
    vistos.add(disciplina.id);
    if (indice > 0) {
      const anterior = ciclo[(inicio + indice - 1) % ciclo.length];
      if (anterior.id === disciplina.id) penalidade += 20;
    }
  }

  const scoreInicial = scores.get(ciclo[inicio].id) ?? 1;
  penalidade -= scoreInicial * 0.5;
  return penalidade;
};

const rotacionarParaMelhorInicio = <T extends DisciplinaAlgoritmo>(
  ciclo: T[],
  horasDiarias: number,
  scores: Map<number, number>,
) => {
  if (ciclo.length <= 1) return ciclo;

  let melhorIndice = 0;
  let melhorPontuacao = Number.POSITIVE_INFINITY;

  for (let indice = 0; indice < ciclo.length; indice++) {
    const pontuacao = pontuarRotacao(ciclo, indice, horasDiarias, scores);
    if (pontuacao < melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorIndice = indice;
    }
  }

  return [...ciclo.slice(melhorIndice), ...ciclo.slice(0, melhorIndice)];
};

export function gerarCicloEstrutural<T extends DisciplinaAlgoritmo>(
  disciplinas: T[],
  horasDiarias: number,
  ritmo: RitmoCiclo,
  respeitarSelecao: boolean = false,
): GeracaoCicloResultado<T> {
  const { selecionadas } = selecionarDisciplinas(disciplinas, horasDiarias, respeitarSelecao);

  if (selecionadas.length === 0) {
    return {
      selecionadas: [],
      scores: new Map<number, number>(),
      frequencias: new Map<number, number>(),
      ciclo: [],
    };
  }

  const importancias = selecionadas.map(getI);
  const iMax = Math.max(...importancias, 1);
  const scores = new Map(
    selecionadas.map((disciplina, indice) => [disciplina.id, calcularScore(disciplina, importancias[indice] / iMax)]),
  );
  const frequencias = calcularFrequenciasHibridas(selecionadas, scores);
  const cicloBase = montarCicloEstrutural(selecionadas, scores, frequencias, horasDiarias, ritmo);
  const ciclo = rotacionarParaMelhorInicio(cicloBase, horasDiarias, scores);

  return {
    selecionadas,
    scores,
    frequencias,
    ciclo,
  };
}

export function gerarDistribuicaoCiclo<T extends DisciplinaAlgoritmo>(
  disciplinas: T[],
  horasDiarias: number,
  ritmo: RitmoCiclo,
  respeitarSelecao: boolean = false,
): SessaoAlgoritmo[] {
  const { ciclo } = gerarCicloEstrutural(disciplinas, horasDiarias, ritmo, respeitarSelecao);
  return ciclo.map((disciplina, indice) => ({
    id: disciplina.id,
    dificuldade: normalizarDificuldade(disciplina.dificuldade),
    minutosAlocados: 60,
    ordem: indice + 1,
  }));
}

export function montarSessoesDoDia<T extends DisciplinaAlgoritmo>(
  ciclo: T[],
  horasDiarias: number,
  posicaoAtual: number,
): T[] {
  if (ciclo.length === 0) return [];
  return Array.from({ length: Math.min(horasDiarias, ciclo.length) }, (_, indice) => {
    const posicao = (Math.max(1, posicaoAtual) - 1 + indice) % ciclo.length;
    return ciclo[posicao];
  });
}
