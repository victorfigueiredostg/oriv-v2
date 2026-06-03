import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET — lista de imobiliárias (usada pelo autocomplete do formulário e pela
// tela de configurações). Qualquer usuário autenticado pode listar.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const imobiliarias = await prisma.imobiliaria.findMany({
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    })
    return NextResponse.json(imobiliarias)
  } catch (error) {
    console.error('Erro ao listar imobiliárias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

const criarSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório'),
})

// POST — cadastra uma imobiliária (ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { nome } = criarSchema.parse(body)

    const existente = await prisma.imobiliaria.findUnique({ where: { nome } })
    if (existente) {
      return NextResponse.json(
        { message: 'Já existe uma imobiliária com este nome' },
        { status: 400 }
      )
    }

    const imobiliaria = await prisma.imobiliaria.create({ data: { nome } })
    return NextResponse.json(imobiliaria, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao criar imobiliária:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
