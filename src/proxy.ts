import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Função principal do proxy (middleware customizado)
export async function proxy(request: NextRequest) {

  const { pathname } = request.nextUrl

  // 🧠 STEP do fluxo (cookie simples)
  const step = request.cookies.get('step')?.value || 'ASSINATURA'

  const stepOrder = ['ASSINATURA', 'PAGAMENTO', 'CADASTRO']

  const flowRules: Record<string, string> = {
    '/pagamento': 'PAGAMENTO',
    '/cadastro': 'CADASTRO'
  }

  // ✅ assinatura sempre liberada
  if (pathname === '/assinatura') {
    return NextResponse.next()
  }

  // 🚧 BLOQUEIO DE FLUXO (ANTES do JWT)
  const requiredStep = flowRules[pathname]

  if (requiredStep) {
    if (stepOrder.indexOf(step) < stepOrder.indexOf(requiredStep)) {
      return NextResponse.redirect(new URL('/assinatura', request.url))
    }
  }

  // 🔓 ROTAS PÚBLICAS (SEM LOGIN)
  const publicRoutes = ['/assinatura', '/pagamento', '/cadastro']

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // 🔐 A PARTIR DAQUI exige login

  const token = request.cookies.get('authorization')?.value

  if (!token) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  try {

    const secretKey = process.env.JWT_SECRET || 'secret'

    const secret = new TextEncoder().encode(secretKey)

    await jwtVerify(token, secret)

    return NextResponse.next()

  } catch {

    return NextResponse.redirect(
      new URL('/login', request.url)
    )

  }

}

// Define em quais rotas o proxy será executado
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/minha-mesa/:path*',
    '/editais/:path*',
    '/ciclos/:path*',
    '/desempenho/:path*',
    '/revisoes/:path*',
    '/perfil/:path*',
    '/configuracoes/:path*',

    // fluxo
    '/pagamento',
    '/cadastro'
  ],
}
