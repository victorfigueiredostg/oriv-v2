import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Next 16: substitui o antigo middleware.ts (edge) por proxy.ts (Node runtime).
// Usa getToken em vez de next-auth/middleware (withAuth), incompativel com o
// runtime nodejs do proxy / hospedagem self-hosted.

// Página "fora do ar" (503). Autossuficiente (CSS inline) para funcionar mesmo
// com todo o resto bloqueado.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ORIV — Em manutenção</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;padding:24px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 1px 3px rgba(16,24,40,.08);
    max-width:460px;width:100%;padding:40px 32px;text-align:center}
  .logo{font-size:34px;font-weight:800;letter-spacing:-.02em;color:#1e2a4a}
  .logo span{color:#17c3b2}
  h1{font-size:20px;margin:18px 0 8px}
  p{color:#6b7280;font-size:15px;line-height:1.5;margin:0}
</style></head>
<body><div class="card">
  <div class="logo">ORIV<span>.</span></div>
  <h1>Site em manutenção</h1>
  <p>Estamos temporariamente fora do ar. Volte em instantes.</p>
</div></body></html>`

export async function proxy(req: NextRequest) {
  // Kill-switch: tira o site do ar (reversível pela variável de ambiente
  // SITE_OFFLINE=1 + Reiniciar no painel da Hostinger).
  if (process.env.SITE_OFFLINE === '1') {
    return new NextResponse(OFFLINE_HTML, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'retry-after': '3600',
        'cache-control': 'no-store',
      },
    })
  }

  const path = req.nextUrl.pathname

  // Só computa o token nas áreas protegidas (rotas públicas passam direto, sem
  // custo extra — o matcher amplo existe só para o kill-switch acima).
  const protegida =
    path.startsWith('/admin') ||
    path === '/visita' ||
    path.startsWith('/visita/') ||
    path.startsWith('/visitas') ||
    path.startsWith('/dashboard')
  if (!protegida) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

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
  // Amplo (menos assets estáticos) para o kill-switch cobrir todo o site.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
}
