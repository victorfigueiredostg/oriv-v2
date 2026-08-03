import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Valida a senha extra para visualizar as visitas registradas (trava de UX no
// tablet do stand). Requer usuário autenticado. Checagem feita no servidor
// para não expor a senha no bundle do cliente.
const GATE_USUARIO = 'stand'
const GATE_SENHA = 'Sertenge50@'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const { usuario, senha } = await request.json().catch(() => ({}))
  const ok = usuario === GATE_USUARIO && senha === GATE_SENHA
  return NextResponse.json({ ok })
}
