// ─── Usuário ──────────────────────────────────────────────────────────────────
// NOTA: A API Spring Boot usa UUID como identificador — id é string, não number
export interface Usuario {
  id: string
  nome: string
  email: string
  idiomaNativo: string
  nivelHskAtual: number
  ativo: boolean
  dataCadastro?: string
}

export interface UsuarioForm {
  nome: string
  email: string
  idiomaNativo: string
  nivelHskAtual: number
  ativo: boolean
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────
export type TipoConteudo = 'PALAVRA' | 'FRASE' | 'DIALOGO'
export type OrigemConteudo = 'MANUAL' | 'IA' | 'IMPORTADO'

export interface Conteudo {
  id: string
  tipo: TipoConteudo
  hanzi: string
  pinyin: string
  traducao: string
  explicacao?: string
  nivelHsk: number
  dificuldade: number
  origem?: OrigemConteudo
  dataCadastro?: string
}

export interface ConteudoForm {
  tipo: TipoConteudo
  hanzi: string
  pinyin: string
  traducao: string
  explicacao?: string
  nivelHsk: number
  dificuldade: number
  origem: OrigemConteudo
}

// ─── Tema ─────────────────────────────────────────────────────────────────────
export interface Tema {
  id: string
  nome: string
  descricao?: string
}

export interface TemaForm {
  nome: string
  descricao?: string
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string
  nome: string
}

export interface TagForm {
  nome: string
}

// ─── Exercício ────────────────────────────────────────────────────────────────
export type TipoExercicio =
  | 'MULTIPLA_ESCOLHA'
  | 'TRADUCAO_PT_MANDARIM'
  | 'TRADUCAO_MANDARIM_PT'
  | 'PINYIN'
  | 'ESCRITA_LIVRE'

export interface Alternativa {
  texto: string
  correta: boolean
}

export interface Exercicio {
  id: string
  conteudoId: string
  conteudo?: Conteudo
  tipo: TipoExercicio
  enunciado: string
  respostaEsperada: string
  dificuldade: number
  alternativas?: Alternativa[]
}

export interface ExercicioForm {
  conteudoId: string
  tipo: TipoExercicio
  enunciado: string
  respostaEsperada: string
  dificuldade: number
  alternativas?: Alternativa[]
}

// ─── Resposta ─────────────────────────────────────────────────────────────────
export interface Resposta {
  id: string
  usuarioId: string
  exercicioId: string
  exercicio?: Exercicio
  respostaUsuario: string
  tempoRespostaSegundos: number
  correta: boolean
  nota?: number
  feedback?: string
  dataResposta?: string
}

export interface RespostaForm {
  usuarioId: string
  exercicioId: string
  respostaUsuario: string
  tempoRespostaSegundos: number
  correta: boolean
  nota?: number
  feedback?: string
}

export interface Desempenho {
  totalRespostas: number
  totalCorretas: number
  totalErradas: number
  taxaAcerto: number
  tempoMedioSegundos: number
}

// ─── Revisão ──────────────────────────────────────────────────────────────────
export interface Revisao {
  id: string
  usuarioId: string
  conteudoId: string
  conteudo?: Conteudo
  proximaRevisao: string
  facilidade: number
  repeticoes: number
  lapsos: number
  intervalo: number
}

export interface RevisaoUpdate {
  facilidade?: number
  repeticoes?: number
  lapsos?: number
  intervalo?: number
  proximaRevisao?: string
}

// ─── Recomendação ─────────────────────────────────────────────────────────────
export interface Recomendacao {
  id: string
  usuarioId: string
  conteudoId: string
  conteudo?: Conteudo
  motivo: string
  scorePrioridade: number
  origem: string
  visualizada: boolean
  dataCriacao?: string
}

export interface RecomendacaoForm {
  usuarioId: string
  conteudoId?: string
}

// ─── Estatísticas ─────────────────────────────────────────────────────────────
export interface EstatisticaDia {
  data: string
  totalRespostas: number
  totalCorretas: number
  totalErradas: number
  taxaAcerto: number
  tempoEstudoSegundos: number
}

export interface EstatisticaGeral {
  totalRespostas: number
  totalCorretas: number
  totalErradas: number
  taxaAcerto: number
  tempoTotalSegundos: number
  diasAtivos: number
}

export interface EstatisticaPeriodo {
  geral: EstatisticaGeral
  porDia: EstatisticaDia[]
}

// ─── IA ───────────────────────────────────────────────────────────────────────
export type TipoConteudoIA = 'PALAVRA' | 'FRASE' | 'DIALOGO'
export type ObjetivoIA = 'VOCABULARIO' | 'CONVERSACAO' | 'GRAMATICA'

// Formulário estruturado enviado à API — a API monta o prompt para o LLM
export interface GerarConteudoIARequest {
  tipo: TipoConteudoIA
  tema?: string
  nivelHsk: number
  quantidade: number
  objetivo: ObjetivoIA
  idiomaTraduzao: string
  usuarioId?: string
}

// Item gerado pelo LLM e retornado pela API
export interface ConteudoGeradoIA {
  hanzi: string
  pinyin: string
  traducao: string
  explicacao: string
  exemploHanzi?: string
  exemploPinyin?: string
  exemploTraduzido?: string
  dificuldade: number
  categoria?: string
  tags?: string[]
}

// Registro de uma solicitação ao LLM
export interface ConteudoIA {
  id: string
  prompt: string
  parametros?: GerarConteudoIARequest
  conteudoGerado?: ConteudoGeradoIA
  conteudosGerados?: ConteudoGeradoIA[]
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  tempoProcessamentoMs?: number
  dataCriacao?: string
}

// Request para gerar mais exemplos de um conteúdo existente
export interface GerarExemplosRequest {
  conteudoId: string
  nivelHsk: number
  quantidade: number
}

// Request para gerar plano de estudo personalizado
export interface GerarPlanoEstudoRequest {
  usuarioId: string
}

export interface PlanoEstudo {
  id: string
  usuarioId: string
  plano: string
  dataCriacao?: string
}

// Mantém compatibilidade com o form antigo
export interface ConteudoIAForm {
  prompt: string
  usuarioId?: string
}

// ─── Utilitários ─────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  status?: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ─── Revisão Inteligente (BI) ─────────────────────────────────────────────────
export interface RevisaoInteligenteResponse {
  revisaoId: number
  conteudoId: number
  hanzi: string
  pinyin: string
  traducao: string
  nivelHsk: number
  tema?: string
  ultimaRevisao?: string
  proximaRevisao?: string
  repeticoes: number
  lapsos: number
  taxaAcerto: number
  tempoMedioResposta: number
  probabilidadeEsquecimento: number
  scorePrioridade: number
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'
  motivo: string
}

export interface IndicadoresRevisaoResponse {
  revisoesPendentes: number
  conteudosCriticos: number
  taxaRetencao: number
  taxaAcertoRevisoes: number
  tempoMedioResposta: number
  conteudosDominados: number
  conteudosEmAprendizado: number
  evolucaoRetencao: EvolucaoDiaria[]
  revisoesPorPrioridade: Record<string, number>
  errosPorTema: Record<string, number>
  acertosVsErros: { acertos: number; erros: number }
}

export interface EvolucaoDiaria {
  data: string
  taxaRetencao: number
  revisoes: number
}

export interface RegistrarRespostaRevisaoRequest {
  usuarioId: string
  revisaoId: number
  respostaUsuario: string
  tempoRespostaSegundos?: number
}
