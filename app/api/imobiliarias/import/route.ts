import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const importSchema = z.object({
  nomes: z.array(z.string()),
})

// POST — importação em massa de imobiliárias (ADMIN).
// Recebe a lista de nomes já extraída da planilha no cliente.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { nomes } = importSchema.parse(body)

    // Limpa, remove vazios e duplicados (case-insensitive) dentro da própria lista
    const vistos = new Set<string>()
    const limpos: string[] = []
    for (const bruto of nomes) {
      const nome = (bruto || '').trim()
      if (!nome) continue
      const chave = nome.toLowerCase()
      if (vistos.has(chave)) continue
      vistos.add(chave)
      limpos.push(nome)
    }

    if (limpos.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum nome válido encontrado na planilha' },
        { status: 400 }
      )
    }

    // createMany com skipDuplicates ignora os que já existem (unique em nome)
    const resultado = await prisma.imobiliaria.createMany({
      data: limpos.map((nome) => ({ nome })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      enviados: nomes.length,
      validos: limpos.length,
      criados: resultado.count,
      ignorados: limpos.length - resultado.count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('Erro ao importar imobiliárias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
