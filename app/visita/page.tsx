'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ImobiliariaInput from '@/components/ImobiliariaInput'

export default function VisitaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    nomeCliente: '',
    comoChegou: '',
    corretor: '',
    imobiliaria: '',
    comoSoube: '',
  })

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  // Redirect se não estiver autenticado
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Redirect se for ADMIN
  if (session?.user?.role === 'ADMIN') {
    router.push('/admin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setSucesso(false)
    setSalvando(true)

    try {
      const response = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar visita')
      }

      // Sucesso - limpar formulário
      setFormData({
        nomeCliente: '',
        comoChegou: '',
        corretor: '',
        imobiliaria: '',
        comoSoube: '',
      })
      setSucesso(true)

      // Remover mensagem de sucesso após 3s
      setTimeout(() => setSucesso(false), 3000)
    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar visita')
    } finally {
      setSalvando(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo do Empreendimento */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 text-center">
          {session?.user?.empreendimento?.logoUrl ? (
            <div className="relative h-20 w-full">
              <Image
                src={session.user.empreendimento.logoUrl}
                alt={session.user.empreendimento.nome}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900">
              {session?.user?.empreendimento?.nome || 'Empreendimento'}
            </h1>
          )}
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-b-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Registro de Visita
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome do Cliente */}
            <div>
              <label
                htmlFor="nomeCliente"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Nome do Cliente *
              </label>
              <input
                type="text"
                id="nomeCliente"
                name="nomeCliente"
                value={formData.nomeCliente}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Digite o nome completo"
              />
            </div>

            {/* Como chegou no Stand */}
            <div>
              <label
                htmlFor="comoChegou"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Como chegou no Stand? *
              </label>
              <select
                id="comoChegou"
                name="comoChegou"
                value={formData.comoChegou}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecione uma opção</option>
                <option value="AGENDADO_CORRETOR">Agendei com um Corretor</option>
                <option value="CLIENTE_PASSANTE">Cliente Passante</option>
              </select>
            </div>

            {/* Corretor */}
            <div>
              <label
                htmlFor="corretor"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Corretor *
              </label>
              <input
                type="text"
                id="corretor"
                name="corretor"
                value={formData.corretor}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Nome do corretor"
              />
            </div>

            {/* Imobiliária */}
            <div>
              <label
                htmlFor="imobiliaria"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Imobiliária *
              </label>
              <ImobiliariaInput
                id="imobiliaria"
                value={formData.imobiliaria}
                onChange={(v) =>
                  setFormData((prev) => ({ ...prev, imobiliaria: v }))
                }
                required
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Pesquisar ou digitar a imobiliária"
              />
            </div>

            {/* Como ficou sabendo */}
            <div>
              <label
                htmlFor="comoSoube"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Como ficou sabendo do empreendimento? *
              </label>
              <select
                id="comoSoube"
                name="comoSoube"
                value={formData.comoSoube}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Selecione uma opção</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="CORRETOR">Corretor</option>
                <option value="PANFLETO">Panfleto</option>
                <option value="TV">TV</option>
                <option value="RADIO">Rádio</option>
                <option value="STAND_CENTRAL_VENDAS">Stand/Central de Vendas</option>
                <option value="INDICACAO">Indicação</option>
                <option value="OUTDOOR">Outdoor</option>
                <option value="OBRA">Obra</option>
              </select>
            </div>

            {/* Mensagens de feedback */}
            {erro && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg text-lg">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-lg text-lg">
                ✓ Visita registrada com sucesso!
              </div>
            )}

            {/* Botão Salvar */}
            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-indigo-600 text-white py-5 px-6 rounded-lg font-semibold text-xl hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {salvando ? 'Salvando...' : 'Salvar Visita'}
            </button>
          </form>
        </div>

        {/* Botões de navegação */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push('/visitas')}
            className="bg-white text-indigo-600 py-2 px-5 rounded-lg font-medium text-sm hover:bg-gray-50 border border-indigo-600 transition-colors"
          >
            Ver Visitas
          </button>
        </div>
      </div>
    </div>
  )
}
