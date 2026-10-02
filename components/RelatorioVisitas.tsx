'use client'

import { useState } from 'react'
import {
  FiltrosVisitasValue,
  filtrosParaQuery,
} from '@/components/FiltrosVisitas'
import {
  traduzirComoChegou,
  traduzirComoSoube,
  formatarDataHora,
  faixaDaIdade,
  CV_STATUS_LABELS,
} from '@/lib/labels'

// Definição das colunas disponíveis no relatório configurável.
interface Coluna {
  key: string
  label: string
  get: (v: any) => string
}

const COLUNAS: Coluna[] = [
  { key: 'dataHora', label: 'Data/Hora', get: (v) => formatarDataHora(v.salvoEm) },
  {
    key: 'empreendimento',
    label: 'Empreendimento',
    get: (v) => v.empreendimento?.nome || '',
  },
  { key: 'cliente', label: 'Nome do cliente', get: (v) => v.nomeCliente || '' },
  { key: 'telefone', label: 'Telefone', get: (v) => v.telefone || '' },
  {
    key: 'faixaEtaria',
    label: 'Faixa etária',
    get: (v) => v.faixaEtaria || faixaDaIdade(v.idadeCliente) || '',
  },
  { key: 'corretor', label: 'Corretor', get: (v) => v.corretor || '' },
  { key: 'imobiliaria', label: 'Imobiliária', get: (v) => v.imobiliaria || '' },
  {
    key: 'tipo',
    label: 'Tipo de visita',
    get: (v) => traduzirComoChegou(v.comoChegou),
  },
  {
    key: 'primeiroContato',
    label: 'Primeiro contato',
    get: (v) => traduzirComoSoube(v.comoSoube),
  },
  {
    key: 'ondeMaisViu',
    label: 'Onde mais viu',
    get: (v) =>
      v.ondeMaisViu
        ? v.ondeMaisViu
            .split(',')
            .map((x: string) => traduzirComoSoube(x.trim()))
            .join(', ')
        : '',
  },
  {
    key: 'cv',
    label: 'Status no CV',
    get: (v) => (v.cvStatus ? CV_STATUS_LABELS[v.cvStatus] || v.cvStatus : ''),
  },
  {
    key: 'cadastroCv',
    label: 'Data cadastro CV',
    get: (v) => (v.cvConfirmadoEm ? formatarDataHora(v.cvConfirmadoEm) : ''),
  },
  { key: 'motivoLost', label: 'Motivo de lost', get: (v) => v.motivoLost || '' },
]

// Colunas marcadas por padrão
const PADRAO = new Set([
  'dataHora',
  'cliente',
  'telefone',
  'corretor',
  'imobiliaria',
  'tipo',
  'cv',
  'motivoLost',
])

export default function RelatorioVisitas({
  filtros,
}: {
  filtros: FiltrosVisitasValue
}) {
  const [aberto, setAberto] = useState(false)
  const [sel, setSel] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLUNAS.map((c) => [c.key, PADRAO.has(c.key)]))
  )
  const [gerando, setGerando] = useState<'excel' | 'pdf' | null>(null)
  // Filtro de cadastro no CV: 'todos' | 'sim' (cadastrados) | 'nao' (não)
  const [cvFiltro, setCvFiltro] = useState<'todos' | 'sim' | 'nao'>('todos')

  const marcadas = COLUNAS.filter((c) => sel[c.key])
  const toggle = (key: string) => setSel((s) => ({ ...s, [key]: !s[key] }))
  const todos = () =>
    setSel(Object.fromEntries(COLUNAS.map((c) => [c.key, true])))
  const nenhum = () =>
    setSel(Object.fromEntries(COLUNAS.map((c) => [c.key, false])))

  const periodo = `${filtros.dataInicio || 'inicio'}_a_${filtros.dataFim || 'fim'}`

  const buscarVisitas = async (): Promise<any[]> => {
    const cvParam = cvFiltro !== 'todos' ? `&cvCadastro=${cvFiltro}` : ''
    const res = await fetch(
      `/api/visitas?${filtrosParaQuery(filtros)}${cvParam}&limit=100000`
    )
    const data = await res.json()
    return data.visitas || []
  }

  const gerarExcel = async () => {
    setGerando('excel')
    try {
      const visitas = await buscarVisitas()
      const XLSX = await import('xlsx')
      const header = marcadas.map((c) => c.label)
      const rows = visitas.map((v) =>
        Object.fromEntries(marcadas.map((c) => [c.label, c.get(v)]))
      )
      const ws = XLSX.utils.json_to_sheet(rows, { header })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Visitas')
      XLSX.writeFile(wb, `registros-visitas_${periodo}.xlsx`)
      setAberto(false)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o Excel.')
    } finally {
      setGerando(null)
    }
  }

  const gerarPdf = async () => {
    setGerando('pdf')
    try {
      const visitas = await buscarVisitas()
      const jsPDFMod: any = await import('jspdf')
      const JsPDF = jsPDFMod.jsPDF ?? jsPDFMod.default
      const autoTableMod: any = await import('jspdf-autotable')
      const autoTable = autoTableMod.default ?? autoTableMod.autoTable

      const doc = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)
      doc.text('Registros de Visitas', 40, 40)
      doc.setFontSize(9)
      doc.setTextColor(110)
      doc.text(
        `Período: ${filtros.dataInicio || '—'} a ${filtros.dataFim || '—'}  ·  ${visitas.length} visita(s)`,
        40,
        56
      )
      autoTable(doc, {
        startY: 70,
        head: [marcadas.map((c) => c.label)],
        body: visitas.map((v) => marcadas.map((c) => c.get(v))),
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 246, 250] },
      })
      doc.save(`registros-visitas_${periodo}.pdf`)
      setAberto(false)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o PDF.')
    } finally {
      setGerando(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
      >
        ↓ Gerar relatório
      </button>

      {aberto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !gerando && setAberto(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[88vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-bold text-gray-900">Gerar relatório</h3>
              <button
                onClick={() => !gerando && setAberto(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              O relatório usa os <b>filtros atuais da tela</b>. Abaixo você
              escolhe o filtro de CV e as colunas.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cadastro no CV
              </label>
              <select
                value={cvFiltro}
                onChange={(e) =>
                  setCvFiltro(e.target.value as 'todos' | 'sim' | 'nao')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="todos">Todos</option>
                <option value="sim">Somente cadastrados no CV</option>
                <option value="nao">Somente não cadastrados</option>
              </select>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-2">
              Colunas do relatório
            </p>

            <div className="flex gap-3 mb-3 text-sm">
              <button
                onClick={todos}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Selecionar todos
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={nenhum}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {COLUNAS.map((c) => (
                <label
                  key={c.key}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm ${
                    sel[c.key]
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!sel[c.key]}
                    onChange={() => toggle(c.key)}
                    className="w-4 h-4"
                  />
                  {c.label}
                </label>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={gerarExcel}
                disabled={!!gerando || marcadas.length === 0}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {gerando === 'excel' ? 'Gerando...' : 'Baixar Excel'}
              </button>
              <button
                onClick={gerarPdf}
                disabled={!!gerando || marcadas.length === 0}
                className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {gerando === 'pdf' ? 'Gerando...' : 'Baixar PDF'}
              </button>
            </div>
            {marcadas.length === 0 && (
              <p className="text-xs text-red-600 text-right mt-2">
                Selecione pelo menos uma coluna.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
