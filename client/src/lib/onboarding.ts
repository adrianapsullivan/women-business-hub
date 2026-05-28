export type OnboardingStep =
  | "quiz"
  | "reveal"
  | "report"
  | "compatibility"
  | "foundation"
  | "premium"
  | "dashboard";

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  dnaType: string;
  lastVisitedRoute: string;
  onboardingComplete: boolean;
  updatedAt: string;
}

const STEP_ORDER: OnboardingStep[] = [
  "quiz",
  "reveal",
  "report",
  "compatibility",
  "foundation",
  "premium",
  "dashboard",
];

const STEP_ROUTES: Record<OnboardingStep, string> = {
  quiz: "/quiz",
  reveal: "/reveal",
  report: "/report",
  compatibility: "/compatibility",
  foundation: "/foundation",
  premium: "/premium",
  dashboard: "/dashboard",
};

function getDnaType(): string {
  try {
    const r = JSON.parse(localStorage.getItem("wbe_result") ?? "{}");
    return r.dnaType ?? "";
  } catch {
    return "";
  }
}

function getUserId(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem("wbe_user") ?? "{}");
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Save the current onboarding step to foundation_progress.
 * Fire-and-forget — never blocks navigation.
 */
export async function saveOnboardingStep(
  step: OnboardingStep,
  opts: { onboardingComplete?: boolean; dnaType?: string } = {},
): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    const stepIdx = STEP_ORDER.indexOf(step);
    const completedSteps = stepIdx > 0
      ? (STEP_ORDER.slice(0, stepIdx) as OnboardingStep[])
      : [];
    const dnaType = opts.dnaType || getDnaType();
    const onboardingComplete = opts.onboardingComplete ?? step === "dashboard";
    const route = STEP_ROUTES[step];

    console.log("[onboarding] progress save started — step:", step, "userId:", userId);

    await fetch("/api/onboarding/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        currentStep: step,
        completedSteps,
        dnaType,
        lastVisitedRoute: route,
        onboardingComplete,
        updatedAt: new Date().toISOString(),
      }),
    });

    console.log("[onboarding] progress save success — step:", step);
  } catch {
    // fire-and-forget — never block the user
  }
}

/**
 * Load onboarding progress for a user.
 * Returns null if no progress found.
 */
export async function loadOnboardingProgress(
  userId: string,
): Promise<OnboardingProgress | null> {
  try {
    const resp = await fetch(
      `/api/onboarding/progress/${encodeURIComponent(userId)}`,
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.currentStep) return null;
    return data as OnboardingProgress;
  } catch {
    return null;
  }
}

/**
 * Resolve the correct route for a returning authenticated user.
 *
 * Rules:
 *  - If onboarding is complete → /dashboard
 *  - If progress exists → resume at lastVisitedRoute
 *  - No progress but quiz result exists → /report
 *  - Otherwise → fallback (defaults to /intro; pass redirectTarget from signup
 *    so ?redirect= params are honoured when no progress is saved yet)
 */
export function resolveOnboardingRoute(
  progress: OnboardingProgress | null,
  hasQuizResult: boolean,
  fallback = "/intro",
): string {
  if (!progress) {
    if (hasQuizResult) {
      console.log(
        "[onboarding] resume decision — no progress, has quiz result → /report",
      );
      return "/report";
    }
    console.log(
      "[onboarding] resume decision — no progress, no quiz result → fallback:",
      fallback,
    );
    return fallback;
  }

  if (progress.onboardingComplete) {
    console.log(
      "[onboarding] resume decision — onboardingComplete = true → /dashboard",
    );
    return "/dashboard";
  }

  const route =
    progress.lastVisitedRoute ||
    STEP_ROUTES[progress.currentStep] ||
    "/report";
  console.log(
    "[onboarding] restored route — step:",
    progress.currentStep,
    "→",
    route,
  );
  return route;
}
