'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AIPromptsPanel } from './ai-prompts-panel'
import { GoalProgressTracker } from './goal-progress-tracker'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, CheckCircle, Sparkles, Link2, FileText, Wand2, AlertCircle } from 'lucide-react'

// Extended student type for the editor (allows passing joined data)
interface StudentForEditor {
  id: string
  first_name: string
  last_name: string
  discipline?: string
}

interface MissedSession {
  id: string
  session_date: string
  start_time: string
  end_time: string
}

interface SOAPEditorProps {
  therapistId: string
  discipline: string
  students: StudentForEditor[]
  existingSession?: {
    id: string
    student_id: string
    session_date: string
    start_time: string
    end_time: string
    attendance_status: string
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
    status: string
    original_session_id?: string | null
    note_format?: 'soap' | 'narrative'
    narrative_notes?: string | null
  }
}

export function SOAPEditor({
  therapistId,
  discipline,
  students,
  existingSession,
}: SOAPEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'S' | 'O' | 'A' | 'P'>('S')
  const [showAIPanel, setShowAIPanel] = useState(true)
  const [generatingNote, setGeneratingNote] = useState(false)
  const [aiWarnings, setAiWarnings] = useState<string[]>([])

  // Goals state
  interface Goal {
    id: string
    description: string
    domain: string | null
    target_criteria: string | null
    status: string
  }
  interface GoalProgress {
    goalId: string
    progressValue: number | null
    progressUnit: string
    notes: string
  }
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])

  // Makeup session linking
  const [missedSessions, setMissedSessions] = useState<MissedSession[]>([])
  const [originalSessionId, setOriginalSessionId] = useState<string | null>(
    existingSession?.original_session_id || null
  )

  // Note format toggle (SOAP vs Narrative)
  const [noteFormat, setNoteFormat] = useState<'soap' | 'narrative'>(
    existingSession?.note_format || 'soap'
  )
  const [narrativeNotes, setNarrativeNotes] = useState(existingSession?.narrative_notes || '')

  // Form state
  const [studentId, setStudentId] = useState(existingSession?.student_id || '')
  const [sessionDate, setSessionDate] = useState(
    existingSession?.session_date || new Date().toISOString().split('T')[0]
  )
  const [startTime, setStartTime] = useState(existingSession?.start_time || '09:00')
  const [endTime, setEndTime] = useState(existingSession?.end_time || '09:30')
  const [attendanceStatus, setAttendanceStatus] = useState(
    existingSession?.attendance_status || 'present'
  )
  const [subjective, setSubjective] = useState(existingSession?.subjective || '')
  const [objective, setObjective] = useState(existingSession?.objective || '')
  const [assessment, setAssessment] = useState(existingSession?.assessment || '')
  const [plan, setPlan] = useState(existingSession?.plan || '')

  const selectedStudent = students.find((s) => s.id === studentId)

  // Load goals when student changes
  useEffect(() => {
    const loadGoals = async () => {
      if (!studentId) {
        setGoals([])
        setGoalProgress([])
        return
      }

      // Get active goals for the student
      const { data: studentGoals } = await supabase
        .from('goals')
        .select('id, description, domain, target_criteria, status')
        .eq('student_id', studentId)
        .in('status', ['baseline', 'in_progress'])
        .order('created_at', { ascending: false })

      setGoals((studentGoals as Goal[]) || [])

      // If editing existing session, load progress data
      if (existingSession) {
        const { data: sessionGoals } = await supabase
          .from('session_goals')
          .select('goal_id, progress_value, progress_unit, notes')
          .eq('session_id', existingSession.id)

        if (sessionGoals) {
          setGoalProgress(
            sessionGoals.map((sg: { goal_id: string; progress_value: number | null; progress_unit: string | null; notes: string | null }) => ({
              goalId: sg.goal_id,
              progressValue: sg.progress_value,
              progressUnit: sg.progress_unit || '%',
              notes: sg.notes || '',
            }))
          )
        }
      }
    }

    loadGoals()
  }, [studentId, existingSession, supabase])

  // Load missed sessions when attendance is "makeup" and student changes
  useEffect(() => {
    const loadMissedSessions = async () => {
      if (attendanceStatus !== 'makeup' || !studentId) {
        setMissedSessions([])
        return
      }

      // Get absent sessions for this student that don't have a makeup linked
      const { data } = await supabase
        .from('sessions')
        .select('id, session_date, start_time, end_time')
        .eq('student_id', studentId)
        .eq('attendance_status', 'absent')
        .is('original_session_id', null)
        .order('session_date', { ascending: false })
        .limit(20)

      setMissedSessions((data as MissedSession[]) || [])
    }

    loadMissedSessions()
  }, [studentId, attendanceStatus, supabase])

  // Generate full SOAP note with AI
  const handleGenerateFullNote = async () => {
    if (!studentId) {
      alert('Please select a student first')
      return
    }

    setGeneratingNote(true)
    setAiWarnings([])

    try {
      const response = await fetch('/api/ai/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline: selectedStudent?.discipline || discipline,
          studentName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : undefined,
          goals: goals.map(g => ({ description: g.description, domain: g.domain })),
          sessionDate,
          attendanceStatus,
          noteFormat,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate note')

      const data = await response.json()

      if (noteFormat === 'soap') {
        setSubjective(data.subjective || '')
        setObjective(data.objective || '')
        setAssessment(data.assessment || '')
        setPlan(data.plan || '')
      } else {
        setNarrativeNotes(data.narrative || '')
      }

      if (data.warnings) {
        setAiWarnings(data.warnings)
      }
    } catch {
      alert('Failed to generate note. Please try again.')
    } finally {
      setGeneratingNote(false)
    }
  }

  // Analyze note for missing elements
  const analyzeNote = async () => {
    if (noteFormat === 'soap' && (!subjective || !objective || !assessment || !plan)) {
      return // Don't analyze incomplete notes
    }

    try {
      const response = await fetch('/api/ai/analyze-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteFormat,
          subjective,
          objective,
          assessment,
          plan,
          narrativeNotes,
          discipline: selectedStudent?.discipline || discipline,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.warnings?.length > 0) {
          setAiWarnings(data.warnings)
        }
      }
    } catch {
      // Silent fail for analysis
    }
  }

  const saveGoalProgress = async (sessionId: string) => {
    // Delete existing progress for this session
    await supabase
      .from('session_goals')
      .delete()
      .eq('session_id', sessionId)

    // Insert new progress data
    const progressToSave = goalProgress.filter(p => p.progressValue !== null || p.notes)
    if (progressToSave.length > 0) {
      await (supabase
        .from('session_goals') as ReturnType<typeof supabase.from>)
        .insert(
          progressToSave.map(p => ({
            session_id: sessionId,
            goal_id: p.goalId,
            progress_value: p.progressValue,
            progress_unit: p.progressUnit,
            notes: p.notes || null,
          })) as never
        )
    }
  }

  const handleSaveDraft = async () => {
    if (!studentId) {
      alert('Please select a student')
      return
    }

    setLoading(true)

    const sessionData = {
      student_id: studentId,
      therapist_id: therapistId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      attendance_status: attendanceStatus as 'present' | 'absent' | 'makeup' | 'cancelled',
      discipline: selectedStudent?.discipline || discipline,
      subjective: noteFormat === 'soap' ? (subjective || null) : null,
      objective: noteFormat === 'soap' ? (objective || null) : null,
      assessment: noteFormat === 'soap' ? (assessment || null) : null,
      plan: noteFormat === 'soap' ? (plan || null) : null,
      narrative_notes: noteFormat === 'narrative' ? (narrativeNotes || null) : null,
      note_format: noteFormat,
      original_session_id: attendanceStatus === 'makeup' ? originalSessionId : null,
      status: 'draft' as const,
    }

    let sessionId = existingSession?.id

    if (existingSession) {
      const { error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .update(sessionData as never)
        .eq('id', existingSession.id)

      if (error) {
        alert('Error saving: ' + error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .insert(sessionData as never)
        .select('id')
        .single()

      if (error) {
        alert('Error saving: ' + error.message)
        setLoading(false)
        return
      }
      sessionId = (data as { id: string }).id
    }

    // Save goal progress
    if (sessionId) {
      await saveGoalProgress(sessionId)
    }

    setLoading(false)
    router.push('/sessions')
    router.refresh()
  }

  const handleSign = async () => {
    // Validate based on note format
    if (noteFormat === 'soap') {
      if (!subjective || !objective || !assessment || !plan) {
        alert('Please complete all SOAP sections before signing')
        return
      }
    } else {
      if (!narrativeNotes) {
        alert('Please complete the session notes before signing')
        return
      }
    }

    // Run analysis before signing
    await analyzeNote()

    setLoading(true)

    const sessionData = {
      student_id: studentId,
      therapist_id: therapistId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      attendance_status: attendanceStatus as 'present' | 'absent' | 'makeup' | 'cancelled',
      discipline: selectedStudent?.discipline || discipline,
      subjective: noteFormat === 'soap' ? subjective : null,
      objective: noteFormat === 'soap' ? objective : null,
      assessment: noteFormat === 'soap' ? assessment : null,
      plan: noteFormat === 'soap' ? plan : null,
      narrative_notes: noteFormat === 'narrative' ? narrativeNotes : null,
      note_format: noteFormat,
      original_session_id: attendanceStatus === 'makeup' ? originalSessionId : null,
      status: 'signed' as const,
      signed_at: new Date().toISOString(),
    }

    let sessionId = existingSession?.id

    if (existingSession) {
      const { error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .update(sessionData as never)
        .eq('id', existingSession.id)

      if (error) {
        alert('Error signing: ' + error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await (supabase
        .from('sessions') as ReturnType<typeof supabase.from>)
        .insert(sessionData as never)
        .select('id')
        .single()

      if (error) {
        alert('Error signing: ' + error.message)
        setLoading(false)
        return
      }
      sessionId = (data as { id: string }).id
    }

    // Save goal progress
    if (sessionId) {
      await saveGoalProgress(sessionId)
    }

    setLoading(false)
    router.push('/sessions')
    router.refresh()
  }

  const insertText = (text: string) => {
    switch (activeSection) {
      case 'S':
        setSubjective((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'O':
        setObjective((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'A':
        setAssessment((prev) => prev + (prev ? ' ' : '') + text)
        break
      case 'P':
        setPlan((prev) => prev + (prev ? ' ' : '') + text)
        break
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Session Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="student">Student</Label>
                <select
                  id="student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="attendance">Attendance</Label>
                <select
                  id="attendance"
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="makeup">Makeup</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Makeup Session Linking */}
            {attendanceStatus === 'makeup' && studentId && missedSessions.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <Label htmlFor="original-session" className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Link2 className="h-4 w-4" />
                  Link to Missed Session
                </Label>
                <select
                  id="original-session"
                  value={originalSessionId || ''}
                  onChange={(e) => setOriginalSessionId(e.target.value || null)}
                  className="mt-2 flex h-10 w-full rounded-md border border-amber-300 bg-white dark:bg-amber-950/30 px-3 py-2 text-sm"
                >
                  <option value="">Select missed session to link...</option>
                  {missedSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.session_date).toLocaleDateString()} ({session.start_time} - {session.end_time})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Link this makeup session to the original missed session for compliance tracking
                </p>
              </div>
            )}

            {attendanceStatus === 'makeup' && studentId && missedSessions.length === 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  No missed sessions found for this student to link.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Notes */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle>{noteFormat === 'soap' ? 'SOAP Note' : 'Session Notes'}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateFullNote}
                  disabled={generatingNote || !studentId}
                >
                  {generatingNote ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Auto-fill
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {showAIPanel ? 'Hide' : 'Show'} AI
                </Button>
              </div>
            </div>

            {/* Note Format Toggle */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNoteFormat('soap')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    noteFormat === 'soap'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  SOAP Format
                </button>
                <button
                  type="button"
                  onClick={() => setNoteFormat('narrative')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    noteFormat === 'narrative'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  Narrative Format
                </button>
              </div>
            </div>

            {/* AI Warnings */}
            {aiWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Note Review Suggestions</p>
                    <ul className="mt-1 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                      {aiWarnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Narrative Mode */}
            {noteFormat === 'narrative' ? (
              <div>
                <Label htmlFor="narrative" className="text-lg font-semibold">
                  Session Notes
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Document the session in narrative format including observations, interventions, and recommendations
                </p>
                <Textarea
                  id="narrative"
                  placeholder="Student was seen for individual therapy session. During the session..."
                  value={narrativeNotes}
                  onChange={(e) => setNarrativeNotes(e.target.value)}
                  className="min-h-[400px]"
                />
              </div>
            ) : (
              <>
            {/* Subjective */}
            <div>
              <Label
                htmlFor="subjective"
                className={`text-lg font-semibold ${
                  activeSection === 'S' ? 'text-primary' : ''
                }`}
              >
                Subjective
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Student/caregiver reports, concerns, and observations
              </p>
              <Textarea
                id="subjective"
                placeholder="Student reported feeling confident about speech sounds practiced last session..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                onFocus={() => setActiveSection('S')}
                className="min-h-[120px]"
              />
            </div>

            {/* Objective */}
            <div>
              <Label
                htmlFor="objective"
                className={`text-lg font-semibold ${
                  activeSection === 'O' ? 'text-primary' : ''
                }`}
              >
                Objective
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Measurable observations, data, and clinical findings
              </p>
              <Textarea
                id="objective"
                placeholder="Student produced /r/ in initial position with 80% accuracy across 20 trials..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                onFocus={() => setActiveSection('O')}
                className="min-h-[120px]"
              />
            </div>

            {/* Assessment */}
            <div>
              <Label
                htmlFor="assessment"
                className={`text-lg font-semibold ${
                  activeSection === 'A' ? 'text-primary' : ''
                }`}
              >
                Assessment
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Clinical interpretation and progress evaluation
              </p>
              <Textarea
                id="assessment"
                placeholder="Student demonstrates steady progress toward IEP goal. Performance indicates readiness for..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                onFocus={() => setActiveSection('A')}
                className="min-h-[120px]"
              />
            </div>

            {/* Plan */}
            <div>
              <Label
                htmlFor="plan"
                className={`text-lg font-semibold ${
                  activeSection === 'P' ? 'text-primary' : ''
                }`}
              >
                Plan
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Next steps, recommendations, and treatment direction
              </p>
              <Textarea
                id="plan"
                placeholder="Continue targeting /r/ in initial position. Introduce /r/ in medial position next session..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                onFocus={() => setActiveSection('P')}
                className="min-h-[120px]"
              />
            </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSaveDraft} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button onClick={handleSign} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Sign & Complete
          </Button>
        </div>
      </div>

      {/* Right Panel: Goals & AI */}
      {showAIPanel && (
        <div className="lg:col-span-1 space-y-6">
          {/* Goal Progress Tracker */}
          {studentId && (
            <GoalProgressTracker
              goals={goals}
              progress={goalProgress}
              onProgressChange={setGoalProgress}
            />
          )}

          {/* AI Prompts */}
          <AIPromptsPanel
            discipline={selectedStudent?.discipline || discipline}
            activeSection={activeSection}
            onInsert={insertText}
            studentName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : undefined}
            goals={goals.map(g => ({ description: g.description, domain: g.domain }))}
            currentContent={{
              subjective,
              objective,
              assessment,
              plan,
            }}
          />
        </div>
      )}
    </div>
  )
}
