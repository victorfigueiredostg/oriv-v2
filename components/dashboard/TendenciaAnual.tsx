'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'

const MESES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export default function TendenciaAnual() {
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [meses, setMeses] = useState<number[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    fetch(`/api/dashboard/tendencia?ano=${ano}`)
      .then((r) => (r.ok ? r.json() : { meses: [] }))
      .then((d) => setMeses(d.meses || []))
      .catch(() => setMeses([]))
      .finally(() => setCarregando(false))
  }, [ano])

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i)

  const chartData = {
    labels: MESES,
    datasets: [
      {
        label: 'Visitas',
        data: MESES.map((_, i) => meses[i] ?? 0),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79,70,229,0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Tendência de visitas (mensal)
        </h2>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="h-80">
        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        )}
      </div>
    </div>
  )
}
