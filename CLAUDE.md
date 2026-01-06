# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TheraNote/ThriveSync is a Turborepo monorepo containing two apps for preschool special-education programs:

- **TheraNote** (port 3000) - Clinical documentation for therapists (SOAP notes, goals, compliance)
- **ThriveSync** (port 3001) - Operations management for administrators (staff, classrooms, finance)

**Status:** 91% complete, MVP demo-ready
**Deployment:** https://theranote-delta.vercel.app (TheraNote only)

## Commands

```bash
# Development
pnpm dev              # Run both apps (3000 + 3001)
pnpm dev:theranote    # Run TheraNote only
pnpm dev:thrivesync   # Run ThriveSync only

# Build & Lint
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm type-check       # TypeScript validation

# Database types
pnpm db:gen-types     # Regenerate packages/database/src/types.ts

# Clean slate
pnpm clean            # Remove all node_modules and .next
```

## Environment Variables

```bash
# .env.local (root level)
NEXT_PUBLIC_SUPABASE_URL=https://etxvaajfgigmxoxjimrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Project

- **Project ID:** `etxvaajfgigmxoxjimrr`
- **Region:** eu-west-1
- **Demo User:** polina@thera.com / sprinkleofmillions

## Architecture

### Monorepo Structure

```
apps/
  theranote/           # Clinical app (Next.js 15, port 3000)
    src/app/           # App Router pages
    src/components/    # React components
    src/lib/           # supabase/, ai/, compliance/
  thrivesync/          # Operations app (Next.js 15, port 3001)

packages/
  database/            # @repo/database - Supabase types + client factories
  ui/                  # @repo/ui - Shared shadcn components
  auth/                # @repo/auth - Shared auth utilities
  config/              # Shared config
```

### Supabase Client Pattern

The `@repo/database` package exports context-specific clients:

```typescript
// Server Components, Route Handlers (uses cookies())
import { createServerClient } from '@repo/database/server'

// Client Components (browser)
import { createBrowserClient } from '@repo/database/client'

// Middleware (session refresh)
import { updateSession } from '@repo/database/middleware'
```

Each app also has local wrappers in `src/lib/supabase/` that re-export these.

### Authentication

Middleware at `apps/theranote/src/middleware.ts` handles route protection:
- Protected: `/dashboard`, `/students`, `/sessions`, `/reports`, `/admin`, `/assistant`, `/incidents`
- Auth pages (`/login`, `/signup`) redirect to dashboard if already authenticated

### Multi-Tenant Data Model

```
organizations
  └── sites
       └── students
            ├── goals → session_goals (progress per session)
            ├── sessions (SOAP notes)
            └── incidents (ABC behavioral)
```

All queries filter by `org_id` with RLS. User-org relationship via `user_organizations`.

### Key Enums

- **Roles:** `therapist`, `admin`, `billing`
- **Disciplines:** `speech`, `ot`, `pt`, `aba`, `counseling`, `seit`, `scis`
- **Session status:** `draft` → `signed`
- **Attendance:** `present`, `absent`, `makeup`, `cancelled`
- **Goal status:** `baseline`, `in_progress`, `met`, `discontinued`

### Compliance Engine

`apps/theranote/src/lib/compliance/rules.ts` implements NYC DOE/NYSED regulations:

| Function | Rule |
|----------|------|
| `checkSigningCompliance()` | 7-day signing deadline |
| `checkSOAPCompleteness()` | Required SOAP sections |
| `checkGoalProgressDocumentation()` | Progress tracking |
| `checkFrequencyCompliance()` | IEP service frequency |
| `validateBeforeSign()` | Pre-signature validation |

Violations are typed as `critical | warning | info`.

### AI Integration

`apps/theranote/src/lib/ai/openrouter.ts` uses OpenRouter API with `google/gemini-flash-1.5`:

| Function | Purpose |
|----------|---------|
| `generateSOAPPrompts()` | Sentence starters for SOAP sections |
| `generateFullNote()` | Complete SOAP or narrative note |
| `analyzeNoteForMissingElements()` | Check note completeness |

Falls back to hardcoded defaults on API failure. No PHI sent to AI.

## API Endpoints

### TheraNote

| Endpoint | Purpose |
|----------|---------|
| `POST /api/ai/prompts` | Generate SOAP prompts |
| `POST /api/ai/generate-note` | Full note generation |
| `POST /api/ai/analyze-note` | Missing element detection |
| `POST /api/ai/chat` | Chat completions |
| `GET /api/export/attendance` | Attendance CSV |
| `GET /api/export/service-log` | Service log CSV |
| `GET /api/export/service-log-doe` | NYC DOE format |
| `GET /api/export/caseload` | Caseload CSV |
| `GET /api/export/progress-report` | Progress CSV |
| `GET/POST/PUT/DELETE /api/admin/caseloads` | Caseload management |
| `DELETE /api/admin/users/[id]` | Remove user |
| `DELETE /api/admin/invitations/[id]` | Revoke invitation |

### ThriveSync

| Endpoint | Purpose |
|----------|---------|
| `GET /api/export/staff-roster` | Staff list CSV |
| `GET /api/export/credentials` | Credential status CSV |
| `GET /api/export/attendance` | Staff attendance CSV |
| `GET /api/export/expenses` | Expense report CSV |
| `GET /api/export/compliance-overview` | All compliance categories |
| `GET /api/export/article-47` | Article 47 DOHMH compliance |
| `GET /api/export/cost-allocation` | CFR cost allocation |

## Type Handling

After schema changes, regenerate types:

```bash
pnpm db:gen-types
```

Types live in `packages/database/src/types.ts`. For tables not yet in types, use assertions:

```typescript
const { data } = await supabase
  .from('new_table')
  .insert(data as never)
```

## Vercel Deployment

`vercel.json` configures single-app deployment for TheraNote only:
- Build: `pnpm turbo build --filter=theranote`
- Output: `apps/theranote/.next`
- Ignores changes outside `apps/theranote` and `packages/`
