import { createContext, useContext } from 'react'
import type { useToast } from '@/hooks/useToast'

type ToastContextType = ReturnType<typeof useToast>

export const ToastContext = createContext<ToastContextType | null>(null)

export function useToastContext(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used inside MainLayout')
  return ctx
}
