-- Create task_completions table for tracking student task completion
-- This enables progress tracking and adaptive plan regeneration

CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,  -- References the plan_id from study_plan.plan_data JSON
  task_id text NOT NULL,  -- The task.id from plan_data.weeks[].daily_tasks[].tasks[]
  week_number integer NOT NULL,
  day text NOT NULL,  -- "monday", "tuesday", etc.
  completed_at timestamptz DEFAULT now(),
  time_spent_minutes integer,  -- Actual time spent vs. planned duration
  difficulty_rating integer CHECK (difficulty_rating BETWEEN 1 AND 5),  -- Self-reported difficulty
  notes text,  -- Student's reflection on the task
  UNIQUE(user_id, plan_id, task_id)  -- Prevent duplicate completions
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_plan ON task_completions(plan_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_plan ON task_completions(user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);

-- Enable Row Level Security
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own task completions
CREATE POLICY "Users can read their own task completions"
  ON task_completions
  FOR SELECT
  USING (true);  -- Allow all reads for now (can restrict to auth.uid() = user_id in production)

-- Users can insert their own task completions
CREATE POLICY "Users can insert their own task completions"
  ON task_completions
  FOR INSERT
  WITH CHECK (true);  -- Allow all inserts for now (can restrict to auth.uid() = user_id in production)

-- Users can update their own task completions
CREATE POLICY "Users can update their own task completions"
  ON task_completions
  FOR UPDATE
  USING (true);  -- Allow all updates for now (can restrict to auth.uid() = user_id in production)

-- Add comments for documentation
COMMENT ON TABLE task_completions IS 'Tracks completion of daily tasks from study plans';
COMMENT ON COLUMN task_completions.plan_id IS 'References plan_id from study_plan.plan_data JSON field';
COMMENT ON COLUMN task_completions.task_id IS 'Unique task ID from plan_data.weeks[].daily_tasks[].tasks[].id';
COMMENT ON COLUMN task_completions.time_spent_minutes IS 'Actual time spent on task (for time management analysis)';
COMMENT ON COLUMN task_completions.difficulty_rating IS 'Self-reported difficulty 1-5 (identifies struggling areas)';
COMMENT ON COLUMN task_completions.notes IS 'Student reflection notes on the task';
