'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { ShoppingCart, Heart, Search, Menu, X, Sun, Moon, User, LogOut, Settings, Package, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SearchModal } from '@/components/search/search-modal'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/products?category=electronics', label: 'Electronics' },
  { href: '/products?category=fashion', label: 'Fashion' },
  { href: '/products?featured=true', label: 'Sale' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { toggleCart, totalItems } = useCartStore()
  const wishlistItems = useWishlistStore((s) => s.items)
  const { user, profile, signOut, isAdmin } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const cartCount = totalItems()

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileOpen
            ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-background font-bold text-sm">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight">LuxeShop</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:text-foreground hover:bg-accent ${
                  pathname === link.href
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </Button>

            <Link href="/account/wishlist">
              <Button variant="ghost" size="icon" className="relative" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleCart()}
              className="relative"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-foreground text-background text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name ?? 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/orders')}>
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                  Search products...
                </button>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === link.href
                        ? 'text-foreground bg-accent'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <Link href="/auth/login" className="mt-2">
                    <Button className="w-full" size="sm">Sign In</Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <CartDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
