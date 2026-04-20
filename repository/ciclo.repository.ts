import prisma from '@/lib/prisma';
import { DisciplinaCicloDTO } from '@/dto/ciclo.dto';

interface SalvarCicloInput {
  idUsuario:    bigint;
  idCargo:      number;
  horasDiarias: number;
  modo:         string;
  disciplinas:  Array<{ id: number; dificuldade: string }>;
  distribuicao: DisciplinaCicloDTO[];
}

export async function salvarCiclo(input: SalvarCicloInput) {

  // Passos 1–4 em transação (integridade do ciclo)
  const { idCiclo, idPlano } = await prisma.$transaction(async (tx) => {

    // 1. Plano de estudo
    const plano = await tx.plano_estudo.create({
      data: {
        id_usuario:    input.idUsuario,
        id_cargo:      input.idCargo,
        metodo:        input.modo.toUpperCase(),
        horas_por_dia: input.horasDiarias,
      },
    });

    // 2. Ciclo de estudo
    const ciclo = await tx.ciclo_estudo.create({
      data: { id_plano: plano.id_plano, ativo: true },
    });

    // 3. Posição de execução inicial
    await tx.ciclo_execucao.create({
      data: {
        id_ciclo:             ciclo.id_ciclo,
        posicao_atual:        1,
        data_ultima_execucao: new Date(),
      },
    });

    // 4. Slots do ciclo em lote (uma única query)
    await tx.ciclo_disciplina.createMany({
      data: input.distribuicao.map(d => ({
        id_ciclo:         ciclo.id_ciclo,
        id_disciplina:    d.id,
        ordem:            d.ordem,
        horas_planejadas: Number((d.minutosAlocados / 60).toFixed(2)),
      })),
    });

    return { idCiclo: ciclo.id_ciclo, idPlano: plano.id_plano };
  });

  // 5. Níveis de dificuldade fora da transação — são preferências do usuário,
  //    não afetam a integridade do ciclo e podem ser refeitos sem problema.
  if (input.disciplinas.length > 0) {
    const nivelMap: Record<string, string> = { Alto: 'ALTO', Médio: 'MEDIO', Baixo: 'BAIXO' };
    await Promise.all(
      input.disciplinas.map(d => {
        const nivel = nivelMap[d.dificuldade] ?? d.dificuldade.toUpperCase();
        return prisma.disciplina_nivel_usuario.upsert({
          where: {
            id_usuario_id_disciplina: {
              id_usuario:    input.idUsuario,
              id_disciplina: d.id,
            },
          },
          update: { nivel, data_atualizacao: new Date() },
          create: { id_usuario: input.idUsuario, id_disciplina: d.id, nivel },
        });
      }),
    );
  }

  return { idCiclo, idPlano };
}

export async function buscarCicloAtivo(idUsuario: bigint) {
  return await prisma.ciclo_estudo.findFirst({
    where: {
      ativo:        true,
      plano_estudo: { id_usuario: idUsuario },
    },
    orderBy: { id_ciclo: 'desc' },
    include: {
      plano_estudo: {
        include: {
          cargo: {
            include: {
              edital: {
                include: { concurso: true, banca: true },
              },
            },
          },
        },
      },
      ciclo_disciplina: {
        orderBy: { ordem: 'asc' },
        include:  { disciplina: true },
      },
      ciclo_execucao: true,
    },
  });
}

export async function desativarCiclosUsuario(idUsuario: bigint) {
  const planos = await prisma.plano_estudo.findMany({
    where:  { id_usuario: idUsuario },
    select: { id_plano: true },
  });
  if (planos.length === 0) return;

  await prisma.ciclo_estudo.updateMany({
    where: {
      id_plano: { in: planos.map(p => p.id_plano) },
      ativo:    true,
    },
    data: { ativo: false },
  });
}
