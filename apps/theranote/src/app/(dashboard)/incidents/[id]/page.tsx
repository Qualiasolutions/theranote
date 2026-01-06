import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Clock, User, FileText, Bell } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get incident details
  const { data: incident, error } = await (supabase
    .from('incidents') as ReturnType<typeof supabase.from>)
    .select(`
      *,
      student:students(first_name, last_name),
      reporter:profiles(first_name, last_name)
    `)
    .eq('id', id)
    .single() as { data: {
      id: string
      student_id: string
      reporter_id: string
      organization_id: string
      incident_date: string
      incident_time: string
      location: string
      incident_type: string
      severity: string
      antecedent: string
      behavior: string
      consequence: string
      interventions: string | null
      outcome: string
      injuries: boolean
      injury_description: string | null
      parent_notified: boolean
      admin_notified: boolean
      follow_up_required: boolean
      follow_up_notes: string | null
      created_at: string
      student: { first_name: string; last_name: string } | null
      reporter: { first_name: string; last_name: string } | null
    } | null; error: unknown }

  if (error || !incident) {
    notFound()
  }

  const severityColors: Record<string, string> = {
    low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  }

  const typeLabels: Record<string, string> = {
    behavioral: 'Behavioral',
    physical: 'Physical',
    verbal: 'Verbal',
    elopement: 'Elopement',
    self_injury: 'Self-Injury',
    property_damage: 'Property Damage',
    other: 'Other',
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/incidents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Report</h1>
            <p className="text-muted-foreground">
              {incident.student?.first_name} {incident.student?.last_name} •{' '}
              {new Date(incident.incident_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColors[incident.severity] || severityColors.medium}`}>
          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
        </span>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Date & Time
            </div>
            <div className="font-medium">
              {new Date(incident.incident_date).toLocaleDateString()}
              {incident.incident_time && ` at ${incident.incident_time}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" />
              Type
            </div>
            <div className="font-medium">{typeLabels[incident.incident_type] || incident.incident_type}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Location
            </div>
            <div className="font-medium">{incident.location || 'Not specified'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              Reporter
            </div>
            <div className="font-medium">
              {incident.reporter?.first_name} {incident.reporter?.last_name}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABC Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>ABC Analysis</CardTitle>
          <CardDescription>Antecedent - Behavior - Consequence breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">A - Antecedent</h4>
            <p className="p-3 rounded-lg bg-muted">
              {incident.antecedent || 'No antecedent recorded'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">B - Behavior</h4>
            <p className="p-3 rounded-lg bg-muted">
              {incident.behavior || 'No behavior recorded'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">C - Consequence</h4>
            <p className="p-3 rounded-lg bg-muted">
              {incident.consequence || 'No consequence recorded'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interventions & Outcome */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interventions Used</CardTitle>
          </CardHeader>
          <CardContent>
            {incident.interventions ? (
              <p>{incident.interventions}</p>
            ) : (
              <p className="text-muted-foreground">No interventions recorded</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{incident.outcome || 'No outcome recorded'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Injuries */}
      {incident.injuries && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Injury Reported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{incident.injury_description || 'Injury details not provided'}</p>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Parent/Guardian Notified</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                incident.parent_notified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {incident.parent_notified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span>Administrator Notified</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                incident.admin_notified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {incident.admin_notified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up */}
      {incident.follow_up_required && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700">Follow-up Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{incident.follow_up_notes || 'No follow-up notes provided'}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href="/incidents">
          <Button variant="outline">Back to Incidents</Button>
        </Link>
        <Button variant="outline">Print Report</Button>
      </div>
    </div>
  )
}
