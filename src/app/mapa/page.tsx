'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import type { Ocorrencia } from '@/types'
import { Map, Loader2 } from 'lucide-react'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-112px)] bg-muted">
      <div className="text-center">
        <Map size={40} className="mx-auto mb-3 text-muted-foreground" />
        <Loader2 size={32} className="animate-spin mx-auto text-amber-500" />
      </div>
    </div>
  )
})

export default function MapaPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [filter, setFilter] = useState('todos')

  useEffect(() => { fetchData() }, [filter])

  async function fetchData() {
    let q = supabase.from('ocorrencias').select('*').not('lat', 'is', null)
    if (filter === 'urgente') q = q.eq('urgencia', 'Urgente').eq('status', 'ativo')
    if (filter === 'ativo') q = q.eq('status', 'ativo')
    if (filter === 'resgatado') q = q.eq('status', 'resgatado')
    const { data } = await q
    setOcorrencias((data as Ocorrencia[]) || [])
  }

  return (
    <AuthGuard>
      <MapView ocorrencias={ocorrencias} filter={filter} setFilter={setFilter} />
    </AuthGuard>
  )
}