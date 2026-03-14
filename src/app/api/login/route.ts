// utilitário do Next para responder requisições
import { NextResponse } from "next/server"

// função de login que criamos no service
import { loginService } from "@/service/user.auth.service"

// função de loginSchema que criamos no schema
import { loginSchema } from "@/schema/login.schema"

// função que responde requisições POST
export async function POST(req: Request) {

  try {

    // pega os dados enviados no body da requisição
    const body = await req.json()

    // chama o service responsável pelo login
    const resultado = await loginService(body)

    // retorna resposta de sucesso
    return NextResponse.json(resultado)

  } catch (err: any) {

    // se der erro, retorna mensagem
    return NextResponse.json(
      { message: err.message },
      { status: 400 }
    )

  }

}