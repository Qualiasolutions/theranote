'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import {
  FileText,
  Download,
  Calendar,
  Users,
  DollarSign,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

type ReportEndpoint = 'staff-roster' | 'credentials' | 'attendance' | 'expenses' | null

interface ReportItem {
  name: string
  description: string
  icon: typeof Users
  endpoint: ReportEndpoint
}

interface ReportCategory {
  category: string
  items: ReportItem[]
}

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null)

  const reports: ReportCategory[] = [
    {
      category: 'Staff',
      items: [
        {
          name: 'Staff Roster',
          description: 'Complete list of all staff members',
          icon: Users,
          endpoint: 'staff-roster',
        },
        {
          name: 'Credential Status',
          description: 'Expiring and expired credentials',
          icon: ShieldCheck,
          endpoint: 'credentials',
        },
        {
          name: 'Attendance Summary',
          description: 'Staff attendance and lateness',
          icon: Calendar,
          endpoint: 'attendance',
        },
      ],
    },
    {
      category: 'Compliance',
      items: [
        {
          name: 'Compliance Overview',
          description: 'All compliance categories',
          icon: ShieldCheck,
          endpoint: null,
        },
        {
          name: 'Article 47 Report',
          description: 'DOHMH compliance status',
          icon: FileText,
          endpoint: null,
        },
        {
          name: 'Audit Binder',
          description: 'Complete audit documentation',
          icon: FileText,
          endpoint: null,
        },
      ],
    },
    {
      category: 'Financial',
      items: [
        {
          name: 'Expense Report',
          description: 'Monthly expense breakdown',
          icon: DollarSign,
          endpoint: 'expenses',
        },
        {
          name: 'Cost Allocation',
          description: 'Direct vs non-direct costs',
          icon: DollarSign,
          endpoint: null,
        },
        {
          name: 'CFR Summary',
          description: 'Consolidated fiscal report data',
          icon: FileText,
          endpoint: null,
        },
      ],
    },
  ]

  const exportCSV = async (endpoint: ReportEndpoint, reportName: string) => {
    if (!endpoint) {
      alert('This report is not yet available')
      return
    }

    setExporting(reportName)

    try {
      const response = await fetch(`/api/export/${endpoint}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${endpoint}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Failed to export report: ' + (error as Error).message)
    }

    setExporting(null)
  }

  const quickExport = async (type: string) => {
    const endpointMap: Record<string, ReportEndpoint> = {
      'Staff Credentials': 'credentials',
      'Weekly Summary': 'attendance',
      'Expense Report': 'expenses',
    }

    const endpoint = endpointMap[type]
    if (endpoint) {
      await exportCSV(endpoint, type)
    } else {
      alert('This quick export is coming soon')
    }
  }

  return (
    <>
      <Header title="Reports" subtitle="Generate and export operational reports" />

      <div className="p-6 space-y-6">
        {/* Quick Generate */}
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Quick Report Generator</h3>
          <p className="text-purple-200 mb-4">Generate common reports with one click</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => quickExport('Weekly Summary')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'Weekly Summary' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Weekly Summary'
              )}
            </button>
            <button
              onClick={() => quickExport('Monthly Compliance')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Monthly Compliance
            </button>
            <button
              onClick={() => quickExport('Staff Credentials')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'Staff Credentials' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Staff Credentials'
              )}
            </button>
            <button
              onClick={() => quickExport('CFR Data Export')}
              disabled={exporting !== null}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              CFR Data Export
            </button>
          </div>
        </div>

        {/* Report Categories */}
        {reports.map((category) => (
          <div key={category.category}>
            <h3 className="text-lg font-semibold mb-4">{category.category} Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.items.map((report) => (
                <div
                  key={report.name}
                  className="rounded-xl bg-white p-6 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <report.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <button
                      onClick={() => exportCSV(report.endpoint, report.name)}
                      disabled={exporting !== null || !report.endpoint}
                      className="text-gray-400 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exporting === report.name ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <h4 className="font-semibold mt-4">{report.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
                      disabled={!report.endpoint}
                    >
                      Preview
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => exportCSV(report.endpoint, report.name)}
                      disabled={exporting !== null || !report.endpoint}
                      className="text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exporting === report.name ? 'Exporting...' : 'Export CSV'}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      className="text-sm text-gray-400 cursor-not-allowed"
                      disabled
                      title="PDF export coming soon"
                    >
                      Export PDF
                    </button>
                  </div>
                  {!report.endpoint && (
                    <p className="text-xs text-amber-600 mt-2">Coming soon</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
