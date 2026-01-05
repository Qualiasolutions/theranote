import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, AlertTriangle, FileText } from 'lucide-react'

export default async function IncidentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // For now, we'll show a placeholder - incidents table would need to be added
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
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safety Concerns</CardTitle>
            <CardDescription>Injuries, falls, medical</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Communication</CardTitle>
            <CardDescription>Parent contacts, escalations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
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
        </CardContent>
      </Card>
    </div>
  )
}
