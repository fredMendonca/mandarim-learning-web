import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useFetch } from '@/hooks/useFetch'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { tagService } from '@/services/tagService'
import type { Tag, TagForm } from '@/types'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
})

export function TagsPage() {
  const toast = useToastContext()
  const { data: tags, loading, error, refetch } = useFetch(() => tagService.listar(), [])
  const { run, loading: saving, error: saveError } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TagForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '' },
  })

  function openCreate() { setEditing(null); reset({ nome: '' }); setModalOpen(true) }
  function openEdit(t: Tag) { setEditing(t); reset({ nome: t.nome }); setModalOpen(true) }

  async function onSubmit(data: TagForm) {
    try {
      if (editing) {
        await run(tagService.atualizar(editing.id, data))
        toast.success('Tag atualizada.')
      } else {
        await run(tagService.criar(data))
        toast.success('Tag criada.')
      }
      setModalOpen(false)
      refetch()
    } catch { /* shown in Alert */ }
  }

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(tagService.excluir(confirmId))
      toast.success('Tag excluída.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir tag.')
    } finally {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tags"
        subtitle="Etiquetas para classificar conteúdos"
        action={<Button icon={<Plus size={15} />} onClick={openCreate}>Nova Tag</Button>}
      />

      {error && <Alert type="error" message={error} className="mb-4" />}

      {loading ? <Loading /> : (
        <div className="flex flex-wrap gap-3">
          {(tags ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-8 w-full text-center">Nenhuma tag cadastrada.</p>
          ) : (
            (tags ?? []).map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm"
              >
                <span className="text-sm font-medium text-slate-700">{tag.nome}</span>
                <button
                  onClick={() => openEdit(tag)}
                  className="text-slate-400 hover:text-primary-600 transition-colors"
                  aria-label="Editar tag"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => setConfirmId(tag.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label="Excluir tag"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Tag' : 'Nova Tag'} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <Input label="Nome da Tag" {...register('nome')} error={errors.nome?.message} />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        message="Deseja excluir esta tag?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        danger
      />
    </div>
  )
}
