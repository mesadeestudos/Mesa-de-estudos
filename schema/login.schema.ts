// biblioteca de validação
import { z } from "zod"

// define o formato esperado para login
export const loginSchema = z.object({

  // email obrigatório e deve ser válido
  email: z.string().email("Email inválido"),

  // senha deve ter no mínimo 8 caracteres
  senha: z.string().min(8, "Senha deve ter no mínimo 6 caracteres")

})