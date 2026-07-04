import api from '@/lib/axios'
import type { Usuario, UsuarioForm } from '@/types'

const BASE = '/usuarios'

export const usuarioService = {
  listar: () =>
    api.get<Usuario[]>(BASE).then((r) => r.data),

  buscarPorId: (id: string) =>
    api.get<Usuario>(`${BASE}/${id}`).then((r) => r.data),

  criar: (data: UsuarioForm) =>
    api.post<Usuario>(BASE, data).then((r) => r.data),

  atualizar: (id: string, data: UsuarioForm) =>
    api.put<Usuario>(`${BASE}/${id}`, data).then((r) => r.data),

  excluir: (id: string) =>
    api.delete(`${BASE}/${id}`).then((r) => r.data),
}
