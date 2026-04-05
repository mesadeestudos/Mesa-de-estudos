/**
 * Define o formato que o frontend vai receber
 */
export interface ConcursoDTO {

  // ID do concurso
  id: number

  // Nome do concurso
  nome: string

  // Nome do órgão
  orgao: string

  // Nome da banca (opcional)
  banca?: string
  
  // Estatus do Edital
  status?: string

  // Nome do Cargo
  cargo?: string
}