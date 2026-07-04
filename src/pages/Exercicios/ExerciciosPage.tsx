import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { ConfirmModal } from '@/components/ui/Modal'
import { useFetch } from '@/hooks/useFetch'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { exercicioService } from '@/services/exercicioService'
import type { Exercicio, TipoExercicio } from '@/types'
import { formatTipoExercicio, dificuldadeLabel } from '@/utils/format'
import { ExercicioModal } from './ExercicioModal'

const tipoBadgeMap: Record<TipoExercicio, 'info' | 'success' | 'purple' | 'warning' | 'default'> = {
  MULTIPLA_ESCOLHA: 'info',
  TRADUCAO_PT_MANDARIM: 'success',
  TRADUCAO_MANDARIM_PT: 'purple',
  PINYIN: 'warning',
  ESCRITA_LIVRE: 'default',
}

export function ExerciciosPage() {
  const toast = useToastContext()
  const { data: exercicios, loading, error, refetch } = useFetch(() => exercicioService.listar(), [])
  const { run, loading: deleting } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(exercicioService.excluir(confirmId))
      toast.success('Exercício excluído.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir exercício.')
    } finally {
      setConfirmId(null)
    }
  }

  const columns = [
    { key: 'id', header: 'ID', className: 'w-12' },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (e: Exercicio) => (
        <Badge variant={tipoBadgeMap[e.tipo]}>{formatTipoExercicio(e.tipo)}</Badge>
      ),
    },
    {
      key: 'enunciado',
      header: 'Enunciado',
      render: (e: Exercicio) => (
        <span className="line-clamp-2 text-sm">{e.enunciado}</span>
      ),
    },
    {
      key: 'respostaEsperada',
      header: 'Resposta Esperada',
      render: (e: Exercicio) => (
        <span className="hanzi text-sm text-slate-600">{e.respostaEsperada}</span>
      ),
    },
    {
      key: 'dificuldade',
      header: 'Dificuldade',
      render: (e: Exercicio) => (
        <span className="text-xs text-slate-500">{dificuldadeLabel(e.dificuldade)}</span>
      ),
    },
    {
      key: 'alternativas',
      header: 'Alternativas',
      render: (e: Exercicio) =>
        e.alternativas && e.alternativas.length > 0 ? (
          <span className="text-xs text-slate-500">{e.alternativas.length} opções</span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'w-16',
      render: (e: Exercicio) => (
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={13} />}
          onClick={() => setConfirmId(e.id)}
          className="text-red-500 hover:bg-red-50"
          aria-label="Excluir"
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Exercícios"
        subtitle="Gerencie os exercícios do sistema"
        action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Novo Exercício</Button>}
      />

      {error && <Alert type="error" message={error} className="mb-4" />}

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <Table columns={columns} data={exercicios ?? []} keyExtractor={(e) => e.id} emptyMessage="Nenhum exercício cadastrado." />
        </div>
      )}

      <ExercicioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refetch() }}
      />

      <ConfirmModal
        open={confirmId !== null}
        message="Deseja excluir este exercício? As respostas associadas serão afetadas."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        danger
      />
    </div>
  )
}
