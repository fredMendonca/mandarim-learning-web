import { useState, useEffect } from 'react'
import { BookOpen, Dumbbell, MessageSquare, TrendingUp, RefreshCcw } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { StatCard } from '@/components/ui/Card'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Select } from '@/components/ui/Select'
import { conteudoService } from '@/services/conteudoService'
import { exercicioService } from '@/services/exercicioService'
import { respostaService } from '@/services/respostaService'
import { revisaoService } from '@/services/revisaoService'
import { estatisticaService } from '@/services/estatisticaService'
import { usuarioService } from '@/services/usuarioService'
import type { Usuario, EstatisticaDia } from '@/types'
import { formatPercent, formatDate } from '@/utils/format'

export function DashboardPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  // UUID como string — nunca converter para number
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>('')

  const [totalConteudos, setTotalConteudos]   = useState<number | null>(null)
  const [totalExercicios, setTotalExercicios] = useState<number | null>(null)
  const [totalRespostas, setTotalRespostas]   = useState<number | null>(null)
  const [taxaAcerto, setTaxaAcerto]           = useState<number | null>(null)
  const [totalPendentes, setTotalPendentes]   = useState<number | null>(null)
  const [chartData, setChartData]             = useState<EstatisticaDia[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)

  // Carrega usuários + totais globais
  useEffect(() => {
    async function loadBase() {
      try {
        const [conteudos, exercicios, users] = await Promise.all([
          conteudoService.listarTodos(),
          exercicioService.listar(),
          usuarioService.listar(),
        ])
        setTotalConteudos(conteudos.length)
        setTotalExercicios(exercicios.length)
        setUsuarios(users)
        if (users.length > 0) setSelectedUsuarioId(String(users[0].id))
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar dados do dashboard.')
      } finally {
        setLoading(false)
      }
    }
    loadBase()
  }, [])

  // Carrega stats do usuário selecionado
  useEffect(() => {
    if (!selectedUsuarioId) return
    async function loadUserStats() {
      try {
        const fim    = new Date().toISOString().split('T')[0]
        const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const [desempenho, pendentes, periodo] = await Promise.all([
          respostaService.desempenhoPorUsuario(selectedUsuarioId),
          revisaoService.pendentes(selectedUsuarioId),
          estatisticaService.porPeriodo(selectedUsuarioId, inicio, fim),
        ])
        setTotalRespostas(desempenho.totalRespostas)
        setTaxaAcerto(desempenho.taxaAcerto)
        setTotalPendentes(pendentes.length)
        setChartData(periodo.porDia ?? [])
      } catch {
        // silently — mantém valores anteriores
      }
    }
    loadUserStats()
  }, [selectedUsuarioId])

  if (loading) return <Loading fullPage />
  if (error)   return <Alert type="error" message={error} className="mt-4" />

  const usuarioOptions = usuarios.map((u) => ({
    value: String(u.id),
    label: u.nome,
  }))

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão geral do sistema</p>
        </div>
        {usuarioOptions.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              options={usuarioOptions}
              value={selectedUsuarioId}
              onChange={(e) => setSelectedUsuarioId(e.target.value)}
              placeholder="Selecionar usuário"
            />
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard title="Conteúdos"   value={totalConteudos ?? '—'}  icon={<BookOpen size={20} />}     iconBg="bg-blue-50"   iconColor="text-blue-600" />
        <StatCard title="Exercícios"  value={totalExercicios ?? '—'} icon={<Dumbbell size={20} />}     iconBg="bg-purple-50" iconColor="text-purple-600" />
        <StatCard title="Respostas"   value={totalRespostas ?? '—'}  icon={<MessageSquare size={20} />} iconBg="bg-green-50"  iconColor="text-green-600" />
        <StatCard
          title="Taxa de Acerto"
          value={taxaAcerto != null ? formatPercent(taxaAcerto) : '—'}
          icon={<TrendingUp size={20} />}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard title="Revisões Pendentes" value={totalPendentes ?? '—'} icon={<RefreshCcw size={20} />} iconBg="bg-red-50" iconColor="text-red-600" />
      </div>

      {/* Gráficos */}
      {chartData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 text-sm">
          Sem dados de atividade para exibir nos últimos 30 dias.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Acertos e Erros por Dia</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v, name) => [v, name === 'totalCorretas' ? 'Acertos' : 'Erros']}
                  labelFormatter={(l) => formatDate(l)}
                />
                <Legend formatter={(v) => (v === 'totalCorretas' ? 'Acertos' : 'Erros')} />
                <Bar dataKey="totalCorretas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="totalErradas"  fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Taxa de Acerto por Dia (%)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Taxa de acerto']}
                  labelFormatter={(l) => formatDate(l)}
                />
                <Line type="monotone" dataKey="taxaAcerto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Tempo de Estudo por Dia (s)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="data" tickFormatter={(v) => formatDate(v).slice(0, 5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${v}s`, 'Tempo de estudo']}
                  labelFormatter={(l) => formatDate(l)}
                />
                <Bar dataKey="tempoEstudoSegundos" fill="#a78bfa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
