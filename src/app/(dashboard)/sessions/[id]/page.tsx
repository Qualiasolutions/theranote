import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Edit2, Clock, Calendar, User, CheckCircle } from 'lucide-react'
import { SOAPEditor } from '@/components/sessions/soap-editor'

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

interface Session {
  id: string
  student_id: string
  therapist_id: string
  session_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  attendance_status: string
  discipline: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  status: string
  signed_at: string | null
  student: { id: string; first_name: string; last_name: string } | null
  therapist: { full_name: string } | null
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get session details
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      student:students(id, first_name, last_name),
      therapist:profiles(full_name)
    `)
    .eq('id', id)
    .single() as { data: Session | null; error: unknown }

  if (error || !session) {
    notFound()
  }

  // Check if user can edit (draft status and is the therapist)
  const canEdit = session.status === 'draft' && session.therapist_id === user.id
  const isSigned = session.status === 'signed'

  // For editing, we need the full students list
  let students: Array<{ id: string; first_name: string; last_name: string; discipline?: string }> = []
  if (canEdit) {
    const { data: caseloads } = await supabase
      .from('caseloads')
      .select(`
        discipline,
        student:students(id, first_name, last_name)
      `)
      .eq('therapist_id', user.id)

    students = (caseloads as Array<{ discipline: string; student: { id: string; first_name: string; last_name: string } }> | null)
      ?.map(c => ({
        id: c.student.id,
        first_name: c.student.first_name,
        last_name: c.student.last_name,
        discipline: c.discipline,
      })) || []
  }

  // If editable, show the editor
  if (canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Edit Session Note</h2>
            <p className="text-muted-foreground">
              {session.student?.first_name} {session.student?.last_name} - {new Date(session.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <SOAPEditor
          therapistId={user.id}
          discipline={session.discipline}
          students={students}
          existingSession={{
            id: session.id,
            student_id: session.student_id,
            session_date: session.session_date,
            start_time: session.start_time,
            end_time: session.end_time,
            attendance_status: session.attendance_status,
            subjective: session.subjective,
            objective: session.objective,
            assessment: session.assessment,
            plan: session.plan,
            status: session.status,
          }}
        />
      </div>
    )
  }

  // Read-only view for signed sessions
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Session Note</h2>
          <p className="text-muted-foreground">
            {session.student?.first_name} {session.student?.last_name}
          </p>
        </div>
        {isSigned && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Signed</span>
          </div>
        )}
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">
                  {session.student?.first_name} {session.student?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(session.session_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {session.start_time} - {session.end_time} ({session.duration_minutes} min)
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attendance</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                session.attendance_status === 'present'
                  ? 'bg-green-100 text-green-700'
                  : session.attendance_status === 'absent'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {session.attendance_status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOAP Note Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subjective</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {session.subjective || 'No subjective notes recorded.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Objective</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {session.objective || 'No objective notes recorded.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {session.assessment || 'No assessment notes recorded.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {session.plan || 'No plan notes recorded.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Signature Info */}
      {session.signed_at && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Electronically Signed</p>
                  <p className="text-sm text-green-600">
                    By {session.therapist?.full_name} on {new Date(session.signed_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-600">
                This document is locked and cannot be modified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
