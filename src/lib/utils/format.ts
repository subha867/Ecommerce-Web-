export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...options,
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').trim()
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function getDiscountPercentage(price: number, comparePrice: number): number {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function generateStars(rating: number): { full: number; half: boolean; empty: number } {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ')
}
