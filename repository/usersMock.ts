export type User = {
  id: string
  nome: string
  email: string
  senha: string
  primeiroAcesso: boolean
  resetToken?: string | null
  resetTokenExpire?: Date | null
}

export const users: User[] = []