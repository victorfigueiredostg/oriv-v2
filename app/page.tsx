'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Empreendimento {
  id: number
  nome: string
  slug: string
  iconeUrl: string | null
}

export default function Home() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch('/api/empreendimentos/publico')
      .then((res) => res.json())
      .then((data) => {
        setEmpreendimentos(data)
        setCarregando(false)
      })
      .catch((error) => {
        console.error('Erro ao carregar empreendimentos:', error)
        setCarregando(false)
      })
  }, [])

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-900">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ORIV 2.0
          </h1>
          <p className="text-lg text-gray-600">
            Sistema de Registro de Visitas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {empreendimentos.map((emp) => (
            <Link
              key={emp.id}
              href={`/login/${emp.slug}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center justify-center group"
            >
              {emp.iconeUrl ? (
                <div className="w-24 h-24 relative mb-4">
                  <Image
                    src={emp.iconeUrl}
                    alt={emp.nome}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {emp.nome.charAt(0)}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-900 text-center group-hover:text-indigo-600 transition-colors">
                {emp.nome}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Acesso Stand
              </p>
            </Link>
          ))}
        </div>

        {empreendimentos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum empreendimento cadastrado ainda.
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Acesso Gestor
          </Link>
        </div>
      </div>
    </div>
  )
}
