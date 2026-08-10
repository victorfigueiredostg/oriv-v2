import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Gerencia usuários de acesso restrito (role GESTOR): cada um enxerga apenas
// o empreendimento vinculado e não tem acesso a Configurações. Exclusivo ADMIN.

async function exigirAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return null
  return session
}

const criarSchema = z.object({
  usuario: z.string().trim().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  empreendimentoId: z.coerce
    .number({ message: 'Selecione um empreendimento' })
    .int(),
})

export async function GET() {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      where: { role: 'GESTOR' },
      select: {
        id: true,
        usuario: true,
        criadoEm: true,
        empreendimentoId: true,
        empreendimento: { select: { id: true, nome: true } },
      },
      orderBy: { usuario: 'asc' },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await exigirAdmin())) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { usuario, senha, empreendimentoId } = criarSchema.parse(body)

    const emp = await prisma.empreendimento.findUnique({
      where: { id: empreendimentoId },
    })
    if (!emp) {
      return NextResponse.json(
        { message: 'Empreendimento não encontrado' },
        { status: 400 }
      )
    }

    const existente = await prisma.usuario.findUnique({ where: { usuario } })
    if (existente) {
      return NextResponse.json(
        { message: 'Usuário já está em uso' },
        { status: 400 }
      )
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const criado = await prisma.usuario.create({
      data: { usuario, senhaHash, role: 'GESTOR', empreendimentoId },
      select: {
        id: true,
        usuario: true,
        criadoEm: true,
        empreendimentoId: true,
        empreendimento: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(criado, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
