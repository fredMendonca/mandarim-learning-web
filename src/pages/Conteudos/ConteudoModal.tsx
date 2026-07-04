import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { conteudoService } from '@/services/conteudoService'
import type { Conteudo, ConteudoForm } from '@/types'

// ─── Schema de validação ──────────────────────────────────────────────────────
// Os values dos selects são sempre strings no HTML nativo.
// z.coerce.number() converte a string "1" → 1 antes de validar.
const schema = z.object({
  tipo: z.enum(['PALAVRA', 'FRASE', 'DIALOGO'], {
    errorMap: () => ({ message: 'Selecione um tipo válido' }),
  }),
  hanzi: z.string().min(1, 'Hanzi obrigatório'),
  pinyin: z.string().min(1, 'Pinyin obrigatório'),
  traducao: z.string().min(1, 'Tradução obrigatória'),
  explicacao: z.string().optional(),
  // A API aceita 1–6; coerce garante que a string do select vira número
  nivelHsk: z.coerce
    .number({ invalid_type_error: 'Informe o nível HSK' })
    .min(1, 'Mínimo HSK 1')
    .max(6, 'Máximo HSK 6'),
  dificuldade: z.coerce
    .number({ invalid_type_error: 'Informe a dificuldade' })
    .min(1, 'Mínimo 1')
    .max(5, 'Máximo 5'),
  // origem é enum — valores exatos que a API espera
  origem: z.enum(['MANUAL', 'IA', 'IMPORTADO'], {
    errorMap: () => ({ message: 'Selecione a origem' }),
  }),
})

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  conteudo: Conteudo | null
}

// ─── Opções dos selects ───────────────────────────────────────────────────────
// value = valor exato enviado para a API
// label = texto amigável exibido ao usuário

const tipoOptions = [
  { value: 'PALAVRA',  label: 'Palavra'  },
  { value: 'FRASE',   label: 'Frase'    },
  { value: 'DIALOGO', label: 'Diálogo'  },
]

// nivelHsk: 1–6 conforme a API
const hskOptions = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),   // string para compatibilidade com <select>
  label: `HSK ${i + 1}`,
}))

// dificuldade: 1–5
const difOptions = [
  { value: '1', label: '1 — Muito Fácil' },
  { value: '2', label: '2 — Fácil'       },
  { value: '3', label: '3 — Médio'       },
  { value: '4', label: '4 — Difícil'     },
  { value: '5', label: '5 — Muito Difícil' },
]

// origem: valores exatos da API
const origemOptions = [
  { value: 'MANUAL',    label: 'Manual'    },
  { value: 'IA',        label: 'IA'        },
  { value: 'IMPORTADO', label: 'Importado' },
]

// ─── Valores padrão ───────────────────────────────────────────────────────────
const defaultValues: ConteudoForm = {
  tipo: 'PALAVRA',
  hanzi: '',
  pinyin: '',
  traducao: '',
  explicacao: '',
  nivelHsk: 1,
  dificuldade: 1,
  origem: 'MANUAL',
}

export function ConteudoModal({ open, onClose, onSuccess, conteudo }: Props) {
  const toast = useToastContext()
  const { run, loading, error } = useAsync()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConteudoForm>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Preenche o form ao abrir (criar ou editar)
  useEffect(() => {
    if (!open) return
    if (conteudo) {
      reset({
        tipo:        conteudo.tipo,
        hanzi:       conteudo.hanzi,
        pinyin:      conteudo.pinyin,
        traducao:    conteudo.traducao,
        explicacao:  conteudo.explicacao ?? '',
        nivelHsk:    conteudo.nivelHsk,
        dificuldade: conteudo.dificuldade,
        origem:      conteudo.origem ?? 'MANUAL',
      })
    } else {
      reset(defaultValues)
    }
  }, [open, conteudo, reset])

  async function onSubmit(data: ConteudoForm) {
    // Garante que nivelHsk e dificuldade chegam como número (não string)
    const payload: ConteudoForm = {
      ...data,
      nivelHsk:    Number(data.nivelHsk),
      dificuldade: Number(data.dificuldade),
    }
    try {
      if (conteudo) {
        await run(conteudoService.atualizar(conteudo.id, payload))
        toast.success('Conteúdo atualizado com sucesso.')
      } else {
        await run(conteudoService.criar(payload))
        toast.success('Conteúdo criado com sucesso.')
      }
      onSuccess()
    } catch {
      // Erro exibido pelo Alert abaixo
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={conteudo ? 'Editar Conteúdo' : 'Novo Conteúdo'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert type="error" message={error} />}

        {/* Tipo + Nível HSK */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tipo"
            options={tipoOptions}
            {...register('tipo')}
            error={errors.tipo?.message}
          />
          <Select
            label="Nível HSK"
            options={hskOptions}
            {...register('nivelHsk')}
            error={errors.nivelHsk?.message}
          />
        </div>

        {/* Hanzi + Pinyin */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Hanzi"
            {...register('hanzi')}
            error={errors.hanzi?.message}
            placeholder="例: 你好"
            className="hanzi text-lg"
          />
          <Input
            label="Pinyin"
            {...register('pinyin')}
            error={errors.pinyin?.message}
            placeholder="ex: nǐ hǎo"
          />
        </div>

        {/* Tradução */}
        <Input
          label="Tradução"
          {...register('traducao')}
          error={errors.traducao?.message}
          placeholder="ex: Olá"
        />

        {/* Explicação */}
        <Textarea
          label="Explicação (opcional)"
          {...register('explicacao')}
          rows={2}
          placeholder="Contexto de uso, notas gramaticais..."
        />

        {/* Dificuldade + Origem */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Dificuldade"
            options={difOptions}
            {...register('dificuldade')}
            error={errors.dificuldade?.message}
          />
          <Select
            label="Origem"
            options={origemOptions}
            {...register('origem')}
            error={errors.origem?.message}
          />
        </div>

        {/* Prévia do JSON que será enviado (modo debug — remova em produção) */}

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {conteudo ? 'Salvar Alterações' : 'Criar Conteúdo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
