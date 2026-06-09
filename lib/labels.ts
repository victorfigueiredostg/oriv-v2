// Rótulos e opções compartilhados dos enums de Visita.
// Centralizado aqui para evitar duplicação entre dashboard, relatórios e listas.

export const COMO_CHEGOU_LABELS: Record<string, string> = {
  AGENDADO_CORRETOR: 'Agendado com Corretor',
  CLIENTE_PASSANTE: 'Cliente Passante',
}

export const COMO_SOUBE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  WHATSAPP: 'WhatsApp',
  CORRETOR: 'Corretor',
  PANFLETO: 'Panfleto',
  TV: 'TV',
  RADIO: 'Rádio',
  STAND_CENTRAL_VENDAS: 'Stand/Central de Vendas',
  INDICACAO: 'Indicação',
  OUTDOOR: 'Outdoor',
  OBRA: 'Obra',
}

export const traduzirComoChegou = (valor: string) =>
  COMO_CHEGOU_LABELS[valor] || valor

export const traduzirComoSoube = (valor: string) =>
  COMO_SOUBE_LABELS[valor] || valor

// Opções para dropdowns (value + label), na ordem de exibição.
export const COMO_CHEGOU_OPTIONS = Object.entries(COMO_CHEGOU_LABELS).map(
  ([value, label]) => ({ value, label })
)

export const COMO_SOUBE_OPTIONS = Object.entries(COMO_SOUBE_LABELS).map(
  ([value, label]) => ({ value, label })
)

export const CV_STATUS_LABELS: Record<string, string> = {
  CADASTRADO: 'Cadastrado',
  NAO_CADASTRADO: 'Não cadastrado',
  NAO_PREENCHEU: 'Não preencheu',
}

export const formatarDataHora = (data: string) =>
  new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
