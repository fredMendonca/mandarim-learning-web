import api from '@/lib/axios'
import type { Conteudo, ConteudoForm, TipoConteudo, PageResponse } from '@/types'

const BASE = '/conteudos'

export const conteudoService = {
  listar: (page = 0, size = 30, tipo?: string, nivelHsk?: number) => {
    const params: Record<string, string | number> = { page, size }
    if (tipo) params.tipo = tipo
    if (nivelHsk) params.nivelHsk = nivelHsk
    return api.get<PageResponse<Conteudo>>(BASE, { params }).then((r) => r.data)
  },

  listarTodos: () =>
    api.get<Conteudo[]>(`${BASE}/todos`).then((r) => r.data),

  buscarPorId: (id: string) =>
    api.get<Conteudo>(`${BASE}/${id}`).then((r) => r.data),

  buscarPorTipo: (tipo: TipoConteudo) =>
    api.get<Conteudo[]>(`${BASE}/tipo/${tipo}`).then((r) => r.data),

  buscarPorHsk: (nivel: number) =>
    api.get<Conteudo[]>(`${BASE}/hsk/${nivel}`).then((r) => r.data),

  criar: (data: ConteudoForm) =>
    api.post<Conteudo>(BASE, data).then((r) => r.data),

  atualizar: (id: string, data: ConteudoForm) =>
    api.put<Conteudo>(`${BASE}/${id}`, data).then((r) => r.data),

  excluir: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),
}
