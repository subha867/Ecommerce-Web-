import { createClient } from '@/lib/supabase/server'
import { AdminSettingsClient } from './settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Site Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('settings').select('*').order('key')
  return <AdminSettingsClient initialSettings={settings ?? []} />
}
