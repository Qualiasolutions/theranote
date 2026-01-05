import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, AlertTriangle, FileText, Eye } from 'lucide-react'

interface Incident {
  id: string
  incident_type: string
  severity: string
  incident_date: string
  incident_time: string
  description: string
  status: string
  student: { first_name: string; last_name: string } | null
  reporter: { full_name: string } | null
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const TYPE_LABELS: Record<string, string> = {
  behavior: 'Behavior',
  elopement: 'Elopement',
  injury: 'Injury',
  medical: 'Medical',
  safety: 'Safety',
  communication: 'Communication',
}

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', user.id)
    .single() as { data: { org_id: string } | null }

  // Get incidents for this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: incidents } = await supabase
    .from('incidents')
    .select(`
      id,
      incident_type,
      severity,
      incident_date,
      incident_time,
      description,
      status,
      student:students(first_name, last_name),
      reporter:profiles(full_name)
    `)
    .eq('organization_id', userOrg?.org_id || '')
    .order('incident_date', { ascending: false })
    .order('incident_time', { ascending: false }) as { data: Incident[] | null }

  // Calculate stats
  const allIncidents = incidents || []
  const thisMonthIncidents = allIncidents.filter(i =>
    new Date(i.incident_date) >= startOfMonth
  )

  const behaviorCount = thisMonthIncidents.filter(i =>
    ['behavior', 'elopement'].includes(i.incident_type)
  ).length

  const safetyCount = thisMonthIncidents.filter(i =>
    ['injury', 'medical', 'safety'].includes(i.incident_type)
  ).length

  const communicationCount = thisMonthIncidents.filter(i =>
    i.incident_type === 'communication'
  ).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Behavior Incidents</h2>
          <p className="text-muted-foreground">Document and track behavior incidents</p>
        </div>
        <Link href="/incidents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Incident Report
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Incident Documentation
          </CardTitle>
          <CardDescription className="text-amber-600">
            Use this section to document behavior incidents that require tracking and follow-up.
            All incidents are logged with timestamps for compliance purposes.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior Incidents</CardTitle>
            <CardDescription>Tantrums, aggression, elopement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{behaviorCount}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safety Concerns</CardTitle>
            <CardDescription>Injuries, falls, medical</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{safetyCount}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Communication</CardTitle>
            <CardDescription>Parent contacts, escalations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{communicationCount}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Latest documented incidents</CardDescription>
        </CardHeader>
        <CardContent>
          {allIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Student</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-center p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-center p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allIncidents.slice(0, 20).map((incident) => (
                    <tr key={incident.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>{new Date(incident.incident_date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{incident.incident_time}</div>
                      </td>
                      <td className="p-3">
                        {incident.student
                          ? `${incident.student.first_name} ${incident.student.last_name}`
                          : 'Unknown'}
                      </td>
                      <td className="p-3">{TYPE_LABELS[incident.incident_type] || incident.incident_type}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${SEVERITY_COLORS[incident.severity]}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate">{incident.description}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          incident.status === 'closed'
                            ? 'bg-green-100 text-green-700'
                            : incident.status === 'reviewed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/incidents/${incident.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No incidents documented</h3>
              <p className="text-muted-foreground mb-4">
                Behavior incidents will appear here once documented
              </p>
              <Link href="/incidents/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Document First Incident
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
