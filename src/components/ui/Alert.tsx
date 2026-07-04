import React from 'react'
import clsx from 'clsx'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  type?: AlertType
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

const config: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />,
  },
}

export function Alert({ type = 'info', title, message, onClose, className }: AlertProps) {
  const c = config[type]
  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 rounded-lg border p-3 text-sm',
        c.bg, c.border, c.text, className,
      )}
    >
      {c.icon}
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 rounded hover:opacity-70 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
