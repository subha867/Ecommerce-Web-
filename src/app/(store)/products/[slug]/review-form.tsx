'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
})

type ReviewValues = z.infer<typeof reviewSchema>

export function ReviewForm({ productId }: { productId: string }) {
  const { user } = useAuth()
  const [hoverRating, setHoverRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  })
  const rating = watch('rating')

  const onSubmit = async (values: ReviewValues) => {
    if (!user) return
    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').upsert({
      product_id: productId,
      rating: values.rating,
      title: values.title ?? null,
      body: values.body ?? null,
    })
    if (error) {
      toast.error('Failed to submit review')
    } else {
      toast.success('Review submitted!')
      setSubmitted(true)
    }
    setIsSubmitting(false)
  }

  if (!user) {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        <Link href="/auth/login" className="text-foreground font-medium hover:underline">Sign in</Link> to leave a review
      </div>
    )
  }
  if (submitted) return <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 text-sm">Thank you for your review!</div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-muted/30 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold">Write a Review</h3>
      <div>
        <Label className="text-sm mb-2 block">Rating *</Label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              type="button"
              key={i}
              onMouseEnter={() => setHoverRating(i + 1)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setValue('rating', i + 1)}
            >
              <Star className={cn('h-6 w-6 transition-colors', (hoverRating || rating) > i ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-xs text-destructive mt-1">Please select a rating</p>}
      </div>
      <div>
        <Label htmlFor="title" className="text-sm">Title</Label>
        <Input id="title" {...register('title')} placeholder="Brief summary..." className="mt-1" />
      </div>
      <div>
        <Label htmlFor="body" className="text-sm">Review</Label>
        <Textarea id="body" {...register('body')} placeholder="Share your experience..." className="mt-1" rows={3} />
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
