'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export default function AccountPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  })

  const onSubmit = async (values: ProfileValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, phone: values.phone ?? null } as { full_name: string; phone: string | null })
      .eq('id', user!.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Profile updated!')
      refreshProfile()
    }
    setIsLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xl">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{profile?.full_name ?? 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{profile?.role ?? 'user'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register('phone')} placeholder="+1 555 000 0000" />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
