import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Dumbbell,
  Brain,
  RefreshCcw,
  Lightbulb,
  Sparkles,
  BarChart3,
  Tags,
  Bookmark,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  adminOnly?: boolean
  alunoOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  // Admin only
  { to: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { to: '/conteudos', label: 'Conteúdos', icon: BookOpen, adminOnly: true },
  { to: '/exercicios', label: 'Exercícios', icon: Dumbbell, adminOnly: true },
  { to: '/ia', label: 'Conteúdos IA', icon: Sparkles, adminOnly: true },
  { to: '/temas', label: 'Temas', icon: Bookmark, adminOnly: true },
  { to: '/tags', label: 'Tags', icon: Tags, adminOnly: true },
  // Both (aluno + admin)
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/revisoes', label: 'Revisões', icon: RefreshCcw },
  { to: '/recomendacoes', label: 'Recomendações', icon: Lightbulb },
  { to: '/estatisticas', label: 'Estatísticas', icon: BarChart3 },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isAdmin, isAluno } = useAuth()

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.alunoOnly && !isAluno) return false
    return true
  })

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-slate-200',
          'flex flex-col transition-transform duration-200',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">中</span>
            </div>
            <span className="text-base font-bold text-slate-800">Mandarim</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Navegação principal">
          <ul className="space-y-0.5">
            {filteredNav.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                    )
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Sistema de Aprendizado de Mandarim
          </p>
        </div>
      </aside>
    </>
  )
}
