---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prd.md
  - product-brief-theranote-2026-01-05.md
workflowType: 'architecture'
status: complete
date: 2026-01-05
author: Fawzi
project_name: theranote
---

# Architecture Document - TheraNote

**Author:** Fawzi (Qualia Solutions)
**Date:** 2026-01-05
**Version:** 1.0
**Status:** Ready for Implementation

---

## 1. Architecture Overview

### 1.1 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│   Therapists │ Admins │ Billing │ (Future: Parents)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                          │
│                 (CDN, Edge Functions, SSL)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   App       │  │   Server    │  │   API Routes            │ │
│  │   Router    │  │   Components│  │   /api/*                │ │
│  │   (RSC)     │  │             │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   SUPABASE    │  │   GOOGLE      │  │   VERCEL      │
│   PostgreSQL  │  │   GEMINI      │  │   BLOB        │
│   Auth, RLS   │  │   AI API      │  │   (PDFs)      │
│   Realtime    │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 1.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 15+ (App Router) | RSC, Server Actions, Qualia standard |
| Database | Supabase (PostgreSQL) | RLS, Auth, Realtime, SOC2 |
| Hosting | Vercel | Edge network, zero-config, Qualia standard |
| Styling | Tailwind + shadcn/ui | Rapid UI development, consistency |
| AI | Google Gemini | Cost-effective, good for text tasks |
| State | React Server Components + Tanstack Query | Minimal client state |

### 1.3 Design Principles

1. **Server-first**: Use RSC and Server Actions by default
2. **Secure by default**: RLS on every table, no client-side auth checks
3. **AI-assisted, human-authored**: AI formats, never generates clinical content
4. **Multi-tenant from day one**: org_id on all tables, RLS enforced
5. **Offline-ready architecture**: Design for future offline support

---

## 2. Tech Stack

### 2.1 Frontend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x |
| React | React | 19.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | latest |
| Icons | Lucide React | latest |
| Forms | React Hook Form + Zod | latest |
| Data Fetching | Tanstack Query | 5.x |
| Date Handling | date-fns | latest |
| PDF Generation | @react-pdf/renderer | latest |

### 2.2 Backend

| Layer | Technology | Notes |
|-------|------------|-------|
| Database | Supabase PostgreSQL | Managed, SOC2 |
| Auth | Supabase Auth | Email/password, RBAC |
| API | Next.js API Routes + Server Actions | RSC-first |
| AI | Google Gemini API | via @google/generative-ai |
| File Storage | Vercel Blob | PDF exports |
| Edge Functions | Vercel Edge | Low latency |

### 2.3 Infrastructure

| Component | Service | Notes |
|-----------|---------|-------|
| Hosting | Vercel | Pro plan |
| Database | Supabase | Pro plan (HIPAA BAA) |
| DNS | Vercel | Automatic SSL |
| Monitoring | Vercel Analytics | Built-in |
| Error Tracking | Sentry | Optional |

---

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Organizations (Multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (Locations within org)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Extended from Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('therapist', 'admin', 'billing')),
  discipline TEXT, -- speech, ot, pt, aba, counseling (for therapists)
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Organization membership
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('therapist', 'admin', 'billing', 'owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- User-Site assignment
CREATE TABLE user_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  external_id TEXT, -- For integration with IEP systems
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discharged', 'on_hold')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caseload (Therapist-Student assignment)
CREATE TABLE caseloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  frequency TEXT, -- e.g., "2x30 min/week"
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(therapist_id, student_id, discipline)
);

-- Goals (IEP/IFSP goals)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  domain TEXT, -- e.g., "articulation", "fine motor", "behavior"
  description TEXT NOT NULL,
  target_criteria TEXT, -- e.g., "80% accuracy over 3 sessions"
  baseline TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('baseline', 'in_progress', 'met', 'discontinued')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (Session notes)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('present', 'absent', 'makeup', 'cancelled')),
  discipline TEXT NOT NULL,
  -- SOAP Note Content
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  -- Metadata
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'locked', 'amended')),
  signed_at TIMESTAMPTZ,
  signature_data JSONB, -- Digital signature info
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session-Goals junction (goals addressed in session)
CREATE TABLE session_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  progress_value NUMERIC, -- e.g., 80 for 80%
  progress_unit TEXT, -- e.g., "percent", "trials", "rating"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, goal_id)
);

-- Audit Log (HIPAA compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'sign'
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_org ON students(org_id);
CREATE INDEX idx_students_site ON students(site_id);
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_goals_student ON goals(student_id);
CREATE INDEX idx_caseloads_therapist ON caseloads(therapist_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
```

### 3.2 Row-Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE caseloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(org_id)
  FROM user_organizations
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: Users can see orgs they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id = ANY(get_user_org_ids()));

-- Students: Users can see students in their orgs
CREATE POLICY "Users can view students in their organizations"
  ON students FOR SELECT
  USING (org_id = ANY(get_user_org_ids()));

-- Sessions: Therapists see their own, admins see all in org
CREATE POLICY "Therapists can view their sessions"
  ON sessions FOR SELECT
  USING (
    therapist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = (SELECT org_id FROM students WHERE id = sessions.student_id)
      AND uo.role IN ('admin', 'owner', 'billing')
    )
  );

-- Sessions: Only therapist can insert/update their own sessions
CREATE POLICY "Therapists can create their sessions"
  ON sessions FOR INSERT
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update their draft sessions"
  ON sessions FOR UPDATE
  USING (therapist_id = auth.uid() AND status = 'draft');

-- Audit logs: Admins only
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'owner')
    )
  );
```

### 3.3 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │───┬───│     sites       │
└─────────────────┘   │   └─────────────────┘
         │            │            │
         │            │            │
         ▼            │            ▼
┌─────────────────┐   │   ┌─────────────────┐
│user_organizations│   │   │   user_sites    │
└─────────────────┘   │   └─────────────────┘
         │            │            │
         │            │            │
         ▼            │            ▼
┌─────────────────┐   │   ┌─────────────────┐
│    profiles     │───┴───│    students     │
└─────────────────┘       └─────────────────┘
         │                        │
         │                        ├────────────────┐
         │                        │                │
         ▼                        ▼                ▼
┌─────────────────┐       ┌─────────────────┐ ┌─────────┐
│    caseloads    │       │     goals       │ │sessions │
└─────────────────┘       └─────────────────┘ └─────────┘
                                  │                │
                                  │                │
                                  ▼                │
                          ┌─────────────────┐      │
                          │  session_goals  │◄─────┘
                          └─────────────────┘
```

---

## 4. API Design

### 4.1 API Architecture

Using Next.js Server Actions as primary API pattern (RSC-first):

```typescript
// app/actions/sessions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  studentId: z.string().uuid(),
  sessionDate: z.string().date(),
  startTime: z.string(),
  endTime: z.string(),
  attendanceStatus: z.enum(['present', 'absent', 'makeup', 'cancelled']),
  discipline: z.string(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
})

export async function createSession(formData: FormData) {
  const supabase = createClient()

  // Validate input
  const parsed = CreateSessionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Insert session
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      student_id: parsed.data.studentId,
      therapist_id: user.id,
      session_date: parsed.data.sessionDate,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      attendance_status: parsed.data.attendanceStatus,
      discipline: parsed.data.discipline,
      subjective: parsed.data.subjective,
      objective: parsed.data.objective,
      assessment: parsed.data.assessment,
      plan: parsed.data.plan,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log audit
  await logAudit(user.id, 'create', 'sessions', data.id, null, data)

  revalidatePath('/dashboard')
  revalidatePath(`/students/${parsed.data.studentId}`)

  return { data }
}
```

### 4.2 API Routes (for external integrations)

```
/api/
├── auth/
│   ├── callback          # Supabase auth callback
│   └── signout           # Sign out
├── ai/
│   └── prompt            # AI prompt generation
├── export/
│   └── pdf/[sessionId]   # PDF export
└── webhooks/
    └── supabase          # Realtime webhooks (future)
```

### 4.3 AI Integration API

```typescript
// app/api/ai/prompt/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const supabase = createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { discipline, goalDomain, section, currentText } = await request.json()

  // Build prompt - NO PHI included
  const prompt = buildPrompt(discipline, goalDomain, section, currentText)

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const response = await result.response

  return Response.json({
    suggestions: parseSuggestions(response.text())
  })
}

function buildPrompt(
  discipline: string,
  goalDomain: string,
  section: 'subjective' | 'objective' | 'assessment' | 'plan',
  currentText: string
): string {
  // Template-based prompts, no PHI
  const templates = {
    speech: {
      subjective: [
        "Student reported feeling confident about...",
        "Parent mentioned progress with...",
        "Student expressed interest in...",
      ],
      // ... more sections
    },
    // ... more disciplines
  }

  return `You are a clinical documentation assistant for ${discipline} therapy.
Generate 3-5 professional sentence starters for the ${section.toUpperCase()} section of a SOAP note.
Goal domain: ${goalDomain}
Current text: "${currentText}"

Requirements:
- Professional clinical language
- Measurable and observable terms
- No specific patient information
- Sentence starters only, not complete sentences

Return as JSON array of strings.`
}
```

---

## 5. Application Architecture

### 5.1 Folder Structure

```
theranote/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── sessions/
│   │   │           └── new/
│   │   │               └── page.tsx
│   │   ├── sessions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   └── prompt/
│   │   │       └── route.ts
│   │   ├── export/
│   │   │   └── pdf/
│   │   │       └── [sessionId]/
│   │   │           └── route.ts
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── sessions.ts
│   │   ├── goals.ts
│   │   └── reports.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── forms/
│   │   ├── session-form.tsx
│   │   ├── student-form.tsx
│   │   └── goal-form.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── recent-sessions.tsx
│   │   └── missing-docs-alert.tsx
│   ├── sessions/
│   │   ├── soap-editor.tsx
│   │   ├── ai-prompts-panel.tsx
│   │   ├── goal-selector.tsx
│   │   └── signature-pad.tsx
│   ├── students/
│   │   ├── student-list.tsx
│   │   ├── student-card.tsx
│   │   └── caseload-table.tsx
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   └── prompts.ts
│   ├── utils.ts
│   └── constants.ts
├── types/
│   ├── database.ts           # Generated from Supabase
│   └── index.ts
├── hooks/
│   ├── use-session-form.ts
│   └── use-ai-suggestions.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 5.2 Key Components

#### Session Note Editor

```typescript
// components/sessions/soap-editor.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SessionSchema } from '@/lib/schemas'
import { createSession, updateSession } from '@/app/actions/sessions'
import { AIPromptsPanel } from './ai-prompts-panel'
import { GoalSelector } from './goal-selector'
import { SignaturePad } from './signature-pad'

export function SOAPEditor({
  student,
  goals,
  existingSession
}: SOAPEditorProps) {
  const [activeSection, setActiveSection] = useState<'S' | 'O' | 'A' | 'P'>('S')

  const form = useForm({
    resolver: zodResolver(SessionSchema),
    defaultValues: existingSession || {
      studentId: student.id,
      sessionDate: new Date().toISOString().split('T')[0],
      attendanceStatus: 'present',
      discipline: student.discipline,
    }
  })

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="col-span-2 space-y-4">
        <SessionMetadata form={form} />
        <GoalSelector goals={goals} form={form} />

        <div className="grid grid-cols-2 gap-4">
          <SOAPSection
            label="Subjective"
            section="S"
            active={activeSection === 'S'}
            onFocus={() => setActiveSection('S')}
            form={form}
          />
          <SOAPSection
            label="Objective"
            section="O"
            active={activeSection === 'O'}
            onFocus={() => setActiveSection('O')}
            form={form}
          />
          <SOAPSection
            label="Assessment"
            section="A"
            active={activeSection === 'A'}
            onFocus={() => setActiveSection('A')}
            form={form}
          />
          <SOAPSection
            label="Plan"
            section="P"
            active={activeSection === 'P'}
            onFocus={() => setActiveSection('P')}
            form={form}
          />
        </div>

        <GoalProgress goals={form.watch('selectedGoals')} form={form} />

        <SessionActions form={form} />
      </div>

      {/* AI Prompts Sidebar */}
      <div className="col-span-1">
        <AIPromptsPanel
          discipline={student.discipline}
          activeSection={activeSection}
          selectedGoals={form.watch('selectedGoals')}
          onInsert={(text) => {
            const field = sectionToField[activeSection]
            const current = form.getValues(field) || ''
            form.setValue(field, current + text)
          }}
        />
      </div>
    </div>
  )
}
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Browser │────▶│ Next.js │────▶│ Supabase│────▶│   DB    │
│         │     │Middleware│    │  Auth   │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │               │               │               │
     │  1. Login     │               │               │
     │──────────────▶│               │               │
     │               │ 2. Verify     │               │
     │               │──────────────▶│               │
     │               │               │ 3. JWT        │
     │               │◀──────────────│               │
     │  4. Set Cookie│               │               │
     │◀──────────────│               │               │
     │               │               │               │
     │  5. Request   │               │               │
     │──────────────▶│               │               │
     │               │ 6. Verify JWT │               │
     │               │──────────────▶│               │
     │               │               │ 7. RLS Query  │
     │               │               │──────────────▶│
     │               │               │◀──────────────│
     │               │◀──────────────│               │
     │◀──────────────│               │               │
```

### 6.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| Authentication | Supabase Auth (JWT, httpOnly cookies) |
| Authorization | Row-Level Security (RLS) on all tables |
| Data Isolation | org_id-based multi-tenancy |
| Encryption at Rest | Supabase default (AES-256) |
| Encryption in Transit | TLS 1.3 (Vercel/Supabase) |
| Session Management | 30-min idle timeout, secure cookies |
| HIPAA Compliance | Supabase BAA, audit logging |
| AI Data Privacy | No PHI sent to AI - templates only |
| Audit Logging | All CRUD operations logged |

### 6.3 HIPAA Compliance Checklist

- [x] Business Associate Agreement (Supabase)
- [x] Data encryption at rest and in transit
- [x] Access controls (RBAC + RLS)
- [x] Audit logging
- [x] Session timeout
- [x] Unique user identification
- [x] Automatic logoff
- [ ] Backup and recovery (Supabase managed)
- [ ] Disaster recovery plan

---

## 7. Deployment Architecture

### 7.1 Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:3000 |
| Preview | PR previews | *.vercel.app |
| Staging | Pre-prod testing | staging.theranote.app |
| Production | Live | app.theranote.app |

### 7.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 7.3 Environment Variables

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
GEMINI_API_KEY=xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (Vercel)
# Same keys, production values
# Set via Vercel dashboard
```

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

| Area | Strategy |
|------|----------|
| Database | Indexes on foreign keys, query optimization |
| API | Server Components, streaming, caching |
| Frontend | Code splitting, lazy loading, image optimization |
| AI | Response caching, debounced requests |
| Assets | Vercel CDN, optimized images |

### 8.2 Caching Strategy

```typescript
// app/students/[id]/page.tsx
import { unstable_cache } from 'next/cache'

const getStudent = unstable_cache(
  async (id: string) => {
    const supabase = createClient()
    return supabase
      .from('students')
      .select('*, goals(*)')
      .eq('id', id)
      .single()
  },
  ['student'],
  { revalidate: 60, tags: ['student'] }
)
```

### 8.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | <2.5s | Vercel Analytics |
| FID | <100ms | Vercel Analytics |
| CLS | <0.1 | Vercel Analytics |
| API Response | <500ms | Server logs |
| AI Response | <3s | Client timing |

---

## 9. Future Architecture Considerations

### 9.1 Phase 1.5: Offline Mode

```
┌─────────────────────────────────────────────────────────┐
│                    PWA + IndexedDB                       │
├─────────────────────────────────────────────────────────┤
│  Service Worker │ Background Sync │ Local DB Cache     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    Sync when online
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                             │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Phase 2: ThriveSync Integration

- Shared authentication
- Cross-platform data access (therapist credentials → service auth)
- Unified dashboard
- Shared notification system

### 9.3 Phase 3: Scale Considerations

- Read replicas for reporting
- Edge caching for static data
- Microservices for heavy processing (PDF generation, analytics)
- Message queue for async operations

---

## 10. Implementation Sequence

### 10.1 Sprint 1: Foundation

1. Project setup (Next.js, Supabase, Tailwind)
2. Authentication flow
3. Database schema migration
4. Basic layout (sidebar, header)
5. Organization/site setup

### 10.2 Sprint 2: Core Features

1. Student management (CRUD)
2. Caseload assignment
3. Goal management
4. Session note editor (basic)

### 10.3 Sprint 3: AI & Polish

1. AI prompts integration
2. SOAP editor refinement
3. Goal progress tracking
4. Digital signature

### 10.4 Sprint 4: Reporting & Admin

1. Session logs and filtering
2. Missing documentation alerts
3. PDF export
4. Admin dashboard
5. User management

### 10.5 Sprint 5: Demo Prep

1. Sample data seeding
2. Performance optimization
3. Bug fixes
4. Demo environment setup

---

## Document Complete

**Created:** 2026-01-05
**Author:** Fawzi (Qualia Solutions)
**Status:** Ready for Implementation
