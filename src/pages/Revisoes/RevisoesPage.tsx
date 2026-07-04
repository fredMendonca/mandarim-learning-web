import { useState, useCallback, useEffect, useRef } from 'react'
import {
  RefreshCcw, Brain, AlertTriangle, Clock, Target,
  TrendingUp, BookOpen, CheckCircle2, XCircle, Play,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useToastContext } from '@/context/ToastContext'
import { usuarioService } from '@/services/usuarioService'
import { revisaoService } from '@/services/revisaoService'
import type {
  RevisaoInteligenteResponse,
  IndicadoresRevisaoResponse,
  RegistrarRespostaRevisaoRequest,
} from '@/types'

const PRIORIDADE_COLORS = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAIXA: '#22c55e' }
const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e']

export function RevisoesPage() {
  const toast = useToastContext()
  const { data: usuarios } = useFetch(() => usuarioService.listar(), [])

  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')
  const [revisoes, setRevisoes] = useState<RevisaoInteligenteResponse[] | null>(null)
  const [indicadores, setIndicadores] = useState<IndicadoresRevisaoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Review practice modal
  const [reviewItem, setReviewItem] = useState<RevisaoInteligenteResponse | null>(null)
  const [resposta, setResposta] = useState('')
  const [resultado, setResultado] = useState<{ correta: boolean; respostaEsperada: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)

  const usuarioOptions = [
    { value: '', label: 'Selecione um usuário' },
    ...(usuarios ?? []).map((u) => ({ value: String(u.id), label: u.nome })),
  ]

  const fetchData = useCallback(async (userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [rev, ind] = await Promise.all([
        revisaoService.inteligentes(userId),
        revisaoService.indicadores(userId),
      ])
      setRevisoes(rev)
      setIndicadores(ind)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar dados de revisão.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedUsuarioId) fetchData(selectedUsuarioId)
  }, [selectedUsuarioId, fetchData])

  // ─── Review practice ───────────────────────────────────────────────────────

  function startReview(item: RevisaoInteligenteResponse) {
    setReviewItem(item)
    setResposta('')
    setResultado(null)
    startTimeRef.current = Date.now()
  }

  async function submitReview() {
    if (!reviewItem || !selectedUsuarioId) return
    setSubmitting(true)
    const tempoSegundos = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const req: RegistrarRespostaRevisaoRequest = {
        usuarioId: selectedUsuarioId,
        revisaoId: reviewItem.revisaoId,
        respostaUsuario: resposta,
        tempoRespostaSegundos: tempoSegundos,
      }
      const res = await revisaoService.responder(req)
      const correta = res.motivo?.includes('correta') ?? false
      setResultado({ correta, respostaEsperada: reviewItem.traducao })

      if (correta) {
        toast.success('Resposta correta!')
      } else {
        toast.warning('Resposta incorreta.')
      }

      // Refresh data
      fetchData(selectedUsuarioId)
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao registrar resposta.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  function prioridadeBadge(p: string) {
    if (p === 'ALTA') return <Badge variant="danger">Alta</Badge>
    if (p === 'MEDIA') return <Badge variant="warning">Média</Badge>
    return <Badge variant="success">Baixa</Badge>
  }

  const pieData = indicadores ? [
    { name: 'Alta', value: indicadores.revisoesPorPrioridade?.ALTA ?? 0 },
    { name: 'Média', value: indicadores.revisoesPorPrioridade?.MEDIA ?? 0 },
    { name: 'Baixa', value: indicadores.revisoesPorPrioridade?.BAIXA ?? 0 },
  ] : []

  const errosData = indicadores
    ? Object.entries(indicadores.errosPorTema ?? {}).map(([tema, count]) => ({ tema, erros: count }))
    : []

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Revisões Inteligentes"
        subtitle="Revisão espaçada com priorização baseada em BI e desempenho individual"
      />

      {/* User selection */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-64">
          <Select
            options={usuarioOptions}
            value={selectedUsuarioId}
            onChange={(e) => setSelectedUsuarioId(e.target.value)}
          />
        </div>
        {selectedUsuarioId && (
          <Button variant="outline" size="sm" icon={<RefreshCcw size={13} />}
            onClick={() => fetchData(selectedUsuarioId)}>
            Atualizar
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}
      {!selectedUsuarioId && <Alert type="info" message="Selecione um usuário para ver as revisões inteligentes." />}
      {loading && <Loading />}

      {!loading && indicadores && (
        <>
          {/* ─── KPI Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-amber-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.revisoesPendentes}</p>
              <p className="text-xs text-slate-500">Pendentes hoje</p>
            </Card>
            <Card className="p-4 text-center">
              <Target size={20} className="mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.taxaAcertoRevisoes?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Taxa de acerto</p>
            </Card>
            <Card className="p-4 text-center">
              <AlertTriangle size={20} className="mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.conteudosCriticos}</p>
              <p className="text-xs text-slate-500">Conteúdos críticos</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock size={20} className="mx-auto text-purple-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.tempoMedioResposta?.toFixed(1)}s</p>
              <p className="text-xs text-slate-500">Tempo médio</p>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp size={20} className="mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.taxaRetencao?.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Taxa de retenção</p>
            </Card>
            <Card className="p-4 text-center">
              <BookOpen size={20} className="mx-auto text-indigo-500 mb-1" />
              <p className="text-2xl font-bold text-slate-800">{indicadores.conteudosDominados}</p>
              <p className="text-xs text-slate-500">Dominados</p>
            </Card>
          </div>

          {/* ─── Charts ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Evolução da retenção */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolução da Taxa de Retenção (14 dias)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={indicadores.evolucaoRetencao ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="taxaRetencao" stroke="#3b82f6" strokeWidth={2} name="Taxa %" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Revisões por prioridade */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Revisões por Prioridade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} label={(entry) => `${entry.name}: ${entry.value}`}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Erros por tema */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Erros por Tema</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={errosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tema" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="erros" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Acertos vs Erros */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Acertos vs Erros (Total)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { tipo: 'Acertos', valor: indicadores.acertosVsErros?.acertos ?? 0 },
                  { tipo: 'Erros', valor: indicadores.acertosVsErros?.erros ?? 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tipo" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* ─── Prioritized table ─── */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Revisões Priorizadas
                {revisoes && revisoes.length > 0 && (
                  <Badge variant="info" className="ml-2">{revisoes.length}</Badge>
                )}
              </h3>
              {revisoes && revisoes.filter(r => r.prioridade === 'ALTA').length > 0 && (
                <Button size="sm" icon={<Play size={13} />}
                  onClick={() => {
                    const alta = revisoes.find(r => r.prioridade === 'ALTA')
                    if (alta) startReview(alta)
                  }}>
                  Revisar Prioridade Alta
                </Button>
              )}
            </div>

            {(!revisoes || revisoes.length === 0) ? (
              <div className="p-8">
                <EmptyState
                  title="Nenhuma revisão encontrada"
                  description="Este usuário ainda não possui revisões cadastradas."
                  icon={<Brain size={40} />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Prioridade</th>
                      <th className="px-3 py-2 text-left">Hanzi</th>
                      <th className="px-3 py-2 text-left">Pinyin</th>
                      <th className="px-3 py-2 text-left">Tradução</th>
                      <th className="px-3 py-2 text-center">HSK</th>
                      <th className="px-3 py-2 text-left">Tema</th>
                      <th className="px-3 py-2 text-center">Repet.</th>
                      <th className="px-3 py-2 text-center">Lapsos</th>
                      <th className="px-3 py-2 text-center">Taxa %</th>
                      <th className="px-3 py-2 text-center">P. Esq. %</th>
                      <th className="px-3 py-2 text-center">Score</th>
                      <th className="px-3 py-2 text-left">Motivo</th>
                      <th className="px-3 py-2 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {revisoes.map((rev) => (
                      <tr key={rev.revisaoId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{prioridadeBadge(rev.prioridade)}</td>
                        <td className="px-3 py-2 hanzi text-lg font-medium">{rev.hanzi}</td>
                        <td className="px-3 py-2 text-slate-600">{rev.pinyin}</td>
                        <td className="px-3 py-2 text-slate-700">{rev.traducao}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant="info">{rev.nivelHsk}</Badge>
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{rev.tema ?? '—'}</td>
                        <td className="px-3 py-2 text-center">{rev.repeticoes}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={rev.lapsos >= 2 ? 'text-red-600 font-medium' : ''}>
                            {rev.lapsos}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={rev.taxaAcerto < 70 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {rev.taxaAcerto?.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={rev.probabilidadeEsquecimento > 70 ? 'text-red-600 font-medium' : ''}>
                            {rev.probabilidadeEsquecimento?.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-xs">{rev.scorePrioridade}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[200px] truncate" title={rev.motivo}>
                          {rev.motivo}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button variant="ghost" size="sm" icon={<Play size={12} />}
                            onClick={() => startReview(rev)} aria-label="Revisar">
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ─── Review Practice Modal ─── */}
      <Modal open={reviewItem !== null} onClose={() => { setReviewItem(null); setResultado(null) }}
        title="Revisão Prática" size="lg">
        {reviewItem && (
          <div className="space-y-6">
            {/* Content display */}
            <div className="text-center bg-slate-50 rounded-xl p-6">
              <p className="hanzi text-4xl font-medium text-slate-800 mb-2">{reviewItem.hanzi}</p>
              <p className="text-slate-500">{reviewItem.pinyin}</p>
            </div>

            {!resultado ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Digite a tradução:
                  </label>
                  <Input
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Digite a tradução em português..."
                    onKeyDown={(e) => { if (e.key === 'Enter' && resposta.trim()) submitReview() }}
                    autoFocus
                  />
                </div>
                <Button className="w-full" onClick={submitReview}
                  disabled={!resposta.trim()} loading={submitting}>
                  Validar Resposta
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Result */}
                <div className={`rounded-xl p-4 text-center ${resultado.correta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {resultado.correta ? (
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle2 size={20} />
                      <span className="font-medium">Correto!</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-2 text-red-700 mb-2">
                        <XCircle size={20} />
                        <span className="font-medium">Incorreto</span>
                      </div>
                      <p className="text-sm text-red-600">
                        Sua resposta: <strong>{resposta}</strong>
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Resposta esperada: <strong>{resultado.respostaEsperada}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1"
                    onClick={() => { setReviewItem(null); setResultado(null) }}>
                    Fechar
                  </Button>
                  {revisoes && revisoes.length > 1 && (
                    <Button className="flex-1" icon={<Play size={13} />}
                      onClick={() => {
                        const next = revisoes.find(r => r.revisaoId !== reviewItem.revisaoId && r.prioridade === 'ALTA')
                          ?? revisoes.find(r => r.revisaoId !== reviewItem.revisaoId)
                        if (next) startReview(next)
                        else { setReviewItem(null); setResultado(null) }
                      }}>
                      Próxima Revisão
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
