import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const tipo = formData.get('tipo') as string // 'logo' ou 'icone'

    if (!file) {
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: tipo === 'logo' ? 'oriv/logos' : 'oriv/icones',
            transformation:
              tipo === 'icone'
                ? [{ width: 300, height: 300, crop: 'fill' }]
                : [{ width: 800, crop: 'limit' }],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    return NextResponse.json({
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    })
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { message: 'Erro ao fazer upload da imagem' },
      { status: 500 }
    )
  }
}
