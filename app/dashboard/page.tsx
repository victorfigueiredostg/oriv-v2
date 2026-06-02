'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardData {
  totalVisitas: number
  visitasPorDia: any[]
  visitasPorComoChegou: any[]
  visitasPorComoSoube: any[]
  topCorretores: any[]
  topImobiliarias: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [periodo, setPeriodo] = useState('30')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      carregarDashboard()
    }
  }, [status, periodo])

  const carregarDashboard = async () => {
    setCarregando(true)
    try {
      const response = await fetch(`/api/dashboard?periodo=${periodo}`)
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setCarregando(false)
    }
  }

  const traduzirComoChegou = (valor: string) => {
    const traducoes: Record<string, string> = {
      AGENDADO_CORRETOR: 'Agendado',
      CLIENTE_PASSANTE: 'Passante',
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
      STAND_CENTRAL_VENDAS: 'Stand/Central',
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                {session?.user?.empreendimento?.nome || 'Visão Geral'}
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
              {session?.user?.role === 'STAND' && (
                <Link
                  href="/visita"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  + Nova Visita
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Total de Visitas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total de Visitas
                </p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {data?.totalVisitas || 0}
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Como Chegou */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Como Chegou no Stand
            </h2>
            <div className="space-y-3">
              {data?.visitasPorComoChegou.map((item) => (
                <div key={item.comoChegou} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {traduzirComoChegou(item.comoChegou)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item._count} visitas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${(item._count / (data?.totalVisitas || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Como Soube */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Como Ficou Sabendo
            </h2>
            <div className="space-y-2">
              {data?.visitasPorComoSoube
                .sort((a, b) => b._count - a._count)
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.comoSoube}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {traduzirComoSoube(item.comoSoube)}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {item._count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Top Corretores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Corretores
            </h2>
            <div className="space-y-2">
              {data?.topCorretores.slice(0, 10).map((item, index) => (
                <div
                  key={item.corretor}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {item.corretor}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    {item._count} visitas
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Imobiliárias */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Imobiliárias
            </h2>
            <div className="space-y-2">
              {data?.topImobiliarias.slice(0, 10).map((item, index) => (
                <div
                  key={item.imobiliaria}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {item.imobiliaria}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    {item._count} visitas
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botões de navegação */}
        <div className="flex gap-4">
          {session?.user?.role === 'ADMIN' ? (
            <Link
              href="/admin"
              className="flex-1 text-center bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 border-2 border-indigo-600 transition-colors"
            >
              ← Voltar ao Painel
            </Link>
          ) : (
            <>
              <Link
                href="/visitas"
                className="flex-1 text-center bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 border-2 border-indigo-600 transition-colors"
              >
                Ver Todas as Visitas
              </Link>
              <Link
                href="/visita"
                className="flex-1 text-center bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 border-2 border-indigo-600 transition-colors"
              >
                Registrar Nova Visita
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
