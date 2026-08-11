'use client'

import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

// Nuvem de palavras: cada canal é uma palavra agrupada com as demais, com o
// tamanho da fonte proporcional à quantidade de respostas.
export default function NuvemCanais({ data }: { data: Item[] }) {
  const dados = [...data]
    .filter((d) => d._count > 0)
    .sort((a, b) => b._count - a._count)

  if (dados.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const max = dados[0]._count
  const min = dados[dados.length - 1]._count

  // Escala de fonte: menor 15px, maior 46px (proporcional à contagem)
  const tamanho = (n: number) => {
    if (max === min) return 26
    const t = (n - min) / (max - min)
    return Math.round(15 + t * 31)
  }

  return (
    <div className="flex flex-wrap items-center justify-center content-center gap-x-4 gap-y-2 min-h-[220px] py-4">
      {dados.map((d, i) => {
        const sz = tamanho(d._count)
        const op = max === min ? 1 : 0.55 + 0.45 * (d._count / max)
        return (
          <span
            key={d.comoSoube}
            title={`${traduzirComoSoube(d.comoSoube)}: ${d._count}`}
            style={{
              fontSize: `${sz}px`,
              lineHeight: 1.05,
              color: PALETA[i % PALETA.length],
              opacity: op,
              fontWeight: sz >= 32 ? 800 : sz >= 23 ? 700 : 600,
            }}
            className="whitespace-nowrap"
          >
            {traduzirComoSoube(d.comoSoube)}
          </span>
        )
      })}
    </div>
  )
}
