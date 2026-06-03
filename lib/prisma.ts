import { PrismaClient } from '@prisma/client'

// Em hospedagem compartilhada (Hostinger) o engine do Prisma pode entrar em
// "PANIC: timer has gone away" quando abre muitas conexões/threads e bate no
// limite de processos do ambiente. Por isso limitamos o pool de conexões.
function urlComLimite(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url || url.includes('connection_limit')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}connection_limit=3&pool_timeout=30`
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: urlComLimite() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
