import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const empreendimentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  logoUrl: z.string().optional(),
  iconeUrl: z.string().optional(),
  usuario: z.string().min(3, 'Usuário deve ter no mínimo 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = empreendimentoSchema.parse(body)

    // Gerar slug a partir do nome
    const slug = validatedData.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar se slug já existe
    const slugExistente = await prisma.empreendimento.findUnique({
      where: { slug },
    })

    if (slugExistente) {
      return NextResponse.json(
        { message: 'Já existe um empreendimento com este nome' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario: validatedData.usuario },
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { message: 'Usuário já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(validatedData.senha, 10)

    // Criar empreendimento e usuário em transação
    const result = await prisma.$transaction(async (tx) => {
      const empreendimento = await tx.empreendimento.create({
        data: {
          nome: validatedData.nome,
          slug,
          logoUrl: validatedData.logoUrl || null,
          iconeUrl: validatedData.iconeUrl || null,
        },
      })

      const usuario = await tx.usuario.create({
        data: {
          usuario: validatedData.usuario,
          senhaHash,
          role: 'STAND',
          empreendimentoId: empreendimento.id,
        },
      })

      return { empreendimento, usuario }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar empreendimento:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const empreendimentos = await prisma.empreendimento.findMany({
      include: {
        _count: {
          select: {
            visitas: true,
            usuarios: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(empreendimentos)
  } catch (error) {
    console.error('Erro ao buscar empreendimentos:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
