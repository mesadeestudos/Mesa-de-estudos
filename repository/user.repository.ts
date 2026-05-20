import prisma from "@/lib/prisma"
import { CadastroDTO } from "@/dto/cadastro.dto"

/*
========================
BUSCAR POR EMAIL
========================
*/
export async function findUserByEmail(email: string) {

  const user = await prisma.usuario.findUnique({
    where: { email },
    include: {
      credencial: true
    }
  })

  if (!user) return null

  return {
    id: String(user.id_usuario),
    nome: user.nome_completo,
    email: user.email,
    senha: user.credencial?.senha_hash,
    primeiroAcesso: user.primeiro_acesso,
    resetToken: user.credencial?.reset_token,
    resetTokenExpire: user.credencial?.reset_token_expira_em
  }
}

/*
========================
CRIAR USUÁRIO
========================
*/
export async function createUser(user: CadastroDTO) {

  const result = await prisma.$transaction(async (tx) => {

    // 1. cria usuário na tabela usuario
    const novoUsuario = await tx.usuario.create({
      data: {
        nome_completo: user.nome,
        email: user.email,
        ativo: true,
        primeiro_acesso: true
      }
    })

    // 2. cria credencial (senha)
    await tx.credencial.create({
      data: {
        id_usuario: novoUsuario.id_usuario,
        senha_hash: user.senha,
        reset_token: null,
        reset_token_expira_em: null
      }
    })

    return novoUsuario
  })

  // 🔁 mantém compatibilidade com seu sistema atual
  return {
    id: String(result.id_usuario),
    nome: result.nome_completo,
    email: result.email,
    senha: user.senha,
    primeiroAcesso: result.primeiro_acesso,
    resetToken: null,
    resetTokenExpire: null
  }
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

  // 1. busca usuário no banco
  const user = await prisma.usuario.findUnique({
    where: { email }
  })

  if (!user) return null

  // 2. salva token na tabela credencial
  await prisma.credencial.update({
    where: {
      id_usuario: user.id_usuario
    },
    data: {
      reset_token: token,
      reset_token_expira_em: expire
    }
  })

  return true
}

/*
========================
BUSCAR POR TOKEN
========================
*/
export async function findByToken(token: string) {

  const tokenLimpo = token.trim()

  const credencial = await prisma.credencial.findFirst({
    where: {
      reset_token: tokenLimpo
    },
    include: {
      usuario: true
    }
  })

  if (!credencial) return null

  // 🔒 verifica expiração
  if (
    credencial.reset_token_expira_em &&
    credencial.reset_token_expira_em < new Date()
  ) {
    return null
  }

  return {
    id: String(credencial.usuario.id_usuario),
    nome: credencial.usuario.nome_completo,
    email: credencial.usuario.email,
    senha: credencial.senha_hash,
    primeiroAcesso: credencial.usuario.primeiro_acesso
  }
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

  await prisma.credencial.update({
    where: {
      id_usuario: Number(userId)
    },
    data: {
      senha_hash: senhaHash,
      reset_token: null,
      reset_token_expira_em: null
    }
  })

  return true
}

/*
========================
CRIAR SESSÃO
========================
*/
export async function createSession(data: {
  id_usuario: number
  refresh_token: string
  expira_em: Date
}) {

  return await prisma.sessao.create({
    data: {
      id_usuario: data.id_usuario,
      refresh_token: data.refresh_token,
      expira_em: data.expira_em,
      revogado: false
    }
  })
}
