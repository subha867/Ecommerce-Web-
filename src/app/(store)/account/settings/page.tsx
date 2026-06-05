'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const passwordSchema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type PwdValues = z.infer<typeof passwordSchema>

export default function AccountSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwdValues>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmit = async (values: PwdValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) toast.error(error.message)
    else { toast.success('Password updated!'); reset() }
    setIsLoading(false)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" {...register('password')} placeholder="••••••••" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input type="password" {...register('confirm')} placeholder="••••••••" />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
