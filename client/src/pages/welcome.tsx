import { useEffect } from "react";
import { useLocation } from "wouter";
import supabase from "@/lib/supabase";
import { syncUserToDatabase } from "@/lib/progress";
import { loadOnboardingProgress, resolveOnboardingRoute } from "@/lib/onboarding";
import {
  LEGACY_RESULT_STORAGE_KEY,
  V2_RESULT_STORAGE_KEY,
  getSafeDnaRoute,
  readActiveClientDnaResult,
} from "@/lib/entrepreneur-dna-v2-activation";

export default function Welcome() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const go = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.email_confirmed_at) {
        // Always write wbe_user so saveOnboardingStep has an ID to work with
        localStorage.setItem("wbe_user", JSON.stringify({ id: user.id, email: user.email }));

        // syncUserToDatabase returns DB-verified hasQuizResult — never depends on
        // localStorage alone so this works correctly on any device.
        const { hasQuizResult: dbHasQuizResult } = await syncUserToDatabase(user);

        const localResult = readActiveClientDnaResult(
          localStorage.getItem(V2_RESULT_STORAGE_KEY),
          localStorage.getItem(LEGACY_RESULT_STORAGE_KEY),
        );

        // Combine DB result with either valid local result version.
        const hasQuizResult = dbHasQuizResult || localResult !== null;

        // Load onboarding progress from DB — works cross-device
        const onboardingProgress = await loadOnboardingProgress(user.id);

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

    go();
  }, [navigate]);

  return <div className="min-h-screen bg-black" />;
}
