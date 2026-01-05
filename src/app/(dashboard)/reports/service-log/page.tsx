import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ServiceLogReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; first_name: string; last_name: string } | null }

  // Get all sessions for the therapist this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name, service_type)
    `)
    .eq('therapist_id', user.id)
    .gte('session_date', startOfMonth.toISOString())
    .order('session_date', { ascending: false }) as { data: Array<{
      id: string
      session_date: string
      duration_minutes: number
      status: string
      student: { first_name: string; last_name: string; service_type: string } | null
    }> | null }

  // Calculate totals
  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.status === 'signed').length || 0
  const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 30), 0) || 0

  // Group by student
  const byStudent = sessions?.reduce((acc, session) => {
    const studentName = `${session.student?.first_name} ${session.student?.last_name}`
    if (!acc[studentName]) {
      acc[studentName] = { sessions: 0, minutes: 0, service: session.student?.service_type || 'Therapy' }
    }
    acc[studentName].sessions++
    acc[studentName].minutes += session.duration_minutes || 30
    return acc
  }, {} as Record<string, { sessions: number; minutes: number; service: string }>) || {}

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Log Report</h1>
          <p className="text-muted-foreground">
            {currentMonth} - {profile?.first_name} {profile?.last_name}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {completedSessions} signed, {totalSessions - completedSessions} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Service Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            <p className="text-xs text-muted-foreground">
              {totalMinutes} minutes total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Served</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(byStudent).length}</div>
            <p className="text-xs text-muted-foreground">
              Active caseload
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Log by Student</CardTitle>
            <CardDescription>Breakdown of services provided this month</CardDescription>
          </div>
          <a href="/api/export/service-log" download>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </a>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Student</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Service Type</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Sessions</th>
                  <th className="h-12 px-4 text-center align-middle font-medium">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byStudent).map(([name, data]) => (
                  <tr key={name} className="border-b">
                    <td className="p-4 align-middle font-medium">{name}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                        {data.service || 'Therapy'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center">{data.sessions}</td>
                    <td className="p-4 align-middle text-center">{data.minutes} min</td>
                  </tr>
                ))}
                {Object.keys(byStudent).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No sessions recorded this month
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td className="p-4 align-middle font-bold" colSpan={2}>Total</td>
                  <td className="p-4 align-middle text-center font-bold">{totalSessions}</td>
                  <td className="p-4 align-middle text-center font-bold">{totalMinutes} min</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Session List */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>Individual session records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions?.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground w-24">
                    {new Date(session.session_date).toLocaleDateString()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {session.student?.first_name} {session.student?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.duration_minutes || 30} minutes
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  session.status === 'signed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                No sessions found for this month
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
