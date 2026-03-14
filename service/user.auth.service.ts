// biblioteca para gerar tokens JWT
import jwt from "jsonwebtoken"

// Função LoginDTO criado no DTO
import { LoginDTO } from "@/dto/login.dto"

// Função cadastroDTO criado no DTO
import { CadastroDTO } from "@/dto/cadastro.dto"

// biblioteca para criptografar senha
import bcrypt from "bcryptjs"

// função do Node para gerar ids únicos
import { randomUUID } from "crypto"

// funções que criamos no repository
import { findUserByEmail, createUser } from "../repository/user.repository"


// chave secreta usada para assinar o token
// futuramente virá do .env
const SECRET = process.env.JWT_SECRET || "secret"


// função responsável por gerar o token JWT
function createToken(user: any) {

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      primeiro_acesso: user.primeiroAcesso
    },
    SECRET,
    { expiresIn: "1h" }
  )

}

// função responsável por cadastrar um novo usuário
export async function cadastroService(body: CadastroDTO) {

  // verifica se já existe usuário com esse email
  const userExistente = await findUserByEmail(body.email)

  // se existir, lança erro
  if (userExistente) {
    throw new Error("Usuário já cadastrado")
  }

  // criptografa a senha antes de salvar
  const senhaHash = await bcrypt.hash(body.senha, 10)

  // cria um novo usuário
  const novoUsuario = await createUser({

    // gera um id único
    id: randomUUID(),

    // dados vindos do body
    nome: body.nome,
    email: body.email,

    // salva senha criptografada
    senha: senhaHash,

    // define primeiro acesso como verdadeiro
    primeiroAcesso: true

  })

  // retorna usuário criado
  return novoUsuario

}

// função responsável por fazer o login do usuário
export async function loginService(body: LoginDTO) {

  // busca usuário pelo email
  const user = await findUserByEmail(body.email)

  // se usuário não existir, retorna erro
  if (!user) {
    throw new Error("Usuário e Senha Inválidos")
  }

  // compara a senha digitada com a senha criptografada
  const senhaValida = await bcrypt.compare(body.senha, user.senha)

  // se a senha estiver errada, retorna erro
  if (!senhaValida) {
    throw new Error("Usuário e Senha Inválidos")
  }

  // gera o token JWT
  const token = createToken(user)

  // retorna token e informação de primeiro acesso
  return {
    token,
    primeiroAcesso: user.primeiroAcesso
  }

}