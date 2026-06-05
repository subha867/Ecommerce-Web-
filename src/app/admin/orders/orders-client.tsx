'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Search, ShoppingBag } from 'lucide-react'

type OrderWithRelations = Order & {
  order_items?: { product_name: string; quantity: number; unit_price: number }[]
  profiles?: { full_name: string; email: string } | null
}

const statusColor: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300',
  confirmed: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300',
  processing: 'text-orange-600 bg-orange-100 dark:bg-orange-950 dark:text-orange-300',
  shipped: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300',
  delivered: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-300',
  refunded: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300',
}

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export function AdminOrdersClient({ initialOrders }: { initialOrders: OrderWithRelations[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const updateStatus = async (orderId: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) toast.error(error.message)
    else {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      toast.success('Order status updated')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total orders</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order # or customer..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {orderStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.order_items?.length ?? 0} items</p>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <p className="font-medium">{order.profiles?.full_name ?? 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                  </td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{formatDate(order.created_at)}</td>
                  <td className="p-3 font-semibold">{formatPrice(order.total)}</td>
                  <td className="p-3">
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v ?? order.status)}>
                      <SelectTrigger className={`h-7 text-xs w-32 border-0 ${statusColor[order.status] ?? ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
