'use client'

import { COMO_CHEGOU_OPTIONS, COMO_SOUBE_OPTIONS } from '@/lib/labels'

export interface FiltrosVisitasValue {
  periodo: string // dias
  comoChegou: string // '' = todos
  comoSoube: string // '' = todos
}

export const FILTROS_PADRAO: FiltrosVisitasValue = {
  periodo: '30',
  comoChegou: '',
  comoSoube: '',
}

interface Props {
  value: FiltrosVisitasValue
  onChange: (value: FiltrosVisitasValue) => void
}

const selectClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

export default function FiltrosVisitas({ value, onChange }: Props) {
  const set = (patch: Partial<FiltrosVisitasValue>) =>
    onChange({ ...value, ...patch })

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Período
        </label>
        <select
          value={value.periodo}
          onChange={(e) => set({ periodo: e.target.value })}
          className={selectClass}
        >
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Últimos 12 meses</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Como chegou no stand
        </label>
        <select
          value={value.comoChegou}
          onChange={(e) => set({ comoChegou: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos</option>
          {COMO_CHEGOU_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Origem (como soube)
        </label>
        <select
          value={value.comoSoube}
          onChange={(e) => set({ comoSoube: e.target.value })}
          className={selectClass}
        >
          <option value="">Todas</option>
          {COMO_SOUBE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Monta a query string a partir dos filtros (ignora vazios)
export function filtrosParaQuery(value: FiltrosVisitasValue): string {
  const params = new URLSearchParams()
  if (value.periodo) params.set('periodo', value.periodo)
  if (value.comoChegou) params.set('comoChegou', value.comoChegou)
  if (value.comoSoube) params.set('comoSoube', value.comoSoube)
  return params.toString()
}
