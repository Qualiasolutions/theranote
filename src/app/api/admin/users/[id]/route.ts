import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
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

  // Don't allow deleting yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Verify user belongs to same organization
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single() as { data: { organization_id: string } | null }

  if (!targetProfile || targetProfile.organization_id !== currentProfile.organization_id) {
    return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 })
  }

  // Remove from user_organizations
  await supabase
    .from('user_organizations')
    .delete()
    .eq('user_id', userId)
    .eq('org_id', currentProfile.organization_id)

  // Remove caseload assignments
  await supabase
    .from('caseloads')
    .delete()
    .eq('therapist_id', userId)

  // Log the action
  await (supabase
    .from('audit_logs') as ReturnType<typeof supabase.from>)
    .insert({
      organization_id: currentProfile.organization_id,
      user_id: user.id,
      action: 'delete_user',
      resource_type: 'user',
      resource_id: userId,
      metadata: { deleted_by: user.id },
    } as never)

  return NextResponse.json({ success: true })
}
