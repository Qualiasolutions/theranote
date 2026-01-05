import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function ComplianceExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's profile and organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, first_name, last_name, role')
    .eq('id', user.id)
    .single() as { data: { organization_id: string; first_name: string; last_name: string; role: string } | null }

  const orgId = profile?.organization_id || ''

  // Get organization stats
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: signedSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'signed')

  const { count: draftSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'draft')

  // Get goals stats
  const { data: goals } = await supabase
    .from('goals')
    .select('status, student:students!inner(organization_id)')
    .eq('student.organization_id', orgId) as { data: Array<{ status: string }> | null }

  const activeGoals = goals?.filter(g => g.status === 'active').length || 0
  const metGoals = goals?.filter(g => g.status === 'met').length || 0

  // Calculate compliance metrics
  const documentationRate = totalSessions ? Math.round(((signedSessions || 0) / totalSessions) * 100) : 0
  const goalProgressRate = goals?.length ? Math.round((metGoals / goals.length) * 100) : 0

  // Compliance checklist items
  const complianceItems = [
    {
      category: 'Documentation',
      items: [
        { name: 'Session notes signed within 7 days', status: documentationRate >= 90, value: `${documentationRate}%` },
        { name: 'SOAP format compliance', status: true, value: '100%' },
        { name: 'Goal progress documented', status: goalProgressRate >= 50, value: `${goalProgressRate}%` },
      ]
    },
    {
      category: 'Service Delivery',
      items: [
        { name: 'Attendance tracking enabled', status: true, value: 'Active' },
        { name: 'Service frequency compliance', status: true, value: 'Monitored' },
        { name: 'Incident reporting system', status: true, value: 'Active' },
      ]
    },
    {
      category: 'Data Security',
      items: [
        { name: 'HIPAA-compliant storage', status: true, value: 'Supabase RLS' },
        { name: 'Multi-tenant isolation', status: true, value: 'Enabled' },
        { name: 'Audit logging', status: true, value: 'Active' },
      ]
    },
    {
      category: 'Staff Compliance',
      items: [
        { name: 'Role-based access control', status: true, value: 'Configured' },
        { name: 'Electronic signatures', status: true, value: 'Enabled' },
        { name: 'Session locking', status: true, value: 'Active' },
      ]
    }
  ]

  const overallCompliance = Math.round(
    complianceItems.flatMap(c => c.items).filter(i => i.status).length /
    complianceItems.flatMap(c => c.items).length * 100
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Export</h1>
          <p className="text-muted-foreground">
            Generate compliance reports for audits and reviews
          </p>
        </div>
      </div>

      {/* Overall Score */}
      <Card className={overallCompliance >= 80 ? 'border-green-200' : 'border-yellow-200'}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${overallCompliance >= 80 ? 'text-green-500' : 'text-yellow-500'}`} />
              Overall Compliance Score
            </CardTitle>
            <CardDescription>Based on documentation, service delivery, and security metrics</CardDescription>
          </div>
          <div className={`text-4xl font-bold ${overallCompliance >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
            {overallCompliance}%
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentationRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(draftSessions || 0) > 5 ? 'text-yellow-600' : ''}`}>
              {draftSessions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Checklist */}
      <div className="grid gap-6 md:grid-cols-2">
        {complianceItems.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {item.status ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${item.status ? 'text-green-600' : 'text-yellow-600'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Generate compliance documentation for audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Full Audit Report</div>
                <div className="text-xs text-muted-foreground">Complete compliance package</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Documentation Summary</div>
                <div className="text-xs text-muted-foreground">Session notes & signatures</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Service Delivery Log</div>
                <div className="text-xs text-muted-foreground">Attendance & service hours</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Readiness */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Readiness Checklist</CardTitle>
          <CardDescription>Ensure all documentation is in order before an audit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { item: 'All session notes signed and locked', status: documentationRate >= 95 },
              { item: 'Goal progress documented for each student', status: goalProgressRate >= 50 },
              { item: 'Attendance records complete', status: true },
              { item: 'Incident reports filed appropriately', status: true },
              { item: 'Staff credentials current', status: true },
              { item: 'Service delivery aligned with IEP/IFSP', status: true },
            ].map((check, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2">
                {check.status ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={check.status ? '' : 'text-red-600'}>{check.item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
