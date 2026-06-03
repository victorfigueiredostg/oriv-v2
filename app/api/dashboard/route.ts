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
    const comoChegou = searchParams.get('comoChegou') || undefined
    const comoSoube = searchParams.get('comoSoube') || undefined
    const empreendimentoIdParam = searchParams.get('empreendimentoId')
    const dataInicioStr = searchParams.get('dataInicio')
    const dataFimStr = searchParams.get('dataFim')

    let inicio = dataInicioStr ? new Date(`${dataInicioStr}T00:00:00`) : null
    let fim = dataFimStr ? new Date(`${dataFimStr}T23:59:59.999`) : null

    // Compatibilidade: a tela do stand ainda usa ?periodo=N (últimos N dias)
    const periodoParam = searchParams.get('periodo')
    if (!inicio && !fim && periodoParam) {
      fim = new Date()
      inicio = new Date()
      inicio.setDate(inicio.getDate() - parseInt(periodoParam))
    }

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

    // Janela de datas do período atual
    const rangeAtual: any = {}
    if (inicio) rangeAtual.gte = inicio
    if (fim) rangeAtual.lte = fim
    const where = {
      ...filtrosBase,
      ...(inicio || fim ? { salvoEm: rangeAtual } : {}),
    }

    // Período imediatamente anterior, de mesma duração (para o crescimento)
    let wherePeriodoAnterior: any = null
    if (inicio && fim) {
      const duracao = fim.getTime() - inicio.getTime()
      const inicioAnterior = new Date(inicio.getTime() - duracao)
      wherePeriodoAnterior = {
        ...filtrosBase,
        salvoEm: { gte: inicioAnterior, lt: inicio },
      }
    }

    // Queries em sequência (não em paralelo) para reduzir a pressão de
    // conexões/threads no engine do Prisma em ambiente compartilhado.
    const totalVisitas = await prisma.visita.count({ where })

    const totalAnterior = wherePeriodoAnterior
      ? await prisma.visita.count({ where: wherePeriodoAnterior })
      : 0

    const visitasPorComoChegou = await prisma.visita.groupBy({
      by: ['comoChegou'],
      where,
      _count: true,
    })

    const visitasPorComoSoube = await prisma.visita.groupBy({
      by: ['comoSoube'],
      where,
      _count: true,
    })

    const topCorretores = await prisma.visita.groupBy({
      by: ['corretor'],
      where,
      _count: true,
      orderBy: { _count: { corretor: 'desc' } },
      take: 10,
    })

    const topImobiliarias = await prisma.visita.groupBy({
      by: ['imobiliaria'],
      where,
      _count: true,
      orderBy: { _count: { imobiliaria: 'desc' } },
      take: 10,
    })

    // Rank de empreendimentos por nº de visitas no período
    const gruposEmpreendimento = await prisma.visita.groupBy({
      by: ['empreendimentoId'],
      where,
      _count: true,
      orderBy: { _count: { empreendimentoId: 'desc' } },
    })

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
