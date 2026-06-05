'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/store/cart'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase/client'
import type { Coupon, Order } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Loader2, CheckCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const checkoutSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postal_code: z.string().min(4),
  country: z.string().min(2),
  coupon_code: z.string().optional(),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [orderId, setOrderId] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [discount, setDiscount] = useState(0)
  const [couponValid, setCouponValid] = useState<string | null>(null)

  const sub = subtotal()
  const shipping = sub >= 75 ? 0 : 9.99
  const tax = (sub - discount) * 0.08
  const total = sub - discount + shipping + tax

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      email: user?.email ?? '',
      country: 'US',
    },
  })

  const couponCode = watch('coupon_code')

  const applyCoupon = async () => {
    if (!couponCode) return
    const supabase = createClient()
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .maybeSingle() as { data: Coupon | null }
    if (!data) { toast.error('Invalid coupon code'); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('Coupon expired'); return }
    if (data.usage_limit && data.used_count >= data.usage_limit) { toast.error('Coupon usage limit reached'); return }
    if (data.min_order_amount && sub < data.min_order_amount) { toast.error(`Minimum order of ${formatPrice(data.min_order_amount)} required`); return }
    const discountAmt = data.type === 'percentage'
      ? (sub * data.value) / 100
      : Math.min(data.value, sub)
    const finalDiscount = data.max_discount_amount ? Math.min(discountAmt, data.max_discount_amount) : discountAmt
    setDiscount(finalDiscount)
    setCouponValid(data.code)
    toast.success(`Coupon applied: -${formatPrice(finalDiscount)}`)
  }

  const onSubmit = async (values: CheckoutValues) => {
    if (!user) { router.push('/auth/login?next=/checkout'); return }
    if (items.length === 0) { toast.error('Your cart is empty'); return }
    setIsLoading(true)
    const supabase = createClient()

    const shippingAddress = {
      full_name: values.full_name,
      phone: values.phone ?? '',
      address_line1: values.address_line1,
      address_line2: values.address_line2 ?? '',
      city: values.city,
      state: values.state,
      postal_code: values.postal_code,
      country: values.country,
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        subtotal: sub,
        discount_amount: discount,
        shipping_amount: shipping,
        tax_amount: tax,
        total,
        coupon_code: couponValid,
        payment_method: 'card',
        payment_status: 'paid' as 'paid',
        status: 'confirmed' as 'confirmed',
        shipping_address: shippingAddress,
      })
      .select()
      .single() as { data: Order | null; error: Error | null }

    if (error || !order) {
      toast.error('Failed to place order. Please try again.')
      setIsLoading(false)
      return
    }

    await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images[0] ?? null,
        sku: item.product.sku ?? null,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))
    )

    if (couponValid) {
      // Fire-and-forget coupon usage increment
      await supabase.from('coupons').update({ used_count: (await supabase.from('coupons').select('used_count').eq('code', couponValid).maybeSingle())?.data?.used_count ?? 1 }).eq('code', couponValid)
    }

    clearCart()
    setOrderId(order.id)
    setOrderNumber(order.order_number)
    setStep('success')
    setIsLoading(false)
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <Link href="/products" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-1">Thank you for your purchase.</p>
          <p className="text-sm text-muted-foreground mb-6">Order: <span className="font-medium text-foreground">{orderNumber}</span></p>
          <div className="flex gap-3 justify-center">
            <Link href={`/account/orders`} className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90">Track Order</Link>
            <Link href="/products" className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-semibold mb-4">Shipping Address</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Full Name</Label>
                    <Input {...register('full_name')} placeholder="John Doe" />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input {...register('email')} type="email" placeholder="you@example.com" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone (optional)</Label>
                    <Input {...register('phone')} placeholder="+1 555 000 0000" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Address Line 1</Label>
                    <Input {...register('address_line1')} placeholder="123 Main Street" />
                    {errors.address_line1 && <p className="text-xs text-destructive">{errors.address_line1.message}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Address Line 2 (optional)</Label>
                    <Input {...register('address_line2')} placeholder="Apt, Suite, etc." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input {...register('city')} placeholder="New York" />
                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>State</Label>
                    <Input {...register('state')} placeholder="NY" />
                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postal Code</Label>
                    <Input {...register('postal_code')} placeholder="10001" />
                    {errors.postal_code && <p className="text-xs text-destructive">{errors.postal_code.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input {...register('country')} placeholder="US" />
                    {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="font-semibold mb-4">Payment</h2>
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground text-center">
                  <p className="font-medium text-foreground mb-1">Demo Mode</p>
                  <p>Payment processing is simulated. No real charges will be made.</p>
                </div>
              </div>

              {!user && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Sign in to save your order</p>
                  <p className="text-amber-700 dark:text-amber-300">
                    <Link href="/auth/login?next=/checkout" className="underline">Sign in</Link> or continue as guest
                  </p>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Place Order — {formatPrice(total)}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <ul className="space-y-3 mb-6">
                {items.map((item) => (
                  <li key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product.images[0] && (
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="56px" />
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <Input {...register('coupon_code')} placeholder="Coupon code" className="h-9 text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>Apply</Button>
              </div>
              {couponValid && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-emerald-600">{couponValid} applied</Badge>
                </div>
              )}

              <Separator className="mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(sub)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
