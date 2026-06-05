'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Invalid email'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }: { email: string }) => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setIsLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">We sent a password reset link to your email address.</p>
        <Link href="/auth/login">
          <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Forgot password?</h1>
        <p className="text-muted-foreground mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
          <ArrowLeft className="h-3 w-3" />Back to Sign In
        </Link>
      </div>
    </div>
  )
}
