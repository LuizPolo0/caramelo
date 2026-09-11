'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastClose } from '@/components/ui/primitives'

type ToastType = 'default' | 'success' | 'error'
interface ToastItem { id: number; msg: string; type: ToastType }

const ToastCtx = createContext<{ addToast: (msg: string, type?: ToastType) => void }>({ addToast: () => {} })

export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ addToast }}>
      <ToastProvider>
        {children}
        {toasts.map(t => (
          <Toast key={t.id} variant={t.type} open>
            <ToastTitle>{t.msg}</ToastTitle>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
