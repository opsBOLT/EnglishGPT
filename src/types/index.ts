export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  onboarding_completed: boolean;
}

export interface OnboardingResponse {
  id: string;
  user_id: string;
  voice_intro_complete: boolean;
  exam_struggles: string[];
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  week_number: number;
  daily_tasks: DailyTask[];
  created_at: string;
}

export interface DailyTask {
  id: string;
  study_plan_id: string;
  day_of_week: number;
  category: 'paper1' | 'paper2' | 'examples' | 'text_types' | 'vocabulary';
  title: string;
  description: string;
  time_slot: string;
  duration_minutes: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  scheduled_date: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  category: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  notes: string;
  ai_questions_count: number;
  quiz_score: number | null;
  status: 'active' | 'completed' | 'paused';
}

export interface Quiz {
  id: string;
  session_id: string;
  user_id: string;
  questions: QuizQuestion[];
  total_score: number;
  max_score: number;
  completed_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'short_answer';
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  ai_feedback: string;
}

export interface AIInteraction {
  id: string;
  user_id: string;
  session_id: string;
  question: string;
  response: string;
  context_type: 'study' | 'practice';
  created_at: string;
}

export interface StudentNote {
  id: string;
  user_id: string;
  session_id: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface WeaknessAnalysis {
  id: string;
  user_id: string;
  topic: string;
  severity: 'low' | 'medium' | 'high';
  identified_from: 'quiz' | 'ai_interaction' | 'practice';
  occurrences: number;
  last_identified: string;
}

export interface PracticeQuestion {
  id: string;
  paper_number: number;
  year: number;
  question_number: number;
  question_text: string;
  question_type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marking_scheme: string;
  max_marks: number;
}

export interface PracticeAttempt {
  id: string;
  user_id: string;
  question_id: string;
  student_answer: string;
  marks_awarded: number;
  ai_feedback: string;
  time_taken_seconds: number;
  created_at: string;
}

export interface StudentProgress {
  id: string;
  user_id: string;
  category: string;
  sections_completed: number;
  total_sections: number;
  last_accessed: string;
  quiz_average: number;
}

export interface ScheduledSession {
  id: string;
  user_id: string;
  title: string;
  category: string;
  scheduled_start: string;
  duration_minutes: number;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
}
