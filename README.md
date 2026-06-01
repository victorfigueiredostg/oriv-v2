# ORIV 2.0

Sistema de registro e gestão de visitas para empreendimentos imobiliários.

## 🚀 Stack Tecnológica

- **Next.js 15** (App Router, TypeScript, Tailwind CSS)
- **Prisma ORM** com MySQL (Hostinger)
- **NextAuth.js** para autenticação
- **Bcryptjs** para hash de senhas
- **Zod** para validação
- **Cloudinary** para armazenamento de imagens

## 📦 Estrutura do Banco de Dados

### Modelos

- **Empreendimento**: Cadastro dos empreendimentos imobiliários
- **Usuario**: Usuários do sistema (ADMIN ou STAND)
- **Visita**: Registro de visitas aos stands

### Enums

- **Role**: `ADMIN` | `STAND`
- **ComoChegou**: `AGENDADO_CORRETOR` | `CLIENTE_PASSANTE`
- **ComoSoube**: `INSTAGRAM` | `FACEBOOK` | `WHATSAPP` | `CORRETOR` | `PANFLETO` | `TV` | `RADIO` | `STAND_CENTRAL_VENDAS` | `INDICACAO` | `OUTDOOR` | `OBRA`

## 🎯 Funcionalidades

### Acesso Público

- **Landing Page** (`/`): Cards dos empreendimentos ativos com acesso ao login

### Área do Stand (role: STAND)

- **Login** (`/login/[slug]`): Autenticação específica por empreendimento
- **Registro de Visita** (`/visita`): Formulário otimizado para tablet com todos os campos obrigatórios
- **Lista de Visitas** (`/visitas`): Visualização das visitas do empreendimento com paginação
- **Dashboard** (`/dashboard`): Métricas e estatísticas do empreendimento

### Área Administrativa (role: ADMIN)

- **Login Admin** (`/admin/login`): Autenticação do gestor
- **Painel Admin** (`/admin`): Visão geral de todos os empreendimentos
- **Criar Empreendimento** (`/admin/empreendimentos/novo`): Cadastro com upload de logo e ícone
- **Visão Global de Visitas**: Acesso a todas as visitas de todos os empreendimentos

## 🔧 Instalação e Configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/victorfigueiredostg/oriv-v2.git
cd oriv-v2
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie o arquivo `.env.local`:

```env
# Database
DATABASE_URL="mysql://usuario:senha@host:3306/database"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Criar banco de dados

**Opção A - Via Prisma (se acesso remoto configurado):**

```bash
npx prisma migrate dev --name init
npm run seed
```

**Opção B - Via phpMyAdmin:**

Execute o arquivo `setup-database.sql` no phpMyAdmin da Hostinger.

### 5. Gerar Prisma Client

```bash
npx prisma generate
```

### 6. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔐 Credenciais Padrão

**Admin:**
- Usuário: `admin`
- Senha: `admin123`

## 📤 Deploy na Hostinger

### 1. Configurar variáveis de ambiente

No painel da Hostinger, adicione as mesmas variáveis do `.env.local`, ajustando:
- `NEXTAUTH_URL` para a URL de produção
- `NEXT_PUBLIC_APP_URL` para a URL de produção

### 2. Conectar ao GitHub

Configure o deploy automático:
- Branch: `main`
- Build command: `npm run build`
- Install command: `npm install`

### 3. Aplicar migrations em produção

**Via SSH (se disponível):**

```bash
npx prisma migrate deploy
```

**Via phpMyAdmin:**

Execute o `setup-database.sql` no banco de produção.

## 🎨 Cloudinary

### Configuração

1. Crie uma conta em https://cloudinary.com
2. No Dashboard, copie:
   - Cloud Name
   - API Key
   - API Secret
3. Adicione ao `.env.local`

### Estrutura de pastas

- `oriv/logos`: Logos horizontais dos empreendimentos
- `oriv/icones`: Ícones quadrados dos empreendimentos

## 📊 API Routes

### Autenticação

- `POST /api/auth/[...nextauth]`: Login e gerenciamento de sessão

### Visitas

- `POST /api/visitas`: Criar nova visita (STAND apenas)
- `GET /api/visitas?page=1&limit=20`: Listar visitas com paginação

### Empreendimentos

- `POST /api/empreendimentos`: Criar empreendimento (ADMIN apenas)
- `GET /api/empreendimentos`: Listar todos os empreendimentos (ADMIN apenas)

### Dashboard

- `GET /api/dashboard?periodo=30`: Métricas e estatísticas

### Upload

- `POST /api/upload`: Upload de imagens para Cloudinary (ADMIN apenas)

## 🛡️ Segurança

- Senhas hasheadas com bcryptjs (10 rounds)
- Autenticação via JWT (NextAuth.js)
- Middleware de proteção de rotas
- Validação de dados com Zod
- CSRF protection via NextAuth

## 🗂️ Estrutura de Pastas

```
oriv-v2/
├── app/
│   ├── (landing)/
│   │   └── page.tsx
│   ├── login/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── visita/
│   │   └── page.tsx
│   ├── visitas/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── login/
│   │   ├── page.tsx
│   │   └── empreendimentos/
│   │       └── novo/
│   │           └── page.tsx
│   └── api/
│       ├── auth/
│       ├── visitas/
│       ├── empreendimentos/
│       ├── dashboard/
│       └── upload/
├── components/
│   └── providers/
│       └── SessionProvider.tsx
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── types/
    └── next-auth.d.ts
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linter
npm run seed         # Seed do banco (usuário admin)
npx prisma studio    # Interface visual do banco
```

## 🐛 Troubleshooting

### Erro de autenticação no banco

- Verifique se o acesso remoto MySQL está habilitado na Hostinger
- Verifique se a senha no `DATABASE_URL` está URL-encoded (@ = %40)
- Teste a conexão via `npx prisma db pull`

### Erro ao fazer upload de imagens

- Verifique se as credenciais do Cloudinary estão corretas
- Verifique se o limite de upload do Cloudinary não foi atingido

### Erro 401/403 nas rotas protegidas

- Limpe os cookies do navegador
- Faça logout e login novamente
- Verifique se o `NEXTAUTH_SECRET` está configurado

## 📞 Suporte

Para dúvidas ou problemas, entre em contato:
- Email: sertenge@sertenge.com.br

## 📄 Licença

Propriedade de Sertenge Desenvolvimento Imobiliário.
