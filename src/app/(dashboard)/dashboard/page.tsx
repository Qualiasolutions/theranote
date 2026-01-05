import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, FileText, Clock, AlertTriangle, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get stats (placeholder queries - will need proper org filtering)
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  const { count: sessionCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')

  const { count: draftCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('therapist_id', user?.id || '')
    .eq('status', 'draft')

  const { data: recentSessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name)
    `)
    .eq('therapist_id', user?.id || '')
    .order('session_date', { ascending: false })
    .limit(5) as { data: Array<{
      id: string
      session_date: string
      discipline: string
      status: string
      student: { first_name: string; last_name: string } | null
    }> | null }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Your clinical documentation overview</p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session Note
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount || 0}</div>
            <p className="text-xs text-muted-foreground">Active caseload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions This Month</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionCount || 0}</div>
            <p className="text-xs text-muted-foreground">Documented sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft Notes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount || 0}</div>
            <p className="text-xs text-muted-foreground">Pending signature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Missing Docs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">0</div>
            <p className="text-xs text-muted-foreground">Overdue documentation</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest session documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {session.student?.first_name} {session.student?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()} - {session.discipline}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'signed'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {session.status}
                    </span>
                    <Link href={`/sessions/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions yet</p>
              <p className="text-sm">Start by creating your first session note</p>
              <Link href="/sessions/new" className="mt-4 inline-block">
                <Button>Create Session Note</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
