import api from '@/lib/axios'
import type { Tema, TemaForm } from '@/types'

const BASE = '/temas'

export const temaService = {
  listar: () =>
    api.get<Tema[]>(BASE).then((r) => r.data),

  criar: (data: TemaForm) =>
    api.post<Tema>(BASE, data).then((r) => r.data),

  atualizar: (id: string, data: TemaForm) =>
    api.put<Tema>(`${BASE}/${id}`, data).then((r) => r.data),

  excluir: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),
}
