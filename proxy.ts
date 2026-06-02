import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Next 16: substitui o antigo middleware.ts (edge) por proxy.ts (Node runtime).
// Usa getToken em vez de next-auth/middleware (withAuth), incompativel com o
// runtime nodejs do proxy / hospedagem self-hosted.
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const path = req.nextUrl.pathname

  // Rotas que requerem ADMIN
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Rotas que requerem STAND
  if (
    path.startsWith('/visita') ||
    path.startsWith('/visitas') ||
    path.startsWith('/dashboard')
  ) {
    if (token?.role !== 'STAND') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/visita/:path*',
    '/visitas/:path*',
    '/dashboard/:path*',
  ],
}
