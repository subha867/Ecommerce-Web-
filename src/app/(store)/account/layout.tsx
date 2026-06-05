import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AccountSidebar } from '@/components/account/account-sidebar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
