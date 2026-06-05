import { createClient } from '@/lib/supabase/server'
import { HeroSection } from '@/components/home/hero-section'
import { CategorySection } from '@/components/home/category-section'
import { FeaturedProducts } from '@/components/home/featured-products'
import { NewArrivals } from '@/components/home/new-arrivals'
import { TrendingProducts } from '@/components/home/trending-products'
import { PromoSection } from '@/components/home/promo-section'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LuxeShop - Premium Shopping Experience',
  description: 'Discover premium products with fast shipping and easy returns.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: banners },
    { data: categories },
    { data: featured },
    { data: newArrivals },
    { data: trending },
  ] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).eq('position', 'hero').order('sort_order'),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(6),
    supabase.from('products').select('*').eq('status', 'active').eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').eq('status', 'active').eq('is_new_arrival', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('products').select('*').eq('status', 'active').eq('is_trending', true).order('avg_rating', { ascending: false }).limit(8),
  ])

  return (
    <>
      <HeroSection banners={banners ?? []} />
      <CategorySection categories={categories ?? []} />
      <FeaturedProducts products={featured ?? []} />
      <PromoSection />
      <NewArrivals products={newArrivals ?? []} />
      <TrendingProducts products={trending ?? []} />
    </>
  )
}
