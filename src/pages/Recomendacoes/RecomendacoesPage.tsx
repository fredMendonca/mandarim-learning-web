import { useState, useEffect, useCallback } from 'react'
import {
  Lightbulb, RefreshCcw, Brain, Target, Clock, TrendingUp,
  BookOpen, Sparkles, Play, AlertTriangle, Info, Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { useToastContext } from '@/context/ToastContext'
import { useFetch } from '@/hooks/useFetch'
import { usuarioService } from '@/services/usuarioService'
import api from '@/lib/axios'
import { useNavigate } from 'react-router-dom'

const TIPO_ICONS: Record<string, any> = {
  REVISAO: RefreshCcw,
  EXERCICIO: Brain,
  CONTEUDO_NOVO: BookOpen,
  IA: Sparkles,
}

const TIPO_LABELS: Record<string, string> = {
  REVISAO: 'Revisão',
  EXERCICIO: 'Exercício',
  CONTEUDO_NOVO: 'Conteúdo Novo',
  IA: 'Inteligência Artificial',
}

export function RecomendacoesPage() {
  const { user, isAdmin } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { data: usuarios } = useFetch(() => usuarioService.listar(), [])

  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRec, setSelectedRec] = useState<any>(null)

  // Auto-select for aluno
  useEffect(() => {
    if (!isAdmin && user?.id) {
      setSelectedUsuarioId(user.id)
    }
  }, [isAdmin, user])

  const fetchData = useCallback(async (userId: string) => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/recomendacoes/usuario/${userId}/plano-inteligente`)
      setData(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar recomendações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedUsuarioId) fetchData(selectedUsuarioId)
  }, [selectedUsuarioId, fetchData])

  const usuarioOptions = [
    { value: '', label: 'Selecione um usuário' },
    ...(usuarios ?? []).map((u) => ({ value: String(u.id), label: u.nome })),
  ]

  function prioridadeBadge(p: string) {
    if (p === 'ALTA') return <Badge variant="danger">Alta</Badge>
    if (p === 'MEDIA') return <Badge variant="warning">Média</Badge>
    return <Badge variant="success">Baixa</Badge>
  }

  function tipoIcon(tipo: string) {
    const Icon = TIPO_ICONS[tipo] || Lightbulb
    return <Icon size={14} />
  }

  const kpis = data?.kpis
  const recomendacoes = data?.recomendacoes ?? []
  const planoEstudo = data?.planoEstudo
  const insights = data?.insights ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recomendações Inteligentes"
        subtitle="Assistente de estudo baseado em Business Intelligence e IA"
      />

      {/* User selection */}
      {isAdmin ? (
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Select options={usuarioOptions} value={selectedUsuarioId}
              onChange={(e) => setSelectedUsuarioId(e.target.value)} />
          </div>
          {selectedUsuarioId && (
            <Button variant="outline" size="sm" icon={<RefreshCcw size={13} />}
              onClick={() => fetchData(selectedUsuarioId)}>Atualizar</Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Plano personalizado para: <strong>{user?.nome}</strong></p>
      )}

      {error && <Alert type="error" message={error} />}
      {loading && <Loading message="Calculando melhor estratégia de estudo..." />}

      {!loading && !error && data && (
        <>
          {/* ═══ KPI CARDS ═══ */}
          {kpis && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="p-4 text-center">
                <Zap size={18} className="mx-auto text-amber-500 mb-1" />
                <p className="text-xs text-slate-500">Próxima Ação</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{kpis.proximaAcao}</p>
              </Card>
              <Card className="p-4 text-center">
                <AlertTriangle size={18} className="mx-auto text-red-500 mb-1" />
                <p className="text-xs text-slate-500">Tema Crítico</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{kpis.temaMaisCritico}</p>
              </Card>
              <Card className="p-4 text-center">
                <BookOpen size={18} className="mx-auto text-blue-500 mb-1" />
                <p className="text-xs text-slate-500">Conteúdos Sugeridos</p>
                <p className="text-2xl font-bold text-slate-800">{kpis.conteudosSugeridos}</p>
              </Card>
              <Card className="p-4 text-center">
                <Brain size={18} className="mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-slate-500">Exercícios</p>
                <p className="text-2xl font-bold text-slate-800">{kpis.exerciciosRecomendados}</p>
              </Card>
              <Card className="p-4 text-center">
                <Clock size={18} className="mx-auto text-indigo-500 mb-1" />
                <p className="text-xs text-slate-500">Tempo Estimado</p>
                <p className="text-2xl font-bold text-slate-800">{kpis.tempoEstimadoMinutos}min</p>
              </Card>
              <Card className="p-4 text-center">
                <TrendingUp size={18} className="mx-auto text-green-500 mb-1" />
                <p className="text-xs text-slate-500">Impacto Retenção</p>
                <p className="text-2xl font-bold text-green-600">{kpis.impactoRetencao}</p>
              </Card>
            </div>
          )}

          {/* ═══ PLANO DE ESTUDO SUGERIDO ═══ */}
          {planoEstudo && (
            <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Plano de Estudo Sugerido</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{planoEstudo.revisarCriticos}</p>
                  <p className="text-[10px] text-slate-500">Revisar críticos</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{planoEstudo.praticarExercicios}</p>
                  <p className="text-[10px] text-slate-500">Exercícios</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{planoEstudo.conteudosNovos}</p>
                  <p className="text-[10px] text-slate-500">Conteúdos novos</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-amber-600">{planoEstudo.reforcarTema}</p>
                  <p className="text-[10px] text-slate-500">Reforçar tema</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-700">{planoEstudo.tempoTotal}min</p>
                  <p className="text-[10px] text-slate-500">Tempo total</p>
                </div>
              </div>
            </Card>
          )}

          {/* ═══ RECOMENDAÇÃO COM IA ═══ */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-violet-600" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Recomendação com IA</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="sm" className="justify-start" icon={<Brain size={14} />}
                onClick={() => navigate('/ia')}>Gerar exercícios personalizados</Button>
              <Button variant="outline" size="sm" className="justify-start" icon={<BookOpen size={14} />}
                onClick={() => navigate('/ia')}>Gerar novas frases</Button>
              <Button variant="outline" size="sm" className="justify-start" icon={<Target size={14} />}
                onClick={() => navigate('/ia')}>Criar plano de estudo</Button>
              <Button variant="outline" size="sm" className="justify-start" icon={<AlertTriangle size={14} />}
                onClick={() => navigate('/ia')}>Reforçar tema crítico</Button>
            </div>
          </Card>

          {/* ═══ LISTA DE RECOMENDAÇÕES ═══ */}
          <div>
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Lightbulb size={14} /> Recomendações Priorizadas
              <Badge variant="info">{recomendacoes.length}</Badge>
            </h2>

            {recomendacoes.length === 0 ? (
              <EmptyState
                title="Nenhuma recomendação disponível"
                description="Faça alguns quizzes para que o sistema gere recomendações personalizadas."
                icon={<Lightbulb size={40} />}
              />
            ) : (
              <div className="space-y-3">
                {recomendacoes.map((rec: any, i: number) => (
                  <Card key={i} className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedRec(selectedRec === rec ? null : rec)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {prioridadeBadge(rec.prioridade)}
                        <Badge variant="default" className="flex items-center gap-1">
                          {tipoIcon(rec.tipo)} {TIPO_LABELS[rec.tipo] ?? rec.tipo}
                        </Badge>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="hanzi text-lg font-medium text-slate-800">{rec.hanzi}</span>
                            <span className="text-sm text-slate-500">{rec.pinyin}</span>
                            <span className="text-sm text-slate-600">— {rec.traducao}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{rec.motivo}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="text-xs text-slate-400">
                          <p>Score: <strong>{rec.score}</strong></p>
                          <p className="text-green-600">{rec.impacto}</p>
                        </div>
                        {rec.tipo === 'REVISAO' && (
                          <Button size="sm" variant="ghost" icon={<Play size={12} />}
                            onClick={(e) => { e.stopPropagation(); navigate('/revisoes') }} />
                        )}
                        {rec.tipo === 'EXERCICIO' && (
                          <Button size="sm" variant="ghost" icon={<Play size={12} />}
                            onClick={(e) => { e.stopPropagation(); navigate('/quiz') }} />
                        )}
                        {rec.tipo === 'IA' && (
                          <Button size="sm" variant="ghost" icon={<Sparkles size={12} />}
                            onClick={(e) => { e.stopPropagation(); navigate('/ia') }} />
                        )}
                      </div>
                    </div>

                    {/* Explicabilidade — expande ao clicar */}
                    {selectedRec === rec && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                          {rec.taxaAcerto !== undefined && (
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-400">Taxa de acerto</p>
                              <p className="font-semibold">{rec.taxaAcerto}%</p>
                            </div>
                          )}
                          {rec.tempoMedio !== undefined && (
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-400">Tempo médio</p>
                              <p className="font-semibold">{Math.round(rec.tempoMedio)}s</p>
                            </div>
                          )}
                          {rec.lapsos !== undefined && (
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-400">Lapsos</p>
                              <p className="font-semibold">{rec.lapsos}</p>
                            </div>
                          )}
                          {rec.nivelHsk !== undefined && (
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-400">HSK</p>
                              <p className="font-semibold">{rec.nivelHsk}</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-blue-50 rounded p-2 flex items-start gap-2">
                          <Info size={12} className="text-blue-500 mt-0.5 shrink-0" />
                          <div className="text-xs text-blue-800">
                            <p><strong>Motivo:</strong> {rec.motivo}</p>
                            <p><strong>Impacto esperado:</strong> {rec.impacto}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ═══ INSIGHTS ═══ */}
          {insights.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-700">Insights do Assistente</h2>
              </div>
              <div className="space-y-2">
                {insights.map((insight: string, i: number) => (
                  <div key={i} className="bg-amber-50 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-start gap-2">
                    <Lightbulb size={12} className="text-amber-500 mt-0.5 shrink-0" />
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
