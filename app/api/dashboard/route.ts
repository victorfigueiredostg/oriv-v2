import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // dias

    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo))

    let where: any = {
      salvoEm: { gte: dataInicio },
    }

    // Se for STAND, filtrar apenas seu empreendimento
    if (session.user.role === 'STAND' && session.user.empreendimentoId) {
      where.empreendimentoId = session.user.empreendimentoId
    }

    // Buscar dados
    const [
      totalVisitas,
      visitasPorDia,
      visitasPorComoChegou,
      visitasPorComoSoube,
      topCorretores,
      topImobiliarias,
    ] = await Promise.all([
      // Total de visitas
      prisma.visita.count({ where }),

      // Visitas por dia
      prisma.$queryRaw`
        SELECT
          DATE(salvoEm) as data,
          COUNT(*) as total
        FROM Visita
        WHERE salvoEm >= ${dataInicio}
          ${session.user.role === 'STAND' && session.user.empreendimentoId
            ? prisma.$queryRaw`AND empreendimentoId = ${session.user.empreendimentoId}`
            : prisma.$queryRaw``}
        GROUP BY DATE(salvoEm)
        ORDER BY data DESC
        LIMIT 30
      `,

      // Visitas por "Como Chegou"
      prisma.visita.groupBy({
        by: ['comoChegou'],
        where,
        _count: true,
      }),

      // Visitas por "Como Soube"
      prisma.visita.groupBy({
        by: ['comoSoube'],
        where,
        _count: true,
      }),

      // Top Corretores
      prisma.visita.groupBy({
        by: ['corretor'],
        where,
        _count: true,
        orderBy: { _count: { corretor: 'desc' } },
        take: 10,
      }),

      // Top Imobiliárias
      prisma.visita.groupBy({
        by: ['imobiliaria'],
        where,
        _count: true,
        orderBy: { _count: { imobiliaria: 'desc' } },
        take: 10,
      }),
    ])

    return NextResponse.json({
      totalVisitas,
      visitasPorDia,
      visitasPorComoChegou,
      visitasPorComoSoube,
      topCorretores,
      topImobiliarias,
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
