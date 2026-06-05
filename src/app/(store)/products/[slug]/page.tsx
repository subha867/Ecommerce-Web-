import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetail } from './product-detail'
import type { Metadata } from 'next'
import type { Product, ReviewWithProfile } from '@/types/database'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, short_description')
    .eq('slug', slug)
    .maybeSingle() as { data: Pick<Product, 'name' | 'short_description'> | null }
  if (!product) return {}
  return {
    title: product.name,
    description: product.short_description ?? undefined,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle() as { data: (Product & { categories: { name: string; slug: string } | null }) | null }

  if (!product) notFound()

  const { data: productReviews } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20) as { data: ReviewWithProfile[] | null }

  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('category_id', product.category_id ?? '')
    .neq('id', product.id)
    .limit(4) as { data: Product[] | null }

  return (
    <ProductDetail
      product={product}
      reviews={productReviews ?? []}
      related={related ?? []}
    />
  )
}
