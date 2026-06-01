import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'ORIV 2.0 está rodando!'
  })
}

export const dynamic = 'force-dynamic'
