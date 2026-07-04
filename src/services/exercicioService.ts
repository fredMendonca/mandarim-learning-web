import api from '@/lib/axios'
import type { Exercicio, ExercicioForm, TipoExercicio, PageResponse } from '@/types'

const BASE = '/exercicios'

export const exercicioService = {
  listar: () =>
    api.get<Exercicio[]>(`${BASE}/todos`).then((r) => r.data),

  listarPaginado: (page = 0, size = 20, tipo?: string) => {
    const params: Record<string, string | number> = { page, size }
    if (tipo) params.tipo = tipo
    return api.get<PageResponse<Exercicio>>(BASE, { params }).then((r) => r.data)
  },

  buscarPorId: (id: string) =>
    api.get<Exercicio>(`${BASE}/${id}`).then((r) => r.data),

  buscarPorTipo: (tipo: TipoExercicio) =>
    api.get<Exercicio[]>(`${BASE}/tipo/${tipo}`).then((r) => r.data),

  buscarPorConteudo: (conteudoId: string) =>
    api.get<Exercicio[]>(`${BASE}/conteudo/${conteudoId}`).then((r) => r.data),

  criar: (data: ExercicioForm) =>
    api.post<Exercicio>(BASE, data).then((r) => r.data),

  excluir: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),
}
