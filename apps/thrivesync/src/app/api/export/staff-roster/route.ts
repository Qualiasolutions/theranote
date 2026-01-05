import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@repo/database/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single() as { data: { organization_id: string | null } | null }

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 })
  }

  // Get all staff in the organization
  const { data: staff, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('full_name', { ascending: true }) as { data: Profile[] | null; error: Error | null }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CSV headers
  const headers = [
    'Staff ID',
    'Full Name',
    'Email',
    'Role',
    'Discipline',
    'License Number',
    'Created At',
    'Last Updated',
  ]

  // Build rows
  const rows = (staff || []).map((s: Profile) => [
    s.id,
    s.full_name,
    s.email,
    s.role,
    s.discipline || '',
    s.license_number || '',
    s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '',
  ])

  // Add summary
  const roleCount = (staff || []).reduce((acc: Record<string, number>, s: Profile) => {
    acc[s.role] = (acc[s.role] || 0) + 1
    return acc
  }, {})

  rows.push([]) // Empty row
  rows.push(['SUMMARY', '', '', '', '', '', '', ''])
  rows.push(['Total Staff:', (staff || []).length.toString(), '', '', '', '', '', ''])
  Object.entries(roleCount).forEach(([role, count]) => {
    rows.push([`${role}:`, count.toString(), '', '', '', '', '', ''])
  })

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `staff-roster-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
