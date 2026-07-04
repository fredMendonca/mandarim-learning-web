import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface LoadingProps {
  message?: string
  fullPage?: boolean
  size?: number
}

export function Loading({ message = 'Carregando...', fullPage = false, size = 24 }: LoadingProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 text-slate-400',
        fullPage ? 'min-h-[60vh]' : 'py-12',
      )}
    >
      <Loader2 size={size} className="animate-spin text-primary-500" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
