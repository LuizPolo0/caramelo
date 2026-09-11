'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  MessageCircle,
  MapPin,
  Dog,
  ClipboardList,
  HandHeart,
  Map
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Card, CardContent, Avatar, AvatarFallback } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia, Resgate } from '@/types'

export default function OcorrenciaDetailPage() {
  const { id } = useParams<{id:string}>()
  const [oc, setOc] = useState<Ocorrencia|null>(null)
  const [resgates, setResgates] = useState<Resgate[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { addToast } = useToast()

  useEffect(()=>{ fetchData() },[id])

  async function fetchData() {
    const [{ data: ocData },{ data: resData }] = await Promise.all([
      supabase.from('ocorrencias').select('*,profiles(nome,role,telefone)').eq('id',id!).single(),
      supabase.from('resgates').select('*,profiles(nome,role,telefone)').eq('ocorrencia_id',id!),
    ])
    setOc(ocData as Ocorrencia)
    setResgates((resData as Resgate[])||[])
    setLoading(false)
  }

  if (loading) return <AuthGuard><div className="flex justify-center py-20"><div className="animate-spin"><MessageCircle /></div></div></AuthGuard>
  if (!oc) return <AuthGuard><div className="p-4">Ocorrência não encontrada.</div></AuthGuard>

  const tipoLabel: Record<string,string> = {
    resgate:'Resgate',
    lar_temp:'Lar temporário',
    veterinario:'Veterinário'
  }

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto space-y-4">

        <h1 className="font-poppins text-xl font-bold">{oc.titulo}</h1>

        <Card>
          <CardContent className="pt-5 space-y-2">
            <p className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
              <ClipboardList size={14} />
              Detalhes
            </p>

            <div className="flex gap-2 text-sm">
              <MapPin size={14} />
              <span>{oc.endereco}</span>
            </div>

            {oc.porte && (
              <div className="flex gap-2 text-sm">
                <Dog size={14} />
                <span>{oc.porte}</span>
              </div>
            )}

            {oc.lat && oc.lng && (
              <Button size="sm" variant="ghost" className="mt-2 flex items-center gap-2">
                <Map size={14} />
                Ver no mapa
              </Button>
            )}
          </CardContent>
        </Card>

        {resgates.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
                <HandHeart size={14} />
                Voluntários
              </p>

              {resgates.map(r => (
                <div key={r.id} className="flex items-center gap-2 mt-2">
                  <Avatar><AvatarFallback>{(r as any).profiles?.nome?.[0]}</AvatarFallback></Avatar>
                  <span>{(r as any).profiles?.nome}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    </AuthGuard>
  )
}