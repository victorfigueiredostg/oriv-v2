'use client'

import { useEffect, useState } from 'react'
import FiltrosVisitas, {
  filtrosPadrao,
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import {
  traduzirComoChegou,
  traduzirComoSoube,
  formatarDataHora,
  faixaDaIdade,
} from '@/lib/labels'

interface Visita {
  id: number
  nomeCliente: string
  idadeCliente: number | null
  faixaEtaria: string | null
  telefone: string | null
  corretor: string
  imobiliaria: string
  comoChegou: string
  comoSoube: string
  ondeMaisViu: string | null
  cvStatus: string | null
  cvConfirmadoEm: string | null
  motivoLost: string | null
  salvoEm: string
  empreendimento: { nome: string }
}

const TIPO_BADGE: Record<string, string> = {
  AGENDADO_CORRETOR: 'bg-indigo-50 text-indigo-700',
  CLIENTE_PASSANTE: 'bg-orange-50 text-orange-700',
  AGENDAMENTO_SELENA: 'bg-teal-50 text-teal-700',
}
const CV_BADGE: Record<string, { txt: string; cls: string }> = {
  CADASTRADO: { txt: 'Cadastrado', cls: 'bg-green-100 text-green-700' },
  NAO_CADASTRADO: { txt: 'Não cadastrado', cls: 'bg-red-100 text-red-700' },
  NAO_PREENCHEU: { txt: 'Não preencheu', cls: 'bg-gray-200 text-gray-600' },
}

function BadgeCv({ status }: { status: string | null }) {
  if (status && CV_BADGE[status]) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CV_BADGE[status].cls}`}
      >
        {CV_BADGE[status].txt}
      </span>
    )
  }
  return <span className="text-gray-400 text-xs">não verificado</span>
}

export default function RegistrosVisitasPage() {
  const [filtros, setFiltros] = useState<FiltrosVisitasValue>(filtrosPadrao)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState<number | null>(null)
  const [motivos, setMotivos] = useState<string[]>([])
  const [salvandoMotivo, setSalvandoMotivo] = useState<number | null>(null)

  useEffect(() => {
    setPage(1)
  }, [filtros])

  useEffect(() => {
    fetch('/api/motivos-lost')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) =>
        setMotivos(
          Array.isArray(d)
            ? d.filter((m: any) => m.ativo).map((m: any) => m.nome as string)
            : []
        )
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      try {
        const query = filtrosParaQuery(filtros)
        const res = await fetch(`/api/visitas?${query}&page=${page}&limit=20`)
        const data = await res.json()
        setVisitas(data.visitas || [])
        setTotal(data.pagination?.total || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error) {
        console.error('Erro ao carregar registros:', error)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [filtros, page])

  const salvarMotivo = async (v: Visita, valor: string) => {
    const anterior = v.motivoLost
    setSalvandoMotivo(v.id)
    setVisitas((prev) =>
      prev.map((x) => (x.id === v.id ? { ...x, motivoLost: valor || null } : x))
    )
    try {
      const res = await fetch(`/api/visitas/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivoLost: valor }),
      })
      if (!res.ok) throw new Error('falha')
    } catch {
      // reverte em caso de erro
      setVisitas((prev) =>
        prev.map((x) => (x.id === v.id ? { ...x, motivoLost: anterior } : x))
      )
      alert('Não foi possível salvar o motivo de lost.')
    } finally {
      setSalvandoMotivo(null)
    }
  }

  const opcoesMotivo = (v: Visita) => {
    const opts = [...motivos]
    // mantém o valor atual visível mesmo que o motivo tenha sido inativado
    if (v.motivoLost && !opts.includes(v.motivoLost)) opts.unshift(v.motivoLost)
    return opts
  }

  const canais = (csv: string | null) =>
    csv
      ? csv
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : []

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Registros de Visitas
      </h1>

      <FiltrosVisitas
        value={filtros}
        onChange={setFiltros}
        comImobiliaria
        comMotivoLost
      />

      <p className="text-sm text-gray-600 mb-3">
        <span className="font-semibold text-gray-900">{total}</span> visita(s) no
        filtro selecionado · clique em <b>Detalhes</b> para ver CV, origens e o
        motivo de lost
      </p>

      {carregando ? (
        <p className="text-gray-500">Carregando...</p>
      ) : visitas.length === 0 ? (
        <p className="text-gray-500 py-8 text-center bg-white rounded-lg shadow-sm">
          Nenhuma visita encontrada para os filtros selecionados.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visitas.map((v) => {
            const open = aberto === v.id
            const inicial = (v.nomeCliente || '?').trim().charAt(0).toUpperCase()
            return (
              <div
                key={v.id}
                className={`bg-white rounded-xl border shadow-sm transition-colors ${
                  open ? 'border-gray-300' : 'border-gray-200'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAberto(open ? null : v.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setAberto(open ? null : v.id)
                    }
                  }}
                  className="grid grid-cols-1 gap-3 p-3 items-center cursor-pointer md:grid-cols-[1.5fr_1fr_1.1fr_150px_140px_116px]"
                >
                  {/* Contato */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-none w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold grid place-items-center border border-gray-200">
                      {inicial}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-semibold text-gray-900 text-sm truncate"
                        translate="no"
                      >
                        {v.nomeCliente}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {v.telefone || 'Sem telefone'}
                      </div>
                    </div>
                  </div>

                  {/* Empreendimento + Data */}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                      Empreendimento
                    </div>
                    <div className="text-sm text-gray-900 truncate">
                      {v.empreendimento?.nome || '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatarDataHora(v.salvoEm)}
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                      Responsável
                    </div>
                    <div
                      className="text-sm text-gray-900 truncate"
                      translate="no"
                    >
                      {v.corretor}
                    </div>
                    <div
                      className="text-xs text-gray-500 truncate"
                      translate="no"
                    >
                      {v.imobiliaria}
                    </div>
                  </div>

                  {/* Tipo */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        TIPO_BADGE[v.comoChegou] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {traduzirComoChegou(v.comoChegou)}
                    </span>
                  </div>

                  {/* CV */}
                  <div>
                    <BadgeCv status={v.cvStatus} />
                  </div>

                  {/* Botão detalhes */}
                  <div className="md:justify-self-end">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                      Detalhes
                      <svg
                        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.2}
                          d="M6 9l6 6 6-6"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-dashed border-gray-300 p-4">
                    <div className="grid gap-x-5 gap-y-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <Campo rotulo="Faixa etária">
                        {v.faixaEtaria || faixaDaIdade(v.idadeCliente) || '—'}
                      </Campo>

                      <Campo rotulo="Primeiro contato">
                        {traduzirComoSoube(v.comoSoube)}
                      </Campo>

                      <div>
                        <Rotulo>Onde mais viu / ouviu</Rotulo>
                        {canais(v.ondeMaisViu).length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {canais(v.ondeMaisViu).map((c) => (
                              <span
                                key={c}
                                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded"
                              >
                                {traduzirComoSoube(c)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>

                      <Campo rotulo="1ª validação CV">
                        <BadgeCv status={v.cvStatus} />
                      </Campo>

                      <Campo rotulo="Cadastro CV">
                        {v.cvConfirmadoEm ? (
                          <span className="text-green-700">
                            ✓ {formatarDataHora(v.cvConfirmadoEm)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </Campo>

                      {/* Único campo editável */}
                      <div>
                        <Rotulo>Motivo de lost</Rotulo>
                        <div className="flex items-center gap-2">
                          <select
                            value={v.motivoLost || ''}
                            onChange={(e) => salvarMotivo(v, e.target.value)}
                            disabled={salvandoMotivo === v.id}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 bg-white disabled:opacity-60"
                          >
                            <option value="">— Selecionar —</option>
                            {opcoesMotivo(v).map((nome) => (
                              <option key={nome} value={nome}>
                                {nome}
                              </option>
                            ))}
                          </select>
                          {salvandoMotivo === v.id && (
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              salvando…
                            </span>
                          )}
                        </div>
                        {motivos.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Cadastre motivos em Configurações → Motivos de Lost.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">
      {children}
    </div>
  )
}

function Campo({
  rotulo,
  children,
}: {
  rotulo: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Rotulo>{rotulo}</Rotulo>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}
