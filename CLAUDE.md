# CLAUDE.md - TheraNote

## Project Overview

TheraNote is an AI-assisted clinical documentation platform for preschool special-education programs (4410, early intervention, CPSE).

**Built by:** Qualia Solutions
**Purpose:** Functional demo for prospective client
**Phase:** MVP - TheraNote (clinical documentation)
**Repository:** https://github.com/Qualiasolutions/theranote

## Tech Stack

- **Framework:** Next.js 15.5 (App Router, React 19, TypeScript)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** OpenRouter API (google/gemini-flash-1.5)
- **Deployment:** Vercel

## Key Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # Run linting
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://etxvaajfgigmxoxjimrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Project

- **Project ID:** etxvaajfgigmxoxjimrr
- **Region:** eu-west-1
- **Demo User:** fawzi@qualia.com / Iloverobots1

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root |
| `sites` | Locations within org |
| `profiles` | User accounts (extends auth.users) |
| `students` | Children receiving services |
| `goals` | IEP/IFSP goals |
| `sessions` | Session notes (SOAP format) |
| `session_goals` | Goal progress per session |
| `caseloads` | Therapist-student assignments |
| `incidents` | Behavior incident documentation |
| `invitations` | User invitation system |
| `audit_logs` | Activity tracking |

### Key Relationships
- Organization -> Sites -> Students
- Therapist -> Caseloads -> Students
- Student -> Goals -> Session_Goals
- Session -> Session_Goals
- Student -> Incidents

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Protected app pages
│   │   ├── admin/           # Admin pages (settings, compliance)
│   │   ├── dashboard/       # Main dashboard
│   │   ├── incidents/       # Behavior incidents
│   │   ├── reports/         # Reports (attendance, progress)
│   │   ├── sessions/        # Session notes
│   │   └── students/        # Student management
│   └── api/
│       ├── ai/prompts/      # OpenRouter AI endpoint
│       └── export/          # CSV export endpoints
├── components/
│   ├── ui/                  # shadcn/ui components + motion utilities
│   ├── admin/               # Admin components (invite-form, actions)
│   ├── compliance/          # Compliance alerts component
│   ├── goals/               # Goal components
│   ├── incidents/           # Incident form
│   ├── layout/              # Header, sidebar
│   ├── reports/             # Report generators
│   └── sessions/            # SOAP editor, AI prompts, goal tracker
├── lib/
│   ├── ai/                  # OpenRouter integration
│   ├── compliance/          # Compliance rules engine
│   ├── supabase/            # Supabase clients (server, client, middleware)
│   └── utils.ts             # Utility functions
└── types/
    └── database.ts          # TypeScript types (generated)
```

## Key Features

### Clinical Documentation
- SOAP note editor with discipline-specific AI prompts
- Goal progress tracking per session
- Multiple attendance statuses (present, absent, makeup, cancelled)
- Electronic signature with timestamp

### Goal Management
- IEP/IFSP goal tracking by domain
- Baseline and target criteria
- Progress status (baseline, in_progress, met, discontinued)
- Session-linked progress data

### Behavior Incidents
- ABC analysis (Antecedent, Behavior, Consequence)
- Severity levels (low, medium, high, critical)
- Notification tracking (parent, admin, follow-up)
- Type classification (behavior, elopement, injury, medical, safety, communication)

### Reports
- Attendance logs with CSV export
- Progress reports with goal summaries
- Compliance dashboard for admins

### Admin Tools
- Organization settings
- User invitation system
- Team management
- Security settings

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/prompts` | POST | Generate SOAP prompts via OpenRouter |
| `/api/export/attendance` | GET | Export attendance CSV |
| `/api/export/service-log` | GET | Export service log CSV (NYC DOE format) |
| `/api/export/caseload` | GET | Export caseload summary CSV |
| `/api/export/progress-report` | GET | Export progress report CSV |
| `/api/admin/users/[id]` | DELETE | Remove team member |
| `/api/admin/invitations/[id]` | DELETE | Revoke invitation |

## Disciplines Supported

- Speech-Language Pathology (speech)
- Occupational Therapy (ot)
- Physical Therapy (pt)
- Applied Behavior Analysis (aba)
- Counseling/Psychology (counseling)
- Special Education Itinerant Teacher (seit)
- Special Class Integrated Setting (scis)

## Security

- HIPAA-compliant (Supabase SOC2)
- Row-Level Security on all tables
- No PHI sent to AI services
- Audit logging enabled
- Multi-tenant data isolation via org_id

## AI Integration

Uses OpenRouter API with `google/gemini-flash-1.5` model.

AI provides formatting assistance only:
- Smart prompts by discipline and SOAP section
- Clinical vocabulary suggestions
- Context-aware sentence starters

**Critical:** AI never generates clinical observations - therapist inputs all content.

## Common Development Tasks

### Add a new page
1. Create file in `src/app/(dashboard)/[route]/page.tsx`
2. Use server components for data fetching
3. Add to sidebar navigation in `src/components/layout/sidebar.tsx`

### Add a database table
1. Create migration via `mcp__plugin_supabase_supabase__apply_migration`
2. Add RLS policies
3. Regenerate types: `npx supabase gen types typescript`

### Update TypeScript types for Supabase
When adding tables not in types, use type assertions:
```typescript
const { data } = await supabase
  .from('new_table')
  .insert(data as never)
```

## Related Documents

- `ROADMAP.md` - Feature completion status and upcoming work
- `~/.claude/plans/glittery-cuddling-lemon.md` - Implementation plan (phases, priorities)
- `_bmad-output/planning-artifacts/product-brief-theranote-2026-01-05.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
