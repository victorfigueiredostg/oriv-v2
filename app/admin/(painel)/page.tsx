'use client'

import { useEffect, useState } from 'react'
import FiltrosVisitas, {
  filtrosPadrao,
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import '@/components/charts/registrarChart'
import OrigemPizza from '@/components/dashboard/OrigemPizza'
import CruzamentoTipoOrigem from '@/components/dashboard/CruzamentoTipoOrigem'
import TendenciaTemporal from '@/components/dashboard/TendenciaTemporal'
import HeatmapDiaHora from '@/components/dashboard/HeatmapDiaHora'

interface DashboardData {
  totalVisitas: number
  mediaIdade: { media: number | null; qtd: number }
  crescimento: { atual: number; anterior: number; percentual: number }
  visitasPorComoSoube: { comoSoube: string; _count: number }[]
  topCorretores: { corretor: string; _count: number }[]
  topImobiliarias: { imobiliaria: string; _count: number }[]
  rankEmpreendimentos: { nome: string; total: number }[]
  crossTipoOrigem: { comoChegou: string; comoSoube: string; _count: number }[]
  serieTemporal: { dia: string; total: number }[]
  matrizDiaHora: { matriz: number[][]; totaisDia: number[] }
}

// Barra horizontal simples para o ranking de empreendimentos
function Barra({
  label,
  valor,
  max,
}: {
  label: string
  valor: number
  max: number
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
          className="bg-purple-600 h-2.5 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [filtros, setFiltros] = useState<FiltrosVisitasValue>(filtrosPadrao)
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

  const maxEmp = Math.max(
    1,
    ...(data?.rankEmpreendimentos.map((i) => i.total) || [0])
  )

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <FiltrosVisitas value={filtros} onChange={setFiltros} />

      {carregando || !data ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Cartões-resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-sm font-medium text-gray-600">
                Total de visitas
              </p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {data.totalVisitas}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <p className="text-sm font-medium text-gray-600">
                Média de idade do lead
              </p>
              <p className="text-4xl font-bold text-purple-600 mt-2">
                {data.mediaIdade.media != null
                  ? `${data.mediaIdade.media} anos`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.mediaIdade.qtd > 0
                  ? `Baseado em ${data.mediaIdade.qtd} lead(s) com idade informada`
                  : 'Nenhum lead com idade informada no filtro'}
              </p>
            </div>
          </div>

          {/* Tendência + comparativo de período */}
          <TendenciaTemporal
            serie={data.serieTemporal}
            crescimento={data.crescimento}
          />

          {/* Origem do lead */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Origem do lead
            </h2>
            <OrigemPizza data={data.visitasPorComoSoube} />
          </div>

          {/* Cruzamento Tipo de Visita x Origem */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tipo de Visita × Origem
            </h2>
            <CruzamentoTipoOrigem data={data.crossTipoOrigem} />
          </div>

          {/* Heatmap dia da semana x hora */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Visitas por dia da semana e hora
            </h2>
            <HeatmapDiaHora
              matriz={data.matrizDiaHora.matriz}
              totaisDia={data.matrizDiaHora.totaisDia}
            />
          </div>

          {/* Rank de empreendimentos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Empreendimentos com mais visitas
            </h2>
            <div className="space-y-3">
              {data.rankEmpreendimentos.map((item, i) => (
                <Barra
                  key={item.nome}
                  label={`#${i + 1}  ${item.nome}`}
                  valor={item.total}
                  max={maxEmp}
                />
              ))}
              {data.rankEmpreendimentos.length === 0 && (
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
                {data.topCorretores.map((item, i) => (
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
                {data.topCorretores.length === 0 && (
                  <p className="text-sm text-gray-500">Sem dados no período.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Top Imobiliárias
              </h2>
              <div className="space-y-2">
                {data.topImobiliarias.map((item, i) => (
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
                {data.topImobiliarias.length === 0 && (
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
