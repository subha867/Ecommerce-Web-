import { createClient } from '@/lib/supabase/server'
import { AdminUsersClient } from './users-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminUsersClient initialUsers={users ?? []} />
}
