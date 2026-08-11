'use client'

import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

// Hash simples e estável a partir do nome — usado para embaralhar a ordem e
// dar um deslocamento vertical "bagunçado" sem usar Math.random (evita pulos a
// cada render e divergência de hidratação no SSR).
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Cada canal é um círculo com área proporcional à quantidade (escala linear
// para dar bastante contraste entre grandes e pequenos). Só a palavra dentro;
// disposição embaralhada e com alturas variadas.
export default function NuvemCanais({ data }: { data: Item[] }) {
  const dados = [...data]
    .filter((d) => d._count > 0)
    // fora de ordem: embaralha de forma estável pelo hash do nome
    .sort((a, b) => hash(a.comoSoube) - hash(b.comoSoube))

  if (dados.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const max = Math.max(...dados.map((d) => d._count))

  // Diâmetro 42px..156px, linear na contagem → menores ficam bem menores
  const diametro = (n: number) => Math.round(42 + (n / max) * 114)

  return (
    <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-2 py-4">
      {dados.map((d, i) => {
        const size = diametro(d._count)
        const rotulo = traduzirComoSoube(d.comoSoube)
        const offset = hash(d.comoSoube) % 46 // altura variada (0..45px)
        const fonteNome = Math.max(
          9,
          Math.min(
            Math.round(size * 0.16),
            Math.round(size / (rotulo.length * 0.32))
          )
        )
        return (
          <div
            key={d.comoSoube}
            title={`${rotulo}: ${d._count}`}
            style={{
              width: size,
              height: size,
              marginTop: offset,
              backgroundColor: PALETA[i % PALETA.length],
              fontSize: fonteNome,
              lineHeight: 1.05,
            }}
            className="rounded-full flex items-center justify-center text-center text-white font-semibold shadow-sm shrink-0 overflow-hidden p-2 break-words"
          >
            {rotulo}
          </div>
        )
      })}
    </div>
  )
}
