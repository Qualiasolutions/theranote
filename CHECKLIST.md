# TheraNote MVP Checklist

**Client:** Prospective (Demo)
**Built by:** Qualia Solutions
**Last Updated:** January 2026
**Source:** BIBLE.txt requirements vs current implementation

---

## Quick Status

| Category | Done | Total | % |
|----------|------|-------|---|
| Authentication | 4 | 4 | 100% |
| Session Notes | 11 | 13 | 85% |
| Goal Tracking | 8 | 8 | 100% |
| Compliance | 5 | 10 | 50% |
| Reports/Exports | 7 | 10 | 70% |
| Admin Dashboard | 5 | 10 | 50% |
| AI Features | 3 | 8 | 38% |
| Incidents | 6 | 6 | 100% |
| Student Mgmt | 6 | 7 | 86% |
| **TOTAL** | **55** | **76** | **72%** |

---

## 1. Authentication & User Management

- [x] Secure login (Supabase Auth)
- [x] Role-based access (therapist, admin, billing)
- [x] Discipline assignment (speech, ot, pt, aba, counseling, seit, scis)
- [x] Multi-tenant organization isolation

**Files:** `src/app/(auth)/`, `src/lib/supabase/middleware.ts`

---

## 2. Session Notes (SOAP)

### Core Entry
- [x] Student selector (from caseload)
- [x] Session date picker
- [x] Start/end time with duration calculation
- [x] Attendance status (present, absent, makeup, cancelled)
- [x] Discipline auto-populated from profile
- [x] SOAP sections (S, O, A, P) with full textarea

### Status & Signing
- [x] Draft/signed status tracking
- [x] Electronic signature with timestamp (`signed_at`)
- [x] Pre-sign validation (required fields)

### Formats
- [x] SOAP format
- [ ] Narrative format toggle
- [ ] DOE-specific format export

**Files:** `src/app/(dashboard)/sessions/`, `src/components/sessions/soap-editor.tsx`

---

## 3. Goal/IEP Tracking

### Core
- [x] Add goals to students (discipline, domain, description)
- [x] Target criteria and baseline
- [x] Status tracking (baseline, in_progress, met, discontinued)
- [x] Link goals to sessions
- [x] Progress value + unit + notes per session

### Visualization
- [x] Progress graphs/charts (Recharts: ProgressChart, SingleGoalProgressChart)
- [x] Historical trend display (line/area charts with trend analysis)
- [x] Baseline vs current comparison (reference lines in charts)

**Files:** `src/components/goals/`, `src/components/sessions/goal-progress-tracker.tsx`

---

## 4. Compliance Features

### Implemented Rules
- [x] 7-day signing deadline detection
- [x] Critical/warning/info violation levels
- [x] SOAP completeness checking
- [x] Goal progress documentation check
- [x] Compliance score (0-100)

### Missing Rules
- [ ] Make-up session calculation & tracking
- [ ] Service frequency compliance alerts
- [ ] DOE/NYSED specific prompts
- [ ] Medicaid compliance rules
- [ ] Audit report auto-generation

**Files:** `src/lib/compliance/rules.ts`, `src/components/compliance/compliance-alerts.tsx`

---

## 5. Reports & Exports

### CSV Exports (Done)
- [x] Attendance log (`/api/export/attendance`)
- [x] Service log (`/api/export/service-log`)
- [x] Caseload summary (`/api/export/caseload`)
- [x] Progress report (`/api/export/progress-report`)

### Report Pages (Done)
- [x] Attendance report page
- [x] Progress report page

### PDF/Other
- [x] PDF export for progress reports (`/api/export/pdf` with @react-pdf/renderer)
- [ ] DOE/NYC-specific service log format
- [ ] Medicaid billing export format
- [ ] Weekly report generation

**Files:** `src/app/api/export/`, `src/app/(dashboard)/reports/`

---

## 6. Admin Dashboard

### Done
- [x] Org-wide statistics display
- [x] User list view
- [x] User deletion
- [x] Invitation system (create, revoke)
- [x] Compliance overview

### Missing
- [ ] Class roster management (no "classes" entity)
- [ ] Caseload assignment UI (therapists self-manage)
- [ ] Per-therapist compliance view
- [ ] Audit log viewer with filtering
- [ ] Staff attendance tracking

**Files:** `src/app/(dashboard)/admin/`, `src/components/admin/`

---

## 7. AI Features

### Done
- [x] SOAP prompt generation (OpenRouter/Gemini)
- [x] Discipline-specific prompts
- [x] Context-aware suggestions (student name, goals)

### Missing
- [ ] Full note auto-generation/completion
- [ ] Missing element detection alerts
- [ ] DOE-compliant language suggestions
- [ ] Auto-generate parent notification letters
- [ ] Progress report auto-summarization

**Files:** `src/lib/ai/openrouter.ts`, `src/components/sessions/ai-prompts-panel.tsx`

---

## 8. Behavior Incidents

- [x] ABC analysis (Antecedent, Behavior, Consequence)
- [x] Severity levels (low, medium, high, critical)
- [x] Incident types (behavior, elopement, injury, medical, safety, communication)
- [x] Parent/admin notification flags
- [x] Follow-up tracking
- [x] Incident list & detail views

**Files:** `src/app/(dashboard)/incidents/`, `src/components/incidents/incident-form.tsx`

---

## 9. Student Management

- [x] Create student with demographics
- [x] Service type selection (all disciplines)
- [x] Session frequency/duration assignment
- [x] Parent contact info fields
- [x] Student profile view (age, status, goals, sessions)
- [x] Automatic caseload creation
- [ ] Student search/filter improvements

**Files:** `src/app/(dashboard)/students/`

---

## 10. Database Schema Status

### Complete Tables
- [x] organizations
- [x] sites
- [x] profiles
- [x] user_organizations
- [x] students
- [x] caseloads
- [x] goals
- [x] sessions
- [x] session_goals
- [x] incidents
- [x] invitations
- [x] audit_logs

### Missing Tables (ThriveSync scope)
- [ ] staff_credentials (HR tracking)
- [ ] schedules (calendar/scheduling)
- [ ] makeup_sessions (linkage table)
- [ ] classrooms (roster management)
- [ ] parent_contacts (parent portal)
- [ ] expenses (finance module)

### Security
- [x] `user_sites` RLS policies in place

**Files:** `src/types/database.ts`, Supabase project

---

## 11. Future Phases (NOT in MVP)

### Phase 2: ThriveSync Operations
- [ ] Staff/HR compliance tracking
- [ ] Credential management
- [ ] Classroom ratio monitoring
- [ ] Finance module

### Phase 3: Parent Portal
- [ ] Parent-accessible views
- [ ] Consent/permission tracking
- [ ] Home communication log

### Phase 4: Offline/PWA
- [ ] Service worker
- [ ] IndexedDB storage
- [ ] Background sync

---

## Priority Implementation Order

### P0 - Critical (Ship Blockers) ✅ COMPLETE
1. [x] Fix `user_sites` RLS policies (already had policies)
2. [x] Progress graphs for goal tracking (ProgressChart + SingleGoalProgressChart)
3. [x] PDF export for reports (`/api/export/pdf` with @react-pdf/renderer)

### P1 - High (Demo Quality)
4. [ ] Make-up session tracking
5. [ ] DOE format service log export
6. [ ] AI auto-generation for full notes
7. [ ] Caseload assignment UI for admins

### P2 - Medium (Nice to Have)
8. [ ] Missing element detection
9. [ ] Per-therapist admin views
10. [ ] Narrative format toggle
11. [ ] Weekly report generation

### P3 - Low (Future)
12. [ ] Parent notification letters
13. [ ] Medicaid billing format
14. [ ] Audit log viewer
15. [ ] Progress report summarization

---

## What's Already Working Well

The existing codebase is **solid** for a demo:

1. **Auth & Multi-tenancy** - Properly isolated with RLS
2. **SOAP Editor** - Full-featured with AI assist
3. **Goal Tracking** - Complete workflow, just needs graphs
4. **Incidents** - Full ABC analysis implementation
5. **Compliance Engine** - Core rules working
6. **Export System** - 4 CSV exports functional
7. **UI/UX** - Premium animations, responsive design

**Recommendation:** Focus on P0 items, then P1. The MVP is 67% complete and demo-ready for core workflows.

---

## Files to Modify (P0/P1)

| Priority | Feature | Files |
|----------|---------|-------|
| P0 | RLS Fix | Supabase migration |
| P0 | Progress Graphs | `src/components/goals/progress-chart.tsx` (new) |
| P0 | PDF Export | `src/app/api/export/[type]/pdf/route.ts` (new) |
| P1 | Make-up Tracking | `src/lib/compliance/rules.ts`, new DB table |
| P1 | DOE Export | `src/app/api/export/service-log/route.ts` |
| P1 | AI Full Notes | `src/lib/ai/openrouter.ts` |
| P1 | Caseload UI | `src/app/(dashboard)/admin/caseloads/page.tsx` (new) |

---

*Generated from BIBLE.txt analysis - Qualia Solutions*
