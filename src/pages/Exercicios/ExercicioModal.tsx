import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { exercicioService } from '@/services/exercicioService'
import { conteudoService } from '@/services/conteudoService'
import type { ExercicioForm, Alternativa, Conteudo } from '@/types'
import { useFetch } from '@/hooks/useFetch'
import clsx from 'clsx'

// ─── Validação do formulário ──────────────────────────────────────────────────
const schema = z.object({
  // conteudoId é UUID (string) — não converter para número
  conteudoId: z.string().min(1, 'Selecione um conteúdo'),
  tipo: z.enum(
    ['MULTIPLA_ESCOLHA', 'TRADUCAO_PT_MANDARIM', 'TRADUCAO_MANDARIM_PT', 'PINYIN', 'ESCRITA_LIVRE'],
    { errorMap: () => ({ message: 'Selecione um tipo válido' }) },
  ),
  enunciado: z.string().min(3, 'Enunciado obrigatório'),
  respostaEsperada: z.string().min(1, 'Resposta esperada obrigatória'),
  dificuldade: z.coerce.number().min(1).max(5),
})

type FormFields = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

// ─── Opções dos selects ───────────────────────────────────────────────────────
// value = valor exato enviado para a API  |  label = texto amigável
const tipoOptions = [
  { value: 'MULTIPLA_ESCOLHA',      label: 'Múltipla Escolha'       },
  { value: 'TRADUCAO_PT_MANDARIM',  label: 'Tradução PT → Mandarim' },
  { value: 'TRADUCAO_MANDARIM_PT',  label: 'Tradução Mandarim → PT' },
  { value: 'PINYIN',                label: 'Pinyin'                  },
  { value: 'ESCRITA_LIVRE',         label: 'Escrita Livre'           },
]

const difOptions = [
  { value: '1', label: '1 — Muito Fácil'   },
  { value: '2', label: '2 — Fácil'         },
  { value: '3', label: '3 — Médio'         },
  { value: '4', label: '4 — Difícil'       },
  { value: '5', label: '5 — Muito Difícil' },
]

// Alternativa em estado local (texto + flag correta)
interface AlternativaLocal {
  texto: string
  correta: boolean
}

const ALTERNATIVAS_INICIAIS: AlternativaLocal[] = [
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
  { texto: '', correta: false },
]

export function ExercicioModal({ open, onClose, onSuccess }: Props) {
  const toast = useToastContext()
  const { run, loading, error } = useAsync()
  const { data: conteudos } = useFetch(() => conteudoService.listarTodos(), [])

  const [alternativas, setAlternativas] = useState<AlternativaLocal[]>(ALTERNATIVAS_INICIAIS)
  const [altError, setAltError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      conteudoId: '',
      tipo: 'MULTIPLA_ESCOLHA',
      enunciado: '',
      respostaEsperada: '',
      dificuldade: 1,
    },
  })

  const tipoAtual = watch('tipo')
  const isMultipla = tipoAtual === 'MULTIPLA_ESCOLHA'

  // Reseta estado ao abrir
  useEffect(() => {
    if (open) {
      reset({
        conteudoId: '',
        tipo: 'MULTIPLA_ESCOLHA',
        enunciado: '',
        respostaEsperada: '',
        dificuldade: 1,
      })
      setAlternativas(ALTERNATIVAS_INICIAIS.map((a) => ({ ...a })))
      setAltError(null)
    }
  }, [open, reset])

  // ─── Helpers para alternativas ──────────────────────────────────────────────

  function updateTexto(idx: number, texto: string) {
    setAlternativas((prev) => prev.map((a, i) => (i === idx ? { ...a, texto } : a)))
  }

  // Radio: apenas uma correta por vez
  function marcarCorreta(idx: number) {
    setAlternativas((prev) =>
      prev.map((a, i) => ({ ...a, correta: i === idx })),
    )
  }

  function addAlternativa() {
    setAlternativas((prev) => [...prev, { texto: '', correta: false }])
  }

  function removeAlternativa(idx: number) {
    setAlternativas((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      // Se a removida era a correta, desmarca todas
      return next
    })
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(data: FormFields) {
    setAltError(null)

    // Validação manual das alternativas para múltipla escolha
    if (isMultipla) {
      const preenchidas = alternativas.filter((a) => a.texto.trim() !== '')
      if (preenchidas.length < 2) {
        setAltError('Informe ao menos 2 alternativas.')
        return
      }
      if (!preenchidas.some((a) => a.correta)) {
        setAltError('Marque qual alternativa é a correta.')
        return
      }
    }

    // Monta o payload com os tipos exatos esperados pela API
    const payload: ExercicioForm = {
      conteudoId:       data.conteudoId,        // UUID string — sem Number()
      tipo:             data.tipo,
      enunciado:        data.enunciado,
      respostaEsperada: data.respostaEsperada,
      dificuldade:      Number(data.dificuldade),
    }

    if (isMultipla) {
      // Alternativas no formato { texto: string, correta: boolean }
      payload.alternativas = alternativas
        .filter((a) => a.texto.trim() !== '')
        .map<Alternativa>((a) => ({ texto: a.texto.trim(), correta: a.correta }))
    }

    try {
      await run(exercicioService.criar(payload))
      toast.success('Exercício criado com sucesso.')
      onSuccess()
    } catch {
      // erro exibido pelo Alert
    }
  }

  // ─── Opções de conteúdo ─────────────────────────────────────────────────────
  const conteudoOptions = [
    { value: '', label: 'Selecione um conteúdo...' },
    ...(conteudos ?? []).map((c: Conteudo) => ({
      value: String(c.id),          // UUID string direto
      label: `${c.hanzi} — ${c.traducao}`,
    })),
  ]

  return (
    <Modal open={open} onClose={onClose} title="Novo Exercício" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <Alert type="error" message={error} />}

        {/* Conteúdo */}
        <Select
          label="Conteúdo"
          options={conteudoOptions}
          {...register('conteudoId')}
          error={errors.conteudoId?.message}
        />

        {/* Tipo + Dificuldade */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tipo"
            options={tipoOptions}
            {...register('tipo')}
            error={errors.tipo?.message}
          />
          <Select
            label="Dificuldade"
            options={difOptions}
            {...register('dificuldade')}
            error={errors.dificuldade?.message}
          />
        </div>

        {/* Enunciado */}
        <Textarea
          label="Enunciado"
          {...register('enunciado')}
          rows={2}
          error={errors.enunciado?.message}
          placeholder="Ex: O que significa o pinyin &quot;wǒ&quot;?"
        />

        {/* Resposta esperada */}
        <Input
          label="Resposta Esperada"
          {...register('respostaEsperada')}
          error={errors.respostaEsperada?.message}
          placeholder="Ex: Eu"
        />

        {/* Alternativas — apenas para MULTIPLA_ESCOLHA */}
        {isMultipla && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Alternativas</p>
              <p className="text-xs text-slate-400">Marque a alternativa correta com o radio</p>
            </div>

            {altError && <Alert type="error" message={altError} />}

            <div className="space-y-2">
              {alternativas.map((alt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Radio — marca esta como correta */}
                  <input
                    type="radio"
                    name="alternativa-correta"
                    checked={alt.correta}
                    onChange={() => marcarCorreta(idx)}
                    className="shrink-0 accent-primary-600 w-4 h-4 cursor-pointer"
                    aria-label={`Marcar alternativa ${idx + 1} como correta`}
                    title="Marcar como correta"
                  />

                  {/* Texto da alternativa */}
                  <input
                    type="text"
                    value={alt.texto}
                    onChange={(e) => updateTexto(idx, e.target.value)}
                    className={clsx(
                      'flex-1 rounded-lg border px-3 py-1.5 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      'transition-colors',
                      alt.correta
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : 'border-slate-300 bg-white text-slate-700',
                    )}
                    placeholder={`Alternativa ${idx + 1}`}
                  />

                  {/* Badge "Correta" */}
                  {alt.correta && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium shrink-0">
                      <CheckCircle2 size={13} />
                      Correta
                    </span>
                  )}

                  {/* Remover */}
                  <button
                    type="button"
                    onClick={() => removeAlternativa(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remover alternativa"
                    title="Remover"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar nova alternativa */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus size={13} />}
              onClick={addAlternativa}
            >
              Adicionar Alternativa
            </Button>

            <p className="text-xs text-slate-400">
              Clique no radio (●) à esquerda para marcar qual é a resposta correta.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Criar Exercício
          </Button>
        </div>
      </form>
    </Modal>
  )
}
