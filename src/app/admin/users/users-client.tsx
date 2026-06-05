'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils/format'
import { toast } from 'sonner'
import { Search, Shield, Users } from 'lucide-react'

export function AdminUsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) toast.error(error.message)
    else {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
      toast.success(`User role updated to ${newRole}`)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar_url ?? undefined} />
                        <AvatarFallback>{user.full_name?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name ?? 'No name'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(user.created_at)}</td>
                  <td className="p-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                      {user.role === 'admin' && <Shield className="h-3 w-3" />}
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toggleRole(user.id, user.role)}
                    >
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
