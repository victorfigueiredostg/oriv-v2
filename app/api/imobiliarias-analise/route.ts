import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Análise de desempenho das imobiliárias (ADMIN).
// Filtros: dataInicio, dataFim, empreendimentoId (mesmos do dashboard).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'GESTOR')
    ) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dataInicioStr = searchParams.get('dataInicio')
    const dataFimStr = searchParams.get('dataFim')
    const empreendimentoIdParam = searchParams.get('empreendimentoId')

    const where: any = {}
    // GESTOR: travado no próprio empreendimento (ignora o parâmetro)
    if (session.user.role === 'GESTOR' && session.user.empreendimentoId) {
      where.empreendimentoId = session.user.empreendimentoId
    } else if (empreendimentoIdParam) {
      where.empreendimentoId = parseInt(empreendimentoIdParam)
    }
    if (dataInicioStr || dataFimStr) {
      where.salvoEm = {}
      if (dataInicioStr) where.salvoEm.gte = new Date(`${dataInicioStr}T00:00:00`)
      if (dataFimStr) where.salvoEm.lte = new Date(`${dataFimStr}T23:59:59.999`)
    }

    const [linhas, empreendimentos] = await Promise.all([
      prisma.visita.findMany({
        where,
        select: {
          imobiliaria: true,
          corretor: true,
          comoChegou: true,
          empreendimentoId: true,
          nomeCliente: true,
          salvoEm: true,
        },
        orderBy: { salvoEm: 'desc' },
      }),
      prisma.empreendimento.findMany({ select: { id: true, nome: true } }),
    ])

    const nomeEmp = Object.fromEntries(empreendimentos.map((e) => [e.id, e.nome]))

    interface EmpAgg {
      total: number
      agendados: number
      passantes: number
    }
    interface ClienteRow {
      nomeCliente: string
      corretor: string
      empreendimento: string
      comoChegou: string
      salvoEm: Date
    }
    interface Agg {
      total: number
      agendados: number
      passantes: number
      corretores: Map<string, number>
      empreend: Map<number, EmpAgg>
      clientes: ClienteRow[]
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
          clientes: [],
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
      // linhas já vêm ordenadas por salvoEm desc, então a lista preserva a ordem
      a.clientes.push({
        nomeCliente: v.nomeCliente,
        corretor: v.corretor,
        empreendimento: nomeEmp[v.empreendimentoId] || `#${v.empreendimentoId}`,
        comoChegou: v.comoChegou,
        salvoEm: v.salvoEm,
      })
      mapa.set(imob, a)
    }

    const totalGeral = linhas.length
    const imobiliarias = [...mapa.entries()]
      .map(([nome, a]) => ({
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
        clientes: a.clientes,
      }))
      .sort((x, y) => y.total - x.total)

    return NextResponse.json({ totalGeral, imobiliarias })
  } catch (error) {
    console.error('Erro na análise de imobiliárias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
