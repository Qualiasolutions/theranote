export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          org_id: string
          name: string
          address: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          address?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          address?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'therapist' | 'admin' | 'billing'
          discipline: string | null
          license_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'therapist' | 'admin' | 'billing'
          discipline?: string | null
          license_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'therapist' | 'admin' | 'billing'
          discipline?: string | null
          license_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          org_id: string
          role: 'therapist' | 'admin' | 'billing' | 'owner'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          role: 'therapist' | 'admin' | 'billing' | 'owner'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string
          role?: 'therapist' | 'admin' | 'billing' | 'owner'
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          org_id: string
          site_id: string | null
          first_name: string
          last_name: string
          date_of_birth: string
          external_id: string | null
          osis_number: string | null
          grade_level: string | null
          service_type: string | null
          iep_start_date: string | null
          iep_end_date: string | null
          status: 'active' | 'discharged' | 'on_hold'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          site_id?: string | null
          first_name: string
          last_name: string
          date_of_birth: string
          external_id?: string | null
          osis_number?: string | null
          grade_level?: string | null
          service_type?: string | null
          iep_start_date?: string | null
          iep_end_date?: string | null
          status?: 'active' | 'discharged' | 'on_hold'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          site_id?: string | null
          first_name?: string
          last_name?: string
          date_of_birth?: string
          external_id?: string | null
          osis_number?: string | null
          grade_level?: string | null
          service_type?: string | null
          iep_start_date?: string | null
          iep_end_date?: string | null
          status?: 'active' | 'discharged' | 'on_hold'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      caseloads: {
        Row: {
          id: string
          therapist_id: string
          student_id: string
          discipline: string
          frequency: string | null
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          student_id: string
          discipline: string
          frequency?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          student_id?: string
          discipline?: string
          frequency?: string | null
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          student_id: string
          discipline: string
          domain: string | null
          description: string
          target_criteria: string | null
          baseline: string | null
          status: 'baseline' | 'in_progress' | 'met' | 'discontinued'
          start_date: string
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          discipline: string
          domain?: string | null
          description: string
          target_criteria?: string | null
          baseline?: string | null
          status?: 'baseline' | 'in_progress' | 'met' | 'discontinued'
          start_date?: string
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          discipline?: string
          domain?: string | null
          description?: string
          target_criteria?: string | null
          baseline?: string | null
          status?: 'baseline' | 'in_progress' | 'met' | 'discontinued'
          start_date?: string
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          student_id: string
          therapist_id: string
          site_id: string | null
          session_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          attendance_status: 'present' | 'absent' | 'makeup' | 'cancelled'
          discipline: string
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          status: 'draft' | 'signed' | 'locked' | 'amended'
          signed_at: string | null
          signature_data: Json | null
          original_session_id: string | null
          note_format: 'soap' | 'narrative'
          narrative_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          therapist_id: string
          site_id?: string | null
          session_date: string
          start_time: string
          end_time: string
          attendance_status: 'present' | 'absent' | 'makeup' | 'cancelled'
          discipline: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          status?: 'draft' | 'signed' | 'locked' | 'amended'
          signed_at?: string | null
          signature_data?: Json | null
          original_session_id?: string | null
          note_format?: 'soap' | 'narrative'
          narrative_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          therapist_id?: string
          site_id?: string | null
          session_date?: string
          start_time?: string
          end_time?: string
          attendance_status?: 'present' | 'absent' | 'makeup' | 'cancelled'
          discipline?: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          status?: 'draft' | 'signed' | 'locked' | 'amended'
          signed_at?: string | null
          signature_data?: Json | null
          original_session_id?: string | null
          note_format?: 'soap' | 'narrative'
          narrative_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      session_goals: {
        Row: {
          id: string
          session_id: string
          goal_id: string
          progress_value: number | null
          progress_unit: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          goal_id: string
          progress_value?: number | null
          progress_unit?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          goal_id?: string
          progress_value?: number | null
          progress_unit?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Site = Database['public']['Tables']['sites']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionGoal = Database['public']['Tables']['session_goals']['Row']
export type Caseload = Database['public']['Tables']['caseloads']['Row']

// Extended types with relations
export type StudentWithGoals = Student & { goals: Goal[] }
export type SessionWithGoals = Session & { session_goals: (SessionGoal & { goal: Goal })[] }
export type StudentWithCaseload = Student & { caseloads: Caseload[] }
