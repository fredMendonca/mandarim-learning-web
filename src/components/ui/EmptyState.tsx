import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  title = 'Nenhum registro encontrado',
  description = 'Ainda não há dados para exibir.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-slate-300">
        {icon ?? <Inbox size={40} />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}
