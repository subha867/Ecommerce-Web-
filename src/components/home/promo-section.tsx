'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Truck, RefreshCw, Shield, Headphones } from 'lucide-react'

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $75' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
  { icon: Shield, title: 'Secure Payment', desc: '100% secure transactions' },
  { icon: Headphones, title: '24/7 Support', desc: 'Round-the-clock help' },
]

export function PromoSection() {
  return (
    <>
      {/* Features bar */}
      <section className="py-10 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-foreground text-background rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="py-16 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-foreground text-background p-10 md:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium mb-2 opacity-70 uppercase tracking-widest">Limited Time</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Summer Sale — Up to 40% Off</h2>
            <p className="text-lg opacity-70 mb-8 max-w-md mx-auto">
              Shop the season&apos;s biggest sale. New deals added every day.
            </p>
            <Link
              href="/products?featured=true"
              className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Shop the Sale
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
