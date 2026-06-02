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
    const periodo = parseInt(searchParams.get('periodo') || '30') // dias
    const comoChegou = searchParams.get('comoChegou') || undefined
    const comoSoube = searchParams.get('comoSoube') || undefined
    const empreendimentoIdParam = searchParams.get('empreendimentoId')

    const agora = new Date()
    const dataInicio = new Date(agora)
    dataInicio.setDate(dataInicio.getDate() - periodo)
    // Período imediatamente anterior, de mesma duração (para crescimento)
    const dataInicioAnterior = new Date(agora)
    dataInicioAnterior.setDate(dataInicioAnterior.getDate() - periodo * 2)

    // Filtros comuns (sem a janela de data)
    const filtrosBase: any = {}
    if (comoChegou) filtrosBase.comoChegou = comoChegou
    if (comoSoube) filtrosBase.comoSoube = comoSoube

    // STAND: restrito ao próprio empreendimento. ADMIN: pode filtrar por um.
    if (session.user.role === 'STAND' && session.user.empreendimentoId) {
      filtrosBase.empreendimentoId = session.user.empreendimentoId
    } else if (session.user.role === 'ADMIN' && empreendimentoIdParam) {
      filtrosBase.empreendimentoId = parseInt(empreendimentoIdParam)
    }

    const where = { ...filtrosBase, salvoEm: { gte: dataInicio } }
    const wherePeriodoAnterior = {
      ...filtrosBase,
      salvoEm: { gte: dataInicioAnterior, lt: dataInicio },
    }

    const [
      totalVisitas,
      totalAnterior,
      visitasPorComoChegou,
      visitasPorComoSoube,
      topCorretores,
      topImobiliarias,
      gruposEmpreendimento,
    ] = await Promise.all([
      prisma.visita.count({ where }),
      prisma.visita.count({ where: wherePeriodoAnterior }),

      prisma.visita.groupBy({
        by: ['comoChegou'],
        where,
        _count: true,
      }),

      prisma.visita.groupBy({
        by: ['comoSoube'],
        where,
        _count: true,
      }),

      prisma.visita.groupBy({
        by: ['corretor'],
        where,
        _count: true,
        orderBy: { _count: { corretor: 'desc' } },
        take: 10,
      }),

      prisma.visita.groupBy({
        by: ['imobiliaria'],
        where,
        _count: true,
        orderBy: { _count: { imobiliaria: 'desc' } },
        take: 10,
      }),

      // Rank de empreendimentos por nº de visitas no período
      prisma.visita.groupBy({
        by: ['empreendimentoId'],
        where,
        _count: true,
        orderBy: { _count: { empreendimentoId: 'desc' } },
      }),
    ])

    // Mapear ids -> nomes para o rank de empreendimentos
    const ids = gruposEmpreendimento.map((g) => g.empreendimentoId)
    const nomes = ids.length
      ? await prisma.empreendimento.findMany({
          where: { id: { in: ids } },
          select: { id: true, nome: true },
        })
      : []
    const mapaNomes = Object.fromEntries(nomes.map((e) => [e.id, e.nome]))
    const rankEmpreendimentos = gruposEmpreendimento.map((g) => ({
      nome: mapaNomes[g.empreendimentoId] || `#${g.empreendimentoId}`,
      total: g._count,
    }))

    // Indicador de crescimento vs período anterior
    const percentual =
      totalAnterior === 0
        ? totalVisitas > 0
          ? 100
          : 0
        : ((totalVisitas - totalAnterior) / totalAnterior) * 100

    return NextResponse.json({
      totalVisitas,
      crescimento: {
        atual: totalVisitas,
        anterior: totalAnterior,
        percentual: Math.round(percentual),
      },
      visitasPorComoChegou,
      visitasPorComoSoube,
      topCorretores,
      topImobiliarias,
      rankEmpreendimentos,
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
