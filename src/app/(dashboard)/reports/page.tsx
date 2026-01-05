import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Calendar, Users } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Generate and export documentation reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Summary Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Session Summary
            </CardTitle>
            <CardDescription>
              Export a summary of all sessions for a date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">From</label>
                <input type="date" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">To</label>
                <input type="date" className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Progress Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Progress Report
            </CardTitle>
            <CardDescription>
              Generate a progress report for a specific student
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Student</label>
              <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                <option>Select a student...</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reporting Period</label>
              <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This school year</option>
                <option>Custom range</option>
              </select>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Report
            </CardTitle>
            <CardDescription>
              Export attendance data for billing and compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Month</label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                  <option>January 2026</option>
                  <option>December 2025</option>
                  <option>November 2025</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                  <option>PDF</option>
                  <option>CSV</option>
                  <option>Excel</option>
                </select>
              </div>
            </div>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Missing Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <FileText className="h-5 w-5" />
              Missing Documentation
            </CardTitle>
            <CardDescription>
              Identify sessions with incomplete or missing notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Check for Missing Docs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
