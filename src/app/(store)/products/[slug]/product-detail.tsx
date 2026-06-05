'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, Heart, ShoppingCart, Minus, Plus, Truck, RefreshCw, Shield, ChevronRight, User } from 'lucide-react'
import type { Product, ReviewWithProfile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProductCard } from '@/components/products/product-card'
import { formatPrice, formatDate, getDiscountPercentage } from '@/lib/utils/format'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ReviewForm } from './review-form'

interface ProductDetailProps {
  product: Product & { categories?: { name: string; slug: string } | null }
  reviews: ReviewWithProfile[]
  related: Product[]
}

export function ProductDetail({ product, reviews, related }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addItem, openCart } = useCartStore()
  const { toggleItem, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)
  const discount = getDiscountPercentage(product.price, product.compare_price ?? 0)

  const handleAddToCart = () => {
    addItem(product, quantity)
    toast.success(`${product.name} added to cart`, {
      action: { label: 'View Cart', onClick: openCart },
    })
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-foreground transition-colors">Shop</Link>
        {product.categories && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/products?category=${product.categories.slug}`} className="hover:text-foreground transition-colors">
              {product.categories.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-32">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.images[selectedImage] && (
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </motion.div>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="absolute top-4 left-4 text-sm">
                -{discount}%
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all',
                    selectedImage === i ? 'border-foreground' : 'border-transparent hover:border-border'
                  )}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.categories && (
            <Link href={`/products?category=${product.categories.slug}`}>
              <Badge variant="secondary" className="mb-3">{product.categories.name}</Badge>
            </Link>
          )}
          <h1 className="text-3xl font-bold mb-3">{product.name}</h1>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('h-4 w-4', i < Math.floor(product.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                ))}
              </div>
              <span className="text-sm font-medium">{product.avg_rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.review_count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
                <Badge variant="destructive">Save {formatPrice(product.compare_price - product.price)}</Badge>
              </>
            )}
          </div>

          {product.short_description && (
            <p className="text-muted-foreground mb-6 leading-relaxed">{product.short_description}</p>
          )}

          {/* Stock */}
          <div className="mb-6">
            {product.stock_quantity === 0 ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : product.stock_quantity <= product.low_stock_threshold ? (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                Only {product.stock_quantity} left
              </Badge>
            ) : (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500">In Stock</Badge>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-base font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => { toggleItem(product); toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist') }}
              >
                <Heart className={cn('h-5 w-5', wishlisted && 'fill-current text-destructive')} />
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
              { icon: RefreshCw, title: 'Free Returns', desc: '30-day window' },
              { icon: Shield, title: 'Secure', desc: '100% protected' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mb-16">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">{product.description ?? product.short_description ?? 'No description available.'}</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Rating summary */}
            <div className="lg:col-span-1">
              <div className="bg-muted/50 rounded-2xl p-6 text-center mb-6">
                <p className="text-5xl font-bold">{product.avg_rating.toFixed(1)}</p>
                <div className="flex justify-center my-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('h-5 w-5', i < Math.floor(product.avg_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{product.review_count} reviews</p>
              </div>
              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-right">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-2 space-y-6">
              <ReviewForm productId={product.id} />
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{review.profiles?.full_name ?? 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                      <div className="flex my-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
                        ))}
                      </div>
                      {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                      {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                      {review.is_verified_purchase && (
                        <Badge variant="outline" className="text-xs mt-2 text-emerald-500 border-emerald-500">Verified Purchase</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
