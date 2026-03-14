import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Função principal do proxy (middleware customizado)
export async function proxy(request: NextRequest) {

  // Pega o pathname da URL digitada
  const { pathname } = request.nextUrl

  // Pega o token salvo no cookie "authorization"
  const token = request.cookies.get('authorization')?.value

  // Se não tiver token, redireciona para login
  if (!token) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  try {

    // Pega a chave secreta do .env
    const secretKey = process.env.JWT_SECRET

    // Se não existir, lança erro
    if (!secretKey) {
      throw new Error('JWT_SECRET não definido')
    }

    // Converte a chave para formato aceito pelo jose
    const secret = new TextEncoder().encode(secretKey)

    // Verifica se o token é válido
    await jwtVerify(token, secret)

    // Se for válido, deixa continuar
    return NextResponse.next()

  } catch (error) {

    // Se token inválido, redireciona para login
    return NextResponse.redirect(
      new URL('/login', request.url)
    )

  }

}

// Define em quais rotas o proxy será executado
export const config = {
  matcher: [
    '/dashboard/:path*',     // protege dashboard
    '/planejamento/:path*',  // protege planejamento
  ],
}