// utilitário do Next para responder requisições
import { NextResponse } from "next/server"

// função de login que criamos no service
import { loginService } from "@/service/user.auth.service"

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Erro ao fazer login"

// função que responde requisições POST
export async function POST(req: Request) {

  try {

    // pega os dados enviados no body da requisição
    const body = await req.json()

    // chama o service responsável pelo login
    const resultado = await loginService(body)

    // retorna resposta de sucesso
    return NextResponse.json(resultado)

  } catch (err: unknown) {

    // se der erro, retorna mensagem
    return NextResponse.json(
      { message: getErrorMessage(err) },
      { status: 400 }
    )

  }

}
