// Importa os tipos corretos do Next (IMPORTANTE)
import { NextRequest, NextResponse } from 'next/server'

// Importa o Prisma (acesso ao banco)
import  prisma  from '@/lib/prisma'

/**
 * 📌 ROTA: GET /api/concursos/[id]
 * 
 * 👉 Objetivo:
 * Retornar os detalhes de UM concurso específico
 * incluindo:
 * - edital
 * - cargos
 * - disciplinas
 */
export async function GET(
  request: NextRequest,

  /**
   * ⚠️ NOVO PADRÃO DO NEXT
   * params agora é uma Promise
   */
  context: { params: Promise<{ id: string }> }
) {

  /**
   * 👇 Aqui resolvemos a Promise
   * e extraímos o id da URL
   * Ex: /api/concursos/1 → id = "1"
   */
  const { id } = await context.params

  try {

    /**
     * 🔍 Busca no banco:
     * - concurso pelo id
     * - inclui edital
     * - inclui cargos
     * - inclui disciplinas
     */
    const concurso = await prisma.concurso.findUnique({

      // Filtro pelo ID
      where: {
        id_concurso: Number(id)
      },

      // Relacionamentos
      include: {

        /**
         * concurso → edital
         */
        edital: {

          include: {

            /**
             * edital → cargo
             */
            cargo: {

              include: {

                /**
                 * cargo → disciplina
                 */
                disciplina: true

              }

            }

          }

        }

      }

    })

    /**
     * Retorna o resultado em JSON
     */
    return NextResponse.json(concurso)

  } catch (error) {

    /**
     * Caso dê erro (ex: banco fora, id inválido, etc)
     */
    return NextResponse.json(
      { error: 'Erro ao buscar concurso' },
      { status: 500 }
    )

  }
}