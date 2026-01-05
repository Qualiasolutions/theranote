export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budgeted_amount: number
          category: string
          created_at: string | null
          fiscal_year: number
          id: string
          notes: string | null
          org_id: string | null
          updated_at: string | null
        }
        Insert: {
          budgeted_amount: number
          category: string
          created_at?: string | null
          fiscal_year: number
          id?: string
          notes?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budgeted_amount?: number
          category?: string
          created_at?: string | null
          fiscal_year?: number
          id?: string
          notes?: string | null
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      caseloads: {
        Row: {
          created_at: string | null
          discipline: string
          end_date: string | null
          frequency: string | null
          id: string
          start_date: string
          student_id: string | null
          therapist_id: string | null
        }
        Insert: {
          created_at?: string | null
          discipline: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          start_date?: string
          student_id?: string | null
          therapist_id?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          start_date?: string
          student_id?: string | null
          therapist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caseloads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caseloads_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_assignments: {
        Row: {
          classroom_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          start_date: string | null
          student_id: string | null
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          student_id?: string | null
        }
        Update: {
          classroom_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_staff: {
        Row: {
          classroom_id: string | null
          created_at: string | null
          end_date: string | null
          id: string
          profile_id: string | null
          role: string | null
          start_date: string | null
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          profile_id?: string | null
          role?: string | null
          start_date?: string | null
        }
        Update: {
          classroom_id?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          profile_id?: string | null
          role?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_staff_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          name: string
          org_id: string | null
          ratio_requirement: string | null
          room_type: string | null
          site_id: string | null
          square_footage: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name: string
          org_id?: string | null
          ratio_requirement?: string | null
          room_type?: string | null
          site_id?: string | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string | null
          ratio_requirement?: string | null
          room_type?: string | null
          site_id?: string | null
          square_footage?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          alert_type: string | null
          compliance_evidence_id: string | null
          compliance_item_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          org_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          title: string
        }
        Insert: {
          alert_type?: string | null
          compliance_evidence_id?: string | null
          compliance_item_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          alert_type?: string | null
          compliance_evidence_id?: string | null
          compliance_item_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          org_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_compliance_evidence_id_fkey"
            columns: ["compliance_evidence_id"]
            isOneToOne: false
            referencedRelation: "compliance_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_compliance_item_id_fkey"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_evidence: {
        Row: {
          compliance_item_id: string | null
          created_at: string | null
          document_url: string | null
          evidence_date: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          org_id: string | null
          profile_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          site_id: string | null
          status: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          compliance_item_id?: string | null
          created_at?: string | null
          document_url?: string | null
          evidence_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          compliance_item_id?: string | null
          created_at?: string | null
          document_url?: string | null
          evidence_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_evidence_compliance_item_id_fkey"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_evidence_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_evidence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_evidence_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_evidence_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_items: {
        Row: {
          applies_to: string | null
          category: string
          created_at: string | null
          description: string | null
          frequency: string | null
          id: string
          item_name: string
          org_id: string | null
          required: boolean | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          item_name: string
          org_id?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          item_name?: string
          org_id?: string | null
          required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          classroom_id: string | null
          created_at: string | null
          created_by: string | null
          headcount: number | null
          health_check_completed: boolean | null
          id: string
          log_date: string
          notes: string | null
          org_id: string | null
          ratio_met: boolean | null
          safety_check_completed: boolean | null
          staff_count: number | null
          temperature_logged: boolean | null
          updated_at: string | null
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          headcount?: number | null
          health_check_completed?: boolean | null
          id?: string
          log_date?: string
          notes?: string | null
          org_id?: string | null
          ratio_met?: boolean | null
          safety_check_completed?: boolean | null
          staff_count?: number | null
          temperature_logged?: boolean | null
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          headcount?: number | null
          health_check_completed?: boolean | null
          id?: string
          log_date?: string
          notes?: string | null
          org_id?: string | null
          ratio_met?: boolean | null
          safety_check_completed?: boolean | null
          staff_count?: number | null
          temperature_logged?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          allocation_type: string | null
          amount: number
          approved_by: string | null
          category: string | null
          cost_center: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expense_date: string | null
          id: string
          org_id: string | null
          payment_method: string | null
          receipt_url: string | null
          site_id: string | null
          status: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          allocation_type?: string | null
          amount: number
          approved_by?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          org_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          allocation_type?: string | null
          amount?: number
          approved_by?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          org_id?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      family_communications: {
        Row: {
          communication_date: string | null
          communication_type: string | null
          contact_id: string | null
          content: string | null
          created_at: string | null
          direction: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          logged_by: string | null
          org_id: string | null
          outcome: string | null
          student_id: string | null
          subject: string | null
        }
        Insert: {
          communication_date?: string | null
          communication_type?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          logged_by?: string | null
          org_id?: string | null
          outcome?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          communication_date?: string | null
          communication_type?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          logged_by?: string | null
          org_id?: string | null
          outcome?: string | null
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "family_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_communications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      family_contacts: {
        Row: {
          address: string | null
          can_pickup: boolean | null
          created_at: string | null
          email: string | null
          id: string
          is_emergency_contact: boolean | null
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          relationship: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          can_pickup?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          relationship?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          can_pickup?: boolean | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_emergency_contact?: boolean | null
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          relationship?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          baseline: string | null
          created_at: string | null
          description: string
          discipline: string
          domain: string | null
          id: string
          start_date: string
          status: string
          student_id: string | null
          target_criteria: string | null
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          baseline?: string | null
          created_at?: string | null
          description: string
          discipline: string
          domain?: string | null
          id?: string
          start_date?: string
          status?: string
          student_id?: string | null
          target_criteria?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          baseline?: string | null
          created_at?: string | null
          description?: string
          discipline?: string
          domain?: string | null
          id?: string
          start_date?: string
          status?: string
          student_id?: string | null
          target_criteria?: string | null
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          admin_notified: boolean | null
          antecedent: string | null
          behavior: string | null
          consequence: string | null
          created_at: string | null
          description: string
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          incident_date: string
          incident_time: string
          incident_type: string
          interventions: string | null
          location: string | null
          organization_id: string | null
          outcome: string | null
          parent_notified: boolean | null
          reporter_id: string | null
          severity: string
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notified?: boolean | null
          antecedent?: string | null
          behavior?: string | null
          consequence?: string | null
          created_at?: string | null
          description: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_date?: string
          incident_time: string
          incident_type: string
          interventions?: string | null
          location?: string | null
          organization_id?: string | null
          outcome?: string | null
          parent_notified?: boolean | null
          reporter_id?: string | null
          severity?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notified?: boolean | null
          antecedent?: string | null
          behavior?: string | null
          consequence?: string | null
          created_at?: string | null
          description?: string
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_date?: string
          incident_time?: string
          incident_type?: string
          interventions?: string | null
          location?: string | null
          organization_id?: string | null
          outcome?: string | null
          parent_notified?: boolean | null
          reporter_id?: string | null
          severity?: string
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          discipline: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          discipline?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          discipline?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          discipline: string | null
          email: string
          full_name: string
          id: string
          license_number: string | null
          organization_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discipline?: string | null
          email: string
          full_name: string
          id: string
          license_number?: string | null
          organization_id?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discipline?: string | null
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          organization_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_allocations: {
        Row: {
          admin_percentage: number | null
          created_at: string | null
          created_by: string | null
          direct_percentage: number | null
          id: string
          non_direct_percentage: number | null
          notes: string | null
          org_id: string | null
          period_end: string
          period_start: string
          profile_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          direct_percentage?: number | null
          id?: string
          non_direct_percentage?: number | null
          notes?: string | null
          org_id?: string | null
          period_end: string
          period_start: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          direct_percentage?: number | null
          id?: string
          non_direct_percentage?: number | null
          notes?: string | null
          org_id?: string | null
          period_end?: string
          period_start?: string
          profile_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_allocations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_goals: {
        Row: {
          created_at: string | null
          goal_id: string | null
          id: string
          notes: string | null
          progress_unit: string | null
          progress_value: number | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          progress_unit?: string | null
          progress_value?: number | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          progress_unit?: string | null
          progress_value?: number | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_goals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          assessment: string | null
          attendance_status: string
          created_at: string | null
          discipline: string
          duration_minutes: number | null
          end_time: string
          id: string
          objective: string | null
          plan: string | null
          session_date: string
          signature_data: Json | null
          signed_at: string | null
          site_id: string | null
          start_time: string
          status: string
          student_id: string | null
          subjective: string | null
          therapist_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment?: string | null
          attendance_status: string
          created_at?: string | null
          discipline: string
          duration_minutes?: number | null
          end_time: string
          id?: string
          objective?: string | null
          plan?: string | null
          session_date: string
          signature_data?: Json | null
          signed_at?: string | null
          site_id?: string | null
          start_time: string
          status?: string
          student_id?: string | null
          subjective?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment?: string | null
          attendance_status?: string
          created_at?: string | null
          discipline?: string
          duration_minutes?: number | null
          end_time?: string
          id?: string
          objective?: string | null
          plan?: string | null
          session_date?: string
          signature_data?: Json | null
          signed_at?: string | null
          site_id?: string | null
          start_time?: string
          status?: string
          student_id?: string | null
          subjective?: string | null
          therapist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          org_id: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          org_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          attendance_date: string
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          org_id: string | null
          profile_id: string | null
          site_id: string | null
          status: string | null
        }
        Insert: {
          attendance_date: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          profile_id?: string | null
          site_id?: string | null
          status?: string | null
        }
        Update: {
          attendance_date?: string
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          profile_id?: string | null
          site_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_credentials: {
        Row: {
          created_at: string | null
          credential_name: string
          credential_type: string
          document_url: string | null
          expiration_date: string | null
          id: string
          issued_date: string | null
          notes: string | null
          profile_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credential_name: string
          credential_type: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credential_name?: string
          credential_type?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          issued_date?: string | null
          notes?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_credentials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          document_type: string | null
          document_url: string | null
          id: string
          org_id: string | null
          profile_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          org_id?: string | null
          profile_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          org_id?: string | null
          profile_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string | null
          date_of_birth: string
          external_id: string | null
          first_name: string
          id: string
          last_name: string
          org_id: string | null
          settings: Json | null
          site_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          external_id?: string | null
          first_name: string
          id?: string
          last_name: string
          org_id?: string | null
          settings?: Json | null
          site_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          external_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          org_id?: string | null
          settings?: Json | null
          site_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string | null
          id: string
          org_id: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sites: {
        Row: {
          created_at: string | null
          id: string
          site_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          site_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          site_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types - TheraNote
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Site = Database['public']['Tables']['sites']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type SessionGoal = Database['public']['Tables']['session_goals']['Row']
export type Caseload = Database['public']['Tables']['caseloads']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']

// Convenience types - ThriveSync Staff
export type StaffCredential = Database['public']['Tables']['staff_credentials']['Row']
export type StaffAttendance = Database['public']['Tables']['staff_attendance']['Row']
export type StaffDocument = Database['public']['Tables']['staff_documents']['Row']

// Convenience types - ThriveSync Classrooms
export type Classroom = Database['public']['Tables']['classrooms']['Row']
export type ClassroomAssignment = Database['public']['Tables']['classroom_assignments']['Row']
export type ClassroomStaff = Database['public']['Tables']['classroom_staff']['Row']
export type DailyLog = Database['public']['Tables']['daily_logs']['Row']

// Convenience types - ThriveSync Finance
export type Expense = Database['public']['Tables']['expenses']['Row']
export type SalaryAllocation = Database['public']['Tables']['salary_allocations']['Row']
export type BudgetItem = Database['public']['Tables']['budget_items']['Row']

// Convenience types - ThriveSync Compliance
export type ComplianceItem = Database['public']['Tables']['compliance_items']['Row']
export type ComplianceEvidence = Database['public']['Tables']['compliance_evidence']['Row']
export type ComplianceAlert = Database['public']['Tables']['compliance_alerts']['Row']

// Convenience types - ThriveSync Family
export type FamilyContact = Database['public']['Tables']['family_contacts']['Row']
export type FamilyCommunication = Database['public']['Tables']['family_communications']['Row']

// Extended types with relations
export type StudentWithGoals = Student & { goals: Goal[] }
export type SessionWithGoals = Session & { session_goals: (SessionGoal & { goal: Goal })[] }
export type StudentWithCaseload = Student & { caseloads: Caseload[] }
export type ProfileWithCredentials = Profile & { staff_credentials: StaffCredential[] }
export type ClassroomWithStaff = Classroom & { classroom_staff: (ClassroomStaff & { profile: Profile })[] }
export type ClassroomWithStudents = Classroom & { classroom_assignments: (ClassroomAssignment & { student: Student })[] }
