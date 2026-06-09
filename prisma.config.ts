import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Config do Prisma CLI (db push, generate, etc.). A URL é exigida pelos
// comandos de migração/introspecção. Em runtime o app NÃO usa esta URL: o
// cliente conversa com o MySQL via driver adapter em lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
