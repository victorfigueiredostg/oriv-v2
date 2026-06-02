'use client'

import Link from 'next/link'
import EmpreendimentoForm from '@/components/EmpreendimentoForm'

export default function NovoEmpreendimentoPage() {
  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/configuracoes"
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
      >
        ← Voltar
      </Link>
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Novo Empreendimento
          </h1>
          <p className="text-gray-600 mt-2">
            Cadastre um novo empreendimento e crie o usuário do stand
          </p>
        </div>
        <EmpreendimentoForm modo="criar" />
      </div>
    </div>
  )
}
