'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export interface EmpreendimentoInicial {
  id: number
  nome: string
  logoUrl: string | null
  iconeUrl: string | null
  ativo: boolean
  usuarioStand?: string
}

interface Props {
  modo: 'criar' | 'editar'
  inicial?: EmpreendimentoInicial
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900'

export default function EmpreendimentoForm({ modo, inicial }: Props) {
  const router = useRouter()
  const editando = modo === 'editar'

  const [nome, setNome] = useState(inicial?.nome || '')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [ativo, setAtivo] = useState(inicial?.ativo ?? true)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [iconeFile, setIconeFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    inicial?.logoUrl || null
  )
  const [iconePreview, setIconePreview] = useState<string | null>(
    inicial?.iconeUrl || null
  )

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: 'logo' | 'icone'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (tipo === 'logo') {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    } else {
      setIconeFile(file)
      setIconePreview(URL.createObjectURL(file))
    }
  }

  const uploadImagem = async (file: File, tipo: 'logo' | 'icone') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('tipo', tipo)
    const response = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Erro ao fazer upload da imagem')
    }
    const data = await response.json()
    return data.url as string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    try {
      // Mantém a URL existente; só faz upload se um novo arquivo foi escolhido
      let logoUrl = inicial?.logoUrl || undefined
      let iconeUrl = inicial?.iconeUrl || undefined
      if (logoFile) logoUrl = await uploadImagem(logoFile, 'logo')
      if (iconeFile) iconeUrl = await uploadImagem(iconeFile, 'icone')

      let response: Response
      if (editando) {
        response = await fetch(`/api/empreendimentos/${inicial!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            logoUrl: logoUrl ?? null,
            iconeUrl: iconeUrl ?? null,
            ativo,
            ...(novaSenha ? { novaSenha } : {}),
          }),
        })
      } else {
        response = await fetch('/api/empreendimentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, logoUrl, iconeUrl, usuario, senha }),
        })
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Erro ao salvar empreendimento')
      }

      router.push('/admin/configuracoes')
      router.refresh()
    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar empreendimento')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Empreendimento *
        </label>
        <input
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className={inputClass}
          placeholder="Ex: Residencial Jardim das Flores"
        />
        {!editando && (
          <p className="text-sm text-gray-500 mt-1">
            O slug será gerado automaticamente a partir do nome
          </p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo (horizontal - topo do formulário)
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'logo')}
              className={inputClass}
            />
          </div>
          {logoPreview && (
            <div className="relative w-32 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
              <Image src={logoPreview} alt="Preview logo" fill className="object-contain" />
            </div>
          )}
        </div>
      </div>

      {/* Ícone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ícone (quadrado - card da landing)
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'icone')}
              className={inputClass}
            />
          </div>
          {iconePreview && (
            <div className="relative w-16 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
              <Image src={iconePreview} alt="Preview ícone" fill className="object-cover" />
            </div>
          )}
        </div>
      </div>

      <hr className="my-6" />

      {/* Usuário do stand */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Usuário do Stand</h2>

        {editando ? (
          <>
            {inicial?.usuarioStand && (
              <p className="text-sm text-gray-600">
                Usuário: <span className="font-semibold">{inicial.usuarioStand}</span>
              </p>
            )}
            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Redefinir senha do stand (opcional)
              </label>
              <input
                type="password"
                id="novaSenha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength={6}
                className={inputClass}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
                Usuário *
              </label>
              <input
                type="text"
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                minLength={3}
                className={inputClass}
                placeholder="Digite o nome de usuário"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </>
        )}
      </div>

      {/* Status (apenas edição) */}
      {editando && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-gray-700">
            Empreendimento ativo (aparece na landing)
          </span>
        </label>
      )}

      {erro && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {erro}
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/admin/configuracoes"
          className="flex-1 text-center bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={salvando}
          className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {salvando
            ? 'Salvando...'
            : editando
              ? 'Salvar alterações'
              : 'Criar Empreendimento'}
        </button>
      </div>
    </form>
  )
}
