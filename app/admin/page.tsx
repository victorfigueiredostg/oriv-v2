'use client'

import { Fragment, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Empreendimento {
  id: number
  nome: string
  slug: string
  ativo: boolean
  _count: {
    visitas: number
    usuarios: number
  }
}

interface Visita {
  id: number
  nomeCliente: string
  corretor: string
  imobiliaria: string
  comoChegou: string
  comoSoube: string
  salvoEm: string
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

const formatarData = (data: string) =>
  new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [expandidoId, setExpandidoId] = useState<number | null>(null)
  const [visitasPorEmp, setVisitasPorEmp] = useState<Record<number, Visita[]>>({})
  const [carregandoVisitas, setCarregandoVisitas] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
      return
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (status === 'authenticated') {
      carregarDados()
    }
  }, [status])

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const [empResponse, dashResponse] = await Promise.all([
        fetch('/api/empreendimentos'),
        fetch('/api/dashboard?periodo=30'),
      ])

      const empData = await empResponse.json()
      const dashData = await dashResponse.json()

      setEmpreendimentos(empData)
      setStats(dashData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setCarregando(false)
    }
  }

  const toggleVisitas = async (empId: number) => {
    // Fecha se já estiver aberto
    if (expandidoId === empId) {
      setExpandidoId(null)
      return
    }

    setExpandidoId(empId)

    // Busca as visitas só na primeira vez
    if (!visitasPorEmp[empId]) {
      setCarregandoVisitas(empId)
      try {
        const res = await fetch(
          `/api/visitas?empreendimentoId=${empId}&limit=100`
        )
        const data = await res.json()
        setVisitasPorEmp((prev) => ({ ...prev, [empId]: data.visitas || [] }))
      } catch (error) {
        console.error('Erro ao carregar visitas do empreendimento:', error)
        setVisitasPorEmp((prev) => ({ ...prev, [empId]: [] }))
      } finally {
        setCarregandoVisitas(null)
      }
    }
  }

  if (status === 'loading' || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-xl text-white">Carregando...</div>
      </div>
    )
  }

  const totalVisitas = empreendimentos.reduce(
    (acc, emp) => acc + emp._count.visitas,
    0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-gray-600 mt-1">ORIV 2.0</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/empreendimentos/novo"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                + Novo Empreendimento
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total de Empreendimentos
                </p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">
                  {empreendimentos.length}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total de Visitas
                </p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {totalVisitas}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
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

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Visitas (últimos 30 dias)
                </p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {stats?.totalVisitas || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Empreendimentos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Empreendimentos
          </h2>

          {empreendimentos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                Nenhum empreendimento cadastrado ainda.
              </p>
              <Link
                href="/admin/empreendimentos/novo"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                + Criar Primeiro Empreendimento
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Visitas
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Usuários
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {empreendimentos.map((emp) => (
                    <Fragment key={emp.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {emp.nome}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {emp.slug}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full font-semibold">
                            {emp._count.visitas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full font-semibold">
                            {emp._count.usuarios}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          {emp.ativo ? (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => toggleVisitas(emp.id)}
                              className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              {expandidoId === emp.id ? 'Ocultar ▲' : 'Visitas ▼'}
                            </button>
                            <Link
                              href={`/login/${emp.slug}`}
                              target="_blank"
                              className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Abrir →
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {expandidoId === emp.id && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-6 py-4">
                            {carregandoVisitas === emp.id ? (
                              <p className="text-sm text-gray-500 py-4 text-center">
                                Carregando visitas...
                              </p>
                            ) : (visitasPorEmp[emp.id]?.length ?? 0) === 0 ? (
                              <p className="text-sm text-gray-500 py-4 text-center">
                                Nenhuma visita registrada para este empreendimento.
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="border-b border-gray-200">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Data/Hora
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Cliente
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Corretor
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Imobiliária
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Como Chegou
                                      </th>
                                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">
                                        Como Soube
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {visitasPorEmp[emp.id]?.map((v) => (
                                      <tr key={v.id}>
                                        <td className="px-3 py-2 text-sm text-gray-900">
                                          {formatarData(v.salvoEm)}
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
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Links úteis */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/visitas"
            className="flex-1 text-center bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ver Todas as Visitas
          </Link>
        </div>
      </div>
    </div>
  )
}
