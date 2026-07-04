import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { PrivateRoute } from '@/components/auth/PrivateRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { LoginPage } from '@/pages/Login/LoginPage'
import { AlunoDashboardPage } from '@/pages/Dashboard/AlunoDashboardPage'
import { AdminDashboardPage } from '@/pages/Dashboard/AdminDashboardPage'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { UsuariosPage } from '@/pages/Usuarios/UsuariosPage'
import { ConteudosPage } from '@/pages/Conteudos/ConteudosPage'
import { ExerciciosPage } from '@/pages/Exercicios/ExerciciosPage'
import { QuizPage } from '@/pages/Quiz/QuizPage'
import { RevisoesPage } from '@/pages/Revisoes/RevisoesPage'
import { RecomendacoesPage } from '@/pages/Recomendacoes/RecomendacoesPage'
import { IAPage } from '@/pages/IA/IAPage'
import { EstatisticasPage } from '@/pages/Estatisticas/EstatisticasPage'
import { TemasPage } from '@/pages/Temas/TemasPage'
import { TagsPage } from '@/pages/Tags/TagsPage'

function DashboardRouter() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboardPage /> : <AlunoDashboardPage />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/revisoes" element={<RevisoesPage />} />
        <Route path="/recomendacoes" element={<RecomendacoesPage />} />
        <Route path="/estatisticas" element={<EstatisticasPage />} />

        {/* Admin only */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/usuarios" element={<AdminRoute><UsuariosPage /></AdminRoute>} />
        <Route path="/conteudos" element={<AdminRoute><ConteudosPage /></AdminRoute>} />
        <Route path="/exercicios" element={<AdminRoute><ExerciciosPage /></AdminRoute>} />
        <Route path="/ia" element={<AdminRoute><IAPage /></AdminRoute>} />
        <Route path="/temas" element={<AdminRoute><TemasPage /></AdminRoute>} />
        <Route path="/tags" element={<AdminRoute><TagsPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
