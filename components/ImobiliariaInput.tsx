'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  id?: string
  required?: boolean
  placeholder?: string
  className?: string
}

// Campo de imobiliária com autocomplete: lista as cadastradas num dropdown
// reduzido com scroll; digitar funciona como busca (filtra) e também permite
// texto livre (caso a imobiliária ainda não esteja cadastrada).
export default function ImobiliariaInput({
  value,
  onChange,
  id,
  required,
  placeholder,
  className,
}: Props) {
  const [opcoes, setOpcoes] = useState<string[]>([])
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/imobiliarias')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setOpcoes(
          Array.isArray(data) ? data.map((i: { nome: string }) => i.nome) : []
        )
      )
      .catch(() => {})
  }, [])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const termo = value.trim().toLowerCase()
  const filtradas = termo
    ? opcoes.filter((o) => o.toLowerCase().includes(termo))
    : opcoes

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        required={required}
        autoComplete="off"
        className={className}
        placeholder={placeholder}
      />
      {aberto && filtradas.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtradas.map((nome) => (
            <li key={nome}>
              <button
                type="button"
                onClick={() => {
                  onChange(nome)
                  setAberto(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-gray-900"
              >
                {nome}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
