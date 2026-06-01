import bcrypt from 'bcryptjs'

async function main() {
  const senha = 'admin123'
  const hash = await bcrypt.hash(senha, 10)
  console.log('\n=== Hash gerado ===')
  console.log('Senha:', senha)
  console.log('Hash:', hash)
  console.log('\nUse este hash no SQL:')
  console.log(
    `INSERT INTO Usuario (usuario, senhaHash, role, empreendimentoId) VALUES ('admin', '${hash}', 'ADMIN', NULL);`
  )
}

main()
