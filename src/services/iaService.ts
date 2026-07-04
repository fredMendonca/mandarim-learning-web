import api from '@/lib/axios'
import type {
  ConteudoIA,
  ConteudoIAForm,
  GerarConteudoIARequest,
  GerarExemplosRequest,
  GerarPlanoEstudoRequest,
  PlanoEstudo,
} from '@/types'

const BASE = '/ia/conteudos'

export const iaService = {
  // Gera conteúdos via prompt livre (legado)
  gerar: (data: ConteudoIAForm) =>
    api.post<ConteudoIA>(BASE, data).then((r) => r.data),

  // Gera conteúdos via formulário estruturado (novo)
  gerarEstruturado: (data: GerarConteudoIARequest) =>
    api.post<ConteudoIA>(BASE, data).then((r) => r.data),

  // Lista conteúdos pendentes de aprovação
  pendentes: () =>
    api.get<ConteudoIA[]>(`${BASE}/pendentes`).then((r) => r.data),

  // Aprova um conteúdo gerado (salva em conteudos + gera exercícios)
  aprovar: (id: string) =>
    api.put<ConteudoIA>(`${BASE}/${id}/aprovar`).then((r) => r.data),

  // Rejeita / exclui um conteúdo pendente
  rejeitar: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),

  // Gera mais exemplos para um conteúdo já existente
  gerarExemplos: (data: GerarExemplosRequest) =>
    api.post<ConteudoIA>(`${BASE}/exemplos`, data).then((r) => r.data),

  // Gera plano de estudo personalizado baseado no histórico do usuário
  gerarPlanoEstudo: (data: GerarPlanoEstudoRequest) =>
    api.post<PlanoEstudo>('/ia/plano-estudo', data).then((r) => r.data),
}
