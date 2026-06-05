'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Heart, MapPin, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/account', label: 'Profile', icon: User, exact: true },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/settings', label: 'Settings', icon: Settings },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="md:w-56 flex-shrink-0">
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback>{profile?.full_name?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="bg-card rounded-2xl border border-border overflow-hidden">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border last:border-0 ${
                active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>
    </aside>
  )
}
