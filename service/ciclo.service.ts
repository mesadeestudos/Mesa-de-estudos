import prisma                from '@/lib/prisma';
import { criarCicloSchema } from '@/schema/ciclo.schema';
import { salvarCiclo, buscarCicloAtivo, desativarCiclosUsuario } from '@/repository/ciclo.repository';
import { DisciplinaCicloDTO } from '@/dto/ciclo.dto';

// ─────────────────────────────────────────────────────────────
// Tipos internos do algoritmo
// ─────────────────────────────────────────────────────────────

interface DisciplinaAlgo {
  id:                  number;
  nome:                string;
  peso:                number;
  tipo:                string;
  categoria_cognitiva: string;
  dificuldade:         string;
  qtd_questoes:        number;
}

// ─────────────────────────────────────────────────────────────
// Score de importância da disciplina
//
// score = (1 + I_norm) × tipo_fator × dific_fator × desempenho
//
// I      = peso × qtd_questoes  (contribuição total no edital)
// I_norm = I / I_max            (normalizado entre 0 e 1)
// tipo_fator : B=1.0, E=1.5
// dific_fator: Baixo=1, Médio=2, Alto=3
//
// Future: passar desempenho (0–1) calculado a partir de dados de
//         performance do usuário para tornar o ciclo adaptativo.
// ─────────────────────────────────────────────────────────────

export function calcularScore(
  d:          Pick<DisciplinaAlgo, 'tipo' | 'dificuldade'>,
  iNorm:      number,
  desempenho: number = 1.0,
): number {
  const tipoFator:  Record<string, number> = { E: 1.5, B: 1.0 };
  const dificFator: Record<string, number> = { Baixo: 1, Médio: 2, Alto: 3 };
  return (1 + iNorm) * (tipoFator[d.tipo] ?? 1.0) * (dificFator[d.dificuldade] ?? 2) * desempenho;
}

// ─────────────────────────────────────────────────────────────
// Frequência de cada disciplina no ciclo
//
// Proporcional a √score — comprime a escala evitando monopolização.
// Mínimo de 1 aparição por disciplina.
//
// Future: chamar novamente com scores atualizados por desempenho
//         para reajustar a fila sem recriar o ciclo do zero.
// ─────────────────────────────────────────────────────────────

export function calcularFrequencias(
  disciplinas: DisciplinaAlgo[],
  scores:      Map<number, number>,
): Map<number, number> {
  // Âncora absoluta: score mínimo possível = 1 (básica, Baixo, sem dados de edital) → freq 1
  // score 4 → freq 2, score 9 → freq 3 — independente do grupo
  return new Map(disciplinas.map(d => [
    d.id,
    Math.max(1, Math.round(Math.sqrt(scores.get(d.id)!))),
  ]));
}

// ─────────────────────────────────────────────────────────────
// Garante distância mínima entre repetições da mesma disciplina
// minGap = 2 × horasDiarias → não repete na mesma meta diária
//          nem na meta imediatamente seguinte
// ─────────────────────────────────────────────────────────────

function repararEspacamento(
  ciclo:  DisciplinaAlgo[],
  freqs:  Map<number, number>,
  minGap: number,
): DisciplinaAlgo[] {
  const result = [...ciclo];
  const N      = result.length;

  for (let i = 1; i < N; i++) {
    const distMin = Math.max(
      Math.floor(N / (freqs.get(result[i].id) ?? 1)),
      minGap,
    );
    let conflito = false;
    for (let j = Math.max(0, i - distMin + 1); j < i; j++) {
      if (result[j].id === result[i].id) { conflito = true; break; }
    }
    if (!conflito) continue;

    for (let k = i + 1; k < Math.min(N, i + distMin * 2); k++) {
      if (result[k].id === result[i].id) continue;
      const distK = Math.max(Math.floor(N / (freqs.get(result[k].id) ?? 1)), minGap);
      let candOK  = true;
      for (let j = Math.max(0, i - distK + 1); j < i; j++) {
        if (result[j].id === result[k].id) { candOK = false; break; }
      }
      if (candOK) { [result[i], result[k]] = [result[k], result[i]]; break; }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Algoritmo de geração do ciclo inteligente
//
// Princípio: fila contínua de sessões de 1h (ciclo dinâmico).
//
// Passos:
//  1. Selecionar até horasDiarias×2 disciplinas distintas
//     (tipo E prioridade — 60%; restante tipo B por peso)
//  2. Calcular score por disciplina
//  3. Frequência proporcional a √score (totalSlots dinâmico)
//  4. Round-robin por categoria cognitiva + intercalação R ↔ M
//  5. Reparar espaçamento: gap mínimo = 2 × horasDiarias
// ─────────────────────────────────────────────────────────────

export function gerarCiclo(
  disciplinas:  DisciplinaAlgo[],
  horasDiarias: number,
): DisciplinaCicloDTO[] {

  if (disciplinas.length === 0) return [];

  // Passo 1 — seleção de disciplinas distintas
  const n           = Math.min(disciplinas.length, Math.max(1, horasDiarias * 2));
  const porPeso     = (a: DisciplinaAlgo, b: DisciplinaAlgo) => (b.peso ?? 1) - (a.peso ?? 1);
  const especificas = disciplinas.filter(d => d.tipo === 'E').sort(porPeso);
  const basicas     = disciplinas.filter(d => d.tipo !== 'E').sort(porPeso);
  const maxE        = Math.ceil(n * 0.6);
  const selecionadas = [...especificas.slice(0, maxE), ...basicas].slice(0, n);

  // Passo 2 — score por disciplina
  const Is     = selecionadas.map(d => (d.peso ?? 1) * (d.qtd_questoes ?? 0));
  const Imax   = Math.max(...Is, 1);
  const scores = new Map(
    selecionadas.map((d, i) => [d.id, calcularScore(d, Is[i] / Imax)]),
  );

  // Passo 3 — frequência proporcional a √score (ciclo dinâmico)
  const freqs = calcularFrequencias(selecionadas, scores);

  // Passo 4 — round-robin por categoria cognitiva e intercalação R ↔ M
  const R = selecionadas.filter(d => d.categoria_cognitiva === 'R');
  const M = selecionadas.filter(d => d.categoria_cognitiva === 'M');

  const buildRoundRobin = (discs: DisciplinaAlgo[]): DisciplinaAlgo[] => {
    const decks  = discs.map(d => Array<DisciplinaAlgo>(freqs.get(d.id)!).fill(d));
    const result: DisciplinaAlgo[] = [];
    while (decks.some(deck => deck.length > 0)) {
      for (const deck of decks) {
        if (deck.length > 0) result.push(deck.shift()!);
      }
    }
    return result;
  };

  const filaR = buildRoundRobin(R);
  const filaM = buildRoundRobin(M);

  const cicloBase: DisciplinaAlgo[] = [];
  let ri = 0, mi = 0;
  while (ri < filaR.length || mi < filaM.length) {
    if (ri < filaR.length) cicloBase.push(filaR[ri++]);
    if (mi < filaM.length) cicloBase.push(filaM[mi++]);
  }

  // Passo 5 — espaçamento mínimo = 2 × horasDiarias entre repetições
  const ciclo = repararEspacamento(cicloBase, freqs, horasDiarias * 2);

  return ciclo.map((d, idx) => ({
    id:              d.id,
    dificuldade:     d.dificuldade,
    minutosAlocados: 60,
    ordem:           idx + 1,
  }));
}

// ─────────────────────────────────────────────────────────────
// Service — criar ciclo
// ─────────────────────────────────────────────────────────────

export async function criarCicloService(body: unknown, idUsuario: bigint) {

  const input = criarCicloSchema.parse(body);

  const idsDisciplinas = input.disciplinas.map(d => d.id);
  const discsBanco = await prisma.disciplina.findMany({
    where: { id_disciplina: { in: idsDisciplinas } },
  });

  const dificMap = new Map(input.disciplinas.map(d => [d.id, d.dificuldade]));

  const disciplinasAlgo: DisciplinaAlgo[] = discsBanco.map(d => ({
    id:                  d.id_disciplina,
    nome:                d.nome,
    peso:                Number(d.peso ?? 1),
    tipo:                d.tipo,
    categoria_cognitiva: d.categoria_cognitiva,
    dificuldade:         dificMap.get(d.id_disciplina) ?? 'Médio',
    qtd_questoes:        d.qtd_questoes ? Number(d.qtd_questoes) : 0,
  }));

  const distribuicao = gerarCiclo(disciplinasAlgo, input.horasDiarias);

  const idsNoCiclo = new Set(distribuicao.map(d => d.id));

  // Persiste nível de dificuldade apenas no modo personalizado (avaliação explícita do usuário)
  const discParaUpsert = input.modo === 'personalizado'
    ? input.disciplinas.filter(d => idsNoCiclo.has(d.id))
    : [];

  const ciclo = await salvarCiclo({
    idUsuario,
    idCargo:      input.idCargo,
    horasDiarias: input.horasDiarias,
    modo:         input.modo,
    disciplinas:  discParaUpsert as Array<{ id: number; dificuldade: string }>,
    distribuicao,
  });

  return {
    idCiclo:      Number(ciclo.idCiclo),
    idPlano:      Number(ciclo.idPlano),
    totalSlots:   distribuicao.length,
    distribuicao,
  };
}

// ─────────────────────────────────────────────────────────────
// Service — buscar ciclo ativo para visualização
// ─────────────────────────────────────────────────────────────

export async function buscarCicloService(idUsuario: bigint) {

  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) return null;

  const horasPorDia  = Number(ciclo.plano_estudo.horas_por_dia);
  const discsPorDia  = Math.min(horasPorDia, 4);
  const posicaoAtual = Math.max(1, ciclo.ciclo_execucao?.posicao_atual ?? 1);
  const slots        = ciclo.ciclo_disciplina;
  const totalSlots   = slots.length;

  if (totalSlots === 0) {
    await prisma.ciclo_estudo.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data:  { ativo: false },
    });
    return null;
  }

  const idsUnicos = [...new Set(slots.map(s => s.id_disciplina))];
  const niveis    = await prisma.disciplina_nivel_usuario.findMany({
    where: { id_usuario: idUsuario, id_disciplina: { in: idsUnicos } },
  });
  const nivelMap = new Map(niveis.map(n => [n.id_disciplina, n.nivel]));

  const hojeSlots = Array.from({ length: horasPorDia }, (_, i) =>
    slots[(posicaoAtual - 1 + i) % totalSlots],
  ).map((s, i) => ({
    ordem:           i + 1,
    idDisciplina:    s.id_disciplina,
    nome:            s.disciplina.nome,
    tipo:            s.disciplina.tipo,
    categoria:       s.disciplina.categoria_cognitiva,
    nivel:           nivelMap.get(s.id_disciplina) ?? null,
    minutosAlocados: Math.round(Number(s.horas_planejadas) * 60),
  }));

  const freqMap = new Map<number, number>();
  for (const s of slots) freqMap.set(s.id_disciplina, (freqMap.get(s.id_disciplina) ?? 0) + 1);

  const discMap = new Map<number, (typeof slots)[0]>();
  for (const s of slots) if (!discMap.has(s.id_disciplina)) discMap.set(s.id_disciplina, s);

  const disciplinas = [...discMap.values()].map(s => ({
    idDisciplina: s.id_disciplina,
    nome:         s.disciplina.nome,
    tipo:         s.disciplina.tipo,
    categoria:    s.disciplina.categoria_cognitiva,
    nivel:        nivelMap.get(s.id_disciplina) ?? null,
    frequencia:   freqMap.get(s.id_disciplina) ?? 0,
  })).sort((a, b) => b.frequencia - a.frequencia);

  const cargo  = ciclo.plano_estudo.cargo;
  const edital = cargo.edital;

  return {
    idCiclo:      Number(ciclo.id_ciclo),
    idPlano:      Number(ciclo.id_plano),
    metodo:       ciclo.plano_estudo.metodo,
    horasPorDia,
    cargoNome:    cargo.nome,
    concursoNome: edital?.concurso?.nome ?? '',
    bancaSigla:   edital?.banca?.sigla ?? edital?.banca?.nome ?? '',
    dataCriacao:  ciclo.plano_estudo.data_criacao?.toISOString() ?? '',
    totalSlots,
    discsPorDia,
    diasPorCiclo: Math.ceil(totalSlots / discsPorDia),
    posicaoAtual,
    hojeSlots,
    disciplinas,
  };
}

// ─────────────────────────────────────────────────────────────
// Service — avançar posição do ciclo (1 sessão por vez)
// ─────────────────────────────────────────────────────────────

export async function avancarCicloService(idUsuario: bigint) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const totalSlots   = ciclo.ciclo_disciplina.length;
  const posicaoAtual = ciclo.ciclo_execucao?.posicao_atual ?? 1;
  const novaPosicao  = (posicaoAtual % totalSlots) + 1;

  await prisma.ciclo_execucao.update({
    where: { id_ciclo: ciclo.id_ciclo },
    data:  { posicao_atual: novaPosicao, data_ultima_execucao: new Date() },
  });

  return { posicaoAtual: novaPosicao, totalSlots };
}

// ─────────────────────────────────────────────────────────────
// Service — desativar ciclo (para edição)
// ─────────────────────────────────────────────────────────────

export async function desativarCicloService(idUsuario: bigint) {
  await desativarCiclosUsuario(idUsuario);
}
