import { prisma } from './prisma'

const CHAVES = ['cv_dominio', 'cv_email', 'cv_token'] as const

export interface CvConfig {
  dominio: string
  email: string
  token: string
}

// Lê as credenciais do CVCRM da tabela Configuracao
export async function getCvConfig(): Promise<CvConfig> {
  const rows = await prisma.configuracao.findMany({
    where: { chave: { in: CHAVES as unknown as string[] } },
  })
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor]))
  return {
    dominio: map.cv_dominio || '',
    email: map.cv_email || '',
    token: map.cv_token || '',
  }
}

export async function salvarCvConfig(cfg: CvConfig) {
  const pares: [string, string][] = [
    ['cv_dominio', cfg.dominio.trim()],
    ['cv_email', cfg.email.trim()],
    ['cv_token', cfg.token.trim()],
  ]
  for (const [chave, valor] of pares) {
    await prisma.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor },
    })
  }
}

export interface LeadCv {
  idlead: number
  nome: string
  telefone: string | null
  email: string | null
}

// Consulta leads no CVCRM por telefone (somente dígitos)
export async function buscarLeadsPorTelefone(
  telefoneDigits: string
): Promise<{ total: number; leads: LeadCv[] }> {
  const cfg = await getCvConfig()
  if (!cfg.dominio || !cfg.email || !cfg.token) {
    throw new Error('Credenciais do CVCRM não configuradas (Configurações → API)')
  }
  const base = cfg.dominio.replace(/\/+$/, '')
  const url = `${base}/api/v1/comercial/leads?telefone=${encodeURIComponent(
    telefoneDigits
  )}`

  const res = await fetch(url, {
    headers: { email: cfg.email, token: cfg.token },
    // sem cache; é uma verificação em tempo real
    cache: 'no-store',
  })
  const data = await res.json().catch(() => null)

  // O CVCRM responde 400 com {error:"Lead não encontrado"} quando não há lead
  if (res.status === 400 && data?.error) {
    return { total: 0, leads: [] }
  }
  if (!res.ok) {
    throw new Error(`O CVCRM respondeu com status ${res.status}`)
  }
  const leads: LeadCv[] = Array.isArray(data?.leads)
    ? data.leads.map((l: any) => ({
        idlead: l.idlead,
        nome: l.nome,
        telefone: l.telefone ?? null,
        email: l.email ?? null,
      }))
    : []
  return { total: Number(data?.total ?? leads.length), leads }
}

// Normaliza texto p/ comparar nomes (sem acento, minúsculo, espaços simples)
export function normalizar(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export const apenasDigitos = (s: string) => (s || '').replace(/\D/g, '')

// Reduz um telefone aos dígitos locais (DDD + número), removendo o código do
// país (+55). Usado para comparar telefone EXATO (a busca do CV é por "contém").
export function telefoneLocal(s: string): string {
  let d = apenasDigitos(s)
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2)
  return d
}

export type CvStatus = 'CADASTRADO' | 'NAO_CADASTRADO' | 'NAO_PREENCHEU'

// Verifica o status do lead no CV por telefone (match exato). Retorna null se
// não foi possível verificar (CV indisponível/credenciais ausentes).
export async function statusCvPorTelefone(
  telefone?: string | null
): Promise<CvStatus | null> {
  const digits = apenasDigitos(telefone || '')
  if (digits.length < 10) return 'NAO_PREENCHEU'
  try {
    const { leads } = await buscarLeadsPorTelefone(digits)
    const alvo = telefoneLocal(telefone || '')
    const exato = leads.some((l) => telefoneLocal(l.telefone || '') === alvo)
    return exato ? 'CADASTRADO' : 'NAO_CADASTRADO'
  } catch {
    return null
  }
}
