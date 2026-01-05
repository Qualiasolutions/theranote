---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - clients.txt
date: 2026-01-05
author: Fawzi
project_name: theranote
scope: Combined Platform (TheraNote + ThriveSync)
status: complete
---

# Product Brief: TheraNote & ThriveSync

## Executive Summary

TheraNote + ThriveSync is a vertically-integrated SaaS platform for 4410/early-childhood special-education programs, built by Qualia Solutions.

- **TheraNote** = AI-assisted clinical documentation (session notes, progress reports, goal tracking)
- **ThriveSync** = Operations & compliance hub (staff credentials, ratios, audit readiness)

**Build Strategy:** TheraNote first (Phase 1), ThriveSync second (Phase 2), shared architecture from day one.

**Core Principle:** AI assists, humans remain the clinical author of record. No fabricated data.

---

## Core Vision

### Problem Statement

Preschool special-education providers (speech, OT, PT, counseling, ABA, SEIT, SCIS) spend hours on documentation while quality and compliance vary. Administrators manage staff credentials, ratios, and audit prep across disconnected spreadsheets. No mainstream ed-tech serves this vertical.

### Problem Impact

- Therapist burnout from documentation backlog
- Compliance violations and audit failures
- Denied Medicaid claims from documentation gaps
- Zero real-time visibility for directors
- Scaling programs = scaling chaos

### Why Existing Solutions Fall Short

- Generic EHR systems ignore NYSED/DOE/Medicaid/Article 47 requirements
- No platform combines clinical documentation WITH operational compliance
- Nothing speaks the language of 4410 programs

### Proposed Solution

**TheraNote (Phase 1):**
- AI-assisted session notes (SOAP, narrative, DOE formats)
- Goal tracking linked to IEPs & IFSPs
- Attendance + service logs
- Progress report generator
- Discipline-specific templates
- Compliance prompts (frequency, duration, ratio, missed-session rules)
- Offline → sync capability

**ThriveSync (Phase 2):**
- Staff credential & HR compliance tracking
- Classroom ratios & real-time headcounts
- DOHMH Article 47 compliance manager
- Finance & cost allocation tracking
- Audit-binder auto-generation
- Quality & compliance dashboards

### Key Differentiators

1. **AI-assisted, human-authored** - Smart prompts, no auto-invented data
2. **Vertical specialization** - Purpose-built for 4410/early-childhood special-ed
3. **Compliance-first** - NYSED, DOE, Medicaid, HIPAA, Article 47 baked in
4. **Unified platform** - Clinical + operational in one ecosystem

---

## Target Users

### Primary Users

#### 1. Therapist Persona: "Dr. Elena Reyes" - Speech-Language Pathologist

**Context:** 8 years experience, works across 3 sites for a 4410 program, carries caseload of 25+ students

**Current Pain:**
- Spends 1-2 hours daily on session notes after work hours
- Toggling between paper notes and spreadsheets
- Worries about documentation meeting Medicaid requirements
- Notes pile up when running behind, leading to back-dated documentation

**Success Vision:**
- Complete session notes in <5 minutes during/immediately after session
- Confidence that notes are audit-ready
- IEP goal tracking that's automatic, not manual

---

#### 2. Admin Persona: "Marcus Thompson" - Program Director

**Context:** Oversees 4 classrooms, 40+ staff, responsible for DOE compliance and audit readiness

**Current Pain:**
- Spreadsheet chaos for tracking staff credentials, medicals, SCR clearances
- No visibility into whether therapists are completing documentation on time
- Audit prep = weeks of panic gathering evidence
- Ratio compliance is manual headcount + prayer

**Success Vision:**
- Dashboard showing compliance status at a glance
- Automated expiration alerts before problems
- Audit binder auto-generates with proof docs
- Real-time ratio monitoring

---

#### 3. Classroom Persona: "Jasmine Cole" - SEIT (Special Education Itinerant Teacher)

**Context:** Travels between homes and sites, works with 8 children 1:1, limited Wi-Fi access

**Current Pain:**
- Paper notes in the field, transcribes later (hours lost)
- Different families/sites = inconsistent documentation formats
- Easy to miss session details when transcribing later

**Success Vision:**
- Offline note-taking that syncs when connected
- Voice-to-text option for in-session notes
- Templates that match DOE requirements automatically

---

### Secondary Users

#### 4. Billing Team: "Angela Kim" - Billing Coordinator

**Role:** Submits claims to Medicaid, tracks authorization hours, flags documentation gaps

**Needs from System:**
- Clear linkage between session logs and billable units
- Alerts when documentation is missing before claim submission
- Audit trail for denied claims investigation

---

#### 5. Compliance Officer: "Robert Whitfield" - HR & Compliance Manager

**Role:** Ensures all staff files are complete, tracks training, manages Article 47 compliance

**Needs from System:**
- Centralized credential tracking with expiration alerts
- Training completion logs
- Evidence library for audits

---

### User Journey (TheraNote Focus)

| Stage | Therapist Experience |
|-------|---------------------|
| **Discovery** | Learns about TheraNote from program director or peer recommendation |
| **Onboarding** | 15-min setup: profile, discipline, caseload import from IEP data |
| **First Session** | Uses AI prompts to complete SOAP note in 3 minutes vs usual 15 |
| **Aha Moment** | Realizes goal tracking is automatic - progress report writes itself |
| **Daily Use** | Notes done before leaving building, no more homework |
| **Long-term** | Claims approved faster, audits pass without stress |

---

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Note completion time | <5 min per session | In-app timing |
| Documentation compliance rate | >95% | Audit sampling |
| Same-day note completion | >90% | Timestamp analysis |
| User satisfaction (NPS) | >50 | Quarterly surveys |

### Business Objectives

| Objective | Target | Timeframe |
|-----------|--------|-----------|
| Pilot program adoption | 3 sites | 3 months |
| Therapist retention on platform | >80% | 6 months |
| Claim denial reduction | 30% decrease | 6 months |
| Time to audit readiness | <1 day | 12 months |

### Key Performance Indicators

**Leading Indicators:**
- Daily active users (therapists logging sessions)
- Average session notes per user per day
- Time from session end to note completion

**Lagging Indicators:**
- Medicaid claim approval rate
- Audit pass rate
- Customer churn rate
- Revenue per site

---

## MVP Scope

### Phase 1: TheraNote MVP

#### Core Features (Must Have)

1. **User Authentication & Roles**
   - Email/password login
   - Role-based access (Therapist, Admin, Billing)
   - Multi-site support

2. **Student/Client Management**
   - Student profiles with IEP/IFSP goals
   - Caseload assignment to therapists
   - Basic demographics and service authorizations

3. **Session Documentation**
   - AI-assisted SOAP note generation
   - Discipline-specific templates (Speech, OT, PT, ABA, Counseling)
   - Goal selection from student's IEP
   - Attendance tracking (present, absent, makeup)
   - Digital signature for note finalization

4. **AI Documentation Assistant**
   - Smart prompts based on discipline and goals
   - Vocabulary suggestions for clinical language
   - Compliance checks before submission
   - **NO auto-generation of clinical observations** - user inputs, AI formats

5. **Goal Tracking**
   - Progress data entry per session
   - Visual progress charts
   - Auto-populate progress reports

6. **Basic Reporting**
   - Session logs by therapist/student/date
   - Missing documentation alerts
   - Export to PDF for audits

#### Out of Scope for MVP

- ThriveSync features (staff compliance, ratios, HR)
- Offline mode (Phase 1.5)
- Voice-to-text input
- Billing system integration
- Parent portal
- Advanced analytics/BI dashboards
- Mobile native apps (web-responsive only)
- Multi-language support

### MVP Success Criteria

| Criteria | Threshold |
|----------|-----------|
| Therapists can complete SOAP note | <5 minutes |
| Notes pass compliance checklist | 100% |
| System uptime | >99.5% |
| User can onboard without training | <15 minutes |
| Demo impresses prospective client | Positive feedback |

---

## Future Vision

### Phase 1.5: TheraNote Enhanced

- Offline mode with sync
- Voice-to-text note input
- Mobile-optimized PWA
- Bulk session entry
- Advanced progress report generator

### Phase 2: ThriveSync Launch

- Staff credential management
- Expiration alerts & renewals
- Classroom ratio monitoring
- Article 47 compliance checklist
- Audit binder generator
- HR document management

### Phase 3: Platform Integration

- TheraNote + ThriveSync unified dashboard
- Cross-platform data (therapist credentials → service authorization)
- Advanced analytics & BI
- Billing system integrations (claims submission)
- Parent communication portal

### Long-term Vision (2-3 Years)

- Multi-state compliance (beyond NY)
- White-label for large networks
- API marketplace for integrations
- AI-powered compliance predictions
- Benchmarking across programs

---

## Technical Assumptions

**Stack:** Next.js 15+ | Supabase | Vercel | Tailwind + shadcn/ui

**Compliance:**
- HIPAA-compliant infrastructure (Supabase SOC2)
- Row-level security for multi-tenancy
- Audit logging for all data access
- Data encryption at rest and in transit

**AI Integration:**
- Google Gemini for text assistance
- Prompt engineering for clinical language
- No PHI sent to AI - only templates and formatting

---

## Document Complete

**Created:** 2026-01-05
**Author:** Fawzi (Qualia Solutions)
**Status:** Ready for PRD
