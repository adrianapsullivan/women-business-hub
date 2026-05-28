import { useEffect } from "react";
import { useLocation } from "wouter";
import supabase from "@/lib/supabase";
import { syncUserToDatabase } from "@/lib/progress";
import { loadOnboardingProgress, resolveOnboardingRoute } from "@/lib/onboarding";

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

        // Combine DB result with localStorage for same-device safety
        const hasQuizResult = dbHasQuizResult || !!localStorage.getItem("wbe_result");

        // Load onboarding progress from DB — works cross-device
        const onboardingProgress = await loadOnboardingProgress(user.id);

        const route = resolveOnboardingRoute(onboardingProgress, hasQuizResult);
        navigate(route);
        return;
      }

      // No confirmed auth session — use localStorage only for pre-auth routing
      const quizDone =
        localStorage.getItem("wbe_quiz_completed") === "true" ||
        localStorage.getItem("quiz_completed") === "true";
      const hasResult = !!localStorage.getItem("wbe_result");
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
