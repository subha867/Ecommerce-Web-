'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react'
import { slugify } from '@/lib/utils/format'
import Image from 'next/image'

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  sort_order: z.number(),
  is_active: z.boolean(),
})
type CategoryValues = z.infer<typeof categorySchema>

export function AdminCategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data ?? [])
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { sort_order: 0, is_active: true },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ sort_order: 0, is_active: true })
    setIsOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({ name: cat.name, description: cat.description ?? '', image_url: cat.image_url ?? '', sort_order: cat.sort_order, is_active: cat.is_active })
    setIsOpen(true)
  }

  const onSubmit = async (values: CategoryValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const payload = { ...values, slug: editing?.slug ?? slugify(values.name) }
    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
      if (error) toast.error(error.message)
      else { toast.success('Category updated!'); setIsOpen(false); refresh() }
    } else {
      const { error } = await supabase.from('categories').insert(payload)
      if (error) toast.error(error.message)
      else { toast.success('Category created!'); setIsOpen(false); refresh() }
    }
    setIsLoading(false)
  }

  const deleteCategory = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Category deleted'); refresh() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Category</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {cat.image_url ? (
                <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="400px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register('name')} placeholder="Category name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...register('description')} placeholder="Optional description" />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input {...register('image_url')} placeholder="https://..." />
              {errors.image_url && <p className="text-xs text-destructive">{errors.image_url.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input {...register('sort_order')} type="number" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_active" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
