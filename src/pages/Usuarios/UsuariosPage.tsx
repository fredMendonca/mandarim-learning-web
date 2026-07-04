import { useState } from 'react'
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react'
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
import { usuarioService } from '@/services/usuarioService'
import type { Usuario } from '@/types'
import { UsuarioModal } from './UsuarioModal'

export function UsuariosPage() {
  const toast = useToastContext()
  const { data: usuarios, loading, error, refetch } = useFetch(() => usuarioService.listar(), [])
  const { run, loading: saving } = useAsync()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(u: Usuario) {
    setEditing(u)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!confirmId) return
    try {
      await run(usuarioService.excluir(confirmId))
      toast.success('Usuário excluído com sucesso.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao excluir usuário.')
    } finally {
      setConfirmId(null)
    }
  }

  const columns = [
    { key: 'id', header: 'ID', className: 'w-12' },
    { key: 'nome', header: 'Nome' },
    { key: 'email', header: 'E-mail' },
    { key: 'idiomaNativo', header: 'Idioma Nativo' },
    {
      key: 'nivelHskAtual',
      header: 'HSK',
      render: (u: Usuario) => (
        <Badge variant="info">HSK {u.nivelHskAtual}</Badge>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      render: (u: Usuario) =>
        u.ativo ? (
          <Badge variant="success">
            <UserCheck size={11} className="mr-1" /> Ativo
          </Badge>
        ) : (
          <Badge variant="danger">
            <UserX size={11} className="mr-1" /> Inativo
          </Badge>
        ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'w-28',
      render: (u: Usuario) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Pencil size={13} />}
            onClick={() => openEdit(u)}
            aria-label="Editar"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={13} />}
            onClick={() => setConfirmId(u.id)}
            className="text-red-500 hover:bg-red-50"
            aria-label="Excluir"
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Gerencie os usuários do sistema"
        action={
          <Button icon={<Plus size={15} />} onClick={openCreate}>
            Novo Usuário
          </Button>
        }
      />

      {error && <Alert type="error" message={error} className="mb-4" />}

      {loading ? (
        <Loading />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <Table
            columns={columns}
            data={usuarios ?? []}
            keyExtractor={(u) => u.id}
            emptyMessage="Nenhum usuário cadastrado."
          />
        </div>
      )}

      <UsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); refetch() }}
        usuario={editing}
      />

      <ConfirmModal
        open={confirmId !== null}
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        confirmLabel={saving ? 'Excluindo...' : 'Excluir'}
        danger
      />
    </div>
  )
}
