import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProgressReportGenerator } from '@/components/reports/progress-report-generator'

export default async function ProgressReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get students on caseload
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      *,
      student:students(id, first_name, last_name, date_of_birth)
    `)
    .eq('therapist_id', user.id)

  const students = (caseloads as { discipline: string; student: { id: string; first_name: string; last_name: string; date_of_birth: string } }[] | null)
    ?.map(c => ({
      id: c.student.id,
      first_name: c.student.first_name,
      last_name: c.student.last_name,
      date_of_birth: c.student.date_of_birth,
      discipline: c.discipline,
    })) || []

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, discipline, license_number')
    .eq('id', user.id)
    .single() as { data: { full_name: string; discipline: string | null; license_number: string | null } | null }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Progress Report Generator</h2>
          <p className="text-muted-foreground">
            Generate IEP/IFSP progress reports for your students
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select a student and date range to generate a comprehensive progress report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressReportGenerator
            students={students}
            therapistName={profile?.full_name || 'Therapist'}
            therapistLicense={profile?.license_number || null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
