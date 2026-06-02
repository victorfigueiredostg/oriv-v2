'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function NovoEmpreendimentoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    senha: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [iconeFile, setIconeFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [iconePreview, setIconePreview] = useState<string | null>(null)

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Redirect se não for ADMIN
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    router.push('/admin/login')
    return null
  }

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
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tipo', tipo)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Erro ao fazer upload da imagem')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSalvando(true)

    try {
      let logoUrl = undefined
      let iconeUrl = undefined

      // Upload das imagens se existirem
      if (logoFile) {
        logoUrl = await uploadImagem(logoFile, 'logo')
      }

      if (iconeFile) {
        iconeUrl = await uploadImagem(iconeFile, 'icone')
      }

      // Criar empreendimento
      const response = await fetch('/api/empreendimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          logoUrl,
          iconeUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar empreendimento')
      }

      // Sucesso - redirecionar para admin
      router.push('/admin')
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar empreendimento')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              ← Voltar
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Novo Empreendimento
            </h1>
            <p className="text-gray-600 mt-2">
              Cadastre um novo empreendimento e crie o usuário do stand
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome do Empreendimento */}
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome do Empreendimento *
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ex: Residencial Jardim das Flores"
              />
              <p className="text-sm text-gray-500 mt-1">
                O slug será gerado automaticamente a partir do nome
              </p>
            </div>

            {/* Upload Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo do Empreendimento (horizontal - topo do formulário)
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'logo')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {logoPreview && (
                  <div className="relative w-32 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Preview logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Upload Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone do Empreendimento (quadrado - card da landing)
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'icone')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {iconePreview && (
                  <div className="relative w-16 h-16 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={iconePreview}
                      alt="Preview ícone"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <hr className="my-6" />

            {/* Dados do Usuário do Stand */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Usuário do Stand
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="usuario"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Usuário *
                  </label>
                  <input
                    type="text"
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) =>
                      setFormData({ ...formData, usuario: e.target.value })
                    }
                    required
                    minLength={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Digite o nome de usuário"
                  />
                </div>

                <div>
                  <label
                    htmlFor="senha"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Senha *
                  </label>
                  <input
                    type="password"
                    id="senha"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg">
                {erro}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <Link
                href="/admin"
                className="flex-1 text-center bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? 'Criando...' : 'Criar Empreendimento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
