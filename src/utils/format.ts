import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateString
  }
}

export function formatPercent(value: number | undefined | null): string {
  if (value == null) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function formatPercentDirect(value: number | undefined | null): string {
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}

export function formatSeconds(seconds: number | undefined | null): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}min ${s}s`
}

export function formatTipoConteudo(tipo: string): string {
  const map: Record<string, string> = {
    PALAVRA: 'Palavra',
    FRASE: 'Frase',
    DIALOGO: 'Diálogo',
  }
  return map[tipo] ?? tipo
}

export function formatTipoExercicio(tipo: string): string {
  const map: Record<string, string> = {
    MULTIPLA_ESCOLHA: 'Múltipla Escolha',
    TRADUCAO_PT_MANDARIM: 'PT → Mandarim',
    TRADUCAO_MANDARIM_PT: 'Mandarim → PT',
    PINYIN: 'Pinyin',
    ESCRITA_LIVRE: 'Escrita Livre',
  }
  return map[tipo] ?? tipo
}

export function hskLabel(nivel: number): string {
  return `HSK ${nivel}`
}

export function dificuldadeLabel(nivel: number): string {
  const map: Record<number, string> = {
    1: 'Muito Fácil',
    2: 'Fácil',
    3: 'Médio',
    4: 'Difícil',
    5: 'Muito Difícil',
  }
  return map[nivel] ?? `Nível ${nivel}`
}
