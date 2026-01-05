import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, FileText, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(first_name, last_name)
    `)
    .eq('therapist_id', user?.id || '')
    .order('session_date', { ascending: false })
    .limit(50) as { data: Array<{
      id: string
      session_date: string
      discipline: string
      status: string
      attendance_status: string
      duration_minutes: number
      student: { first_name: string; last_name: string } | null
    }> | null }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Session Notes</h2>
          <p className="text-muted-foreground">View and manage your session documentation</p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          All Status
        </Button>
        <Button variant="outline" size="sm">
          This Week
        </Button>
        <Button variant="outline" size="sm">
          This Month
        </Button>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            {sessions?.length || 0} sessions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <div className="divide-y">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 -mx-6 px-6 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {session.student?.first_name} {session.student?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.session_date)} &bull; {session.discipline} &bull;{' '}
                        {session.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'signed'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : session.status === 'locked'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {session.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.attendance_status === 'present'
                          ? 'bg-green-100 text-green-700'
                          : session.attendance_status === 'absent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {session.attendance_status}
                    </span>
                    <Link href={`/sessions/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        {session.status === 'draft' ? 'Edit' : 'View'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first session note to get started
              </p>
              <Link href="/sessions/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session Note
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
