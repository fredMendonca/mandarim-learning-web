import api from '@/lib/axios'
import type { EstatisticaGeral, EstatisticaPeriodo } from '@/types'

const BASE = '/estatisticas'

export const estatisticaService = {
  porUsuario: (usuarioId: string) =>
    api.get<EstatisticaGeral>(`${BASE}/usuario/${usuarioId}`).then((r) => r.data),

  porPeriodo: (usuarioId: string, inicio: string, fim: string) =>
    api
      .get<EstatisticaPeriodo>(`${BASE}/usuario/${usuarioId}/periodo`, {
        params: { inicio, fim },
      })
      .then((r) => r.data),
}
