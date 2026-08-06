import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Lista de corretores já usados (normalizados em MAIÚSCULO, sem duplicatas)
// para sugestão no autocomplete do formulário. Qualquer usuário autenticado.
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }
    const rows = await prisma.visita.findMany({ select: { corretor: true } })
    const set = new Set<string>()
    for (const r of rows) {
      const n = (r.corretor || '').trim().replace(/\s+/g, ' ').toUpperCase()
      if (n) set.add(n)
    }
    return NextResponse.json([...set].sort())
  } catch (error) {
    console.error('Erro ao listar corretores:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
