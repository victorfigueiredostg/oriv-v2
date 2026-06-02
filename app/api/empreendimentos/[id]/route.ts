import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  logoUrl: z.string().nullable().optional(),
  iconeUrl: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  novaSenha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
})

async function exigirAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const empreendimento = await prisma.empreendimento.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          where: { role: 'STAND' },
          select: { id: true, usuario: true },
          take: 1,
        },
        _count: { select: { visitas: true, usuarios: true } },
      },
    })

    if (!empreendimento) {
      return NextResponse.json(
        { message: 'Empreendimento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(empreendimento)
  } catch (error) {
    console.error('Erro ao buscar empreendimento:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { id } = await params
    const empreendimentoId = parseInt(id)
    const body = await request.json()
    const data = updateSchema.parse(body)

    const existente = await prisma.empreendimento.findUnique({
      where: { id: empreendimentoId },
    })
    if (!existente) {
      return NextResponse.json(
        { message: 'Empreendimento não encontrado' },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // slug permanece estável para não quebrar a URL de login do stand
      await tx.empreendimento.update({
        where: { id: empreendimentoId },
        data: {
          ...(data.nome !== undefined ? { nome: data.nome } : {}),
          ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
          ...(data.iconeUrl !== undefined ? { iconeUrl: data.iconeUrl } : {}),
          ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
        },
      })

      // Redefinir senha do usuário STAND vinculado, se solicitado
      if (data.novaSenha) {
        const standUser = await tx.usuario.findFirst({
          where: { empreendimentoId, role: 'STAND' },
        })
        if (standUser) {
          const senhaHash = await bcrypt.hash(data.novaSenha, 10)
          await tx.usuario.update({
            where: { id: standUser.id },
            data: { senhaHash },
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao atualizar empreendimento:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
