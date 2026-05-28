-- ============================================================
-- WBE Complete Schema Migration
-- Run this entire file in Supabase Dashboard → SQL Editor
-- It is fully idempotent — safe to run multiple times.
-- ============================================================

-- ── public.users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL DEFAULT '__supabase_auth__',
  first_name   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS first_name          TEXT,
  ADD COLUMN IF NOT EXISTS dna_type            TEXT,
  ADD COLUMN IF NOT EXISTS empire_path         TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS membership_status   TEXT    DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS current_step        TEXT    DEFAULT 'quiz',
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.users;
CREATE POLICY "Public access" ON public.users FOR ALL USING (true) WITH CHECK (true);


-- ── public.quiz_results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL DEFAULT '{}',
  dna_type     TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiz_results
  ADD COLUMN IF NOT EXISTS result       TEXT,
  ADD COLUMN IF NOT EXISTS dna_type     TEXT,
  ADD COLUMN IF NOT EXISTS answers      JSONB,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.quiz_results;
CREATE POLICY "Public access" ON public.quiz_results FOR ALL USING (true) WITH CHECK (true);


-- ── public.foundation_progress ───────────────────────────────
-- CRITICAL: This table must exist with a 'data' jsonb column
-- for onboarding progress tracking to work.
CREATE TABLE IF NOT EXISTS public.foundation_progress (
  user_id    TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In case the table existed without the data column:
ALTER TABLE public.foundation_progress
  ADD COLUMN IF NOT EXISTS data       JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.foundation_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.foundation_progress;
CREATE POLICY "Public access" ON public.foundation_progress FOR ALL USING (true) WITH CHECK (true);


-- ── public.waitlist ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  dna_type   TEXT DEFAULT 'Unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.waitlist;
CREATE POLICY "Public access" ON public.waitlist FOR ALL USING (true) WITH CHECK (true);


-- ── public.user_progress ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id              TEXT PRIMARY KEY,
  quiz_completed       BOOLEAN DEFAULT FALSE,
  report_unlocked      BOOLEAN DEFAULT FALSE,
  path_type            TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS path_type            TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS empire_score         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS day_streak           INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_active_date     DATE,
  ADD COLUMN IF NOT EXISTS last_visited_route   TEXT;

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.user_progress;
CREATE POLICY "Public access" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);


-- ── public.daily_missions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  mission_date DATE NOT NULL,
  mission_id   TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_missions_user_date_unique UNIQUE (user_id, mission_date)
);

ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.daily_missions;
CREATE POLICY "Public access" ON public.daily_missions FOR ALL USING (true) WITH CHECK (true);


-- ── Force PostgREST schema cache reload ──────────────────────
-- This fixes "Could not find the 'data' column in the schema cache" errors.
NOTIFY pgrst, 'reload schema';


-- ── Verify ───────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'quiz_results', 'foundation_progress',
    'waitlist', 'user_progress', 'daily_missions'
  )
ORDER BY table_name, ordinal_position;
