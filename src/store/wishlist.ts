import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/database'

interface WishlistStore {
  items: string[]
  isLoaded: boolean
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleItem: (product: Product) => void
  isWishlisted: (productId: string) => boolean
  syncWithServer: (userId: string) => Promise<void>
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoaded: false,

      addItem: (productId) => {
        set((state) => ({ items: [...new Set([...state.items, productId])] }))
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((id) => id !== productId) }))
      },

      toggleItem: async (product) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const isInWishlist = get().isWishlisted(product.id)

        if (user) {
          if (isInWishlist) {
            await supabase.from('wishlist').delete().eq('product_id', product.id)
            get().removeItem(product.id)
          } else {
            await supabase.from('wishlist').insert({ product_id: product.id })
            get().addItem(product.id)
          }
        } else {
          if (isInWishlist) get().removeItem(product.id)
          else get().addItem(product.id)
        }
      },

      isWishlisted: (productId) => get().items.includes(productId),

      syncWithServer: async (userId) => {
        if (!userId) return
        const supabase = createClient()
        const { data } = await supabase.from('wishlist').select('product_id')
        if (data) {
          set({ items: data.map((w: { product_id: string }) => w.product_id), isLoaded: true })
        }
      },
    }),
    { name: 'luxeshop-wishlist' }
  )
)
