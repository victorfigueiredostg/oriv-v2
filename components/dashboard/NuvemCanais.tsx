'use client'

import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

// Cada canal é um círculo com área proporcional à quantidade (via raiz
// quadrada), com o número dentro e o nome embaixo. Ordenados do maior para o
// menor para deixar claro qual canal lidera.
export default function NuvemCanais({ data }: { data: Item[] }) {
  const dados = [...data]
    .filter((d) => d._count > 0)
    .sort((a, b) => b._count - a._count)

  if (dados.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const max = dados[0]._count

  // Diâmetro 44px..120px, escalado pela raiz (área ∝ contagem)
  const diametro = (n: number) => {
    const t = Math.sqrt(n) / Math.sqrt(max)
    return Math.round(44 + t * 76)
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-5 py-4">
      {dados.map((d, i) => {
        const size = diametro(d._count)
        const rotulo = traduzirComoSoube(d.comoSoube)
        return (
          <div
            key={d.comoSoube}
            className="flex flex-col items-center gap-1.5"
            style={{ width: Math.max(size, 72) }}
          >
            <div
              title={`${rotulo}: ${d._count}`}
              style={{
                width: size,
                height: size,
                backgroundColor: PALETA[i % PALETA.length],
                fontSize: Math.max(13, Math.round(size * 0.34)),
              }}
              className="rounded-full flex items-center justify-center text-white font-extrabold shadow-sm shrink-0"
            >
              {d._count}
            </div>
            <span className="text-xs text-gray-700 text-center leading-tight break-words">
              {rotulo}
            </span>
          </div>
        )
      })}
    </div>
  )
}
