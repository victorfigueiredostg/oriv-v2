'use client'

import { Doughnut } from 'react-chartjs-2'
import { PALETA } from '@/components/charts/registrarChart'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoSoube: string
  _count: number
}

export default function OrigemPizza({ data }: { data: Item[] }) {
  const ordenado = [...data].sort((a, b) => b._count - a._count)
  const total = ordenado.reduce((acc, i) => acc + i._count, 0)

  if (total === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const chartData = {
    labels: ordenado.map((i) => traduzirComoSoube(i.comoSoube)),
    datasets: [
      {
        data: ordenado.map((i) => i._count),
        backgroundColor: ordenado.map((_, i) => PALETA[i % PALETA.length]),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }

  return (
    <div className="max-w-sm mx-auto">
      <Doughnut
        data={chartData}
        options={{
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = ctx.parsed as number
                  const pct = Math.round((v / total) * 100)
                  return `${ctx.label}: ${v} (${pct}%)`
                },
              },
            },
          },
        }}
      />
    </div>
  )
}
