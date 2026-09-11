'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia } from '@/types'
import {
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  Siren,
  MapPin,
  Clock,
  Dog,
  PawPrint,
  Megaphone,
  HandHeart,
  Loader2
} from 'lucide-react'

const urgBadge: Record<string, any> = { Urgente: 'urgente', 'Atenção': 'atencao', Estável: 'resgatado' }
const stripeClass: Record<string, string> = { Urgente: 'card-stripe-urgente', resgatado: 'card-stripe-resgatado' }

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}min atrás`
  if (m < 1440) return `${Math.floor(m / 60)}h atrás`
  return `${Math.floor(m / 1440)}d atrás`
}

export default function InicioPage() {
  const [ocs, setOcs] = useState<Ocorrencia[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [stats, setStats] = useState({ urgentes: 0, ativos: 0, resgatados: 0 })
  const { profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchData()
    const ch = supabase.channel('feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, fetchData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [filter])

  async function fetchData() {
    setLoading(true)
    let q = supabase.from('ocorrencias').select('*, profiles(nome)').order('created_at', { ascending: false })
    if (filter === 'urgente') q = q.eq('urgencia', 'Urgente').eq('status', 'ativo')
    else if (filter === 'ferido') q = q.contains('situacao', ['Ferido'])
    else if (filter === 'resgatado') q = q.eq('status', 'resgatado')
    else if (filter === 'ativo') q = q.eq('status', 'ativo')
    const { data } = await q
    setOcs((data as Ocorrencia[]) || [])

    const { data: all } = await supabase.from('ocorrencias').select('urgencia,status')
    if (all) setStats({
      urgentes: all.filter(o => o.urgencia === 'Urgente' && o.status === 'ativo').length,
      ativos: all.filter(o => o.status === 'ativo').length,
      resgatados: all.filter(o => o.status === 'resgatado').length,
    })
    setLoading(false)
  }

  const FILTERS = [
    ['todos','Todos'],
    ['urgente','Urgentes'],
    ['ativo','Ativos'],
    ['ferido','Feridos'],
    ['resgatado','Resgatados']
  ]

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto">
        {profile && (
          <div className="mb-5">
            <h1 className="font-poppins text-xl font-bold text-[#7C4A1E] flex items-center gap-2">
              Olá, {profile.nome?.split(' ')[0]}!
            </h1>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            [Siren, stats.urgentes, 'Urgentes', 'text-red-500'],
            [ClipboardList, stats.ativos, 'Ativos', 'text-amber-700'],
            [CheckCircle, stats.resgatados, 'Resgatados', 'text-green-700']
          ].map(([Icon, num, label, color]: any) => (
            <div key={label} className="bg-white rounded-xl border border-border p-3 text-center">
              <Icon size={20} className="mx-auto mb-1" />
              <div className={`font-poppins text-2xl font-bold ${color}`}>{num}</div>
              <div className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(([f, l]) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-extrabold border-2 transition-colors shrink-0 ${filter === f ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-border text-muted-foreground hover:border-amber-300'}`}>
              {l}
            </button>
          ))}
        </div>

        <h2 className="font-poppins text-xl font-bold text-[#7C4A1E] mb-3">Ocorrências recentes</h2>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" size={32} />
          </div>
        )}

        {!loading && ocs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <PawPrint size={48} className="mx-auto mb-3" />
            <p className="font-bold text-base">Nenhuma ocorrência encontrada</p>
            <Button className="mt-4 flex items-center gap-2" onClick={() => router.push('/reportar')}>
              <Megaphone size={16} />
              Reportar agora
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {ocs.map(oc => (
            <Card key={oc.id} className="cursor-pointer hover:-translate-y-0.5 transition-transform" onClick={() => router.push(`/ocorrencia/${oc.id}`)}>
              <div className={`h-1.5 ${oc.urgencia === 'Urgente' ? 'bg-red-500' : oc.status === 'resgatado' ? 'bg-green-600' : 'bg-amber-400'}`} />
              {oc.foto_url && (
                <img src={oc.foto_url} alt={oc.titulo} className="w-full h-40 object-cover" />
              )}
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-extrabold text-[15px] text-foreground flex-1">{oc.titulo}</p>
                  <Badge variant={oc.status === 'resgatado' ? 'resgatado' : oc.status === 'em_resgate' ? 'em_resgate' : urgBadge[oc.urgencia]}>
                    {oc.status === 'resgatado' ? (
                      <span className="flex items-center gap-1"><CheckCircle size={12} /> Resgatado</span>
                    ) : oc.status === 'em_resgate' ? (
                      <span className="flex items-center gap-1"><Siren size={12} /> Em resgate</span>
                    ) : (
                      oc.urgencia
                    )}
                  </Badge>
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {oc.endereco}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(oc.created_at)}</span>
                  {oc.porte && <span className="flex items-center gap-1"><Dog size={12} /> {oc.porte}</span>}
                </div>

                {oc.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{oc.descricao}</p>}

                {oc.situacao?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {oc.situacao.map(s => (
                      <span key={s} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F7EFE5] text-[#7C4A1E]">{s}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button size="sm" className="flex-1" onClick={e => { e.stopPropagation(); router.push(`/ocorrencia/${oc.id}`) }}>
                    Ver detalhes
                  </Button>

                  {oc.status === 'ativo' && (
                    <Button size="sm" variant="ghost" className="flex-1 flex items-center gap-2"
                      onClick={e => { e.stopPropagation(); router.push('/resgates') }}>
                      <HandHeart size={14} />
                      Ajudar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthGuard>
  )
}