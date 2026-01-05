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
  notes: string | null
}

function getComplianceStatus(item: ComplianceItem, evidence: ComplianceEvidence[]): {
  status: string
  evidence: ComplianceEvidence | null
} {
  const itemEvidence = evidence.find(
    (e) => e.compliance_item_id === item.id && e.status === 'approved'
  )

  if (!itemEvidence) return { status: 'MISSING', evidence: null }

  if (itemEvidence.expiration_date) {
    const expDate = new Date(itemEvidence.expiration_date)
    const today = new Date()
    const thirtyDays = new Date()
    thirtyDays.setDate(today.getDate() + 30)

    if (expDate < today) return { status: 'EXPIRED', evidence: itemEvidence }
    if (expDate <= thirtyDays) return { status: 'EXPIRING SOON', evidence: itemEvidence }
  }

  return { status: 'COMPLIANT', evidence: itemEvidence }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch Article 47 compliance items only
  const { data: itemsRaw } = await supabase
    .from('compliance_items')
    .select('*')
    .eq('category', 'article_47')
    .order('item_name')

  const items = (itemsRaw || []) as ComplianceItem[]

  // Fetch all evidence
  const { data: evidenceRaw } = await supabase
    .from('compliance_evidence')
    .select('*')

  const evidence = (evidenceRaw || []) as ComplianceEvidence[]

  // CSV headers - NYC DOE/DOHMH Article 47 format
  const headers = [
    'Item #',
    'Requirement',
    'Description',
    'Required',
    'Review Frequency',
    'Compliance Status',
    'Evidence Date',
    'Expiration Date',
    'Document URL',
    'Notes',
    'Action Required',
  ]

  // Build rows
  const rows = items.map((item, index) => {
    const { status, evidence: itemEvidence } = getComplianceStatus(item, evidence)

    let actionRequired = ''
    if (status === 'MISSING') actionRequired = 'Upload evidence documentation'
    if (status === 'EXPIRED') actionRequired = 'Renew expired documentation'
    if (status === 'EXPIRING SOON') actionRequired = 'Schedule renewal before expiration'

    return [
      (index + 1).toString(),
      item.item_name,
      item.description || '',
      item.required ? 'Mandatory' : 'Optional',
      item.frequency || 'Annual',
      status,
      itemEvidence?.evidence_date || '',
      itemEvidence?.expiration_date || '',
      itemEvidence?.document_url || '',
      itemEvidence?.notes || '',
      actionRequired,
    ]
  })

  // Calculate summary
  let compliantCount = 0
  let expiringCount = 0
  let expiredCount = 0
  let missingCount = 0

  items.forEach((item) => {
    const { status } = getComplianceStatus(item, evidence)
    if (status === 'COMPLIANT') compliantCount++
    if (status === 'EXPIRING SOON') expiringCount++
    if (status === 'EXPIRED') expiredCount++
    if (status === 'MISSING') missingCount++
  })

  const totalItems = items.length
  const compliantWithExpiring = compliantCount + expiringCount
  const complianceScore = totalItems > 0 ? Math.round((compliantWithExpiring / totalItems) * 100) : 100

  // Add summary rows
  rows.push([])
  rows.push(['ARTICLE 47 COMPLIANCE REPORT', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Report Generated:', new Date().toISOString().split('T')[0], '', '', '', '', '', '', '', '', ''])
  rows.push(['Organization:', '', '', '', '', '', '', '', '', '', ''])
  rows.push([])
  rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', ''])
  rows.push(['Total Requirements:', totalItems.toString(), '', '', '', '', '', '', '', '', ''])
  rows.push(['Compliant:', compliantCount.toString(), '', '', '', '', '', '', '', '', ''])
  rows.push(['Expiring Soon (30 days):', expiringCount.toString(), '', '', '', '', '', '', '', '', ''])
  rows.push(['Expired:', expiredCount.toString(), '', '', '', '', '', '', '', '', ''])
  rows.push(['Missing Documentation:', missingCount.toString(), '', '', '', '', '', '', '', '', ''])
  rows.push(['Compliance Score:', `${complianceScore}%`, '', '', '', '', '', '', '', '', ''])
  rows.push([])
  rows.push(['Note: This report covers NYC DOHMH Article 47 Day Care Regulations compliance.', '', '', '', '', '', '', '', '', '', ''])

  // Convert to CSV
  const csv = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `article-47-report-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
