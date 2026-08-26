import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { statusCvPorTelefone } from '@/lib/cv'

// Re-verificação diária do CV.
// Alvo: visitas COM telefone que NÃO estavam cadastradas no CV ao salvar e
// ainda não foram confirmadas (cvConfirmadoEm nulo). Quando o contato passa a
// existir no CV, grava a data em cvConfirmadoEm ("Confirmação CV").
//
// Processa em LOTES e com pausa entre as chamadas para não pesar (pensando em
// volume futuro). Deve ser chamado por um cron externo (hPanel Cron Jobs ou
// serviço tipo cron-job.org) algumas vezes ao dia. Cada contato é re-checado no
// máximo ~1x por dia (controle via cvVerificadoEm).
//
// Segurança: exige o segredo CRON_SECRET (query ?token= ou header
// x-cron-secret) OU uma sessão de ADMIN (para acionar/testar manualmente).

const LOTE_PADRAO = 40
const LOTE_MAX = 150
const PAUSA_MS = 250 // pausa entre chamadas à API do CV
const JANELA_HORAS = 20 // não re-checa o mesmo contato antes disso

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function autorizado(request: NextRequest): Promise<boolean> {
  const segredo = process.env.CRON_SECRET
  if (segredo) {
    const token =
      request.nextUrl.searchParams.get('token') ||
      request.headers.get('x-cron-secret')
    if (token && token === segredo) return true
  }
  // fallback: ADMIN logado (para testar pelo navegador)
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN'
}

export async function GET(request: NextRequest) {
  try {
    if (!(await autorizado(request))) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const limiteParam = parseInt(
      request.nextUrl.searchParams.get('limit') || String(LOTE_PADRAO)
    )
    const limite = Math.min(
      LOTE_MAX,
      Math.max(1, isNaN(limiteParam) ? LOTE_PADRAO : limiteParam)
    )

    const corte = new Date(Date.now() - JANELA_HORAS * 60 * 60 * 1000)

    const alvos = await prisma.visita.findMany({
      where: {
        AND: [
          { telefone: { not: null } },
          { telefone: { not: '' } },
          { cvConfirmadoEm: null },
          { OR: [{ cvStatus: null }, { cvStatus: { not: 'CADASTRADO' } }] },
          { OR: [{ cvVerificadoEm: null }, { cvVerificadoEm: { lt: corte } }] },
        ],
      },
      // menos recentes primeiro (nulls primeiro no MySQL asc) → cicla todo mundo
      orderBy: { cvVerificadoEm: 'asc' },
      take: limite,
      select: { id: true, telefone: true },
    })

    let novosCadastrados = 0
    let semCadastro = 0
    let indefinidos = 0

    for (const v of alvos) {
      const agora = new Date()
      let status: string | null = null
      try {
        status = await statusCvPorTelefone(v.telefone)
      } catch {
        status = null
      }

      const dados: {
        cvVerificadoEm: Date
        cvStatus?: string
        cvConfirmadoEm?: Date
      } = { cvVerificadoEm: agora }

      if (status === 'CADASTRADO') {
        dados.cvStatus = 'CADASTRADO'
        dados.cvConfirmadoEm = agora // data em que foi validado
        novosCadastrados++
      } else if (status === 'NAO_CADASTRADO') {
        dados.cvStatus = 'NAO_CADASTRADO'
        semCadastro++
      } else {
        // null = CV indisponível/credenciais ausentes → só marca o re-check
        indefinidos++
      }

      await prisma.visita.update({ where: { id: v.id }, data: dados })
      await dormir(PAUSA_MS)
    }

    // Quantos ainda restam na fila (aproximado, mesmo critério sem a janela)
    const restantes = await prisma.visita.count({
      where: {
        AND: [
          { telefone: { not: null } },
          { telefone: { not: '' } },
          { cvConfirmadoEm: null },
          { OR: [{ cvStatus: null }, { cvStatus: { not: 'CADASTRADO' } }] },
        ],
      },
    })

    return NextResponse.json({
      ok: true,
      processados: alvos.length,
      novosCadastrados,
      semCadastro,
      indefinidos,
      restantesNaFila: restantes,
    })
  } catch (error) {
    console.error('Erro no re-check do CV:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
