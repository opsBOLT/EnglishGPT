/*
  # Create user_metadata table

  1. New Tables
    - `user_metadata`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `dashboard_visits` (integer, default 0) - Track number of dashboard visits
      - `last_visit` (timestamptz) - Track last dashboard visit
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `user_metadata` table
    - Add policy for authenticated users to read their own metadata
    - Add policy for authenticated users to update their own metadata
    - Add policy for authenticated users to insert their own metadata

  3. Important Notes
    - This table tracks user interactions and preferences
    - Dashboard visits counter determines whether to show AI chat or welcome message
    - Only users can access their own metadata for privacy
*/

CREATE TABLE IF NOT EXISTS user_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_visits integer DEFAULT 0,
  last_visit timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own metadata"
  ON user_metadata
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata"
  ON user_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata"
  ON user_metadata
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_metadata_user_id ON user_metadata(user_id);
