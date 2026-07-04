import api from '@/lib/axios'
import type { Tag, TagForm } from '@/types'

const BASE = '/tags'

export const tagService = {
  listar: () =>
    api.get<Tag[]>(BASE).then((r) => r.data),

  criar: (data: TagForm) =>
    api.post<Tag>(BASE, data).then((r) => r.data),

  atualizar: (id: string, data: TagForm) =>
    api.put<Tag>(`${BASE}/${id}`, data).then((r) => r.data),

  excluir: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),
}
