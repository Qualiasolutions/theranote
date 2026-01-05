import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, Brain, Shield, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TheraNote</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
            AI-Assisted Clinical Documentation for{' '}
            <span className="text-primary">Special Education</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete session notes in under 5 minutes. Built for Speech, OT, PT, ABA, and Counseling providers
            serving 4410 and early childhood programs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-primary" />}
            title="AI-Assisted, Human-Authored"
            description="Smart prompts help you write faster. You remain the clinical author of record."
          />
          <FeatureCard
            icon={<Clock className="h-10 w-10 text-primary" />}
            title="5-Minute Notes"
            description="Complete SOAP notes in under 5 minutes with discipline-specific templates."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary" />}
            title="Compliance-First"
            description="Built for NYSED, DOE, Medicaid, and HIPAA requirements."
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary" />}
            title="Auto Goal Tracking"
            description="Progress reports write themselves with automatic goal tracking."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 TheraNote by Qualia Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
