'use client'

import { Fragment, useEffect, useState } from 'react'
import FiltrosVisitas, {
  filtrosPadrao,
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import '@/components/charts/registrarChart'
import { Bar } from 'react-chartjs-2'
import {
  traduzirComoChegou,
  traduzirComoSoube,
  formatarDataHora,
} from '@/lib/labels'

interface ImobAnalise {
  nome: string
  total: number
  agendados: number
  passantes: number
  agendamentoSelena: number
  corretores: { nome: string; total: number }[]
  porEmpreendimento: {
    nome: string
    total: number
    agendados: number
    passantes: number
    agendamentoSelena: number
  }[]
  clientes: {
    nomeCliente: string
    corretor: string
    empreendimento: string
    comoChegou: string
    salvoEm: string
  }[]
}
interface Dados {
  totalGeral: number
  imobiliarias: ImobAnalise[]
}

// Tabela de clientes de uma imobiliária, com filtros por corretor e
// empreendimento. Recebe `key` da imobiliária para resetar ao trocar de linha.
function TabelaClientes({ clientes }: { clientes: ImobAnalise['clientes'] }) {
  const [fCorretor, setFCorretor] = useState('')
  const [fEmp, setFEmp] = useState('')

  const corretores = [...new Set(clientes.map((c) => c.corretor))].sort()
  const empreendimentos = [
    ...new Set(clientes.map((c) => c.empreendimento)),
  ].sort()

  const filtrados = clientes.filter(
    (c) =>
      (!fCorretor || c.corretor === fCorretor) &&
      (!fEmp || c.empreendimento === fEmp)
  )

  const selClass =
    'px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 bg-white'

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h4 className="font-semibold text-gray-800">
          Clientes ({filtrados.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          <select
            value={fCorretor}
            onChange={(e) => setFCorretor(e.target.value)}
            className={selClass}
          >
            <option value="">Todos os corretores</option>
            {corretores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={fEmp}
            onChange={(e) => setFEmp(e.target.value)}
            className={selClass}
          >
            <option value="">Todos os empreendimentos</option>
            {empreendimentos.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          {(fCorretor || fEmp) && (
            <button
              onClick={() => {
                setFCorretor('')
                setFEmp('')
              }}
              className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200 bg-gray-100">
              <th className="text-left font-medium py-2 px-3">Cliente</th>
              <th className="text-left font-medium py-2 px-3">Corretor</th>
              <th className="text-left font-medium py-2 px-3">Empreendimento</th>
              <th className="text-left font-medium py-2 px-3">Tipo</th>
              <th className="text-left font-medium py-2 px-3">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 px-3 text-center text-gray-500">
                  Nenhum cliente para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtrados.map((c, ci) => (
                <tr
                  key={ci}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td
                    className="py-2 px-3 font-medium text-gray-900"
                    translate="no"
                  >
                    {c.nomeCliente}
                  </td>
                  <td className="py-2 px-3 text-gray-700" translate="no">
                    {c.corretor}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {c.empreendimento}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {traduzirComoChegou(c.comoChegou)}
                  </td>
                  <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                    {formatarDataHora(c.salvoEm)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ImobiliariasPage() {
  const [filtros, setFiltros] = useState<FiltrosVisitasValue>(filtrosPadrao)
  const [dados, setDados] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [imobFiltro, setImobFiltro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      try {
        const res = await fetch(
          `/api/imobiliarias-analise?${filtrosParaQuery(filtros)}`
        )
        setDados(await res.json())
      } catch (e) {
        console.error('Erro ao carregar análise:', e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [filtros])

  const totalGeral = dados?.totalGeral || 0
  const pct = (n: number) =>
    totalGeral ? Math.round((n / totalGeral) * 100) : 0

  const exportar = async () => {
    if (!dados) return
    setExportando(true)
    try {
      const XLSX = await import('xlsx')

      const resumo = dados.imobiliarias.map((im) => ({
        Imobiliária: im.nome,
        'Total de visitas': im.total,
        '% do total': `${pct(im.total)}%`,
        Agendados: im.agendados,
        'Agendamento Selena': im.agendamentoSelena,
        Passantes: im.passantes,
      }))

      const porEmp: Record<string, string | number>[] = []
      dados.imobiliarias.forEach((im) =>
        im.porEmpreendimento.forEach((e) =>
          porEmp.push({
            Imobiliária: im.nome,
            Empreendimento: e.nome,
            'Total de visitas': e.total,
            Agendados: e.agendados,
            'Agendamento Selena': e.agendamentoSelena,
            Passantes: e.passantes,
          })
        )
      )

      // Detalhado (todas as visitas do período/filtro)
      const resVis = await fetch(
        `/api/visitas?${filtrosParaQuery(filtros)}&limit=100000`
      )
      const dataVis = await resVis.json()
      const detalhado = (dataVis.visitas || []).map((v: any) => ({
        'Data/Hora': formatarDataHora(v.salvoEm),
        Cliente: v.nomeCliente,
        Telefone: v.telefone || '',
        Corretor: v.corretor,
        Imobiliária: v.imobiliaria,
        Empreendimento: v.empreendimento?.nome || '',
        'Tipo de Visita': traduzirComoChegou(v.comoChegou),
        Origem: traduzirComoSoube(v.comoSoube),
      }))

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(resumo),
        'Resumo'
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(porEmp),
        'Por Empreendimento'
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(detalhado),
        'Detalhado'
      )
      const periodo = `${filtros.dataInicio || 'inicio'}_a_${filtros.dataFim || 'fim'}`
      XLSX.writeFile(wb, `cobranca-imobiliarias_${periodo}.xlsx`)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o Excel.')
    } finally {
      setExportando(false)
    }
  }

  const listaFiltrada = (dados?.imobiliarias || []).filter(
    (i) => !imobFiltro || i.nome === imobFiltro
  )
  // Soma refletindo o filtro: uma imobiliária específica ou todas
  const totalExibido = listaFiltrada.reduce((acc, i) => acc + i.total, 0)
  const top = listaFiltrada.slice(0, 15)
  const chartData = {
    labels: top.map((i) => i.nome),
    datasets: [
      {
        label: 'Visitas',
        data: top.map((i) => i.total),
        backgroundColor: '#4f46e5',
      },
    ],
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Análise de Imobiliárias
        </h1>
        <button
          onClick={exportar}
          disabled={exportando || !dados || totalGeral === 0}
          className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {exportando ? 'Gerando...' : '↓ Exportar Excel (cobrança)'}
        </button>
      </div>

      <FiltrosVisitas value={filtros} onChange={setFiltros} />

      {dados && dados.imobiliarias.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imobiliária
          </label>
          <select
            value={imobFiltro}
            onChange={(e) => setImobFiltro(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas</option>
            {dados.imobiliarias.map((i) => (
              <option key={i.nome} value={i.nome}>
                {i.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {carregando || !dados ? (
        <p className="text-gray-500">Carregando...</p>
      ) : totalGeral === 0 ? (
        <p className="text-gray-500 bg-white rounded-lg shadow p-6">
          Nenhuma visita no período/filtro selecionado.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Gráfico ranking */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Total de Visitas ({totalExibido})
            </h2>
            <div className="h-72">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </div>
          </div>

          {/* Tabela detalhada */}
          <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  {[
                    '#',
                    'Imobiliária',
                    'Visitas',
                    'Agendados',
                    'Agend. Selena',
                    'Passantes',
                    'Corretores',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {listaFiltrada.map((im, i) => (
                  <Fragment key={im.nome}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-400 font-bold">
                        {i + 1}
                      </td>
                      <td
                        className="px-3 py-2 text-sm font-medium text-gray-900"
                        translate="no"
                      >
                        {im.nome}
                      </td>
                      <td className="px-3 py-2 text-sm font-bold text-indigo-600">
                        {im.total}{' '}
                        <span className="text-gray-400 font-normal">
                          ({pct(im.total)}%)
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {im.agendados}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {im.agendamentoSelena}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {im.passantes}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {im.corretores.length}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        <button
                          onClick={() =>
                            setExpandida(expandida === im.nome ? null : im.nome)
                          }
                          aria-expanded={expandida === im.nome}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                            expandida === im.nome
                              ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {expandida === im.nome ? 'Ocultar' : 'Detalhes'}
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              expandida === im.nome ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandida === im.nome && (
                      <tr>
                        <td colSpan={8} className="bg-gray-50 px-3 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">
                                Corretores
                              </h4>
                              <ul className="space-y-1">
                                {im.corretores.map((c) => (
                                  <li
                                    key={c.nome}
                                    className="flex justify-between text-sm"
                                  >
                                    <span className="text-gray-700" translate="no">
                                      {c.nome}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                      {c.total}{' '}
                                      <span className="text-gray-400">
                                        (
                                        {im.total
                                          ? Math.round((c.total / im.total) * 100)
                                          : 0}
                                        %)
                                      </span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">
                                Por empreendimento
                              </h4>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-500 border-b border-gray-200">
                                    <th className="text-left font-medium py-1">
                                      Empreendimento
                                    </th>
                                    <th className="text-center font-medium py-1 px-2">
                                      Agendamento
                                    </th>
                                    <th className="text-center font-medium py-1 px-2">
                                      Ag. Selena
                                    </th>
                                    <th className="text-center font-medium py-1 px-2">
                                      Passante
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {im.porEmpreendimento.map((e) => (
                                    <tr
                                      key={e.nome}
                                      className="border-b border-gray-100"
                                    >
                                      <td className="py-1 text-gray-700">
                                        {e.nome}
                                      </td>
                                      <td className="py-1 px-2 text-center font-medium text-gray-900">
                                        {e.agendados}
                                      </td>
                                      <td className="py-1 px-2 text-center font-medium text-gray-900">
                                        {e.agendamentoSelena}
                                      </td>
                                      <td className="py-1 px-2 text-center font-medium text-gray-900">
                                        {e.passantes}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <TabelaClientes key={im.nome} clientes={im.clientes} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
