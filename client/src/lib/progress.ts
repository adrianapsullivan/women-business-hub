import supabase from "@/lib/supabase";

export type UserProgress = {
  quizCompleted: boolean;
  reportUnlocked: boolean;
  pathType?: string | null;
  onboardingCompleted?: boolean;
};

/**
 * Persist quiz/report/path progress flags to Supabase Auth user_metadata.
 * Supabase updateUser() MERGES the data object, so we only send the fields
 * that changed — no need to read existing metadata first (avoids extra calls).
 * Fire-and-forget: never throws, never blocks navigation.
 */
export async function saveUserProgress(updates: {
  quizCompleted?: boolean;
  reportUnlocked?: boolean;
  pathType?: string;
  onboardingCompleted?: boolean;
}): Promise<void> {
  try {
    const patch: Record<string, unknown> = {};
    if (updates.quizCompleted       !== undefined) patch.quiz_completed       = updates.quizCompleted;
    if (updates.reportUnlocked      !== undefined) patch.report_unlocked      = updates.reportUnlocked;
    if (updates.pathType            !== undefined) patch.path_type            = updates.pathType;
    if (updates.onboardingCompleted !== undefined) patch.onboarding_completed = updates.onboardingCompleted;
    if (Object.keys(patch).length === 0) return;
    await supabase.auth.updateUser({ data: patch });
  } catch {
    // fire-and-forget — never block the user
  }
}

/**
 * Read progress flags from Supabase Auth user_metadata.
 * Uses getUser() (server-verified) so data is always fresh.
 * Returns null when there is no authenticated session.
 */
export async function fetchUserProgress(): Promise<UserProgress | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const m = user.user_metadata ?? {};
    return {
      quizCompleted:       !!m.quiz_completed,
      reportUnlocked:      !!m.report_unlocked,
      pathType:            typeof m.path_type === "string" ? m.path_type : null,
      onboardingCompleted: !!m.onboarding_completed,
    };
  } catch {
    return null;
  }
}

/**
 * No-op: user metadata is managed by Supabase Auth automatically.
 * Kept for call-site compatibility.
 */
export async function createUserProgressRecord(_userId: string): Promise<void> {
  // intentionally empty
}

/**
 * Sync a Supabase Auth user into public.users + quiz_results.
 * Safe to call on every login — all DB operations are idempotent upserts.
 *
 * Returns { hasQuizResult } so callers can make routing decisions using
 * DB-verified state instead of relying on localStorage alone (cross-device safe).
 *
 * Side effect: if the server reports a quiz_results row exists but auth
 * metadata does NOT have quiz_completed=true, this function patches metadata
 * so that resolveOnboardingRoute() correctly sends the user forward.
 */
export async function syncUserToDatabase(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<{ hasQuizResult: boolean }> {
  try {
    const m = user.user_metadata ?? {};

    // Prefer auth metadata (set during signUp, device-independent).
    // Fall back to localStorage for the same-device pre-signup quiz flow.
    let dnaType = ((m.dna_type ?? m.dnaType ?? "") as string);
    let businessScores: object = {};
    try {
      const r = JSON.parse(localStorage.getItem("wbe_result") ?? "{}");
      if (!dnaType && r.dnaType) dnaType = r.dnaType;
      if (r.businessScores) businessScores = r.businessScores;
    } catch { /* ignore */ }

    const firstName = ((m.first_name ?? m.firstName ?? "") as string) || undefined;

    const body: Record<string, unknown> = {
      userId:    user.id,
      email:     user.email ?? "",
      firstName,
    };
    if (dnaType) {
      body.dnaType  = dnaType;
      body.answers  = businessScores;
    }

    const resp = await fetch("/api/auth/sync", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (resp.ok) {
      const data: { ok: boolean; hasQuizResult: boolean } = await resp.json();
      // If quiz_results exists in DB but metadata hasn't been stamped yet,
      // patch metadata now so any metadata-based checks resolve correctly.
      if (data.hasQuizResult && !m.quiz_completed) {
        await saveUserProgress({ quizCompleted: true, reportUnlocked: true });
      }
      return { hasQuizResult: data.hasQuizResult };
    }

    return { hasQuizResult: false };
  } catch {
    // fire-and-forget — never block routing
    return { hasQuizResult: false };
  }
}

/**
 * @deprecated Use resolveOnboardingRoute from @/lib/onboarding instead.
 * Kept for any legacy call-sites; prefer the onboarding-based routing.
 *
 * Decide which route a confirmed user should land on given their progress.
 * Priority order:
 *  1. Supabase metadata flags (most reliable)
 *  2. localStorage signals (fallback for same-device users)
 *  3. Redirects to /report for users with quiz result but no other signal
 */
export function resolveRouteFromProgress(progress: UserProgress | null): string {
  const empirePath = localStorage.getItem("wbe_empire_path");
  const reportSeen = localStorage.getItem("wbe_report_unlocked") === "true";
  const hasResult  = !!localStorage.getItem("wbe_result");

  if (progress) {
    if (progress.onboardingCompleted) return "/dashboard";
    if (progress.reportUnlocked)      return "/dashboard";
    if (progress.pathType)            return "/dashboard";
    if (progress.quizCompleted)       return "/dashboard";
    if (empirePath || reportSeen)     return "/dashboard";
    if (hasResult) return "/report";
    return "/intro";
  }

  if (empirePath || reportSeen) return "/dashboard";
  if (hasResult)                return "/report";
  return "/intro";
}
