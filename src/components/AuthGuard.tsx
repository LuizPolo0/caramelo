'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AppShell from '@/components/AppShell'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-5xl">🐕</div>
      <div className="w-8 h-8 border-4 border-border border-t-amber-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-muted-foreground">Carregando...</p>
    </div>
  )

  if (!user) return null

  return <AppShell>{children}</AppShell>
}
