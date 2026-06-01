import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const empreendimentos = await prisma.empreendimento.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        slug: true,
        iconeUrl: true,
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(empreendimentos)
  } catch (error) {
    console.error('Erro ao buscar empreendimentos:', error)
    return NextResponse.json([], { status: 200 }) // Retorna array vazio em caso de erro
  }
}
