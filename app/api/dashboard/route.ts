import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCache, setCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comoChegou = searchParams.get('comoChegou') || undefined
    const comoSoube = searchParams.get('comoSoube') || undefined
    const imobiliaria = searchParams.get('imobiliaria') || undefined
    const motivoLost = searchParams.get('motivoLost') || undefined
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

    // Cache curto por escopo + filtros: ameniza acesso simultâneo, reduzindo
    // quantas queries chegam ao banco (pool pequeno na Hostinger).
    const escopoCache =
      session.user.role === 'ADMIN'
        ? `admin:${empreendimentoIdParam || 'all'}`
        : `${session.user.role}:${session.user.empreendimentoId ?? 'none'}`
    const cacheKey = `dash:${escopoCache}:${dataInicioStr || ''}:${dataFimStr || ''}:${searchParams.get('periodo') || ''}:${comoChegou || ''}:${comoSoube || ''}:${imobiliaria || ''}:${motivoLost || ''}`
    const emCache = getCache<any>(cacheKey)
    if (emCache) return NextResponse.json(emCache)

    // Filtros comuns (sem a janela de data)
    const filtrosBase: any = {}
    if (comoChegou) filtrosBase.comoChegou = comoChegou
    if (comoSoube) filtrosBase.comoSoube = comoSoube
    if (imobiliaria) filtrosBase.imobiliaria = imobiliaria
    if (motivoLost) filtrosBase.motivoLost = motivoLost

    // STAND/GESTOR: travados no próprio empreendimento (ignoram o parâmetro).
    // ADMIN: visão global, pode filtrar por um empreendimento.
    if (
      (session.user.role === 'STAND' || session.user.role === 'GESTOR') &&
      session.user.empreendimentoId
    ) {
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

    // Média de idade dos leads no filtro selecionado (ignora idades não informadas)
    const aggIdade = await prisma.visita.aggregate({
      where,
      _avg: { idadeCliente: true },
      _count: { idadeCliente: true },
    })
    const mediaIdade = {
      media:
        aggIdade._avg.idadeCliente != null
          ? Math.round(aggIdade._avg.idadeCliente)
          : null,
      qtd: aggIdade._count.idadeCliente,
    }

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

    // Top corretores: total por corretor + imobiliária predominante dele
    const gruposCorretor = await prisma.visita.groupBy({
      by: ['corretor', 'imobiliaria'],
      where,
      _count: true,
    })
    const corretorMap = new Map<
      string,
      { total: number; imobs: Map<string, number> }
    >()
    for (const g of gruposCorretor) {
      const entry = corretorMap.get(g.corretor) || {
        total: 0,
        imobs: new Map<string, number>(),
      }
      entry.total += g._count
      entry.imobs.set(
        g.imobiliaria,
        (entry.imobs.get(g.imobiliaria) || 0) + g._count
      )
      corretorMap.set(g.corretor, entry)
    }
    const topCorretores = [...corretorMap.entries()]
      .map(([corretor, { total, imobs }]) => {
        let imobiliaria = ''
        let max = -1
        for (const [im, n] of imobs) {
          if (n > max) {
            max = n
            imobiliaria = im
          }
        }
        return { corretor, imobiliaria, _count: total }
      })
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)

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

    // Cruzamento Tipo de Visita (comoChegou) x Origem (comoSoube)
    const crossTipoOrigem = await prisma.visita.groupBy({
      by: ['comoChegou', 'comoSoube'],
      where,
      _count: true,
    })

    // Motivos de "lost" (quantitativo/rosca) — só visitas com motivo informado
    const gruposMotivo = await prisma.visita.groupBy({
      by: ['motivoLost'],
      where: { ...where, motivoLost: { not: null } },
      _count: true,
    })
    const motivosLostTotais = gruposMotivo
      .map((g) => ({ nome: g.motivoLost as string, total: g._count }))
      .sort((a, b) => b.total - a.total)

    // Série temporal (por dia) e matriz dia-da-semana x hora — agregadas em JS
    // no fuso de Brasília (America/Sao_Paulo), a partir dos salvoEm filtrados.
    const linhas = await prisma.visita.findMany({
      where,
      select: { salvoEm: true, comoSoube: true, ondeMaisViu: true },
    })

    const fmtData = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const fmtDiaHora = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      hourCycle: 'h23',
    })
    const idxDia: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }

    const serieMap = new Map<string, number>()
    const matriz = Array.from({ length: 7 }, () => new Array<number>(24).fill(0))
    const totaisDia = new Array<number>(7).fill(0)
    // "Outros canais de origem": SOMENTE as respostas de "onde mais viu/ouviu"
    const ondeMaisMap = new Map<string, number>()
    const inc = (k: string) => ondeMaisMap.set(k, (ondeMaisMap.get(k) || 0) + 1)
    // Cruzamento: por primeiro contato (comoSoube), quais outros canais viu
    const crossMap = new Map<
      string,
      { total: number; canais: Map<string, number> }
    >()

    for (const { salvoEm, comoSoube, ondeMaisViu } of linhas) {
      const dia = fmtData.format(salvoEm) // YYYY-MM-DD
      serieMap.set(dia, (serieMap.get(dia) || 0) + 1)

      const parts = fmtDiaHora.formatToParts(salvoEm)
      const wd = parts.find((p) => p.type === 'weekday')?.value || 'Sun'
      const hr = parts.find((p) => p.type === 'hour')?.value || '0'
      const di = idxDia[wd] ?? 0
      const h = parseInt(hr, 10) % 24
      matriz[di][h]++
      totaisDia[di]++

      const canaisDaVisita = ondeMaisViu
        ? ondeMaisViu
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : []
      for (const t of canaisDaVisita) inc(t)

      if (comoSoube) {
        let c = crossMap.get(comoSoube)
        if (!c) {
          c = { total: 0, canais: new Map() }
          crossMap.set(comoSoube, c)
        }
        c.total++
        for (const t of canaisDaVisita) {
          c.canais.set(t, (c.canais.get(t) || 0) + 1)
        }
      }
    }

    const serieTemporal = [...serieMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dia, total]) => ({ dia, total }))

    const ondeMaisViuTotais = [...ondeMaisMap.entries()]
      .map(([comoSoube, _count]) => ({ comoSoube, _count }))
      .sort((a, b) => b._count - a._count)

    const cruzamentoContatoOnde = [...crossMap.entries()]
      .map(([primeiroContato, c]) => ({
        primeiroContato,
        total: c.total,
        canais: [...c.canais.entries()]
          .map(([canal, total]) => ({ canal, total }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total)

    // Indicador de crescimento vs período anterior
    const percentual =
      totalAnterior === 0
        ? totalVisitas > 0
          ? 100
          : 0
        : ((totalVisitas - totalAnterior) / totalAnterior) * 100

    const resposta = {
      totalVisitas,
      mediaIdade,
      crescimento: {
        atual: totalVisitas,
        anterior: totalAnterior,
        percentual: Math.round(percentual),
      },
      visitasPorComoChegou,
      visitasPorComoSoube,
      ondeMaisViuTotais,
      cruzamentoContatoOnde,
      topCorretores,
      topImobiliarias,
      rankEmpreendimentos,
      crossTipoOrigem,
      motivosLostTotais,
      serieTemporal,
      matrizDiaHora: { matriz, totaisDia },
    }
    // Guarda por 45s (dados analíticos toleram leve defasagem)
    setCache(cacheKey, resposta, 45000)
    return NextResponse.json(resposta)
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
