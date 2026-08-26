'use client'

import { useEffect, useState } from 'react'

interface Motivo {
  id: number
  nome: string
  ativo: boolean
}

export default function GerenciarMotivosLost() {
  const [motivos, setMotivos] = useState<Motivo[]>([])
  const [novo, setNovo] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [processando, setProcessando] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  const carregar = async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/motivos-lost')
      setMotivos(res.ok ? await res.json() : [])
    } catch (e) {
      console.error('Erro ao carregar motivos:', e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!novo.trim()) return
    setSalvando(true)
    try {
      const res = await fetch('/api/motivos-lost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novo.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message || 'Erro ao adicionar')
      }
      setNovo('')
      await carregar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao adicionar')
    } finally {
      setSalvando(false)
    }
  }

  const toggle = async (m: Motivo) => {
    setProcessando(m.id)
    try {
      const res = await fetch(`/api/motivos-lost/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !m.ativo }),
      })
      if (!res.ok) throw new Error('Erro')
      setMotivos((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, ativo: !x.ativo } : x))
      )
    } catch (e) {
      console.error(e)
      alert('Não foi possível atualizar o motivo.')
    } finally {
      setProcessando(null)
    }
  }

  const inputClass =
    'flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Motivos de Lost</h2>
      <p className="text-sm text-gray-500 mb-4">
        Opções do campo &quot;Motivo de lost&quot; (em Registros de Visitas →
        Detalhes). Inativar remove da lista, mas mantém o histórico e os
        gráficos das visitas que já usam o motivo.
      </p>

      <form onSubmit={adicionar} className="flex flex-wrap gap-2 mb-4 max-w-2xl">
        <input
          type="text"
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Ex.: Preço acima do orçamento"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={salvando || !novo.trim()}
          className="bg-indigo-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Adicionando...' : '+ Adicionar'}
        </button>
      </form>
      {erro && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 max-w-2xl">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : motivos.length === 0 ? (
        <p className="text-gray-500 py-4">Nenhum motivo cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-gray-200 max-w-2xl">
          {motivos.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2.5">
              <span
                className={`text-sm ${m.ativo ? 'text-gray-900' : 'text-gray-400 line-through'}`}
              >
                {m.nome}
                {!m.ativo && (
                  <span className="ml-2 text-xs no-underline text-gray-400">
                    (inativo)
                  </span>
                )}
              </span>
              <button
                onClick={() => toggle(m)}
                disabled={processando === m.id}
                className={`text-sm font-medium disabled:opacity-50 ${
                  m.ativo
                    ? 'text-red-600 hover:text-red-700'
                    : 'text-green-600 hover:text-green-700'
                }`}
              >
                {processando === m.id ? '...' : m.ativo ? 'Inativar' : 'Reativar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
