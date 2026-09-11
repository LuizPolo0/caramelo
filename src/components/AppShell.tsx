'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Map,
  Megaphone,
  HandHeart,
  User,
  LayoutDashboard,
  LogOut,
  PawPrint,
  Plus
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',         icon: Home,      label: 'Início',   exact: true  },
  { href: '/mapa',     icon: Map,       label: 'Mapa'                   },
  { href: '/reportar', icon: Megaphone, label: 'Reportar'               },
  { href: '/resgates', icon: HandHeart, label: 'Resgates'               },
  { href: '/perfil',   icon: User,      label: 'Perfil'                 },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isOngOrVet = profile?.role === 'ong' || profile?.role === 'vet'
  const initials = profile?.nome?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || '?'

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border shrink-0">
        <div className="bg-amber-500 p-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7C4A1E] flex items-center justify-center">
              <PawPrint className="text-white" size={20} />
            </div>
            <div>
              <div className="font-poppins text-white text-lg font-bold leading-tight">
                Caramelo do Bem
              </div>
            </div>
          </Link>

          {profile && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-white font-extrabold text-sm">
                  {profile.nome}
                </div>
                <div className="text-amber-100 text-[11px] font-semibold">
                  {profile.role === 'reporter'
                    ? 'Reportador'
                    : profile.role === 'volunteer'
                    ? 'Voluntário'
                    : profile.role === 'ong'
                    ? 'ONG / Abrigo'
                    : 'Veterinário'}
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                isActive(href, exact)
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}

          {isOngOrVet && (
            <Link
              href="/painel"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                isActive('/painel')
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <LayoutDashboard size={18} />
              {profile?.role === 'ong' ? 'Painel ONG' : 'Painel Vet.'}
            </Link>
          )}

          <div className="flex-1" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="md:hidden bg-amber-500 px-4 py-3 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#7C4A1E] flex items-center justify-center">
              <PawPrint className="text-white" size={18} />
            </div>
            <div>
              <div className="font-poppins text-white text-base font-bold leading-tight">
                Caramelo do Bem
              </div>
            </div>
          </Link>

          <Link
            href="/reportar"
            className="bg-white text-amber-800 rounded-full px-3 py-1.5 text-xs font-extrabold flex items-center gap-1"
          >
            <Plus size={14} />
            Reportar
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border flex z-50">
        {navItems.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn('nav-item flex-1 py-2', isActive(href, exact) && 'active')}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}