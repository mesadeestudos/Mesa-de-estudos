import prisma from '@/lib/prisma';
import { Prisma } from '@/src/generated/prisma/client';
import {
  calcularDiscsPorDia as calcularDiscsPorDiaAlgoritmo,
  calcularFrequenciasHibridas,
  calcularScore as calcularScoreAlgoritmo,
  gerarDistribuicaoCiclo,
  type RitmoCiclo,
} from '@/lib/cicloAlgorithm';
import { getMetodoConfig, metodoPorMomento } from '@/lib/studyMethods';
import { criarCicloSchema } from '@/schema/ciclo.schema';
import { salvarCiclo, buscarCicloAtivo, desativarCiclosUsuario } from '@/repository/ciclo.repository';
import { DisciplinaCicloDTO } from '@/dto/ciclo.dto';

interface DisciplinaAlgo {
  id: number;
  nome: string;
  peso: number;
  tipo: string;
  categoria_cognitiva: string;
  dificuldade: string;
  desempenho?: number;
  qtd_questoes: number;
  qtd_topicos: number;
}

interface SinalDisciplina {
  id_disciplina: number;
  ultima_sessao: Date | null;
}

const normalizarRitmo = (ritmo?: string | null): RitmoCiclo => {
  const valor = (ritmo ?? '').toLowerCase();
  if (valor === 'focado' || valor === 'variado') return valor;
  return 'equilibrado';
};

const normalizarNivelParaDificuldade = (nivel?: string | null) => {
  const valor = (nivel ?? '').toUpperCase();
  if (valor === 'ALTO') return 'Alto';
  if (valor === 'BAIXO') return 'Baixo';
  return 'Médio';
};

interface AccuracyRow { id_disciplina: number; total: bigint; acertos: bigint; }

async function calcularFatoresDesempenho(idUsuario: bigint, idsDisciplinas: number[]) {
  if (idsDisciplinas.length === 0) return new Map<number, number>();

  const [progressos, ultimasSessoes, acuraciaRaw] = await Promise.all([
    prisma.disciplina_progresso.findMany({
      where: { id_usuario: idUsuario, id_disciplina: { in: idsDisciplinas } },
      select: { id_disciplina: true, percentual: true, concluida: true },
    }),
    prisma.$queryRaw<SinalDisciplina[]>`
      SELECT
        id_disciplina,
        MAX(inicio) AS ultima_sessao
      FROM planejamento.sessao_estudo
      WHERE id_usuario = ${idUsuario}
        AND id_disciplina IN (${Prisma.join(idsDisciplinas)})
        AND fim IS NOT NULL
      GROUP BY id_disciplina
    `,
    prisma.$queryRaw<AccuracyRow[]>`
      SELECT id_disciplina,
             SUM(total_questoes) AS total,
             SUM(total_acertos)  AS acertos
      FROM planejamento.questao_treino
      WHERE id_usuario = ${idUsuario}
        AND id_disciplina IN (${Prisma.join(idsDisciplinas)})
      GROUP BY id_disciplina
    `.catch(() => [] as AccuracyRow[]),
  ]);

  const progressoMap  = new Map(progressos.map(item => [item.id_disciplina, item]));
  const ultimaSessaoMap = new Map(ultimasSessoes.map(item => [item.id_disciplina, item.ultima_sessao]));
  const acuraciaMap   = new Map(acuraciaRaw.map(item => [
    item.id_disciplina,
    Number(item.total) > 0 ? Number(item.acertos) / Number(item.total) : null,
  ]));
  const agora = Date.now();

  return new Map(idsDisciplinas.map((idDisciplina) => {
    const progresso   = progressoMap.get(idDisciplina);
    const percentual  = Number(progresso?.percentual ?? 0);
    const ultimaSessao = ultimaSessaoMap.get(idDisciplina);
    const acuracia    = acuraciaMap.get(idDisciplina) ?? null;
    let fator = 1;

    if (!progresso || percentual < 15) fator += 0.18;
    else if (percentual < 40) fator += 0.12;
    else if (percentual < 65) fator += 0.06;
    else if (percentual >= 90 || progresso.concluida) fator -= 0.14;

    if (!ultimaSessao) {
      fator += 0.12;
    } else {
      const diasSemEstudar = Math.floor((agora - ultimaSessao.getTime()) / 86_400_000);
      if (diasSemEstudar >= 10) fator += 0.16;
      else if (diasSemEstudar >= 5) fator += 0.09;
      else if (diasSemEstudar >= 3) fator += 0.04;
    }

    if (acuracia !== null) {
      if (acuracia < 0.55) fator += 0.22;
      else if (acuracia < 0.65) fator += 0.16;
      else if (acuracia < 0.75) fator += 0.08;
      else if (acuracia >= 0.85) fator -= 0.08;
    }

    return [idDisciplina, Number(Math.min(1.4, Math.max(0.8, fator)).toFixed(2))];
  }));
}

export function calcularDiscsPorDia(horasDiarias: number, ritmo: string): number {
  return calcularDiscsPorDiaAlgoritmo(horasDiarias, normalizarRitmo(ritmo));
}

export function calcularScore(
  d: Pick<DisciplinaAlgo, 'tipo' | 'dificuldade'>,
  iNorm: number,
  desempenho: number = 1,
): number {
  return calcularScoreAlgoritmo(d, iNorm, desempenho);
}

export function calcularFrequencias(
  disciplinas: DisciplinaAlgo[],
  scores: Map<number, number>,
): Map<number, number> {
  return calcularFrequenciasHibridas(disciplinas, scores);
}

export function gerarCiclo(
  disciplinas: DisciplinaAlgo[],
  horasDiarias: number,
  disciplinasPorDia: number,
  respeitarSelecao: boolean = false,
): DisciplinaCicloDTO[] {
  const ritmo: RitmoCiclo = disciplinasPorDia >= horasDiarias
    ? 'variado'
    : disciplinasPorDia <= Math.ceil(horasDiarias * 0.45)
      ? 'focado'
      : 'equilibrado';

  return gerarDistribuicaoCiclo(disciplinas, horasDiarias, ritmo, respeitarSelecao).map(item => ({
    id: item.id,
    dificuldade: item.dificuldade,
    minutosAlocados: item.minutosAlocados,
    ordem: item.ordem,
  }));
}

export async function criarCicloService(body: unknown, idUsuario: bigint) {
  const input = criarCicloSchema.parse(body);
  const metodoEstudo = input.metodoEstudo ?? metodoPorMomento(input.momentoEstudo);
  const metodoConfig = getMetodoConfig(metodoEstudo);

  const idsDisciplinas = input.disciplinas.map(d => d.id);
  const [disciplinasBanco, desempenhoPorDisciplina] = await Promise.all([
    prisma.disciplina.findMany({
      where: { id_disciplina: { in: idsDisciplinas } },
      include: { _count: { select: { topico: true } } },
    }),
    calcularFatoresDesempenho(idUsuario, idsDisciplinas),
  ]);

  const dificuldadePorDisciplina = new Map(input.disciplinas.map(d => [d.id, d.dificuldade]));

  const disciplinasAlgo: DisciplinaAlgo[] = disciplinasBanco.map(disciplina => ({
    id: disciplina.id_disciplina,
    nome: disciplina.nome,
    peso: Number(disciplina.peso ?? 1),
    tipo: disciplina.tipo,
    categoria_cognitiva: disciplina.categoria_cognitiva,
    dificuldade: dificuldadePorDisciplina.get(disciplina.id_disciplina) ?? 'Médio',
    desempenho: desempenhoPorDisciplina.get(disciplina.id_disciplina) ?? 1,
    qtd_questoes: disciplina.qtd_questoes ? Number(disciplina.qtd_questoes) : 0,
    qtd_topicos: disciplina._count.topico,
  }));

  const ritmo = input.ritmo ? normalizarRitmo(input.ritmo) : metodoConfig.ritmo;
  const disciplinasPorDia = calcularDiscsPorDiaAlgoritmo(input.horasDiarias, ritmo);
  const distribuicao = gerarDistribuicaoCiclo(
    disciplinasAlgo,
    input.horasDiarias,
    ritmo,
    input.modo === 'personalizado',
  ).map(item => ({ ...item, minutosAlocados: metodoConfig.minutosSessao }));

  const idsNoCiclo = new Set(distribuicao.map(item => item.id));
  const disciplinasParaPersistir: Array<{ id: number; dificuldade: string }> =
    input.modo === 'personalizado'
      ? input.disciplinas.filter(d => idsNoCiclo.has(d.id))
      : distribuicao.map(item => ({ id: item.id, dificuldade: 'Médio' }));

  const ciclo = await salvarCiclo({
    idUsuario,
    idCargo: input.idCargo,
    horasDiarias: input.horasDiarias,
    modo: input.modo,
    metodoEstudo,
    ritmo,
    disciplinas: disciplinasParaPersistir,
    distribuicao,
  });

  return {
    idCiclo: Number(ciclo.idCiclo),
    idPlano: Number(ciclo.idPlano),
    totalSlots: distribuicao.length,
    disciplinasPorDia,
    metodoEstudo,
    metodoDetalhe: metodoConfig,
    distribuicao,
  };
}

export async function buscarCicloService(idUsuario: bigint) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) return null;

  const horasPorDia = Number(ciclo.plano_estudo.horas_por_dia);
  const ritmo = normalizarRitmo(ciclo.plano_estudo.ritmo);
  const metodoConfig = getMetodoConfig(ciclo.plano_estudo.metodo);
  const discsPorDia = calcularDiscsPorDiaAlgoritmo(horasPorDia, ritmo);
  const posicaoAtual = Math.max(1, ciclo.ciclo_execucao?.posicao_atual ?? 1);
  const slots = ciclo.ciclo_disciplina;
  const totalSlots = slots.length;

  if (totalSlots === 0) {
    await prisma.ciclo_estudo.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data: { ativo: false },
    });
    return null;
  }

  const idsUnicos = [...new Set(slots.map(slot => slot.id_disciplina))];
  const [niveis, topicosSugeridosBase] = await Promise.all([
    prisma.disciplina_nivel_usuario.findMany({
      where: { id_usuario: idUsuario, id_disciplina: { in: idsUnicos } },
    }),
    prisma.topico.findMany({
      where: {
        id_disciplina: { in: idsUnicos },
        OR: [
          { topico_progresso: { none: { id_usuario: idUsuario } } },
          { topico_progresso: { some: { id_usuario: idUsuario, concluido: false } } },
        ],
      },
      orderBy: [{ id_disciplina: 'asc' }, { ordem: 'asc' }, { id_topico: 'asc' }],
      take: Math.max(20, idsUnicos.length * 4),
    }),
  ]);
  const nivelMap = new Map(niveis.map(nivel => [nivel.id_disciplina, nivel.nivel]));
  const topicosPorDisciplina = new Map<number, Array<{ idTopico: number; descricao: string; ordem: number | null }>>();
  for (const topico of topicosSugeridosBase) {
    if (!topico.id_disciplina) continue;
    const lista = topicosPorDisciplina.get(topico.id_disciplina) ?? [];
    if (lista.length < 3) {
      lista.push({ idTopico: Number(topico.id_topico), descricao: topico.descricao, ordem: topico.ordem ?? null });
      topicosPorDisciplina.set(topico.id_disciplina, lista);
    }
  }

  const freqMap = new Map<number, number>();
  for (const slot of slots) {
    freqMap.set(slot.id_disciplina, (freqMap.get(slot.id_disciplina) ?? 0) + 1);
  }

  const sessoesHoje = Array.from({ length: Math.min(horasPorDia, totalSlots) }, (_, indice) => {
    const posicao = (posicaoAtual - 1 + indice) % totalSlots;
    return slots[posicao];
  });

  const hojeSlots = sessoesHoje.map((slot, indice) => ({
    ordem: indice + 1,
    idDisciplina: slot.id_disciplina,
    nome: slot.disciplina.nome,
    tipo: slot.disciplina.tipo,
    categoria: slot.disciplina.categoria_cognitiva,
    nivel: nivelMap.get(slot.id_disciplina) ?? null,
    minutosAlocados: Math.round(Number(slot.horas_planejadas) * 60),
    topicosSugeridos: topicosPorDisciplina.get(slot.id_disciplina) ?? [],
  }));

  const cicloSlots = slots.map((slot, indice) => ({
    ordem: indice + 1,
    idDisciplina: slot.id_disciplina,
    nome: slot.disciplina.nome,
    tipo: slot.disciplina.tipo,
    categoria: slot.disciplina.categoria_cognitiva,
    nivel: nivelMap.get(slot.id_disciplina) ?? null,
    minutosAlocados: Math.round(Number(slot.horas_planejadas) * 60),
    topicosSugeridos: topicosPorDisciplina.get(slot.id_disciplina) ?? [],
  }));

  const disciplinaPorId = new Map<number, (typeof slots)[number]>();
  for (const slot of slots) {
    if (!disciplinaPorId.has(slot.id_disciplina)) {
      disciplinaPorId.set(slot.id_disciplina, slot);
    }
  }

  const disciplinas = [...disciplinaPorId.values()].map(slot => ({
    idDisciplina: slot.id_disciplina,
    nome: slot.disciplina.nome,
    tipo: slot.disciplina.tipo,
    categoria: slot.disciplina.categoria_cognitiva,
    nivel: nivelMap.get(slot.id_disciplina) ?? null,
    frequencia: freqMap.get(slot.id_disciplina) ?? 0,
  })).sort((a, b) => b.frequencia - a.frequencia || a.nome.localeCompare(b.nome));

  const slotAtual = slots[(posicaoAtual - 1) % totalSlots];
  const topicosPendentes = await prisma.topico.findMany({
    where: {
      id_disciplina: slotAtual.id_disciplina,
      OR: [
        { topico_progresso: { none: { id_usuario: idUsuario } } },
        { topico_progresso: { some: { id_usuario: idUsuario, concluido: false } } },
      ],
    },
    orderBy: [{ ordem: 'asc' }, { id_topico: 'asc' }],
    take: 5,
    select: { id_topico: true, descricao: true },
  });

  const cargo = ciclo.plano_estudo.cargo;
  const edital = cargo.edital;
  const dataProva = edital?.data_prova ? (edital.data_prova as Date).toISOString().slice(0, 10) : null;

  return {
    idCiclo: Number(ciclo.id_ciclo),
    idPlano: Number(ciclo.id_plano),
    metodo: metodoConfig.metodo,
    metodoDetalhe: metodoConfig,
    horasPorDia,
    cargoNome: cargo.nome,
    concursoNome: edital?.concurso?.nome ?? '',
    bancaSigla: edital?.banca?.sigla ?? edital?.banca?.nome ?? '',
    dataCriacao: ciclo.plano_estudo.data_criacao?.toISOString() ?? '',
    dataProva,
    totalSlots,
    discsPorDia,
    diasPorCiclo: Math.ceil(totalSlots / horasPorDia),
    posicaoAtual,
    hojeSlots,
    cicloSlots,
    disciplinas,
    topicosPendentes: topicosPendentes.map(t => ({ id: Number(t.id_topico), descricao: t.descricao })),
  };
}

export async function rebalancearCicloService(idUsuario: bigint) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const idsDisciplinas = [...new Set(ciclo.ciclo_disciplina.map(slot => slot.id_disciplina))];
  if (idsDisciplinas.length === 0) {
    throw Object.assign(new Error('Ciclo sem disciplinas para rebalancear.'), { status: 400 });
  }

  const [disciplinasBanco, niveis, desempenhoPorDisciplina] = await Promise.all([
    prisma.disciplina.findMany({
      where: { id_disciplina: { in: idsDisciplinas } },
      include: { _count: { select: { topico: true } } },
    }),
    prisma.disciplina_nivel_usuario.findMany({
      where: { id_usuario: idUsuario, id_disciplina: { in: idsDisciplinas } },
      select: { id_disciplina: true, nivel: true },
    }),
    calcularFatoresDesempenho(idUsuario, idsDisciplinas),
  ]);

  const nivelMap = new Map(niveis.map(nivel => [nivel.id_disciplina, nivel.nivel]));
  const disciplinasAlgo: DisciplinaAlgo[] = disciplinasBanco.map(disciplina => ({
    id: disciplina.id_disciplina,
    nome: disciplina.nome,
    peso: Number(disciplina.peso ?? 1),
    tipo: disciplina.tipo,
    categoria_cognitiva: disciplina.categoria_cognitiva,
    dificuldade: normalizarNivelParaDificuldade(nivelMap.get(disciplina.id_disciplina)),
    desempenho: desempenhoPorDisciplina.get(disciplina.id_disciplina) ?? 1,
    qtd_questoes: disciplina.qtd_questoes ? Number(disciplina.qtd_questoes) : 0,
    qtd_topicos: disciplina._count.topico,
  }));

  const horasPorDia = Number(ciclo.plano_estudo.horas_por_dia);
  const ritmo = normalizarRitmo(ciclo.plano_estudo.ritmo);
  const metodoConfig = getMetodoConfig(ciclo.plano_estudo.metodo);
  const distribuicao = gerarDistribuicaoCiclo(disciplinasAlgo, horasPorDia, ritmo, true)
    .map(item => ({ ...item, minutosAlocados: metodoConfig.minutosSessao }));

  await prisma.$transaction(async (tx) => {
    await tx.ciclo_disciplina.deleteMany({
      where: { id_ciclo: ciclo.id_ciclo },
    });

    await tx.ciclo_disciplina.createMany({
      data: distribuicao.map(item => ({
        id_ciclo: ciclo.id_ciclo,
        id_disciplina: item.id,
        ordem: item.ordem,
        horas_planejadas: Number((item.minutosAlocados / 60).toFixed(2)),
      })),
    });

    await tx.ciclo_execucao.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data: { posicao_atual: 1, data_ultima_execucao: new Date() },
    });
  });

  return {
    idCiclo: Number(ciclo.id_ciclo),
    totalSlots: distribuicao.length,
    fatoresDesempenho: Object.fromEntries(desempenhoPorDisciplina),
    distribuicao,
  };
}

async function registrarSessaoSemConclusao(idUsuario: bigint, status: 'PULADA' | 'REMARCADA') {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const totalSlots = ciclo.ciclo_disciplina.length;
  if (totalSlots === 0) throw Object.assign(new Error('Ciclo sem disciplinas.'), { status: 400 });

  const posicaoAtual = ciclo.ciclo_execucao?.posicao_atual ?? 1;
  const novaPosicao = (posicaoAtual % totalSlots) + 1;
  const slotAtual = ciclo.ciclo_disciplina[(posicaoAtual - 1) % totalSlots];
  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const topico = await tx.topico.findFirst({
      where: { id_disciplina: slotAtual.id_disciplina },
      orderBy: [{ ordem: 'asc' }, { id_topico: 'asc' }],
    });

    if (topico) {
      await tx.sessao_estudo.create({
        data: {
          id_usuario: idUsuario,
          id_disciplina: slotAtual.id_disciplina,
          id_topico: topico.id_topico,
          inicio: agora,
          fim: agora,
          duracao_minutos: 0,
          status,
        },
      });
    }

    await tx.ciclo_execucao.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data: { posicao_atual: novaPosicao, data_ultima_execucao: agora },
    });
  });

  return {
    posicaoAtual: novaPosicao,
    totalSlots,
    sessaoRegistrada: Boolean(status),
    status,
  };
}

export async function pularSessaoCicloService(idUsuario: bigint) {
  return registrarSessaoSemConclusao(idUsuario, 'PULADA');
}

export async function remarcarSessaoCicloService(idUsuario: bigint) {
  return registrarSessaoSemConclusao(idUsuario, 'REMARCADA');
}

export async function remarcarSessaoEspecificaCicloService(idUsuario: bigint, ordem: number) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const totalSlots = ciclo.ciclo_disciplina.length;
  if (totalSlots === 0) throw Object.assign(new Error('Ciclo sem disciplinas.'), { status: 400 });

  const ordemSegura = Math.max(1, Math.min(totalSlots, Math.floor(ordem)));
  const slot = ciclo.ciclo_disciplina[ordemSegura - 1];
  const posicaoAtual = ciclo.ciclo_execucao?.posicao_atual ?? 1;
  const agora = new Date();

  await prisma.$transaction(async (tx) => {
    const topico = await tx.topico.findFirst({
      where: { id_disciplina: slot.id_disciplina },
      orderBy: [{ ordem: 'asc' }, { id_topico: 'asc' }],
    });

    if (topico) {
      await tx.sessao_estudo.create({
        data: {
          id_usuario: idUsuario,
          id_disciplina: slot.id_disciplina,
          id_topico: topico.id_topico,
          inicio: agora,
          fim: agora,
          duracao_minutos: 0,
          status: 'REMARCADA',
        },
      });
    }

    if (ordemSegura === posicaoAtual) {
      await tx.ciclo_execucao.update({
        where: { id_ciclo: ciclo.id_ciclo },
        data: { posicao_atual: (posicaoAtual % totalSlots) + 1, data_ultima_execucao: agora },
      });
    }
  });

  return {
    ordem: ordemSegura,
    posicaoAtual: ordemSegura === posicaoAtual ? (posicaoAtual % totalSlots) + 1 : posicaoAtual,
    totalSlots,
    status: 'REMARCADA',
  };
}

export async function avancarCicloService(idUsuario: bigint, qualidade?: string) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) throw Object.assign(new Error('Nenhum ciclo ativo.'), { status: 404 });

  const totalSlots = ciclo.ciclo_disciplina.length;
  if (totalSlots === 0) throw Object.assign(new Error('Ciclo sem disciplinas.'), { status: 400 });

  const posicaoAtual = ciclo.ciclo_execucao?.posicao_atual ?? 1;
  const novaPosicao = (posicaoAtual % totalSlots) + 1;
  const slotAtual = ciclo.ciclo_disciplina[(posicaoAtual - 1) % totalSlots];
  const agora = new Date();
  const minutos = Math.max(1, Math.round(Number(slotAtual.horas_planejadas) * 60));

  await prisma.$transaction(async (tx) => {
    const topicoPendente = await tx.topico.findFirst({
      where: {
        id_disciplina: slotAtual.id_disciplina,
        OR: [
          { topico_progresso: { none: { id_usuario: idUsuario } } },
          { topico_progresso: { some: { id_usuario: idUsuario, concluido: false } } },
        ],
      },
      orderBy: [{ ordem: 'asc' }, { id_topico: 'asc' }],
    });

    const topico = topicoPendente ?? await tx.topico.findFirst({
      where: { id_disciplina: slotAtual.id_disciplina },
      orderBy: [{ ordem: 'asc' }, { id_topico: 'asc' }],
    });

    if (topico) {
      const qualidadeNormalizada = qualidade?.toUpperCase() ?? '';
      const concluiuTopico = !qualidadeNormalizada.includes('PARCIAL') && !qualidadeNormalizada.includes('_P_') && !qualidadeNormalizada.startsWith('NAO_ENTENDI');

      await tx.sessao_estudo.create({
        data: {
          id_usuario: idUsuario,
          id_disciplina: slotAtual.id_disciplina,
          id_topico: topico.id_topico,
          inicio: new Date(agora.getTime() - minutos * 60_000),
          fim: agora,
          duracao_minutos: minutos,
          status: 'CONCLUIDA',
          ...(qualidade ? { qualidade } : {}),
        },
      });

      if (concluiuTopico) {
        await tx.topico_progresso.upsert({
          where: {
            id_usuario_id_topico: {
              id_usuario: idUsuario,
              id_topico: topico.id_topico,
            },
          },
          update: { concluido: true, data_conclusao: agora },
          create: {
            id_usuario: idUsuario,
            id_topico: topico.id_topico,
            concluido: true,
            data_conclusao: agora,
          },
        });
      } else if (topicoPendente) {
        await tx.topico_progresso.upsert({
          where: {
            id_usuario_id_topico: {
              id_usuario: idUsuario,
              id_topico: topico.id_topico,
            },
          },
          update: { concluido: false, data_conclusao: null },
          create: {
            id_usuario: idUsuario,
            id_topico: topico.id_topico,
            concluido: false,
            data_conclusao: null,
          },
        });
      }

      const [totalTopicos, topicosConcluidos] = await Promise.all([
        tx.topico.count({ where: { id_disciplina: slotAtual.id_disciplina } }),
        tx.topico_progresso.count({
          where: {
            id_usuario: idUsuario,
            concluido: true,
            topico: { id_disciplina: slotAtual.id_disciplina },
          },
        }),
      ]);

      const percentual = totalTopicos > 0
        ? Number(((topicosConcluidos / totalTopicos) * 100).toFixed(2))
        : 0;

      await tx.disciplina_progresso.upsert({
        where: {
          id_usuario_id_disciplina: {
            id_usuario: idUsuario,
            id_disciplina: slotAtual.id_disciplina,
          },
        },
        update: {
          total_topicos: totalTopicos,
          topicos_concluidos: topicosConcluidos,
          percentual,
          concluida: totalTopicos > 0 && topicosConcluidos >= totalTopicos,
        },
        create: {
          id_usuario: idUsuario,
          id_disciplina: slotAtual.id_disciplina,
          total_topicos: totalTopicos,
          topicos_concluidos: topicosConcluidos,
          percentual,
          concluida: totalTopicos > 0 && topicosConcluidos >= totalTopicos,
        },
      });
    }

    await tx.ciclo_execucao.update({
      where: { id_ciclo: ciclo.id_ciclo },
      data: { posicao_atual: novaPosicao, data_ultima_execucao: agora },
    });
  });

  return {
    posicaoAtual: novaPosicao,
    totalSlots,
    sessaoRegistrada: true,
    revisoesAgendadas: true,
  };
}

export async function desativarCicloService(idUsuario: bigint) {
  await desativarCiclosUsuario(idUsuario);
}

