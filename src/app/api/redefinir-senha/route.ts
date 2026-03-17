// resposta padrão do Next
import { NextResponse } from "next/server"

// service com regra de negócio
import {
  resetPasswordService
} from "@/service/reset.service"



/*
====================================
ROTA PARA REDEFINIR SENHA
====================================
*/
export async function POST(
  req: Request
) {

  try {

    // pega dados enviados
    const body =
      await req.json()


    // chama o service
    await resetPasswordService(
      body
    )


    // resposta de sucesso
    return NextResponse.json({

      message: "Senha alterada com sucesso"

    })


  } catch (error: any) {

    // erro de validação ou token inválido
    return NextResponse.json(

      { error: error.message },

      { status: 400 }

    )

  }

}