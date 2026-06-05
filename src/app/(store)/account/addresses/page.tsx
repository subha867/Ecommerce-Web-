'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { Address } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const addressSchema = z.object({
  label: z.string().min(1),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  address_line1: z.string().min(5),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postal_code: z.string().min(4),
  country: z.string().min(2),
})

type AddressValues = z.infer<typeof addressSchema>

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home', country: 'US' },
  })

  const fetchAddresses = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('addresses').select('*').order('created_at') as { data: Address[] | null }
    setAddresses(data ?? [])
  }

  useEffect(() => { fetchAddresses() }, [])

  const onSubmit = async (values: AddressValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('addresses').insert({ ...values } as Address)
    if (error) toast.error(error.message)
    else {
      toast.success('Address added!')
      setIsOpen(false)
      reset()
      fetchAddresses()
    }
    setIsLoading(false)
  }

  const deleteAddress = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').delete().eq('id', id)
    fetchAddresses()
    toast.success('Address removed')
  }

  const setDefault = async (id: string) => {
    const supabase = createClient()
    await supabase.from('addresses').update({ is_default: false } as Partial<Address>).neq('id', id)
    await supabase.from('addresses').update({ is_default: true } as Partial<Address>).eq('id', id)
    fetchAddresses()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Address</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input {...register('label')} placeholder="Home / Work" />
                </div>
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input {...register('full_name')} placeholder="John Doe" />
                  {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Address Line 1</Label>
                <Input {...register('address_line1')} placeholder="123 Main St" />
                {errors.address_line1 && <p className="text-xs text-destructive">{errors.address_line1.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Address Line 2</Label>
                <Input {...register('address_line2')} placeholder="Apt 4B" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="New York" />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input {...register('state')} placeholder="NY" />
                </div>
                <div className="space-y-1">
                  <Label>Postal Code</Label>
                  <Input {...register('postal_code')} placeholder="10001" />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input {...register('country')} placeholder="US" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Address
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No addresses saved</h3>
          <p className="text-muted-foreground">Add an address for faster checkout</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{addr.label}</span>
                  {addr.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                </div>
                <div className="flex gap-1">
                  {!addr.is_default && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDefault(addr.id)}>
                      Set default
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAddress(addr.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{addr.full_name}</p>
              <p className="text-sm text-muted-foreground">{addr.address_line1}</p>
              {addr.address_line2 && <p className="text-sm text-muted-foreground">{addr.address_line2}</p>}
              <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
              <p className="text-sm text-muted-foreground">{addr.country}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
