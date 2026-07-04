import { useState, useEffect } from 'react'
import { Users, BookOpen, Brain, Target, AlertTriangle, TrendingUp, Clock, Award, Sparkles, MessageSquare, CheckCircle2, UserPlus, PlusCircle, Lightbulb } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import api from '@/lib/axios'
import { useNavigate } from 'react-router-dom'

export function AdminDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await api.get('/admin/dashboard')
        setData(response.data)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Erro ao carregar dados do painel.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Loading />
  if (error) return <Alert type="error" message={error} />
  if (!data) return null

  const PRIORITY_COLORS: Record<string, string> = {
    ALTA: '#ef4444',
    MEDIA: '#f59e0b',
    BAIXA: '#22c55e',
  }

  const errosPorTemaData = data.errosPorTema
    ? Object.entries(data.errosPorTema).map(([tema, erros]) => ({ tema, erros }))
    : []

  const revisoesPorPrioridadeData = data.revisoesPorPrioridade
    ? Object.entries(data.revisoesPorPrioridade).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6 p-6">
      {/* Section 1: Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo — Analytics</h1>
          <p className="text-slate-500 mt-1">Business Intelligence aplicada ao aprendizado de mandarim</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/usuarios')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Usuário
          </Button>
          <Button onClick={() => navigate('/conteudos')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Conteúdo
          </Button>
        </div>
      </div>

      {/* Section 2: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard icon={<Users className="w-5 h-5 text-blue-500" />} value={data.totalUsuarios} label="Usuários" />
        <KpiCard icon={<Users className="w-5 h-5 text-green-500" />} value={data.usuariosAtivos} label="Ativos" />
        <KpiCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} value={data.totalConteudos} label="Conteúdos" />
        <KpiCard icon={<Brain className="w-5 h-5 text-purple-500" />} value={data.totalExercicios} label="Exercícios" />
        <KpiCard icon={<Sparkles className="w-5 h-5 text-violet-500" />} value={data.conteudosGeradosIA} label="Conteúdos IA" />
        <KpiCard icon={<MessageSquare className="w-5 h-5 text-blue-500" />} value={data.totalRespostas} label="Respostas" />
        <KpiCard icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} value={data.revisoesRealizadas} label="Revisões Realizadas" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} value={data.revisoesPendentesTotal} label="Revisões Pendentes" />
        <KpiCard icon={<Target className="w-5 h-5 text-blue-500" />} value={`${data.mediaGeralAcerto}%`} label="Taxa Acerto" />
        <KpiCard icon={<TrendingUp className="w-5 h-5 text-blue-500" />} value={`${data.mediaRetencao}%`} label="Retenção" />
        <KpiCard icon={<Clock className="w-5 h-5 text-blue-500" />} value={`${data.tempoMedioResposta}s`} label="Tempo Médio" />
        <KpiCard icon={<Award className="w-5 h-5 text-green-500" />} value={data.conteudosDominados} label="Dominados" />
        <KpiCard icon={<AlertTriangle className="w-5 h-5 text-red-500" />} value={data.conteudosCriticos} label="Críticos" />
        <KpiCard icon={<Brain className="w-5 h-5 text-purple-500" />} value={`${data.probabilidadeMediaEsquecimento}%`} label="Prob. Esquecimento" />
      </div>

      {/* Section 3: Executive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Evolução da Taxa de Acerto */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolução da Taxa de Acerto</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.evolucaoTaxaAcerto}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="taxaAcerto" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 2. Evolução da Retenção */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Evolução da Retenção</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.evolucaoRetencao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="retencao" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 3. Respostas por Dia */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Respostas por Dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.respostasPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="acertos" fill="#22c55e" />
              <Bar dataKey="erros" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 4. Conteúdos por Nível HSK */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Conteúdos por Nível HSK</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.conteudosPorHsk}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nivel" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 5. Erros por Tema */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Erros por Tema</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={errosPorTemaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tema" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="erros" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 6. Revisões por Prioridade */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Revisões por Prioridade</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={revisoesPorPrioridadeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {revisoesPorPrioridadeData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* 7. Conteúdos Mais Difíceis */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Conteúdos Mais Difíceis</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.conteudosMaisDificeis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="pinyin" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="lapsos" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 8. Top 10 Palavras Erradas */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 10 Palavras Erradas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topPalavrasErradas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pinyin" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="erros" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 9. Exercícios Respondidos por Dia */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Exercícios Respondidos por Dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.exerciciosPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 10. Conteúdos Gerados por IA */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Conteúdos Gerados por IA</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.conteudosGeradosIAPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 11. Tempo Médio de Resposta */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Tempo Médio de Resposta</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.tempoMedioPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(-5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tempoMedio" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 12. Usuários Ativos por Semana */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Usuários Ativos por Semana</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.usuariosAtivosPorSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="ativos" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Section 4: Insights da Plataforma */}
      {data.insights && data.insights.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">Insights da Plataforma</h3>
          </div>
          <div className="space-y-2">
            {data.insights.map((insight: string, index: number) => (
              <div key={index} className="flex items-start gap-3 bg-amber-50 rounded-lg px-4 py-3">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{insight}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 5: Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Alunos */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ranking de Alunos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-2">Nome</th>
                  <th className="pb-2 pr-2">Respostas</th>
                  <th className="pb-2">Taxa Acerto</th>
                </tr>
              </thead>
              <tbody>
                {data.rankingAlunos?.map((aluno: any, index: number) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 pr-2 font-medium text-slate-600">{index + 1}</td>
                    <td className="py-2 pr-2 text-slate-700">{aluno.nome}</td>
                    <td className="py-2 pr-2 text-slate-600">{aluno.totalRespostas}</td>
                    <td className="py-2">
                      <Badge variant={aluno.taxaAcerto >= 70 ? 'success' : 'warning'}>
                        {aluno.taxaAcerto}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alunos com Baixa Atividade */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Alunos com Baixa Atividade</h3>
          <div className="space-y-3">
            {data.alunosBaixaAtividade?.map((aluno: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-slate-700">{aluno.nome}</span>
                <span className="text-xs text-slate-400">{aluno.ultimoLogin}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col items-center text-center gap-2">
        {icon}
        <span className="text-xl font-bold text-slate-800">{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    </Card>
  )
}
