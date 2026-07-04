import api from '@/lib/axios'
import type {
  RevisaoInteligenteResponse,
  IndicadoresRevisaoResponse,
  RegistrarRespostaRevisaoRequest,
} from '@/types'

const BASE = '/revisoes'

export const revisaoService = {
  // Revisões priorizadas com BI
  inteligentes: (usuarioId: string) =>
    api.get<RevisaoInteligenteResponse[]>(`${BASE}/usuario/${usuarioId}/inteligentes`).then((r) => r.data),

  // Indicadores de desempenho
  indicadores: (usuarioId: string) =>
    api.get<IndicadoresRevisaoResponse>(`${BASE}/usuario/${usuarioId}/indicadores`).then((r) => r.data),

  // Registrar resposta de revisão prática
  responder: (data: RegistrarRespostaRevisaoRequest) =>
    api.post<RevisaoInteligenteResponse>(`${BASE}/responder`, data).then((r) => r.data),

  // Endpoints legados mantidos
  pendentes: (usuarioId: string) =>
    api.get<any[]>(`${BASE}/usuario/${usuarioId}/pendentes`).then((r) => r.data),

  atualizar: (id: string, data: any) =>
    api.put<any>(`${BASE}/${id}`, data).then((r) => r.data),
}
