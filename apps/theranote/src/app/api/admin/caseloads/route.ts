import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's profile and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single() as { data: { role: string; organization_id: string | null } | null }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get user_organizations to find the org
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', user.id)
    .single() as { data: { org_id: string } | null }

  const orgId = userOrg?.org_id

  // Get all therapists in the org
  const { data: therapists } = await supabase
    .from('profiles')
    .select('id, full_name, discipline')
    .eq('role', 'therapist')

  // Get all students in the org
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, status, service_type')
    .eq('org_id', orgId || '')
    .eq('status', 'active')
    .order('last_name')

  // Get all caseloads with relationships
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      id,
      therapist_id,
      student_id,
      discipline,
      frequency,
      start_date,
      end_date,
      therapist:profiles!caseloads_therapist_id_fkey(id, full_name, discipline),
      student:students!caseloads_student_id_fkey(id, first_name, last_name)
    `)
    .is('end_date', null) // Only active caseloads
    .order('start_date', { ascending: false })

  return NextResponse.json({
    therapists: therapists || [],
    students: students || [],
    caseloads: caseloads || [],
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { therapist_id, student_id, discipline, frequency, start_date } = body

  if (!therapist_id || !student_id || !discipline) {
    return NextResponse.json(
      { error: 'Therapist, student, and discipline are required' },
      { status: 400 }
    )
  }

  // Check if caseload already exists
  const { data: existing } = await supabase
    .from('caseloads')
    .select('id')
    .eq('therapist_id', therapist_id)
    .eq('student_id', student_id)
    .is('end_date', null)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'This student is already assigned to this therapist' },
      { status: 400 }
    )
  }

  // Create caseload
  const { data: caseload, error } = await (supabase
    .from('caseloads') as ReturnType<typeof supabase.from>)
    .insert({
      therapist_id,
      student_id,
      discipline,
      frequency: frequency || null,
      start_date: start_date || new Date().toISOString().split('T')[0],
    } as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ caseload })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { id, frequency, end_date } = body

  if (!id) {
    return NextResponse.json({ error: 'Caseload ID is required' }, { status: 400 })
  }

  const updateData: { frequency?: string; end_date?: string } = {}
  if (frequency !== undefined) updateData.frequency = frequency
  if (end_date !== undefined) updateData.end_date = end_date

  const { error } = await (supabase
    .from('caseloads') as ReturnType<typeof supabase.from>)
    .update(updateData as never)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Caseload ID is required' }, { status: 400 })
  }

  // Soft delete by setting end_date
  const { error } = await (supabase
    .from('caseloads') as ReturnType<typeof supabase.from>)
    .update({ end_date: new Date().toISOString().split('T')[0] } as never)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
