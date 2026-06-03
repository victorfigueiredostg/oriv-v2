import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

// Prisma 7 sem motor Rust: o cliente fala com o MySQL via driver adapter
// (mariadb, compatível com MySQL). Isso evita o "PANIC: timer has gone away"
// do engine Rust no ambiente compartilhado da Hostinger.
function configAdapter() {
  const url = new URL(process.env.DATABASE_URL ?? '')
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    connectionLimit: 3,
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaMariaDb(configAdapter()) })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
