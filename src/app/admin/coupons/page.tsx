import { createClient } from '@/lib/supabase/server'
import { AdminCouponsClient } from './coupons-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Coupons' }

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: coupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  return <AdminCouponsClient initialCoupons={coupons ?? []} />
}
