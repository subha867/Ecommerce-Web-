'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Setting } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'

export function AdminSettingsClient({ initialSettings }: { initialSettings: Setting[] }) {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map((s) => [s.key, typeof s.value === 'string' ? s.value.replace(/"/g, '') : String(s.value)]))
  )
  const [isLoading, setIsLoading] = useState(false)

  const save = async () => {
    setIsLoading(true)
    const supabase = createClient()
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        supabase.from('settings').update({ value: JSON.stringify(value) }).eq('key', key)
      )
    )
    toast.success('Settings saved!')
    setIsLoading(false)
  }

  const settingLabels: Record<string, string> = {
    store_name: 'Store Name',
    store_email: 'Store Email',
    currency: 'Currency',
    free_shipping_threshold: 'Free Shipping Threshold ($)',
    default_shipping_cost: 'Default Shipping Cost ($)',
    tax_rate: 'Tax Rate (decimal, e.g. 0.08 = 8%)',
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <Button onClick={save} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key}>{settingLabels[key] ?? key}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
