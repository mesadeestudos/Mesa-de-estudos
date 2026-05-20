import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/assinatura', '/pagamento', '/cadastro', '/login', '/recuperar-senha', '/redefinir'];
const APP_ROUTES = [
  '/dashboard',
  '/minha-mesa',
  '/editais',
  '/ciclos',
  '/desempenho',
  '/revisoes',
  '/questoes',
  '/caderno-erros',
  '/simulados',
  '/assistente',
  '/sugestoes',
  '/agenda',
  '/diagnostico',
  '/perfil',
  '/configuracoes',
  '/onboarding',
];
const SUBSCRIPTION_FREE_ROUTES = ['/onboarding', '/diagnostico', '/perfil', '/configuracoes'];

function startsWithAny(pathname: string, routes: string[]) {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  if (!startsWithAny(pathname, APP_ROUTES)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('authorization')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET obrigatorio em producao.');
    }
    const secretKey = process.env.JWT_SECRET || 'dev-secret-change-me';
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(token, secret);
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('authorization');
    response.cookies.delete('subscription_status');
    return response;
  }

  const assinaturaObrigatoria = process.env.SUBSCRIPTION_REQUIRED === 'true';
  const assinaturaAtiva = request.cookies.get('subscription_status')?.value === 'ACTIVE';
  if (assinaturaObrigatoria && !assinaturaAtiva && !startsWithAny(pathname, SUBSCRIPTION_FREE_ROUTES)) {
    const url = new URL('/assinatura', request.url);
    url.searchParams.set('bloqueio', 'assinatura');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/minha-mesa/:path*',
    '/editais/:path*',
    '/ciclos/:path*',
    '/desempenho/:path*',
    '/revisoes/:path*',
    '/questoes/:path*',
    '/caderno-erros/:path*',
    '/simulados/:path*',
    '/assistente/:path*',
    '/sugestoes/:path*',
    '/agenda/:path*',
    '/diagnostico/:path*',
    '/perfil/:path*',
    '/configuracoes/:path*',
    '/onboarding/:path*',
    '/pagamento',
    '/cadastro',
    '/login',
  ],
};
