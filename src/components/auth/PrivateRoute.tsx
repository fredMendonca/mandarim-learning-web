import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loading } from '@/components/ui/Loading'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <Loading message="Verificando autenticação..." />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
