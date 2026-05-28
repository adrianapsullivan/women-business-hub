-- Women Business Empires — Supabase Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/ruiexdsrgvyzhxnbrscy/sql

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  dna_type TEXT NOT NULL,
  business_scores JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foundation_progress (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  dna_type TEXT DEFAULT 'Unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Allow public (anon key) access to all tables for this MVP
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON users;
CREATE POLICY "Public access" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON quiz_results;
CREATE POLICY "Public access" ON quiz_results FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE foundation_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON foundation_progress;
CREATE POLICY "Public access" ON foundation_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON waitlist;
CREATE POLICY "Public access" ON waitlist FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- USER PROGRESS (journey tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  quiz_completed BOOLEAN DEFAULT FALSE,
  report_unlocked BOOLEAN DEFAULT FALSE,
  path_type TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON user_progress;
CREATE POLICY "Public access" ON user_progress FOR ALL USING (true) WITH CHECK (true);

-- Run these if the table already exists in your database:
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS path_type TEXT;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS empire_score INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS day_streak INTEGER DEFAULT 1;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- ============================================================
-- DAILY MISSIONS (one row per user per calendar day)
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  mission_date DATE NOT NULL,
  mission_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT daily_missions_user_date_unique UNIQUE (user_id, mission_date)
);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON daily_missions;
CREATE POLICY "Public access" ON daily_missions FOR ALL USING (true) WITH CHECK (true);
