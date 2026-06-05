'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Banner } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  image_url: z.string().url('Must be a valid URL'),
  link_url: z.string().optional(),
  button_text: z.string().optional(),
  position: z.enum(['hero', 'top', 'middle', 'bottom']),
  sort_order: z.number(),
  is_active: z.boolean(),
})
type BannerValues = z.infer<typeof bannerSchema>

export function AdminBannersClient({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data ?? [])
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BannerValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: { position: 'hero', sort_order: 0, is_active: true },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ position: 'hero', sort_order: 0, is_active: true })
    setIsOpen(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    reset({
      title: b.title,
      subtitle: b.subtitle ?? '',
      image_url: b.image_url,
      link_url: b.link_url ?? '',
      button_text: b.button_text ?? '',
      position: b.position,
      sort_order: b.sort_order,
      is_active: b.is_active,
    })
    setIsOpen(true)
  }

  const onSubmit = async (values: BannerValues) => {
    setIsLoading(true)
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('banners').update(values).eq('id', editing.id)
      if (error) toast.error(error.message)
      else { toast.success('Banner updated!'); setIsOpen(false); refresh() }
    } else {
      const { error } = await supabase.from('banners').insert(values)
      if (error) toast.error(error.message)
      else { toast.success('Banner created!'); setIsOpen(false); refresh() }
    }
    setIsLoading(false)
  }

  const deleteBanner = async (id: string) => {
    const supabase = createClient()
    await supabase.from('banners').delete().eq('id', id)
    toast.success('Banner deleted')
    refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Banner</Button>
      </div>

      <div className="space-y-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 aspect-video sm:aspect-auto bg-muted flex-shrink-0">
              <Image src={banner.image_url} alt={banner.title} fill className="object-cover" sizes="200px" />
            </div>
            <div className="flex-1 p-4 flex flex-col sm:flex-row gap-3 justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{banner.title}</p>
                  <Badge variant={banner.is_active ? 'default' : 'secondary'} className="text-xs">{banner.is_active ? 'Active' : 'Inactive'}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{banner.position}</Badge>
                </div>
                {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                {banner.link_url && <p className="text-xs text-muted-foreground mt-1">{banner.link_url}</p>}
              </div>
              <div className="flex gap-2 items-start">
                <Button variant="outline" size="sm" onClick={() => openEdit(banner)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => deleteBanner(banner.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>No banners yet</p>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Banner' : 'Add Banner'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input {...register('title')} placeholder="Banner title" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Subtitle</Label>
              <Input {...register('subtitle')} placeholder="Optional subtitle" />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL *</Label>
              <Input {...register('image_url')} placeholder="https://..." />
              {errors.image_url && <p className="text-xs text-destructive">{errors.image_url.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input {...register('link_url')} placeholder="/products" />
              </div>
              <div className="space-y-1.5">
                <Label>Button Text</Label>
                <Input {...register('button_text')} placeholder="Shop Now" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select defaultValue={editing?.position ?? 'hero'} onValueChange={(v) => setValue('position', v as 'hero' | 'top' | 'middle' | 'bottom')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input {...register('sort_order')} type="number" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="b_active" checked={watch('is_active')} onCheckedChange={(c) => setValue('is_active', c)} />
              <Label htmlFor="b_active">Active</Label>
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
