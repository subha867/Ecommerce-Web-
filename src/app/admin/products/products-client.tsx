'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Search, Loader2, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'
import Image from 'next/image'
import { slugify } from '@/lib/utils/format'

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.number().min(0),
  compare_price: z.number().optional(),
  sku: z.string().optional(),
  stock_quantity: z.number().min(0),
  category_id: z.string().optional(),
  images: z.string().optional(),
  tags: z.string().optional(),
  is_featured: z.boolean(),
  is_new_arrival: z.boolean(),
  is_trending: z.boolean(),
  status: z.enum(['active', 'draft', 'archived']),
})

type ProductFormValues = z.infer<typeof productSchema>

interface AdminProductsClientProps {
  initialProducts: (Product & { categories?: { name: string } | null })[]
  categories: Category[]
}

export function AdminProductsClient({ initialProducts, categories }: AdminProductsClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const refreshProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
    setProducts(data ?? [])
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'active',
      stock_quantity: 0,
      is_featured: false,
      is_new_arrival: false,
      is_trending: false,
      tags: '',
      images: '',
    },
  })

  const openCreate = () => {
    setEditing(null)
    reset({
      status: 'active',
      stock_quantity: 0,
      is_featured: false,
      is_new_arrival: false,
      is_trending: false,
      tags: '',
      images: '',
    })
    setIsOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    reset({
      name: product.name,
      description: product.description ?? '',
      short_description: product.short_description ?? '',
      price: product.price,
      compare_price: product.compare_price ?? undefined,
      sku: product.sku ?? '',
      stock_quantity: product.stock_quantity,
      category_id: product.category_id ?? '',
      images: product.images.join('\n'),
      tags: product.tags.join(', '),
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_trending: product.is_trending,
      status: product.status,
    })
    setIsOpen(true)
  }

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const payload = {
      ...values,
      images: values.images ? values.images.split('\n').filter(Boolean) : [],
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      slug: editing?.slug ?? slugify(values.name) + '-' + Date.now(),
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) toast.error(error.message)
      else { toast.success('Product updated!'); setIsOpen(false); refreshProducts() }
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) toast.error(error.message)
      else { toast.success('Product created!'); setIsOpen(false); refreshProducts() }
    }
    setIsLoading(false)
  }

  const deleteProduct = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Product archived'); setDeleteId(null); refreshProducts() }
  }

  const statusColors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300',
    draft: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300',
    archived: 'text-muted-foreground bg-muted',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} total products</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="h-5 w-5 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-48">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku ?? 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">
                    {(product as Product & { categories?: { name: string } | null }).categories?.name ?? '—'}
                  </td>
                  <td className="p-3 font-medium">{formatPrice(product.price)}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={product.stock_quantity === 0 ? 'text-destructive' : product.stock_quantity <= 5 ? 'text-orange-500' : 'text-muted-foreground'}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[product.status]}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product form dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Product Name *</Label>
                <Input {...register('name')} placeholder="Product name" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Price *</Label>
                <Input {...register('price')} type="number" step="0.01" placeholder="0.00" />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Compare Price</Label>
                <Input {...register('compare_price')} type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input {...register('sku')} placeholder="SKU-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Stock Quantity *</Label>
                <Input {...register('stock_quantity')} type="number" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select onValueChange={(v: string | null) => setValue('category_id', v ?? undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select onValueChange={(v) => setValue('status', v as 'active' | 'draft' | 'archived')} defaultValue={editing?.status ?? 'active'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Short Description</Label>
                <Input {...register('short_description')} placeholder="Brief product description" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Full Description</Label>
                <Textarea {...register('description')} rows={3} placeholder="Detailed product description" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Image URLs (one per line)</Label>
                <Textarea {...register('images')} rows={2} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input {...register('tags')} placeholder="electronics, gadgets, wireless" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="featured" checked={watch('is_featured')} onCheckedChange={(c) => setValue('is_featured', c)} />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="new_arrival" checked={watch('is_new_arrival')} onCheckedChange={(c) => setValue('is_new_arrival', c)} />
                <Label htmlFor="new_arrival">New Arrival</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="trending" checked={watch('is_trending')} onCheckedChange={(c) => setValue('is_trending', c)} />
                <Label htmlFor="trending">Trending</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Update Product' : 'Create Product'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full">
            <h3 className="font-semibold mb-2">Archive Product?</h3>
            <p className="text-sm text-muted-foreground mb-4">This will hide the product from the store. You can reactivate it later.</p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => deleteProduct(deleteId)}>Archive</Button>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
