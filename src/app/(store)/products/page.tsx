import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Browse our full collection of premium products.',
}

interface SearchParams {
  q?: string
  category?: string
  featured?: string
  new?: string
  trending?: string
  min_price?: string
  max_price?: string
  sort?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductsClient
        initialFilters={params}
        categories={categories ?? []}
      />
    </div>
  )
}
