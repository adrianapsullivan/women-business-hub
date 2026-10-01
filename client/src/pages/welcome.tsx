import { useEffect, useRef, useState } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { useLocation } from "wouter";
import supabase from "@/lib/supabase";
import { syncUserToDatabase } from "@/lib/progress";
import type { SyncUserResult } from "@/lib/progress";
import { loadOnboardingProgress, resolveOnboardingRoute } from "@/lib/onboarding";
import {
  LEGACY_RESULT_STORAGE_KEY,
  V2_RESULT_STORAGE_KEY,
  getSafeDnaRoute,
  readActiveClientDnaResult,
} from "@/lib/entrepreneur-dna-v2-activation";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<Exclude<SyncUserResult["status"], "success"> | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const generation = ++attemptRef.current;
    const isStale = () => cancelled || generation !== attemptRef.current;
    setFailure(null);

    const go = async () => {
      const auth = await supabase.auth.getUser().catch((error: unknown) => {
        if (isAuthSessionMissingError(error)) {
          return { data: { user: null }, error: null };
        }
        return null;
      });
      if (isStale()) return;
      if (!auth || (auth.error && !isAuthSessionMissingError(auth.error))) {
        setFailure("error");
        return;
      }
      const user = auth.error ? null : auth.data.user;

      if (user && user.email_confirmed_at) {
        // Always write wbe_user so saveOnboardingStep has an ID to work with
        localStorage.setItem("wbe_user", JSON.stringify({ id: user.id, email: user.email }));

        const sync = await syncUserToDatabase(user);
        if (isStale()) return;
        if (sync.status !== "success") {
          setFailure(sync.status);
          return;
        }

        const localResult = readActiveClientDnaResult(
          localStorage.getItem(V2_RESULT_STORAGE_KEY),
          localStorage.getItem(LEGACY_RESULT_STORAGE_KEY),
        );

        // Combine DB result with either valid local result version.
        const hasQuizResult = sync.hasQuizResult || localResult !== null;

        // Load onboarding progress from DB — works cross-device
        const onboardingProgress = await loadOnboardingProgress(user.id);
        if (isStale()) return;

        const requestedRoute = resolveOnboardingRoute(
          onboardingProgress,
          hasQuizResult,
        );
        navigate(
          localResult
            ? getSafeDnaRoute(requestedRoute, localResult)
            : requestedRoute,
        );
        return;
      }

      if (isStale()) return;
      // No confirmed auth session — use localStorage only for pre-auth routing
      const quizDone =
        localStorage.getItem("wbe_quiz_completed") === "true" ||
        localStorage.getItem("quiz_completed") === "true";
      const hasResult =
        readActiveClientDnaResult(
          localStorage.getItem(V2_RESULT_STORAGE_KEY),
          localStorage.getItem(LEGACY_RESULT_STORAGE_KEY),
        ) !== null;
      const reportSeen = localStorage.getItem("wbe_report_unlocked") === "true";
      const hasPremium = !!localStorage.getItem("wbe_premium");
      const foundationRaw = localStorage.getItem("empireFoundationData");
      const foundationDone = foundationRaw
        ? (() => {
            try { return JSON.parse(foundationRaw).completed === true; }
            catch { return false; }
          })()
        : false;

      if (hasPremium || foundationDone || reportSeen) navigate("/dashboard");
      else if (hasResult) navigate("/report");
      else if (quizDone) navigate("/quiz");
      else navigate("/intro");
    };

    void go();
    return () => {
      cancelled = true;
      if (attemptRef.current === generation) attemptRef.current++;
    };
  }, [navigate, attempt]);

  if (failure) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <p className="text-white/70 text-sm leading-relaxed" role="alert">
            {failure === "identity_conflict"
              ? "We couldn't match this sign-in to your saved account. Your progress hasn't been reset. Please try again later or contact support."
              : "We couldn't load your account right now. Your progress hasn't been reset. Please try again."}
          </p>
          <button
            type="button"
            className="w-full bg-[#D4AF37] text-black font-semibold py-4 rounded-md"
            onClick={() => {
              attemptRef.current++;
              setFailure(null);
              setAttempt((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return <div className="min-h-screen bg-black flex items-center justify-center text-white/70">Loading your account…</div>;
}
