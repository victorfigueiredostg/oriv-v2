'use client'

import { useState } from 'react'
import { traduzirComoSoube } from '@/lib/labels'

interface Item {
  primeiroContato: string
  total: number
  canais: { canal: string; total: number }[]
}

export default function CruzamentoContatoOnde({ data }: { data: Item[] }) {
  const [sel, setSel] = useState<string>(data[0]?.primeiroContato || '')

  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados no período.</p>
  }

  const atual = data.find((d) => d.primeiroContato === sel) || data[0]
  const maxCanal = Math.max(1, ...atual.canais.map((c) => c.total))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Lista de primeiro contato (clicável) */}
      <div className="space-y-1">
        {data.map((d) => {
          const ativo = d.primeiroContato === atual.primeiroContato
          return (
            <button
              key={d.primeiroContato}
              onClick={() => setSel(d.primeiroContato)}
              className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                ativo
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{traduzirComoSoube(d.primeiroContato)}</span>
              <span className={ativo ? 'text-indigo-100' : 'text-gray-400'}>
                {d.total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Canais que esse grupo também viu/ouviu */}
      <div className="md:col-span-2">
        <p className="text-sm text-gray-600 mb-3">
          Quem teve{' '}
          <strong>{traduzirComoSoube(atual.primeiroContato)}</strong> como
          primeiro contato ({atual.total}) também viu/ouviu:
        </p>
        {atual.canais.length === 0 ? (
          <p className="text-sm text-gray-500">
            Ninguém desse grupo informou outros canais.
          </p>
        ) : (
          <div className="space-y-2">
            {atual.canais.map((c) => (
              <div key={c.canal}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">
                    {traduzirComoSoube(c.canal)}
                  </span>
                  <span className="font-medium text-gray-900">
                    {c.total}{' '}
                    <span className="text-gray-400">
                      ({Math.round((c.total / atual.total) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${(c.total / maxCanal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
