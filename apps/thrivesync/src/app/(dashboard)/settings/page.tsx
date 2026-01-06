import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Users, Bell, Shield, Database } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get organization info
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(id, name, slug)
    `)
    .eq('user_id', user?.id || '')
    .single() as { data: { role: string; organization: { id: string; name: string; slug: string } } | null }

  // Get site count
  const { count: siteCount } = await supabase
    .from('sites')
    .select('*', { count: 'exact', head: true })

  // Get user count
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return (
    <>
      <Header
        title="Settings"
        subtitle="Manage organization settings and preferences"
      />

      <div className="p-6 space-y-6">
        {/* Organization Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <Building className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{userOrg?.organization?.name || 'Organization'}</h2>
              <p className="text-sm text-gray-500">
                {siteCount || 0} site{siteCount !== 1 ? 's' : ''} &bull; {userCount || 0} team member{userCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Organization ID</span>
              <p className="font-mono text-xs mt-1">{userOrg?.organization?.id || '-'}</p>
            </div>
            <div>
              <span className="text-gray-500">Your Role</span>
              <p className="font-medium capitalize mt-1">{userOrg?.role || 'Member'}</p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage staff members, roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/staff"
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border hover:bg-gray-50"
              >
                View All Staff
              </Link>
              <button
                className="block w-full px-4 py-2 text-sm text-center rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                disabled
              >
                Invite Team Member (Coming Soon)
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Sites & Locations
              </CardTitle>
              <CardDescription>
                Manage organization sites and classrooms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/classrooms"
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border hover:bg-gray-50"
              >
                View Classrooms
              </Link>
              <button
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border hover:bg-gray-50"
                disabled
              >
                Manage Sites (Coming Soon)
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Compliance Settings
              </CardTitle>
              <CardDescription>
                Configure compliance requirements and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/compliance"
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border hover:bg-gray-50"
              >
                View Compliance Dashboard
              </Link>
              <button
                className="block w-full px-4 py-2 text-sm text-center rounded-lg border hover:bg-gray-50"
                disabled
              >
                Configure Requirements (Coming Soon)
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure alert preferences and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Email Alerts</span>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Credential Expiry Reminders</span>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">30 days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Data & Exports
            </CardTitle>
            <CardDescription>
              Export organizational data for reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/reports"
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                View Reports
              </Link>
              <button
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
                disabled
              >
                Export Staff Data (Coming Soon)
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
                disabled
              >
                Export Compliance Data (Coming Soon)
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
