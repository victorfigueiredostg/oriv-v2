import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Permitir acesso às páginas de login sem autenticação
        if (path.startsWith('/login') || path.startsWith('/admin/login')) {
          return true
        }

        // Permitir acesso à landing page sem autenticação
        if (path === '/') {
          return true
        }

        // Rotas protegidas requerem token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/visita/:path*',
    '/visitas/:path*',
    '/dashboard/:path*',
  ],
}
