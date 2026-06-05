'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import { useRouter } from 'next/navigation'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`)
      .limit(8)
    setResults(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // open handled by parent
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query)}`)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-b border-border">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button type="button" onClick={onClose}>
                  <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
                </button>
              </form>

              {results.length > 0 && (
                <ul className="py-2 max-h-96 overflow-y-auto">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                  {query && (
                    <li>
                      <Link
                        href={`/products?q=${encodeURIComponent(query)}`}
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-t border-border"
                      >
                        <Search className="h-4 w-4" />
                        See all results for &ldquo;{query}&rdquo;
                      </Link>
                    </li>
                  )}
                </ul>
              )}

              {query && !isLoading && results.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No products found for &ldquo;{query}&rdquo;
                </div>
              )}

              {!query && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Type to search products...
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
