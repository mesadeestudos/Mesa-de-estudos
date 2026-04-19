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
  tipo:                string; // 'B' | 'E'
  categoria_cognitiva: string; // 'R' | 'M'
  dificuldade?:        string; // 'Baixo' | 'Médio' | 'Alto'
}

// Passo 10 — garante distância mínima entre repetições da mesma disciplina
function repararEspacamento(
  ciclo: DisciplinaAlgo[],
  freqs: Map<number, number>,
): DisciplinaAlgo[] {
  const result = [...ciclo];
  const N      = result.length;

  for (let i = 1; i < N; i++) {
    const distMin = Math.floor(N / (freqs.get(result[i].id) ?? 1));
    let conflito  = false;
    for (let j = Math.max(0, i - distMin + 1); j < i; j++) {
      if (result[j].id === result[i].id) { conflito = true; break; }
    }
    if (!conflito) continue;

    // Trocar com o primeiro candidato suficientemente distante
    for (let k = i + 1; k < Math.min(N, i + distMin * 2); k++) {
      if (result[k].id === result[i].id) continue;
      const distK = Math.floor(N / (freqs.get(result[k].id) ?? 1));
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
// Princípio: o ciclo é uma FILA CONTÍNUA de sessões de 1h.
//            O dia é apenas um recorte sequencial dessa fila.
//
// Passos:
//  1. totalSlots = horas × 2 sessões
//  2. Selecionar top N disciplinas: tipo E prioridade (60%), restante tipo B por peso
//  3. Frequência uniforme: floor(slots/n), resto nas primeiras disciplinas
//  4. Construir fila com round-robin interno por categoria
//  5. Intercalar categorias cognitivas (R ↔ M)
// ─────────────────────────────────────────────────────────────

export function gerarCiclo(
  disciplinas:  DisciplinaAlgo[],
  horasDiarias: number,
): DisciplinaCicloDTO[] {

  if (disciplinas.length === 0) return [];

  // ── Base científica ──────────────────────────────────────────
  // Carga cognitiva (Sweller, 1988): WM satura com >4 contextos/dia
  // Ritmo ultradiano (Lavie, 1982): sessões de 1h respeitam picos de foco
  // → disciplinas/dia = min(horas_por_dia, 4)
  // → tamanho do ciclo = horas_por_dia × 2 sessões
  // ─────────────────────────────────────────────────────────────
  const slots = horasDiarias * 2; // total de sessões no ciclo

  // Passo 1 — até `slots` disciplinas distintas (cada uma aparece ao menos 1×)
  const n = Math.min(disciplinas.length, Math.max(1, slots));

  // Passo 2 — seleção: tipo E tem prioridade (até 60% de n), restante preenchido por tipo B
  // Dentro de cada grupo ordena por peso descendente
  const porPeso      = (a: DisciplinaAlgo, b: DisciplinaAlgo) => (b.peso ?? 1) - (a.peso ?? 1);
  const especificas  = disciplinas.filter(d => d.tipo === 'E').sort(porPeso);
  const basicas      = disciplinas.filter(d => d.tipo !== 'E').sort(porPeso);
  const maxE         = Math.ceil(n * 0.6);
  const selecionadas = [...especificas.slice(0, maxE), ...basicas].slice(0, n);

  // Passo 3 — frequência uniforme: cada disciplina recebe floor(slots/n) sessões
  // O restante é distribuído uma a uma pelas primeiras disciplinas
  const base  = Math.floor(slots / selecionadas.length);
  const resto = slots - base * selecionadas.length;
  const freqs = new Map<number, number>(
    selecionadas.map((d, i) => [d.id, base + (i < resto ? 1 : 0)]),
  );

  // Passo 4 — separar por categoria cognitiva e construir filas via round-robin
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

  // Passo 5 — intercalar R e M
  const cicloBase: DisciplinaAlgo[] = [];
  let ri = 0, mi = 0;
  while (ri < filaR.length || mi < filaM.length) {
    if (ri < filaR.length) cicloBase.push(filaR[ri++]);
    if (mi < filaM.length) cicloBase.push(filaM[mi++]);
  }

  // Passo 10 — reparar espaçamento mínimo entre repetições
  const ciclo = repararEspacamento(cicloBase, freqs);

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

  // Buscar dados completos das disciplinas (tipo, categoria_cognitiva, peso, qtd_questoes)
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
    dificuldade:         dificMap.get(d.id_disciplina),
  }));

  const distribuicao = gerarCiclo(disciplinasAlgo, input.horasDiarias);

  // Para personalizado, upsert somente das disciplinas que entraram no ciclo
  const idsNoCiclo = new Set(distribuicao.map(d => d.id));
  const discParaUpsert = input.disciplinas
    .filter(d => idsNoCiclo.has(d.id) && d.dificuldade);

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
  const slots        = ciclo.ciclo_disciplina; // já ordenados por ordem asc
  const totalSlots   = slots.length;

  // Ciclo corrompido (sem disciplinas) — desativar e ignorar
  if (totalSlots === 0) {
    await prisma.ciclo_estudo.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data:  { ativo: false },
    });
    return null;
  }

  // Disciplinas únicas para buscar nível
  const idsUnicos = [...new Set(slots.map(s => s.id_disciplina))];
  const niveis    = await prisma.disciplina_nivel_usuario.findMany({
    where: { id_usuario: idUsuario, id_disciplina: { in: idsUnicos } },
  });
  const nivelMap = new Map(niveis.map(n => [n.id_disciplina, n.nivel]));

  // Mostra horasPorDia sessões a partir de posicaoAtual — meta diária sem cap rígido
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

  // Frequência de cada disciplina no ciclo
  const freqMap = new Map<number, number>();
  for (const s of slots) freqMap.set(s.id_disciplina, (freqMap.get(s.id_disciplina) ?? 0) + 1);

  // Disciplinas únicas com metadados
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
// Service — avançar posição do ciclo (concluir dia)
// ─────────────────────────────────────────────────────────────

export async function avancarCicloService(idUsuario: bigint) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const totalSlots   = ciclo.ciclo_disciplina.length;
  const posicaoAtual = ciclo.ciclo_execucao?.posicao_atual ?? 1;

  // Avança 1 posição — o usuário conclui sessão a sessão
  const novaPosicao = (posicaoAtual % totalSlots) + 1;

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
