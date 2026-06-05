import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import type { Order, OrderItem } from '@/types/database'

type OrderWithItems = Order & { order_items: Pick<OrderItem, 'product_name' | 'quantity'>[] }

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  processing: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(product_name, product_image, quantity, unit_price)')
    .order('created_at', { ascending: false }) as { data: OrderWithItems[] | null }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
          <Link href="/products" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border">
                <div>
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {order.order_items?.map((item, i) => (
                    <span key={i}>{item.product_name} ×{item.quantity}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
