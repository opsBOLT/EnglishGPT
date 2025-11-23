/*
  # Update Onboarding Schema

  ## Changes
  Updates the onboarding_responses table to match the simplified questionnaire:

  1. Changes reading_skill, writing_skill, analysis_skill from integer (1-5) to text (A/B/C/D)
  2. Keeps exam_struggles and difficulty_explanation for paper weaknesses
  3. Removes study methods, preferences, time availability, and exam proximity fields
*/

-- Drop the old table and recreate with new schema
-- Note: In production, you'd want to migrate data, but for initial development this is cleaner
DROP TABLE IF EXISTS onboarding_responses CASCADE;

CREATE TABLE onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Section 1: Reading, Writing & Analysis Skills (Q1-Q3)
  reading_skill text NOT NULL CHECK (reading_skill IN ('A', 'B', 'C', 'D')),
  writing_skill text NOT NULL CHECK (writing_skill IN ('A', 'B', 'C', 'D')),
  analysis_skill text NOT NULL CHECK (analysis_skill IN ('A', 'B', 'C', 'D')),

  -- Section 2: Specific Paper Weaknesses (Q4-Q5)
  exam_struggles jsonb DEFAULT '[]'::jsonb,
  difficulty_explanation text DEFAULT '',

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
