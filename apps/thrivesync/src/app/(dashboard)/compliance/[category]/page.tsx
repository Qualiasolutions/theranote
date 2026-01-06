import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ComplianceScore } from '@/components/compliance/compliance-score'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { EvidenceUploadForm } from './evidence-upload-form'
import type {
  ComplianceItem,
  ComplianceEvidence,
  ComplianceAlert,
  Profile,
} from '@repo/database/types'

// Category definitions
const categoryConfig: Record<string, { name: string; icon: string; description: string }> = {
  article_47: {
    name: 'Article 47',
    icon: '📋',
    description: 'NYC DOHMH Article 47 daycare regulations for group child care programs',
  },
  dohmh: {
    name: 'DOHMH',
    icon: '🏥',
    description: 'NYC Department of Health and Mental Hygiene requirements',
  },
  nysed: {
    name: 'NYSED',
    icon: '🎓',
    description: 'New York State Education Department compliance requirements',
  },
  hr: {
    name: 'Staff HR',
    icon: '👥',
    description: 'Employee documentation, clearances, and personnel files',
  },
  safety: {
    name: 'Safety',
    icon: '🛡️',
    description: 'Safety protocols, fire drills, and emergency procedures',
  },
  training: {
    name: 'Training',
    icon: '📚',
    description: 'Staff certifications and professional development requirements',
  },
}

// Extended types for joined data
type EvidenceWithProfiles = ComplianceEvidence & {
  uploaded_by_profile: Pick<Profile, 'full_name'> | null
  reviewed_by_profile: Pick<Profile, 'full_name'> | null
}

type ItemStatus = 'compliant' | 'pending' | 'expired' | 'missing'

type ItemWithStatus = ComplianceItem & {
  evidence: EvidenceWithProfiles[]
  latestEvidence: EvidenceWithProfiles | undefined
  alerts: ComplianceAlert[]
  status: ItemStatus
}

interface PageProps {
  params: Promise<{ category: string }>
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { category } = await params
  const config = categoryConfig[category]

  if (!config) {
    notFound()
  }

  const supabase = await createClient()

  // Fetch compliance items for this category
  const { data: itemsRaw } = await supabase
    .from('compliance_items')
    .select('*')
    .eq('category', category)
    .order('item_name')

  const items = (itemsRaw || []) as ComplianceItem[]

  // Fetch evidence for items in this category
  const itemIds = items.map((item) => item.id)
  const { data: evidenceRaw } = await supabase
    .from('compliance_evidence')
    .select(`
      *,
      uploaded_by_profile:profiles!compliance_evidence_uploaded_by_fkey(full_name),
      reviewed_by_profile:profiles!compliance_evidence_reviewed_by_fkey(full_name)
    `)
    .in('compliance_item_id', itemIds.length > 0 ? itemIds : [''])
    .order('created_at', { ascending: false })

  const evidence = (evidenceRaw || []) as EvidenceWithProfiles[]

  // Fetch alerts for this category
  const { data: alertsRaw } = await supabase
    .from('compliance_alerts')
    .select('*')
    .in('compliance_item_id', itemIds.length > 0 ? itemIds : [''])
    .eq('resolved', false)

  const alerts = (alertsRaw || []) as ComplianceAlert[]

  // Calculate stats
  const totalItems = items.length
  const compliantItems = items.filter((item) => {
    const itemEvidence = evidence.find(
      (e) =>
        e.compliance_item_id === item.id &&
        e.status === 'approved' &&
        (!e.expiration_date || new Date(e.expiration_date) > new Date())
    )
    return !!itemEvidence
  }).length

  const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100

  // Group items by status
  const itemsWithStatus: ItemWithStatus[] = items.map((item) => {
    const itemEvidence = evidence.filter((e) => e.compliance_item_id === item.id)
    const latestEvidence = itemEvidence[0]
    const itemAlerts = alerts.filter((a) => a.compliance_item_id === item.id)

    let status: ItemStatus = 'missing'

    if (latestEvidence) {
      if (latestEvidence.status === 'approved') {
        if (
          latestEvidence.expiration_date &&
          new Date(latestEvidence.expiration_date) < new Date()
        ) {
          status = 'expired'
        } else {
          status = 'compliant'
        }
      } else if (latestEvidence.status === 'pending') {
        status = 'pending'
      }
    }

    return {
      ...item,
      evidence: itemEvidence,
      latestEvidence,
      alerts: itemAlerts,
      status,
    }
  })

  const statusOrder: ItemStatus[] = ['expired', 'missing', 'pending', 'compliant']
  const sortedItems = itemsWithStatus.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  )

  return (
    <>
      <Header title={config.name} subtitle={config.description} />

      <div className="p-6 space-y-6">
        {/* Back link and header */}
        <div className="flex items-center justify-between">
          <Link
            href="/compliance"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Compliance Dashboard
          </Link>
        </div>

        {/* Score overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{config.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
                    <p className="text-gray-500">{config.description}</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                    <p className="text-sm text-gray-500">Total Items</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{compliantItems}</p>
                    <p className="text-sm text-gray-500">Compliant</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">
                      {totalItems - compliantItems}
                    </p>
                    <p className="text-sm text-gray-500">Need Attention</p>
                  </div>
                </div>
              </div>
              <ComplianceScore score={score} size="md" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-xl bg-white p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Compliant
                </span>
                <span className="font-medium">
                  {itemsWithStatus.filter((i) => i.status === 'compliant').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending Review
                </span>
                <span className="font-medium">
                  {itemsWithStatus.filter((i) => i.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Expired
                </span>
                <span className="font-medium">
                  {itemsWithStatus.filter((i) => i.status === 'expired').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Missing
                </span>
                <span className="font-medium">
                  {itemsWithStatus.filter((i) => i.status === 'missing').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="rounded-xl bg-white shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Compliance Items</h3>
          </div>
          <div className="divide-y">
            {sortedItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {item.status === 'compliant' && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      {item.status === 'pending' && (
                        <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      )}
                      {item.status === 'expired' && (
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      {item.status === 'missing' && (
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Evidence info */}
                    {item.latestEvidence && (
                      <div className="mt-3 ml-8 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">
                              Uploaded:{' '}
                              {new Date(item.latestEvidence.created_at!).toLocaleDateString()}
                            </span>
                            {item.latestEvidence.expiration_date && (
                              <span
                                className={`flex items-center gap-1 ${
                                  new Date(item.latestEvidence.expiration_date) < new Date()
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                <Calendar className="h-3 w-3" />
                                Expires:{' '}
                                {new Date(
                                  item.latestEvidence.expiration_date
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {item.latestEvidence.document_url && (
                            <a
                              href={item.latestEvidence.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                            >
                              View Document <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              item.latestEvidence.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : item.latestEvidence.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {item.latestEvidence.status}
                          </span>
                          {item.latestEvidence.notes && (
                            <span className="text-xs text-gray-500">
                              {item.latestEvidence.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    {item.alerts.length > 0 && (
                      <div className="mt-2 ml-8">
                        {item.alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 mr-2 ${
                              alert.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {alert.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.required && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        Required
                      </span>
                    )}
                    {item.frequency && (
                      <span className="text-xs text-gray-400">{item.frequency}</span>
                    )}
                    <EvidenceUploadForm itemId={item.id} itemName={item.item_name} />
                  </div>
                </div>
              </div>
            ))}

            {sortedItems.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No compliance items found for this category</p>
                <p className="text-sm">Items will appear here when added by an administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Force dynamic rendering since this page requires Supabase data
export const dynamic = 'force-dynamic'
