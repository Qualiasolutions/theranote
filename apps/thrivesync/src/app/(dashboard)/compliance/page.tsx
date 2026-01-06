import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ComplianceScore } from '@/components/compliance/compliance-score'
import { AlertCard } from '@/components/compliance/alert-card'
import Link from 'next/link'
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  Clock,
  ChevronRight,
  Upload,
  ClipboardList,
} from 'lucide-react'
import type {
  ComplianceItem,
  ComplianceEvidence,
  ComplianceAlert,
} from '@repo/database/types'

// Category definitions with icons and display names
const categoryConfig: Record<string, { name: string; icon: string; description: string }> = {
  article_47: { name: 'Article 47', icon: '📋', description: 'DOHMH daycare regulations' },
  dohmh: { name: 'DOHMH', icon: '🏥', description: 'Health department requirements' },
  nysed: { name: 'NYSED', icon: '🎓', description: 'Education department compliance' },
  hr: { name: 'Staff HR', icon: '👥', description: 'Employee documentation' },
  safety: { name: 'Safety', icon: '🛡️', description: 'Safety protocols & drills' },
  training: { name: 'Training', icon: '📚', description: 'Staff certifications' },
}

// Extended alert type with joined compliance_item
type AlertWithItem = ComplianceAlert & {
  compliance_item: { item_name: string; category: string } | null
}

export default async function CompliancePage() {
  const supabase = await createClient()

  // Fetch all compliance items
  const { data: complianceItemsRaw } = await supabase
    .from('compliance_items')
    .select('*')
    .order('category')

  const complianceItems = (complianceItemsRaw || []) as ComplianceItem[]

  // Fetch all evidence to determine compliance status
  const { data: evidenceRaw } = await supabase
    .from('compliance_evidence')
    .select('*')
    .eq('status', 'approved')

  const evidence = (evidenceRaw || []) as ComplianceEvidence[]

  // Fetch active alerts (not resolved)
  const { data: alertsRaw } = await supabase
    .from('compliance_alerts')
    .select(`
      *,
      compliance_item:compliance_items(item_name, category)
    `)
    .eq('resolved', false)
    .order('severity', { ascending: true })
    .order('due_date', { ascending: true })
    .limit(10)

  const alerts = (alertsRaw || []) as AlertWithItem[]

  // Calculate compliance by category
  const categoryStats = Object.keys(categoryConfig).map((category) => {
    const categoryItems = complianceItems.filter((item) => item.category === category)
    const totalItems = categoryItems.length

    // Count items with valid evidence
    const compliantItems = categoryItems.filter((item) => {
      const itemEvidence = evidence.find(
        (e) => e.compliance_item_id === item.id && e.status === 'approved'
      )
      // Check if evidence exists and hasn't expired
      if (!itemEvidence) return false
      if (itemEvidence.expiration_date) {
        return new Date(itemEvidence.expiration_date) > new Date()
      }
      return true
    }).length

    const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100

    return {
      category,
      ...categoryConfig[category],
      totalItems,
      compliantItems,
      score,
    }
  })

  // Calculate overall score
  const totalItems = categoryStats.reduce((sum, cat) => sum + cat.totalItems, 0)
  const totalCompliant = categoryStats.reduce((sum, cat) => sum + cat.compliantItems, 0)
  const overallScore = totalItems > 0 ? Math.round((totalCompliant / totalItems) * 100) : 100

  // Count alerts by severity
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length
  const warningAlerts = alerts.filter((a) => a.severity === 'warning').length
  const infoAlerts = alerts.filter((a) => a.severity === 'info').length
  const needsAttention = totalItems - totalCompliant

  return (
    <>
      <Header
        title="Compliance Dashboard"
        subtitle="Monitor and manage regulatory compliance"
      />

      <div className="p-6 space-y-6">
        {/* Overall Score Section */}
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200">Overall Compliance Score</p>
              <p className="text-5xl font-bold mt-2">{overallScore}%</p>
              <p className="text-purple-200 mt-1">
                {needsAttention > 0
                  ? `${needsAttention} items need attention`
                  : 'All items compliant'}
              </p>
              <div className="flex items-center gap-4 mt-4">
                {criticalAlerts > 0 && (
                  <span className="flex items-center gap-1 text-sm bg-red-500/20 px-2 py-1 rounded">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    {criticalAlerts} critical
                  </span>
                )}
                {warningAlerts > 0 && (
                  <span className="flex items-center gap-1 text-sm bg-amber-500/20 px-2 py-1 rounded">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {warningAlerts} warnings
                  </span>
                )}
                {infoAlerts > 0 && (
                  <span className="flex items-center gap-1 text-sm bg-blue-500/20 px-2 py-1 rounded">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    {infoAlerts} info
                  </span>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <ComplianceScore score={overallScore} size="lg" showLabel={false} />
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryStats.map((cat) => (
              <Link
                key={cat.category}
                href={`/compliance/${cat.category}`}
                className="group rounded-xl bg-white p-4 shadow-sm border text-center hover:shadow-md hover:border-purple-200 transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-sm text-gray-500 mt-2">{cat.name}</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    cat.score >= 90
                      ? 'text-green-600'
                      : cat.score >= 70
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {cat.score}%
                </p>
                <p className="text-xs text-gray-400">
                  {cat.compliantItems}/{cat.totalItems} items
                </p>
                <div className="mt-2 flex items-center justify-center text-xs text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alerts */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Compliance Alerts</h3>
              <span className="text-sm text-gray-500">{alerts.length} active</span>
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    className="hover:shadow-sm transition-shadow"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>No active alerts</p>
                <p className="text-sm">All compliance items are up to date</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Compliance Tools</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/compliance/article_47"
                className="p-4 rounded-lg border hover:bg-gray-50 hover:border-purple-200 text-left transition-colors"
              >
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium">Article 47 Checklist</p>
                <p className="text-sm text-gray-500">DOHMH requirements</p>
              </Link>
              <div className="p-4 rounded-lg border bg-gray-50 text-left opacity-60 cursor-not-allowed relative">
                <ShieldCheck className="h-6 w-6 text-gray-400 mb-2" />
                <p className="font-medium text-gray-600">Audit Binder</p>
                <p className="text-sm text-gray-400">Generate reports</p>
                <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Soon</span>
              </div>
              <div className="p-4 rounded-lg border bg-gray-50 text-left opacity-60 cursor-not-allowed relative">
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <p className="font-medium text-gray-600">Evidence Library</p>
                <p className="text-sm text-gray-400">Upload documents</p>
                <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Soon</span>
              </div>
              <Link
                href="/staff"
                className="p-4 rounded-lg border hover:bg-gray-50 hover:border-purple-200 text-left transition-colors"
              >
                <Clock className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium">Expiration Tracker</p>
                <p className="text-sm text-gray-500">Credential alerts</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Upcoming Compliance Deadlines</h3>
            <ClipboardList className="h-5 w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {complianceItems.slice(0, 5).map((item) => {
                  const itemEvidence = evidence.find(
                    (e) => e.compliance_item_id === item.id
                  )
                  const isCompliant = itemEvidence?.status === 'approved'

                  return (
                    <tr key={item.id} className="text-sm">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {categoryConfig[item.category]?.icon}{' '}
                          {categoryConfig[item.category]?.name || item.category}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {itemEvidence?.expiration_date
                          ? new Date(itemEvidence.expiration_date).toLocaleDateString()
                          : 'Not set'}
                      </td>
                      <td className="py-3">
                        {isCompliant ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Clock className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export const dynamic = 'force-dynamic'
