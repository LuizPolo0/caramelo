'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lock,
  Home,
  Stethoscope,
  LayoutDashboard,
  ClipboardList,
  HandHeart,
  BarChart3,
  AlertTriangle,
  Activity,
  CheckCircle,
  List,
  MapPin,
  Clock,
  Phone,
  Users,
  Target
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/form'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia, Resgate, Profile } from '@/types'

const timeAgo = (d:string)=>{
  const m=Math.floor((Date.now()-new Date(d).getTime())/60000)
  if(m<60) return `${m}min atrás`
  if(m<1440) return `${Math.floor(m/60)}h atrás`
  return `${Math.floor(m/1440)}d atrás`
}

export default function PainelPage() {
  const { profile } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()
  const [ocs, setOcs] = useState<Ocorrencia[]>([])
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [voluntarios, setVoluntarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [fsStatus, setFsStatus] = useState('todos')
  const [fsUrgencia, setFsUrgencia] = useState('todos')

  const isOngOrVet = profile?.role === 'ong' || profile?.role === 'vet'

  useEffect(() => {
    if (!isOngOrVet) return
    fetchAll()
    const ch = supabase.channel('painel')
      .on('postgres_changes',{event:'*',schema:'public',table:'ocorrencias'},fetchAll)
      .on('postgres_changes',{event:'*',schema:'public',table:'resgates'},fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  },[isOngOrVet])

  async function fetchAll() {
    setLoading(true)
    const [{ data:o },{ data:r },{ data:v }] = await Promise.all([
      supabase.from('ocorrencias').select('*,profiles(nome,telefone)').order('created_at',{ascending:false}),
      supabase.from('resgates').select('*,profiles(nome,telefone,role),ocorrencias(titulo,endereco,urgencia)').order('created_at',{ascending:false}),
      supabase.from('profiles').select('*').in('role',['volunteer','vet']).order('nome'),
    ])
    setOcs((o as Ocorrencia[])||[])
    setResgates((r as Resgate[])||[])
    setVoluntarios((v as Profile[])||[])
    setLoading(false)
  }

  const atualizarStatus = async (id:string, status:string) => {
    await supabase.from('ocorrencias').update({status}).eq('id',id)
    addToast('Status atualizado','success')
    fetchAll()
  }

  const atualizarUrgencia = async (id:string, urgencia:string) => {
    await supabase.from('ocorrencias').update({urgencia}).eq('id',id)
    addToast('Urgência atualizada','success')
    fetchAll()
  }

  const atualizarResgateStatus = async (id:string, status:string) => {
    await supabase.from('resgates').update({status}).eq('id',id)
    addToast('Status do resgate atualizado','success')
    fetchAll()
  }

  const stats = {
    urgentes: ocs.filter(o=>o.urgencia==='Urgente'&&o.status==='ativo').length,
    em_resgate: ocs.filter(o=>o.status==='em_resgate').length,
    resgatados: ocs.filter(o=>o.status==='resgatado').length,
    total: ocs.length,
  }

  const ocsF = ocs.filter(o=>{
    if (fsStatus!=='todos'&&o.status!==fsStatus) return false
    if (fsUrgencia!=='todos'&&o.urgencia!==fsUrgencia) return false
    return true
  })

  if (!isOngOrVet) return (
    <AuthGuard>
      <div className="p-4 text-center py-20">
        <Lock size={48} className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-bold text-base">Acesso restrito</p>
        <p className="text-muted-foreground text-sm mt-1">Este painel é exclusivo para ONGs, abrigos e veterinários.</p>
        <Button className="mt-4" onClick={()=>router.push('/perfil')}>Alterar meu perfil</Button>
      </div>
    </AuthGuard>
  )

  return (
    <AuthGuard>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="font-poppins text-2xl font-bold text-[#7C4A1E] flex items-center gap-2">
              {profile?.role==='ong' ? <Home size={22}/> : <Stethoscope size={22}/>}
              {profile?.role==='ong' ? 'Painel ONG' : 'Painel Veterinário'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{profile?.nome}</p>
          </div>
          <span className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1">
            {profile?.role==='ong' ? <Home size={12}/> : <Stethoscope size={12}/>}
            {profile?.role==='ong'?'ONG / Abrigo':'Veterinário'}
          </span>
        </div>

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-5">
            <TabsTrigger value="dashboard"><LayoutDashboard size={14}/> Dashboard</TabsTrigger>
            <TabsTrigger value="casos"><ClipboardList size={14}/> Casos</TabsTrigger>
            <TabsTrigger value="voluntarios"><HandHeart size={14}/> Voluntários</TabsTrigger>
            <TabsTrigger value="relatorio"><BarChart3 size={14}/> Relatório</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                [AlertTriangle,stats.urgentes,'Urgentes','text-red-500'],
                [Activity,stats.em_resgate,'Em resgate','text-blue-600'],
                [CheckCircle,stats.resgatados,'Resgatados','text-green-700'],
                [List,stats.total,'Total','text-[#7C4A1E]']
              ].map(([Icon,num,label,color]:any)=>(
                <div key={label} className="bg-white rounded-xl border border-border p-4 text-center">
                  <Icon size={20} className="mx-auto mb-1"/>
                  <div className={`font-poppins text-2xl font-bold ${color}`}>{num}</div>
                  <div className="text-[10px] font-extrabold text-muted-foreground uppercase mt-1">{label}</div>
                </div>
              ))}
            </div>

            <h2 className="font-poppins text-lg font-bold text-[#7C4A1E] mb-3 flex items-center gap-2">
              <AlertTriangle size={16}/> Urgentes agora
            </h2>

            {ocs.filter(o=>o.urgencia==='Urgente'&&o.status==='ativo').length===0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-700 font-bold text-sm">
                Nenhuma ocorrência urgente!
              </div>
            ) : ocs.filter(o=>o.urgencia==='Urgente'&&o.status==='ativo').map(oc=>(
              <Card key={oc.id} className="mb-3">
                <div className="h-1.5 bg-red-500" />
                <CardContent className="pt-4">
                  <p className="font-extrabold text-[15px]">{oc.titulo}</p>
                  <p className="text-xs text-muted-foreground mb-3 flex gap-2 items-center">
                    <MapPin size={12}/> {oc.endereco}
                    <Clock size={12}/> {timeAgo(oc.created_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={()=>router.push(`/ocorrencia/${oc.id}`)}>Ver detalhes</Button>
                    <Button size="sm" variant="ghost" onClick={()=>atualizarStatus(oc.id,'em_resgate')}>
                      <HandHeart size={14}/> Assumir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="casos">
            <div className="flex gap-2 mb-4">
              <Select value={fsStatus} onValueChange={setFsStatus}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_resgate">Em resgate</SelectItem>
                  <SelectItem value="resgatado">Resgatado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fsUrgencia} onValueChange={setFsUrgencia}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas urgências</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Atenção">Atenção</SelectItem>
                  <SelectItem value="Estável">Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ocsF.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList size={40} className="mx-auto mb-3" />
                <p className="font-bold">Nenhum caso encontrado com esses filtros.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ocsF.map(oc => {
                  const resgatesDoCaso = resgates.filter(r => r.ocorrencia_id === oc.id)
                  return (
                    <Card key={oc.id}>
                      <div className={`h-1.5 ${oc.urgencia==='Urgente'?'bg-red-500':oc.status==='resgatado'?'bg-green-600':'bg-amber-400'}`} />
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <p className="font-extrabold text-[15px] flex-1">{oc.titulo}</p>
                          <Badge variant={oc.status==='resgatado'?'resgatado':oc.status==='em_resgate'?'em_resgate':oc.urgencia==='Urgente'?'urgente':'atencao'}>
                            {oc.status==='ativo' ? oc.urgencia : oc.status==='em_resgate' ? 'Em resgate' : oc.status==='resgatado' ? 'Resgatado' : 'Arquivado'}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin size={12}/> {oc.endereco}</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {timeAgo(oc.created_at)}</span>
                        </p>

                        {resgatesDoCaso.length > 0 && (
                          <div className="mb-3 space-y-1.5">
                            {resgatesDoCaso.map(r => (
                              <div key={r.id} className="flex items-center justify-between gap-2 bg-secondary rounded-lg px-2.5 py-1.5">
                                <span className="text-xs font-bold">{(r as any).profiles?.nome || 'Voluntário'}</span>
                                <select
                                  value={r.status}
                                  onChange={e=>atualizarResgateStatus(r.id, e.target.value)}
                                  className="text-xs font-bold bg-white border border-border rounded-md px-1.5 py-0.5"
                                >
                                  <option value="confirmado">Confirmado</option>
                                  <option value="em_andamento">Em andamento</option>
                                  <option value="concluido">Concluído</option>
                                  <option value="cancelado">Cancelado</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="flex-1" onClick={()=>router.push(`/ocorrencia/${oc.id}`)}>Ver detalhes</Button>
                          {oc.status!=='resgatado' && (
                            <Button size="sm" className="flex-1" onClick={()=>atualizarStatus(oc.id,'resgatado')}>Marcar resgatado</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="voluntarios">
            <p className="text-xs font-bold text-muted-foreground mb-3 flex items-center gap-2">
              <Users size={12}/> {voluntarios.length} voluntário(s)
            </p>

            <div className="space-y-3">
              {voluntarios.map(v=>(
                <div key={v.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white font-extrabold text-lg">
                    {v.nome?.[0]||'?'}
                  </div>

                  <div className="flex-1">
                    <p className="font-extrabold text-sm">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.role==='vet' ? 'Veterinário' : 'Voluntário'}
                    </p>
                  </div>

                  {v.telefone && (
                    <a href={`tel:${v.telefone}`}>
                      <Phone size={18} className="text-amber-700"/>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="relatorio">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="font-extrabold text-green-800 mb-2 flex items-center gap-2">
                <Target size={16}/> Taxa de resolução
              </p>
              <div className="font-poppins text-4xl font-bold text-green-700">
                {ocs.length?Math.round((stats.resgatados/ocs.length)*100):0}%
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </AuthGuard>
  )
}