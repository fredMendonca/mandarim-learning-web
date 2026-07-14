import { useState, useCallback, useEffect, useRef } from 'react'
import {
  RefreshCcw, Brain, AlertTriangle, Clock, Target,
  TrendingUp, BookOpen, CheckCircle2, XCircle, Play,
  Lightbulb, Award, Info,
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
import { useAuth } from '@/context/AuthContext'
import { usuarioService } from '@/services/usuarioService'
import { revisaoService } from '@/services/revisaoService'
import type {
  RevisaoInteligenteResponse,
  IndicadoresRevisaoResponse,
  RegistrarRespostaRevisaoRequest,
} from '@/types'

const PRIORIDADE_COLORS = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAIXA: '#22c55e' }
const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e']

function prioridadeBadge(p: string) {
  if (p === 'ALTA') return <Badge variant="danger">Alta</Badge>
  if (p === 'MEDIA') return <Badge variant="warning">Média</Badge>
  return <Badge variant="success">Baixa</Badge>
}

export function RevisoesPage() {
  const { user, isAdmin } = useAuth()
  const toast = useToastContext()

  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>('')
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [revisoes, setRevisoes] = useState<RevisaoInteligenteResponse[] | null>(null)
  const [indicadores, setIndicadores] = useState<IndicadoresRevisaoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reviewItem, setReviewItem] = useState<RevisaoInteligenteResponse | null>(null)
  const [resposta, setResposta] = useState('')
  const [resultado, setResultado] = useState<{
    correta: boolean
    respostaEsperada: string
    tempoSegundos: number
    proximaRevisao?: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<RevisaoInteligenteResponse | null>(null)
  const startTimeRef = useRef<number>(0)

  // Fetch usuarios if admin
  useEffect(() => {
    if (isAdmin) {
      usuarioService.listar().then((data: any) => {
        setUsuarios(data)
      }).catch(() => {
        toast.error('Erro ao carregar usuários')
      })
    }
  }, [isAdmin])

  // Auto-select user if aluno
  useEffect(() => {
    if (!isAdmin && user?.id) {
      setSelectedUsuarioId(user.id)
    }
  }, [isAdmin, user])

  // Fetch revisoes and indicadores
  const fetchData = useCallback(async () => {
    if (!selectedUsuarioId) return
    setLoading(true)
    setError(null)
    try {
      const [rev, ind] = await Promise.all([
        revisaoService.inteligentes(selectedUsuarioId),
        revisaoService.indicadores(selectedUsuarioId),
      ])
      console.log('[Revisões] Indicadores:', ind)
      console.log('[Revisões] Revisões inteligentes:', rev)
      setRevisoes(rev)
      setIndicadores(ind)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados de revisão')
    } finally {
      setLoading(false)
    }
  }, [selectedUsuarioId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed: Índice de Aprendizagem
  const indiceAprendizagem = (() => {
    if (!indicadores) return 0
    const { taxaAcertoRevisoes, taxaRetencao, conteudosDominados, conteudosEmAprendizado, conteudosCriticos, revisoesPendentes } = indicadores as any
    const dominadosRatio = (conteudosDominados / (conteudosDominados + conteudosEmAprendizado || 1)) * 100
    let indice = (taxaAcertoRevisoes * 0.3) + (taxaRetencao * 0.3) + (dominadosRatio * 0.2) - (conteudosCriticos * 2) - (revisoesPendentes * 1)
    indice = Math.max(0, Math.min(100, indice))
    return Math.round(indice)
  })()

  const indiceLabel = indiceAprendizagem >= 80 ? 'Excelente' : indiceAprendizagem >= 60 ? 'Bom' : indiceAprendizagem >= 40 ? 'Regular' : 'Precisa melhorar'

  // Computed: Insights
  const insights: string[] = (() => {
    if (!indicadores) return []
    const result: string[] = []
    const ind = indicadores as any

    // Identifica conteúdos críticos (lapsos >= 2) e dá orientação
    if (ind.conteudosCriticos > 0 && revisoes) {
      const criticos = revisoes.filter((r: any) => r.lapsos >= 2)
      if (criticos.length > 0) {
        const nomes = criticos.slice(0, 3).map((r: any) => `${r.hanzi} (${r.pinyin}) — ${r.traducao}`).join('; ')
        result.push(`⚠️ Conteúdo crítico: ${nomes}. Ação: revise este conteúdo hoje e pratique em exercícios de múltipla escolha para reforçar a memória.`)
      } else {
        result.push(`Você possui ${ind.conteudosCriticos} conteúdos críticos que precisam de revisão.`)
      }
    }

    if (ind.tempoMedioResposta > 8) result.push('⏱️ Seu tempo médio está acima do ideal (>8s). Dica: pratique com flashcards rápidos para melhorar o tempo de resposta.')
    if (ind.taxaRetencao < 70) result.push('📉 Sua retenção caiu abaixo de 70%. Ação: faça revisões diárias de pelo menos 5 conteúdos para recuperar a retenção.')
    if (ind.revisoesPendentes > 5) result.push(`📋 Você tem ${ind.revisoesPendentes} revisões pendentes. Comece pelas de prioridade Alta para evitar esquecimento.`)
    if (ind.errosPorTema && ind.errosPorTema.length > 0) {
      const sorted = [...ind.errosPorTema].sort((a: any, b: any) => (b.quantidade ?? 0) - (a.quantidade ?? 0))
      if (sorted[0]) result.push(`📊 O tema "${sorted[0].tema}" concentra a maior parte dos erros. Ação: gere exercícios focados neste tema na página de IA.`)
    }
    return result
  })()

  // Computed: Forgetting Data
  const forgettingData = (() => {
    if (!revisoes) return []
    return [...revisoes]
      .sort((a: any, b: any) => (b.probabilidadeEsquecimento ?? 0) - (a.probabilidadeEsquecimento ?? 0))
      .slice(0, 10)
      .map((r: any) => ({ pinyin: r.pinyin, prob: r.probabilidadeEsquecimento ?? 0 }))
  })()

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!reviewItem || !selectedUsuarioId || submitting) return
    setSubmitting(true)
    const tempoSegundos = Math.round((Date.now() - startTimeRef.current) / 1000)
    try {
      const res = await revisaoService.responder({
        usuarioId: selectedUsuarioId,
        revisaoId: (reviewItem as any).revisaoId,
        respostaUsuario: resposta,
        tempoRespostaSegundos: tempoSegundos,
      } as RegistrarRespostaRevisaoRequest)

      // O backend retorna RevisaoInteligenteResponse com motivo e taxaAcerto
      const foiCorreta = (res as any).motivo?.includes('correta') && !(res as any).motivo?.includes('incorreta')
      setResultado({
        correta: foiCorreta,
        respostaEsperada: (res as any).traducao ?? (reviewItem as any).traducao ?? '',
        tempoSegundos,
        proximaRevisao: (res as any).proximaRevisao,
      })
    } catch (err: any) {
      toast.error('Erro ao registrar resposta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenReview = (item: RevisaoInteligenteResponse) => {
    setReviewItem(item)
    setResposta('')
    setResultado(null)
    startTimeRef.current = Date.now()
  }

  const handleCloseReview = () => {
    setReviewItem(null)
    setResposta('')
    setResultado(null)
    fetchData()
  }

  const handleNextReview = () => {
    if (!revisoes) return
    const next = revisoes.find((r: any) => r.prioridade === 'ALTA' && r !== reviewItem)
    if (next) {
      handleOpenReview(next)
    } else {
      handleCloseReview()
    }
  }

  const handleReviewAlta = () => {
    if (!revisoes) return
    const alta = revisoes.find((r: any) => r.prioridade === 'ALTA')
    if (alta) handleOpenReview(alta)
  }

  // Chart data from indicadores
  const evolucaoData = (indicadores as any)?.evolucaoDesempenho ?? []
  const errosPorTemaData = (indicadores as any)?.errosPorTema ?? []
  const distribuicaoPrioridade = (() => {
    if (!revisoes) return []
    const alta = revisoes.filter((r: any) => r.prioridade === 'ALTA').length
    const media = revisoes.filter((r: any) => r.prioridade === 'MEDIA').length
    const baixa = revisoes.filter((r: any) => r.prioridade === 'BAIXA').length
    return [
      { name: 'Alta', value: alta },
      { name: 'Média', value: media },
      { name: 'Baixa', value: baixa },
    ]
  })()
  const retencaoData = (indicadores as any)?.evolucaoRetencao ?? []
  const probEsquecimentoData = (indicadores as any)?.probabilidadeEsquecimento ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisões Inteligentes — Learning Analytics"
        subtitle="Sistema de revisão espaçada com priorização baseada em Business Intelligence"
      />

      {/* User Selection */}
      {isAdmin ? (
        <div className="max-w-xs">
          <Select
            label="Selecionar Aluno"
            value={selectedUsuarioId}
            onChange={(e) => setSelectedUsuarioId(e.target.value)}
            options={[
              { value: '', label: 'Selecione um aluno...' },
              ...usuarios.map((u: any) => ({ value: u.id.toString(), label: u.nome })),
            ]}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-600">Estudando como: <strong>{user?.nome}</strong></p>
      )}

      {loading && <Loading />}
      {error && <Alert type="error" message={error} />}

      {!loading && !error && indicadores && revisoes && (
        <>
          {/* SECTION A: KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            <Card className="p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 text-amber-500" size={20} />
              <p className="text-xs text-gray-500">Pendentes hoje</p>
              <p className="text-lg font-bold">{(indicadores as any).revisoesPendentes}</p>
            </Card>
            <Card className="p-3 text-center">
              <Target className="mx-auto mb-1 text-blue-500" size={20} />
              <p className="text-xs text-gray-500">Taxa de acerto</p>
              <p className="text-lg font-bold">{(indicadores as any).taxaAcertoRevisoes}%</p>
            </Card>
            <Card className="p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 text-red-500" size={20} />
              <p className="text-xs text-gray-500">Conteúdos críticos</p>
              <p className="text-lg font-bold">{(indicadores as any).conteudosCriticos}</p>
            </Card>
            <Card className="p-3 text-center">
              <Clock className="mx-auto mb-1 text-purple-500" size={20} />
              <p className="text-xs text-gray-500">Tempo médio</p>
              <p className="text-lg font-bold">{(indicadores as any).tempoMedioResposta}s</p>
            </Card>
            <Card className="p-3 text-center">
              <TrendingUp className="mx-auto mb-1 text-green-500" size={20} />
              <p className="text-xs text-gray-500">Retenção</p>
              <p className="text-lg font-bold">{(indicadores as any).taxaRetencao}%</p>
            </Card>
            <Card className="p-3 text-center">
              <BookOpen className="mx-auto mb-1 text-indigo-500" size={20} />
              <p className="text-xs text-gray-500">Dominados</p>
              <p className="text-lg font-bold">{(indicadores as any).conteudosDominados}</p>
            </Card>
            <Card className="p-3 text-center">
              <Award className="mx-auto mb-1" size={20} style={{ color: indiceAprendizagem >= 60 ? '#22c55e' : indiceAprendizagem >= 40 ? '#f59e0b' : '#ef4444' }} />
              <p className="text-xs text-gray-500">Índice de Aprendizagem</p>
              <p className="text-lg font-bold">{indiceAprendizagem}/100 - {indiceLabel}</p>
            </Card>
          </div>

          {/* SECTION B: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Chart 1: Evolução de Desempenho */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Evolução de Desempenho</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" tickFormatter={(v: string) => v?.slice?.(-5) ?? v} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="taxaAcerto" stroke="#3b82f6" name="Taxa Acerto %" />
                  <Line type="monotone" dataKey="tempoMedio" stroke="#8b5cf6" name="Tempo Médio (s)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Chart 2: Erros por Tema */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Erros por Tema</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={errosPorTemaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tema" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#ef4444" name="Erros" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Chart 3: Distribuição de Prioridade */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Distribuição de Prioridade</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={distribuicaoPrioridade} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {distribuicaoPrioridade.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Chart 4: Evolução de Retenção */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Evolução de Retenção</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={retencaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" tickFormatter={(v: string) => v?.slice?.(-5) ?? v} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="retencao" stroke="#22c55e" name="Retenção %" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Chart 5: Probabilidade de Esquecimento */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold mb-3">Probabilidade de Esquecimento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={probEsquecimentoData.length > 0 ? probEsquecimentoData.map((p: any) => ({ pinyin: p.pinyin || p.conteudo, prob: p.probabilidade })) : forgettingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <YAxis dataKey="pinyin" type="category" width={80} />
                  <XAxis type="number" domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="prob" fill="#ef4444" name="Prob. Esquecimento %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* SECTION C: Insights Inteligentes */}
          {insights.length > 0 && (
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="text-amber-500" size={20} />
                <h3 className="text-sm font-semibold">Insights Inteligentes</h3>
              </div>
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div key={idx} className="bg-amber-50 rounded p-2 text-sm text-amber-800">
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* SECTION D: Revisões Priorizadas */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="text-indigo-500" size={20} />
                <h3 className="text-sm font-semibold">Revisões Priorizadas para Hoje</h3>
                <Badge variant="info">{revisoes.length}</Badge>
              </div>
              <Button size="sm" onClick={handleReviewAlta}>
                <Play size={14} className="mr-1" />
                Revisar Prioridade Alta
              </Button>
            </div>

            {revisoes.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={40} className="text-green-400" />}
                title="Nenhuma revisão pendente"
                description="Nenhuma revisão pendente no momento. Continue praticando no Quiz para gerar novas recomendações."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-2">Prioridade</th>
                      <th className="p-2">Hanzi</th>
                      <th className="p-2">Pinyin</th>
                      <th className="p-2">Tradução</th>
                      <th className="p-2">HSK</th>
                      <th className="p-2">Tema</th>
                      <th className="p-2">Últ. Revisão</th>
                      <th className="p-2">Próx. Revisão</th>
                      <th className="p-2">Taxa%</th>
                      <th className="p-2">Tempo</th>
                      <th className="p-2">P.Esq%</th>
                      <th className="p-2">Score</th>
                      <th className="p-2">Motivo</th>
                      <th className="p-2">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revisoes.map((r: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedDetail(r)}
                      >
                        <td className="p-2">{prioridadeBadge(r.prioridade)}</td>
                        <td className="p-2 font-bold text-base">{r.hanzi}</td>
                        <td className="p-2">{r.pinyin}</td>
                        <td className="p-2">{r.traducao}</td>
                        <td className="p-2">{r.nivel}</td>
                        <td className="p-2">{r.tema}</td>
                        <td className="p-2">{r.ultimaRevisao?.slice?.(0, 10) ?? '-'}</td>
                        <td className="p-2">{r.proximaRevisao?.slice?.(0, 10) ?? '-'}</td>
                        <td className="p-2">{r.taxaAcerto ?? 0}%</td>
                        <td className="p-2">{r.tempoMedio ?? '-'}s</td>
                        <td className="p-2">{r.probabilidadeEsquecimento ?? 0}%</td>
                        <td className="p-2">{r.score ?? 0}</td>
                        <td className="p-2 max-w-[120px] truncate" title={r.motivo}>{r.motivo}</td>
                        <td className="p-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenReview(r) }}>
                            <Play size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* SECTION E: Por que revisar? */}
          {selectedDetail && (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  Por que revisar: {(selectedDetail as any).hanzi} ({(selectedDetail as any).pinyin})
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setSelectedDetail(null)}>
                  Fechar
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Revisão vencida</p>
                  <p className="font-semibold">{(selectedDetail as any).revisaoVencida ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Taxa de acerto</p>
                  <p className="font-semibold">{(selectedDetail as any).taxaAcerto ?? 0}%</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Tempo médio</p>
                  <p className="font-semibold">{(selectedDetail as any).tempoMedio ?? '-'}s</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Lapsos</p>
                  <p className="font-semibold">{(selectedDetail as any).lapsos ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Dias desde última revisão</p>
                  <p className="font-semibold">{(selectedDetail as any).diasDesdeUltimaRevisao ?? '-'}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Score final</p>
                  <p className="font-semibold">{(selectedDetail as any).score ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 text-xs">Prob. esquecimento</p>
                  <p className="font-semibold">{(selectedDetail as any).probabilidadeEsquecimento ?? 0}%</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                <Info size={14} className="inline mr-1" />
                <strong>Motivo:</strong> {(selectedDetail as any).motivo}
              </div>
            </Card>
          )}
        </>
      )}

      {/* REVIEW MODAL */}
      <Modal
        open={reviewItem !== null}
        onClose={handleCloseReview}
        title="Revisão Prática"
        size="lg"
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold mb-1">{(reviewItem as any).hanzi}</p>
              <p className="text-lg text-gray-500">{(reviewItem as any).pinyin}</p>
            </div>

            {!resultado ? (
              <div className="space-y-3">
                <Input
                  label="Qual a tradução?"
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitReview() }}
                  placeholder="Digite a tradução..."
                  autoFocus
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || !resposta.trim()}
                  className="w-full"
                >
                  {submitting ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`rounded p-4 text-center ${resultado.correta ? 'bg-green-50' : 'bg-red-50'}`}>
                  {resultado.correta ? (
                    <CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} />
                  ) : (
                    <XCircle className="mx-auto mb-2 text-red-500" size={32} />
                  )}
                  <p className="font-semibold text-lg">
                    {resultado.correta ? 'Correto!' : 'Incorreto'}
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Sua resposta:</strong> {resposta}</p>
                  {!resultado.correta && (
                    <p><strong>Resposta esperada:</strong> {resultado.respostaEsperada}</p>
                  )}
                  <p><strong>Tempo:</strong> {resultado.tempoSegundos}s</p>
                  {resultado.proximaRevisao && (
                    <p><strong>Próxima revisão:</strong> {resultado.proximaRevisao.slice(0, 10)}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCloseReview} className="flex-1">
                    Fechar
                  </Button>
                  <Button onClick={handleNextReview} className="flex-1">
                    Próxima Revisão
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
