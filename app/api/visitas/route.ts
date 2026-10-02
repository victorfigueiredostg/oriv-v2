import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { statusCvPorTelefone } from '@/lib/cv'
import { MOTIVO_LOST_COM_ALGUM, FAIXA_ETARIA_OPCOES } from '@/lib/labels'
import { z } from 'zod'

const COMO_SOUBE_VALUES = [
  'INSTAGRAM',
  'FACEBOOK',
  'WHATSAPP',
  'CORRETOR',
  'PANFLETO',
  'TV',
  'RADIO',
  'STAND_CENTRAL_VENDAS',
  'INDICACAO',
  'OUTDOOR',
  'OBRA',
  'FAIXA_PASSARELA_SAO_CRISTOVAO',
  'GOOGLE',
  'SITE',
  'TV_HOSPITAL_SAO_RAFAEL',
] as const

const visitaSchema = z.object({
  nomeCliente: z.string().min(1, 'Nome do cliente é obrigatório'),
  telefone: z.string().trim().optional(),
  faixaEtaria: z.enum(FAIXA_ETARIA_OPCOES, {
    message: 'Selecione a faixa etária',
  }),
  comoChegou: z.enum([
    'AGENDADO_CORRETOR',
    'CLIENTE_PASSANTE',
    'AGENDAMENTO_SELENA',
  ]),
  corretor: z.string().min(1, 'Nome do corretor é obrigatório'),
  imobiliaria: z.string().min(1, 'Nome da imobiliária é obrigatório'),
  comoSoube: z.enum(COMO_SOUBE_VALUES),
  // "Onde mais viu/ouviu" — múltiplas origens (opcional)
  ondeMaisViu: z.array(z.enum(COMO_SOUBE_VALUES)).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.role !== 'STAND') {
      return NextResponse.json(
        { message: 'Apenas usuários do tipo STAND podem registrar visitas' },
        { status: 403 }
      )
    }

    if (!session.user.empreendimentoId) {
      return NextResponse.json(
        { message: 'Usuário não está vinculado a um empreendimento' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { ondeMaisViu, ...validatedData } = visitaSchema.parse(body)

    // Verificação no CVCRM SEMPRE no salvamento (independente do botão no form)
    const telefone = validatedData.telefone?.trim() || null
    const cvStatus = await statusCvPorTelefone(telefone)

    const visita = await prisma.visita.create({
      data: {
        ...validatedData,
        corretor: validatedData.corretor.trim().replace(/\s+/g, ' ').toUpperCase(),
        telefone,
        cvStatus,
        ondeMaisViu: ondeMaisViu?.length ? ondeMaisViu.join(',') : null,
        empreendimentoId: session.user.empreendimentoId,
        usuarioId: parseInt(session.user.id),
      },
    })

    return NextResponse.json(visita, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar visita:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}

    // STAND/GESTOR: apenas visitas do seu empreendimento (ignoram parâmetro)
    if (
      (session.user.role === 'STAND' || session.user.role === 'GESTOR') &&
      session.user.empreendimentoId
    ) {
      where.empreendimentoId = session.user.empreendimentoId
    } else if (session.user.role === 'ADMIN') {
      // ADMIN pode filtrar por empreendimento e pelos campos da visita
      const empreendimentoId = searchParams.get('empreendimentoId')
      if (empreendimentoId) where.empreendimentoId = parseInt(empreendimentoId)
    }

    // Filtros de relatório (aplicáveis a ambos os papéis)
    const comoChegou = searchParams.get('comoChegou')
    const comoSoube = searchParams.get('comoSoube')
    const imobiliaria = searchParams.get('imobiliaria')
    const motivoLost = searchParams.get('motivoLost')
    const cvCadastro = searchParams.get('cvCadastro') // 'sim' | 'nao'
    const dataInicioStr = searchParams.get('dataInicio')
    const dataFimStr = searchParams.get('dataFim')
    if (comoChegou) where.comoChegou = comoChegou
    if (comoSoube) where.comoSoube = comoSoube
    if (imobiliaria) where.imobiliaria = imobiliaria
    if (motivoLost === MOTIVO_LOST_COM_ALGUM) where.motivoLost = { not: null }
    else if (motivoLost) where.motivoLost = motivoLost
    // Cadastro no CV: 'sim' = só CADASTRADO; 'nao' = tudo que NÃO é CADASTRADO
    // (inclui não cadastrado, não preencheu e não verificado/null)
    if (cvCadastro === 'sim') where.cvStatus = 'CADASTRADO'
    else if (cvCadastro === 'nao')
      where.OR = [{ cvStatus: null }, { cvStatus: { not: 'CADASTRADO' } }]
    if (dataInicioStr || dataFimStr) {
      where.salvoEm = {}
      if (dataInicioStr) where.salvoEm.gte = new Date(`${dataInicioStr}T00:00:00`)
      if (dataFimStr) where.salvoEm.lte = new Date(`${dataFimStr}T23:59:59.999`)
    }

    const [visitas, total] = await Promise.all([
      prisma.visita.findMany({
        where,
        include: {
          usuario: {
            select: {
              usuario: true,
            },
          },
          empreendimento: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: { salvoEm: 'desc' },
        skip,
        take: limit,
      }),
      prisma.visita.count({ where }),
    ])

    return NextResponse.json({
      visitas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar visitas:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
