import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, User } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get students on therapist's caseload
  const { data: caseloads } = await supabase
    .from('caseloads')
    .select(`
      *,
      student:students(*)
    `)
    .eq('therapist_id', user?.id || '') as { data: Array<{
      student: {
        id: string
        first_name: string
        last_name: string
        date_of_birth: string
        status: string
      }
    }> | null }

  const students = caseloads?.map(c => c.student).filter(Boolean) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Students</h2>
          <p className="text-muted-foreground">Manage your caseload and student information</p>
        </div>
        <Link href="/students/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search students..." className="pl-10" />
      </div>

      {/* Students Grid */}
      {students.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {student.first_name} {student.last_name}
                      </CardTitle>
                      <CardDescription>
                        DOB: {new Date(student.date_of_birth).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : student.status === 'on_hold'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {student.status}
                    </span>
                    <Button variant="ghost" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No students on your caseload</h3>
            <p className="text-muted-foreground mb-4">
              Add students to start documenting sessions
            </p>
            <Link href="/students/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
