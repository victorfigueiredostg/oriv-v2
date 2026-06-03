'use client'

import { useEffect, useState } from 'react'
import FiltrosVisitas, {
  filtrosPadrao,
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import {
  traduzirComoChegou,
  traduzirComoSoube,
  formatarDataHora,
} from '@/lib/labels'

interface Visita {
  id: number
  nomeCliente: string
  corretor: string
  imobiliaria: string
  comoChegou: string
  comoSoube: string
  salvoEm: string
  empreendimento: { nome: string }
}

export default function RelatoriosPage() {
  const [filtros, setFiltros] = useState<FiltrosVisitasValue>(filtrosPadrao)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [carregando, setCarregando] = useState(true)

  // Volta para a página 1 quando os filtros mudam
  useEffect(() => {
    setPage(1)
  }, [filtros])

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      try {
        const query = filtrosParaQuery(filtros)
        const res = await fetch(`/api/visitas?${query}&page=${page}&limit=20`)
        const data = await res.json()
        setVisitas(data.visitas || [])
        setTotal(data.pagination?.total || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Erro ao carregar relatório:', error)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [filtros, page])

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Relatórios</h1>

      <FiltrosVisitas value={filtros} onChange={setFiltros} />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-semibold text-gray-900">{total}</span> visita(s)
          no filtro selecionado
        </p>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : visitas.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            Nenhuma visita encontrada para os filtros selecionados.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    {[
                      'Data/Hora',
                      'Empreendimento',
                      'Cliente',
                      'Corretor',
                      'Imobiliária',
                      'Tipo de Visita',
                      'Origem',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visitas.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatarDataHora(v.salvoEm)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {v.empreendimento.nome}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {v.nomeCliente}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {v.corretor}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {v.imobiliaria}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {traduzirComoChegou(v.comoChegou)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {traduzirComoSoube(v.comoSoube)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
