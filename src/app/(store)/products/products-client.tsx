'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types/database'
import { ProductCard } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SlidersHorizontal, X, Search, Grid2X2, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

interface ProductsClientProps {
  initialFilters: {
    q?: string
    category?: string
    featured?: string
    new?: string
    trending?: string
    min_price?: string
    max_price?: string
    sort?: string
    page?: string
  }
  categories: Category[]
}

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

const PAGE_SIZE = 12

export function ProductsClient({ initialFilters, categories }: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [filters, setFilters] = useState({
    q: initialFilters.q ?? '',
    category: initialFilters.category ?? '',
    sort: initialFilters.sort ?? 'newest',
    minPrice: initialFilters.min_price ? Number(initialFilters.min_price) : 0,
    maxPrice: initialFilters.max_price ? Number(initialFilters.max_price) : 2000,
    featured: initialFilters.featured === 'true',
    isNew: initialFilters.new === 'true',
    trending: initialFilters.trending === 'true',
    page: initialFilters.page ? Number(initialFilters.page) : 1,
  })

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase.from('products').select('*', { count: 'exact' }).eq('status', 'active')

    if (filters.q) query = query.ilike('name', `%${filters.q}%`)
    if (filters.category) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', filters.category).maybeSingle()
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (filters.featured) query = query.eq('is_featured', true)
    if (filters.isNew) query = query.eq('is_new_arrival', true)
    if (filters.trending) query = query.eq('is_trending', true)
    if (filters.minPrice > 0) query = query.gte('price', filters.minPrice)
    if (filters.maxPrice < 2000) query = query.lte('price', filters.maxPrice)

    switch (filters.sort) {
      case 'price_asc': query = query.order('price', { ascending: true }); break
      case 'price_desc': query = query.order('price', { ascending: false }); break
      case 'rating': query = query.order('avg_rating', { ascending: false }); break
      case 'popular': query = query.order('review_count', { ascending: false }); break
      default: query = query.order('created_at', { ascending: false })
    }

    const from = (filters.page - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data, count } = await query
    setProducts(data ?? [])
    setTotalCount(count ?? 0)
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const updateFilter = (key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key === 'q' ? 'q' : key === 'isNew' ? 'new' : key === 'minPrice' ? 'min_price' : key === 'maxPrice' ? 'max_price' : key, String(value))
    else params.delete(key)
    router.push(`/products?${params.toString()}`, { scroll: false })
  }

  const clearAllFilters = () => {
    setFilters({ q: '', category: '', sort: 'newest', minPrice: 0, maxPrice: 2000, featured: false, isNew: false, trending: false, page: 1 })
    router.push('/products', { scroll: false })
  }

  const hasActiveFilters = filters.q || filters.category || filters.featured || filters.isNew || filters.trending || filters.minPrice > 0 || filters.maxPrice < 2000
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-sm mb-3">Categories</h3>
        <div className="space-y-2">
          <button
            onClick={() => updateFilter('category', '')}
            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${!filters.category ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.slug)}
              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${filters.category === cat.slug ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <Slider
          min={0}
          max={2000}
          step={10}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={(value) => {
            const [min, max] = value as [number, number]
            setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max, page: 1 }))
          }}
          onValueCommitted={(value) => {
            const [min, max] = value as [number, number]
            const params = new URLSearchParams(searchParams.toString())
            if (min > 0) params.set('min_price', String(min)); else params.delete('min_price')
            if (max < 2000) params.set('max_price', String(max)); else params.delete('max_price')
            router.push(`/products?${params.toString()}`, { scroll: false })
          }}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>${filters.minPrice}</span>
          <span>${filters.maxPrice === 2000 ? '2000+' : filters.maxPrice}</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold text-sm mb-3">Collections</h3>
        <div className="space-y-2">
          {[
            { key: 'featured', label: 'Featured' },
            { key: 'isNew', label: 'New Arrivals' },
            { key: 'trending', label: 'Trending' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={filters[key as keyof typeof filters] as boolean}
                onCheckedChange={(checked) => updateFilter(key, checked)}
              />
              <Label htmlFor={key} className="text-sm cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {filters.category
              ? categories.find((c) => c.slug === filters.category)?.name ?? 'Products'
              : filters.q
              ? `Search: "${filters.q}"`
              : 'All Products'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">{totalCount} products</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder="Search..."
              className="pl-9 h-9"
            />
          </div>

          {/* Sort */}
          <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v)}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile filters */}
          <Sheet>
            <SheetTrigger>
              <Button variant="outline" size="sm" className="lg:hidden gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-xs">!</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.q && <Badge variant="secondary" className="gap-1">{filters.q} <button onClick={() => updateFilter('q', '')}><X className="h-3 w-3" /></button></Badge>}
          {filters.category && <Badge variant="secondary" className="gap-1">{categories.find((c) => c.slug === filters.category)?.name} <button onClick={() => updateFilter('category', '')}><X className="h-3 w-3" /></button></Badge>}
          {filters.featured && <Badge variant="secondary" className="gap-1">Featured <button onClick={() => updateFilter('featured', false)}><X className="h-3 w-3" /></button></Badge>}
          {filters.isNew && <Badge variant="secondary" className="gap-1">New Arrivals <button onClick={() => updateFilter('isNew', false)}><X className="h-3 w-3" /></button></Badge>}
          {filters.trending && <Badge variant="secondary" className="gap-1">Trending <button onClick={() => updateFilter('trending', false)}><X className="h-3 w-3" /></button></Badge>}
          <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No products found</h3>
              <p className="text-muted-foreground text-sm mb-4">Try adjusting your filters</p>
              <Button variant="outline" onClick={clearAllFilters}>Clear Filters</Button>
            </div>
          ) : (
            <motion.div
              className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
