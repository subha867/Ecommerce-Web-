'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Category } from '@/types/database'
import { ArrowRight } from 'lucide-react'

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps) {
  if (categories.length === 0) return null

  return (
    <section className="py-16 container mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <p className="text-muted-foreground mt-1">Find what you&apos;re looking for</p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          All categories
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/products?category=${cat.slug}`}
              className="group block rounded-2xl overflow-hidden relative aspect-square bg-muted hover:shadow-lg transition-all duration-300"
            >
              {cat.image_url && (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <p className="text-white text-sm font-semibold">{cat.name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
