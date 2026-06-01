'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Visita {
  id: number
  nomeCliente: string
  comoChegou: string
  corretor: string
  imobiliaria: string
  comoSoube: string
  salvoEm: string
  usuario: { usuario: string }
  empreendimento: { nome: string }
}

export default function VisitasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      carregarVisitas()
    }
  }, [status, page])

  const carregarVisitas = async () => {
    setCarregando(true)
    try {
      const response = await fetch(`/api/visitas?page=${page}&limit=20`)
      const data = await response.json()
      setVisitas(data.visitas)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Erro ao carregar visitas:', error)
    } finally {
      setCarregando(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const traduzirComoChegou = (valor: string) => {
    const traducoes: Record<string, string> = {
      AGENDADO_CORRETOR: 'Agendado com Corretor',
      CLIENTE_PASSANTE: 'Cliente Passante',
    }
    return traducoes[valor] || valor
  }

  const traduzirComoSoube = (valor: string) => {
    const traducoes: Record<string, string> = {
      INSTAGRAM: 'Instagram',
      FACEBOOK: 'Facebook',
      WHATSAPP: 'WhatsApp',
      CORRETOR: 'Corretor',
      PANFLETO: 'Panfleto',
      TV: 'TV',
      RADIO: 'Rádio',
      STAND_CENTRAL_VENDAS: 'Stand/Central de Vendas',
      INDICACAO: 'Indicação',
      OUTDOOR: 'Outdoor',
      OBRA: 'Obra',
    }
    return traducoes[valor] || valor
  }

  if (status === 'loading' || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
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

          {visitas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhuma visita registrada ainda.
              </p>
              <Link
                href="/visita"
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Registrar primeira visita →
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Data/Hora
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Corretor
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Imobiliária
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Como Chegou
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Como Soube
                      </th>
                      {session?.user?.role === 'ADMIN' && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Empreendimento
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitas.map((visita) => (
                      <tr
                        key={visita.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatarData(visita.salvoEm)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {visita.nomeCliente}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {visita.corretor}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {visita.imobiliaria}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {traduzirComoChegou(visita.comoChegou)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {traduzirComoSoube(visita.comoSoube)}
                        </td>
                        {session?.user?.role === 'ADMIN' && (
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {visita.empreendimento.nome}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
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
