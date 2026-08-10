'use client'

import { useEffect, useState } from 'react'

interface EmpOption {
  id: number
  nome: string
}

interface Usuario {
  id: number
  usuario: string
  criadoEm: string
  empreendimentoId: number | null
  empreendimento: { id: number; nome: string } | null
}

interface FormState {
  id: number | null // null = criando
  usuario: string
  senha: string
  empreendimentoId: string
}

const vazio: FormState = { id: null, usuario: '', senha: '', empreendimentoId: '' }

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [empreendimentos, setEmpreendimentos] = useState<EmpOption[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormState>(vazio)
  const [salvando, setSalvando] = useState(false)
  const [processando, setProcessando] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  const editando = form.id !== null

  const carregar = async () => {
    setCarregando(true)
    try {
      const [ru, re] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/empreendimentos'),
      ])
      const us = ru.ok ? await ru.json() : []
      const es = re.ok ? await re.json() : []
      setUsuarios(Array.isArray(us) ? us : [])
      setEmpreendimentos(
        Array.isArray(es) ? es.map((e: any) => ({ id: e.id, nome: e.nome })) : []
      )
    } catch (e) {
      console.error('Erro ao carregar usuários:', e)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const abrirCriar = () => {
    setErro('')
    setForm(vazio)
    setModalAberto(true)
  }

  const abrirEditar = (u: Usuario) => {
    setErro('')
    setForm({
      id: u.id,
      usuario: u.usuario,
      senha: '',
      empreendimentoId: u.empreendimentoId ? String(u.empreendimentoId) : '',
    })
    setModalAberto(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      let res: Response
      if (editando) {
        // Edição: renomear / trocar empreendimento / (opcional) redefinir senha
        const body: Record<string, unknown> = {
          usuario: form.usuario,
          empreendimentoId: Number(form.empreendimentoId),
        }
        if (form.senha) body.novaSenha = form.senha
        res = await fetch(`/api/usuarios/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario: form.usuario,
            senha: form.senha,
            empreendimentoId: Number(form.empreendimentoId),
          }),
        })
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message || 'Erro ao salvar')
      }
      setModalAberto(false)
      setForm(vazio)
      await carregar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (u: Usuario) => {
    if (!confirm(`Excluir o usuário "${u.usuario}"? Esta ação não pode ser desfeita.`))
      return
    setProcessando(u.id)
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e) {
      console.error(e)
      alert('Não foi possível excluir o usuário.')
    } finally {
      setProcessando(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-1">
        <h2 className="text-2xl font-bold text-gray-900">Usuários de acesso</h2>
        <button
          onClick={abrirCriar}
          disabled={empreendimentos.length === 0}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          + Novo usuário
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Acesso restrito: cada usuário enxerga apenas o empreendimento vinculado
        (Dashboard, Relatórios e Imobiliárias) e não acessa Configurações.
      </p>

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : usuarios.length === 0 ? (
        <p className="text-gray-500 py-6 text-center">
          Nenhum usuário de acesso restrito cadastrado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Empreendimento
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td
                    className="px-4 py-4 text-sm font-medium text-gray-900"
                    translate="no"
                  >
                    {u.usuario}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {u.empreendimento?.nome || (
                      <span className="text-red-600">(sem empreendimento)</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(u)}
                        disabled={processando === u.id}
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {processando === u.id ? '...' : 'Excluir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editando ? 'Editar usuário' : 'Novo usuário'}
            </h3>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário (login)
                </label>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                  required
                  className={inputClass}
                  placeholder="ex: gestor.vivai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empreendimento de acesso
                </label>
                <select
                  value={form.empreendimentoId}
                  onChange={(e) =>
                    setForm({ ...form, empreendimentoId: e.target.value })
                  }
                  required
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {empreendimentos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  required={!editando}
                  minLength={6}
                  className={inputClass}
                  placeholder={editando ? '••••••' : 'Mínimo 6 caracteres'}
                />
              </div>

              {erro && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {erro}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
