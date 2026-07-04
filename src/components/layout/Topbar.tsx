import { Menu, ExternalLink } from 'lucide-react'

interface TopbarProps {
  onMenuToggle: () => void
  title?: string
}

export function Topbar({ onMenuToggle, title }: TopbarProps) {
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

      <div className="flex items-center gap-2">
        <a
          href="http://localhost:8080/swagger-ui/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-primary-50"
        >
          <ExternalLink size={13} />
          Swagger
        </a>
      </div>
    </header>
  )
}
