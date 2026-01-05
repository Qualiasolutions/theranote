# TheraNote Development Roadmap

## Overview

TheraNote is an AI-assisted clinical documentation platform for preschool special-education programs (4410, early intervention, CPSE). This document tracks feature status and upcoming development priorities.

## Current Status: **MVP Complete**

Last Updated: January 2026

---

## Feature Completion Matrix

### Core Features

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| User Authentication | ✅ Complete | 100% | Supabase Auth with role-based access |
| Multi-tenant Organizations | ✅ Complete | 100% | Org/site/user hierarchy |
| Student Management | ✅ Complete | 100% | Full CRUD, demographics, IEP tracking |
| Session Notes (SOAP) | ✅ Complete | 100% | Multi-section editor with validation |
| Session Templates | ✅ Complete | 100% | 7 disciplines supported |
| Goal/IEP Tracking | ✅ Complete | 100% | Goals linked to sessions |
| Progress Tracking | ✅ Complete | 100% | Per-session goal progress data |
| Behavior Incidents | ✅ Complete | 100% | ABC format with notifications |
| Caseload Management | ✅ Complete | 100% | Therapist-student assignments |

### AI Features

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| AI-Assisted SOAP Notes | ✅ Complete | 100% | Context-aware prompts |
| Smart Prompts by Discipline | ✅ Complete | 100% | 7 disciplines with section-specific |
| Clinical Language Suggestions | ✅ Complete | 100% | OpenRouter (Gemini Flash) |
| Context-Aware AI | ✅ Complete | 100% | Student name, goals, previous content |

### Reports & Exports

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| Attendance Report | ✅ Complete | 100% | CSV export with date range |
| Service Log Report | ✅ Complete | 100% | NYC DOE format CSV |
| Caseload Summary | ✅ Complete | 100% | Student metrics CSV |
| Progress Report | ✅ Complete | 100% | Goal progress analysis CSV |
| Compliance Dashboard | ✅ Complete | 100% | Real-time compliance scoring |

### Compliance

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| 7-Day Signing Requirement | ✅ Complete | 100% | Alerts for overdue/due soon |
| SOAP Completeness Check | ✅ Complete | 100% | Missing section detection |
| Compliance Alerts Dashboard | ✅ Complete | 100% | Score + violation list |
| Pre-Sign Validation | ✅ Complete | 100% | Required field enforcement |

### Admin Features

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| User Management | ✅ Complete | 100% | View, delete team members |
| Invitation System | ✅ Complete | 100% | Create, revoke invitations |
| Organization Settings | ✅ Complete | 100% | Basic org configuration |
| Audit Logging | ✅ Complete | 100% | Action tracking |

### UI/UX

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| Responsive Design | ✅ Complete | 100% | Mobile/tablet/desktop |
| Premium Animations | ✅ Complete | 100% | Framer Motion throughout |
| Dark Sidebar | ✅ Complete | 100% | Modern navigation |
| Glassmorphism Effects | ✅ Complete | 100% | Cards, header |

---

## Upcoming Features (Prioritized)

### Phase 5: PWA & Offline (Priority: Medium)
*Target: Future Sprint*

| Task | Status | Notes |
|------|--------|-------|
| PWA Manifest | ⬜ Not Started | TheraNote branding |
| Service Worker | ⬜ Not Started | Offline caching |
| IndexedDB Storage | ⬜ Not Started | Local session storage |
| Background Sync | ⬜ Not Started | Reconnection handling |
| Offline Indicator | ⬜ Not Started | UI feedback |

### Phase 6: Email Integration (Priority: Low)
*Requires: Resend API setup*

| Task | Status | Notes |
|------|--------|-------|
| Email Service Setup | ⬜ Not Started | Resend integration |
| Invitation Emails | ⬜ Not Started | Send on invite create |
| Compliance Alerts Email | ⬜ Not Started | Daily digest option |
| Session Reminder Emails | ⬜ Not Started | Configurable |

### Phase 7: Advanced Features

| Task | Status | Notes |
|------|--------|-------|
| PDF Report Export | ⬜ Not Started | Progress reports |
| Goal Templates Library | ⬜ Not Started | Pre-built IEP goals |
| Session Scheduling | ⬜ Not Started | Calendar integration |
| Parent Portal | ⬜ Not Started | Read-only access |
| Two-Factor Authentication | ⬜ Not Started | Enhanced security |

---

## Technical Debt

| Item | Priority | Notes |
|------|----------|-------|
| ~~Remove Gemini dependency~~ | ✅ Done | Switched to OpenRouter |
| Add proper error boundaries | Medium | React error handling |
| Implement rate limiting | Medium | API protection |
| Review RLS policies | Low | Security audit |
| Add E2E tests | Low | Playwright testing |

---

## Architecture Notes

### Tech Stack
- **Framework**: Next.js 15.5 (App Router, React 19, TypeScript)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animation**: Motion (Framer Motion)
- **AI**: OpenRouter API (google/gemini-flash-1.5)
- **Deployment**: Vercel

### Key Directories
```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── (dashboard)/    # Protected app pages
│   └── api/            # API routes
├── components/
│   ├── admin/          # Admin components
│   ├── compliance/     # Compliance alerts
│   ├── layout/         # Header, sidebar
│   ├── sessions/       # SOAP editor, AI prompts
│   └── ui/             # shadcn/ui components
└── lib/
    ├── ai/             # OpenRouter integration
    ├── compliance/     # Rules engine
    └── supabase/       # Database clients
```

### Database Schema
- `organizations` - Multi-tenant root
- `profiles` - User accounts
- `students` - Children receiving services
- `sessions` - SOAP documentation
- `goals` - IEP/IFSP goals
- `session_goals` - Progress per session
- `incidents` - Behavior documentation
- `caseloads` - Therapist assignments
- `invitations` - User invitations
- `audit_logs` - Activity tracking

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/prompts` | POST | Generate AI SOAP prompts |
| `/api/export/attendance` | GET | Attendance CSV |
| `/api/export/service-log` | GET | Service log CSV |
| `/api/export/caseload` | GET | Caseload summary CSV |
| `/api/export/progress-report` | GET | Progress report CSV |
| `/api/admin/users/[id]` | DELETE | Remove team member |
| `/api/admin/invitations/[id]` | DELETE | Revoke invitation |

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for future features)
RESEND_API_KEY=for-email-integration
```

---

## Contributing

See `CLAUDE.md` for development guidelines and project context.

---

*Built by Qualia Solutions*
