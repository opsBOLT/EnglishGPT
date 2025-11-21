/*
  # Initial Schema for AI-Powered English Exam Preparation Platform

  ## Overview
  This migration creates the complete database schema for an intelligent exam preparation system
  with personalized study plans, AI interactions, progress tracking, and comprehensive analytics.

  ## Tables Created

  ### 1. users
  Extended user profile with onboarding status
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `onboarding_completed` (boolean) - Whether initial assessment is done
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. onboarding_responses
  Stores the 10 initial assessment questions and answers
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - References users
  - `reading_skill` (integer) - Self-assessed reading skill (1-5)
  - `writing_skill` (integer) - Self-assessed writing skill (1-5)
  - `analysis_skill` (integer) - Self-assessed analysis skill (1-5)
  - `exam_struggles` (jsonb) - Array of specific struggles
  - `difficulty_explanation` (text) - Open-ended difficulties
  - `study_methods` (jsonb) - Preferred study methods
  - `study_time_availability` (text) - Available study time
  - `plan_preference` (text) - Study plan structure preference
  - `stress_level` (integer) - Current stress level (1-5)
  - `created_at` (timestamptz)

  ### 3. study_plans
  AI-generated personalized weekly study plans
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `week_number` (integer) - Week of study plan
  - `created_at` (timestamptz)

  ### 4. daily_tasks
  Individual study tasks within weekly plans
  - `id` (uuid, primary key)
  - `study_plan_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `day_of_week` (integer) - 0-6 for Sunday-Saturday
  - `category` (text) - Study category
  - `title` (text) - Task title
  - `description` (text) - Task description
  - `time_slot` (text) - Scheduled time
  - `duration_minutes` (integer) - Expected duration
  - `status` (text) - upcoming/ongoing/completed
  - `scheduled_date` (date) - Actual scheduled date
  - `created_at` (timestamptz)

  ### 5. study_sessions
  Tracks active and completed study sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `category` (text) - Study category
  - `start_time` (timestamptz) - Session start
  - `end_time` (timestamptz) - Session end (null if active)
  - `duration_minutes` (integer) - Total duration
  - `notes` (text) - Session notes
  - `ai_questions_count` (integer) - Number of AI questions asked
  - `quiz_score` (numeric) - Quiz performance
  - `status` (text) - active/completed/paused

  ### 6. quizzes
  Quiz results from study sessions
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `total_score` (integer) - Points earned
  - `max_score` (integer) - Maximum possible points
  - `completed_at` (timestamptz)

  ### 7. quiz_questions
  Individual questions within quizzes
  - `id` (uuid, primary key)
  - `quiz_id` (uuid, foreign key)
  - `question_text` (text)
  - `question_type` (text) - multiple_choice/fill_blank/short_answer
  - `student_answer` (text)
  - `correct_answer` (text)
  - `is_correct` (boolean)
  - `time_taken_seconds` (integer)
  - `ai_feedback` (text)

  ### 8. ai_interactions
  Logs all AI buddy conversations
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `session_id` (uuid, foreign key)
  - `question` (text) - Student's question
  - `response` (text) - AI's response
  - `context_type` (text) - study/practice
  - `created_at` (timestamptz)

  ### 9. student_notes
  User-created notes during sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `session_id` (uuid, foreign key)
  - `category` (text)
  - `content` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 10. weakness_analysis
  AI-identified weak areas from performance
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `topic` (text) - Weak topic identified
  - `severity` (text) - low/medium/high
  - `identified_from` (text) - quiz/ai_interaction/practice
  - `occurrences` (integer) - Number of times identified
  - `last_identified` (timestamptz)

  ### 11. practice_questions
  Bank of exam questions for practice
  - `id` (uuid, primary key)
  - `paper_number` (integer) - Paper 1 or 2
  - `year` (integer) - Exam year
  - `question_number` (integer)
  - `question_text` (text)
  - `question_type` (text)
  - `difficulty` (text) - easy/medium/hard
  - `marking_scheme` (text)
  - `max_marks` (integer)

  ### 12. practice_attempts
  Student attempts at practice questions
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `question_id` (uuid, foreign key)
  - `student_answer` (text)
  - `marks_awarded` (integer)
  - `ai_feedback` (text)
  - `time_taken_seconds` (integer)
  - `created_at` (timestamptz)

  ### 13. student_progress
  Overall progress tracking per category
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `category` (text)
  - `sections_completed` (integer)
  - `total_sections` (integer)
  - `last_accessed` (timestamptz)
  - `quiz_average` (numeric)

  ### 14. scheduled_sessions
  Calendar-based session scheduling
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `title` (text)
  - `category` (text)
  - `scheduled_start` (timestamptz)
  - `duration_minutes` (integer)
  - `is_recurring` (boolean)
  - `recurrence_pattern` (text)
  - `status` (text) - scheduled/completed/cancelled
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Authenticated users required for all operations
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Onboarding responses
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reading_skill integer NOT NULL CHECK (reading_skill BETWEEN 1 AND 5),
  writing_skill integer NOT NULL CHECK (writing_skill BETWEEN 1 AND 5),
  analysis_skill integer NOT NULL CHECK (analysis_skill BETWEEN 1 AND 5),
  exam_struggles jsonb DEFAULT '[]'::jsonb,
  difficulty_explanation text DEFAULT '',
  study_methods jsonb DEFAULT '[]'::jsonb,
  study_time_availability text DEFAULT '',
  plan_preference text DEFAULT '',
  stress_level integer NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON onboarding_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding"
  ON onboarding_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON onboarding_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study plans
CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study plans"
  ON study_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plans"
  ON study_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plans"
  ON study_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id uuid REFERENCES study_plans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  category text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  time_slot text NOT NULL,
  duration_minutes integer NOT NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  scheduled_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON daily_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON daily_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON daily_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON daily_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer DEFAULT 0,
  notes text DEFAULT '',
  ai_questions_count integer DEFAULT 0,
  quiz_score numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused'))
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  total_score integer DEFAULT 0,
  max_score integer NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_blank', 'short_answer')),
  student_answer text DEFAULT '',
  correct_answer text NOT NULL,
  is_correct boolean DEFAULT false,
  time_taken_seconds integer DEFAULT 0,
  ai_feedback text DEFAULT ''
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own quiz questions"
  ON quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own quiz questions"
  ON quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- AI interactions
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  question text NOT NULL,
  response text NOT NULL,
  context_type text NOT NULL CHECK (context_type IN ('study', 'practice')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interactions"
  ON ai_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Student notes
CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE,
  category text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON student_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON student_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON student_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON student_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weakness analysis
CREATE TABLE IF NOT EXISTS weakness_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  identified_from text NOT NULL CHECK (identified_from IN ('quiz', 'ai_interaction', 'practice')),
  occurrences integer DEFAULT 1,
  last_identified timestamptz DEFAULT now()
);

ALTER TABLE weakness_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weaknesses"
  ON weakness_analysis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weaknesses"
  ON weakness_analysis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weaknesses"
  ON weakness_analysis FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Practice questions
CREATE TABLE IF NOT EXISTS practice_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_number integer NOT NULL CHECK (paper_number IN (1, 2)),
  year integer NOT NULL,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marking_scheme text NOT NULL,
  max_marks integer NOT NULL
);

ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON practice_questions FOR SELECT
  TO authenticated
  USING (true);

-- Practice attempts
CREATE TABLE IF NOT EXISTS practice_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES practice_questions(id) ON DELETE CASCADE NOT NULL,
  student_answer text NOT NULL,
  marks_awarded integer NOT NULL,
  ai_feedback text DEFAULT '',
  time_taken_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON practice_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON practice_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Student progress
CREATE TABLE IF NOT EXISTS student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  sections_completed integer DEFAULT 0,
  total_sections integer NOT NULL,
  last_accessed timestamptz DEFAULT now(),
  quiz_average numeric DEFAULT 0,
  UNIQUE(user_id, category)
);

ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON student_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON student_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON student_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled sessions
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  scheduled_start timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled sessions"
  ON scheduled_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled sessions"
  ON scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled sessions"
  ON scheduled_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled sessions"
  ON scheduled_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session ON ai_interactions(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user ON practice_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_user_date ON scheduled_sessions(user_id, scheduled_start);
