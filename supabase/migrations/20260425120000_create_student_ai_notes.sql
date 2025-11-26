-- Unify personalization storage into AI note columns per user.
-- Removes legacy personalization storage to avoid duplication.

-- Drop legacy AI memory table if it exists (replaced by unified ai_notes)
drop table if exists public.ai_memory cascade;

-- Drop any previous attempt at student_ai_notes to avoid duplicates
drop table if exists public.student_ai_notes cascade;

-- Create unified AI notes table keyed by users.id
create table public.student_ai_notes (
  user_id uuid primary key references public.users (id) on delete cascade,
  onboarding_summary text,
  paper1_reading_comprehension_ai_note text,
  paper1_paraphrasing_ai_note text,
  paper1_summary_writing_ai_note text,
  paper1_vocabulary_ai_note text,
  paper1_language_analysis_ai_note text,
  paper1_extended_response_ai_note text,
  text_type_report_ai_note text,
  text_type_magazine_ai_note text,
  text_type_newspaper_ai_note text,
  text_type_speech_ai_note text,
  text_type_letter_ai_note text,
  text_type_interview_ai_note text,
  text_type_diary_ai_note text,
  composition_narrative_ai_note text,
  composition_descriptive_ai_note text,
  composition_discursive_ai_note text,
  composition_argumentative_ai_note text,
  skill_vorpf_ai_note text,
  skill_qme_ai_note text,
  skill_evaluation_ai_note text,
  skill_paraphrasing_ai_note text,
  skill_register_ai_note text,
  skill_sentence_variety_ai_note text,
  skill_punctuation_ai_note text,
  skill_spelling_ai_note text,
  recurring_errors_ai_note text,
  under_pressure_ai_note text,
  learning_style_ai_note text,
  motivation_pattern_ai_note text,
  breakthrough_insight_ai_note text,
  paper1_readiness_ai_note text,
  paper2_readiness_ai_note text,
  overall_strategy_ai_note text,
  inserted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure updated_at is maintained (functionless if trigger function unavailable)
drop trigger if exists student_ai_notes_updated_at on public.student_ai_notes;
-- If your project has a shared timestamp trigger function, enable it here.
-- create trigger student_ai_notes_updated_at
-- before update on public.student_ai_notes
-- for each row
-- execute procedure public.set_current_timestamp_updated_at();

-- Enable RLS and add policies aligned with existing pattern
alter table public.student_ai_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'student_ai_notes' and policyname = 'Enable read access for users to their own AI notes'
  ) then
    create policy "Enable read access for users to their own AI notes"
    on public.student_ai_notes
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'student_ai_notes' and policyname = 'Enable upsert for users to their own AI notes'
  ) then
    create policy "Enable upsert for users to their own AI notes"
    on public.student_ai_notes
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'student_ai_notes' and policyname = 'Enable update for users to their own AI notes'
  ) then
    create policy "Enable update for users to their own AI notes"
    on public.student_ai_notes
    for update
    using (auth.uid() = user_id);
  end if;
end
$$;
