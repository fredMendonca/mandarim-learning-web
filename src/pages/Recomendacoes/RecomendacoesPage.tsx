import { useState } from 'react'
import { Lightbulb, RefreshCcw, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { usuarioService } from '@/services/usuarioService'
import { recomendacaoService } from '@/services/recomendacaoService'
import type { Recomendacao } from '@/types'
import clsx from 'clsx'

export function RecomendacoesPage() {
  const toast = useToastContext()
  const { data: usuarios } = useFetch(() => usuarioService.listar(), [])
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string | null>(null)
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[] | null>(null)
  const [loadingRec, setLoadingRec] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const { run: runGerar, loading: gerando } = useAsync()

  const usuarioOptions = [
    { value: '', label: 'Selecione um usuário' },
    ...(usuarios ?? []).map((u) => ({ value: String(u.id), label: u.nome })),
  ]

  async function loadRecomendacoes(id: string) {
    setLoadingRec(true)
    setLoadError(null)
    try {
      const data = await recomendacaoService.listarPorUsuario(id)
      setRecomendacoes(data)
    } catch (e: any) {
      setLoadError(e?.message ?? 'Erro ao carregar recomendações.')
    } finally {
      setLoadingRec(false)
    }
  }

  async function handleGerar() {
    if (!selectedUsuarioId) return
    try {
      await runGerar(recomendacaoService.gerar({ usuarioId: selectedUsuarioId }))
      toast.success('Recomendações geradas com sucesso.')
      loadRecomendacoes(selectedUsuarioId)
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao gerar recomendações.')
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div>
      <PageHeader title="Recomendações" subtitle="Conteúdos recomendados para cada usuário" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-64">
          <Select
            options={usuarioOptions}
            value={selectedUsuarioId ?? ''}
            onChange={(e) => {
              const id = e.target.value
              setSelectedUsuarioId(id || null)
              if (id) loadRecomendacoes(id)
            }}
          />
        </div>
        {selectedUsuarioId && (
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCcw size={13} />}
              onClick={() => loadRecomendacoes(selectedUsuarioId)}
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              icon={<Plus size={13} />}
              onClick={handleGerar}
              loading={gerando}
            >
              Gerar Novas
            </Button>
          </>
        )}
      </div>

      {loadError && <Alert type="error" message={loadError} className="mb-4" />}

      {!selectedUsuarioId && (
        <Alert type="info" message="Selecione um usuário para ver as recomendações." />
      )}

      {loadingRec && <Loading />}

      {!loadingRec && recomendacoes !== null && (
        <>
          {recomendacoes.length === 0 ? (
            <EmptyState
              title="Nenhuma recomendação"
              description="Gere novas recomendações para este usuário."
              icon={<Lightbulb size={40} />}
              action={{ label: 'Gerar Recomendações', onClick: handleGerar }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {recomendacoes.map((rec) => (
                <Card key={rec.id} className="p-4 space-y-3">
                  {/* Conteúdo */}
                  {rec.conteudo ? (
                    <div>
                      <span className="hanzi text-2xl font-medium text-slate-800">
                        {rec.conteudo.hanzi}
                      </span>
                      <p className="text-sm text-slate-500">{rec.conteudo.pinyin}</p>
                      <p className="text-sm text-slate-700 font-medium">{rec.conteudo.traducao}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Conteúdo #{rec.conteudoId}</p>
                  )}

                  {/* Motivo */}
                  <p className="text-xs text-slate-500 italic">{rec.motivo}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{rec.origem}</Badge>
                    {rec.visualizada && <Badge variant="success">Visualizada</Badge>}
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Score de prioridade</span>
                    <span className={clsx('text-sm font-bold', scoreColor(rec.scorePrioridade))}>
                      {rec.scorePrioridade}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
