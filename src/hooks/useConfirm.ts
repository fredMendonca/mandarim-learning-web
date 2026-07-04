import { useState, useCallback } from 'react'

interface ConfirmState {
  open: boolean
  message: string
  onConfirm: (() => void) | null
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    message: '',
    onConfirm: null,
  })

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        message,
        onConfirm: () => {
          resolve(true)
          setState({ open: false, message: '', onConfirm: null })
        },
      })
    })
  }, [])

  const cancel = useCallback(() => {
    setState({ open: false, message: '', onConfirm: null })
  }, [])

  return { ...state, confirm, cancel }
}
