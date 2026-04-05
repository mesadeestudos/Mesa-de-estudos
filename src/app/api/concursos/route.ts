import { NextResponse } from 'next/server'

// Importa service
import { getConcursos } from '@/service/concurso.service'

/**
 * Endpoint GET /api/concursos
 */
export async function GET() {

  try {

    // Chama regra de negócio
    const concursos = await getConcursos()

    // Retorna JSON
    return NextResponse.json(concursos)

  } catch (error) {

    // Tratamento de erro
    return NextResponse.json(
      { error: 'Erro ao buscar concursos' },
      { status: 500 }
    )
  }
}