import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  buscarLeadsPorTelefone,
  normalizar,
  apenasDigitos,
  telefoneLocal,
} from '@/lib/cv'
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
    if (digits.length < 10) {
      return NextResponse.json(
        { message: 'Informe o telefone completo com DDD.' },
        { status: 400 }
      )
    }

    // O CV busca por "contém"; aqui exigimos telefone EXATO (DDD + número),
    // garantindo que o match seja realmente de um lead com aquele telefone.
    const alvo = telefoneLocal(telefone)
    const { leads } = await buscarLeadsPorTelefone(digits)
    const exatos = leads.filter((l) => telefoneLocal(l.telefone || '') === alvo)

    const nomeNorm = normalizar(nome || '')
    const nomeConfere =
      !!nomeNorm &&
      exatos.some((l) => {
        const ln = normalizar(l.nome || '')
        return ln === nomeNorm || ln.includes(nomeNorm) || nomeNorm.includes(ln)
      })

    return NextResponse.json({
      encontrado: exatos.length > 0,
      total: exatos.length,
      nomeConfere,
      leads: exatos.slice(0, 5).map((l) => ({
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
