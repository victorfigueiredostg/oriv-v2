import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Next 16: substitui o antigo middleware.ts (edge) por proxy.ts (Node runtime).
// Usa getToken em vez de next-auth/middleware (withAuth), incompativel com o
// runtime nodejs do proxy / hospedagem self-hosted.
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const path = req.nextUrl.pathname

  // Configurações e cadastro de empreendimentos: exclusivo de ADMIN
  if (
    path.startsWith('/admin/configuracoes') ||
    path.startsWith('/admin/empreendimentos')
  ) {
    if (token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  } else if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    // Demais telas do painel: ADMIN (visão global) ou GESTOR (1 empreendimento)
    if (token?.role !== 'ADMIN' && token?.role !== 'GESTOR') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Registro de visita: exclusivo de STAND
  if (path === '/visita' || path.startsWith('/visita/')) {
    if (token?.role !== 'STAND') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Lista de visitas e dashboard: STAND (do seu empreendimento) ou ADMIN (visão global)
  if (path.startsWith('/visitas') || path.startsWith('/dashboard')) {
    if (!token) {
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
