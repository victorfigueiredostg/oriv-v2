import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Editar / redefinir senha / excluir usuário de acesso restrito (GESTOR).
// Exclusivo ADMIN. Opera SOMENTE sobre usuários role=GESTOR (nunca ADMIN/STAND).

async function exigirAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

const atualizarSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(3, 'Usuário deve ter no mínimo 3 caracteres')
    .optional(),
  empreendimentoId: z.coerce.number().int().optional(),
  novaSenha: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const usuarioId = parseInt(id)
    const body = await request.json()
    const data = atualizarSchema.parse(body)

    const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!alvo || alvo.role !== 'GESTOR') {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Renomear: garantir unicidade
    if (data.usuario && data.usuario !== alvo.usuario) {
      const emUso = await prisma.usuario.findUnique({
        where: { usuario: data.usuario },
      })
      if (emUso) {
        return NextResponse.json(
          { message: 'Usuário já está em uso' },
          { status: 400 }
        )
      }
    }

    // Trocar empreendimento: validar existência
    if (data.empreendimentoId !== undefined) {
      const emp = await prisma.empreendimento.findUnique({
        where: { id: data.empreendimentoId },
      })
      if (!emp) {
        return NextResponse.json(
          { message: 'Empreendimento não encontrado' },
          { status: 400 }
        )
      }
    }

    const patch: {
      usuario?: string
      empreendimentoId?: number
      senhaHash?: string
    } = {}
    if (data.usuario) patch.usuario = data.usuario
    if (data.empreendimentoId !== undefined)
      patch.empreendimentoId = data.empreendimentoId
    if (data.novaSenha) patch.senhaHash = await bcrypt.hash(data.novaSenha, 10)

    await prisma.usuario.update({ where: { id: usuarioId }, data: patch })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const usuarioId = parseInt(id)

    const alvo = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!alvo || alvo.role !== 'GESTOR') {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    await prisma.usuario.delete({ where: { id: usuarioId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
