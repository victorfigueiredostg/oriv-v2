import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE — remove uma imobiliária do cadastro (ADMIN).
// Não afeta visitas já registradas (imobiliária é texto livre na visita).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    await prisma.imobiliaria.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir imobiliária:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
