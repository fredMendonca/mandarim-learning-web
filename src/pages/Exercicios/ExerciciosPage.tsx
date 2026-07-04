import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { ConfirmModal } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { exercicioService } from '@/services/exercicioService'
import type { Exercicio, TipoExercicio, PageResponse } from '@/types'
import { formatTipoExercicio, dificuldadeLabel } from '@/utils/format'
import { ExercicioModal } from './ExercicioModal'

const PAGE_SIZE = 20

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'MULTIPLA_ESCOLHA', label: 'Múltipla Escolha' },
  { value: 'TRADUCAO_PT_MANDARIM', label: 'Tradução PT → Mandarim' },
  { value: 'TRADUCAO_MANDARIM_PT', label: 'Tradução Mandarim → PT' },
  { value: 'PINYIN', label: 'Pinyin' },
  { value: 'ESCRITA_LIVRE', label: 'Escrita Livre' },
]

const tipoBadgeMap: Record<TipoExercicio, 'info' | 'success' | 'purple' | 'warning' | 'default'> = {
  MULTIPLA_ESCOLHA: 'info',
  TRADUCAO_PT_MANDARIM: 'success',
  TRADUCAO_MANDARIM_PT: 'purple',
  PINYIN: 'warning',
  ESCRITA_LIVRE: 'default',
}

export function ExerciciosPage() {
  const toast = useToastContext()
  const { run, loading: deleting } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState('')

  // Pagination state
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState<PageResponse<Exercicio> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await exercicioService.listarPaginado(
        page,
        PAGE_SIZE,
        filterTipo || undefined,
      )
      setPageData(data)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar exercícios.')
    } finally {
      setLoading(false)
    }
  }, [page, filterTipo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filter changes
  useEffect(() => {
    setPage(0)
  }, [filterTipo])

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(exercicioService.excluir(confirmId))
      toast.success('Exercício excluído.')
      fetchData()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir exercício.')
    } finally {
      setConfirmId(null)
    }
  }

  const exercicios = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0

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

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Filter size={16} className="text-slate-400 mt-2.5 shrink-0" />
        <div className="w-56">
          <Select options={tipoOptions} value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} />
        </div>
        {filterTipo && (
          <Button variant="ghost" size="sm" onClick={() => setFilterTipo('')}>
            Limpar filtro
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {totalElements} resultado{totalElements !== 1 ? 's' : ''}
              {totalPages > 1 && ` — Página ${page + 1} de ${totalPages}`}
            </span>
          </div>
          <Table columns={columns} data={exercicios} keyExtractor={(e) => e.id} emptyMessage="Nenhum exercício cadastrado." />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i
                  } else if (page < 4) {
                    pageNum = i
                  } else if (page > totalPages - 5) {
                    pageNum = totalPages - 7 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                        pageNum === page
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      <ExercicioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData() }}
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
