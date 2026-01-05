import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Users, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function CaseloadReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name, last_name, discipline')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; first_name: string; last_name: string; discipline: string | null } | null }

  // Get therapist's caseload
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      *,
      student:students(
        id,
        first_name,
        last_name,
        date_of_birth,
        service_type,
        status,
        session_frequency,
        session_duration
      )
    `)
    .eq('therapist_id', user.id)
    .eq('status', 'active') as { data: Array<{
      id: string
      student: {
        id: string
        first_name: string
        last_name: string
        date_of_birth: string | null
        service_type: string
        status: string
        session_frequency: string
        session_duration: number
      } | null
    }> | null }

  // Get goals for all students
  const studentIds = caseloads?.map(c => c.student?.id).filter(Boolean) as string[] || []
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .in('student_id', studentIds) as { data: Array<{ student_id: string; status: string }> | null }

  // Get session counts for the month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('student_id, status')
    .eq('therapist_id', user.id)
    .gte('session_date', startOfMonth.toISOString()) as { data: Array<{ student_id: string; status: string }> | null }

  // Build caseload summary
  const caseloadSummary = caseloads?.map(caseload => {
    const student = caseload.student
    const studentGoals = goals?.filter(g => g.student_id === student?.id) || []
    const activeGoals = studentGoals.filter(g => g.status === 'active').length
    const metGoals = studentGoals.filter(g => g.status === 'met').length
    const studentSessions = sessions?.filter(s => s.student_id === student?.id) || []
    const completedSessions = studentSessions.filter(s => s.status === 'signed').length

    // Calculate age
    const dob = student?.date_of_birth ? new Date(student.date_of_birth) : null
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    return {
      id: student?.id,
      name: `${student?.first_name} ${student?.last_name}`,
      age,
      serviceType: student?.service_type,
      frequency: student?.session_frequency,
      duration: student?.session_duration,
      activeGoals,
      metGoals,
      totalGoals: studentGoals.length,
      sessionsThisMonth: studentSessions.length,
      completedSessions,
    }
  }) || []

  // Calculate totals
  const totalStudents = caseloadSummary.length
  const totalActiveGoals = caseloadSummary.reduce((acc, s) => acc + s.activeGoals, 0)
  const totalMetGoals = caseloadSummary.reduce((acc, s) => acc + s.metGoals, 0)
  const totalSessions = caseloadSummary.reduce((acc, s) => acc + s.sessionsThisMonth, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caseload Summary</h1>
          <p className="text-muted-foreground">
            {profile?.first_name} {profile?.last_name} - {profile?.discipline?.toUpperCase() || 'Therapist'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active caseload</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveGoals}</div>
            <p className="text-xs text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Met</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetGoals}</div>
            <p className="text-xs text-muted-foreground">Successfully achieved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Documented sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Caseload Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Student Caseload</CardTitle>
            <CardDescription>Detailed view of each student on your caseload</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Student</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Service</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Frequency</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Goals</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Sessions</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {caseloadSummary.map((student) => {
                  const goalProgress = student.totalGoals > 0
                    ? Math.round((student.metGoals / student.totalGoals) * 100)
                    : 0
                  return (
                    <tr key={student.id} className="border-b">
                      <td className="p-4 align-middle">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.age ? `${student.age} years old` : 'Age unknown'}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                          {student.serviceType || 'Therapy'}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-center text-sm">
                        {student.frequency || '2x/week'}
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="text-sm">
                          <span className="font-medium">{student.activeGoals}</span> active
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.metGoals} met
                        </div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="text-sm font-medium">{student.sessionsThisMonth}</div>
                        <div className="text-xs text-muted-foreground">this month</div>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${goalProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{goalProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {caseloadSummary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      No students on caseload
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Service Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requirements Overview</CardTitle>
          <CardDescription>Mandated service hours per IEP/IFSP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {caseloadSummary.map((student) => (
              <div key={student.id} className="p-4 rounded-lg border">
                <div className="font-medium mb-2">{student.name}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span>{student.frequency || '2x/week'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{student.duration || 30} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions delivered:</span>
                    <span className="font-medium">{student.sessionsThisMonth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
