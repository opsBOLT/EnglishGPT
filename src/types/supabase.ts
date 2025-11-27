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
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
        }
      }
      student_assessment: {
        Row: {
          id: string
          user_id: string
          reading_skill: 'A' | 'B' | 'C' | 'D'
          writing_skill: 'A' | 'B' | 'C' | 'D'
          analysis_skill: 'A' | 'B' | 'C' | 'D'
          weak_questions: string[]
          struggle_reasons: string | null
          study_methods_tried: string[]
          preferred_method: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null
          plan_structure: 'A' | 'B' | 'C' | 'D'
          weekly_hours: 'A' | 'B' | 'C' | 'D'
          exam_timeline: 'A' | 'B' | 'C' | 'D'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reading_skill: 'A' | 'B' | 'C' | 'D'
          writing_skill: 'A' | 'B' | 'C' | 'D'
          analysis_skill: 'A' | 'B' | 'C' | 'D'
          weak_questions?: string[]
          struggle_reasons?: string | null
          study_methods_tried?: string[]
          preferred_method?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null
          plan_structure: 'A' | 'B' | 'C' | 'D'
          weekly_hours: 'A' | 'B' | 'C' | 'D'
          exam_timeline: 'A' | 'B' | 'C' | 'D'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reading_skill?: 'A' | 'B' | 'C' | 'D'
          writing_skill?: 'A' | 'B' | 'C' | 'D'
          analysis_skill?: 'A' | 'B' | 'C' | 'D'
          weak_questions?: string[]
          struggle_reasons?: string | null
          study_methods_tried?: string[]
          preferred_method?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null
          plan_structure?: 'A' | 'B' | 'C' | 'D'
          weekly_hours?: 'A' | 'B' | 'C' | 'D'
          exam_timeline?: 'A' | 'B' | 'C' | 'D'
          created_at?: string
        }
      }
      study_plan: {
        Row: {
          id: string
          user_id: string
          plan_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'study' | 'practice'
          category: string | null
          duration_minutes: number | null
          quiz_correct: number
          quiz_incorrect: number
          questions_asked_ai: Json
          notes_made: string | null
          revision_methods: string[]
          weak_topics_identified: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: 'study' | 'practice'
          category?: string | null
          duration_minutes?: number | null
          quiz_correct?: number
          quiz_incorrect?: number
          questions_asked_ai?: Json
          notes_made?: string | null
          revision_methods?: string[]
          weak_topics_identified?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'study' | 'practice'
          category?: string | null
          duration_minutes?: number | null
          quiz_correct?: number
          quiz_incorrect?: number
          questions_asked_ai?: Json
          notes_made?: string | null
          revision_methods?: string[]
          weak_topics_identified?: string[]
          created_at?: string
        }
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          practice_type: 'personalized' | 'past_paper'
          paper_id: string | null
          total_grade: number | null
          questions_data: Json
          weak_points: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          practice_type: 'personalized' | 'past_paper'
          paper_id?: string | null
          total_grade?: number | null
          questions_data?: Json
          weak_points?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          practice_type?: 'personalized' | 'past_paper'
          paper_id?: string | null
          total_grade?: number | null
          questions_data?: Json
          weak_points?: string[]
          created_at?: string
        }
      }
      ai_memory: {
        Row: {
          id: string
          user_id: string
          memory_type: 'weak_topic' | 'preferred_method' | 'strength' | 'misconception'
          content: string
          confidence_score: number
          source_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memory_type: 'weak_topic' | 'preferred_method' | 'strength' | 'misconception'
          content: string
          confidence_score?: number
          source_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memory_type?: 'weak_topic' | 'preferred_method' | 'strength' | 'misconception'
          content?: string
          confidence_score?: number
          source_session_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
