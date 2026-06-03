'use client'

// Registra uma única vez os elementos do Chart.js usados no projeto.
// Componentes de gráfico importam este módulo pelo efeito colateral.
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
)

// Paleta para fatias/categorias
export const PALETA = [
  '#4f46e5', // indigo-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
  '#db2777', // pink-600
  '#2563eb', // blue-600
  '#65a30d', // lime-600
  '#0d9488', // teal-600
]

export const cor = (i: number) => PALETA[i % PALETA.length]
