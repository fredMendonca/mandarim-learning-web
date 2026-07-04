import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { conteudoService } from '@/services/conteudoService'
import type { Conteudo, TipoConteudo, PageResponse } from '@/types'
import { formatTipoConteudo, dificuldadeLabel } from '@/utils/format'
import { ConteudoModal } from './ConteudoModal'

const PAGE_SIZE = 30

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'PALAVRA', label: 'Palavra' },
  { value: 'FRASE', label: 'Frase' },
  { value: 'DIALOGO', label: 'Diálogo' },
]

const hskOptions = [
  { value: '', label: 'Todos os níveis' },
  ...Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: `HSK ${i + 1}` })),
]

const tipoBadge: Record<TipoConteudo, 'info' | 'success' | 'purple'> = {
  PALAVRA: 'info',
  FRASE: 'success',
  DIALOGO: 'purple',
}

export function ConteudosPage() {
  const toast = useToastContext()
  const { run, loading: saving } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Conteudo | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState('')
  const [filterHsk, setFilterHsk] = useState('')

  // Pagination state
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState<PageResponse<Conteudo> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await conteudoService.listar(
        page,
        PAGE_SIZE,
        filterTipo || undefined,
        filterHsk ? Number(filterHsk) : undefined,
      )
      setPageData(data)
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar conteúdos.')
    } finally {
      setLoading(false)
    }
  }, [page, filterTipo, filterHsk])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [filterTipo, filterHsk])

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Conteudo) { setEditing(c); setModalOpen(true) }

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(conteudoService.excluir(confirmId))
      toast.success('Conteúdo excluído.')
      fetchData()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir conteúdo.')
    } finally {
      setConfirmId(null)
    }
  }

  const conteudos = pageData?.content ?? []
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0

  const columns = [
    { key: 'id', header: 'ID', className: 'w-12' },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c: Conteudo) => (
        <Badge variant={tipoBadge[c.tipo]}>{formatTipoConteudo(c.tipo)}</Badge>
      ),
    },
    {
      key: 'hanzi',
      header: 'Hanzi',
      render: (c: Conteudo) => (
        <span className="hanzi text-lg font-medium text-slate-800">{c.hanzi}</span>
      ),
    },
    { key: 'pinyin', header: 'Pinyin' },
    { key: 'traducao', header: 'Tradução' },
    {
      key: 'nivelHsk',
      header: 'HSK',
      render: (c: Conteudo) => <Badge variant="info">HSK {c.nivelHsk}</Badge>,
    },
    {
      key: 'dificuldade',
      header: 'Dificuldade',
      render: (c: Conteudo) => (
        <span className="text-xs text-slate-500">{dificuldadeLabel(c.dificuldade)}</span>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'w-24',
      render: (c: Conteudo) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(c)} aria-label="Editar" />
          <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => setConfirmId(c.id)} className="text-red-500 hover:bg-red-50" aria-label="Excluir" />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Conteúdos"
        subtitle="Gerenciamento de palavras, frases e diálogos"
        action={<Button icon={<Plus size={15} />} onClick={openCreate}>Novo Conteúdo</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Filter size={16} className="text-slate-400 mt-2.5 shrink-0" />
        <div className="w-44">
          <Select options={tipoOptions} value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} />
        </div>
        <div className="w-44">
          <Select options={hskOptions} value={filterHsk} onChange={(e) => setFilterHsk(e.target.value)} />
        </div>
        {(filterTipo || filterHsk) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterTipo(''); setFilterHsk('') }}>
            Limpar filtros
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
          <Table columns={columns} data={conteudos} keyExtractor={(c) => c.id} emptyMessage="Nenhum conteúdo encontrado." />

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

      <ConteudoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchData() }}
        conteudo={editing}
      />

      <ConfirmModal
        open={confirmId !== null}
        message="Deseja excluir este conteúdo? Exercícios associados podem ser afetados."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        confirmLabel={saving ? 'Excluindo...' : 'Excluir'}
        danger
      />
    </div>
  )
}
