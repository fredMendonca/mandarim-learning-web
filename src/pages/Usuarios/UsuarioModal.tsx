import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { usuarioService } from '@/services/usuarioService'
import type { Usuario, UsuarioForm } from '@/types'

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  idiomaNativo: z.string().min(2, 'Informe o idioma nativo'),
  nivelHskAtual: z.coerce.number().min(1).max(9),
  ativo: z.boolean(),
})

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  usuario: Usuario | null
}

const hskOptions = Array.from({ length: 9 }, (_, i) => ({
  value: String(i + 1),
  label: `HSK ${i + 1}`,
}))

export function UsuarioModal({ open, onClose, onSuccess, usuario }: Props) {
  const toast = useToastContext()
  const { run, loading, error } = useAsync()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioForm>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', email: '', idiomaNativo: 'Português', nivelHskAtual: 1, ativo: true },
  })

  useEffect(() => {
    if (open) {
      reset(
        usuario
          ? { nome: usuario.nome, email: usuario.email, idiomaNativo: usuario.idiomaNativo, nivelHskAtual: usuario.nivelHskAtual, ativo: usuario.ativo }
          : { nome: '', email: '', idiomaNativo: 'Português', nivelHskAtual: 1, ativo: true },
      )
    }
  }, [open, usuario, reset])

  async function onSubmit(data: UsuarioForm) {
    try {
      if (usuario) {
        await run(usuarioService.atualizar(usuario.id, data))
        toast.success('Usuário atualizado com sucesso.')
      } else {
        await run(usuarioService.criar(data))
        toast.success('Usuário criado com sucesso.')
      }
      onSuccess()
    } catch {
      // error shown in Alert
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={usuario ? 'Editar Usuário' : 'Novo Usuário'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <Input label="Nome" {...register('nome')} error={errors.nome?.message} />
        <Input label="E-mail" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Idioma Nativo" {...register('idiomaNativo')} error={errors.idiomaNativo?.message} />

        <Select
          label="Nível HSK Atual"
          options={hskOptions}
          {...register('nivelHskAtual')}
          error={errors.nivelHskAtual?.message}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            {...register('ativo')}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="ativo" className="text-sm text-slate-700">Usuário ativo</label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>
            {usuario ? 'Salvar Alterações' : 'Criar Usuário'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
