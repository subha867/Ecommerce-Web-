export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          full_name: string
          phone: string | null
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          label?: string
          full_name: string
          phone?: string | null
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          is_default?: boolean
        }
        Update: {
          label?: string
          full_name?: string
          phone?: string | null
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          is_default?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          price: number
          compare_price: number | null
          cost_price: number | null
          sku: string | null
          barcode: string | null
          category_id: string | null
          stock_quantity: number
          low_stock_threshold: number
          weight: number | null
          images: string[]
          tags: string[]
          is_featured: boolean
          is_new_arrival: boolean
          is_trending: boolean
          status: 'active' | 'draft' | 'archived'
          avg_rating: number
          review_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          price: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          stock_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          images?: string[]
          tags?: string[]
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          status?: 'active' | 'draft' | 'archived'
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          price?: number
          compare_price?: number | null
          cost_price?: number | null
          sku?: string | null
          barcode?: string | null
          category_id?: string | null
          stock_quantity?: number
          low_stock_threshold?: number
          weight?: number | null
          images?: string[]
          tags?: string[]
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          status?: 'active' | 'draft' | 'archived'
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount: number
          shipping_amount: number
          tax_amount: number
          total: number
          coupon_code: string | null
          payment_method: string | null
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_reference: string | null
          shipping_address: Json
          billing_address: Json | null
          notes: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          subtotal: number
          discount_amount?: number
          shipping_amount?: number
          tax_amount?: number
          total: number
          coupon_code?: string | null
          payment_method?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_reference?: string | null
          shipping_address: Json
          billing_address?: Json | null
          notes?: string | null
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
          payment_reference?: string | null
          notes?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_image: string | null
          sku: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_image?: string | null
          sku?: string | null
          quantity: number
          unit_price: number
          total_price: number
        }
        Update: Record<string, never>
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          product_id: string
        }
        Update: Record<string, never>
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          title: string | null
          body: string | null
          is_verified_purchase: boolean
          is_approved: boolean
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string
          rating: number
          title?: string | null
          body?: string | null
          is_verified_purchase?: boolean
          is_approved?: boolean
        }
        Update: {
          rating?: number
          title?: string | null
          body?: string | null
          is_approved?: boolean
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number | null
          max_discount_amount: number | null
          usage_limit: number | null
          used_count: number
          is_active: boolean
          starts_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          type?: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number | null
          max_discount_amount?: number | null
          usage_limit?: number | null
          used_count?: number
          is_active?: boolean
          starts_at?: string | null
          expires_at?: string | null
        }
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          link_url: string | null
          button_text: string | null
          position: 'hero' | 'top' | 'middle' | 'bottom'
          sort_order: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          link_url?: string | null
          button_text?: string | null
          position?: 'hero' | 'top' | 'middle' | 'bottom'
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
        Update: {
          title?: string
          subtitle?: string | null
          image_url?: string
          link_url?: string | null
          button_text?: string | null
          position?: 'hero' | 'top' | 'middle' | 'bottom'
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
        }
        Update: {
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type WishlistItem = Database['public']['Tables']['wishlist']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Banner = Database['public']['Tables']['banners']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']

export interface CartItem {
  id: string
  product: Product
  quantity: number
}

export interface ProductWithCategory extends Product {
  categories?: Category
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { products?: Product })[]
}

export interface ReviewWithProfile extends Review {
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>
}
