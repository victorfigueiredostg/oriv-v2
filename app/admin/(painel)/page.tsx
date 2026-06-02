'use client'

import { useEffect, useState } from 'react'
import FiltrosVisitas, {
  FILTROS_PADRAO,
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import { traduzirComoChegou, traduzirComoSoube } from '@/lib/labels'

interface DashboardData {
  totalVisitas: number
  crescimento: { atual: number; anterior: number; percentual: number }
  visitasPorComoChegou: { comoChegou: string; _count: number }[]
  visitasPorComoSoube: { comoSoube: string; _count: number }[]
  topCorretores: { corretor: string; _count: number }[]
  topImobiliarias: { imobiliaria: string; _count: number }[]
  rankEmpreendimentos: { nome: string; total: number }[]
}

// Barra horizontal simples (sem biblioteca de gráficos)
function Barra({
  label,
  valor,
  max,
  cor = 'bg-indigo-600',
}: {
  label: string
  valor: number
  max: number
  cor?: string
}) {
  const pct = max > 0 ? (valor / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{valor}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${cor} h-2.5 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [filtros, setFiltros] = useState<FiltrosVisitasValue>(FILTROS_PADRAO)
  const [data, setData] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      try {
        const res = await fetch(`/api/dashboard?${filtrosParaQuery(filtros)}`)
        setData(await res.json())
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [filtros])

  const cresc = data?.crescimento
  const positivo = (cresc?.percentual ?? 0) >= 0

  const maxSoube = Math.max(
    1,
    ...(data?.visitasPorComoSoube.map((i) => i._count) || [0])
  )
  const maxChegou = Math.max(
    1,
    ...(data?.visitasPorComoChegou.map((i) => i._count) || [0])
  )
  const maxEmp = Math.max(
    1,
    ...(data?.rankEmpreendimentos.map((i) => i.total) || [0])
  )

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <FiltrosVisitas value={filtros} onChange={setFiltros} />

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Indicadores de crescimento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-gray-600 text-sm font-medium">
                Visitas no período
              </p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {data?.totalVisitas ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-gray-600 text-sm font-medium">
                Período anterior
              </p>
              <p className="text-4xl font-bold text-gray-400 mt-2">
                {cresc?.anterior ?? 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-gray-600 text-sm font-medium">Crescimento</p>
              <p
                className={`text-4xl font-bold mt-2 ${
                  positivo ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {positivo ? '↑' : '↓'} {Math.abs(cresc?.percentual ?? 0)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origem do lead */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Origem do lead
              </h2>
              <div className="space-y-3">
                {data?.visitasPorComoSoube
                  .slice()
                  .sort((a, b) => b._count - a._count)
                  .map((item) => (
                    <Barra
                      key={item.comoSoube}
                      label={traduzirComoSoube(item.comoSoube)}
                      valor={item._count}
                      max={maxSoube}
                    />
                  ))}
                {(!data || data.visitasPorComoSoube.length === 0) && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </div>

            {/* Como chegou ao stand */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Como chegou ao stand
              </h2>
              <div className="space-y-3">
                {data?.visitasPorComoChegou
                  .slice()
                  .sort((a, b) => b._count - a._count)
                  .map((item) => (
                    <Barra
                      key={item.comoChegou}
                      label={traduzirComoChegou(item.comoChegou)}
                      valor={item._count}
                      max={maxChegou}
                      cor="bg-green-600"
                    />
                  ))}
                {(!data || data.visitasPorComoChegou.length === 0) && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </div>
          </div>

          {/* Rank de empreendimentos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Empreendimentos com mais visitas
            </h2>
            <div className="space-y-3">
              {data?.rankEmpreendimentos.map((item, i) => (
                <Barra
                  key={item.nome}
                  label={`#${i + 1}  ${item.nome}`}
                  valor={item.total}
                  max={maxEmp}
                  cor="bg-purple-600"
                />
              ))}
              {(!data || data.rankEmpreendimentos.length === 0) && (
                <p className="text-sm text-gray-500">Sem dados no período.</p>
              )}
            </div>
          </div>

          {/* Rankings auxiliares */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Top Corretores
              </h2>
              <div className="space-y-2">
                {data?.topCorretores.map((item, i) => (
                  <div
                    key={item.corretor}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <span className="text-sm text-gray-700">
                      <span className="text-gray-400 font-bold mr-2">
                        #{i + 1}
                      </span>
                      {item.corretor}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {item._count}
                    </span>
                  </div>
                ))}
                {(!data || data.topCorretores.length === 0) && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Top Imobiliárias
              </h2>
              <div className="space-y-2">
                {data?.topImobiliarias.map((item, i) => (
                  <div
                    key={item.imobiliaria}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <span className="text-sm text-gray-700">
                      <span className="text-gray-400 font-bold mr-2">
                        #{i + 1}
                      </span>
                      {item.imobiliaria}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {item._count}
                    </span>
                  </div>
                ))}
                {(!data || data.topImobiliarias.length === 0) && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
