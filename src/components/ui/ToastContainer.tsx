import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import type { Toast } from '@/hooks/useToast'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const config = {
  success: { bg: 'bg-green-600', icon: CheckCircle2 },
  error: { bg: 'bg-red-600', icon: AlertCircle },
  warning: { bg: 'bg-yellow-500', icon: AlertTriangle },
  info: { bg: 'bg-primary-600', icon: Info },
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-xs w-full">
      {toasts.map((toast) => {
        const { bg, icon: Icon } = config[toast.type]
        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-lg',
              'animate-slide-in',
              bg,
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="hover:opacity-70 transition-opacity"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
