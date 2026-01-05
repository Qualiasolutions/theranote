'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, CheckCircle } from 'lucide-react'

interface InviteFormProps {
  organizationId: string
  invitedById: string
}

const ROLES = [
  { value: 'therapist', label: 'Therapist', description: 'Can document sessions and manage their caseload' },
  { value: 'admin', label: 'Administrator', description: 'Full access to manage users and settings' },
  { value: 'billing', label: 'Billing', description: 'Access to reports and billing information' },
]

const DISCIPLINES = [
  { value: 'speech', label: 'Speech-Language Pathology' },
  { value: 'ot', label: 'Occupational Therapy' },
  { value: 'pt', label: 'Physical Therapy' },
  { value: 'aba', label: 'Applied Behavior Analysis' },
  { value: 'counseling', label: 'Counseling/Psychology' },
  { value: 'seit', label: 'Special Education (SEIT)' },
  { value: 'scis', label: 'Special Class (SCIS)' },
]

export function InviteForm({ organizationId, invitedById }: InviteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('therapist')
  const [discipline, setDiscipline] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter an email address')
      return
    }

    if (role === 'therapist' && !discipline) {
      setError('Please select a discipline for therapists')
      return
    }

    setLoading(true)

    try {
      // Check if user is already in the organization
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single() as { data: { id: string } | null }

      if (existingUser) {
        // Check if already in org
        const { data: existingMembership } = await supabase
          .from('user_organizations')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('org_id', organizationId)
          .single() as { data: { id: string } | null }

        if (existingMembership) {
          setError('This user is already a member of your organization')
          setLoading(false)
          return
        }
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single() as { data: { id: string } | null }

      if (existingInvite) {
        setError('An invitation has already been sent to this email')
        setLoading(false)
        return
      }

      // Create invitation
      const { error: insertError } = await (supabase
        .from('invitations') as ReturnType<typeof supabase.from>)
        .insert({
          organization_id: organizationId,
          email,
          role,
          discipline: role === 'therapist' ? discipline : null,
          invited_by: invitedById,
        } as never)

      if (insertError) {
        throw insertError
      }

      setSuccess(true)

      // In production, this would also send an email
      // For now, we just show success

      setTimeout(() => {
        router.push('/admin/settings')
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Error creating invitation:', err)
      setError('Failed to send invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3 className="text-lg font-medium mb-2">Invitation Sent!</h3>
        <p className="text-muted-foreground">
          An invitation has been sent to {email}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="role">Role *</Label>
        <div className="space-y-2 mt-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                role === r.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{r.label}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {role === 'therapist' && (
        <div>
          <Label htmlFor="discipline">Discipline *</Label>
          <select
            id="discipline"
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
            required
          >
            <option value="">Select a discipline...</option>
            {DISCIPLINES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Invitation
        </Button>
      </div>
    </form>
  )
}
