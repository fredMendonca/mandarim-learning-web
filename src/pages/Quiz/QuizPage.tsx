import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Brain, Users, Shuffle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Loading } from '@/components/ui/Loading'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { usuarioService } from '@/services/usuarioService'
import { exercicioService } from '@/services/exercicioService'
import { respostaService } from '@/services/respostaService'
import type { Usuario, Exercicio, Alternativa } from '@/types'
import { formatTipoExercicio, dificuldadeLabel } from '@/utils/format'
import clsx from 'clsx'

type QuizState = 'setup' | 'answering' | 'result' | 'finished'

interface QuizResult {
  exercicio: Exercicio
  respostaUsuario: string
  correta: boolean
  tempoSegundos: number
  feedback?: string
}

const QUANTIDADE_OPTIONS = [
  { value: '5', label: '5 questões' },
  { value: '10', label: '10 questões' },
  { value: '15', label: '15 questões' },
  { value: '20', label: '20 questões' },
  { value: 'todas', label: 'Todas' },
]

// Extrai o texto de uma alternativa independente do formato que a API retornar
function textoAlternativa(alt: Alternativa | string): string {
  if (typeof alt === 'string') return alt
  return alt?.texto ?? ''
}

// Extrai todas as alternativas como lista de strings para exibição
function textosDasAlternativas(alternativas: (Alternativa | string)[] | undefined): string[] {
  if (!alternativas || alternativas.length === 0) return []
  return alternativas.map(textoAlternativa).filter(Boolean)
}

// Embaralha array (Fisher-Yates)
function embaralhar<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function QuizPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [todosExercicios, setTodosExercicios] = useState<Exercicio[]>([])
  const [exerciciosQuiz, setExerciciosQuiz] = useState<Exercicio[]>([])
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<string>('')
  const [quantidade, setQuantidade] = useState<string>('10')
  const [loadingInit, setLoadingInit] = useState(true)
  const [usuariosError, setUsuariosError] = useState<string | null>(null)
  const [exerciciosError, setExerciciosError] = useState<string | null>(null)

  const [state, setState] = useState<QuizState>('setup')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [resposta, setResposta] = useState('')
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [lastResult, setLastResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const startTimeRef = useRef<number>(Date.now())

  // Carrega usuários e exercícios
  useEffect(() => {
    let mounted = true

    async function loadUsuarios() {
      try {
        const users = await usuarioService.listar()
        if (!mounted) return
        setUsuarios(users ?? [])
        if (users && users.length > 0) setSelectedUsuarioId(String(users[0].id))
      } catch (e: any) {
        console.error('[Quiz] Erro ao carregar usuários:', e)
        if (!mounted) return
        setUsuariosError(e?.message ?? 'Erro ao carregar usuários.')
      }
    }

    async function loadExercicios() {
      try {
        const exs = await exercicioService.listar()
        if (!mounted) return
        setTodosExercicios(exs ?? [])
      } catch (e: any) {
        console.error('[Quiz] Erro ao carregar exercícios:', e)
        if (!mounted) return
        setExerciciosError(e?.message ?? 'Erro ao carregar exercícios.')
      }
    }

    Promise.all([loadUsuarios(), loadExercicios()]).finally(() => {
      if (mounted) setLoadingInit(false)
    })

    return () => { mounted = false }
  }, [])

  // Calcula quantidade efetiva
  const quantidadeEfetiva = quantidade === 'todas'
    ? todosExercicios.length
    : Math.min(Number(quantidade) || 10, todosExercicios.length)

  // Exercício atual do quiz
  const exercicioAtual: Exercicio | undefined = exerciciosQuiz[currentIndex]
  const isMultiplaEscolha = exercicioAtual?.tipo === 'MULTIPLA_ESCOLHA'

  const textoAlts: string[] = isMultiplaEscolha
    ? textosDasAlternativas(exercicioAtual?.alternativas as (Alternativa | string)[] | undefined)
    : []

  const usuarioOptions = usuarios.map((u) => ({ value: String(u.id), label: u.nome }))

  // ─── Iniciar quiz ─────────────────────────────────────────────────────────

  function startQuiz() {
    if (!selectedUsuarioId) return
    if (todosExercicios.length === 0) return

    // Embaralha e limita a quantidade selecionada
    const embaralhados = embaralhar(todosExercicios)
    const selecionados = embaralhados.slice(0, quantidadeEfetiva)

    setExerciciosQuiz(selecionados)
    setCurrentIndex(0)
    setResults([])
    setLastResult(null)
    setResposta('')
    setAlternativaSelecionada(null)
    setSubmitError(null)
    setState('answering')
    startTimeRef.current = Date.now()
  }

  // ─── Enviar resposta ──────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedUsuarioId || !exercicioAtual) return

    const respostaFinal = isMultiplaEscolha
      ? (alternativaSelecionada ?? '')
      : resposta.trim()

    if (!respostaFinal) return

    const tempoSegundos = Math.round((Date.now() - startTimeRef.current) / 1000)
    setSubmitting(true)
    setSubmitError(null)

    const corretaLocal =
      respostaFinal.toLowerCase().trim() ===
      (exercicioAtual.respostaEsperada ?? '').toLowerCase().trim()

    try {
      const result = await respostaService.enviar({
        usuarioId: selectedUsuarioId,
        exercicioId: exercicioAtual.id,
        respostaUsuario: respostaFinal,
        tempoRespostaSegundos: tempoSegundos,
        correta: corretaLocal,
      })

      const quizResult: QuizResult = {
        exercicio: exercicioAtual,
        respostaUsuario: respostaFinal,
        correta: result?.correta ?? corretaLocal,
        tempoSegundos,
        feedback: result?.feedback,
      }

      setLastResult(quizResult)
      setResults((prev) => [...prev, quizResult])
      setState('result')
    } catch (e: any) {
      console.error('[Quiz] Erro ao enviar resposta:', e)
      setSubmitError(e?.message ?? 'Erro ao enviar resposta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Próxima pergunta ─────────────────────────────────────────────────────

  function nextQuestion() {
    if (currentIndex + 1 >= exerciciosQuiz.length) {
      setState('finished')
      return
    }
    setCurrentIndex((i) => i + 1)
    setResposta('')
    setAlternativaSelecionada(null)
    setLastResult(null)
    setSubmitError(null)
    setState('answering')
    startTimeRef.current = Date.now()
  }

  // ─── Reiniciar ────────────────────────────────────────────────────────────

  function resetQuiz() {
    setState('setup')
    setCurrentIndex(0)
    setResults([])
    setLastResult(null)
    setResposta('')
    setAlternativaSelecionada(null)
    setSubmitError(null)
    setExerciciosQuiz([])
  }

  // ─── Loading inicial ──────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <div>
        <PageHeader title="Quiz" subtitle="Pratique seu mandarim com exercícios diários" />
        <Loading message="Carregando quiz..." />
      </div>
    )
  }

  // ─── Tela de configuração (setup) ─────────────────────────────────────────

  if (state === 'setup') {
    return (
      <div>
        <PageHeader title="Quiz" subtitle="Pratique seu mandarim com exercícios diários" />

        <div className="max-w-md space-y-4">
          {usuariosError && (
            <Alert type="error" title="Erro ao carregar usuários" message={usuariosError} />
          )}
          {exerciciosError && (
            <Alert type="error" title="Erro ao carregar exercícios" message={exerciciosError} />
          )}

          {!usuariosError && usuarios.length === 0 && (
            <EmptyState
              icon={<Users size={40} />}
              title="Nenhum usuário cadastrado"
              description="Cadastre ou selecione um usuário para iniciar o quiz."
              action={{ label: 'Ir para Usuários', onClick: () => window.location.assign('/usuarios') }}
            />
          )}

          {!exerciciosError && todosExercicios.length === 0 && usuarios.length > 0 && (
            <Alert
              type="warning"
              message="Nenhum exercício cadastrado. Crie exercícios antes de iniciar o quiz."
            />
          )}

          {usuarios.length > 0 && (
            <Card className="p-6 space-y-5">
              {/* Seleção de usuário */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Selecionar usuário</p>
                <Select
                  options={usuarioOptions}
                  value={selectedUsuarioId ?? ''}
                  onChange={(e) => setSelectedUsuarioId(e.target.value)}
                  placeholder="Escolha um usuário"
                />
              </div>

              {/* Quantidade de questões */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Quantidade de questões</p>
                <Select
                  options={QUANTIDADE_OPTIONS}
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </div>

              {/* Info de exercícios */}
              <div className="bg-slate-50 rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Exercícios disponíveis</span>
                  <Badge variant={todosExercicios.length > 0 ? 'info' : 'warning'}>
                    {todosExercicios.length}
                  </Badge>
                </div>
                {todosExercicios.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Shuffle size={12} className="text-slate-400" />
                    <span>
                      Você responderá <strong>{quantidadeEfetiva}</strong> de{' '}
                      <strong>{todosExercicios.length}</strong> exercícios disponíveis.
                    </span>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={startQuiz}
                disabled={!selectedUsuarioId || todosExercicios.length === 0}
                icon={<Brain size={15} />}
              >
                Iniciar Quiz
              </Button>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // ─── Tela de resultados finais ────────────────────────────────────────────

  if (state === 'finished') {
    const acertos = results.filter((r) => r.correta).length
    const total = results.length
    const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0

    return (
      <div>
        <PageHeader title="Quiz Concluído!" subtitle="Veja seu desempenho nesta sessão" />
        <Card className="max-w-md p-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-4xl font-bold text-primary-600">{taxa}%</p>
            <p className="text-sm text-slate-500">de acerto</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{total}</p>
              <p className="text-xs text-blue-700">Total</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-600">{acertos}</p>
              <p className="text-xs text-green-700">Acertos</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-red-500">{total - acertos}</p>
              <p className="text-xs text-red-600">Erros</p>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-start gap-2 text-xs rounded-lg p-2',
                  r.correta ? 'bg-green-50' : 'bg-red-50',
                )}
              >
                {r.correta
                  ? <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                  : <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium text-slate-700 mb-0.5">{r.exercicio.enunciado}</p>
                  <p className="text-slate-500">
                    Sua resposta: <strong>{r.respostaUsuario}</strong>
                  </p>
                  {!r.correta && (
                    <p className="text-slate-500">
                      Esperada: <strong className="hanzi">{r.exercicio.respostaEsperada}</strong>
                    </p>
                  )}
                  {r.feedback && (
                    <p className="text-slate-400 italic mt-0.5">{r.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            icon={<RotateCcw size={14} />}
            className="w-full"
            onClick={resetQuiz}
          >
            Jogar Novamente
          </Button>
        </Card>
      </div>
    )
  }

  // ─── Guard: exercício atual pode ser undefined ────────────────────────────
  if (!exercicioAtual) {
    return (
      <div>
        <PageHeader title="Quiz" />
        <EmptyState
          title="Nenhum exercício disponível"
          description="Não foi possível carregar o exercício. Tente reiniciar o quiz."
          action={{ label: 'Reiniciar', onClick: resetQuiz }}
        />
      </div>
    )
  }

  // ─── Tela de resposta / resultado ─────────────────────────────────────────

  const conteudoInfo = exercicioAtual.conteudo
    ? `${exercicioAtual.conteudo.hanzi ?? ''} ${exercicioAtual.conteudo.pinyin ? `(${exercicioAtual.conteudo.pinyin})` : ''}`.trim()
    : null

  return (
    <div>
      <PageHeader
        title="Quiz"
        subtitle={`Questão ${currentIndex + 1} de ${exerciciosQuiz.length}`}
      />

      {/* Barra de progresso */}
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-6 max-w-2xl">
        <div
          className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / exerciciosQuiz.length) * 100}%` }}
        />
      </div>

      <Card className="max-w-2xl p-6 space-y-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="info">{formatTipoExercicio(exercicioAtual.tipo)}</Badge>
          <Badge variant="default">{dificuldadeLabel(exercicioAtual.dificuldade)}</Badge>
          {conteudoInfo && (
            <span className="text-xs text-slate-400 hanzi ml-1">{conteudoInfo}</span>
          )}
        </div>

        {/* Enunciado */}
        <p className="text-base font-medium text-slate-800">{exercicioAtual.enunciado}</p>

        {/* ── Estado: respondendo ── */}
        {state === 'answering' && (
          <>
            {submitError && (
              <Alert type="error" message={submitError} onClose={() => setSubmitError(null)} />
            )}

            {isMultiplaEscolha && textoAlts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {textoAlts.map((texto, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAlternativaSelecionada(texto)}
                    className={clsx(
                      'text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                      alternativaSelecionada === texto
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700',
                    )}
                  >
                    <span className="text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {texto}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={3}
                placeholder="Digite sua resposta aqui..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
                }}
              />
            )}

            {!isMultiplaEscolha && (
              <p className="text-xs text-slate-400 text-right">
                Pressione Ctrl+Enter para confirmar
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={submitting}
              disabled={isMultiplaEscolha ? !alternativaSelecionada : !resposta.trim()}
            >
              Confirmar Resposta
            </Button>
          </>
        )}

        {/* ── Estado: resultado da pergunta ── */}
        {state === 'result' && lastResult && (
          <div className="space-y-4">
            <div
              className={clsx(
                'flex items-start gap-3 rounded-xl p-4',
                lastResult.correta
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200',
              )}
            >
              {lastResult.correta
                ? <CheckCircle2 size={22} className="text-green-500 shrink-0 mt-0.5" />
                : <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />}
              <div>
                <p className={clsx('font-semibold', lastResult.correta ? 'text-green-700' : 'text-red-700')}>
                  {lastResult.correta ? 'Correto!' : 'Incorreto!'}
                </p>
                {!lastResult.correta && (
                  <p className="text-sm text-slate-600 mt-1">
                    Resposta esperada: <span className="hanzi font-medium">{exercicioAtual.respostaEsperada}</span>
                  </p>
                )}
                {lastResult.feedback && (
                  <p className="text-sm text-slate-500 mt-1 italic">{lastResult.feedback}</p>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-400 text-right">
              Tempo: {lastResult.tempoSegundos}s
            </div>

            <Button
              className="w-full"
              icon={<ChevronRight size={15} />}
              onClick={nextQuestion}
            >
              {currentIndex + 1 >= exerciciosQuiz.length ? 'Ver Resultado Final' : 'Próxima Pergunta'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
