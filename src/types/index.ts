export type Role = 'reporter' | 'volunteer' | 'ong' | 'vet'
export type Urgencia = 'Estável' | 'Atenção' | 'Urgente'
export type OcorrenciaStatus = 'ativo' | 'em_resgate' | 'resgatado' | 'arquivado'
export type ResgateStatus = 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'
export type ResgateType = 'resgate' | 'lar_temp' | 'veterinario'
export type MsgType = 'texto' | 'sistema' | 'foto'

export interface Profile {
  id: string
  nome: string
  telefone?: string
  role: Role
  avatar_url?: string
  bairro?: string
  reputacao: number
  created_at: string
}

export interface Ocorrencia {
  id: string
  user_id?: string
  titulo: string
  descricao?: string
  endereco: string
  bairro?: string
  lat?: number
  lng?: number
  situacao: string[]
  porte?: 'Pequeno' | 'Médio' | 'Grande'
  urgencia: Urgencia
  status: OcorrenciaStatus
  foto_url?: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Resgate {
  id: string
  ocorrencia_id: string
  voluntario_id?: string
  tipo: ResgateType
  status: ResgateStatus
  observacao?: string
  created_at: string
  profiles?: Profile
  ocorrencias?: Ocorrencia
}

export interface Mensagem {
  id: string
  ocorrencia_id: string
  user_id?: string
  texto: string
  tipo: MsgType
  created_at: string
  profiles?: Profile
}
