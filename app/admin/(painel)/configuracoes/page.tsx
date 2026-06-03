'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import GerenciarImobiliarias from '@/components/GerenciarImobiliarias'

interface Empreendimento {
  id: number
  nome: string
  slug: string
  ativo: boolean
  _count: { visitas: number; usuarios: number }
}

export default function ConfiguracoesPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState<number | null>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/empreendimentos')
      setEmpreendimentos(await res.json())
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const toggleAtivo = async (emp: Empreendimento) => {
    const acao = emp.ativo ? 'desativar' : 'ativar'
    if (
      emp.ativo &&
      !confirm(
        `Desativar "${emp.nome}"? Ele deixará de aparecer na landing, mas o histórico de visitas é preservado.`
      )
    ) {
      return
    }

    setProcessando(emp.id)
    try {
      const res = await fetch(`/api/empreendimentos/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !emp.ativo }),
      })
      if (!res.ok) throw new Error(`Erro ao ${acao}`)
      setEmpreendimentos((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, ativo: !e.ativo } : e))
      )
    } catch (error) {
      console.error(error)
      alert(`Não foi possível ${acao} o empreendimento.`)
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <Link
          href="/admin/empreendimentos/novo"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Novo Empreendimento
        </Link>
      </div>

      <GerenciarImobiliarias />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Empreendimentos cadastrados
        </h2>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : empreendimentos.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">
            Nenhum empreendimento cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Visitas
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empreendimentos.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {emp.nome}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {emp.slug}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-gray-700">
                      {emp._count.visitas}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {emp.ativo ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-4">
                        <Link
                          href={`/admin/empreendimentos/${emp.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => toggleAtivo(emp)}
                          disabled={processando === emp.id}
                          className={`font-medium disabled:opacity-50 ${
                            emp.ativo
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {processando === emp.id
                            ? '...'
                            : emp.ativo
                              ? 'Desativar'
                              : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
