import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
