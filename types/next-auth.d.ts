import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'ADMIN' | 'STAND' | 'GESTOR'
    empreendimentoId: number | null
    empreendimento?: {
      id: number
      nome: string
      logoUrl: string | null
      iconeUrl: string | null
      slug: string
    } | null
  }

  interface Session {
    user: {
      id: string
      name: string
      role: 'ADMIN' | 'STAND' | 'GESTOR'
      empreendimentoId: number | null
      empreendimento?: {
        id: number
        nome: string
        logoUrl: string | null
        iconeUrl: string | null
        slug: string
      } | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'STAND' | 'GESTOR'
    empreendimentoId: number | null
    empreendimento?: {
      id: number
      nome: string
      logoUrl: string | null
      iconeUrl: string | null
      slug: string
    } | null
  }
}
