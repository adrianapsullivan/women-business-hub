# Women Business Empires (WBE)

A mobile-first web application where women discover their "Entrepreneur DNA" via a 25-question quiz, receive a personalized identity report, and access a member dashboard with daily missions, empire score, and day streak.

## Run & Operate

- `npm run dev` — starts Express + Vite on port 5000
- Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SESSION_SECRET`
- **Required migration (run once):** Paste the entire contents of `supabase/migrations.sql` into Supabase Dashboard → SQL Editor → Run. This creates all tables, adds missing columns (`last_visited_route` on `user_progress`; `data` on `foundation_progress`), sets RLS policies, and forces a PostgREST schema cache reload (`NOTIFY pgrst, 'reload schema'`). Until this is run, onboarding progress saves use a partial fallback that keeps the app working but loses route restoration cross-device.

## Stack

- **Frontend:** React + TypeScript + Vite, Wouter routing, TanStack Query v5, Tailwind CSS
- **Backend:** Express.js (tsx, port 5000)
- **Auth:** Supabase Auth (email+password, email confirmation)
- **DB:** Supabase PostgreSQL — client via `server/supabase.ts`

## Where things live

- `client/src/lib/quiz-data.ts` — 25 questions, weighted scoring, `scoreQuiz()`
- `client/src/lib/dna-data.ts` — 8 DNA profile objects
- `client/src/lib/progress.ts` — Supabase auth metadata helpers (`saveUserProgress`, `fetchUserProgress`, `syncUserToDatabase`)
- `client/src/lib/onboarding.ts` — Onboarding step persistence (`saveOnboardingStep`, `loadOnboardingProgress`, `resolveOnboardingRoute`)
- `client/src/pages/` — All screens (welcome, intro, signup, quiz, analyzing, reveal, report, compatibility, foundation, premium, dashboard)
- `shared/schema.ts` — Drizzle table types + `OnboardingProgressData` interface
- `server/routes.ts` — All API endpoints
- `server/storage.ts` — Supabase DB operations

## Architecture decisions

- **Onboarding tracking:** Each page calls `saveOnboardingStep(step)` on mount/completion → stored as `foundation_progress.data.onboarding` (jsonb, merged to preserve foundation flow data). On login, `welcome.tsx` reads this and routes to `lastVisitedRoute`, NEVER jumping to `/dashboard` unless `onboardingComplete = true`.
- **Auth metadata as secondary signal:** Supabase `user_metadata` (`quiz_completed`, `report_unlocked`, `path_type`) is kept for legacy compatibility; routing decisions are now driven by `foundation_progress` first.
- **Fire-and-forget saves:** All `saveOnboardingStep` calls are non-blocking — progress is best-effort, never delays navigation.
- **Merge upsert:** `saveOnboardingProgressData` reads existing row, merges `{ onboarding: data }`, then upserts — preserves foundation flow data stored in same jsonb column.
- **Passwords plaintext for V1** — intentional simplicity, upgrade before production.

## Product

- 25-question Entrepreneur DNA quiz → one of 8 DNA types (Empire Architect, Visionary Leader, etc.)
- Full DNA report + Business compatibility scores for 5 empire models
- Foundation onboarding wizard (5-step reflection)
- Premium waitlist / Empire Journey membership teaser
- Dashboard: empire path selection, daily missions, day streak, empire score, weekly goals

## API Endpoints

- `POST /api/auth/signup` / `POST /api/auth/login`
- `POST /api/auth/sync` — upserts `public.users` + `public.quiz_results`
- `POST /api/quiz/submit` / `GET /api/quiz/result/:userId`
- `GET /api/onboarding/progress/:userId` / `POST /api/onboarding/progress` — reads/writes `foundation_progress.data.onboarding`
- `GET /api/foundation/progress/:userId` / `POST /api/foundation/progress` — foundation wizard progress
- `POST /api/waitlist`

## Supabase tables

| Table | Key columns |
|---|---|
| `public.users` | `id`, `email`, `password`, `first_name`, `dna_type`, `onboarding_complete`, `current_step`, `updated_at` |
| `public.quiz_results` | `user_id`, `result`, `dna_type`, `answers`, `completed_at`, `updated_at` |
| `public.foundation_progress` | `user_id`, `data` (jsonb — contains `onboarding` key + foundation wizard keys), `updated_at` |
| `public.waitlist` | `name`, `email`, `dna_type` |

## User preferences

- Do NOT change quiz scoring, DNA types, or core auth flow
- Design: black bg, gold #D4AF37, pink #E8A0BF, Playfair Display headings, mobile-first
- Server uses `SUPABASE_ANON_KEY` (not service role) — cannot run DDL via JS client

## Gotchas

- `foundation_progress.data` stores BOTH onboarding progress (under `.onboarding` key) and foundation wizard data — always merge, never replace the whole field
- `resolveOnboardingRoute()` must NEVER route to `/dashboard` unless `onboardingComplete = true`
- `saveOnboardingStep` requires `wbe_user` in localStorage with an `id` field — pages that mount before auth is confirmed will silently no-op
- `syncUserToDatabase` patches auth metadata if DB has `quiz_results` but metadata lacks `quiz_completed`
