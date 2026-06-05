'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWishlistStore } from '@/store/wishlist'
import type { Product } from '@/types/database'
import { ProductCard } from '@/components/products/product-card'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function WishlistPage() {
  const { items } = useWishlistStore()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) { setIsLoading(false); return }
      const supabase = createClient()
      const { data } = await supabase.from('products').select('*').in('id', items)
      setProducts(data ?? [])
      setIsLoading(false)
    }
    fetchProducts()
  }, [items])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      {!isLoading && products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-4">Save products you love to find them later</p>
          <Link href="/products" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
