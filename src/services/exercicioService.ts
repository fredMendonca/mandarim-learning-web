import api from '@/lib/axios'
import type { Exercicio, ExercicioForm, TipoExercicio } from '@/types'

const BASE = '/exercicios'

export const exercicioService = {
  listar: () =>
    api.get<Exercicio[]>(BASE).then((r) => r.data),

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
