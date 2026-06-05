'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterValues) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Welcome to LuxeShop.')
      router.push('/account')
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-muted-foreground mt-1">Join LuxeShop for exclusive deals</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" placeholder="John Doe" autoComplete="name" {...register('full_name')} />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm Password</Label>
          <Input id="confirm_password" type="password" placeholder="Repeat password" autoComplete="new-password" {...register('confirm_password')} />
          {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-foreground font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
