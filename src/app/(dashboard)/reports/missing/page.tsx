import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, FileWarning, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function MissingDocumentationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name, last_name')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; first_name: string; last_name: string } | null }

  // Get all draft/pending sessions (unsigned)
  const { data: unsignedSessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name)
    `)
    .eq('therapist_id', user.id)
    .eq('status', 'draft')
    .order('session_date', { ascending: true }) as { data: Array<{
      id: string
      session_date: string
      student: { first_name: string; last_name: string } | null
    }> | null }

  // Get therapist's caseload for expected sessions
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      *,
      student:students(id, first_name, last_name, session_frequency)
    `)
    .eq('therapist_id', user.id)
    .eq('status', 'active') as { data: Array<{
      id: string
      student: { id: string; first_name: string; last_name: string; session_frequency: string } | null
    }> | null }

  // Get all sessions this month to check for gaps
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthSessions } = await supabase
    .from('sessions')
    .select('student_id, session_date')
    .eq('therapist_id', user.id)
    .gte('session_date', startOfMonth.toISOString()) as { data: Array<{ student_id: string; session_date: string }> | null }

  // Calculate days since last session for each student
  const studentLastSession: Record<string, Date | null> = {}
  monthSessions?.forEach(session => {
    const current = studentLastSession[session.student_id]
    const sessionDate = new Date(session.session_date)
    if (!current || sessionDate > current) {
      studentLastSession[session.student_id] = sessionDate
    }
  })

  // Identify students who may be missing sessions
  const today = new Date()
  const potentialMissing = caseloads?.filter(caseload => {
    const lastSession = studentLastSession[caseload.student?.id || '']
    if (!lastSession) return true // No sessions this month
    const daysSince = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
    return daysSince > 7 // Flag if more than 7 days since last session
  }) || []

  // Categorize unsigned by age
  const now = new Date()
  const oldUnsigned = unsignedSessions?.filter(s => {
    const sessionDate = new Date(s.session_date)
    const daysSince = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSince > 7
  }) || []

  const recentUnsigned = unsignedSessions?.filter(s => {
    const sessionDate = new Date(s.session_date)
    const daysSince = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSince <= 7
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Missing Documentation</h1>
          <p className="text-muted-foreground">
            Identify and resolve documentation gaps
          </p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={oldUnsigned.length > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Notes</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${oldUnsigned.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${oldUnsigned.length > 0 ? 'text-red-600' : ''}`}>
              {oldUnsigned.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Unsigned for more than 7 days
            </p>
          </CardContent>
        </Card>
        <Card className={recentUnsigned.length > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
            <Clock className={`h-4 w-4 ${recentUnsigned.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${recentUnsigned.length > 0 ? 'text-yellow-600' : ''}`}>
              {recentUnsigned.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent sessions awaiting sign-off
            </p>
          </CardContent>
        </Card>
        <Card className={potentialMissing.length > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Gaps</CardTitle>
            <FileWarning className={`h-4 w-4 ${potentialMissing.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${potentialMissing.length > 0 ? 'text-orange-600' : ''}`}>
              {potentialMissing.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with potential missed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Notes - Priority */}
      {oldUnsigned.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue Session Notes (Action Required)
            </CardTitle>
            <CardDescription>
              These sessions are more than 7 days old and need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {oldUnsigned.map((session) => {
                const sessionDate = new Date(session.session_date)
                const daysSince = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium text-red-600 w-20">
                        {daysSince} days ago
                      </div>
                      <div>
                        <div className="font-medium">
                          {session.student?.first_name} {session.student?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sessionDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Link href={`/sessions/${session.id}`}>
                      <Button size="sm" variant="destructive">
                        Complete Now
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Unsigned */}
      {recentUnsigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Signature
            </CardTitle>
            <CardDescription>
              Recent sessions that need to be signed off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUnsigned.map((session) => {
                const sessionDate = new Date(session.session_date)
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground w-24">
                        {sessionDate.toLocaleDateString()}
                      </div>
                      <div>
                        <div className="font-medium">
                          {session.student?.first_name} {session.student?.last_name}
                        </div>
                      </div>
                    </div>
                    <Link href={`/sessions/${session.id}`}>
                      <Button size="sm" variant="outline">
                        Review & Sign
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Gaps */}
      {potentialMissing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-500" />
              Potential Service Gaps
            </CardTitle>
            <CardDescription>
              Students who may have missed sessions based on their service frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {potentialMissing.map((caseload) => {
                const lastSession = studentLastSession[caseload.student?.id || '']
                const daysSince = lastSession
                  ? Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <div key={caseload.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200">
                    <div>
                      <div className="font-medium">
                        {caseload.student?.first_name} {caseload.student?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Frequency: {caseload.student?.session_frequency || '2x/week'} •
                        Last session: {lastSession ? `${daysSince} days ago` : 'None this month'}
                      </div>
                    </div>
                    <Link href="/sessions/new">
                      <Button size="sm" variant="outline">
                        Create Session
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Clear */}
      {oldUnsigned.length === 0 && recentUnsigned.length === 0 && potentialMissing.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-green-700">All Documentation Complete</h3>
            <p className="text-sm text-green-600 mt-1">
              Great work! All session notes are signed and up to date.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
