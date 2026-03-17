// biblioteca para gerar tokens JWT
import jwt from "jsonwebtoken"

// DTOs
import { LoginDTO } from "@/dto/login.dto"
import { CadastroDTO } from "@/dto/cadastro.dto"

// criptografia
import bcrypt from "bcryptjs"

// gerar id
import { randomUUID } from "crypto"

// repository (único)
import {
  findUserByEmail,
  createUser
} from "@/repository/user.repository"


// chave secreta
const SECRET =
  process.env.JWT_SECRET || "secret"



/*
========================
GERAR TOKEN
========================
*/
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



/*
========================
CADASTRO
========================
*/
export async function cadastroService(
  body: CadastroDTO
) {

  // verifica se já existe
  const userExistente =
    await findUserByEmail(body.email)

  if (userExistente) {
    throw new Error(
      "Usuário já cadastrado"
    )
  }


  // hash senha
  const senhaHash =
    await bcrypt.hash(
      body.senha,
      10
    )


  // cria usuário
  const novoUsuario =
    await createUser({

      id: randomUUID(),

      nome: body.nome,

      email: body.email,

      senha: senhaHash,

      primeiroAcesso: true,

      // importante para reset
      resetToken: null,
      resetTokenExpire: null

    })


  return novoUsuario

}



/*
========================
LOGIN
========================
*/
export async function loginService(
  body: LoginDTO
) {

  // busca usuário
  const user =
    await findUserByEmail(
      body.email
    )


  if (!user) {
    throw new Error(
      "Usuário e Senha Inválidos"
    )
  }


  // compara senha hash
  const senhaValida =
    await bcrypt.compare(
      body.senha,
      user.senha
    )


  if (!senhaValida) {
    throw new Error(
      "Usuário e Senha Inválidos"
    )
  }


  // gera token
  const token =
    createToken(user)


  return {

    token,

    primeiroAcesso:
      user.primeiroAcesso

  }

}