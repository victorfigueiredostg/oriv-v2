import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/tendencia?ano=YYYY
// Total de visitas por mês no ano (independente dos demais filtros).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ano = parseInt(
      searchParams.get('ano') || String(new Date().getFullYear())
    )

    const where: any = {
      salvoEm: {
        gte: new Date(`${ano}-01-01T00:00:00`),
        lte: new Date(`${ano}-12-31T23:59:59.999`),
      },
    }
    // STAND/GESTOR restritos ao próprio empreendimento (admin vê tudo)
    if (
      (session.user.role === 'STAND' || session.user.role === 'GESTOR') &&
      session.user.empreendimentoId
    ) {
      where.empreendimentoId = session.user.empreendimentoId
    }

    const linhas = await prisma.visita.findMany({
      where,
      select: { salvoEm: true },
    })

    const fmtMes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      month: '2-digit',
    })
    const meses = new Array<number>(12).fill(0)
    for (const { salvoEm } of linhas) {
      const m = parseInt(fmtMes.format(salvoEm), 10)
      if (m >= 1 && m <= 12) meses[m - 1]++
    }

    return NextResponse.json({ ano, meses })
  } catch (error) {
    console.error('Erro na tendência anual:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
