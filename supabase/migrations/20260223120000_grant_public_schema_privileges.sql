/*
  # Grant access to public schema for anon/authenticated roles

  Fixes client errors like:
  "Could not find the table 'public.study_sessions' in the schema cache"
  by ensuring the anon/authenticated roles can see tables/functions.
  Row Level Security policies still control row access.
*/

-- Allow roles to see objects in the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table/function/sequence privileges (RLS still applies on tables)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure future objects get the same privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated;
