'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils/format'

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, clearCart } = useCartStore()
  const sub = subtotal()
  const shipping = sub >= 75 ? 0 : 9.99
  const total = sub + shipping

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Cart</h2>
                {items.length > 0 && (
                  <span className="bg-foreground text-background text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground text-xs">
                    Clear all
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeCart}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Add items to get started</p>
                  </div>
                  <Button onClick={closeCart} asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <ul className="p-4 space-y-4">
                  {items.map((item) => (
                    <motion.li
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-3"
                    >
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.product.images[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-medium text-sm line-clamp-2 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm font-semibold mt-1">{formatPrice(item.product.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-border rounded-md">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock_quantity}
                              className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-4">
                {sub < 75 && (
                  <div className="bg-muted rounded-lg p-3 text-sm text-center">
                    Add{' '}
                    <span className="font-semibold">{formatPrice(75 - sub)}</span>
                    {' '}more for free shipping
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(sub)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Button className="w-full" size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={closeCart} asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
