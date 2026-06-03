'use client'

import { useEffect, useRef, useState } from 'react'

interface Imobiliaria {
  id: number
  nome: string
}

export default function GerenciarImobiliarias() {
  const [lista, setLista] = useState<Imobiliaria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const res = await fetch('/api/imobiliarias')
      setLista(await res.json())
    } catch {
      // silencioso
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
    setMensagem('')
    const nome = novoNome.trim()
    if (!nome) return
    setSalvando(true)
    try {
      const res = await fetch('/api/imobiliarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.message || 'Erro ao cadastrar')
      }
      setNovoNome('')
      setMensagem(`"${nome}" cadastrada.`)
      await carregar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao cadastrar')
    } finally {
      setSalvando(false)
    }
  }

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setMensagem('')
    setImportando(true)
    try {
      // Carrega o SheetJS sob demanda
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const linhas = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
      // Pega a primeira coluna de cada linha
      const nomes = linhas
        .map((linha) => (Array.isArray(linha) ? linha[0] : ''))
        .map((v) => (v == null ? '' : String(v)))

      const res = await fetch('/api/imobiliarias/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro na importação')

      setMensagem(
        `Importação concluída: ${data.criados} nova(s), ${data.ignorados} já existia(m).`
      )
      await carregar()
    } catch (e: any) {
      setErro(e.message || 'Não foi possível ler a planilha')
    } finally {
      setImportando(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const excluir = async (imob: Imobiliaria) => {
    if (!confirm(`Excluir "${imob.nome}" do cadastro de imobiliárias?`)) return
    try {
      const res = await fetch(`/api/imobiliarias/${imob.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setLista((prev) => prev.filter((i) => i.id !== imob.id))
    } catch {
      alert('Não foi possível excluir.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Imobiliárias</h2>

      {/* Cadastro individual */}
      <form onSubmit={adicionar} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nome da imobiliária"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
        />
        <button
          type="submit"
          disabled={salvando}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {salvando ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      {/* Importação em massa */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">
            Importar de planilha (Excel/CSV)
          </p>
          <p className="text-xs text-gray-500">
            A primeira coluna deve conter os nomes das imobiliárias.
          </p>
        </div>
        <label className="bg-white border-2 border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-50 cursor-pointer transition-colors text-center">
          {importando ? 'Importando...' : 'Escolher arquivo'}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={importar}
            disabled={importando}
            className="hidden"
          />
        </label>
      </div>

      {mensagem && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">
          {mensagem}
        </p>
      )}
      {erro && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4">
          {erro}
        </p>
      )}

      {/* Lista */}
      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Nenhuma imobiliária cadastrada ainda.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-2">
            {lista.length} imobiliária(s) cadastrada(s)
          </p>
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
            {lista.map((imob) => (
              <li
                key={imob.id}
                className="flex justify-between items-center px-4 py-2"
              >
                <span className="text-sm text-gray-800">{imob.nome}</span>
                <button
                  onClick={() => excluir(imob)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
