import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
            <span className="text-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-xl text-background">LuxeShop</span>
        </Link>
        <div className="relative z-10">
          <blockquote className="text-2xl font-light leading-relaxed opacity-90 mb-4">
            &ldquo;Premium shopping, simplified. Everything you love, all in one place.&rdquo;
          </blockquote>
          <p className="text-background/60 text-sm">Join over 50,000 satisfied customers</p>
        </div>
        <div className="flex gap-6 text-sm text-background/60 relative z-10">
          <span>50K+ Customers</span>
          <span>10K+ Products</span>
          <span>99% Satisfaction</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-sm">L</span>
              </div>
              <span className="font-bold text-xl">LuxeShop</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
