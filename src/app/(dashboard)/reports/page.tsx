import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Download, Calendar, Users, TrendingUp, AlertTriangle, ClipboardList } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Generate and export documentation reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Progress Report - Primary */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Report
            </CardTitle>
            <CardDescription>
              Generate IEP/IFSP progress reports with goal tracking and session summaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/progress">
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Progress Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Log
            </CardTitle>
            <CardDescription>
              Export attendance data for Medicaid billing and DOE compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/attendance">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                View Attendance
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Service Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Service Log
            </CardTitle>
            <CardDescription>
              Monthly service delivery log for billing verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/service-log">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Service Log
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Caseload Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Caseload Summary
            </CardTitle>
            <CardDescription>
              Overview of all students on your caseload with status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/caseload">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Caseload
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Missing Documentation */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Missing Documentation
            </CardTitle>
            <CardDescription>
              Identify sessions with incomplete or missing notes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/missing">
              <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                <FileText className="h-4 w-4 mr-2" />
                Check Missing Docs
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Compliance Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Export
            </CardTitle>
            <CardDescription>
              Export data in DOE/NYSED/Medicaid required formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports/compliance">
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
