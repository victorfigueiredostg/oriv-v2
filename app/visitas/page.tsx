'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  cvStatus: string | null
  cvConfirmadoEm: string | null
  salvoEm: string
  usuario: { usuario: string }
  empreendimento: { nome: string }
}

function BadgeCv({ status }: { status: string | null }) {
  const map: Record<string, { txt: string; cls: string }> = {
    CADASTRADO: { txt: 'Cadastrado', cls: 'bg-green-100 text-green-700' },
    NAO_CADASTRADO: { txt: 'Não cadastrado', cls: 'bg-red-100 text-red-700' },
    NAO_PREENCHEU: { txt: 'Não preencheu', cls: 'bg-gray-200 text-gray-600' },
  }
  const item = status ? map[status] : null
  if (!item) {
    return <span className="text-gray-400 text-xs">não verificado</span>
  }
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${item.cls}`}
    >
      {item.txt}
    </span>
  )
}

export default function VisitasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [visitas, setVisitas] = useState<Visita[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [confirmando, setConfirmando] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const carregar = async () => {
      setCarregando(true)
      try {
        const p = new URLSearchParams({ page: String(page), limit: '20' })
        if (dataInicio) p.set('dataInicio', dataInicio)
        if (dataFim) p.set('dataFim', dataFim)
        const response = await fetch(`/api/visitas?${p.toString()}`)
        const data = await response.json()
        setVisitas(data.visitas || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Erro ao carregar visitas:', error)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [status, page, dataInicio, dataFim])

  const mudarData = (campo: 'inicio' | 'fim', valor: string) => {
    setPage(1)
    if (campo === 'inicio') setDataInicio(valor)
    else setDataFim(valor)
  }

  const confirmar = async (id: number) => {
    setConfirmando(id)
    try {
      const res = await fetch(`/api/visitas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmar: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setVisitas((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, cvConfirmadoEm: data.cvConfirmadoEm } : v
          )
        )
      }
    } catch {
      alert('Não foi possível confirmar.')
    } finally {
      setConfirmando(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Visitas Registradas
            </h1>
            <Link
              href="/visita"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              + Nova Visita
            </Link>
          </div>

          {/* Filtro de data */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data início
              </label>
              <input
                type="date"
                value={dataInicio}
                max={dataFim || undefined}
                onChange={(e) => mudarData('inicio', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data fim
              </label>
              <input
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                onChange={(e) => mudarData('fim', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            {(dataInicio || dataFim) && (
              <button
                onClick={() => {
                  setPage(1)
                  setDataInicio('')
                  setDataFim('')
                }}
                className="self-end text-sm text-indigo-600 hover:text-indigo-700 font-medium pb-2"
              >
                Limpar
              </button>
            )}
          </div>

          {carregando ? (
            <p className="text-gray-500 py-8 text-center">Carregando...</p>
          ) : visitas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhuma visita encontrada.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {[
                        'Data/Hora',
                        'Cliente',
                        'Corretor',
                        'Imobiliária',
                        'Tipo de Visita',
                        'Origem',
                        ...(isAdmin ? ['Empreendimento'] : []),
                        'CV',
                        'Confirmação',
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
                    {visitas.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {formatarDataHora(v.salvoEm)}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {v.nomeCliente}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {v.corretor}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {v.imobiliaria}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {traduzirComoChegou(v.comoChegou)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {traduzirComoSoube(v.comoSoube)}
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {v.empreendimento.nome}
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm">
                          <BadgeCv status={v.cvStatus} />
                        </td>
                        <td className="px-3 py-2 text-sm whitespace-nowrap">
                          {v.cvConfirmadoEm ? (
                            <span className="text-green-700 font-medium">
                              ✓ {formatarDataHora(v.cvConfirmadoEm)}
                            </span>
                          ) : v.cvStatus === 'CADASTRADO' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <button
                              onClick={() => confirmar(v.id)}
                              disabled={confirmando === v.id}
                              className="text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                            >
                              {confirmando === v.id
                                ? '...'
                                : 'Confirmar cadastro'}
                            </button>
                          )}
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

        <div className="text-center">
          <Link
            href="/visita"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Voltar para Registro
          </Link>
        </div>
      </div>
    </div>
  )
}
