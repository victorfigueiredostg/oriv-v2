'use client'

import { useEffect, useState } from 'react'

export default function ConfigApiCV() {
  const [dominio, setDominio] = useState('')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/config/cv')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDominio(data.dominio || '')
          setEmail(data.email || '')
          setToken(data.token || '')
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErro('')
    setSalvando(true)
    try {
      const res = await fetch('/api/config/cv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominio, email, token }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || 'Erro ao salvar')
      }
      setMsg('Credenciais salvas.')
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">API</h2>
      <p className="text-sm text-gray-500 mb-4">
        Credenciais de integração com o CVCRM (usadas para verificar leads).
      </p>

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <form onSubmit={salvar} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domínio do CVCRM
            </label>
            <input
              type="text"
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              placeholder="https://suaempresa.cvcrm.com.br"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail da API
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com.br"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token da API
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token de integração"
              className={inputClass}
            />
          </div>

          {msg && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              {msg}
            </p>
          )}
          {erro && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {salvando ? 'Salvando...' : 'Salvar credenciais'}
          </button>
        </form>
      )}
    </div>
  )
}
