'use client'

import { useEffect, useState } from 'react'
import { COMO_CHEGOU_OPTIONS, COMO_SOUBE_OPTIONS } from '@/lib/labels'

export interface FiltrosVisitasValue {
  dataInicio: string // 'YYYY-MM-DD' ('' = sem limite)
  dataFim: string // 'YYYY-MM-DD'
  comoChegou: string // '' = todos
  comoSoube: string // '' = todas
  empreendimentoId: string // '' = todos
}

const dataISO = (d: Date) => d.toISOString().slice(0, 10)

// Padrão: últimos 30 dias (intervalo fechado de hoje-29 até hoje)
export function filtrosPadrao(): FiltrosVisitasValue {
  const hoje = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 29)
  return {
    dataInicio: dataISO(inicio),
    dataFim: dataISO(hoje),
    comoChegou: '',
    comoSoube: '',
    empreendimentoId: '',
  }
}

interface EmpOption {
  id: number
  nome: string
}

interface Props {
  value: FiltrosVisitasValue
  onChange: (value: FiltrosVisitasValue) => void
}

const ctrlClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

export default function FiltrosVisitas({ value, onChange }: Props) {
  const [empreendimentos, setEmpreendimentos] = useState<EmpOption[]>([])

  useEffect(() => {
    fetch('/api/empreendimentos')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setEmpreendimentos(
          Array.isArray(data)
            ? data.map((e: any) => ({ id: e.id, nome: e.nome }))
            : []
        )
      )
      .catch(() => {})
  }, [])

  const set = (patch: Partial<FiltrosVisitasValue>) =>
    onChange({ ...value, ...patch })

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data início
        </label>
        <input
          type="date"
          value={value.dataInicio}
          max={value.dataFim || undefined}
          onChange={(e) => set({ dataInicio: e.target.value })}
          className={ctrlClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data fim
        </label>
        <input
          type="date"
          value={value.dataFim}
          min={value.dataInicio || undefined}
          onChange={(e) => set({ dataFim: e.target.value })}
          className={ctrlClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Empreendimento
        </label>
        <select
          value={value.empreendimentoId}
          onChange={(e) => set({ empreendimentoId: e.target.value })}
          className={ctrlClass}
        >
          <option value="">Todos</option>
          {empreendimentos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Visita
        </label>
        <select
          value={value.comoChegou}
          onChange={(e) => set({ comoChegou: e.target.value })}
          className={ctrlClass}
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
          Origem
        </label>
        <select
          value={value.comoSoube}
          onChange={(e) => set({ comoSoube: e.target.value })}
          className={ctrlClass}
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
  if (value.dataInicio) params.set('dataInicio', value.dataInicio)
  if (value.dataFim) params.set('dataFim', value.dataFim)
  if (value.comoChegou) params.set('comoChegou', value.comoChegou)
  if (value.comoSoube) params.set('comoSoube', value.comoSoube)
  if (value.empreendimentoId)
    params.set('empreendimentoId', value.empreendimentoId)
  return params.toString()
}
