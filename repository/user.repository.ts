// Mock compartilhado
import { users, User } from "./usersMock"



/*
========================
BUSCAR POR EMAIL
========================
*/
export async function findUserByEmail(
  email: string
) {

  console.log("USERS:", users)

  return users.find(
    user => user.email === email
  )

}



/*
========================
CRIAR USUÁRIO
========================
*/
export async function createUser(
  user: User
) {

  user.resetToken = null
  user.resetTokenExpire = null

  users.push(user)

  return user

}



/*
========================
SALVAR TOKEN RESET
========================
*/
export async function saveResetToken(
  email: string,
  token: string,
  expire: Date
) {

  const user = users.find(
    u => u.email === email
  )

  if (!user) return null

  user.resetToken = token
  user.resetTokenExpire = expire

  return user

}



/*
========================
BUSCAR POR TOKEN
========================
*/
export async function findByToken(
  token: string
) {

  return users.find(
    u => u.resetToken === token
  )

}



/*
========================
ATUALIZAR SENHA
========================
*/
export async function updatePassword(
  userId: string,
  senhaHash: string
) {

  const user = users.find(
    u => u.id === userId
  )

  if (!user) return null

  user.senha = senhaHash

  user.resetToken = null
  user.resetTokenExpire = null

  return user

}