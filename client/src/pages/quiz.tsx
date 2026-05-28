import { useState } from "react";
import { useLocation } from "wouter";
import { quizQuestions, scoreQuiz } from "@/lib/quiz-data";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { saveUserProgress } from "@/lib/progress";
import { saveOnboardingStep } from "@/lib/onboarding";

const PROGRESS_KEY = "wbe_quiz_progress";

function loadSavedProgress(): {
  currentQ: number;
  answers: Record<number, string>;
} | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Quiz() {
  const [, navigate] = useLocation();

  const saved = loadSavedProgress();
  const [currentQ, setCurrentQ] = useState<number>(saved?.currentQ ?? 0);
  const [answers, setAnswers] = useState<Record<number, string>>(
    saved?.answers ?? {},
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const question = quizQuestions[currentQ];
  const total = quizQuestions.length;
  const progress = (currentQ / total) * 100;

  const submitMutation = useMutation({
    mutationFn: async (finalAnswers: Record<number, string>) => {
      const { dnaType, secondaryDnaType, businessScores } =
        scoreQuiz(finalAnswers);

      // Always write to localStorage FIRST using camelCase format.
      // This ensures the rest of the app has the correct data regardless of
      // whether the DB save succeeds — and avoids any snake_case confusion
      // from spreading a raw Supabase row into wbe_result.
      const localResult = { dnaType, secondaryDnaType, businessScores };
      localStorage.setItem("wbe_result", JSON.stringify(localResult));

      // If authenticated, also persist to DB (fire-and-forget on failure so
      // a DB error never blocks the user from continuing their journey).
      const userStr = localStorage.getItem("wbe_user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (user?.id) {
        try {
          const res = await apiRequest("POST", "/api/quiz/submit", {
            userId: user.id,
            answers: finalAnswers,
            dnaType,
            businessScores,
          });
          const data = await res.json();
          console.log("[quiz] DB save result:", data);
        } catch (err) {
          // DB save failed — result is already in localStorage, continue
          console.warn("[quiz] DB save failed (continuing with localStorage):", err);
        }
      }

      return localResult;
    },
    onSuccess: () => {
      localStorage.setItem("wbe_quiz_completed", "true");
      localStorage.setItem("quiz_completed", "true");
      localStorage.removeItem(PROGRESS_KEY);
      saveUserProgress({ quizCompleted: true });
      saveOnboardingStep("quiz");
      navigate("/analyzing");
    },
  });

  const handleSelect = (value: string) => {
    if (isTransitioning) return;
    setSelected(value);
  };

  const handleNext = () => {
    if (!selected || isTransitioning) return;

    const newAnswers = { ...answers, [question.id]: selected };
    setAnswers(newAnswers);
    setIsTransitioning(true);

    setTimeout(() => {
      if (currentQ + 1 >= total) {
        localStorage.setItem("quiz_answers", JSON.stringify(newAnswers));
        localStorage.removeItem(PROGRESS_KEY);
        submitMutation.mutate(newAnswers);
        setIsTransitioning(false);
      } else {
        const nextQ = currentQ + 1;
        setCurrentQ(nextQ);
        setSelected(null);
        setIsTransitioning(false);
        const savedProgress = { currentQ: nextQ, answers: newAnswers };
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(savedProgress));
        localStorage.setItem("quiz_answers", JSON.stringify(newAnswers));
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-[#D4AF37]/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-[#E8A0BF]/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto w-full flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/30 text-xs tracking-widest uppercase">
            {question.category}
          </span>
          <span className="text-[#D4AF37]/70 text-xs font-medium">
            {currentQ + 1} / {total}
          </span>
        </div>

        <div className="mb-6">
          <div className="relative h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#D4AF37] to-[#E8A0BF] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div
          className="flex-1 flex flex-col"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          <div className="mb-8 space-y-2">
            <div className="w-8 h-px bg-[#D4AF37]/40" />
            <h2
              className="text-xl font-bold text-white leading-snug"
              data-testid={`text-question-${currentQ + 1}`}
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {question.question}
            </h2>
          </div>

          <div className="space-y-3 flex-1">
            {question.options.map((option) => {
              const isActive = selected === option.value;
              return (
                <button
                  key={option.value}
                  data-testid={`button-option-${option.value}`}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-4 rounded-md border transition-all duration-200 ${
                    isActive
                      ? "border-[#D4AF37]/70 bg-[#D4AF37]/8"
                      : "border-white/[0.08] bg-white/[0.02]"
                  }`}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(232,160,191,0.05) 100%)"
                      : undefined,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "border-[#D4AF37] bg-[#D4AF37]"
                          : "border-white/20"
                      }`}
                    >
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                    <span
                      className={`text-sm leading-relaxed transition-colors duration-200 ${
                        isActive ? "text-white" : "text-white/60"
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          <Button
            onClick={handleNext}
            data-testid="button-next-question"
            disabled={!selected || isTransitioning || submitMutation.isPending}
            className="w-full font-semibold text-base py-6 rounded-md tracking-wide transition-all duration-200"
            style={{
              height: "auto",
              background: selected ? "#D4AF37" : "rgba(255,255,255,0.05)",
              color: selected ? "#000" : "rgba(255,255,255,0.2)",
              border: "none",
            }}
          >
            {submitMutation.isPending
              ? "Analyzing..."
              : currentQ + 1 >= total
                ? "Complete Analysis"
                : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
