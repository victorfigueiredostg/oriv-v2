import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — confirma/desfaz o cadastro manual do lead no CV (grava data/hora).
// Body: { confirmar: boolean }. STAND só altera visitas do próprio
// empreendimento; ADMIN altera qualquer uma.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const visitaId = parseInt(id)
    const body = await request.json().catch(() => ({}))
    const confirmar = body?.confirmar !== false // default true

    const visita = await prisma.visita.findUnique({ where: { id: visitaId } })
    if (!visita) {
      return NextResponse.json(
        { message: 'Visita não encontrada' },
        { status: 404 }
      )
    }

    if (
      session.user.role === 'STAND' &&
      visita.empreendimentoId !== session.user.empreendimentoId
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const cvConfirmadoEm = confirmar ? new Date() : null
    await prisma.visita.update({
      where: { id: visitaId },
      data: { cvConfirmadoEm },
    })

    return NextResponse.json({ ok: true, cvConfirmadoEm })
  } catch (error) {
    console.error('Erro ao confirmar cadastro no CV:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
