// utilitário do Next para responder requisições
import { NextResponse } from "next/server"

// função de cadastro que criamos no service
import { cadastroService } from "@/service/user.auth.service"

// função de cadastroSchema que criamos no schema
import { cadastroSchema } from "@/schema/cadastro.schema"

// função que responde requisições POST
export async function POST(req: Request) {

  try {

    // pega os dados enviados no body
    const body = await req.json()

    // chama o service responsável pelo cadastro
    const newUser = await cadastroService(body)

    // retorna usuário criado
    return NextResponse.json(newUser, { status: 201 })

  } catch (err: any) {

    // se ocorrer erro, retorna mensagem
    return NextResponse.json(
      { message: err.message },
      { status: 400 }
    )

  }

}