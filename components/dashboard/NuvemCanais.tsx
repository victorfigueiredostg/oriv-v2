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

  // Escala de fonte pela contagem (14px..34px) com um teto por largura: rótulos
  // longos têm a fonte reduzida para caberem em uma linha dentro do card.
  const LARGURA_CHAR_EM = 0.6 // aprox. da largura média de um caractere (bold)
  const ORCAMENTO_PX = 300 // largura útil conservadora do card
  const tamanho = (n: number, len: number) => {
    const base =
      max === min ? 24 : Math.round(14 + ((n - min) / (max - min)) * 20)
    const capLargura = Math.floor(ORCAMENTO_PX / (len * LARGURA_CHAR_EM))
    return Math.max(13, Math.min(base, capLargura))
  }

  return (
    <div className="flex flex-wrap items-center justify-center content-center gap-x-4 gap-y-2 min-h-[220px] py-4 w-full overflow-hidden">
      {dados.map((d, i) => {
        const rotulo = traduzirComoSoube(d.comoSoube)
        const sz = tamanho(d._count, rotulo.length)
        const op = max === min ? 1 : 0.55 + 0.45 * (d._count / max)
        return (
          <span
            key={d.comoSoube}
            title={`${rotulo}: ${d._count}`}
            style={{
              fontSize: `${sz}px`,
              lineHeight: 1.1,
              color: PALETA[i % PALETA.length],
              opacity: op,
              fontWeight: sz >= 30 ? 800 : sz >= 22 ? 700 : 600,
            }}
            className="whitespace-nowrap max-w-full"
          >
            {rotulo}
          </span>
        )
      })}
    </div>
  )
}
