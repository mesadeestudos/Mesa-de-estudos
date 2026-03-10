// utilitário de resposta do Next
import { NextResponse } from 'next/server'

// tipo da requisição
import type { NextRequest } from 'next/server'

// biblioteca para validar JWT no Edge
import { jwtVerify } from 'jose'


export async function middleware(request: NextRequest) {

  // pega o token do cookie
  const token = request.cookies.get('authorization')?.value

  // se não existir token → redireciona para login
  if (!token) {

    return NextResponse.redirect(new URL('/login', request.url))

  }

  try {

    // chave secreta usada para validar o JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // valida o token
    await jwtVerify(token, secret)

    // se o token for válido → permite acesso
    return NextResponse.next()

  } catch (error) {

    // se o token for inválido → redireciona para login
    return NextResponse.redirect(new URL('/login', request.url))

  }

}

//Definir quais rotas serão protegidas
export const config = {

  matcher: [
    '/dashboard',
    '/planejamento'
  ]

}