/*
  # Store onboarding conversation summaries and generated study plans

  ## Summary
  - Adds `student_assessment` to persist the OpenAI Realtime onboarding summary (and related assessment fields) keyed by user.
  - Adds `study_plan` to store the normalized JSON study plan generated after onboarding/marking.
  - RLS policies ensure users can only access their own rows.
*/

-- Table to hold onboarding summary + assessment signals
CREATE TABLE IF NOT EXISTS student_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Core skills captured as grades (A-D). Nullable so we can upsert summaries before full data is present.
  reading_skill text CHECK (reading_skill IN ('A', 'B', 'C', 'D')),
  writing_skill text CHECK (writing_skill IN ('A', 'B', 'C', 'D')),
  analysis_skill text CHECK (analysis_skill IN ('A', 'B', 'C', 'D')),
  -- Free-form list of weak questions/areas (maps to onboarding exam struggles)
  weak_questions text[] DEFAULT '{}'::text[],
  -- OpenAI Realtime conversation summary lives here
  struggle_reasons text,
  -- Additional context for future UI flows
  study_methods_tried text[] DEFAULT '{}'::text[],
  preferred_method text CHECK (preferred_method IN ('A', 'B', 'C', 'D', 'E', 'F')),
  plan_structure text CHECK (plan_structure IN ('A', 'B', 'C', 'D')),
  weekly_hours text CHECK (weekly_hours IN ('A', 'B', 'C', 'D')),
  exam_timeline text CHECK (exam_timeline IN ('A', 'B', 'C', 'D')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_assessment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment"
  ON student_assessment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment"
  ON student_assessment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessment"
  ON student_assessment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Store the normalized JSON study plan generated after onboarding
CREATE TABLE IF NOT EXISTS study_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Simple trigger to keep updated_at fresh on modifications
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_study_plan_updated_at ON study_plan;
CREATE TRIGGER trg_set_study_plan_updated_at
  BEFORE UPDATE ON study_plan
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

ALTER TABLE study_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study plan"
  ON study_plan FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study plan"
  ON study_plan FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study plan"
  ON study_plan FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
