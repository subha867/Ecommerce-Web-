import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { AdminOrdersClient } from './orders-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Orders' }

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(product_name, quantity, unit_price), profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return <AdminOrdersClient initialOrders={orders ?? []} />
}
