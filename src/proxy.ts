import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export const runtime = 'edge'

export async function proxy(request: NextRequest) {

  const token = request.cookies.get('authorization')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {

    const secretKey = process.env.JWT_SECRET

    if (!secretKey) {
      throw new Error('JWT_SECRET não definido')
    }

    const secret = new TextEncoder().encode(secretKey)

    await jwtVerify(token, secret)

    return NextResponse.next()

  } catch (error) {

    return NextResponse.redirect(
      new URL('/login', request.url)
    )

  }

}

export const config = {
  matcher: ['/dashboard/:path*', '/planejamento/:path*'],
}