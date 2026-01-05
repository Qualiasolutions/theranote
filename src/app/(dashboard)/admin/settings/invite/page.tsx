import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { InviteForm } from '@/components/admin/invite-form'

export default async function InviteUserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single() as { data: { org_id: string; role: string } | null }

  if (userOrg?.role !== 'admin' && userOrg?.role !== 'owner') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Invite Team Member</h2>
          <p className="text-muted-foreground">Send an invitation to join your organization</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            New Invitation
          </CardTitle>
          <CardDescription>
            The invited user will receive an email with instructions to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm organizationId={userOrg?.org_id || ''} invitedById={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
