import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useToast } from '@/hooks/useToast'
import { ToastContext } from '@/context/ToastContext'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/usuarios': 'Usuários',
  '/conteudos': 'Conteúdos',
  '/exercicios': 'Exercícios',
  '/quiz': 'Quiz',
  '/revisoes': 'Revisões',
  '/recomendacoes': 'Recomendações',
  '/ia': 'Conteúdos IA',
  '/estatisticas': 'Estatísticas',
  '/temas': 'Temas',
  '/tags': 'Tags',
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const toast = useToast()
  const title = routeTitles[location.pathname] ?? 'Mandarim Learning'

  return (
    <ToastContext.Provider value={toast}>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Content area — offset by sidebar on desktop */}
        <div className="flex flex-col flex-1 min-w-0 lg:ml-64">
          <Topbar
            onMenuToggle={() => setSidebarOpen((prev) => !prev)}
            title={title}
          />
          <main className="flex-1 overflow-y-auto p-5 md:p-7">
            <Outlet />
          </main>
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}
