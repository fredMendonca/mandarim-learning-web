import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { BookOpen } from 'lucide-react'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : '/')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, senha)
      navigate('/')
    } catch (err: any) {
      setError(err?.message ?? 'Email ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mandarim Learning</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Aprendizado de Mandarim</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-700">Entrar</h2>
            <p className="text-xs text-slate-400 mt-1">Use suas credenciais para acessar o sistema</p>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Entrar
            </Button>
          </form>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
            <p>Admin: admin@mandarim.com / Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
