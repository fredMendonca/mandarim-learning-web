import { useState } from 'react'
import {
  Sparkles, CheckCircle2, Clock, Trash2, Eye, Pencil,
  BookOpen, Plus, BrainCircuit, X, Save,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useAsync } from '@/hooks/useAsync'
import { useToastContext } from '@/context/ToastContext'
import { iaService } from '@/services/iaService'
import { usuarioService } from '@/services/usuarioService'
import { temaService } from '@/services/temaService'
import type {
  ConteudoIA, ConteudoGeradoIA, GerarConteudoIARequest,
  GerarExemplosRequest, PlanoEstudo,
} from '@/types'
import clsx from 'clsx'

// ─── Schema de validação do formulário estruturado ───────────────────────────
const schema = z.object({
  tipo: z.enum(['PALAVRA', 'FRASE', 'DIALOGO']),
  tema: z.string().optional(),
  nivelHsk: z.coerce.number().min(1).max(6),
  quantidade: z.coerce.number().min(1).max(20),
  objetivo: z.enum(['VOCABULARIO', 'CONVERSACAO', 'GRAMATICA']),
  idiomaTraduzao: z.string().min(1),
})

type FormFields = z.infer<typeof schema>

// ─── Opções dos selects ──────────────────────────────────────────────────────
const tipoOptions = [
  { value: 'PALAVRA', label: 'Palavra' },
  { value: 'FRASE',  label: 'Frase' },
  { value: 'DIALOGO', label: 'Diálogo' },
]

const hskOptions = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `HSK ${i + 1}`,
}))

const quantidadeOptions = [1, 2, 3, 5, 10, 15, 20].map((n) => ({
  value: String(n),
  label: String(n),
}))

const objetivoOptions = [
  { value: 'VOCABULARIO',  label: 'Vocabulário' },
  { value: 'CONVERSACAO',  label: 'Conversação' },
  { value: 'GRAMATICA',    label: 'Gramática' },
]

const idiomaOptions = [
  { value: 'Português', label: 'Português' },
  { value: 'English',   label: 'English' },
  { value: 'Español',   label: 'Español' },
]

export function IAPage() {
  const toast = useToastContext()
  const { data: usuarios } = useFetch(() => usuarioService.listar(), [])
  const { data: temas } = useFetch(() => temaService.listar(), [])
  const { data: pendentes, loading: loadingPendentes, error: errorPendentes, refetch } = useFetch(
    () => iaService.pendentes(),
    [],
  )
  const { run: runGerar, loading: gerando, error: gerarError } = useAsync()
  const { run: runAprovar, loading: aprovando } = useAsync()
  const { run: runRejeitar } = useAsync()
  const { run: runExemplos, loading: gerandoExemplos } = useAsync()
  const { run: runPlano, loading: gerandoPlano } = useAsync()

  // Estados locais
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<ConteudoIA | null>(null)
  const [editItem, setEditItem] = useState<ConteudoGeradoIA | null>(null)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [planoEstudo, setPlanoEstudo] = useState<PlanoEstudo | null>(null)
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>('')

  // Form
  const { register, handleSubmit, formState: { errors } } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'PALAVRA',
      tema: '',
      nivelHsk: 1,
      quantidade: 5,
      objetivo: 'VOCABULARIO',
      idiomaTraduzao: 'Português',
    },
  })

  const temaOptions = [
    { value: '', label: 'Qualquer tema' },
    ...(temas ?? []).map((t) => ({ value: t.nome, label: t.nome })),
  ]

  const usuarioOptions = [
    { value: '', label: 'Selecione um usuário' },
    ...(usuarios ?? []).map((u) => ({ value: String(u.id), label: u.nome })),
  ]

  // ─── Gerar conteúdo estruturado ───────────────────────────────────────────

  async function onSubmit(data: FormFields) {
    const payload: GerarConteudoIARequest = {
      tipo: data.tipo,
      tema: data.tema || undefined,
      nivelHsk: Number(data.nivelHsk),
      quantidade: Number(data.quantidade),
      objetivo: data.objetivo,
      idiomaTraduzao: data.idiomaTraduzao,
      usuarioId: selectedUsuarioId || undefined,
    }

    console.log('[IA] Gerando conteúdo estruturado:', payload)

    try {
      const result = await runGerar(iaService.gerarEstruturado(payload))
      console.log('[IA] Resultado:', result)
      toast.success('Conteúdo gerado com sucesso! Revise e aprove abaixo.')
      refetch()
    } catch (e: any) {
      console.error('[IA] Erro ao gerar:', e)
    }
  }

  // ─── Aprovar conteúdo ─────────────────────────────────────────────────────

  async function handleAprovar(id: string) {
    setApprovingId(id)
    try {
      await runAprovar(iaService.aprovar(id))
      toast.success('Conteúdo aprovado, salvo e exercícios gerados automaticamente.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao aprovar conteúdo.')
    } finally {
      setApprovingId(null)
    }
  }

  // ─── Rejeitar / excluir ───────────────────────────────────────────────────

  async function handleRejeitar() {
    if (!rejectId) return
    try {
      await runRejeitar(iaService.rejeitar(rejectId))
      toast.success('Conteúdo removido.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao remover.')
    } finally {
      setRejectId(null)
    }
  }

  // ─── Gerar mais exemplos ──────────────────────────────────────────────────

  async function handleGerarExemplos(conteudoId: string, nivelHsk: number) {
    const payload: GerarExemplosRequest = { conteudoId, nivelHsk, quantidade: 3 }
    console.log('[IA] Gerando exemplos adicionais:', payload)
    try {
      await runExemplos(iaService.gerarExemplos(payload))
      toast.success('Novos exemplos gerados com sucesso.')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao gerar exemplos.')
    }
  }

  // ─── Gerar plano de estudo ────────────────────────────────────────────────

  async function handleGerarPlano() {
    if (!selectedUsuarioId) {
      toast.warning('Selecione um usuário para gerar o plano de estudo.')
      return
    }
    console.log('[IA] Gerando plano de estudo para:', selectedUsuarioId)
    try {
      const plano = await runPlano(iaService.gerarPlanoEstudo({ usuarioId: selectedUsuarioId }))
      setPlanoEstudo(plano as PlanoEstudo)
      toast.success('Plano de estudo gerado.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro ao gerar plano de estudo.')
    }
  }

  // ─── Helpers de renderização ──────────────────────────────────────────────

  function statusBadge(status: ConteudoIA['status']) {
    if (status === 'APROVADO')
      return <Badge variant="success"><CheckCircle2 size={11} className="mr-1" />Aprovado</Badge>
    if (status === 'REJEITADO')
      return <Badge variant="danger">Rejeitado</Badge>
    return <Badge variant="warning"><Clock size={11} className="mr-1" />Pendente</Badge>
  }

  function renderConteudoGerado(item: ConteudoGeradoIA) {
    return (
      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="hanzi text-xl font-medium text-slate-800">{item.hanzi}</span>
          <span className="text-sm text-slate-500">{item.pinyin}</span>
        </div>
        <p className="text-sm text-slate-700 font-medium">{item.traducao}</p>
        {item.explicacao && (
          <p className="text-xs text-slate-500">{item.explicacao}</p>
        )}
        {item.exemploHanzi && (
          <div className="border-l-2 border-primary-200 pl-3 space-y-0.5">
            <p className="hanzi text-sm text-slate-700">{item.exemploHanzi}</p>
            {item.exemploPinyin && <p className="text-xs text-slate-500">{item.exemploPinyin}</p>}
            {item.exemploTraduzido && <p className="text-xs text-slate-600">{item.exemploTraduzido}</p>}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.categoria && <Badge variant="info">{item.categoria}</Badge>}
          <Badge variant="default">Dif. {item.dificuldade}</Badge>
          {item.tags?.map((tag, i) => (
            <Badge key={i} variant="purple">{tag}</Badge>
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Assistente IA"
        subtitle="Gere conteúdos para ensino de mandarim com inteligência artificial"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Painel esquerdo: formulário + ações ── */}
        <div className="lg:col-span-1 space-y-5">
          {/* Formulário estruturado */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-primary-600" />
              <h2 className="text-sm font-semibold text-slate-700">Gerar Conteúdo</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
              {gerarError && <Alert type="error" message={gerarError} />}

              <Select
                label="Tipo de Conteúdo"
                options={tipoOptions}
                {...register('tipo')}
                error={errors.tipo?.message}
              />

              <Select
                label="Tema"
                options={temaOptions}
                {...register('tema')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Nível HSK"
                  options={hskOptions}
                  {...register('nivelHsk')}
                  error={errors.nivelHsk?.message}
                />
                <Select
                  label="Quantidade"
                  options={quantidadeOptions}
                  {...register('quantidade')}
                  error={errors.quantidade?.message}
                />
              </div>

              <Select
                label="Objetivo"
                options={objetivoOptions}
                {...register('objetivo')}
                error={errors.objetivo?.message}
              />

              <Select
                label="Idioma de Tradução"
                options={idiomaOptions}
                {...register('idiomaTraduzao')}
              />

              <Button
                type="submit"
                loading={gerando}
                className="w-full"
                icon={<Sparkles size={14} />}
              >
                Gerar Conteúdo
              </Button>
            </form>
          </Card>

          {/* Plano de estudo */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit size={16} className="text-purple-600" />
              <h2 className="text-sm font-semibold text-slate-700">Plano de Estudo</h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Gere um plano personalizado baseado no histórico do usuário (acertos, erros, revisões pendentes).
            </p>
            <Select
              label="Usuário"
              options={usuarioOptions}
              value={selectedUsuarioId}
              onChange={(e) => setSelectedUsuarioId(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              icon={<BrainCircuit size={13} />}
              onClick={handleGerarPlano}
              loading={gerandoPlano}
              disabled={!selectedUsuarioId}
            >
              Gerar Plano de Estudo
            </Button>

            {planoEstudo && (
              <div className="mt-4 bg-purple-50 rounded-lg p-3 text-sm text-purple-900 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {planoEstudo.plano}
              </div>
            )}
          </Card>
        </div>

        {/* ── Painel direito: lista de revisão ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">
              Conteúdos Gerados — Revisão
              {pendentes && pendentes.length > 0 && (
                <Badge variant="warning" className="ml-2">{pendentes.length}</Badge>
              )}
            </h2>
            <Button variant="ghost" size="sm" onClick={refetch}>Atualizar</Button>
          </div>

          {errorPendentes && <Alert type="error" message={errorPendentes} className="mb-4" />}

          {loadingPendentes ? (
            <Loading message="Carregando conteúdos..." />
          ) : (pendentes ?? []).length === 0 ? (
            <EmptyState
              title="Nenhum conteúdo pendente"
              description="Use o formulário para gerar novos conteúdos com IA."
              icon={<Sparkles size={40} />}
            />
          ) : (
            <div className="space-y-4">
              {(pendentes ?? []).map((item) => {
                // Suporta conteúdo único ou múltiplos
                const conteudos = item.conteudosGerados ?? (item.conteudoGerado ? [item.conteudoGerado as unknown as ConteudoGeradoIA] : [])

                return (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {statusBadge(item.status)}
                          <span className="text-xs text-slate-400 font-mono">
                            {String(item.id).slice(0, 8)}…
                          </span>
                          {item.tempoProcessamentoMs && (
                            <span className="text-xs text-slate-400">
                              {item.tempoProcessamentoMs}ms
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={13} />}
                            onClick={() => setDetailItem(item)}
                            aria-label="Ver detalhes"
                          />
                          {item.status === 'PENDENTE' && (
                            <>
                              <Button
                                size="sm"
                                icon={<CheckCircle2 size={13} />}
                                onClick={() => handleAprovar(item.id)}
                                loading={aprovando && approvingId === item.id}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={13} />}
                                onClick={() => setRejectId(item.id)}
                                className="text-red-500 hover:bg-red-50"
                                aria-label="Excluir"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Parâmetros */}
                      {item.parametros && (
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          <Badge variant="info">{item.parametros.tipo}</Badge>
                          <Badge variant="default">HSK {item.parametros.nivelHsk}</Badge>
                          <Badge variant="default">{item.parametros.objetivo}</Badge>
                          {item.parametros.tema && <Badge variant="purple">{item.parametros.tema}</Badge>}
                          <Badge variant="default">{item.parametros.quantidade} itens</Badge>
                        </div>
                      )}

                      {/* Prompt (colapsável) */}
                      {item.prompt && !item.parametros && (
                        <p className="text-xs text-slate-500 italic line-clamp-2">
                          Prompt: "{item.prompt}"
                        </p>
                      )}

                      {/* Conteúdos gerados (preview dos 2 primeiros) */}
                      {conteudos.length > 0 && (
                        <div className="space-y-2">
                          {conteudos.slice(0, 2).map((c, idx) => (
                            <div key={idx} className="relative">
                              {renderConteudoGerado(c)}
                              {item.status === 'PENDENTE' && (
                                <div className="absolute top-2 right-2 flex gap-1">
                                  <button
                                    onClick={() => { setEditItem(c); setEditItemId(item.id) }}
                                    className="p-1 rounded bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-primary-600 transition-colors"
                                    title="Editar antes de aprovar"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleGerarExemplos(item.id, item.parametros?.nivelHsk ?? 1)}
                                    className="p-1 rounded bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-green-600 transition-colors"
                                    title="Gerar mais exemplos"
                                    disabled={gerandoExemplos}
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {conteudos.length > 2 && (
                            <p className="text-xs text-slate-400 text-center">
                              +{conteudos.length - 2} mais — clique em Ver Detalhes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de detalhes ── */}
      <Modal
        open={detailItem !== null}
        onClose={() => setDetailItem(null)}
        title="Detalhes do Conteúdo Gerado"
        size="xl"
      >
        {detailItem && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Info geral */}
            <div className="flex flex-wrap gap-2">
              {statusBadge(detailItem.status)}
              {detailItem.tempoProcessamentoMs && (
                <Badge variant="default">
                  <Clock size={11} className="mr-1" />{detailItem.tempoProcessamentoMs}ms
                </Badge>
              )}
            </div>

            {/* Prompt */}
            {detailItem.prompt && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-600 mb-1">Prompt enviado ao LLM:</p>
                <p className="text-xs text-slate-500 whitespace-pre-wrap">{detailItem.prompt}</p>
              </div>
            )}

            {/* Conteúdos */}
            {(() => {
              const conteudos = detailItem.conteudosGerados ??
                (detailItem.conteudoGerado ? [detailItem.conteudoGerado as unknown as ConteudoGeradoIA] : [])
              return conteudos.map((c, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-slate-600 mb-1">Item {i + 1}:</p>
                  {renderConteudoGerado(c)}
                </div>
              ))
            })()}
          </div>
        )}
      </Modal>

      {/* ── Modal de edição ── */}
      <Modal
        open={editItem !== null}
        onClose={() => { setEditItem(null); setEditItemId(null) }}
        title="Editar Conteúdo Antes de Aprovar"
        size="lg"
      >
        {editItem && (
          <EditConteudoForm
            item={editItem}
            onSave={(updated) => {
              // Aqui seria uma chamada PUT para atualizar o item no backend
              // Por ora: toast + fechar
              toast.info('Edição local aplicada. Aprove para salvar no sistema.')
              setEditItem(null)
              setEditItemId(null)
            }}
            onCancel={() => { setEditItem(null); setEditItemId(null) }}
          />
        )}
      </Modal>

      {/* ── Confirm de rejeição ── */}
      <ConfirmModal
        open={rejectId !== null}
        message="Deseja excluir este conteúdo gerado? Esta ação não pode ser desfeita."
        onConfirm={handleRejeitar}
        onCancel={() => setRejectId(null)}
        confirmLabel="Excluir"
        danger
      />
    </div>
  )
}

// ─── Subcomponente: formulário de edição ─────────────────────────────────────
function EditConteudoForm({
  item,
  onSave,
  onCancel,
}: {
  item: ConteudoGeradoIA
  onSave: (updated: ConteudoGeradoIA) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<ConteudoGeradoIA>({ ...item })

  function handleChange(field: keyof ConteudoGeradoIA, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Hanzi"
          value={form.hanzi}
          onChange={(e) => handleChange('hanzi', e.target.value)}
          className="hanzi text-lg"
        />
        <Input
          label="Pinyin"
          value={form.pinyin}
          onChange={(e) => handleChange('pinyin', e.target.value)}
        />
      </div>
      <Input
        label="Tradução"
        value={form.traducao}
        onChange={(e) => handleChange('traducao', e.target.value)}
      />
      <Textarea
        label="Explicação"
        value={form.explicacao}
        onChange={(e) => handleChange('explicacao', e.target.value)}
        rows={2}
      />
      <Input
        label="Exemplo (Hanzi)"
        value={form.exemploHanzi ?? ''}
        onChange={(e) => handleChange('exemploHanzi', e.target.value)}
      />
      <Input
        label="Exemplo (Pinyin)"
        value={form.exemploPinyin ?? ''}
        onChange={(e) => handleChange('exemploPinyin', e.target.value)}
      />
      <Input
        label="Exemplo (Tradução)"
        value={form.exemploTraduzido ?? ''}
        onChange={(e) => handleChange('exemploTraduzido', e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Dificuldade (1-5)"
          type="number"
          min={1}
          max={5}
          value={form.dificuldade}
          onChange={(e) => handleChange('dificuldade', Number(e.target.value))}
        />
        <Input
          label="Categoria"
          value={form.categoria ?? ''}
          onChange={(e) => handleChange('categoria', e.target.value)}
        />
      </div>
      <Input
        label="Tags (separadas por vírgula)"
        value={(form.tags ?? []).join(', ')}
        onChange={(e) => setForm((prev) => ({
          ...prev,
          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
        }))}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} icon={<X size={13} />}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(form)} icon={<Save size={13} />}>
          Salvar Edição
        </Button>
      </div>
    </div>
  )
}
