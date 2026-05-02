import prisma from '@/lib/prisma';
import {
  calcularDiscsPorDia as calcularDiscsPorDiaAlgoritmo,
  calcularFrequenciasHibridas,
  calcularScore as calcularScoreAlgoritmo,
  gerarDistribuicaoCiclo,
  type RitmoCiclo,
} from '@/lib/cicloAlgorithm';
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
  qtd_questoes: number;
  qtd_topicos: number;
}

const normalizarRitmo = (ritmo?: string | null): RitmoCiclo => {
  const valor = (ritmo ?? '').toLowerCase();
  if (valor === 'focado' || valor === 'variado') return valor;
  return 'equilibrado';
};

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

  const idsDisciplinas = input.disciplinas.map(d => d.id);
  const disciplinasBanco = await prisma.disciplina.findMany({
    where: { id_disciplina: { in: idsDisciplinas } },
    include: { _count: { select: { topico: true } } },
  });

  const dificuldadePorDisciplina = new Map(input.disciplinas.map(d => [d.id, d.dificuldade]));

  const disciplinasAlgo: DisciplinaAlgo[] = disciplinasBanco.map(disciplina => ({
    id: disciplina.id_disciplina,
    nome: disciplina.nome,
    peso: Number(disciplina.peso ?? 1),
    tipo: disciplina.tipo,
    categoria_cognitiva: disciplina.categoria_cognitiva,
    dificuldade: dificuldadePorDisciplina.get(disciplina.id_disciplina) ?? 'Médio',
    qtd_questoes: disciplina.qtd_questoes ? Number(disciplina.qtd_questoes) : 0,
    qtd_topicos: disciplina._count.topico,
  }));

  const ritmo = normalizarRitmo(input.ritmo);
  const disciplinasPorDia = calcularDiscsPorDiaAlgoritmo(input.horasDiarias, ritmo);
  const distribuicao = gerarDistribuicaoCiclo(
    disciplinasAlgo,
    input.horasDiarias,
    ritmo,
    input.modo === 'personalizado',
  );

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
    ritmo: input.ritmo,
    disciplinas: disciplinasParaPersistir,
    distribuicao,
  });

  return {
    idCiclo: Number(ciclo.idCiclo),
    idPlano: Number(ciclo.idPlano),
    totalSlots: distribuicao.length,
    disciplinasPorDia,
    distribuicao,
  };
}

export async function buscarCicloService(idUsuario: bigint) {
  const ciclo = await buscarCicloAtivo(idUsuario);
  if (!ciclo) return null;

  const horasPorDia = Number(ciclo.plano_estudo.horas_por_dia);
  const ritmo = normalizarRitmo(ciclo.plano_estudo.ritmo);
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
  const niveis = await prisma.disciplina_nivel_usuario.findMany({
    where: { id_usuario: idUsuario, id_disciplina: { in: idsUnicos } },
  });
  const nivelMap = new Map(niveis.map(nivel => [nivel.id_disciplina, nivel.nivel]));

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
  }));

  const cicloSlots = slots.map((slot, indice) => ({
    ordem: indice + 1,
    idDisciplina: slot.id_disciplina,
    nome: slot.disciplina.nome,
    tipo: slot.disciplina.tipo,
    categoria: slot.disciplina.categoria_cognitiva,
    nivel: nivelMap.get(slot.id_disciplina) ?? null,
    minutosAlocados: Math.round(Number(slot.horas_planejadas) * 60),
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

  const cargo = ciclo.plano_estudo.cargo;
  const edital = cargo.edital;

  return {
    idCiclo: Number(ciclo.id_ciclo),
    idPlano: Number(ciclo.id_plano),
    metodo: ciclo.plano_estudo.metodo,
    horasPorDia,
    cargoNome: cargo.nome,
    concursoNome: edital?.concurso?.nome ?? '',
    bancaSigla: edital?.banca?.sigla ?? edital?.banca?.nome ?? '',
    dataCriacao: ciclo.plano_estudo.data_criacao?.toISOString() ?? '',
    totalSlots,
    discsPorDia,
    diasPorCiclo: Math.ceil(totalSlots / horasPorDia),
    posicaoAtual,
    hojeSlots,
    cicloSlots,
    disciplinas,
  };
}

export async function avancarCicloService(idUsuario: bigint) {
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
      await tx.sessao_estudo.create({
        data: {
          id_usuario: idUsuario,
          id_disciplina: slotAtual.id_disciplina,
          id_topico: topico.id_topico,
          inicio: new Date(agora.getTime() - minutos * 60_000),
          fim: agora,
          duracao_minutos: minutos,
          status: 'CONCLUIDA',
        },
      });

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
          topicos_concluidos: topicosConcluidos,
          percentual,
          concluida: totalTopicos > 0 && topicosConcluidos >= totalTopicos,
        },
        create: {
          id_usuario: idUsuario,
          id_disciplina: slotAtual.id_disciplina,
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
