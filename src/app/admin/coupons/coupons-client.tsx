'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Coupon } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Ticket, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils/format'

const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0.01),
  min_order_amount: z.number().min(0).optional(),
  usage_limit: z.number().min(1).optional(),
  is_active: z.boolean(),
  expires_at: z.string().optional(),
})
type CouponValues = z.infer<typeof couponSchema>

export function AdminCouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data ?? [])
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CouponValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'percentage', is_active: true },
  })

  const onSubmit = async (values: CouponValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('coupons').insert({
      ...values,
      expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
    })
    if (error) toast.error(error.message)
    else { toast.success('Coupon created!'); setIsOpen(false); reset(); refresh() }
    setIsLoading(false)
  }

  const deleteCoupon = async (id: string) => {
    const supabase = createClient()
    await supabase.from('coupons').delete().eq('id', id)
    toast.success('Coupon deleted')
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setIsOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Create Coupon</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <p className="font-mono font-bold">{coupon.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coupon.is_active ? 'default' : 'secondary'}>{coupon.is_active ? 'Active' : 'Inactive'}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCoupon(coupon.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-lg font-bold text-emerald-600">
              {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${formatPrice(coupon.value)} OFF`}
            </p>
            {coupon.description && <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>}
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {coupon.min_order_amount && coupon.min_order_amount > 0 && (
                <p>Min order: {formatPrice(coupon.min_order_amount)}</p>
              )}
              {coupon.usage_limit && <p>Used: {coupon.used_count}/{coupon.usage_limit}</p>}
              {coupon.expires_at && <p>Expires: {formatDate(coupon.expires_at)}</p>}
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Ticket className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>No coupons yet</p>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Coupon Code *</Label>
              <Input {...register('code')} placeholder="SUMMER25" className="font-mono uppercase" />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select defaultValue="percentage" onValueChange={(v) => setValue('type', v as 'percentage' | 'fixed')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value *</Label>
                <Input {...register('value')} type="number" step="0.01" placeholder="10" />
                {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Order Amount</Label>
                <Input {...register('min_order_amount')} type="number" step="0.01" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input {...register('usage_limit')} type="number" placeholder="Unlimited" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input {...register('expires_at')} type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...register('description')} placeholder="Brief description" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Coupon
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
