// Importa a biblioteca Zod, usada para validar dados no backend
import { z } from "zod";


// Cria um schema chamado cadastroSchema
// Esse schema define quais dados são obrigatórios para criar um usuário
export const cadastroSchema = z.object({

  // ==========================
  // VALIDAÇÃO DO NOME
  // ==========================

  nome: z
    // O nome deve ser uma string
    .string()

    // Deve ter no mínimo 3 caracteres
    .min(3, "Nome deve ter pelo menos 3 caracteres"),


  // ==========================
  // VALIDAÇÃO DO EMAIL
  // ==========================

  email: z
  // O email deve ser uma string
  .string()
  // Valida se o formato do email é válido
  .email("Email inválido")
  .transform((email) => email.toLowerCase()),


  // ==========================
  // VALIDAÇÃO DA SENHA
  // ==========================

  senha: z
    // A senha deve ser uma string
    .string()

    // Deve ter no mínimo 8 caracteres
    .min(8, "Senha deve ter pelo menos 8 caracteres")

    // Deve conter pelo menos uma letra maiúscula
    .regex(/[A-Z]/, "Senha deve ter uma letra maiúscula")

    // Deve conter pelo menos uma letra minúscula
    .regex(/[a-z]/, "Senha deve ter uma letra minúscula")

    // Deve conter pelo menos um número
    .regex(/[0-9]/, "Senha deve ter um número")

    // Deve conter pelo menos um caractere especial
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Senha deve ter um caractere especial")

});