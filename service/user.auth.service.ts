// ========================
// IMPORTS
// ========================

// JWT (autenticação)
import jwt from "jsonwebtoken"

// criptografia de senha
import bcrypt from "bcryptjs"

// importar o função do email.service
import { sendEmail } from "@/service/email.service"

// geração de token seguro (reset)
import crypto from "crypto"

// geração de id (compatibilidade)
import { randomUUID } from "crypto"

// DTOs
import { LoginDTO } from "@/dto/login.dto"
import { CadastroDTO } from "@/dto/cadastro.dto"
import { RequestResetDTO, ResetPasswordDTO } from "@/dto/reset.dto"

// schemas (validação)
import {
  requestResetSchema,
  resetPasswordSchema
} from "@/schema/reset.schema"

// repository (acesso ao banco)
import {
  findUserByEmail,
  createUser,
  createSession,
  saveResetToken,
  findByToken,
  updatePassword
} from "@/repository/user.repository"


// ========================
// CONFIG
// ========================

// chave secreta do JWT
const SECRET =
  process.env.JWT_SECRET || "secret"


// ========================
// GERAR TOKEN JWT
// ========================
function createToken(user: any) {

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      primeiro_acesso: user.primeiroAcesso
    },
    SECRET,
    {
      expiresIn: "1h"
    }
  )
}


// ========================
// CADASTRO
// ========================
export async function cadastroService(
  body: CadastroDTO) {

  // 1. verifica se usuário já existe
  const userExistente =
    await findUserByEmail(body.email)

  if (userExistente) {
    throw new Error("Usuário já cadastrado")
  }

  // 2. criptografa senha
  const senhaHash =
    await bcrypt.hash(body.senha, 10)

  // 3. cria usuário (usuario + credencial)
  const novoUsuario =
  await createUser({
    nome: body.nome,
    email: body.email,
    senha: senhaHash
  })

  return novoUsuario
}


// ========================
// LOGIN
// ========================
export async function loginService(
  body: LoginDTO) {

  // 1. busca usuário
  const user =
    await findUserByEmail(body.email)

  if (!user) {
    throw new Error("E-mail ou senha incorretos. Verifique seus dados e tente novamente.")
  }

  const userSafe = user

  // 2. valida senha
  if (!userSafe.senha) {
    throw new Error("Erro interno: senha não encontrada")
  }

  const senhaValida =
    await bcrypt.compare(body.senha, userSafe.senha)

  if (!senhaValida) {
    throw new Error("E-mail ou senha incorretos. Verifique seus dados e tente novamente.")
  }

  // 3. gera token JWT
  const token = createToken(userSafe)

  // 4. cria sessão no banco
  await createSession({
    id_usuario: Number(userSafe.id),
    refresh_token: token,
    expira_em: new Date(Date.now() + 60 * 60 * 1000)
  })

  // 5. retorna para o frontend
  return {
    token,
    primeiroAcesso: userSafe.primeiroAcesso
  }
}


// ========================
// SOLICITAR RESET DE SENHA
// ========================
export async function requestResetService(
  data: RequestResetDTO) {

  // 1. valida dados
  const parsed =
    requestResetSchema.parse(data)

  // 2. busca usuário
  const user =
    await findUserByEmail(parsed.email)

  if (!user) {
    throw new Error("Usuário não encontrado")
  }

  // 3. gera token seguro
  const token =
    crypto.randomBytes(32).toString("hex")

  // 4. define expiração (15 min)
  const expire =
    new Date(Date.now() + 1000 * 60 * 15)

  // 5. salva no banco
  await saveResetToken(
    parsed.email,
    token,
    expire
  )

  // 6. gera link e-mail
  const link =
  `http://localhost:3000/redefinir?token=${token}`

  // ✉️ enviar email
  await sendEmail(
    parsed.email,
    "Recuperação de senha",
    `
    <h2>Recuperação de senha</h2>
    <p>Olá!</p>
    <p>Clique no link abaixo para redefinir sua senha da plataforma Mesa de Estudo:</p>
    <a href="${link}">${link}</a>
    <p>Esse link expira em 15 minutos.</p>  
    `
  )
}


// ========================
// REDEFINIR SENHA
// ========================
export async function resetPasswordService(
  data: ResetPasswordDTO) {

  // 1. valida dados
  const parsed =
    resetPasswordSchema.parse(data)

  // 2. valida token (já valida expiração no repository)
  const user =
    await findByToken(parsed.token)

  if (!user) {
    throw new Error("Token inválido ou expirado")
  }

  // 3. gera hash da nova senha
  const senhaHash =
    await bcrypt.hash(parsed.senha, 10)

  // 4. atualiza senha + limpa token
  await updatePassword(
    user.id,
    senhaHash
  )

  return true
}