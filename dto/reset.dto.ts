// =============================
// DTO para solicitar reset
// =============================
// define o formato dos dados
// enviados para pedir recuperação de senha

export type RequestResetDTO = {

  // email do usuário
  email: string

}



// =============================
// DTO para redefinir senha
// =============================
// usado quando o usuário já tem o token

export type ResetPasswordDTO = {

  // token enviado no link de recuperação
  token: string

  // nova senha
  senha: string

}