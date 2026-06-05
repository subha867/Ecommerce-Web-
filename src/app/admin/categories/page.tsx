import { createClient } from '@/lib/supabase/server'
import { AdminCategoriesClient } from './categories-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Categories' }

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order')
  return <AdminCategoriesClient initialCategories={categories ?? []} />
}
