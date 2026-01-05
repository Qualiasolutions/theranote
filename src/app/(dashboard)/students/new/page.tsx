'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const SERVICE_TYPES = [
  { value: 'speech', label: 'Speech-Language Pathology' },
  { value: 'ot', label: 'Occupational Therapy' },
  { value: 'pt', label: 'Physical Therapy' },
  { value: 'counseling', label: 'Counseling/Psychology' },
  { value: 'aba', label: 'Applied Behavior Analysis' },
  { value: 'seit', label: 'Special Education Itinerant Teacher' },
  { value: 'scis', label: 'Special Class Integrated Setting' },
]

const SESSION_FREQUENCIES = [
  { value: '1x/week', label: '1x per week' },
  { value: '2x/week', label: '2x per week' },
  { value: '3x/week', label: '3x per week' },
  { value: '4x/week', label: '4x per week' },
  { value: '5x/week', label: '5x per week' },
]

const SESSION_DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
]

export default function NewStudentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    serviceType: '',
    sessionFrequency: '2x/week',
    sessionDuration: 30,
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single() as { data: { organization_id: string } | null }

      if (!profile?.organization_id) {
        setError('Organization not found')
        return
      }

      // Create student
      const { data: student, error: studentError } = await (supabase
        .from('students') as ReturnType<typeof supabase.from>)
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth || null,
          service_type: formData.serviceType,
          session_frequency: formData.sessionFrequency,
          session_duration: formData.sessionDuration,
          parent_name: formData.parentName || null,
          parent_email: formData.parentEmail || null,
          parent_phone: formData.parentPhone || null,
          address: formData.address || null,
          notes: formData.notes || null,
          organization_id: profile.organization_id,
          status: 'active',
        } as never)
        .select()
        .single() as { data: { id: string } | null; error: Error | null }

      if (studentError || !student) throw studentError || new Error('Failed to create student')

      // Automatically add to current user's caseload
      const { error: caseloadError } = await (supabase
        .from('caseloads') as ReturnType<typeof supabase.from>)
        .insert({
          therapist_id: user.id,
          student_id: student.id,
          status: 'active',
        } as never)

      if (caseloadError) {
        console.error('Failed to add to caseload:', caseloadError)
        // Not critical, continue
      }

      router.push(`/students/${student.id}`)
    } catch (err) {
      console.error('Error creating student:', err)
      setError('Failed to create student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
          <p className="text-muted-foreground">
            Create a new student profile for your caseload
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Basic details about the student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sessionFrequency">Session Frequency</Label>
                <Select
                  value={formData.sessionFrequency}
                  onValueChange={(value) => setFormData({ ...formData, sessionFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionDuration">Session Duration</Label>
                <Select
                  value={formData.sessionDuration.toString()}
                  onValueChange={(value) => setFormData({ ...formData, sessionDuration: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_DURATIONS.map((dur) => (
                      <SelectItem key={dur.value} value={dur.value.toString()}>
                        {dur.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Parent/Guardian Contact</CardTitle>
            <CardDescription>Contact information for the student&apos;s family</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name</Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Phone</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any additional information about the student</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              placeholder="Medical history, behavioral notes, accommodations, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <Link href="/students">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Student
          </Button>
        </div>
      </form>
    </div>
  )
}
