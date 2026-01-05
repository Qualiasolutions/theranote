import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invitationId } = await params
  const supabase = await createClient()

  // Verify current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single() as { data: { role: string; organization_id: string } | null }

  if (currentProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Verify invitation belongs to same organization
  const { data: invitation } = await supabase
    .from('invitations')
    .select('organization_id, email')
    .eq('id', invitationId)
    .single() as { data: { organization_id: string; email: string } | null }

  if (!invitation || invitation.organization_id !== currentProfile.organization_id) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  // Delete the invitation
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log the action
  await (supabase
    .from('audit_logs') as ReturnType<typeof supabase.from>)
    .insert({
      organization_id: currentProfile.organization_id,
      user_id: user.id,
      action: 'revoke_invitation',
      resource_type: 'invitation',
      resource_id: invitationId,
      metadata: { revoked_email: invitation.email },
    } as never)

  return NextResponse.json({ success: true })
}
