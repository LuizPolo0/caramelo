'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Dog,
  LogIn
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/form'
import { authErrorMessage } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signInWithGoogle } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true); setError('')
    const { error: err } = await signIn({ email, password })
    setLoading(false)
    if (err) { setError(authErrorMessage(err.message)); return }
    addToast('Bem-vindo de volta!', 'success')
    router.replace('/inicio')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="bg-amber-500 flex flex-col items-center justify-center gap-4 p-10 w-full md:w-2/5 md:min-h-screen">
        <div className="w-20 h-20 rounded-full bg-[#7C4A1E] flex items-center justify-center border-4 border-white/25">
          <Dog size={36} className="text-white" />
        </div>

        <h1 className="font-poppins text-white text-3xl font-bold text-center">Caramelo do Bem</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <h2 className="font-poppins text-2xl font-bold text-[#7C4A1E] mb-1 flex items-center gap-2">
            Entrar na conta!
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-bold">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="********"
                  className="pl-9 pr-10"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? 'Entrando...' : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </Button>
          </form>


          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem conta?
            <Link href="/cadastro" className="text-amber-700 font-extrabold hover:underline">
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}