'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  MessageCircle,
  MapPin,
  Dog,
  Clock,
  ClipboardList,
  HandHeart,
  History,
  Map
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, Avatar, AvatarFallback, Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia, Resgate, Mensagem } from '@/types'

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}min atrás`
  if (m < 1440) return `${Math.floor(m / 60)}h atrás`
  return `${Math.floor(m / 1440)}d atrás`
}

export default function OcorrenciaDetailPage() {
  const { id } = useParams<{id:string}>()
  const [oc, setOc] = useState<Ocorrencia|null>(null)
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(()=>{ fetchData() },[id])

  async function fetchData() {
    const [{ data: ocData },{ data: resData },{ data: msgData }] = await Promise.all([
      supabase.from('ocorrencias').select('*,profiles(nome,role,telefone)').eq('id',id!).single(),
      supabase.from('resgates').select('*,profiles(nome,role,telefone)').eq('ocorrencia_id',id!),
      supabase.from('mensagens').select('*,profiles(nome)').eq('ocorrencia_id',id!).order('created_at',{ascending:true}),
    ])
    setOc(ocData as Ocorrencia)
    setResgates((resData as Resgate[])||[])
    setMensagens((msgData as Mensagem[])||[])
    setLoading(false)
  }

  if (loading) return <AuthGuard><div className="flex justify-center py-20"><div className="animate-spin"><MessageCircle /></div></div></AuthGuard>
  if (!oc) return <AuthGuard><div className="p-4">Ocorrência não encontrada.</div></AuthGuard>

  const tipoLabel: Record<string,string> = {
    resgate:'Resgate',
    lar_temp:'Lar temporário',
    veterinario:'Veterinário'
  }

  const statusLabel: Record<string,string> = {
    ativo: oc.urgencia,
    em_resgate: 'Em resgate',
    resgatado: 'Resgatado',
    arquivado: 'Arquivado',
  }

  const statusVariant: Record<string,any> = {
    ativo: oc.urgencia === 'Urgente' ? 'urgente' : oc.urgencia === 'Estável' ? 'resgatado' : 'atencao',
    em_resgate: 'em_resgate',
    resgatado: 'resgatado',
    arquivado: 'outline',
  }

  const resgateStatusLabel: Record<string,string> = {
    confirmado: 'Confirmado',
    em_andamento: 'Em andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  }

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto space-y-4">

        {oc.foto_url && (
          <img src={oc.foto_url} alt={oc.titulo} className="w-full h-56 object-cover rounded-2xl border border-border" />
        )}

        <div className="flex items-start justify-between gap-2">
          <h1 className="font-poppins text-xl font-bold flex-1">{oc.titulo}</h1>
          <Badge variant={statusVariant[oc.status]}>{statusLabel[oc.status]}</Badge>
        </div>

        <Card>
          <CardContent className="pt-5 space-y-2">
            <p className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
              <ClipboardList size={14} />
              Detalhes
            </p>

            <div className="flex gap-2 text-sm">
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <span>{oc.endereco}</span>
            </div>

            <div className="flex gap-2 text-sm">
              <Clock size={14} className="shrink-0 mt-0.5" />
              <span>Reportado {timeAgo(oc.created_at)}{(oc as any).profiles?.nome ? ` por ${(oc as any).profiles.nome}` : ''}</span>
            </div>

            {oc.porte && (
              <div className="flex gap-2 text-sm">
                <Dog size={14} className="shrink-0 mt-0.5" />
                <span>Porte {oc.porte}</span>
              </div>
            )}

            {oc.descricao && (
              <p className="text-sm text-muted-foreground pt-1">{oc.descricao}</p>
            )}

            {oc.situacao?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap pt-1">
                {oc.situacao.map(s => (
                  <span key={s} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F7EFE5] text-[#7C4A1E]">{s}</span>
                ))}
              </div>
            )}

            {oc.lat && oc.lng && (
              <Button asChild size="sm" variant="ghost" className="mt-2 flex items-center gap-2 w-fit">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${oc.lat}&mlon=${oc.lng}#map=17/${oc.lat}/${oc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Map size={14} />
                  Ver no mapa
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {resgates.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2 mb-2">
                <HandHeart size={14} />
                Voluntários
              </p>

              {resgates.map(r => (
                <div key={r.id} className="flex items-center gap-2 mt-2">
                  <Avatar><AvatarFallback>{(r as any).profiles?.nome?.[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <span className="text-sm font-bold">{(r as any).profiles?.nome}</span>
                    <span className="text-xs text-muted-foreground ml-1">· {tipoLabel[r.tipo]}</span>
                  </div>
                  <Badge variant={r.status === 'concluido' ? 'resgatado' : 'atencao'}>
                    {resgateStatusLabel[r.status]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {mensagens.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2 mb-2">
                <History size={14} />
                Histórico
              </p>

              <div className="space-y-2">
                {mensagens.map(m => (
                  <div key={m.id} className="text-sm text-muted-foreground flex justify-between gap-2">
                    <span>{(m as any).profiles?.nome ? `${(m as any).profiles.nome}: ` : ''}{m.texto}</span>
                    <span className="text-xs shrink-0">{timeAgo(m.created_at)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AuthGuard>
  )
}