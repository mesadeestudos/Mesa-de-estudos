// importa biblioteca de validação
import { z } from "zod"


// =============================
// Schema para solicitar reset
// =============================
// usado quando o usuário informa o email
export const requestResetSchema = z.object({

  // email obrigatório e válido
  email: z
    .string()
    .email("Email inválido")

})



// =============================
// Schema para redefinir senha
// =============================
// usado quando o usuário recebe o token
// e envia a nova senha
export const resetPasswordSchema = z.object({

  // token vindo no link de recuperação
  token: z
    .string()
    .min(1, "Token obrigatório"),


  senha: z

    // deve ser string
    .string()

    // mínimo 8 caracteres
    .min(8, "Senha deve ter pelo menos 8 caracteres")

    // pelo menos 1 letra maiúscula
    .regex(/[A-Z]/, "Senha deve ter uma letra maiúscula")

    // pelo menos 1 letra minúscula
    .regex(/[a-z]/, "Senha deve ter uma letra minúscula")

    // pelo menos 1 número
    .regex(/[0-9]/, "Senha deve ter um número")

    // pelo menos 1 caractere especial
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Senha deve ter um caractere especial"
    )

})