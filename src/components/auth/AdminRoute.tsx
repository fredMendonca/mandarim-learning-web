import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loading } from '@/components/ui/Loading'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) return <Loading message="Verificando autenticação..." />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
