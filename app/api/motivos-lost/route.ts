import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Opções do dropdown "Motivo de lost". GET disponível para ADMIN e GESTOR
// (usam no dropdown/filtro). Criar é exclusivo de ADMIN.

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'GESTOR')
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const motivos = await prisma.motivoLost.findMany({
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      select: { id: true, nome: true, ativo: true },
    })
    return NextResponse.json(motivos)
  } catch (error) {
    console.error('Erro ao listar motivos de lost:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

const criarSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o motivo'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { nome } = criarSchema.parse(body)

    const existente = await prisma.motivoLost.findUnique({ where: { nome } })
    if (existente) {
      // Se existir inativo, reativa; se ativo, avisa duplicado
      if (!existente.ativo) {
        const reativado = await prisma.motivoLost.update({
          where: { id: existente.id },
          data: { ativo: true },
          select: { id: true, nome: true, ativo: true },
        })
        return NextResponse.json(reativado, { status: 200 })
      }
      return NextResponse.json(
        { message: 'Já existe um motivo com esse nome' },
        { status: 400 }
      )
    }

    const criado = await prisma.motivoLost.create({
      data: { nome },
      select: { id: true, nome: true, ativo: true },
    })
    return NextResponse.json(criado, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar motivo de lost:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
