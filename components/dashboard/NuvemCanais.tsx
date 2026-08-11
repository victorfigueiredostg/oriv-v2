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

// Nuvem de palavras dos canais: quanto mais respostas um canal tem, maior a
// palavra. Sem biblioteca externa — só escala de fonte proporcional à contagem.
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
  const min = dados.length ? dados[dados.length - 1].total : 0

  // Escala de fonte: menor 15px, maior 54px (proporcional à contagem)
  const tamanho = (n: number) => {
    if (max === min) return 30
    const t = (n - min) / (max - min)
    return Math.round(15 + t * 39)
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
        <div className="flex justify-center">
          <div className="relative w-full max-w-lg aspect-square rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-200 flex flex-wrap items-center justify-center content-center gap-x-4 gap-y-1 p-12 overflow-hidden">
            {dados.map((d, i) => {
              const sz = tamanho(d.total)
              // opacidade sutil: canais menores ficam levemente mais claros
              const op = max === min ? 1 : 0.55 + 0.45 * (d.total / max)
              return (
                <span
                  key={d.comoSoube}
                  title={`${traduzirComoSoube(d.comoSoube)}: ${d.total}`}
                  style={{
                    fontSize: `${sz}px`,
                    lineHeight: 1.05,
                    color: PALETA[i % PALETA.length],
                    opacity: op,
                    fontWeight: sz >= 34 ? 800 : sz >= 24 ? 700 : 600,
                  }}
                  className="whitespace-nowrap"
                >
                  {traduzirComoSoube(d.comoSoube)}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {dados.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">
          O tamanho da palavra é proporcional à quantidade de respostas do canal.
        </p>
      )}
    </div>
  )
}
