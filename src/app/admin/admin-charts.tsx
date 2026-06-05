'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, startOfDay, subDays } from 'date-fns'

interface Order { total: number; created_at: string }

export function AdminCharts({ orders }: { orders: Order[] }) {
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i)
      const key = format(date, 'MMM d')
      const revenue = orders
        .filter((o) => format(new Date(o.created_at), 'MMM d') === key)
        .reduce((sum, o) => sum + o.total, 0)
      return { date: key, revenue }
    })
    return days
  }, [orders])

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h2 className="font-semibold mb-4">Revenue (Last 14 days)</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Revenue']}
          />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
