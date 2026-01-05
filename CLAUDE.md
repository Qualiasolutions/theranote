# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TheraNote is an AI-assisted clinical documentation platform for preschool special-education programs (4410, early intervention, CPSE).

**Built by:** Qualia Solutions
**Purpose:** Functional demo for prospective client
**Phase:** MVP Complete
**Repository:** https://github.com/Qualiasolutions/theranote

## Key Commands

```bash
npm run dev           # Start dev server with Turbopack (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run type-check    # TypeScript validation (tsc --noEmit)

# Database types - requires SUPABASE_PROJECT_ID env var
npm run db:gen-types  # Regenerate src/types/database.ts
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

## Architecture

### Supabase Client Pattern

Three client variants for different contexts:

| File | Use Case |
|------|----------|
| `lib/supabase/server.ts` | Server Components, Route Handlers (async cookies) |
| `lib/supabase/client.ts` | Client Components (browser) |
| `lib/supabase/middleware.ts` | Next.js middleware (session refresh) |

Always use `createClient()` from the appropriate module based on context.

### Authentication Flow

Middleware (`src/middleware.ts`) handles route protection:
- Protected paths: `/dashboard`, `/students`, `/sessions`, `/reports`, `/admin`
- Auth paths (`/login`, `/signup`) redirect to dashboard if already logged in
- Session refresh happens automatically via Supabase SSR cookies

### Compliance Engine

`lib/compliance/rules.ts` implements NYC DOE/NYSED regulations:

- `checkSigningCompliance()` - 7-day signing deadline enforcement
- `checkSOAPCompleteness()` - Required SOAP sections validation
- `checkGoalProgressDocumentation()` - Progress tracking verification
- `checkFrequencyCompliance()` - IEP service frequency compliance
- `validateBeforeSign()` - Pre-signature validation

Violations are typed as `critical | warning | info` and sorted by severity.

### AI Integration

`lib/ai/openrouter.ts` - OpenRouter API with `google/gemini-flash-1.5`:
- Generates discipline-specific SOAP prompts
- Falls back to hardcoded defaults on API failure
- **No PHI sent to AI** - only context like student name, goals, section type

### Multi-Tenant Data Model

```
organizations
  └── sites
       └── students
            ├── goals → session_goals
            ├── sessions
            └── incidents
```

All tables use `org_id` for RLS isolation. User-org relationship via `user_organizations` join table.

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant root |
| `sites` | Locations within org |
| `profiles` | User accounts (extends auth.users) |
| `students` | Children receiving services |
| `goals` | IEP/IFSP goals by domain |
| `sessions` | SOAP notes with signature tracking |
| `session_goals` | Progress data per session |
| `caseloads` | Therapist-student assignments |
| `incidents` | Behavior documentation (ABC format) |
| `invitations` | User invitation system |
| `audit_logs` | Activity tracking |

### Key Enums

- **Roles:** `therapist`, `admin`, `billing`
- **Disciplines:** `speech`, `ot`, `pt`, `aba`, `counseling`, `seit`, `scis`
- **Session status:** `draft`, `signed`
- **Attendance:** `present`, `absent`, `makeup`, `cancelled`
- **Goal status:** `baseline`, `in_progress`, `met`, `discontinued`
- **Incident severity:** `low`, `medium`, `high`, `critical`

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/prompts` | POST | Generate SOAP prompts via OpenRouter |
| `/api/export/attendance` | GET | Attendance CSV (date range filter) |
| `/api/export/service-log` | GET | NYC DOE format service log CSV |
| `/api/export/caseload` | GET | Caseload summary CSV |
| `/api/export/progress-report` | GET | Goal progress analysis CSV |
| `/api/admin/users/[id]` | DELETE | Remove team member |
| `/api/admin/invitations/[id]` | DELETE | Revoke invitation |

## Type Handling

When working with tables not fully in `database.ts`, use type assertions:

```typescript
const { data } = await supabase
  .from('new_table')
  .insert(data as never)
```

After schema changes, regenerate types:
```bash
SUPABASE_PROJECT_ID=etxvaajfgigmxoxjimrr npm run db:gen-types
```

## Related Documents

- `ROADMAP.md` - Feature completion matrix and upcoming work
- `_bmad-output/planning-artifacts/architecture.md` - Full architecture spec
- `_bmad-output/planning-artifacts/prd.md` - Product requirements
