import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Building2,
  Shield,
  Mail,
  UserPlus,
  Settings,
  Trash2
} from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  discipline: string | null
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  discipline: string | null
  expires_at: string
  accepted_at: string | null
  invited_by: { full_name: string } | null
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single() as { data: { role: string; organization_id: string } | null }

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single() as { data: { id: string; name: string; slug: string; settings: Record<string, unknown> } | null }

  // Get all users in the organization
  const { data: userOrgs } = await supabase
    .from('user_organizations')
    .select(`
      user:profiles(id, email, full_name, role, discipline, created_at)
    `)
    .eq('org_id', profile.organization_id)

  const users = (userOrgs as Array<{ user: User }> | null)?.map(uo => uo.user) || []

  // Get pending invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      discipline,
      expires_at,
      accepted_at,
      invited_by:profiles(full_name)
    `)
    .eq('organization_id', profile.organization_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }) as { data: Invitation[] | null }

  const pendingInvites = invitations || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Organization Settings</h2>
          <p className="text-muted-foreground">Manage your organization and team</p>
        </div>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Organization Name</p>
              <p className="font-medium">{organization?.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{organization?.slug || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>{users.length} members in your organization</CardDescription>
          </div>
          <Link href="/admin/settings/invite">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Discipline</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'billing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 capitalize">{u.discipline || '-'}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {u.id !== user.id && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>Invitations waiting to be accepted</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvites.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Discipline</th>
                    <th className="text-left p-3 font-medium">Expires</th>
                    <th className="text-left p-3 font-medium">Invited By</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => (
                    <tr key={invite.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{invite.email}</td>
                      <td className="p-3 capitalize">{invite.role}</td>
                      <td className="p-3 capitalize">{invite.discipline || '-'}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {invite.invited_by?.full_name || 'Unknown'}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No pending invitations
            </p>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Compliance
          </CardTitle>
          <CardDescription>Security settings for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
            </div>
            <Button variant="outline" disabled>Coming Soon</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Button variant="outline" disabled>Coming Soon</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Audit Logs</p>
              <p className="text-sm text-muted-foreground">View all system activity</p>
            </div>
            <Link href="/admin/compliance">
              <Button variant="outline">View Logs</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
