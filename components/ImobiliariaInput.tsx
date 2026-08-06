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

// Autocomplete ESTRITO de imobiliária: só aceita um nome da lista cadastrada.
// Digitar serve para pesquisar; o valor só é confirmado ao selecionar uma opção
// (ou quando o texto corresponde exatamente a uma cadastrada). Texto que não
// corresponde é descartado ao fechar.
export default function ImobiliariaInput({
  value,
  onChange,
  id,
  required,
  placeholder,
  className,
}: Props) {
  const [opcoes, setOpcoes] = useState<string[]>([])
  const [texto, setTexto] = useState(value)
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

  const termo = texto.trim().toLowerCase()
  const filtradas = termo
    ? opcoes.filter((o) => o.toLowerCase().includes(termo))
    : opcoes

  const fechar = () => {
    setAberto(false)
    // Normaliza para a opção exata cadastrada; senão, descarta.
    const exato = opcoes.find((o) => o.toLowerCase() === texto.trim().toLowerCase())
    if (exato) {
      setTexto(exato)
      if (value !== exato) onChange(exato)
    } else {
      setTexto('')
      if (value) onChange('')
    }
  }

  // Fecha (e valida) ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        fechar()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, opcoes, value])

  const selecionar = (nome: string) => {
    setTexto(nome)
    onChange(nome)
    setAberto(false)
  }

  const digitar = (t: string) => {
    setTexto(t)
    setAberto(true)
    // Qualquer digitação invalida a seleção anterior até escolher da lista
    if (value) onChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        value={texto}
        onChange={(e) => digitar(e.target.value)}
        onFocus={() => setAberto(true)}
        required={required}
        autoComplete="off"
        className={className}
        placeholder={placeholder}
      />
      {aberto && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtradas.length > 0 ? (
            filtradas.map((nome) => (
              <li key={nome}>
                <button
                  type="button"
                  onClick={() => selecionar(nome)}
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-gray-900"
                  translate="no"
                >
                  {nome}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-gray-500">
              Nenhuma imobiliária cadastrada com esse nome.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
