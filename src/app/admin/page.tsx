import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import { Package, ShoppingBag, Users, TrendingUp, ArrowUpRight, DollarSign } from 'lucide-react'
import { AdminCharts } from './admin-charts'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { data: recentOrders },
    { data: orders },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('*, order_items(product_name, quantity)').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('total, created_at').eq('payment_status', 'paid'),
  ])

  const totalRevenue = orders?.reduce((sum: number, o: { total: number }) => sum + o.total, 0) ?? 0

  const stats = [
    { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, change: '+12%' },
    { label: 'Total Orders', value: orderCount ?? 0, icon: ShoppingBag, change: '+8%' },
    { label: 'Active Products', value: productCount ?? 0, icon: Package, change: '+3%' },
    { label: 'Total Users', value: userCount ?? 0, icon: Users, change: '+15%' },
  ]

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300',
    confirmed: 'text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-300',
    delivered: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled: 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-300',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">{change} this month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2">
          <AdminCharts orders={orders ?? []} />
        </div>

        {/* Recent orders */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              View all <TrendingUp className="h-3 w-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders?.map((order: { id: string; order_number: string; order_items: unknown; total: number; status: string }) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {Array.isArray(order.order_items) ? order.order_items.length : 0} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor[order.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
