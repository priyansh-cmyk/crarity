export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_sessions: {
        Row: {
          candidate_status: string
          city: string | null
          comfortable_with_office: boolean | null
          completed: boolean
          created_at: string
          current_step: string
          email: string | null
          id: string
          invitation_sent_at: string | null
          invited_by: string | null
          languages: string[]
          name: string | null
          phone: string | null
          pipeline_status: string
          prior_experience: boolean | null
          prior_experience_duration: string | null
          profile_completed: boolean
          relocation_timeline: string | null
          resume_url: string | null
          role_id: string | null
          role_type: string
          scores: Json
          source: string
          start_timeline: string | null
          status: string
          telemetry: Json
          total_score: number
          updated_at: string
          updated_by: string | null
          weekend_availability: boolean | null
          willing_to_relocate: boolean | null
        }
        Insert: {
          candidate_status?: string
          city?: string | null
          comfortable_with_office?: boolean | null
          completed?: boolean
          created_at?: string
          current_step?: string
          email?: string | null
          id?: string
          invitation_sent_at?: string | null
          invited_by?: string | null
          languages?: string[]
          name?: string | null
          phone?: string | null
          pipeline_status?: string
          prior_experience?: boolean | null
          prior_experience_duration?: string | null
          profile_completed?: boolean
          relocation_timeline?: string | null
          resume_url?: string | null
          role_id?: string | null
          role_type?: string
          scores?: Json
          source?: string
          start_timeline?: string | null
          status?: string
          telemetry?: Json
          total_score?: number
          updated_at?: string
          updated_by?: string | null
          weekend_availability?: boolean | null
          willing_to_relocate?: boolean | null
        }
        Update: {
          candidate_status?: string
          city?: string | null
          comfortable_with_office?: boolean | null
          completed?: boolean
          created_at?: string
          current_step?: string
          email?: string | null
          id?: string
          invitation_sent_at?: string | null
          invited_by?: string | null
          languages?: string[]
          name?: string | null
          phone?: string | null
          pipeline_status?: string
          prior_experience?: boolean | null
          prior_experience_duration?: string | null
          profile_completed?: boolean
          relocation_timeline?: string | null
          resume_url?: string | null
          role_id?: string | null
          role_type?: string
          scores?: Json
          source?: string
          start_timeline?: string | null
          status?: string
          telemetry?: Json
          total_score?: number
          updated_at?: string
          updated_by?: string | null
          weekend_availability?: boolean | null
          willing_to_relocate?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_roles: {
        Row: {
          applied_at: string
          candidate_id: string
          created_at: string
          employer_notes: string | null
          id: string
          role_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          candidate_id: string
          created_at?: string
          employer_notes?: string | null
          id?: string
          role_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          candidate_id?: string
          created_at?: string
          employer_notes?: string | null
          id?: string
          role_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_roles_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          availability: string | null
          city: string | null
          country: string | null
          created_at: string
          education: Json | null
          email: string
          first_name: string
          id: string
          languages: string[] | null
          last_name: string
          phone: string | null
          portfolio_url: string | null
          region: string | null
          resume_url: string | null
          updated_at: string
          user_id: string | null
          video_intro_url: string | null
          work_experience: Json | null
          work_preference: string | null
        }
        Insert: {
          availability?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          education?: Json | null
          email: string
          first_name: string
          id?: string
          languages?: string[] | null
          last_name: string
          phone?: string | null
          portfolio_url?: string | null
          region?: string | null
          resume_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_intro_url?: string | null
          work_experience?: Json | null
          work_preference?: string | null
        }
        Update: {
          availability?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          education?: Json | null
          email?: string
          first_name?: string
          id?: string
          languages?: string[] | null
          last_name?: string
          phone?: string | null
          portfolio_url?: string | null
          region?: string | null
          resume_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_intro_url?: string | null
          work_experience?: Json | null
          work_preference?: string | null
        }
        Relationships: []
      }
      interviews: {
        Row: {
          created_at: string
          duration_minutes: number
          employer_id: string
          feedback: string | null
          google_meet_link: string | null
          id: string
          interview_type: string
          notes: string | null
          scheduled_at: string
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          employer_id: string
          feedback?: string | null
          google_meet_link?: string | null
          id?: string
          interview_type?: string
          notes?: string | null
          scheduled_at: string
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          employer_id?: string
          feedback?: string | null
          google_meet_link?: string | null
          id?: string
          interview_type?: string
          notes?: string | null
          scheduled_at?: string
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          actively_hiring: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          hiring_roles: string | null
          id: string
          linkedin_url: string | null
          referral: string | null
          team_size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          actively_hiring?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hiring_roles?: string | null
          id: string
          linkedin_url?: string | null
          referral?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          actively_hiring?: string | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          hiring_roles?: string | null
          id?: string
          linkedin_url?: string | null
          referral?: string | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          custom_requirements: Json | null
          id: string
          is_custom: boolean
          role_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_requirements?: Json | null
          id?: string
          is_custom?: boolean
          role_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_requirements?: Json | null
          id?: string
          is_custom?: boolean
          role_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          candidate_id: string
          completed_at: string
          details: Json | null
          id: string
          max_score: number
          response: string | null
          score: number
          task_prompt: string | null
          test_name: string
        }
        Insert: {
          candidate_id: string
          completed_at?: string
          details?: Json | null
          id?: string
          max_score?: number
          response?: string | null
          score: number
          task_prompt?: string | null
          test_name: string
        }
        Update: {
          candidate_id?: string
          completed_at?: string
          details?: Json | null
          id?: string
          max_score?: number
          response?: string | null
          score?: number
          task_prompt?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      assessment_sessions_public: {
        Row: {
          city: string | null
          completed: boolean | null
          created_at: string | null
          current_step: string | null
          id: string | null
          role_id: string | null
          role_type: string | null
          scores: Json | null
          status: string | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: string | null
          id?: string | null
          role_id?: string | null
          role_type?: string | null
          scores?: Json | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          completed?: boolean | null
          created_at?: string | null
          current_step?: string | null
          id?: string | null
          role_id?: string | null
          role_type?: string | null
          scores?: Json | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_session_to_user: {
        Args: { _session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "student" | "employer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "student", "employer"],
    },
  },
} as const
