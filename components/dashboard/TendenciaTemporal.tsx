'use client'

import { Line } from 'react-chartjs-2'

interface SerieItem {
  dia: string // YYYY-MM-DD
  total: number
}

interface Crescimento {
  atual: number
  anterior: number
  percentual: number
}

export default function TendenciaTemporal({
  serie,
  crescimento,
}: {
  serie: SerieItem[]
  crescimento: Crescimento
}) {
  const positivo = crescimento.percentual >= 0

  const formatarDia = (iso: string) => {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  const chartData = {
    labels: serie.map((s) => formatarDia(s.dia)),
    datasets: [
      {
        label: 'Visitas',
        data: serie.map((s) => s.total),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: serie.length > 31 ? 0 : 3,
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Tendência de visitas
        </h2>
        {serie.length === 0 ? (
          <p className="text-sm text-gray-500">Sem dados no período.</p>
        ) : (
          <Line
            data={chartData}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Comparativo de período
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-gray-600 text-sm">Período atual</span>
            <span className="text-2xl font-bold text-indigo-600">
              {crescimento.atual}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-gray-600 text-sm">Período anterior</span>
            <span className="text-2xl font-bold text-gray-400">
              {crescimento.anterior}
            </span>
          </div>
          <div className="flex justify-between items-baseline border-t border-gray-100 pt-3">
            <span className="text-gray-600 text-sm">Variação</span>
            <span
              className={`text-2xl font-bold ${
                positivo ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {positivo ? '↑' : '↓'} {Math.abs(crescimento.percentual)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
