'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import EmpreendimentoForm, {
  EmpreendimentoInicial,
} from '@/components/EmpreendimentoForm'

export default function EditarEmpreendimentoPage() {
  const params = useParams()
  const id = params.id as string
  const [inicial, setInicial] = useState<EmpreendimentoInicial | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/empreendimentos/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setInicial({
          id: data.id,
          nome: data.nome,
          logoUrl: data.logoUrl,
          iconeUrl: data.iconeUrl,
          ativo: data.ativo,
          usuarioStand: data.usuarios?.[0]?.usuario,
        })
      })
      .catch(() => setErro('Não foi possível carregar o empreendimento.'))
      .finally(() => setCarregando(false))
  }, [id])

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
            Editar Empreendimento
          </h1>
          <p className="text-gray-600 mt-2">
            Atualize os dados, status e, se necessário, a senha do stand
          </p>
        </div>

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : erro ? (
          <p className="text-red-600">{erro}</p>
        ) : inicial ? (
          <EmpreendimentoForm modo="editar" inicial={inicial} />
        ) : null}
      </div>
    </div>
  )
}
