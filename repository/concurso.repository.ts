// Importa a instância do Prisma (conexão com banco)
import prisma from '@/lib/prisma'

/**
 * Busca todos os concursos com seus relacionamentos
 *
 * 👉 Aqui NÃO tem regra de negócio
 * 👉 Apenas acesso ao banco
 */
export async function findAllConcursos() {

  const concursos = await prisma.concurso.findMany({

    include: {
      orgao: true,

      edital: {
        include: {

          banca: true,

          /**
           * 🎯 AGORA TRAZ OS CARGOS
           */
          cargo: true

        }
      }
    }

  })

  return concursos
}