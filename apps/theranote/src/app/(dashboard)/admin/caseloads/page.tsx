import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CaseloadManager } from '@/components/admin/caseload-manager'

export default async function CaseloadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Caseload Management</h1>
        <p className="text-muted-foreground">
          Assign students to therapists and manage caseloads
        </p>
      </div>

      <CaseloadManager />
    </div>
  )
}
