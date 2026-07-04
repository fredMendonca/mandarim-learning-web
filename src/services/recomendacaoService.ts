import api from '@/lib/axios'
import type { Recomendacao, RecomendacaoForm } from '@/types'

const BASE = '/recomendacoes'

export const recomendacaoService = {
  gerar: (data: RecomendacaoForm) =>
    api.post<Recomendacao[]>(BASE, data).then((r) => r.data),

  listarPorUsuario: (usuarioId: string) =>
    api.get<Recomendacao[]>(`${BASE}/usuario/${usuarioId}`).then((r) => r.data),
}
