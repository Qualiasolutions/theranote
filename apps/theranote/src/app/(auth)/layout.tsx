import { FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(var(--sidebar-bg))] relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-lg" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight">
                TheraNote
              </span>
              <div className="flex items-center gap-1 text-[10px] text-white/40 font-medium">
                <Sparkles className="h-2.5 w-2.5" />
                <span>AI-Powered</span>
              </div>
            </div>
          </Link>

          {/* Main content */}
          <div className="flex-1 flex items-center">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-white leading-tight mb-6">
                Clinical documentation,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                  reimagined
                </span>
              </h1>
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                AI-assisted SOAP notes, goal tracking, and compliance management for preschool special education programs.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  'Smart SOAP note generation by discipline',
                  'Real-time goal progress tracking',
                  'HIPAA-compliant documentation',
                  'Automated compliance reporting',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-blue-400" />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/40">
            <p>&copy; {new Date().getFullYear()} TheraNote. Built for therapists, by Qualia Solutions.</p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
