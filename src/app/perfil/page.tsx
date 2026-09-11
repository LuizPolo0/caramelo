'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import {
  Megaphone,
  Handshake,
  Home,
  Stethoscope,
  Bell,
  Pencil,
  Save,
  LogOut,
  MapPin,
  FileText
} from 'lucide-react'
import { Card, CardContent, Switch, Avatar, AvatarFallback } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/form'
import { Badge } from '@/components/ui/primitives'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia } from '@/types'

const ROLE_LABELS: Record<string,string> = { reporter:'Reportador', volunteer:'Voluntário', ong:'ONG / Abrigo', vet:'Veterinário' }

export default function PerfilPage() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [form, setForm] = useState({ nome:'', telefone:'', bairro:'', role:'reporter' })
  const [stats, setStats] = useState({ reportados:0, resgates:0 })
  const [meusRelatos, setMeusRelatos] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default')

  useEffect(()=>{
    if (!user) { router.replace('/login'); return }
    if (profile) setForm({ nome:profile.nome||'', telefone:profile.telefone||'', bairro:profile.bairro||'', role:profile.role||'reporter' })
    fetchStats()
    if ('Notification' in window) setNotifPerm(Notification.permission)
  },[profile, user])

  async function fetchStats() {
    if (!user) return
    const [{ count:r },{ count:re }] = await Promise.all([
      supabase.from('ocorrencias').select('*',{count:'exact',head:true}).eq('user_id',user.id),
      supabase.from('resgates').select('*',{count:'exact',head:true}).eq('voluntario_id',user.id),
    ])
    setStats({ reportados:r||0, resgates:re||0 })
    const { data } = await supabase.from('ocorrencias').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5)
    setMeusRelatos((data as Ocorrencia[])||[])
  }

  const handleSave = async () => {
    setLoading(true)
    const { error } = await updateProfile(form as any)
    setLoading(false)
    if (error) { addToast('Erro ao salvar perfil','error'); return }
    addToast('Perfil salvo com sucesso','success')
  }

  const handleSignOut = async () => { await signOut(); router.replace('/login') }

  const toggleNotif = async () => {
    if (notifPerm === 'denied') { addToast('Permissão bloqueada.','error'); return }
    if (!notifEnabled) {
      const perm = await Notification.requestPermission()
      setNotifPerm(perm)
      if (perm === 'granted') {
        setNotifEnabled(true)
        new Notification('Caramelo do Bem', { body: 'Notificações ativadas!', icon:'/favicon.ico' })
        addToast('Notificações ativadas','success')
      }
    } else {
      setNotifEnabled(false)
      addToast('Notificações desativadas.')
    }
  }

  const initials = form.nome?.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()||'?'
  const isOngOrVet = form.role==='ong'||form.role==='vet'
  const urgBadge: Record<string,any> = { Urgente:'urgente', 'Atenção':'atencao', Estável:'resgatado' }

  const RoleIcon = ({ role }: { role: string }) => {
    switch (role) {
      case 'reporter': return <Megaphone size={14} />
      case 'volunteer': return <Handshake size={14} />
      case 'ong': return <Home size={14} />
      case 'vet': return <Stethoscope size={14} />
      default: return null
    }
  }

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto">

        <div className="flex flex-col items-center py-6 gap-3 mb-2">
          <Avatar className="w-20 h-20"><AvatarFallback className="text-2xl">{initials}</AvatarFallback></Avatar>
          <div className="text-center">
            <h1 className="font-poppins text-xl font-bold text-[#7C4A1E]">{form.nome||'Usuário'}</h1>
            <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-xs font-extrabold">
              <RoleIcon role={form.role} />
              {ROLE_LABELS[form.role]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            [<FileText size={18} />,stats.reportados,'Reportados','text-amber-700'],
            [<Handshake size={18} />,stats.resgates,'Resgates','text-blue-700']
          ].map(([icon,num,label,color],i)=>(
            <div key={i} className="bg-white rounded-xl border border-border p-3 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={`font-poppins text-xl font-bold ${color}`}>{num}</div>
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <Card className="mb-4">
          <CardContent className="pt-5">
            <h3 className="font-extrabold text-sm text-[#7C4A1E] mb-4 flex items-center gap-1">
              <Pencil size={14}/> Editar perfil
            </h3>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} /></div>
              <div><Label>Telefone</Label><Input type="tel" value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} /></div>
              <div><Label>Bairro</Label><Input value={form.bairro} onChange={e=>setForm(f=>({...f,bairro:e.target.value}))} /></div>
              <div>
                <Label>Meu perfil</Label>
                <Select value={form.role} onValueChange={v=>setForm(f=>({...f,role:v}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reporter">
                      <div className="flex items-center gap-2">
                        <Megaphone size={14} />
                        Reportador
                      </div>
                    </SelectItem>
                    <SelectItem value="volunteer">
                      <div className="flex items-center gap-2">
                        <Handshake size={14} />
                        Voluntário
                      </div>
                    </SelectItem>
                    <SelectItem value="ong">
                      <div className="flex items-center gap-2">
                        <Home size={14} />
                        ONG / Abrigo
                      </div>
                    </SelectItem>
                    <SelectItem value="vet">
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} />
                        Veterinário
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={loading}>
                <Save size={16} className="mr-2"/>
                {loading?'Salvando...':'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {meusRelatos.length>0 && (
          <Card className="mb-4">
            <CardContent className="pt-5">
              <h3 className="font-extrabold text-sm text-[#7C4A1E] mb-4 flex items-center gap-1">
                <FileText size={14}/> Meus relatórios
              </h3>
              <div className="divide-y divide-border">
                {meusRelatos.map(oc=>(
                  <div key={oc.id} className="py-3 flex justify-between items-center cursor-pointer hover:opacity-80" onClick={()=>router.push(`/ocorrencia/${oc.id}`)}>
                    <div>
                      <p className="font-bold text-sm">{oc.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin size={12}/> {oc.endereco}
                      </p>
                    </div>
                    <Badge variant={urgBadge[oc.urgencia]}>{oc.urgencia}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button variant="destructive" className="w-full" onClick={handleSignOut}>
          <LogOut size={16} className="mr-2"/>
          Sair da conta
        </Button>
      </div>
    </AuthGuard>
  )
}