'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  Loader2,
  Camera,
  FileText,
  PawPrint,
  AlertCircle,
  CheckCircle,
  Info,
  Check
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/primitives'
import AuthGuard from '@/components/AuthGuard'
import { cn } from '@/lib/utils'

const SITUACOES = ['Ferido', 'Com fome', 'Filhote', 'Doente', 'Aparentemente saudável', 'Agressivo']
const PORTES = ['Pequeno', 'Médio', 'Grande']
const URGENCIAS = [
  { id: 'Estável', icon: CheckCircle, desc: 'Animal estável, sem risco imediato' },
  { id: 'Atenção', icon: Info, desc: 'Precisa de atenção em breve' },
  { id: 'Urgente', icon: AlertCircle, desc: 'Risco de vida, precisa de ajuda agora' },
]

type LocalizacaoEncontrada = {
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  pais?: string
  lat: number
  lng: number
}

const Section = ({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon: any
  children: React.ReactNode
}) => (
  <Card className="mb-4">
    <CardContent className="pt-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-[#7C4A1E]" />
        <h3 className="font-extrabold text-sm text-[#7C4A1E]">{title}</h3>
      </div>
      {children}
    </CardContent>
  </Card>
)

export default function ReportarPage() {
  const [form, setForm] = useState({
    titulo: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    pais: 'Brasil',
    descricao: '',
    situacao: [] as string[],
    porte: '',
    urgencia: 'Atenção',
    lat: null as number | null,
    lng: null as number | null
  })

  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [error, setError] = useState('')

  const { user } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const setField = (k: string, v: any) =>
    setForm(f => ({ ...f, [k]: v }))

  const toggleSit = (s: string) =>
    setField(
      'situacao',
      form.situacao.includes(s)
        ? form.situacao.filter(x => x !== s)
        : [...form.situacao, s]
    )

  // Reverse geocoding via Nominatim (OpenStreetMap)
  const buscarEnderecoPorCoordenadas = async (
    lat: number,
    lng: number
  ): Promise<LocalizacaoEncontrada | null> => {
    try {
      const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        lat: String(lat),
        lon: String(lng),
      })

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
        { headers: { Accept: 'application/json' } }
      )

      if (!response.ok) throw new Error('Falha ao consultar localização')

      const data = await response.json()
      const address = data.address || {}

      return {
        endereco:
          address.road ||
          address.pedestrian ||
          address.footway ||
          address.neighbourhood ||
          data.display_name ||
          '',
        numero: address.house_number || '',
        bairro: address.suburb || address.neighbourhood || address.city_district || '',
        cidade: address.city || address.town || address.village || address.municipality || '',
        estado: address.state_code || address.state || '',
        cep: address.postcode || '',
        pais: address.country || 'Brasil',
        lat,
        lng,
      }
    } catch {
      return null
    }
  }

  const getLocation = async (): Promise<LocalizacaoEncontrada | null> => {
    if (!navigator.geolocation) {
      addToast('Seu navegador não suporta localização automática.', 'error')
      return null
    }

    setGeoLoading(true)

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      })

      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const enderecoEncontrado = await buscarEnderecoPorCoordenadas(lat, lng)

      const localizacao: LocalizacaoEncontrada = {
        ...(enderecoEncontrado || {}),
        endereco: enderecoEncontrado?.endereco || 'Localização atual',
        lat,
        lng,
      }

      setForm(f => ({ ...f, ...localizacao }))
      addToast('Localização obtida com sucesso!', 'success')
      return localizacao
    } catch {
      addToast('Não foi possível obter sua localização. Permita o acesso ao GPS.', 'error')
      return null
    } finally {
      setGeoLoading(false)
    }
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.titulo) {
      setError('Título é obrigatório.')
      return
    }

    if (!form.porte) {
      setError('Selecione o porte do animal.')
      return
    }

    setLoading(true)
    setError('')

    let localizacao: LocalizacaoEncontrada = {
      lat: form.lat as number,
      lng: form.lng as number,
    }

    if (!form.lat || !form.lng) {
      const encontrada = await getLocation()
      if (encontrada) localizacao = encontrada
    }

    if (!localizacao.lat || !localizacao.lng) {
      setLoading(false)
      setError('Clique em Localizar e permita o acesso à localização antes de enviar.')
      return
    }

    let foto_url: string | null = null

    if (foto) {
      const ext = foto.name.split('.').pop()
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`
      const path = `ocorrencias/${fileName}`

      const { error: upErr } = await supabase.storage
        .from('fotos')
        .upload(path, foto, { cacheControl: '3600', upsert: false })

      if (upErr) {
        setLoading(false)
        setError(`Erro ao enviar foto: ${upErr.message}`)
        return
      }

      foto_url = supabase.storage.from('fotos').getPublicUrl(path).data.publicUrl
    }

    const enderecoParaSalvar = [
      localizacao.endereco || form.endereco || 'Localização atual',
      localizacao.numero || form.numero,
      localizacao.cidade || form.cidade,
      localizacao.estado || form.estado,
    ]
      .filter(Boolean)
      .join(', ')

    const { error: err } = await supabase.from('ocorrencias').insert({
      titulo: form.titulo,
      descricao: form.descricao,
      endereco: enderecoParaSalvar || 'Localização atual',
      bairro: localizacao.bairro || form.bairro || null,
      lat: localizacao.lat,
      lng: localizacao.lng,
      situacao: form.situacao,
      porte: form.porte,
      urgencia: form.urgencia,
      user_id: user?.id || null,
      foto_url,
    })

    setLoading(false)

    if (err) {
      setError('Erro ao salvar. Verifique sua conexão.')
      return
    }

    addToast('Reporte enviado com sucesso!', 'success')
    router.replace('/inicio')
  }

  return (
    <AuthGuard>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="text-[#7C4A1E]" />
          <h1 className="font-poppins text-2xl font-bold text-[#7C4A1E]">
            Reportar
          </h1>
        </div>

        <p className="text-muted-foreground text-sm mb-5">
          Informe os dados do animal para que voluntários possam ajudar.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-bold mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Section title="Informações básicas" icon={FileText}>
            <div className="space-y-4">
              <div>
                <Label>Título do Reporte</Label>
                <Input
                  placeholder="Ex: Vira-lata ferido na calçada"
                  value={form.titulo}
                  onChange={e => setField('titulo', e.target.value)}
                />
              </div>

              <div>
                <Label>Localização</Label>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={getLocation}
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <MapPin size={16} className="mr-2" />
                  )}
                  {geoLoading ? 'Localizando...' : 'Localizar automaticamente'}
                </Button>

                {form.lat && form.lng && (
                  <p className="text-xs text-green-700 font-bold mt-2 flex items-center gap-1">
                    <Check size={14} />
                    Localização capturada: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                  </p>
                )}
              </div>

              {form.lat && form.lng && (
                <div>
                  <Label>Localização encontrada</Label>
                  <div className="bg-amber-50 border border-border rounded-xl p-3">
                    <div className="text-sm font-extrabold text-foreground mb-1">
                      {[form.endereco, form.numero].filter(Boolean).join(', ') ||
                        'Localização atual'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[form.bairro, form.cidade, form.estado, form.cep, form.pais]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {form.lat && form.lng && (
                <div>
                  <Label>Mapa</Label>
                  <iframe
                    title="Localização no mapa"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      form.lng - 0.005
                    }%2C${form.lat - 0.005}%2C${form.lng + 0.005}%2C${
                      form.lat + 0.005
                    }&layer=mapnik&marker=${form.lat}%2C${form.lng}`}
                    className="w-full h-[220px] border border-border rounded-xl"
                  />
                </div>
              )}

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o animal: cor, características, comportamento..."
                  value={form.descricao}
                  onChange={e => setField('descricao', e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Situação do animal" icon={PawPrint}>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Condição observada (pode marcar várias)</Label>
                <div className="flex flex-wrap gap-2">
                  {SITUACOES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSit(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-bold border-2',
                        form.situacao.includes(s)
                          ? 'bg-amber-50 border-amber-500'
                          : 'bg-white border-border'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Porte do animal *</Label>
                <div className="flex gap-2">
                  {PORTES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setField('porte', p)}
                      className={cn(
                        'flex-1 py-2 rounded-xl border-2',
                        form.porte === p
                          ? 'bg-amber-50 border-amber-500'
                          : 'bg-white border-border'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Nível de urgência</Label>
                <div className="space-y-2">
                  {URGENCIAS.map(u => {
                    const UIcon = u.icon
                    const selected = form.urgencia === u.id
                    return (
                      <div
                        key={u.id}
                        onClick={() => setField('urgencia', u.id)}
                        className={cn(
                          'flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 cursor-pointer',
                          selected ? 'bg-amber-50 border-amber-500' : 'bg-white border-border'
                        )}
                      >
                        <UIcon
                          size={20}
                          className={cn(
                            u.id === 'Estável' && 'text-green-600',
                            u.id === 'Atenção' && 'text-amber-500',
                            u.id === 'Urgente' && 'text-red-600'
                          )}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-extrabold text-foreground">{u.id}</div>
                          <div className="text-xs text-muted-foreground">{u.desc}</div>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                            selected ? 'bg-amber-500 border-amber-500' : 'bg-white border-border'
                          )}
                        >
                          {selected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Foto do animal" icon={Camera}>
            <label htmlFor="foto-input" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-8 text-center">
                {fotoPreview ? (
                  <img
                    src={fotoPreview}
                    alt="preview"
                    className="max-h-[180px] rounded-xl object-cover"
                  />
                ) : (
                  <>
                    <Camera size={28} className="text-muted-foreground mb-2" />
                    <div className="text-sm font-bold text-amber-700">Adicionar foto</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Fotos ajudam muito no resgate!
                    </div>
                  </>
                )}
              </div>
            </label>
            <input
              id="foto-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFoto}
            />
          </Section>

          <Button type="submit" className="w-full" disabled={loading || geoLoading}>
            {loading ? 'Enviando...' : 'Reportar animal'}
          </Button>
        </form>
      </div>
    </AuthGuard>
  )
}