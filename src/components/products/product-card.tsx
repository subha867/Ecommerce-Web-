'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'
import type { Product } from '@/types/database'
import { formatPrice, getDiscountPercentage } from '@/lib/utils/format'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const { addItem, openCart } = useCartStore()
  const { toggleItem, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)
  const discount = getDiscountPercentage(product.price, product.compare_price ?? 0)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    toast.success(`${product.name} added to cart`, {
      action: { label: 'View Cart', onClick: openCart },
    })
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem(product)
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-border/80 hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className={cn('relative overflow-hidden bg-muted', variant === 'compact' ? 'aspect-square' : 'aspect-[4/3]')}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discount > 0 && (
              <Badge variant="destructive" className="text-xs">-{discount}%</Badge>
            )}
            {product.is_new_arrival && (
              <Badge className="text-xs bg-emerald-500 hover:bg-emerald-500">New</Badge>
            )}
            {product.is_trending && (
              <Badge className="text-xs bg-orange-500 hover:bg-orange-500">Trending</Badge>
            )}
            {product.stock_quantity === 0 && (
              <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlist}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors',
                wishlisted
                  ? 'bg-destructive text-white'
                  : 'bg-background/90 hover:bg-background text-foreground'
              )}
              aria-label="Wishlist"
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </button>
            <Link
              href={`/products/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 bg-background/90 hover:bg-background rounded-full flex items-center justify-center shadow-md transition-colors"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </Link>
          </div>

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="w-full h-9 text-sm gap-2 shadow-md"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            {product.tags?.[0] || 'Product'}
          </p>
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-foreground transition-colors mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < Math.floor(product.avg_rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">({product.review_count})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
