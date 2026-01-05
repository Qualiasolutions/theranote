# TheraNote/ThriveSync Platform Roadmap

**Last Updated:** January 2026
**Overall Progress:** 91% Complete
**Status:** MVP Demo Ready

---

## Platform Overview

| App | Purpose | Status |
|-----|---------|--------|
| **TheraNote** | Clinical documentation for therapists | 83% ✅ |
| **ThriveSync** | Preschool operations management | 95% ✅ |

---

## ✅ COMPLETED (P0 - Ship Blockers)

All P0 items are complete. The platform is demo-ready.

### TheraNote
- [x] Authentication & multi-tenancy (Supabase Auth + RLS)
- [x] SOAP note editor with AI prompts
- [x] Goal/IEP tracking with progress data
- [x] **Progress graphs** (Recharts: LineChart, AreaChart)
- [x] **PDF export** (`/api/export/pdf` with @react-pdf/renderer)
- [x] CSV exports (attendance, service-log, caseload, progress-report)
- [x] Behavior incident tracking (ABC format)
- [x] Compliance engine (7-day signing, SOAP validation)
- [x] Admin dashboard with user management

### ThriveSync
- [x] Staff management with credential tracking
- [x] Classroom management with ratio monitoring
- [x] Finance module (expenses, allocations)
- [x] Family communication portal
- [x] Compliance dashboard (Article 47, DOHMH, NYSED)
- [x] **Dashboard with real Supabase data**
- [x] **CSV exports** (staff-roster, credentials, attendance, expenses)
- [x] **Reports page wired to export endpoints**

### Infrastructure
- [x] Turborepo monorepo with pnpm workspaces
- [x] Vercel deployment (https://theranote-delta.vercel.app)
- [x] Shared packages (@repo/ui, @repo/database, @repo/auth)
- [x] TypeScript throughout

---

## ✅ COMPLETED (P1 - Demo Quality)

All P1 items are complete:

| Feature | App | Status | Notes |
|---------|-----|--------|-------|
| Make-up session tracking | TheraNote | ✅ Done | `original_session_id` linking |
| DOE format service log | TheraNote | ✅ Done | `/api/export/service-log-doe` |
| AI full note generation | TheraNote | ✅ Done | `/api/ai/generate-note` |
| Caseload assignment UI | TheraNote | ✅ Done | `/admin/caseloads` page |
| Narrative format toggle | TheraNote | ✅ Done | SOAP/Narrative switch in editor |
| Missing element detection | TheraNote | ✅ Done | `/api/ai/analyze-note` |
| Compliance report exports | ThriveSync | ✅ Done | `/api/export/compliance-overview`, `/api/export/article-47` |
| Cost allocation reports | ThriveSync | ✅ Done | `/api/export/cost-allocation` |

---

## 📋 BACKLOG (P2 - Remaining)

| Feature | App | Priority |
|---------|-----|----------|
| Per-therapist admin views | TheraNote | P2 |
| Weekly report generation | TheraNote | P2 |

---

## 🔮 FUTURE PHASES (P3+)

### Phase 2: Advanced Features
- Parent notification letter generation
- Medicaid billing format export
- Audit log viewer with filtering
- Progress report AI summarization

### Phase 3: Parent Portal
- Parent-accessible session views
- Consent/permission tracking
- Home communication log

### Phase 4: Offline/PWA
- Service worker for offline
- IndexedDB local storage
- Background sync

---

## File Structure

```
theranote/
├── apps/
│   ├── theranote/          # Clinical documentation app
│   │   ├── src/app/        # Next.js App Router pages
│   │   ├── src/components/ # React components
│   │   └── src/lib/        # Utilities (supabase, ai, compliance)
│   └── thrivesync/         # Operations management app
│       ├── src/app/        # Next.js App Router pages
│       └── src/components/ # React components
├── packages/
│   ├── database/           # Shared Supabase types
│   ├── ui/                 # Shared UI components
│   └── auth/               # Shared auth utilities
└── turbo.json              # Turborepo config
```

---

## Key Endpoints

### TheraNote API
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/prompts` | POST | Generate SOAP prompts |
| `/api/ai/generate-note` | POST | Full SOAP/narrative generation |
| `/api/ai/analyze-note` | POST | Missing element detection |
| `/api/export/pdf` | GET | PDF progress report |
| `/api/export/attendance` | GET | Attendance CSV |
| `/api/export/service-log` | GET | Service log CSV |
| `/api/export/service-log-doe` | GET | NYC DOE format service log |
| `/api/export/caseload` | GET | Caseload CSV |
| `/api/export/progress-report` | GET | Progress CSV |
| `/api/admin/caseloads` | GET/POST/PUT/DELETE | Caseload management |

### ThriveSync API
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/export/staff-roster` | GET | Staff list CSV |
| `/api/export/credentials` | GET | Credential status CSV |
| `/api/export/attendance` | GET | Staff attendance CSV |
| `/api/export/expenses` | GET | Expense report CSV |
| `/api/export/compliance-overview` | GET | All compliance categories |
| `/api/export/article-47` | GET | Article 47 DOHMH compliance |
| `/api/export/cost-allocation` | GET | CFR cost allocation report |

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run both apps
pnpm dev

# Run specific app
pnpm dev:theranote
pnpm dev:thrivesync

# Build
pnpm build

# Deploy
vercel --prod
```

---

*Generated by Qualia Solutions - January 2026*
