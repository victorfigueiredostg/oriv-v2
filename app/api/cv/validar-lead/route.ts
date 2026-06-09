import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buscarLeadsPorTelefone, normalizar, apenasDigitos } from '@/lib/cv'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().trim().optional(),
  telefone: z.string().trim(),
})

// POST — verifica no CVCRM se existe lead com o telefone informado e se o
// nome confere. Apenas informa (não bloqueia nada). Requer usuário logado.
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { nome, telefone } = schema.parse(await request.json())
    const digits = apenasDigitos(telefone)
    if (digits.length < 8) {
      return NextResponse.json(
        { message: 'Informe um telefone válido (com DDD).' },
        { status: 400 }
      )
    }

    const { total, leads } = await buscarLeadsPorTelefone(digits)

    const nomeNorm = normalizar(nome || '')
    const nomeConfere =
      !!nomeNorm &&
      leads.some((l) => {
        const ln = normalizar(l.nome || '')
        return ln === nomeNorm || ln.includes(nomeNorm) || nomeNorm.includes(ln)
      })

    return NextResponse.json({
      encontrado: leads.length > 0,
      total,
      nomeConfere,
      leads: leads.slice(0, 5).map((l) => ({
        idlead: l.idlead,
        nome: l.nome,
        telefone: l.telefone,
      })),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }
    const msg =
      error instanceof Error ? error.message : 'Erro ao consultar o CVCRM'
    console.error('Erro ao validar lead no CV:', error)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
