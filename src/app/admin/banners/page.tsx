import { createClient } from '@/lib/supabase/server'
import { AdminBannersClient } from './banners-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Banners' }

export default async function AdminBannersPage() {
  const supabase = await createClient()
  const { data: banners } = await supabase.from('banners').select('*').order('sort_order')
  return <AdminBannersClient initialBanners={banners ?? []} />
}
