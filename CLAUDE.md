# CLAUDE.md - TheraNote

## Project Overview

TheraNote is an AI-assisted clinical documentation platform for preschool special-education programs (4410, early intervention, CPSE).

**Built by:** Qualia Solutions
**Purpose:** Functional demo for prospective client
**Phase:** MVP - TheraNote (clinical documentation)

## Tech Stack

- **Framework:** Next.js 15+ (App Router, React 19, TypeScript)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Google Gemini for text assistance
- **Deployment:** Vercel

## Key Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run linting
pnpm type-check       # TypeScript check
```

## Database Setup

1. Create a Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Copy `.env.local.example` to `.env.local` and fill in credentials

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup pages
│   ├── (dashboard)/      # Protected app pages
│   └── api/              # API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Header, sidebar
│   └── sessions/         # SOAP editor, AI prompts
├── lib/
│   └── supabase/         # Supabase clients
├── types/
│   └── database.ts       # TypeScript types
└── hooks/                # Custom React hooks
```

## Core Entities

- **Organization** - Multi-tenant root
- **Site** - Location within org
- **Student** - Children receiving services
- **Goal** - IEP/IFSP goals
- **Session** - Session notes (SOAP format)
- **Caseload** - Therapist-student assignments

## Key Features (MVP)

1. User auth with role-based access
2. Student management
3. SOAP note editor with AI prompts
4. Goal tracking
5. Basic reporting
6. Admin dashboard

## Security

- HIPAA-compliant (Supabase SOC2)
- Row-Level Security on all tables
- No PHI sent to AI services
- Audit logging enabled

## AI Integration

AI provides formatting assistance only:
- Smart prompts by discipline
- Clinical vocabulary suggestions
- Compliance validation

**Critical:** AI never generates clinical observations - therapist inputs all content.

## Related Documents

- `_bmad-output/planning-artifacts/product-brief-theranote-2026-01-05.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
