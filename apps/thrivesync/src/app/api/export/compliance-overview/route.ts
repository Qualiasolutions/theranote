import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ComplianceItem {
  id: string
  item_name: string
  category: string
  description: string | null
  required: boolean
  frequency: string | null
}

interface ComplianceEvidence {
  id: string
  compliance_item_id: string
  evidence_date: string | null
  expiration_date: string | null
  status: string
  document_url: string | null
}

const categoryNames: Record<string, string> = {
  article_47: 'Article 47 (DOHMH)',
  dohmh: 'DOHMH Requirements',
  nysed: 'NYSED Education',
  hr: 'Staff HR',
  safety: 'Safety Protocols',
  training: 'Training & Certifications',
}

function getComplianceStatus(item: ComplianceItem, evidence: ComplianceEvidence[]): string {
  const itemEvidence = evidence.find(
    (e) => e.compliance_item_id === item.id && e.status === 'approved'
  )

  if (!itemEvidence) return 'missing'

  if (itemEvidence.expiration_date) {
    const expDate = new Date(itemEvidence.expiration_date)
    const today = new Date()
    const thirtyDays = new Date()
    thirtyDays.setDate(today.getDate() + 30)

    if (expDate < today) return 'expired'
    if (expDate <= thirtyDays) return 'expiring_soon'
  }

  return 'compliant'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all compliance items
  const { data: itemsRaw } = await supabase
    .from('compliance_items')
    .select('*')
    .order('category')
    .order('item_name')

  const items = (itemsRaw || []) as ComplianceItem[]

  // Fetch all approved evidence
  const { data: evidenceRaw } = await supabase
    .from('compliance_evidence')
    .select('*')

  const evidence = (evidenceRaw || []) as ComplianceEvidence[]

  // CSV headers
  const headers = [
    'Category',
    'Item Name',
    'Description',
    'Required',
    'Frequency',
    'Status',
    'Evidence Date',
    'Expiration Date',
  ]

  // Build rows
  const rows = items.map((item) => {
    const itemEvidence = evidence.find(
      (e) => e.compliance_item_id === item.id && e.status === 'approved'
    )
    const status = getComplianceStatus(item, evidence)

    return [
      categoryNames[item.category] || item.category,
      item.item_name,
      item.description || '',
      item.required ? 'Yes' : 'No',
      item.frequency || 'N/A',
      status.replace(/_/g, ' ').toUpperCase(),
      itemEvidence?.evidence_date || '',
      itemEvidence?.expiration_date || '',
    ]
  })

  // Calculate summary by category
  const categoryStats: Record<string, { total: number; compliant: number; expired: number; missing: number }> = {}

  items.forEach((item) => {
    const status = getComplianceStatus(item, evidence)
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { total: 0, compliant: 0, expired: 0, missing: 0 }
    }
    categoryStats[item.category].total++
    if (status === 'compliant' || status === 'expiring_soon') categoryStats[item.category].compliant++
    if (status === 'expired') categoryStats[item.category].expired++
    if (status === 'missing') categoryStats[item.category].missing++
  })

  // Add summary rows
  rows.push([])
  rows.push(['COMPLIANCE SUMMARY', '', '', '', '', '', '', ''])
  rows.push(['Report Generated:', new Date().toISOString().split('T')[0], '', '', '', '', '', ''])
  rows.push([])

  Object.entries(categoryStats).forEach(([category, stats]) => {
    const score = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 100
    rows.push([
      categoryNames[category] || category,
      `${stats.compliant}/${stats.total} compliant`,
      `${score}% score`,
      `${stats.expired} expired`,
      `${stats.missing} missing`,
      '', '', '',
    ])
  })

  // Overall totals
  const totalItems = Object.values(categoryStats).reduce((sum, s) => sum + s.total, 0)
  const totalCompliant = Object.values(categoryStats).reduce((sum, s) => sum + s.compliant, 0)
  const overallScore = totalItems > 0 ? Math.round((totalCompliant / totalItems) * 100) : 100

  rows.push([])
  rows.push(['OVERALL', `${totalCompliant}/${totalItems} compliant`, `${overallScore}% score`, '', '', '', '', ''])

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `compliance-overview-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
