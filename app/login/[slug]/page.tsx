'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface LoginPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function LoginPage({ params, searchParams }: LoginPageProps) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const result = await signIn('credentials', {
        usuario,
        senha,
        redirect: false,
      })

      if (result?.error) {
        setErro('Usuário ou senha inválidos')
        setCarregando(false)
        return
      }

      router.push('/visita')
    } catch (error) {
      setErro('Erro ao fazer login. Tente novamente.')
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Stand
            </h1>
            <p className="text-gray-600">
              Digite suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="usuario"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usuário
              </label>
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                placeholder="Digite seu usuário"
              />
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                placeholder="Digite sua senha"
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
