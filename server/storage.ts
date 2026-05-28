import { getSupabaseClient } from "./supabase";
import type { FoundationProgressData, FoundationProgress, OnboardingProgressData } from "@shared/schema";

export interface User {
  id: string;
  firstName?: string;
  email: string;
  password: string;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  dnaType: string;
  createdAt: string;
}

export const storage = {
  async getUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) { console.error("[storage.getUserByEmail]", error.message); return null; }
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      password: data.password,
      firstName: data.first_name,
    };
  },

  async createUser(data: {
    firstName?: string;
    email: string;
    password: string;
  }): Promise<User> {
    const supabase = getSupabaseClient();
    const { data: row, error } = await supabase
      .from("users")
      .insert({ email: data.email, password: data.password, first_name: data.firstName })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name,
    };
  },

  async createQuizResult(body: {
    userId?: string;
    answers: object;
    dnaType: string;
    businessScores: object;
  }) {
    return this.saveQuizResult(body.userId ?? null, body.dnaType, body.answers, body.businessScores);
  },

  /**
   * Idempotent quiz result save — only touches columns that actually exist in
   * the live Supabase table (user_id, result, dna_type, answers, completed_at,
   * updated_at). businessScores is embedded inside the answers JSON so no
   * separate business_scores column is required.
   *
   * Returns { id, dnaType, businessScores } in camelCase so callers can use
   * the response directly without snake_case translation.
   */
  async saveQuizResult(
    userId: string | null,
    dnaType: string,
    answers: object,
    businessScores?: object,
  ): Promise<{ id: string; dnaType: string; businessScores: object }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Embed businessScores inside answers so it is persisted without needing
    // a separate business_scores column (which may not exist on older DB instances).
    const answersPayload = {
      ...answers,
      ...(businessScores && Object.keys(businessScores).length > 0
        ? { __businessScores: businessScores }
        : {}),
    };

    if (!userId) {
      // Unauthenticated — nothing to write to DB, return computed result only
      console.log("[storage.saveQuizResult] no userId — skipping DB write");
      return { id: "", dnaType, businessScores: businessScores ?? {} };
    }

    // Check if a row already exists for this user (idempotency)
    console.log("[storage.saveQuizResult] checking existing row for user_id:", userId);
    const { data: existing, error: checkErr } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (checkErr) {
      console.error("[storage.saveQuizResult] existence check FAILED:", checkErr.message);
      throw new Error(`quiz_results check failed: ${checkErr.message}`);
    }

    if (existing) {
      // Row exists — update in place, do not duplicate
      console.log("[storage.saveQuizResult] row exists — updating id:", existing.id);
      const { error: updateErr } = await supabase
        .from("quiz_results")
        .update({
          result:     dnaType,
          dna_type:   dnaType,
          answers:    answersPayload,
          updated_at: now,
        })
        .eq("user_id", userId);

      if (updateErr) {
        console.error("[storage.saveQuizResult] update FAILED:", updateErr.message);
        throw new Error(`quiz_results update failed: ${updateErr.message}`);
      }
      console.log("[storage.saveQuizResult] update success");
      return { id: existing.id, dnaType, businessScores: businessScores ?? {} };
    }

    // No existing row — insert
    console.log("[storage.saveQuizResult] inserting new row for user_id:", userId);
    const { data: inserted, error: insertErr } = await supabase
      .from("quiz_results")
      .insert({
        user_id:      userId,
        result:       dnaType,
        dna_type:     dnaType,
        answers:      answersPayload,
        completed_at: now,
        updated_at:   now,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[storage.saveQuizResult] insert FAILED:", insertErr.message);
      throw new Error(`quiz_results insert failed: ${insertErr.message}`);
    }

    console.log("[storage.saveQuizResult] insert success — id:", inserted.id);
    return { id: inserted.id, dnaType, businessScores: businessScores ?? {} };
  },

  async getQuizResultByUserId(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { console.error("[storage.getQuizResultByUserId]", error.message); return null; }
    return data;
  },

  async getFoundationProgress(userId: string): Promise<FoundationProgress | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("foundation_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { console.error("[storage.getFoundationProgress]", error.message); return null; }
    if (!data) return null;
    return {
      userId: data.user_id,
      data: data.data as FoundationProgressData,
      updatedAt: new Date(data.updated_at),
    };
  },

  async saveFoundationProgress(
    userId: string,
    progressData: FoundationProgressData,
  ): Promise<FoundationProgress> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("foundation_progress")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    let result: any;
    if (existing) {
      const { data, error } = await supabase
        .from("foundation_progress")
        .update({ data: progressData, updated_at: now })
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from("foundation_progress")
        .insert({ user_id: userId, data: progressData, updated_at: now })
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    }
    return {
      userId: result.user_id,
      data: result.data as FoundationProgressData,
      updatedAt: new Date(result.updated_at),
    };
  },

  async getOnboardingProgress(userId: string): Promise<OnboardingProgressData | null> {
    const supabase = getSupabaseClient();

    // Primary: foundation_progress.data.onboarding
    const { data, error } = await supabase
      .from("foundation_progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      const d = data.data as Record<string, unknown>;
      if (d && d.onboarding) return d.onboarding as OnboardingProgressData;
      if (d && d.currentStep) return d as unknown as OnboardingProgressData;
    }

    if (error) {
      console.warn("[storage.getOnboardingProgress] foundation_progress failed:", error.message, "— trying user_progress fallback");
    }

    // Fallback: user_progress table (always exists, always works)
    const { data: up, error: upErr } = await supabase
      .from("user_progress")
      .select("last_visited_route, onboarding_completed, path_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (upErr || !up) return null;

    const lastVisitedRoute = (up as any).last_visited_route as string | null;
    const onboardingCompleted = (up as any).onboarding_completed as boolean | null;

    if (!lastVisitedRoute) return null;

    const routeToStep: Record<string, string> = {
      "/quiz": "quiz", "/reveal": "reveal", "/report": "report",
      "/compatibility": "compatibility", "/foundation": "foundation",
      "/premium": "premium", "/dashboard": "dashboard",
    };
    const currentStep = (routeToStep[lastVisitedRoute] ?? "quiz") as OnboardingProgressData["currentStep"];

    return {
      currentStep,
      completedSteps: [],
      dnaType: "",
      lastVisitedRoute,
      onboardingComplete: !!onboardingCompleted,
      updatedAt: new Date().toISOString(),
    };
  },

  async saveOnboardingProgressData(userId: string, progress: OnboardingProgressData): Promise<void> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Always write fallback first (user_progress always exists)
    await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          last_visited_route: progress.lastVisitedRoute,
          onboarding_completed: progress.onboardingComplete,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );

    // Primary: foundation_progress using insert-or-update (no unique constraint needed)
    try {
      const { data: existing } = await supabase
        .from("foundation_progress")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();
      const existingData = (existing?.data as Record<string, unknown>) ?? {};
      const merged = { ...existingData, onboarding: progress };
      if (existing) {
        const { error } = await supabase
          .from("foundation_progress")
          .update({ data: merged, updated_at: now })
          .eq("user_id", userId);
        if (error) console.warn("[storage.saveOnboardingProgressData] foundation_progress update failed:", error.message);
      } else {
        const { error } = await supabase
          .from("foundation_progress")
          .insert({ user_id: userId, data: merged, updated_at: now });
        if (error) console.warn("[storage.saveOnboardingProgressData] foundation_progress insert failed:", error.message);
      }
    } catch (err) {
      console.warn("[storage.saveOnboardingProgressData] foundation_progress threw:", err);
    }
  },

  async addToWaitlist(input: { name: string; email: string; dnaType: string }) {
    const supabase = getSupabaseClient();
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", input.email)
      .maybeSingle();

    if (existing) {
      const { data: count } = await supabase
        .from("waitlist")
        .select("id", { count: "exact", head: true });
      const { data: pos } = await supabase
        .from("waitlist")
        .select("id")
        .lte("created_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      const position = (pos?.findIndex((r) => r.id === existing.id) ?? 0) + 1;
      return {
        entry: existing,
        position,
        alreadyExists: true,
      };
    }

    const { data, error } = await supabase
      .from("waitlist")
      .insert({ name: input.name, email: input.email, dna_type: input.dnaType })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    return {
      entry: data,
      position: count ?? 1,
      alreadyExists: false,
    };
  },

  async getWaitlistCount(): Promise<number> {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  },

  async getUserProgress(userId: string): Promise<{
    quizCompleted: boolean;
    reportUnlocked: boolean;
    pathType: string | null;
    onboardingCompleted: boolean;
  } | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { console.error("[storage.getUserProgress]", error.message); return null; }
    if (!data) return null;
    return {
      quizCompleted: data.quiz_completed ?? false,
      reportUnlocked: data.report_unlocked ?? false,
      pathType: data.path_type ?? null,
      onboardingCompleted: data.onboarding_completed ?? false,
    };
  },

  async saveUserProgress(userId: string, updates: {
    quizCompleted?: boolean;
    reportUnlocked?: boolean;
    pathType?: string;
    onboardingCompleted?: boolean;
  }): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          ...(updates.quizCompleted !== undefined && { quiz_completed: updates.quizCompleted }),
          ...(updates.reportUnlocked !== undefined && { report_unlocked: updates.reportUnlocked }),
          ...(updates.pathType !== undefined && { path_type: updates.pathType }),
          ...(updates.onboardingCompleted !== undefined && { onboarding_completed: updates.onboardingCompleted }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    if (error) console.error("[storage.saveUserProgress]", error.message);
  },

  async getMissionStatus(userId: string): Promise<{
    completedToday: boolean;
    empireScore: number;
    dayStreak: number;
  }> {
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split("T")[0];

    const [{ data: mission }, { data: progress }] = await Promise.all([
      supabase
        .from("daily_missions")
        .select("id")
        .eq("user_id", userId)
        .eq("mission_date", today)
        .maybeSingle(),
      supabase
        .from("user_progress")
        .select("empire_score, day_streak")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return {
      completedToday: !!mission,
      empireScore: (progress as any)?.empire_score ?? 0,
      dayStreak: (progress as any)?.day_streak ?? 1,
    };
  },

  async completeMission(userId: string, missionId: string): Promise<{
    ok: boolean;
    alreadyCompleted: boolean;
    empireScore: number;
    dayStreak: number;
  }> {
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    // Idempotency guard — check if mission already done today
    const { data: existing } = await supabase
      .from("daily_missions")
      .select("id")
      .eq("user_id", userId)
      .eq("mission_date", today)
      .maybeSingle();

    if (existing) {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("empire_score, day_streak")
        .eq("user_id", userId)
        .maybeSingle();
      return {
        ok: true,
        alreadyCompleted: true,
        empireScore: (progress as any)?.empire_score ?? 0,
        dayStreak: (progress as any)?.day_streak ?? 1,
      };
    }

    // Record the mission
    await supabase
      .from("daily_missions")
      .insert({ user_id: userId, mission_date: today, mission_id: missionId });

    // Fetch current score / streak / last_active_date
    const { data: progress } = await supabase
      .from("user_progress")
      .select("empire_score, day_streak, last_active_date")
      .eq("user_id", userId)
      .maybeSingle();

    const currentScore  = (progress as any)?.empire_score ?? 0;
    const currentStreak = (progress as any)?.day_streak   ?? 0;
    const lastDate      = (progress as any)?.last_active_date ?? null;

    // Streak: +1 if consecutive day, reset to 1 if gap
    let newStreak: number;
    if (lastDate === yesterday) {
      newStreak = currentStreak + 1;
    } else if (lastDate === today) {
      newStreak = currentStreak;
    } else {
      newStreak = 1;
    }

    const newScore = currentScore + 10;

    await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          empire_score: newScore,
          day_streak: newStreak,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    return { ok: true, alreadyCompleted: false, empireScore: newScore, dayStreak: newStreak };
  },

  /**
   * Ensure a row exists in public.users for a Supabase Auth user.
   * Idempotent — uses upsert on `id` so it is safe to call on every login.
   *
   * Columns used (matches the schema AFTER running supabase/migrations.sql):
   *   id, email, password, first_name, dna_type, updated_at
   *
   * Throws on failure so the caller can report ok: false instead of ok: true.
   */
  async ensureUserRow(
    userId: string,
    email: string,
    firstName?: string,
    dnaType?: string,
  ): Promise<void> {
    console.log("[sync] users upsert starting — id:", userId);
    const supabase = getSupabaseClient();

    const payload: Record<string, unknown> = {
      id: userId,
      email,
      password: "__supabase_auth__",
      updated_at: new Date().toISOString(),
    };
    if (firstName) payload.first_name = firstName;
    if (dnaType)   payload.dna_type   = dnaType;

    const { error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      console.error("[sync] users upsert FAILED:", error.message);
      throw new Error(`users upsert failed: ${error.message}`);
    }
    console.log("[sync] users upsert success — id:", userId);
  },

  /**
   * Ensure a quiz_results row exists for this user.
   * Returns true if a new row was inserted, false if one already existed.
   * Idempotent — only inserts when no row is present for this user_id.
   *
   * Columns used (matches the schema AFTER running supabase/migrations.sql):
   *   user_id, result, dna_type, answers, completed_at, updated_at
   *
   * Throws on failure so the caller can report ok: false instead of ok: true.
   */
  async ensureQuizResult(
    userId: string,
    dnaType: string,
    answers?: object,
  ): Promise<boolean> {
    const supabase = getSupabaseClient();

    const { data: existing, error: checkError } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("[sync] quiz_results existence check FAILED:", checkError.message);
      throw new Error(`quiz_results check failed: ${checkError.message}`);
    }

    if (existing) {
      console.log("[sync] quiz_results exists — skipping insert for user_id:", userId);
      return false;
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("quiz_results").insert({
      user_id:      userId,
      result:       dnaType,
      dna_type:     dnaType,
      answers:      answers ?? {},
      completed_at: now,
      updated_at:   now,
    });

    if (insertError) {
      console.error("[sync] quiz_results insert FAILED:", insertError.message);
      throw new Error(`quiz_results insert failed: ${insertError.message}`);
    }

    console.log("[sync] quiz_results insert success — user_id:", userId, "dna_type:", dnaType);
    return true;
  },

  async createUserProgress(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          quiz_completed: false,
          report_unlocked: false,
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    if (error) console.error("[storage.createUserProgress]", error.message);
  },
};
