import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { ConfirmModal, Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useFetch } from '@/hooks/useFetch'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { temaService } from '@/services/temaService'
import type { Tema, TemaForm } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  descricao: z.string().optional(),
})

export function TemasPage() {
  const toast = useToastContext()
  const { data: temas, loading, error, refetch } = useFetch(() => temaService.listar(), [])
  const { run, loading: saving, error: saveError } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tema | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TemaForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', descricao: '' },
  })

  function openCreate() {
    setEditing(null)
    reset({ nome: '', descricao: '' })
    setModalOpen(true)
  }

  function openEdit(t: Tema) {
    setEditing(t)
    reset({ nome: t.nome, descricao: t.descricao ?? '' })
    setModalOpen(true)
  }

  async function onSubmit(data: TemaForm) {
    try {
      if (editing) {
        await run(temaService.atualizar(editing.id, data))
        toast.success('Tema atualizado.')
      } else {
        await run(temaService.criar(data))
        toast.success('Tema criado.')
      }
      setModalOpen(false)
      refetch()
    } catch { /* shown in Alert */ }
  }

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(temaService.excluir(confirmId))
      toast.success('Tema excluído.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir tema.')
    } finally {
      setConfirmId(null)
    }
  }

  const columns = [
    { key: 'id', header: 'ID', className: 'w-12' },
    { key: 'nome', header: 'Nome' },
    { key: 'descricao', header: 'Descrição', render: (t: Tema) => t.descricao || '—' },
    {
      key: 'acoes', header: 'Ações', className: 'w-24',
      render: (t: Tema) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => openEdit(t)} aria-label="Editar" />
          <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => setConfirmId(t.id)} className="text-red-500 hover:bg-red-50" aria-label="Excluir" />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Temas"
        subtitle="Organize os conteúdos por tema"
        action={<Button icon={<Plus size={15} />} onClick={openCreate}>Novo Tema</Button>}
      />

      {error && <Alert type="error" message={error} className="mb-4" />}

      {loading ? <Loading /> : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <Table columns={columns} data={temas ?? []} keyExtractor={(t) => t.id} emptyMessage="Nenhum tema cadastrado." />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Tema' : 'Novo Tema'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {saveError && <Alert type="error" message={saveError} />}
          <Input label="Nome" {...register('nome')} error={errors.nome?.message} />
          <Textarea label="Descrição (opcional)" {...register('descricao')} rows={2} />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        message="Deseja excluir este tema?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        danger
      />
    </div>
  )
}
