'use client'

import { useState } from 'react'
import { Bar } from 'react-chartjs-2'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  matriz: number[][] // [diaSemana 0-6][hora 0-23]
  totaisDia: number[] // [diaSemana 0-6]
}

export default function HeatmapDiaHora({ matriz, totaisDia }: Props) {
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)

  const totalGeral = totaisDia.reduce((a, b) => a + b, 0)

  // Horas: do dia selecionado, ou soma de todos os dias
  const horas = Array.from({ length: 24 }, (_, h) =>
    diaSelecionado === null
      ? matriz.reduce((acc, dia) => acc + (dia[h] || 0), 0)
      : matriz[diaSelecionado]?.[h] || 0
  )

  const dadosDias = {
    labels: DIAS,
    datasets: [
      {
        label: 'Visitas',
        data: totaisDia,
        backgroundColor: totaisDia.map((_, i) =>
          i === diaSelecionado ? '#dc2626' : '#fca5a5'
        ),
      },
    ],
  }

  const dadosHoras = {
    labels: Array.from({ length: 24 }, (_, h) => `${h}h`),
    datasets: [
      {
        label: 'Visitas',
        data: horas,
        backgroundColor: '#f87171',
      },
    ],
  }

  if (totalGeral === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Clique num dia da semana para ver a distribuição por hora daquele dia.
        </p>
        <Bar
          data={dadosDias}
          options={{
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            onClick: (_evt, elements) => {
              if (elements.length > 0) {
                const idx = elements[0].index
                setDiaSelecionado((atual) => (atual === idx ? null : idx))
              }
            },
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">
            Visitas por hora{' '}
            {diaSelecionado === null
              ? '(todos os dias)'
              : `— ${DIAS[diaSelecionado]}`}
          </h3>
          {diaSelecionado !== null && (
            <button
              onClick={() => setDiaSelecionado(null)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ver todos os dias
            </button>
          )}
        </div>
        <Bar
          data={dadosHoras}
          options={{
            indexAxis: 'y' as const,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
          }}
          height={420}
        />
      </div>
    </div>
  )
}
