import Link from 'next/link'
import { Share2, MessageCircle, Camera, Play, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Electronics', href: '/products?category=electronics' },
    { label: 'Fashion', href: '/products?category=fashion' },
    { label: 'Home & Living', href: '/products?category=home-living' },
    { label: 'Sports', href: '/products?category=sports' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Track Order', href: '/account/orders' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Shipping Info', href: '/shipping' },
    { label: 'Contact Us', href: '/contact' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-sm">L</span>
              </div>
              <span className="font-bold text-xl">LuxeShop</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Premium products, exceptional service. We curate the finest selection for discerning shoppers worldwide.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:support@luxeshop.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                support@luxeshop.com
              </a>
              <a href="tel:+18001234567" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Phone className="h-4 w-4" />
                1-800-123-4567
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                New York, NY 10001
              </span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LuxeShop. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[Share2, MessageCircle, Camera, Play].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
