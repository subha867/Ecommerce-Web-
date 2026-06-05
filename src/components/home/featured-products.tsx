'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/products/product-card'
import type { Product } from '@/types/database'
import { motion } from 'framer-motion'

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Hand-picked favorites for you</p>
          </div>
          <Link
            href="/products?featured=true"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            View all
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
