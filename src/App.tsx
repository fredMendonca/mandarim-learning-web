import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
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

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/conteudos" element={<ConteudosPage />} />
        <Route path="/exercicios" element={<ExerciciosPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/revisoes" element={<RevisoesPage />} />
        <Route path="/recomendacoes" element={<RecomendacoesPage />} />
        <Route path="/ia" element={<IAPage />} />
        <Route path="/estatisticas" element={<EstatisticasPage />} />
        <Route path="/temas" element={<TemasPage />} />
        <Route path="/tags" element={<TagsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
