import { Menu, ExternalLink, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/Badge'

interface TopbarProps {
  onMenuToggle: () => void
  title?: string
}

export function Topbar({ onMenuToggle, title }: TopbarProps) {
  const { user, logout, isAdmin } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        {title && (
          <span className="text-sm font-medium text-slate-600 hidden sm:block">{title}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
              <User size={14} className="text-slate-400" />
              <span className="text-sm text-slate-700 font-medium hidden sm:inline">{user.nome}</span>
              <Badge variant={isAdmin ? 'purple' : 'info'} className="text-[10px]">
                {user.role}
              </Badge>
            </div>
          </div>
        )}

        {/* Swagger link */}
        <a
          href="http://localhost:8080/swagger-ui/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-primary-50"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Swagger</span>
        </a>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          title="Sair"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
