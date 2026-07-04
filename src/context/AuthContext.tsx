import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/lib/axios'

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'ALUNO'
  nivelHskAtual: number
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isAluno: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'mandarim_token'
const USER_KEY = 'mandarim_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  // Set/remove auth header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  // Validate token on mount
  useEffect(() => {
    async function validate() {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get<AuthUser>('/auth/me')
        setUser(res.data)
        localStorage.setItem(USER_KEY, JSON.stringify(res.data))
      } catch {
        // Token inválido ou expirado
        setToken(null)
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [token])

  const login = useCallback(async (email: string, senha: string) => {
    const res = await api.post<{ token: string; id: string; nome: string; email: string; role: string; nivelHskAtual: number }>('/auth/login', { email, senha })
    const { token: newToken, ...userData } = res.data
    const authUser: AuthUser = {
      id: userData.id,
      nome: userData.nome,
      email: userData.email,
      role: userData.role as 'ADMIN' | 'ALUNO',
      nivelHskAtual: userData.nivelHskAtual,
    }
    setToken(newToken)
    setUser(authUser)
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete api.defaults.headers.common['Authorization']
  }, [])

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isAluno: user?.role === 'ALUNO',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
