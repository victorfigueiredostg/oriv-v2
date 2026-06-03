'use client'

import { Doughnut } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { PALETA, rotuloFatia } from '@/components/charts/registrarChart'
import { traduzirComoChegou, traduzirComoSoube } from '@/lib/labels'

interface Item {
  comoChegou: string
  comoSoube: string
  _count: number
}

export default function CruzamentoTipoOrigem({ data }: { data: Item[] }) {
  // Agrupa por Tipo de Visita
  const tipos = Array.from(new Set(data.map((d) => d.comoChegou)))

  if (tipos.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tipos.map((tipo) => {
        const itens = data
          .filter((d) => d.comoChegou === tipo)
          .sort((a, b) => b._count - a._count)
        const total = itens.reduce((acc, i) => acc + i._count, 0)

        const chartData = {
          labels: itens.map((i) => traduzirComoSoube(i.comoSoube)),
          datasets: [
            {
              data: itens.map((i) => i._count),
              backgroundColor: itens.map((_, i) => PALETA[i % PALETA.length]),
              borderWidth: 1,
              borderColor: '#fff',
            },
          ],
        }

        return (
          <div key={tipo} className="border border-gray-100 rounded-lg p-4">
            <div className="flex justify-between items-baseline mb-3">
              <h3 className="font-bold text-gray-900">
                {traduzirComoChegou(tipo)}
              </h3>
              <span className="text-sm text-gray-500">{total} visitas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="max-w-[180px] mx-auto w-full">
                <Doughnut
                  data={chartData}
                  plugins={[ChartDataLabels]}
                  options={{
                    plugins: {
                      legend: { display: false },
                      datalabels: {
                        color: '#fff',
                        font: { size: 10, weight: 'bold' },
                        formatter: rotuloFatia,
                      },
                    },
                  }}
                />
              </div>

              <ul className="space-y-1">
                {itens.map((i, idx) => {
                  const pct = total > 0 ? Math.round((i._count / total) * 100) : 0
                  return (
                    <li
                      key={i.comoSoube}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-700">
                        <span
                          className="inline-block w-3 h-3 rounded-sm"
                          style={{ backgroundColor: PALETA[idx % PALETA.length] }}
                        />
                        {traduzirComoSoube(i.comoSoube)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {i._count}{' '}
                        <span className="text-gray-400">({pct}%)</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
