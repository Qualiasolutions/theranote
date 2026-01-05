-- TheraNote Initial Schema
-- Run this migration in your Supabase SQL editor

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
  discipline TEXT,
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
  external_id TEXT,
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
  frequency TEXT,
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
  domain TEXT,
  description TEXT NOT NULL,
  target_criteria TEXT,
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
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'locked', 'amended')),
  signed_at TIMESTAMPTZ,
  signature_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session-Goals junction
CREATE TABLE session_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  progress_value NUMERIC,
  progress_unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, goal_id)
);

-- Audit Log (HIPAA compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sites_org ON sites(org_id);
CREATE INDEX idx_students_org ON students(org_id);
CREATE INDEX idx_students_site ON students(site_id);
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_goals_student ON goals(student_id);
CREATE INDEX idx_caseloads_therapist ON caseloads(therapist_id);
CREATE INDEX idx_caseloads_student ON caseloads(student_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- Helper function: Get user's org IDs
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS UUID[] AS $$
  SELECT COALESCE(ARRAY_AGG(org_id), ARRAY[]::UUID[])
  FROM user_organizations
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
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

-- RLS Policies

-- Organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id = ANY(get_user_org_ids()));

-- Sites
CREATE POLICY "Users can view sites in their organizations"
  ON sites FOR SELECT
  USING (org_id = ANY(get_user_org_ids()));

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- User Organizations
CREATE POLICY "Users can view their own memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

-- Students
CREATE POLICY "Users can view students in their organizations"
  ON students FOR SELECT
  USING (org_id = ANY(get_user_org_ids()));

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  WITH CHECK (
    org_id = ANY(get_user_org_ids())
    AND EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
      AND org_id = students.org_id
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  USING (
    org_id = ANY(get_user_org_ids())
    AND EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
      AND org_id = students.org_id
      AND role IN ('admin', 'owner')
    )
  );

-- Goals
CREATE POLICY "Users can view goals for students in their org"
  ON goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = goals.student_id
      AND students.org_id = ANY(get_user_org_ids())
    )
  );

CREATE POLICY "Therapists can insert goals"
  ON goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = goals.student_id
      AND students.org_id = ANY(get_user_org_ids())
    )
  );

CREATE POLICY "Therapists can update goals"
  ON goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = goals.student_id
      AND students.org_id = ANY(get_user_org_ids())
    )
  );

-- Caseloads
CREATE POLICY "Users can view caseloads in their org"
  ON caseloads FOR SELECT
  USING (
    therapist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM students
      WHERE students.id = caseloads.student_id
      AND students.org_id = ANY(get_user_org_ids())
    )
  );

-- Sessions
CREATE POLICY "Therapists can view their own sessions"
  ON sessions FOR SELECT
  USING (therapist_id = auth.uid());

CREATE POLICY "Admins can view all sessions in org"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN user_organizations uo ON uo.org_id = s.org_id
      WHERE s.id = sessions.student_id
      AND uo.user_id = auth.uid()
      AND uo.role IN ('admin', 'owner', 'billing')
    )
  );

CREATE POLICY "Therapists can create their sessions"
  ON sessions FOR INSERT
  WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Therapists can update draft sessions"
  ON sessions FOR UPDATE
  USING (therapist_id = auth.uid() AND status = 'draft');

-- Session Goals
CREATE POLICY "Users can view session goals for their sessions"
  ON session_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_goals.session_id
      AND (
        sessions.therapist_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM students s
          JOIN user_organizations uo ON uo.org_id = s.org_id
          WHERE s.id = sessions.student_id
          AND uo.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Therapists can insert session goals"
  ON session_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_goals.session_id
      AND sessions.therapist_id = auth.uid()
    )
  );

-- Audit Logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Trigger for profile creation on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'therapist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
