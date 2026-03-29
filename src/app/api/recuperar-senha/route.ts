// resposta padrão do Next
import { NextResponse } from "next/server"

// service com regra de negócio
import {
  requestResetService
} from "@/service/user.auth.service"



/*
====================================
ROTA PARA SOLICITAR RECUPERAÇÃO
====================================
*/
export async function POST(
  req: Request
) {

  try {

    // pega dados enviados no body
    const body =
      await req.json()


    // chama o service
    const link =
      await requestResetService(body)


    // retorna resposta de sucesso
    return NextResponse.json({

      message: "Link gerado com sucesso",

      // apenas para teste (em produção envia email)
      link

    })


  } catch (error: any) {

    // erro de validação ou regra
    return NextResponse.json(

      { error: error.message },

      { status: 400 }

    )

  }

}