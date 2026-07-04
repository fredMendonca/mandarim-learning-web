import api from '@/lib/axios'
import type { Resposta, RespostaForm, Desempenho } from '@/types'

const BASE = '/respostas'

export const respostaService = {
  enviar: (data: RespostaForm) =>
    api.post<Resposta>(BASE, data).then((r) => r.data),

  listarPorUsuario: (usuarioId: string) =>
    api.get<Resposta[]>(`${BASE}/usuario/${usuarioId}`).then((r) => r.data),

  desempenhoPorUsuario: (usuarioId: string) =>
    api.get<Desempenho>(`${BASE}/usuario/${usuarioId}/desempenho`).then((r) => r.data),
}
