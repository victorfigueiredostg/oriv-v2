// Cache em memória (por processo) com TTL curto. Serve para amortecer picos de
// acesso simultâneo em endpoints de leitura pesada (ex.: Dashboard), reduzindo
// a pressão sobre o pool de conexões do banco. Não é compartilhado entre
// processos e se perde a cada restart — isso é aceitável para dados analíticos.

interface Entrada {
  expira: number
  valor: unknown
}

const store = new Map<string, Entrada>()

export function getCache<T>(chave: string): T | null {
  const e = store.get(chave)
  if (!e) return null
  if (Date.now() > e.expira) {
    store.delete(chave)
    return null
  }
  return e.valor as T
}

export function setCache(chave: string, valor: unknown, ttlMs: number): void {
  store.set(chave, { expira: Date.now() + ttlMs, valor })
  // Limpeza leve para o mapa não crescer indefinidamente
  if (store.size > 200) {
    const agora = Date.now()
    for (const [k, v] of store) if (agora > v.expira) store.delete(k)
  }
}
