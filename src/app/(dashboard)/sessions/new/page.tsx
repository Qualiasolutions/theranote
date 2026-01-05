import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SOAPEditor } from '@/components/sessions/soap-editor'

export default async function NewSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get profile for discipline
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { discipline: string | null } | null }

  // Get students on caseload
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      *,
      student:students(*)
    `)
    .eq('therapist_id', user.id)

  // Map caseloads to simple student objects for the editor
  const students = (caseloads as { discipline: string; student: { id: string; first_name: string; last_name: string } }[] | null)
    ?.map(c => ({
      id: c.student.id,
      first_name: c.student.first_name,
      last_name: c.student.last_name,
      discipline: c.discipline,
    })) || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">New Session Note</h2>
        <p className="text-muted-foreground">Create a new session documentation</p>
      </div>

      <SOAPEditor
        therapistId={user.id}
        discipline={profile?.discipline || 'speech'}
        students={students}
      />
    </div>
  )
}
