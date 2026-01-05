import { Header } from '@/components/layout/header'
import { FileText, Download, Calendar, Users, DollarSign, ShieldCheck } from 'lucide-react'

export default function ReportsPage() {
  const reports = [
    {
      category: 'Staff',
      items: [
        { name: 'Staff Roster', description: 'Complete list of all staff members', icon: Users },
        { name: 'Credential Status', description: 'Expiring and expired credentials', icon: ShieldCheck },
        { name: 'Attendance Summary', description: 'Staff attendance and lateness', icon: Calendar },
      ]
    },
    {
      category: 'Compliance',
      items: [
        { name: 'Compliance Overview', description: 'All compliance categories', icon: ShieldCheck },
        { name: 'Article 47 Report', description: 'DOHMH compliance status', icon: FileText },
        { name: 'Audit Binder', description: 'Complete audit documentation', icon: FileText },
      ]
    },
    {
      category: 'Financial',
      items: [
        { name: 'Expense Report', description: 'Monthly expense breakdown', icon: DollarSign },
        { name: 'Cost Allocation', description: 'Direct vs non-direct costs', icon: DollarSign },
        { name: 'CFR Summary', description: 'Consolidated fiscal report data', icon: FileText },
      ]
    },
  ]

  return (
    <>
      <Header
        title="Reports"
        subtitle="Generate and export operational reports"
      />

      <div className="p-6 space-y-6">
        {/* Quick Generate */}
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Quick Report Generator</h3>
          <p className="text-purple-200 mb-4">Generate common reports with one click</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
              Weekly Summary
            </button>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
              Monthly Compliance
            </button>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
              Staff Credentials
            </button>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
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
                <div key={report.name} className="rounded-xl bg-white p-6 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <report.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <button className="text-gray-400 hover:text-purple-600">
                      <Download className="h-5 w-5" />
                    </button>
                  </div>
                  <h4 className="font-semibold mt-4">{report.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <div className="mt-4 flex gap-2">
                    <button className="text-sm text-purple-600 hover:text-purple-700">
                      Preview
                    </button>
                    <span className="text-gray-300">|</span>
                    <button className="text-sm text-gray-600 hover:text-gray-700">
                      Export CSV
                    </button>
                    <span className="text-gray-300">|</span>
                    <button className="text-sm text-gray-600 hover:text-gray-700">
                      Export PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
