// biblioteca para gerar token
import crypto from "crypto"

// bcrypt para hash da senha
import bcrypt from "bcryptjs"

// schemas
import {
  requestResetSchema,
  resetPasswordSchema
} from "@/schema/reset.schema"

// dto
import {
  RequestResetDTO,
  ResetPasswordDTO
} from "@/dto/reset.dto"

// repository
import {
  findUserByEmail,
  saveResetToken,
  findByToken,
  updatePassword
} from "@/repository/user.repository"



/*
====================================
SOLICITAR RESET DE SENHA
====================================
*/
export async function requestResetService(
  data: RequestResetDTO
) {

  const parsed =
    requestResetSchema.parse(data)

  const user =
    await findUserByEmail(parsed.email)

  if (!user) {
    throw new Error("Usuário não encontrado")
  }


  const token =
    crypto.randomBytes(32).toString("hex")

  const expire =
    new Date(Date.now() + 1000 * 60 * 15)


  await saveResetToken(
    parsed.email,
    token,
    expire
  )


  const link =
    `http://localhost:3000/redefinir?token=${token}`

  console.log("LINK RESET:", link)

  return link
}



/*
====================================
REDEFINIR SENHA
====================================
*/
export async function resetPasswordService(
  data: ResetPasswordDTO
) {

  const parsed =
    resetPasswordSchema.parse(data)


  const user =
    await findByToken(parsed.token)

  if (!user) {
    throw new Error("Token inválido")
  }


  if (!user.resetTokenExpire) {
    throw new Error("Token inválido")
  }

  if (user.resetTokenExpire < new Date()) {
    throw new Error("Token expirado")
  }


  // ✅ HASH DA SENHA
  const senhaHash = await bcrypt.hash(
    parsed.senha,
    10
  )


  await updatePassword(
    user.id,
    senhaHash
  )


  return true

}