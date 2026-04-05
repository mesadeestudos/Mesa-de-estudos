export function toConcursoDTO(concurso: any) {

  const edital = concurso.edital?.[0]
  const cargo = edital?.cargo?.[0]

  return {
    id: concurso.id_concurso,

    /**
     * 🔹 SIGLA (vai pro título)
     */
    nome: concurso.orgao?.sigla || concurso.nome,

    /**
     * 🔹 NOME COMPLETO (subtítulo)
     */
    descricao: concurso.nome,

    orgao: concurso.orgao?.nome,

     /**
     * 🎯 CARGO REAL
     */
    cargo: cargo?.nome || 'Não informado',

    banca:
      edital?.banca?.sigla ||
      edital?.banca?.nome,

    status: edital?.status || 'Previsto',

    data: edital?.data_prova || null
  }
}