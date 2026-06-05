'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Banner } from '@/types/database'

interface HeroSectionProps {
  banners: Banner[]
}

const fallbackBanners = [
  {
    id: '1',
    title: 'Premium Collection 2024',
    subtitle: 'Discover curated products from the world\'s finest brands',
    image_url: 'https://images.pexels.com/photos/5632388/pexels-photo-5632388.jpeg',
    link_url: '/products',
    button_text: 'Shop Now',
  },
  {
    id: '2',
    title: 'New Electronics',
    subtitle: 'Cutting-edge technology at unbeatable prices',
    image_url: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg',
    link_url: '/products?category=electronics',
    button_text: 'Explore Tech',
  },
]

export function HeroSection({ banners }: HeroSectionProps) {
  const [current, setCurrent] = useState(0)
  const items = banners.length > 0 ? banners : fallbackBanners

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % items.length), 5000)
    return () => clearInterval(timer)
  }, [items.length])

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length)
  const next = () => setCurrent((c) => (c + 1) % items.length)

  return (
    <section className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      <AnimatePresence mode="wait">
        {items.map((banner, index) =>
          index === current ? (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="max-w-xl"
                  >
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                      {banner.title}
                    </h1>
                    {banner.subtitle && (
                      <p className="text-lg text-white/80 mb-8 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.link_url && (
                      <div className="flex gap-3">
                        <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 text-base px-8">
                          <Link href={banner.link_url}>
                            {banner.button_text ?? 'Shop Now'}
                          </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10 text-base">
                          <Link href="/products">View All</Link>
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {/* Navigation */}
      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-white w-6' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
