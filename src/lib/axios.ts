import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — adds auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mandarim_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — normaliza erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number = error.response?.status
    const serverMessage: string =
      error.response?.data?.message ??
      error.response?.data?.erro ??
      error.response?.data?.error ??
      ''

    let message = 'Erro inesperado. Tente novamente.'

    if (!error.response) {
      message = 'Não foi possível conectar à API. Verifique se o servidor está rodando.'
    } else if (status === 401) {
      message = serverMessage || 'Sessão expirada. Faça login novamente.'
      // Remove token e redireciona para login
      localStorage.removeItem('mandarim_token')
      localStorage.removeItem('mandarim_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (status === 403) {
      message = serverMessage || 'Acesso negado. Você não tem permissão para esta ação.'
    } else if (status === 400) {
      message = serverMessage || 'Dados inválidos. Verifique os campos e tente novamente.'
    } else if (status === 404) {
      message = serverMessage || 'Registro não encontrado.'
    } else if (status === 409) {
      message = serverMessage || 'Conflito: registro já existe.'
    } else if (status === 422) {
      message = serverMessage || 'Erro de validação nos dados enviados.'
    } else if (status >= 500) {
      console.error('[API] Erro 500 — corpo da resposta:', error.response?.data)
      message = serverMessage || 'Erro interno no servidor. Tente novamente mais tarde.'
    } else if (serverMessage) {
      message = serverMessage
    }

    return Promise.reject({ message, status, original: error })
  },
)

export default api
