import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        usuario: { label: 'Usuário', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.senha) {
          return null
        }

        const usuario = await prisma.usuario.findUnique({
          where: { usuario: credentials.usuario },
          include: { empreendimento: true },
        })

        if (!usuario) {
          return null
        }

        const senhaValida = await bcrypt.compare(
          credentials.senha,
          usuario.senhaHash
        )

        if (!senhaValida) {
          return null
        }

        return {
          id: usuario.id.toString(),
          name: usuario.usuario,
          role: usuario.role,
          empreendimentoId: usuario.empreendimentoId,
          empreendimento: usuario.empreendimento,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.empreendimentoId = user.empreendimentoId
        token.empreendimento = user.empreendimento
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as 'ADMIN' | 'STAND'
        session.user.empreendimentoId = token.empreendimentoId as number | null
        session.user.empreendimento = token.empreendimento as any
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
