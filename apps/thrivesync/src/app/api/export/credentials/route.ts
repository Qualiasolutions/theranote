import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CredentialWithProfile {
  id: string
  credential_name: string
  credential_type: string
  issued_date: string | null
  expiration_date: string | null
  status: string | null
  notes: string | null
  profile: { full_name: string; email: string } | null
}

function getCredentialStatus(expirationDate: string | null): string {
  if (!expirationDate) return 'no_expiration'

  const expDate = new Date(expirationDate)
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  if (expDate < today) return 'expired'
  if (expDate <= thirtyDaysFromNow) return 'expiring_soon'
  return 'compliant'
}

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

  // Get all staff IDs in the organization
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', profile.organization_id) as { data: { id: string }[] | null }

  if (!staffProfiles || staffProfiles.length === 0) {
    return NextResponse.json({ error: 'No staff found' }, { status: 400 })
  }

  const staffIds = staffProfiles.map(p => p.id)

  // Get all credentials for staff in this organization
  const { data: credentials, error } = await supabase
    .from('staff_credentials')
    .select(`
      id,
      credential_name,
      credential_type,
      issued_date,
      expiration_date,
      status,
      notes,
      profile:profiles(full_name, email)
    `)
    .in('profile_id', staffIds)
    .order('expiration_date', { ascending: true }) as { data: CredentialWithProfile[] | null; error: Error | null }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // CSV headers
  const headers = [
    'Staff Name',
    'Staff Email',
    'Credential Name',
    'Credential Type',
    'Issued Date',
    'Expiration Date',
    'Compliance Status',
    'Notes',
  ]

  // Build rows with computed compliance status
  const rows = (credentials || []).map((c: CredentialWithProfile) => {
    const complianceStatus = getCredentialStatus(c.expiration_date)
    return [
      c.profile?.full_name || '',
      c.profile?.email || '',
      c.credential_name,
      c.credential_type,
      c.issued_date || '',
      c.expiration_date || '',
      complianceStatus,
      c.notes || '',
    ]
  })

  // Calculate summary stats
  const statusCounts = (credentials || []).reduce((acc: Record<string, number>, c: CredentialWithProfile) => {
    const status = getCredentialStatus(c.expiration_date)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  rows.push([]) // Empty row
  rows.push(['SUMMARY', '', '', '', '', '', '', ''])
  rows.push(['Total Credentials:', (credentials || []).length.toString(), '', '', '', '', '', ''])
  rows.push(['Compliant:', (statusCounts['compliant'] || 0).toString(), '', '', '', '', '', ''])
  rows.push(['Expiring Soon (30 days):', (statusCounts['expiring_soon'] || 0).toString(), '', '', '', '', '', ''])
  rows.push(['Expired:', (statusCounts['expired'] || 0).toString(), '', '', '', '', '', ''])
  rows.push(['No Expiration:', (statusCounts['no_expiration'] || 0).toString(), '', '', '', '', '', ''])

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `credentials-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
