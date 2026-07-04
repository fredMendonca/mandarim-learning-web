import { useState, useEffect } from 'react'
import {
  Target, TrendingUp, BookOpen, Clock, Flame, AlertTriangle,
  Brain, Play, Star, Award, Lightbulb, Calendar, BarChart3,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import api from '@/lib/axios'
import { useNavigate } from 'react-router-dom'

export function AlunoDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/aluno/dashboard')
        setData(res.data)
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar dashboard.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Loading message="Carregando seu dashboard..." />
  if (error) return <Alert type="error" message={error} />
  if (!data) return null

  const errosPorTemaData = data.errosPorTema
    ? Object.entries(data.errosPorTema).map(([tema, erros]) => ({ tema, erros }))
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Olá, {data.nome || user?.nome}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          HSK {data.nivelHsk} — Dashboard pessoal de aprendizado com análise inteligente
        </p>
      </div>

      {/* ═══ MEU DESEMPENHO — KPIs ═══ */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <BarChart3 size={14} /> Meu Desempenho
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard icon={<Target size={16} className="text-blue-500" />} value={`${data.taxaAcerto}%`} label="Taxa de Acerto" />
          <KpiCard icon={<TrendingUp size={16} className="text-green-500" />} value={`${data.retencao}%`} label="Retenção" />
          <KpiCard icon={<Award size={16} className="text-emerald-500" />} value={data.conteudosDominados} label="Dominados" />
          <KpiCard icon={<BookOpen size={16} className="text-indigo-500" />} value={data.conteudosEmAprendizado} label="Em Aprendizado" />
          <KpiCard icon={<Clock size={16} className="text-purple-500" />} value={`${data.tempoMedioResposta}s`} label="Tempo Médio" />
          <KpiCard icon={<Flame size={16} className="text-orange-500" />} value={data.sequenciaDias} label="Dias Seguidos" />
          <KpiCard icon={<AlertTriangle size={16} className="text-amber-500" />} value={data.revisoesPendentes} label="Revisões Pendentes" />
          <KpiCard icon={<Brain size={16} className="text-red-500" />} value={`${data.probabilidadeMediaEsquecimento}%`} label="Prob. Esquecimento" />
        </div>
      </div>

      {/* CTA Revisão + Plano de Estudos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.revisoesPendentes > 0 && (
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-amber-600" />
              <h3 className="font-semibold text-amber-800">Revisões Pendentes</h3>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              Você tem <strong>{data.revisoesPendentes}</strong> conteúdo{data.revisoesPendentes > 1 ? 's' : ''} para revisar hoje.
            </p>
            <Button size="sm" icon={<Play size={13} />} onClick={() => navigate('/revisoes')}>
              Revisar agora
            </Button>
          </Card>
        )}

        {/* Plano de Estudos Inteligente */}
        {data.planoEstudos && (
          <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="font-semibold text-blue-800">Plano de Estudos Inteligente</h3>
            </div>
            <p className="text-xs text-blue-600 mb-3">Hoje recomendamos:</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-700">{data.planoEstudos.exerciciosRecomendados}</p>
                <p className="text-[10px] text-slate-500">exercícios</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-700">{data.planoEstudos.revisoesRecomendadas}</p>
                <p className="text-[10px] text-slate-500">revisões</p>
              </div>
              <div className="bg-white rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-700">{data.planoEstudos.conteudosNovos}</p>
                <p className="text-[10px] text-slate-500">conteúdos novos</p>
              </div>
            </div>
            <p className="text-xs text-blue-500">
              Estimativa: <strong>{data.planoEstudos.tempoEstimadoMinutos} minutos</strong>
            </p>
          </Card>
        )}
      </div>

      {/* ═══ MINHA EVOLUÇÃO — Gráficos ═══ */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <TrendingUp size={14} /> Minha Evolução
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evolução Taxa de Acerto */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolução da Taxa de Acerto (30 dias)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.evolucaoTaxaAcerto ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(-5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="taxaAcerto" stroke="#3b82f6" strokeWidth={2} dot={false} name="Taxa %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Evolução Retenção */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolução da Retenção (14 dias)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.evolucaoRetencao ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(-5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="retencao" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Retenção %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Tempo Médio por Dia */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Tempo Médio de Resposta (30 dias)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.tempoMedioPorDia ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(-5)} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Line type="monotone" dataKey="tempoMedio" stroke="#f59e0b" strokeWidth={2} dot={false} name="Tempo (s)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Conteúdos Estudados por Dia */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Conteúdos Estudados por Dia</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.conteudosEstudadosPorDia ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(-5)} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Erros por Tema */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Erros por Tema</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={errosPorTemaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tema" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="erros" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Desempenho por HSK */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Desempenho por Nível HSK</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.desempenhoPorHsk ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nivel" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="taxaAcerto" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Taxa %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* ═══ RECOMENDAÇÃO INTELIGENTE ═══ */}
      {data.recomendacoes && data.recomendacoes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Lightbulb size={14} /> Recomendação Inteligente
          </h2>
          <div className="space-y-2">
            {data.recomendacoes.map((rec: any, i: number) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={rec.prioridade === 'ALTA' ? 'danger' : rec.prioridade === 'MEDIA' ? 'warning' : 'success'}>
                      {rec.prioridade}
                    </Badge>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="hanzi text-lg font-medium text-slate-800">{rec.hanzi}</span>
                        <span className="text-sm text-slate-500">{rec.pinyin}</span>
                        <span className="text-sm text-slate-600">— {rec.traducao}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Lightbulb size={10} className="text-amber-500" />
                        {rec.motivo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>Score: {rec.scorePrioridade}</p>
                    <p>Esq: {rec.probabilidadeEsquecimento}%</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ MEU NÍVEL ═══ */}
      {data.meuNivel && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Star size={14} /> Meu Nível
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{data.meuNivel.conteudosDominados}</p>
              <p className="text-xs text-slate-500">Dominados</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{data.meuNivel.conteudosCriticos}</p>
              <p className="text-xs text-slate-500">Críticos</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{data.meuNivel.retencao}%</p>
              <p className="text-xs text-slate-500">Retenção</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{data.totalExerciciosRespondidos}</p>
              <p className="text-xs text-slate-500">Exercícios</p>
            </Card>
          </div>
          {/* Evolução semanal de dominados */}
          {data.meuNivel.evolucaoSemanal && data.meuNivel.evolucaoSemanal.length > 0 && (
            <Card className="p-5 mt-3">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolução de Conteúdos Dominados por Semana</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data.meuNivel.evolucaoSemanal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(-5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="dominados" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* ═══ PALAVRAS DIFÍCEIS ═══ */}
      {data.palavrasDificeis && data.palavrasDificeis.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 Palavras Mais Difíceis</h3>
          <div className="space-y-2">
            {data.palavrasDificeis.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-5">{i + 1}.</span>
                  <span className="hanzi text-lg font-medium text-slate-800">{p.hanzi}</span>
                  <span className="text-sm text-slate-500">{p.pinyin}</span>
                  <span className="text-sm text-slate-600">— {p.traducao}</span>
                </div>
                <Badge variant="danger">{p.lapsos} lapsos</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══ PRÓXIMA REVISÃO PRIORITÁRIA ═══ */}
      {data.proximaRevisao && (
        <Card className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800">Próxima Revisão Prioritária</h3>
              </div>
              <p className="hanzi text-2xl font-medium text-slate-800">{data.proximaRevisao.hanzi}</p>
              <p className="text-sm text-slate-500">{data.proximaRevisao.pinyin} — {data.proximaRevisao.traducao}</p>
            </div>
            <Button size="sm" icon={<Play size={13} />} onClick={() => navigate('/revisoes')}>
              Revisar
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-3">
      <div className="flex flex-col items-center text-center gap-1">
        {icon}
        <span className="text-lg font-bold text-slate-800">{value}</span>
        <span className="text-[10px] text-slate-500 leading-tight">{label}</span>
      </div>
    </Card>
  )
}
