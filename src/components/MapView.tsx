'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Clock,
  Radio,
  PawPrint,
  Plus
} from 'lucide-react'
import type { Ocorrencia } from '@/types'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const makeIcon = (color: string, size = 32) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3)"></div>`,
  iconSize: [size, size], iconAnchor: [size/2, size], popupAnchor: [0, -(size+4)],
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#185FA5;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [18,18], iconAnchor: [9,9],
})

const icons: Record<string, L.DivIcon> = {
  Urgente: makeIcon('#D94F3D', 36),
  'Atenção': makeIcon('#F5A623', 32),
  Estável: makeIcon('#3B8A5A', 28),
  resgatado: makeIcon('#3B8A5A', 24),
}

async function geocodeAddress(address: string) {
  try {
    const q = encodeURIComponent(`${address}, São Paulo, Brasil`)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`)
    const data = await res.json()
    if (data[0]) return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name as string
    }
  } catch {}
  return null
}

function FlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  const prev = useRef<string>('')

  useEffect(() => {
    if (!target) return
    const key = `${target.lat},${target.lng}`
    if (key === prev.current) return
    prev.current = key
    map.flyTo([target.lat, target.lng], 15, { duration: 1.2 })
  }, [target, map])

  return null
}

function AutoLocate({ onLocated }: { onLocated: (l: { lat: number; lng: number; accuracy: number }) => void }) {
  const map = useMap()

  useEffect(() => {
    map.locate({ maxZoom: 14 })
    map.on('locationfound', e =>
      onLocated({ lat: e.latlng.lat, lng: e.latlng.lng, accuracy: e.accuracy })
    )
  }, [map, onLocated])

  return null
}

const distKm = (a: {lat:number;lng:number}, b: {lat:number;lng:number}) => {
  const R=6371
  const dLat=(b.lat-a.lat)*Math.PI/180
  const dLng=(b.lng-a.lng)*Math.PI/180
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))
}

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
  if (m<60) return `${m}min`
  if (m<1440) return `${Math.floor(m/60)}h`
  return `${Math.floor(m/1440)}d`
}

interface Props {
  ocorrencias: Ocorrencia[]
  filter: string
  setFilter: (f: string) => void
}

export default function MapView({ ocorrencias, filter, setFilter }: Props) {
  const [userLoc, setUserLoc] = useState<{lat:number;lng:number;accuracy:number}|null>(null)
  const [flyTarget, setFlyTarget] = useState<{lat:number;lng:number}|null>(null)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchPin, setSearchPin] = useState<{lat:number;lng:number;display:string}|null>(null)
  const [raio, setRaio] = useState(0)
  const router = useRouter()

  const handleLocated = useCallback((loc: {lat:number;lng:number;accuracy:number}) => {
    setUserLoc(loc)
    setFlyTarget(loc)
  }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    const r = await geocodeAddress(search)
    setSearching(false)
    if (r) {
      setSearchPin(r)
      setFlyTarget({ lat: r.lat, lng: r.lng })
    } else {
      alert('Endereço não encontrado.')
    }
  }

  const filtered = raio > 0 && userLoc
    ? ocorrencias.filter(oc => oc.lat && oc.lng && distKm(userLoc, {lat:oc.lat,lng:oc.lng}) <= raio)
    : ocorrencias

  const FILTERS = [
    ['todos','Todos'],
    ['urgente','Urgentes'],
    ['ativo','Ativos'],
    ['resgatado','Resgatados']
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen relative">
      <div className="bg-white border-b border-border p-3 space-y-2 z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Buscar endereço..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSearch()}
            />
          </div>

          <button
            className="px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold shrink-0 disabled:opacity-50"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? '...' : 'Buscar'}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTERS.map(([f,l]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-extrabold border-2 shrink-0 transition-colors ${
                filter===f
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-border text-muted-foreground'
              }`}
            >
              {l}
            </button>
          ))}

          {userLoc && (
            <select
              value={raio}
              onChange={e => setRaio(Number(e.target.value))}
              className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 shrink-0 ${
                raio>0
                  ? 'bg-amber-50 border-amber-500 text-amber-800'
                  : 'bg-white border-border text-muted-foreground'
              }`}
            >
              <option value={0}>Raio</option>
              {[1,2,5,10].map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[-23.5505,-46.6333]} zoom={13} style={{height:'100%',width:'100%'}} zoomControl={false}>
          <ZoomControl position="bottomright" />
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <AutoLocate onLocated={handleLocated} />
          {flyTarget && <FlyTo target={flyTarget} />}

          {userLoc && (
            <>
              <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                <Popup>Você está aqui</Popup>
              </Marker>

              {raio > 0 && (
                <Circle
                  center={[userLoc.lat, userLoc.lng]}
                  radius={raio*1000}
                  pathOptions={{color:'#F5A623',fillOpacity:0.07}}
                />
              )}
            </>
          )}

          {filtered.map(oc => oc.lat && oc.lng && (
            <Marker
              key={oc.id}
              position={[oc.lat, oc.lng]}
              icon={icons[oc.status==='resgatado'?'resgatado':oc.urgencia] || icons['Atenção']}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-1">{oc.titulo}</div>
                  <div className="flex items-center gap-1 text-xs mb-1">
                    <MapPin size={12} /> {oc.endereco}
                  </div>
                  <div className="flex items-center gap-1 text-xs mb-2">
                    <Clock size={12} /> {timeAgo(oc.created_at)}
                  </div>
                  <button
                    onClick={()=>router.push(`/ocorrencia/${oc.id}`)}
                    className="w-full bg-amber-500 text-white rounded-md py-1 text-xs font-bold"
                  >
                    Ver detalhes
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute bottom-12 left-3 z-[1000] bg-white rounded-xl p-3 shadow border border-border space-y-1.5 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D94F3D]" />
            <span>Urgente</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
            <span>Atenção</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3B8A5A]" />
            <span>Estável</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#185FA5]" />
            <span>Sua localização</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 z-[1000] bg-white rounded-full px-3 py-1.5 text-xs font-extrabold text-[#7C4A1E] shadow border border-border flex items-center gap-1">
          <PawPrint size={12} />
          {filtered.length}
        </div>

        <button
          onClick={() => router.push('/reportar')}
          className="absolute bottom-14 right-3 z-[1000] w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors"
        >
          <Plus />
        </button>
      </div>
    </div>
  )
}