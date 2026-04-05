// Importa repository (acesso ao banco)
import { findAllConcursos } from '@/repository/concurso.repository'

// Importa mapper (transformação)
import { toConcursoDTO } from './mapper/concurso.mapper'

/**
 * Service de concursos
 *
 * 👉 Aqui entra regra de negócio
 */
export async function getConcursos() {

  // Busca no banco
  const concursos = await findAllConcursos()

  /**
   * Transforma os dados para o formato do DTO
   */
  const concursosFormatados = concursos.map(toConcursoDTO)

  return concursosFormatados
}