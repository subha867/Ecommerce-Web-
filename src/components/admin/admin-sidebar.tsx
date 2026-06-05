'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, Image, Ticket, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const navGroups: { label: string; items: { href: string; label: string; icon: React.ElementType; exact?: boolean }[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/banners', label: 'Banners', icon: Image },
      { href: '/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-card flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-xs">L</span>
          </div>
          <div>
            <p className="font-bold text-sm">LuxeShop</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">{group.label}</p>
            {group.items.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Store
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
