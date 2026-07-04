import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart3, Search, Clock, CheckCircle2, XCircle, MessageSquare, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { StatCard } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { usuarioService } from '@/services/usuarioService'
import { respostaService } from '@/services/respostaService'
import type { Resposta } from '@/types'
import { formatDate, formatSeconds } from '@/utils/format'

// ─── Interfaces locais para dados calculados ─────────────────────────────────
interface DesempenhoCalculado {
  totalRespostas: number
  acertos: number
  erros: number
  taxaAcerto: number
  tempoMedioResposta: number
  tempoTotal: number
  diasAtivos: number
}

interface DiaStats {
  data: string
  totalRespostas: number
  acertos: number
  erros: number
  taxaAcerto: number
  tempoMedio: number
}

// ─── Funções de cálculo ──────────────────────────────────────────────────────

function calcularDesempenho(respostas: Resposta[]): DesempenhoCalculado {
  const total = respostas.length
  const acertos = respostas.filter((r) => r.correta).length
  const erros = total - acertos
  const taxaAcerto = total > 0 ? Math.round((acertos / total) * 1000) / 10 : 0
  const tempoTotal = respostas.reduce((acc, r) => acc + (r.tempoRespostaSegundos ?? 0), 0)
  const tempoMedio = total > 0 ? Math.round((tempoTotal / total) * 10) / 10 : 0
  const diasSet = new Set(respostas.map((r) => extrairData(r.dataResposta)))
  diasSet.delete('')

  return { totalRespostas: total, acertos, erros, taxaAcerto, tempoMedioResposta: tempoMedio, tempoTotal, diasAtivos: diasSet.size }
}

function extrairData(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
  // Suporta ISO "2026-07-04T12:00:00" ou date "2026-07-04"
  return dateStr.split('T')[0]
}

function agruparPorDia(respostas: Resposta[]): DiaStats[] {
  const map = new Map<string, { total: number; acertos: number; tempo: number }>()

  for (const r of respostas) {
    const dia = extrairData(r.dataResposta)
    if (!dia) continue
    const curr = map.get(dia) ?? { total: 0, acertos: 0, tempo: 0 }
    curr.total += 1
    if (r.correta) curr.acertos += 1
    curr.tempo += r.tempoRespostaSegundos ?? 0
    map.set(dia, curr)
  }

  return Array.from(map.entries())
    .map(([data, { total, acertos, tempo }]) => ({
      data,
      totalRespostas: total,
      acertos,
      erros: total - acertos,
      taxaAcerto: total > 0 ? Math.round((acertos / total) * 1000) / 10 : 0,
      tempoMedio: total > 0 ? Math.round((tempo / total) * 10) / 10 : 0,
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

function filtrarPorPeriodo(respostas: Resposta[], inicio: string, fim: string): Resposta[] {
  return respostas.filter((r) => {
    const dia = extrairData(r.dataResposta)
    if (!dia) return true // inclui se não tem data (não exclui por falta de info)
    return dia >= inicio && dia <= fim
  })
}

// ─── Colunas da tabela ──────────────────────────────────────────────────────
const tableColumns = [
  { key: 'data',           header: 'Data',       render: (r: DiaStats) => formatDate(r.data) },
  { key: 'totalRespostas', header: 'Respostas' },
  { key: 'acertos',        header: 'Acertos'   },
  { key: 'erros',          header: 'Erros'     },
  {
    key: 'taxaAcerto',
    header: 'Taxa',
    render: (r: DiaStats) => `${r.taxaAcerto}%`,
  },
  {
    key: 'tempoMedio',
    header: 'Tempo Médio',
    render: (r: DiaStats) => `${r.tempoMedio}s`,
  },
]

// Range padrão: últimos 30 dias
function defaultDates() {
  const fim   = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 30)
  return {
    inicio: inicio.toISOString().split('T')[0],
    fim:    fim.toISOString().split('T')[0],
  }
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function EstatisticasPage() {
  const { data: usuarios, loading: loadingUsuarios } = useFetch(
    () => usuarioService.listar(),
    [],
  )

  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>('')
  const [dates, setDates] = useState(defaultDates)

  const [desempenho, setDesempenho] = useState<DesempenhoCalculado | null>(null)
  const [porDia, setPorDia] = useState<DiaStats[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [buscouAlguma, setBuscouAlguma] = useState(false)

  const usuarioOptions = [
    { value: '', label: 'Selecione um usuário' },
    ...(usuarios ?? []).map((u) => ({
      value: String(u.id),
      label: u.nome,
    })),
  ]

  function handleUsuarioChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    console.log('[Estatísticas] usuario selecionado', val)
    setSelectedUsuarioId(val)
    setDesempenho(null)
    setPorDia([])
    setErrorMsg(null)
    setBuscouAlguma(false)
  }

  async function buscar() {
    if (!selectedUsuarioId) return

    console.log('[Estatísticas] buscando respostas — usuarioId:', selectedUsuarioId, '| período:', dates)

    setLoading(true)
    setErrorMsg(null)
    setDesempenho(null)
    setPorDia([])
    setBuscouAlguma(true)

    try {
      // Busca TODAS as respostas do usuário direto da tabela respostas
      const todasRespostas = await respostaService.listarPorUsuario(selectedUsuarioId)
      console.log('[Estatísticas] dados estatísticas', todasRespostas)

      if (!todasRespostas || todasRespostas.length === 0) {
        setDesempenho(null)
        setPorDia([])
        setLoading(false)
        return
      }

      // Filtra pelo período selecionado
      const respostasFiltradas = filtrarPorPeriodo(todasRespostas, dates.inicio, dates.fim)
      console.log('[Estatísticas] respostas no período:', respostasFiltradas.length)

      if (respostasFiltradas.length === 0) {
        setDesempenho(null)
        setPorDia([])
        setLoading(false)
        return
      }

      // Calcula estatísticas no front-end a partir dos dados brutos
      const stats = calcularDesempenho(respostasFiltradas)
      const dadosDiarios = agruparPorDia(respostasFiltradas)

      console.log('[Estatísticas] desempenho calculado:', stats)
      console.log('[Estatísticas] dados por dia:', dadosDiarios)

      setDesempenho(stats)
      setPorDia(dadosDiarios)
    } catch (e: any) {
      console.error('[Estatísticas] erro ao buscar:', e)
      setErrorMsg(e?.message ?? 'Erro ao buscar respostas do usuário.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Estatísticas" subtitle="Análise de desempenho por período (calculado a partir das respostas)" />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-56">
            {loadingUsuarios ? (
              <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <Select
                label="Usuário"
                options={usuarioOptions}
                value={selectedUsuarioId}
                onChange={handleUsuarioChange}
              />
            )}
          </div>
          <div className="w-40">
            <Input
              label="Data início"
              type="date"
              value={dates.inicio}
              onChange={(e) => setDates((d) => ({ ...d, inicio: e.target.value }))}
            />
          </div>
          <div className="w-40">
            <Input
              label="Data fim"
              type="date"
              value={dates.fim}
              onChange={(e) => setDates((d) => ({ ...d, fim: e.target.value }))}
            />
          </div>
          <Button
            icon={<Search size={14} />}
            onClick={buscar}
            loading={loading}
            disabled={!selectedUsuarioId || loading}
          >
            Buscar
          </Button>
        </div>
      </div>

      {/* Erro */}
      {errorMsg && <Alert type="error" message={errorMsg} className="mb-4" />}

      {/* Loading */}
      {loading && <Loading message="Buscando respostas..." />}

      {/* Resultados */}
      {!loading && desempenho && (
        <div className="space-y-6">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Respostas"
              value={desempenho.totalRespostas}
              icon={<MessageSquare size={18} />}
            />
            <StatCard
              title="Acertos"
              value={desempenho.acertos}
              icon={<CheckCircle2 size={18} />}
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              title="Erros"
              value={desempenho.erros}
              icon={<XCircle size={18} />}
              iconBg="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              title="Taxa de Acerto"
              value={`${desempenho.taxaAcerto}%`}
              icon={<TrendingUp size={18} />}
              iconBg="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              title="Tempo Médio"
              value={`${desempenho.tempoMedioResposta}s`}
              icon={<Clock size={18} />}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <StatCard
              title="Dias Ativos"
              value={desempenho.diasAtivos}
              icon={<BarChart3 size={18} />}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
          </div>

          {/* Gráficos */}
          {porDia.length > 0 && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Acertos e Erros por dia */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Acertos e Erros por Dia
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={porDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(l) => formatDate(l)} />
                      <Legend />
                      <Bar dataKey="acertos" name="Acertos" fill="#22c55e" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="erros"   name="Erros"   fill="#f87171" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Taxa de acerto por dia */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Taxa de Acerto por Dia (%)
                  </h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={porDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(v) => [`${v}%`, 'Taxa']} labelFormatter={(l) => formatDate(l)} />
                      <Line type="monotone" dataKey="taxaAcerto" name="Taxa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Tempo médio por dia */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">
                    Tempo Médio de Resposta por Dia (s)
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={porDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={(l) => formatDate(l)} formatter={(v) => [`${v}s`, 'Tempo']} />
                      <Bar dataKey="tempoMedio" name="Tempo Médio (s)" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Detalhamento por Dia</h3>
                </div>
                <Table columns={tableColumns} data={porDia} keyExtractor={(r) => r.data} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state — buscou mas sem dados */}
      {!loading && buscouAlguma && !desempenho && !errorMsg && (
        <EmptyState
          title="Nenhuma resposta encontrada"
          description="Nenhuma resposta encontrada para este usuário no período selecionado."
          icon={<BarChart3 size={40} />}
        />
      )}

      {/* Estado inicial — nada buscado ainda */}
      {!loading && !buscouAlguma && !errorMsg && (
        <EmptyState
          title="Selecione um usuário e período"
          description="Use os filtros acima para visualizar as estatísticas calculadas a partir das respostas."
          icon={<BarChart3 size={40} />}
        />
      )}
    </div>
  )
}
