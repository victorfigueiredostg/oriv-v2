import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCvConfig, salvarCvConfig } from '@/lib/cv'
import { z } from 'zod'

async function exigirAdmin() {
  const session = await getServerSession(authOptions)
  return !!session?.user && session.user.role === 'ADMIN'
}

// GET — credenciais atuais do CVCRM (somente ADMIN)
export async function GET() {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
  }
  return NextResponse.json(await getCvConfig())
}

const schema = z.object({
  dominio: z.string().trim(),
  email: z.string().trim(),
  token: z.string().trim(),
})

// PUT — salva as credenciais do CVCRM (somente ADMIN)
export async function PUT(request: NextRequest) {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
  }
  try {
    const cfg = schema.parse(await request.json())
    await salvarCvConfig(cfg)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao salvar config CV:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
