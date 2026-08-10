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
import CruzamentoContatoOnde from '@/components/dashboard/CruzamentoContatoOnde'
import TendenciaAnual from '@/components/dashboard/TendenciaAnual'
import HeatmapDiaHora from '@/components/dashboard/HeatmapDiaHora'
import { traduzirComoSoube } from '@/lib/labels'

interface DashboardData {
  totalVisitas: number
  mediaIdade: { media: number | null; qtd: number }
  crescimento: { atual: number; anterior: number; percentual: number }
  visitasPorComoSoube: { comoSoube: string; _count: number }[]
  ondeMaisViuTotais: { comoSoube: string; _count: number }[]
  cruzamentoContatoOnde: {
    primeiroContato: string
    total: number
    canais: { canal: string; total: number }[]
  }[]
  topCorretores: { corretor: string; imobiliaria: string; _count: number }[]
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

  // Modal de detalhamento ao clicar nos cards
  const [detalheAberto, setDetalheAberto] = useState(false)
  const [detalheTitulo, setDetalheTitulo] = useState('')
  const [detalheVisitas, setDetalheVisitas] = useState<any[]>([])
  const [detalheCarregando, setDetalheCarregando] = useState(false)

  const abrirDetalhe = async (titulo: string, tipo?: string) => {
    setDetalheTitulo(titulo)
    setDetalheAberto(true)
    setDetalheCarregando(true)
    setDetalheVisitas([])
    try {
      const p = new URLSearchParams()
      if (filtros.dataInicio) p.set('dataInicio', filtros.dataInicio)
      if (filtros.dataFim) p.set('dataFim', filtros.dataFim)
      if (filtros.empreendimentoId)
        p.set('empreendimentoId', filtros.empreendimentoId)
      if (filtros.comoSoube) p.set('comoSoube', filtros.comoSoube)
      if (tipo) p.set('comoChegou', tipo)
      else if (filtros.comoChegou) p.set('comoChegou', filtros.comoChegou)
      p.set('limit', '1000')
      const res = await fetch(`/api/visitas?${p.toString()}`)
      const d = await res.json()
      setDetalheVisitas(d.visitas || [])
    } catch {
      setDetalheVisitas([])
    } finally {
      setDetalheCarregando(false)
    }
  }

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

  const somaTipo = (tipo: string) =>
    data?.crossTipoOrigem
      .filter((x) => x.comoChegou === tipo)
      .reduce((s, x) => s + x._count, 0) || 0
  const agendados = somaTipo('AGENDADO_CORRETOR')
  const passantes = somaTipo('CLIENTE_PASSANTE')
  const pctTotal = (n: number) =>
    data && data.totalVisitas ? Math.round((n / data.totalVisitas) * 100) : 0

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <FiltrosVisitas value={filtros} onChange={setFiltros} />

      {carregando || !data ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Cartões-resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => abrirDetalhe('Total de visitas')}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <p className="text-sm font-medium text-gray-600">
                Total de visitas
              </p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {data.totalVisitas}
              </p>
            </div>
            <div
              onClick={() => abrirDetalhe('Agendados', 'AGENDADO_CORRETOR')}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <p className="text-sm font-medium text-gray-600">Agendados</p>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {agendados}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pctTotal(agendados)}% do total
              </p>
            </div>
            <div
              onClick={() => abrirDetalhe('Passantes', 'CLIENTE_PASSANTE')}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <p className="text-sm font-medium text-gray-600">Passantes</p>
              <p className="text-4xl font-bold text-orange-600 mt-2">
                {passantes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pctTotal(passantes)}% do total
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

          {/* Tendência de visitas (anual, por mês) — independente dos filtros */}
          <TendenciaAnual />

          {/* Primeiro contato do Lead (como ficou sabendo) */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Primeiro contato do Lead
            </h2>
            <OrigemPizza data={data.visitasPorComoSoube} />
          </div>

          {/* Origem do Lead — abrange 1º contato + onde mais viu/ouviu */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Outros canais de Origem
            </h2>
            <OrigemPizza data={data.ondeMaisViuTotais} />
          </div>

          {/* Cruzamento: primeiro contato x outros canais */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Primeiro contato × Outros canais
            </h2>
            <CruzamentoContatoOnde data={data.cruzamentoContatoOnde} />
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
                      {item.imobiliaria && (
                        <span className="text-gray-400"> — {item.imobiliaria}</span>
                      )}
                    </span>
                    <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {item._count}{' '}
                      <span className="text-gray-400 font-normal">
                        ({Math.round((item._count / (data.totalVisitas || 1)) * 100)}%)
                      </span>
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
                    <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {item._count}{' '}
                      <span className="text-gray-400 font-normal">
                        ({Math.round((item._count / (data.totalVisitas || 1)) * 100)}%)
                      </span>
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

      {detalheAberto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setDetalheAberto(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {detalheTitulo}
                {!detalheCarregando ? ` (${detalheVisitas.length})` : ''}
              </h3>
              <button
                onClick={() => setDetalheAberto(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto p-4">
              {detalheCarregando ? (
                <p className="text-gray-500">Carregando...</p>
              ) : detalheVisitas.length === 0 ? (
                <p className="text-gray-500">Nenhuma visita encontrada.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                    <tr>
                      {[
                        'Cliente',
                        'Corretor',
                        'Imobiliária',
                        'Primeiro contato',
                        'Onde mais viu',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detalheVisitas.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {v.nomeCliente}
                        </td>
                        <td className="px-3 py-2 text-gray-700" translate="no">
                          {v.corretor}
                        </td>
                        <td className="px-3 py-2 text-gray-700" translate="no">
                          {v.imobiliaria}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {traduzirComoSoube(v.comoSoube)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {v.ondeMaisViu
                            ? v.ondeMaisViu
                                .split(',')
                                .map((x: string) => traduzirComoSoube(x.trim()))
                                .join(', ')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
