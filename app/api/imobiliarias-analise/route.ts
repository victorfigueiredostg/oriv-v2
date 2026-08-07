import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buscarVendas, casarImobiliaria } from '@/lib/cv'

// Análise de desempenho das imobiliárias (ADMIN).
// Filtros: dataInicio, dataFim, empreendimentoId (mesmos do dashboard).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dataInicioStr = searchParams.get('dataInicio')
    const dataFimStr = searchParams.get('dataFim')
    const empreendimentoIdParam = searchParams.get('empreendimentoId')

    const where: any = {}
    if (empreendimentoIdParam)
      where.empreendimentoId = parseInt(empreendimentoIdParam)
    if (dataInicioStr || dataFimStr) {
      where.salvoEm = {}
      if (dataInicioStr) where.salvoEm.gte = new Date(`${dataInicioStr}T00:00:00`)
      if (dataFimStr) where.salvoEm.lte = new Date(`${dataFimStr}T23:59:59.999`)
    }

    const [linhas, empreendimentos, cadastroImob] = await Promise.all([
      prisma.visita.findMany({
        where,
        select: {
          imobiliaria: true,
          corretor: true,
          comoChegou: true,
          empreendimentoId: true,
        },
      }),
      prisma.empreendimento.findMany({ select: { id: true, nome: true } }),
      prisma.imobiliaria.findMany({ select: { nome: true } }),
    ])

    const nomeEmp = Object.fromEntries(empreendimentos.map((e) => [e.id, e.nome]))

    interface EmpAgg {
      total: number
      agendados: number
      passantes: number
    }
    interface Agg {
      total: number
      agendados: number
      passantes: number
      corretores: Map<string, number>
      empreend: Map<number, EmpAgg>
    }
    const mapa = new Map<string, Agg>()
    for (const v of linhas) {
      const imob = v.imobiliaria || '(sem imobiliária)'
      const a =
        mapa.get(imob) ||
        ({
          total: 0,
          agendados: 0,
          passantes: 0,
          corretores: new Map(),
          empreend: new Map(),
        } as Agg)
      const agendado = v.comoChegou === 'AGENDADO_CORRETOR'
      const passante = v.comoChegou === 'CLIENTE_PASSANTE'
      a.total++
      if (agendado) a.agendados++
      else if (passante) a.passantes++
      if (v.corretor)
        a.corretores.set(v.corretor, (a.corretores.get(v.corretor) || 0) + 1)
      const e =
        a.empreend.get(v.empreendimentoId) ||
        ({ total: 0, agendados: 0, passantes: 0 } as EmpAgg)
      e.total++
      if (agendado) e.agendados++
      else if (passante) e.passantes++
      a.empreend.set(v.empreendimentoId, e)
      mapa.set(imob, a)
    }

    const totalGeral = linhas.length

    interface Linha {
      nome: string
      total: number
      agendados: number
      passantes: number
      corretores: { nome: string; total: number }[]
      porEmpreendimento: {
        nome: string
        total: number
        agendados: number
        passantes: number
      }[]
      vendas: number
      vendasDetalhe: {
        codigo: string
        empreendimento: string
        corretor: string
        dataVenda: string
      }[]
    }

    const base: Linha[] = [...mapa.entries()].map(([nome, a]) => ({
      nome,
      total: a.total,
      agendados: a.agendados,
      passantes: a.passantes,
      corretores: [...a.corretores.entries()]
        .map(([n, t]) => ({ nome: n, total: t }))
        .sort((x, y) => y.total - x.total),
      porEmpreendimento: [...a.empreend.entries()]
        .map(([id, e]) => ({
          nome: nomeEmp[id] || `#${id}`,
          total: e.total,
          agendados: e.agendados,
          passantes: e.passantes,
        }))
        .sort((x, y) => y.total - x.total),
      vendas: 0,
      vendasDetalhe: [],
    }))

    const porNome = new Map<string, Linha>(base.map((i) => [i.nome, i]))
    // Candidatos para casar o nome vindo do CV: quem teve atendimento + cadastro
    const candidatos = Array.from(
      new Set([...base.map((i) => i.nome), ...cadastroImob.map((c) => c.nome)])
    )

    // Vendas do CV (não bloqueia a análise se o CV falhar)
    let vendasIndisponivel = false
    try {
      const vendas = await buscarVendas(dataInicioStr, dataFimStr)
      for (const v of vendas) {
        const chave =
          casarImobiliaria(v.imobiliaria, candidatos) ||
          v.imobiliaria ||
          '(sem imobiliária)'
        let row = porNome.get(chave)
        if (!row) {
          row = {
            nome: chave,
            total: 0,
            agendados: 0,
            passantes: 0,
            corretores: [],
            porEmpreendimento: [],
            vendas: 0,
            vendasDetalhe: [],
          }
          porNome.set(chave, row)
        }
        row.vendas++
        row.vendasDetalhe.push({
          codigo: v.codigo,
          empreendimento: v.empreendimento,
          corretor: v.corretor,
          dataVenda: v.dataVenda,
        })
      }
    } catch (e) {
      console.error('Vendas CV indisponíveis:', e)
      vendasIndisponivel = true
    }

    const imobiliarias = [...porNome.values()].sort(
      (x, y) => y.total - x.total || y.vendas - x.vendas
    )

    return NextResponse.json({ totalGeral, imobiliarias, vendasIndisponivel })
  } catch (error) {
    console.error('Erro na análise de imobiliárias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
