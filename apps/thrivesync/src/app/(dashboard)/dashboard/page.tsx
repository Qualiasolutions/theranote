import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import {
  Users,
  School,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get basic stats - these will be expanded with ThriveSync-specific tables
  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const stats = [
    { name: 'Total Staff', value: staffCount || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Students', value: studentCount || 0, icon: School, color: 'bg-green-500' },
    { name: 'Compliance Score', value: '87%', icon: CheckCircle, color: 'bg-purple-500' },
    { name: 'Pending Alerts', value: 12, icon: AlertTriangle, color: 'bg-amber-500' },
  ]

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Operations & Compliance Overview"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Credential Alerts */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credential Alerts</h3>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-red-800">3 credentials expired</p>
                  <p className="text-sm text-red-600">Require immediate attention</p>
                </div>
                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">Critical</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div>
                  <p className="font-medium text-amber-800">5 expiring in 30 days</p>
                  <p className="text-sm text-amber-600">Schedule renewals</p>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">Warning</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-medium text-blue-800">8 expiring in 90 days</p>
                  <p className="text-sm text-blue-600">Plan ahead</p>
                </div>
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">Info</span>
              </div>
            </div>
          </div>

          {/* Ratio Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Classroom Ratios</h3>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Room 101 (4410)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">1:6</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Room 102 (CPSE)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">2:12</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Room 103 (ACS)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-600">1:8</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Room 104 (Private)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">2:10</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Overview */}
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">92%</p>
              <p className="text-sm text-gray-600">Staff HR</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">88%</p>
              <p className="text-sm text-gray-600">Article 47</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">76%</p>
              <p className="text-sm text-gray-600">DOHMH</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">95%</p>
              <p className="text-sm text-gray-600">NYSED</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
