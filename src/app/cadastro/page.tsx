'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Megaphone,
  HandHeart,
  Home,
  Stethoscope,
  Dog
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/form'
import { cn, authErrorMessage } from '@/lib/utils'

const ROLES = [
  { id: 'reporter',  icon: Megaphone, label: 'Reportador',   desc: 'Reporto cachorros em situação de rua' },
  { id: 'volunteer', icon: HandHeart, label: 'Voluntário',   desc: 'Ajudo a resgatar e encaminhar animais' },
  { id: 'ong',       icon: Home,      label: 'ONG / Abrigo', desc: 'Represento uma organização de proteção animal' },
  { id: 'vet',       icon: Stethoscope,label: 'Veterinário', desc: 'Ofereço atendimento para animais resgatados' },
]

function strengthScore(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', password: '', password2: '', role: 'reporter' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const goNext = () => {
    setError('')
    if (step === 1) {
      if (!form.nome || !form.email || !form.telefone) { setError('Preencha todos os campos.'); return }
      if (!/\S+@\S+\.\S+/.test(form.email)) { setError('E-mail inválido.'); return }
    }
    if (step === 2) {
      if (form.password.length < 8) { setError('Senha deve ter no mínimo 8 caracteres.'); return }
      if (form.password !== form.password2) { setError('As senhas não coincidem.'); return }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    const { error: err } = await signUp({ email: form.email, password: form.password, nome: form.nome, telefone: form.telefone, role: form.role })
    setLoading(false)
    if (err) { setError(authErrorMessage(err.message)); return }
    addToast('Conta criada com sucesso!', 'success')
    router.replace('/inicio')
  }

  const score = strengthScore(form.password)
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-amber-500', 'bg-green-500'][score]
  const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Média', 'Forte'][score]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="bg-amber-500 flex flex-col items-center justify-center gap-4 p-10 md:w-2/5">
        <div className="w-20 h-20 rounded-full bg-[#7C4A1E] flex items-center justify-center border-4 border-white/25">
          <Dog size={36} className="text-white" />
        </div>

        <h1 className="font-fraunces text-white text-3xl font-bold text-center">Caramelo do Bem</h1>
        <p className="text-amber-100 text-sm font-semibold">Criar conta gratuita</p>

        <div className="flex gap-2 mt-4">
          {[1,2,3].map(s => (
            <div key={s} className={cn('h-2 rounded-full transition-all', step === s ? 'w-6 bg-white' : 'w-2 bg-white/40')} />
          ))}
        </div>
        <p className="text-white/80 text-xs font-bold">Passo {step} de 3</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-bold mb-4">{error}</div>}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-[#7C4A1E] mb-6">Seus dados</h2>
              <div className="space-y-4">
                <div>
                  <Label>Nome completo</Label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Ex: Luiz Fernando" className="pl-9" value={form.nome} onChange={e => set('nome', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" className="pl-9" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Telefone</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="tel" placeholder="(43) 99999-9999" className="pl-9" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
                  </div>
                </div>

                <Button className="w-full" onClick={goNext}>Continuar →</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-fraunces text-xl font-bold text-[#7C4A1E] mb-6">Criar senha</h2>
              <div className="space-y-4">
                <div>
                  <Label>Senha</Label>
                  <div className="relative">
                    <Input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" className="pr-10"
                      value={form.password} onChange={e => set('password', e.target.value)} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={cn('flex-1 rounded-full transition-colors', i <= score ? strengthColor : 'bg-border')} />
                        ))}
                      </div>
                      <p className="text-xs font-bold mt-1" style={{ color: score >= 3 ? '#3B8A5A' : score >= 2 ? '#C47A0D' : '#D94F3D' }}>
                        {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Confirmar senha</Label>
                  <Input type="password" placeholder="Repita a senha" value={form.password2} onChange={e => set('password2', e.target.value)} />
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>← Voltar</Button>
                  <Button className="flex-[2]" onClick={goNext}>Continuar →</Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-fraunces text-xl font-bold text-[#7C4A1E] mb-2">Como você quer ajudar?</h2>
              <p className="text-muted-foreground text-sm mb-5">Escolha seu perfil (pode mudar depois)</p>

              <div className="space-y-3 mb-5">
                {ROLES.map(r => {
                  const Icon = r.icon
                  return (
                    <button key={r.id} onClick={() => set('role', r.id)}
                      className={cn('w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                        form.role === r.id ? 'border-amber-500 bg-amber-50' : 'border-border bg-white hover:border-amber-300')}>
                      
                      <Icon size={22} />

                      <div className="flex-1">
                        <div className="text-sm font-extrabold text-foreground">{r.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                      </div>

                      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0',
                        form.role === r.id ? 'bg-amber-500 border-amber-500 text-white' : 'border-border')}>
                        {form.role === r.id && ''}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>← Voltar</Button>
                <Button className="flex-[2]" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar conta'}
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?
            <Link href="/login" className="text-amber-700 font-extrabold hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}