import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { IncidentForm } from '@/components/incidents/incident-form'

export default async function NewIncidentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get students on caseload
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      student:students(id, first_name, last_name)
    `)
    .eq('therapist_id', user.id)

  const students = (caseloads as { student: { id: string; first_name: string; last_name: string } }[] | null)
    ?.map(c => c.student) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">New Incident Report</h2>
          <p className="text-muted-foreground">Document a behavior or safety incident</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentForm students={students} reporterId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
