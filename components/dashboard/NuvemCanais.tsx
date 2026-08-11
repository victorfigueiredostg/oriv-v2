'use client'

import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

// Cada canal é um círculo com área proporcional à quantidade (via raiz
// quadrada). O nome e o número ficam dentro do círculo; a lista é ordenada do
// maior para o menor para deixar claro qual canal lidera.
export default function NuvemCanais({ data }: { data: Item[] }) {
  const dados = [...data]
    .filter((d) => d._count > 0)
    .sort((a, b) => b._count - a._count)

  if (dados.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const max = dados[0]._count

  // Diâmetro 76px..176px, escalado pela raiz (área ∝ contagem)
  const diametro = (n: number) => {
    const t = Math.sqrt(n) / Math.sqrt(max)
    return Math.round(76 + t * 100)
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4">
      {dados.map((d, i) => {
        const size = diametro(d._count)
        const rotulo = traduzirComoSoube(d.comoSoube)
        // fonte do nome cai um pouco para rótulos longos; o texto quebra linha
        const fonteNome = Math.max(
          9,
          Math.min(Math.round(size * 0.15), Math.round(size / (rotulo.length * 0.32)))
        )
        return (
          <div
            key={d.comoSoube}
            title={`${rotulo}: ${d._count}`}
            style={{
              width: size,
              height: size,
              backgroundColor: PALETA[i % PALETA.length],
            }}
            className="rounded-full flex flex-col items-center justify-center text-center text-white shadow-sm shrink-0 overflow-hidden p-2"
          >
            <span
              style={{ fontSize: fonteNome, lineHeight: 1.05, maxWidth: size * 0.8 }}
              className="font-semibold break-words"
            >
              {rotulo}
            </span>
            <span
              style={{ fontSize: Math.round(size * 0.19) }}
              className="font-extrabold leading-none mt-0.5"
            >
              {d._count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
