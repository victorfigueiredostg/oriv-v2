import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const url = new URL(process.env.DATABASE_URL ?? '')
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  }),
})

async function main() {
  // Hash da senha "admin123"
  const senhaHash = await bcrypt.hash('admin123', 10)

  // Criar usuário admin
  const admin = await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      usuario: 'admin',
      senhaHash,
      role: 'ADMIN',
      empreendimentoId: null,
    },
  })

  console.log('✅ Seed concluído!')
  console.log('👤 Usuário admin criado:')
  console.log('   - Usuário: admin')
  console.log('   - Senha: admin123')
  console.log('   - Role: ADMIN')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
