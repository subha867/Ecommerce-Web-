import { createClient } from '@/lib/supabase/server'
import { AdminProductsClient } from './products-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Products' }

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  return <AdminProductsClient initialProducts={products ?? []} categories={categories ?? []} />
}
