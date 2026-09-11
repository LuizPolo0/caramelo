'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Handshake,
  List,
  MapPin,
  Clock,
  User,
  Eye,
  Home,
  Stethoscope,
  Check,
  Lock,
  PawPrint
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia, Resgate } from '@/types'

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
  if (m<60) return `${m}min atrás`; if (m<1440) return `${Math.floor(m/60)}h atrás`; return `${Math.floor(m/1440)}d atrás`
}

export default function ResgatesPage() {
  const [ocorrencias, setOcorrencias] = useState<(Ocorrencia & {resgates:any[]})[]>([])
  const [meusResgates, setMeusResgates] = useState<Resgate[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: ocs } = await supabase.from('ocorrencias')
      .select('*, resgates(id,voluntario_id,status,tipo)')
      .in('status', ['ativo','em_resgate'])
      .order('created_at', { ascending: false })
    setOcorrencias((ocs as any) || [])

    if (user) {
      const { data: meus } = await supabase.from('resgates')
        .select('*, ocorrencias(titulo,endereco,urgencia,status)')
        .eq('voluntario_id', user.id)
        .order('created_at', { ascending: false })
      setMeusResgates((meus as any) || [])
    }
    setLoading(false)
  }

  const confirmar = async (ocorrenciaId: string, tipo: string) => {
    if (!user) { router.push('/login'); return }
    const oc = ocorrencias.find(o => o.id === ocorrenciaId)
    if (oc?.resgates?.some(r => r.voluntario_id === user.id)) { addToast('Você já confirmou este resgate!'); return }

    const { error } = await supabase.from('resgates').insert({
      ocorrencia_id: ocorrenciaId,
      voluntario_id: user.id,
      tipo
    })

    if (error) { addToast('Erro ao confirmar.','error'); return }

    await supabase.from('ocorrencias').update({ status: 'em_resgate' }).eq('id', ocorrenciaId)

    await supabase.from('mensagens').insert({
      ocorrencia_id: ocorrenciaId,
      user_id: user.id,
      texto: `Confirmou participação como: ${
        tipo==='resgate'
          ? 'Voluntário de resgate'
          : tipo==='lar_temp'
          ? 'Lar temporário'
          : 'Atendimento veterinário'
      }`,
      tipo: 'sistema'
    })

    addToast('Resgate confirmado!','success')
    fetchData()
  }

  const urgBadge: Record<string,any> = {
    Urgente:'urgente',
    'Atenção':'atencao',
    Estável:'resgatado'
  }

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="text-[#7C4A1E]" />
          <h1 className="font-poppins text-2xl font-bold text-[#7C4A1E]">
            Central de resgates
          </h1>
        </div>

        <Tabs defaultValue="disponiveis">
          <TabsList className="mb-5">
            <TabsTrigger value="disponiveis" className="flex items-center gap-2">
              <Handshake size={14} />
              Disponíveis
            </TabsTrigger>
            <TabsTrigger value="meus" className="flex items-center gap-2">
              <List size={14} />
              Meus resgates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="disponiveis">
            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-border border-t-amber-500 rounded-full animate-spin" />
              </div>
            )}

            {!loading && ocorrencias.length === 0 && (
              <div className="text-center py-12">
                <Check size={40} className="mx-auto mb-3 text-green-600" />
                <p className="font-bold text-base">Nenhum resgate pendente!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os animais estão sendo atendidos.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {ocorrencias.map(oc => {
                const nVols = oc.resgates?.length || 0
                const euConfirmei = oc.resgates?.some(r => r.voluntario_id === user?.id)

                return (
                  <Card key={oc.id}>
                    <div className={`h-1.5 ${oc.urgencia==='Urgente'?'bg-red-500':'bg-amber-400'}`} />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-extrabold text-[15px] flex-1">{oc.titulo}</p>
                        <Badge variant={urgBadge[oc.urgencia]}>
                          {oc.urgencia}
                        </Badge>
                      </div>

                      <div className="flex gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {oc.endereco}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {timeAgo(oc.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {nVols} voluntário{nVols!==1?'s':''}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={euConfirmei?'success':'default'}
                          className="flex-1 flex items-center gap-2"
                          onClick={()=>confirmar(oc.id,'resgate')}
                        >
                          {euConfirmei ? <Check size={14} /> : <Handshake size={14} />}
                          {euConfirmei ? 'Confirmado' : 'Vou resgatar'}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 flex items-center gap-2"
                          onClick={()=>confirmar(oc.id,'lar_temp')}
                        >
                          <Home size={14} />
                          Lar temp.
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={()=>router.push(`/ocorrencia/${oc.id}`)}
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="meus">
            {!user ? (
              <div className="text-center py-12">
                <Lock size={40} className="mx-auto mb-3" />
                <p className="font-bold">Faça login para ver seus resgates</p>
                <Button className="mt-4" onClick={()=>router.push('/login')}>
                  Entrar
                </Button>
              </div>
            ) : meusResgates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PawPrint size={40} className="mx-auto mb-3" />
                <p className="font-bold">
                  Você ainda não participou de nenhum resgate
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meusResgates.map(r => (
                  <Card key={r.id}>
                    <CardContent className="pt-4">
                      <p className="font-extrabold text-[15px] mb-1">
                        {(r as any).ocorrencias?.titulo}
                      </p>

                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <MapPin size={12} />
                        {(r as any).ocorrencias?.endereco}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="atencao">
                          {r.tipo==='resgate' && <Handshake size={12} />}
                          {r.tipo==='lar_temp' && <Home size={12} />}
                          {r.tipo==='veterinario' && <Stethoscope size={12} />}
                          <span className="ml-1">
                            {r.tipo==='resgate'
                              ? 'Resgate'
                              : r.tipo==='lar_temp'
                              ? 'Lar temp.'
                              : 'Veterinário'}
                          </span>
                        </Badge>

                        <Badge variant={r.status==='concluido'?'resgatado':'atencao'}>
                          {r.status==='confirmado'
                            ? 'Confirmado'
                            : r.status==='em_andamento'
                            ? 'Em andamento'
                            : r.status==='concluido'
                            ? 'Concluído'
                            : 'Cancelado'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}