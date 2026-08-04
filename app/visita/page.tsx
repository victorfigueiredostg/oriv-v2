'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ImobiliariaInput from '@/components/ImobiliariaInput'
import { opcoesComoSoube } from '@/lib/labels'

export default function VisitaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [formData, setFormData] = useState({
    nomeCliente: '',
    telefone: '',
    idadeCliente: '',
    comoChegou: '',
    corretor: '',
    imobiliaria: '',
    comoSoube: '',
    ondeMaisViu: [] as string[],
  })

  const toggleOnde = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      ondeMaisViu: prev.ondeMaisViu.includes(value)
        ? prev.ondeMaisViu.filter((v) => v !== value)
        : [...prev.ondeMaisViu, value],
    }))
  }

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [cvResultado, setCvResultado] = useState<any>(null)
  const [verificandoCv, setVerificandoCv] = useState(false)

  // Trava de senha para "Ver Visitas"
  const [gateAberto, setGateAberto] = useState(false)
  const [gateUser, setGateUser] = useState('')
  const [gateSenha, setGateSenha] = useState('')
  const [gateErro, setGateErro] = useState('')
  const [gateChecando, setGateChecando] = useState(false)

  const abrirGate = () => {
    setGateUser('')
    setGateSenha('')
    setGateErro('')
    setGateAberto(true)
  }

  const validarGate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateErro('')
    setGateChecando(true)
    try {
      const res = await fetch('/api/stand-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: gateUser, senha: gateSenha }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push('/visitas')
      } else {
        setGateErro('Usuário ou senha inválidos.')
      }
    } catch {
      setGateErro('Erro ao validar. Tente novamente.')
    } finally {
      setGateChecando(false)
    }
  }

  const verificarCv = async () => {
    setCvResultado(null)
    if (!formData.telefone.trim()) {
      setCvResultado({ erro: 'Informe o telefone para verificar.' })
      return
    }
    setVerificandoCv(true)
    try {
      const res = await fetch('/api/cv/validar-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nomeCliente,
          telefone: formData.telefone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCvResultado({ erro: data.message || 'Erro ao consultar o CV.' })
        return
      }
      setCvResultado(data)
    } catch {
      setCvResultado({ erro: 'Falha ao consultar o CV.' })
    } finally {
      setVerificandoCv(false)
    }
  }

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
        telefone: '',
        idadeCliente: '',
        comoChegou: '',
        corretor: '',
        imobiliaria: '',
        comoSoube: '',
        ondeMaisViu: [],
      })
      setCvResultado(null)
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

  // Opções de origem do empreendimento logado (globais + extras específicas)
  const opcoesOrigem = opcoesComoSoube(session?.user?.empreendimento?.slug)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Logo do Empreendimento */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 text-center">
          {session?.user?.empreendimento?.logoUrl ? (
            <div className="relative h-32 sm:h-40 w-full">
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

            {/* Telefone (opcional) + verificação no CVCRM */}
            <div>
              <label
                htmlFor="telefone"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Telefone
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  inputMode="tel"
                  className="flex-1 px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="(DDD) número"
                />
                <button
                  type="button"
                  onClick={verificarCv}
                  disabled={verificandoCv}
                  className="px-5 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 disabled:opacity-50 whitespace-nowrap"
                >
                  {verificandoCv ? 'Verificando...' : 'Verificar no CV'}
                </button>
              </div>

              {cvResultado &&
                (cvResultado.erro ? (
                  <p className="mt-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2">
                    {cvResultado.erro}
                  </p>
                ) : !cvResultado.encontrado ? (
                  <p className="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-2">
                    Nenhum lead com esse telefone no CV — provável lead novo.
                  </p>
                ) : cvResultado.nomeConfere ? (
                  <p className="mt-2 text-sm bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-2">
                    ✓ Já cadastrado no CV — nome confere
                    {cvResultado.leads?.[0]?.nome
                      ? ` (${cvResultado.leads[0].nome})`
                      : ''}
                    .
                  </p>
                ) : (
                  <p className="mt-2 text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-4 py-2">
                    ⚠ Telefone já existe no CV, mas com outro nome
                    {cvResultado.leads?.[0]?.nome
                      ? `: ${cvResultado.leads[0].nome}`
                      : ''}
                    .
                  </p>
                ))}
            </div>

            {/* Idade do Cliente */}
            <div>
              <label
                htmlFor="idadeCliente"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Idade do Cliente *
              </label>
              <input
                type="number"
                id="idadeCliente"
                name="idadeCliente"
                value={formData.idadeCliente}
                onChange={handleChange}
                required
                min={0}
                max={120}
                inputMode="numeric"
                className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Idade em anos"
              />
            </div>

            {/* Como chegou no Stand */}
            <div>
              <label
                htmlFor="comoChegou"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Tipo de Visita *
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

            {/* Como ficou sabendo */}
            <div>
              <label
                htmlFor="comoSoube"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Como ficou sabendo do empreendimento pela primeira vez? *
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
                {opcoesOrigem.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Onde mais viu/ouviu (multi-seleção) */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Onde mais você viu ou ouviu falar sobre o empreendimento?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {opcoesOrigem.map((o) => {
                  const marcado = formData.ondeMaisViu.includes(o.value)
                  return (
                    <label
                      key={o.value}
                      className={`flex items-center gap-2 px-3 py-3 border rounded-lg cursor-pointer text-base ${
                        marcado
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => toggleOnde(o.value)}
                        className="w-5 h-5"
                      />
                      <span>{o.label}</span>
                    </label>
                  )
                })}
              </div>
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
            onClick={abrirGate}
            className="bg-white text-indigo-600 py-2 px-5 rounded-lg font-medium text-sm hover:bg-gray-50 border border-indigo-600 transition-colors"
          >
            Ver Visitas
          </button>
        </div>

        {/* Modal de senha para Ver Visitas */}
        {gateAberto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Acesso às visitas
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Informe usuário e senha para visualizar as visitas registradas.
              </p>
              <form onSubmit={validarGate} className="space-y-3">
                <input
                  type="text"
                  value={gateUser}
                  onChange={(e) => setGateUser(e.target.value)}
                  placeholder="Usuário"
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="password"
                  value={gateSenha}
                  onChange={(e) => setGateSenha(e.target.value)}
                  placeholder="Senha"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
                {gateErro && (
                  <p className="text-sm text-red-600">{gateErro}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setGateAberto(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={gateChecando}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {gateChecando ? 'Verificando...' : 'Entrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
