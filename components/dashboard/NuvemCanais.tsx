'use client'

import { useMemo, useState } from 'react'
import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

type Fonte = 'primeiro' | 'outros' | 'todos'

interface Props {
  primeiroContato: Item[]
  outrosCanais: Item[]
}

// Cada canal é uma bolha; o diâmetro é proporcional à quantidade (área ∝
// contagem, via raiz quadrada). Bolhas lado a lado para ver o todo.
export default function NuvemCanais({ primeiroContato, outrosCanais }: Props) {
  const [fonte, setFonte] = useState<Fonte>('primeiro')

  const dados = useMemo(() => {
    const soma = new Map<string, number>()
    const add = (arr: Item[]) => {
      for (const i of arr)
        soma.set(i.comoSoube, (soma.get(i.comoSoube) || 0) + i._count)
    }
    if (fonte === 'primeiro') add(primeiroContato)
    else if (fonte === 'outros') add(outrosCanais)
    else {
      add(primeiroContato)
      add(outrosCanais)
    }
    return [...soma.entries()]
      .map(([comoSoube, total]) => ({ comoSoube, total }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [fonte, primeiroContato, outrosCanais])

  const max = dados.length ? dados[0].total : 0

  // Diâmetro 56px..168px, escalado pela raiz (área proporcional à contagem)
  const diametro = (n: number) => {
    if (!max) return 56
    const t = Math.sqrt(n) / Math.sqrt(max)
    return Math.round(56 + t * 112)
  }

  const btn = (f: Fonte, label: string) => (
    <button
      onClick={() => setFonte(f)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        fonte === f
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {btn('primeiro', 'Primeiro contato')}
        {btn('outros', 'Outros canais')}
        {btn('todos', 'Todos')}
      </div>

      {dados.length === 0 ? (
        <p className="text-sm text-gray-500">Sem dados no período.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4 py-4">
          {dados.map((d, i) => {
            const size = diametro(d.total)
            const fonteRotulo = Math.max(10, Math.min(16, Math.round(size * 0.15)))
            return (
              <div
                key={d.comoSoube}
                title={`${traduzirComoSoube(d.comoSoube)}: ${d.total}`}
                style={{
                  width: size,
                  height: size,
                  backgroundColor: PALETA[i % PALETA.length],
                }}
                className="rounded-full flex flex-col items-center justify-center text-center text-white shadow-sm shrink-0 p-2"
              >
                <span
                  style={{ fontSize: fonteRotulo, lineHeight: 1.1 }}
                  className="font-semibold break-words"
                >
                  {traduzirComoSoube(d.comoSoube)}
                </span>
                <span
                  style={{ fontSize: fonteRotulo + 3 }}
                  className="font-extrabold"
                >
                  {d.total}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {dados.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          O tamanho do círculo é proporcional à quantidade de respostas do canal.
        </p>
      )}
    </div>
  )
}
