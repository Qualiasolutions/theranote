---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - product-brief-theranote-2026-01-05.md
  - clients.txt
workflowType: 'prd'
lastStep: 11
status: complete
date: 2026-01-05
author: Fawzi
project_name: theranote
---

# Product Requirements Document - TheraNote

**Author:** Fawzi (Qualia Solutions)
**Date:** 2026-01-05
**Version:** 1.0
**Status:** Ready for Architecture

---

## 1. Executive Overview

### 1.1 Product Summary

TheraNote is an AI-assisted clinical documentation platform for preschool special-education programs (4410, early intervention, CPSE). It enables therapists (Speech, OT, PT, ABA, Counseling) to complete compliant session documentation in under 5 minutes while maintaining the therapist as the clinical author of record.

### 1.2 Business Context

- **Client:** Prospective client seeking demo
- **Builder:** Qualia Solutions
- **Scope:** Full-featured functional demo, TheraNote first (Phase 1)
- **Future:** ThriveSync (operations/compliance) as Phase 2

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Session note completion time | <5 minutes |
| Documentation compliance rate | >95% |
| Same-day note completion | >90% |
| User onboarding time | <15 minutes |

---

## 2. Problem Statement

### 2.1 Current State

Preschool special-education providers spend 1-2 hours daily on documentation:
- Paper notes transcribed to spreadsheets
- Inconsistent quality and compliance
- Back-dated documentation due to backlogs
- No real-time visibility for administrators
- Audit prep takes weeks

### 2.2 Pain Points by User

| User | Primary Pain |
|------|--------------|
| Therapist | Hours of documentation homework after sessions |
| Program Director | No visibility, audit panic, spreadsheet chaos |
| SEIT | Field documentation with no connectivity |
| Billing Coordinator | Missing docs = denied claims |

### 2.3 Why Now

- No vertical-specific solution exists for 4410 programs
- Generic EHRs don't speak NYSED/DOE/Medicaid language
- AI technology now mature enough for clinical assistance without fabrication

---

## 3. Solution Overview

### 3.1 Core Concept

AI-assisted documentation that:
- Provides smart prompts based on discipline and IEP goals
- Formats clinical language without inventing observations
- Ensures compliance before submission
- Tracks goal progress automatically

### 3.2 Key Principle

**AI assists, humans author.** The therapist remains the clinical author of record. AI never generates clinical observations - it helps format, prompt, and validate.

### 3.3 Platform Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TheraNote (Phase 1)                   │
├─────────────────────────────────────────────────────────┤
│  Session Notes │ Goal Tracking │ Progress Reports │ Logs │
├─────────────────────────────────────────────────────────┤
│              Shared Data Layer (Supabase)                │
├─────────────────────────────────────────────────────────┤
│                   ThriveSync (Phase 2)                   │
│  Staff Compliance │ Ratios │ HR │ Audit Binder          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. User Personas & Journeys

### 4.1 Primary Persona: Therapist

**"Dr. Elena Reyes" - Speech-Language Pathologist**

- 8 years experience, 25+ student caseload, works across 3 sites
- Spends 1-2 hours daily on notes after work
- Worries about Medicaid compliance
- Wants: Complete notes in <5 min, confidence they're audit-ready

**User Journey:**

```
Login → Select Student → Start Session Note →
AI Prompts for SOAP → Enter Observations → Select Goals →
Rate Progress → Compliance Check → Sign & Submit → Done (<5 min)
```

### 4.2 Secondary Persona: Admin

**"Marcus Thompson" - Program Director**

- Oversees 4 classrooms, 40+ staff
- Spreadsheet chaos for compliance tracking
- Audit prep = weeks of panic
- Wants: Dashboard visibility, automated alerts, audit-ready exports

**User Journey:**

```
Login → Dashboard Overview → Check Documentation Status →
Review Missing Notes → Export Audit Report → Done
```

### 4.3 Tertiary Persona: SEIT

**"Jasmine Cole" - Special Education Itinerant Teacher**

- Travels between homes/sites, 8 children 1:1
- Limited Wi-Fi, paper notes transcribed later
- Wants: Offline capability (Phase 1.5), mobile-friendly interface

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| AUTH-01 | Email/password authentication | P0 | Supabase Auth |
| AUTH-02 | Role-based access control (Therapist, Admin, Billing) | P0 | RLS policies |
| AUTH-03 | Multi-site organization support | P0 | org_id in all tables |
| AUTH-04 | Session timeout (30 min inactive) | P1 | HIPAA compliance |
| AUTH-05 | Password reset flow | P0 | Email verification |

### 5.2 Organization & Site Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ORG-01 | Create/manage organizations | P0 | Multi-tenant |
| ORG-02 | Create/manage sites within org | P0 | Site-level data |
| ORG-03 | Assign users to sites | P0 | Many-to-many |
| ORG-04 | Site-specific settings | P1 | Templates, etc. |

### 5.3 Student Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| STU-01 | Create student profile | P0 | Demographics, DOB |
| STU-02 | Assign students to therapists (caseload) | P0 | Many-to-many |
| STU-03 | Store IEP/IFSP goals per student | P0 | Goal bank |
| STU-04 | Service authorization tracking | P1 | Frequency, duration |
| STU-05 | Student status (active, discharged, on-hold) | P0 | Workflow states |

### 5.4 Session Documentation

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DOC-01 | Create session note for student | P0 | Core feature |
| DOC-02 | SOAP format template | P0 | Subjective, Objective, Assessment, Plan |
| DOC-03 | Discipline-specific templates | P0 | Speech, OT, PT, ABA, Counseling |
| DOC-04 | Select goals addressed in session | P0 | From student's IEP |
| DOC-05 | Attendance status (present, absent, makeup) | P0 | Required field |
| DOC-06 | Session date, start/end time | P0 | Timestamp validation |
| DOC-07 | Digital signature on submission | P0 | Legal requirement |
| DOC-08 | Draft auto-save | P1 | Prevent data loss |
| DOC-09 | Note status workflow (draft → signed → locked) | P0 | Audit trail |
| DOC-10 | Session duration validation | P1 | Match authorization |

### 5.5 AI Documentation Assistant

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| AI-01 | Smart prompts based on discipline | P0 | Context-aware suggestions |
| AI-02 | Goal-specific prompt suggestions | P0 | Based on selected goals |
| AI-03 | Clinical vocabulary suggestions | P1 | Professional language |
| AI-04 | Compliance validation before submit | P0 | Required fields, format |
| AI-05 | Format user input into SOAP structure | P0 | Formatting only, not generating |
| AI-06 | **NO clinical observation generation** | P0 | User must input all clinical content |
| AI-07 | Prompt templates by goal type | P1 | Articulation, fluency, etc. |

### 5.6 Goal Tracking & Progress

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GOAL-01 | Create goals from IEP/IFSP | P0 | Goal bank |
| GOAL-02 | Record progress data per session | P0 | Accuracy %, trials, etc. |
| GOAL-03 | Progress visualization (charts) | P1 | Trend over time |
| GOAL-04 | Goal status (baseline, in-progress, met, discontinued) | P0 | Workflow |
| GOAL-05 | Auto-populate progress report data | P1 | Quarterly reports |

### 5.7 Reporting & Export

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| RPT-01 | Session log by therapist/student/date | P0 | Filterable list |
| RPT-02 | Missing documentation alerts | P0 | Dashboard widget |
| RPT-03 | Export session notes to PDF | P0 | Audit requirement |
| RPT-04 | Progress report generation | P1 | Per student |
| RPT-05 | Attendance summary report | P1 | By student/therapist |
| RPT-06 | Service delivery summary | P1 | Hours delivered vs authorized |

### 5.8 Admin Dashboard

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ADMIN-01 | Documentation completion dashboard | P0 | % complete by therapist |
| ADMIN-02 | Missing/overdue notes list | P0 | Actionable alerts |
| ADMIN-03 | User management (invite, deactivate) | P0 | Admin only |
| ADMIN-04 | Audit log viewer | P1 | Who did what when |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | Page load time | <2 seconds |
| PERF-02 | API response time | <500ms |
| PERF-03 | AI prompt response | <3 seconds |
| PERF-04 | Concurrent users | 100+ per org |

### 6.2 Security & Compliance

| ID | Requirement | Notes |
|----|-------------|-------|
| SEC-01 | HIPAA compliance | BAA with Supabase |
| SEC-02 | Data encryption at rest | Supabase default |
| SEC-03 | Data encryption in transit | TLS 1.3 |
| SEC-04 | Row-level security | Multi-tenant isolation |
| SEC-05 | Audit logging | All data access logged |
| SEC-06 | No PHI to AI services | Only templates/formatting |
| SEC-07 | Session timeout | 30 min inactive |
| SEC-08 | Password complexity | Min 8 chars, mixed |

### 6.3 Availability & Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| AVL-01 | System uptime | 99.5% |
| AVL-02 | Backup frequency | Daily |
| AVL-03 | Recovery time objective | <4 hours |
| AVL-04 | Recovery point objective | <1 hour |

### 6.4 Scalability

| ID | Requirement | Notes |
|----|-------------|-------|
| SCL-01 | Multi-organization support | Shared infrastructure |
| SCL-02 | Horizontal scaling | Vercel edge functions |
| SCL-03 | Database scaling | Supabase managed |

### 6.5 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| USE-01 | Mobile-responsive design | All screens |
| USE-02 | Onboarding time | <15 minutes |
| USE-03 | Accessibility | WCAG 2.1 AA |
| USE-04 | Browser support | Chrome, Safari, Edge (latest 2 versions) |

---

## 7. Data Model (Conceptual)

### 7.1 Core Entities

```
Organization
├── Sites[]
├── Users[]
└── Students[]

User
├── role: therapist | admin | billing
├── organizations[]
└── sites[]

Student
├── organization_id
├── site_id
├── goals[]
├── therapists[] (caseload)
└── sessions[]

Goal
├── student_id
├── description
├── target_criteria
├── status
└── progress_entries[]

Session
├── student_id
├── therapist_id
├── date, start_time, end_time
├── attendance_status
├── note_content (SOAP)
├── goals_addressed[]
├── status: draft | signed | locked
└── signature, signed_at
```

### 7.2 Key Relationships

- Organization → has many → Sites, Users, Students
- User → belongs to many → Organizations, Sites
- Student → belongs to → Organization, Site
- Student → has many → Goals, Sessions
- Session → belongs to → Student, Therapist (User)
- Session → addresses many → Goals

---

## 8. User Interface Requirements

### 8.1 Key Screens

| Screen | Purpose | Primary User |
|--------|---------|--------------|
| Dashboard | Overview, quick actions | All |
| Student List | Browse/search caseload | Therapist |
| Student Profile | View student details, goals, history | Therapist |
| Session Note Editor | Create/edit session documentation | Therapist |
| Goal Progress | View/update goal tracking | Therapist |
| Admin Dashboard | Compliance overview, alerts | Admin |
| Reports | Generate/export reports | Admin, Billing |
| Settings | User profile, preferences | All |

### 8.2 Session Note Editor (Critical Screen)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Student: [Name] │ Date: [Picker] │ Time: [Start]-[End] │
├─────────────────────────────────────────────────────────┤
│ Attendance: [Present] [Absent] [Makeup]                 │
├─────────────────────────────────────────────────────────┤
│ Goals Addressed: [✓ Goal 1] [✓ Goal 2] [ Goal 3]       │
├─────────────────────────────────────────────────────────┤
│ SUBJECTIVE                          │ AI Prompts       │
│ [Text area]                         │ • "Student       │
│                                     │   reported..."   │
├─────────────────────────────────────┤ • "Parent        │
│ OBJECTIVE                           │   mentioned..."  │
│ [Text area]                         │                  │
│                                     │                  │
├─────────────────────────────────────┤                  │
│ ASSESSMENT                          │                  │
│ [Text area]                         │                  │
├─────────────────────────────────────┤                  │
│ PLAN                                │                  │
│ [Text area]                         │                  │
├─────────────────────────────────────┴──────────────────┤
│ Goal Progress: [Goal 1: 80% ▲] [Goal 2: 60% ▶]         │
├─────────────────────────────────────────────────────────┤
│ [Save Draft]              [Compliance Check] [Sign ✓]  │
└─────────────────────────────────────────────────────────┘
```

### 8.3 Design System

- **Framework:** Tailwind CSS + shadcn/ui
- **Typography:** Inter (sans-serif)
- **Colors:** Professional healthcare palette (blues, greens, neutrals)
- **Components:** shadcn/ui primitives (Button, Input, Select, Dialog, Table, etc.)
- **Icons:** Lucide React

---

## 9. Integration Requirements

### 9.1 MVP Integrations

| Integration | Type | Priority | Notes |
|-------------|------|----------|-------|
| Supabase Auth | Internal | P0 | Authentication |
| Supabase DB | Internal | P0 | PostgreSQL |
| Google Gemini | External | P0 | AI prompts |
| Vercel | Internal | P0 | Hosting |

### 9.2 Future Integrations (Post-MVP)

| Integration | Type | Priority | Notes |
|-------------|------|----------|-------|
| IEP Systems | External | P2 | Goal import |
| Billing Systems | External | P2 | Claims submission |
| HRIS | External | P3 | Staff data sync |

---

## 10. Release Criteria

### 10.1 MVP Definition of Done

- [ ] All P0 functional requirements implemented
- [ ] All P0 non-functional requirements met
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] User acceptance testing completed
- [ ] Documentation complete
- [ ] Demo environment deployed

### 10.2 Demo Readiness Checklist

- [ ] Sample organization with 2 sites configured
- [ ] 5 sample students with goals
- [ ] 3 user accounts (therapist, admin, billing)
- [ ] 10+ sample session notes
- [ ] Progress data populated for charts
- [ ] PDF export working
- [ ] AI prompts functioning
- [ ] Mobile-responsive verified

---

## 11. Out of Scope (MVP)

| Feature | Reason | Phase |
|---------|--------|-------|
| ThriveSync (staff compliance, ratios) | Phase 2 | 2 |
| Offline mode | Complexity | 1.5 |
| Voice-to-text | Complexity | 1.5 |
| Native mobile apps | Web-first | 2 |
| Billing integration | Scope | 2 |
| Parent portal | Scope | 3 |
| Multi-language | Scope | 3 |
| Advanced analytics | Scope | 2 |

---

## 12. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI generates clinical content | High | Medium | Strict prompt engineering, validation |
| HIPAA violation | High | Low | No PHI to AI, audit logging, encryption |
| Performance with large caseloads | Medium | Medium | Pagination, lazy loading, caching |
| User adoption resistance | Medium | Medium | Intuitive UX, <5 min note completion |
| Scope creep | High | High | Strict MVP boundaries, phase planning |

---

## 13. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| 4410 | NY State preschool special education program |
| CPSE | Committee on Preschool Special Education |
| IEP | Individualized Education Program |
| IFSP | Individualized Family Service Plan |
| SOAP | Subjective, Objective, Assessment, Plan (note format) |
| SEIT | Special Education Itinerant Teacher |
| RLS | Row-Level Security (Supabase) |

### B. Compliance References

- NYSED Part 200 Regulations
- Medicaid Documentation Requirements
- HIPAA Privacy Rule
- DOHMH Article 47 (for ThriveSync Phase 2)

---

## Document Complete

**Created:** 2026-01-05
**Author:** Fawzi (Qualia Solutions)
**Status:** Ready for Architecture
