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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      onboarding_responses: {
        Row: {
          created_at: string | null
          exam_struggles: Json | null
          id: string
          user_id: string
          voice_intro_complete: boolean
        }
        Insert: {
          created_at?: string | null
          exam_struggles?: Json | null
          id?: string
          user_id: string
          voice_intro_complete?: boolean
        }
        Update: {
          created_at?: string | null
          exam_struggles?: Json | null
          id?: string
          user_id?: string
          voice_intro_complete?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string | null
          practice_type: string
          questions_data: Json | null
          total_grade: number | null
          user_id: string
          weak_points: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          practice_type: string
          questions_data?: Json | null
          total_grade?: number | null
          user_id: string
          weak_points?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          practice_type?: string
          questions_data?: Json | null
          total_grade?: number | null
          user_id?: string
          weak_points?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_ai_notes: {
        Row: {
          breakthrough_insight_ai_note: string | null
          composition_argumentative_ai_note: string | null
          composition_descriptive_ai_note: string | null
          composition_discursive_ai_note: string | null
          composition_narrative_ai_note: string | null
          inserted_at: string | null
          learning_style_ai_note: string | null
          motivation_pattern_ai_note: string | null
          onboarding_summary: string | null
          overall_strategy_ai_note: string | null
          paper1_extended_response_ai_note: string | null
          paper1_language_analysis_ai_note: string | null
          paper1_paraphrasing_ai_note: string | null
          paper1_readiness_ai_note: string | null
          paper1_reading_comprehension_ai_note: string | null
          paper1_summary_writing_ai_note: string | null
          paper1_vocabulary_ai_note: string | null
          paper2_readiness_ai_note: string | null
          recurring_errors_ai_note: string | null
          skill_evaluation_ai_note: string | null
          skill_paraphrasing_ai_note: string | null
          skill_punctuation_ai_note: string | null
          skill_qme_ai_note: string | null
          skill_register_ai_note: string | null
          skill_sentence_variety_ai_note: string | null
          skill_spelling_ai_note: string | null
          skill_vorpf_ai_note: string | null
          text_type_diary_ai_note: string | null
          text_type_interview_ai_note: string | null
          text_type_letter_ai_note: string | null
          text_type_magazine_ai_note: string | null
          text_type_newspaper_ai_note: string | null
          text_type_report_ai_note: string | null
          text_type_speech_ai_note: string | null
          under_pressure_ai_note: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          breakthrough_insight_ai_note?: string | null
          composition_argumentative_ai_note?: string | null
          composition_descriptive_ai_note?: string | null
          composition_discursive_ai_note?: string | null
          composition_narrative_ai_note?: string | null
          inserted_at?: string | null
          learning_style_ai_note?: string | null
          motivation_pattern_ai_note?: string | null
          onboarding_summary?: string | null
          overall_strategy_ai_note?: string | null
          paper1_extended_response_ai_note?: string | null
          paper1_language_analysis_ai_note?: string | null
          paper1_paraphrasing_ai_note?: string | null
          paper1_readiness_ai_note?: string | null
          paper1_reading_comprehension_ai_note?: string | null
          paper1_summary_writing_ai_note?: string | null
          paper1_vocabulary_ai_note?: string | null
          paper2_readiness_ai_note?: string | null
          recurring_errors_ai_note?: string | null
          skill_evaluation_ai_note?: string | null
          skill_paraphrasing_ai_note?: string | null
          skill_punctuation_ai_note?: string | null
          skill_qme_ai_note?: string | null
          skill_register_ai_note?: string | null
          skill_sentence_variety_ai_note?: string | null
          skill_spelling_ai_note?: string | null
          skill_vorpf_ai_note?: string | null
          text_type_diary_ai_note?: string | null
          text_type_interview_ai_note?: string | null
          text_type_letter_ai_note?: string | null
          text_type_magazine_ai_note?: string | null
          text_type_newspaper_ai_note?: string | null
          text_type_report_ai_note?: string | null
          text_type_speech_ai_note?: string | null
          under_pressure_ai_note?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          breakthrough_insight_ai_note?: string | null
          composition_argumentative_ai_note?: string | null
          composition_descriptive_ai_note?: string | null
          composition_discursive_ai_note?: string | null
          composition_narrative_ai_note?: string | null
          inserted_at?: string | null
          learning_style_ai_note?: string | null
          motivation_pattern_ai_note?: string | null
          onboarding_summary?: string | null
          overall_strategy_ai_note?: string | null
          paper1_extended_response_ai_note?: string | null
          paper1_language_analysis_ai_note?: string | null
          paper1_paraphrasing_ai_note?: string | null
          paper1_readiness_ai_note?: string | null
          paper1_reading_comprehension_ai_note?: string | null
          paper1_summary_writing_ai_note?: string | null
          paper1_vocabulary_ai_note?: string | null
          paper2_readiness_ai_note?: string | null
          recurring_errors_ai_note?: string | null
          skill_evaluation_ai_note?: string | null
          skill_paraphrasing_ai_note?: string | null
          skill_punctuation_ai_note?: string | null
          skill_qme_ai_note?: string | null
          skill_register_ai_note?: string | null
          skill_sentence_variety_ai_note?: string | null
          skill_spelling_ai_note?: string | null
          skill_vorpf_ai_note?: string | null
          text_type_diary_ai_note?: string | null
          text_type_interview_ai_note?: string | null
          text_type_letter_ai_note?: string | null
          text_type_magazine_ai_note?: string | null
          text_type_newspaper_ai_note?: string | null
          text_type_report_ai_note?: string | null
          text_type_speech_ai_note?: string | null
          under_pressure_ai_note?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_ai_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_progress: {
        Row: {
          category: string
          created_at: string | null
          id: string
          quiz_average: number | null
          sections_completed: number | null
          total_sections: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          quiz_average?: number | null
          sections_completed?: number | null
          total_sections?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          quiz_average?: number | null
          sections_completed?: number | null
          total_sections?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plan: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          plan_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          plan_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          plan_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          category: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes_made: string | null
          questions_asked_ai: Json | null
          quiz_correct: number | null
          quiz_incorrect: number | null
          revision_methods: string[] | null
          session_type: string
          user_id: string
          weak_topics_identified: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes_made?: string | null
          questions_asked_ai?: Json | null
          quiz_correct?: number | null
          quiz_incorrect?: number | null
          revision_methods?: string[] | null
          session_type: string
          user_id: string
          weak_topics_identified?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes_made?: string | null
          questions_asked_ai?: Json | null
          quiz_correct?: number | null
          quiz_incorrect?: number | null
          revision_methods?: string[] | null
          session_type?: string
          user_id?: string
          weak_topics_identified?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metadata: {
        Row: {
          created_at: string | null
          dashboard_visits: number | null
          id: string
          last_visit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_visits?: number | null
          id?: string
          last_visit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_visits?: number | null
          id?: string
          last_visit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
