import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { saveOnboardingStep } from "@/lib/onboarding";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType, BusinessScores } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Download } from "lucide-react";
import JourneyProgress from "@/components/journey-progress";
import { generateBlueprintPDF } from "@/lib/blueprint-pdf";

const STORAGE_KEY = "empireFoundationData";

const businessNames: Record<keyof BusinessScores, string> = {
  personalBrand: "Personal Brand Empire",
  knowledge: "Knowledge Empire",
  community: "Community Empire",
  digital: "Digital Product Empire",
  affiliate: "Affiliate Empire",
};

function getTopBusiness(scores: BusinessScores): string {
  const top = (Object.keys(scores) as (keyof BusinessScores)[]).reduce(
    (best, key) => (scores[key] > scores[best] ? key : best),
    "affiliate" as keyof BusinessScores,
  );
  return businessNames[top];
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i <= current ? "#D4AF37" : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

function FieldGroup({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/60 text-xs tracking-widest uppercase block">
        {label}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-[#D4AF37]/50 focus-visible:ring-[#D4AF37]/20 resize-none text-sm rounded-md"
      />
      {helperText && (
        <p className="text-white/30 text-xs leading-relaxed">{helperText}</p>
      )}
    </div>
  );
}

export default function Foundation() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(
    null,
  );
  const [topBusiness, setTopBusiness] = useState("");

  const [assets, setAssets] = useState({
    comesNaturally: "",
    helpedWith: "",
    overcome: "",
    energize: "",
  });
  const [transformation, setTransformation] = useState({
    whoToHelp: "",
    specificResult: "",
    whyMatters: "",
    whyYou: "",
  });
  const [committed, setCommitted] = useState(false);
  const [step2Error, setStep2Error] = useState("");
  const [step3Error, setStep3Error] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("wbe_user");
    if (!userStr) {
      navigate("/signup?mode=signin");
      return;
    }
    const user = JSON.parse(userStr) as { id: string; email: string; firstName: string };

    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) {
      navigate("/");
      return;
    }
    const result = JSON.parse(resultStr);
    const dnaType: DNAType = result.dnaType;
    if (dnaProfiles[dnaType]) setProfile(dnaProfiles[dnaType]);
    if (result.businessScores) {
      setTopBusiness(getTopBusiness(result.businessScores));
    }

    const applyProgress = (p: {
      step?: number; completed?: boolean; committed?: boolean;
      assets?: typeof assets; transformation?: typeof transformation;
    }) => {
      if (p.assets) setAssets(p.assets);
      if (p.transformation) setTransformation(p.transformation);
      if (typeof p.step === "number") setStep(p.step);
      if (p.committed) setCommitted(true);
      if (p.completed) setDone(true);
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { applyProgress(JSON.parse(saved)); } catch { /* ignore */ }
    }

    fetch(`/api/foundation/progress/${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((progress) => {
        if (progress) applyProgress(progress);
      })
      .catch(() => { /* network error — localStorage already applied */ })
      .finally(() => setAuthChecked(true));
  }, [navigate]);

  const saveToStorage = (extra?: object) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const current = existing ? JSON.parse(existing) : {};
      const data = {
        ...current,
        assets,
        transformation,
        topBusiness,
        ...extra,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log("[Foundation] localStorage written:", data);
    } catch (e) {
      console.error("[Foundation] localStorage write failed:", e);
    }
  };

  const saveProgressToBackend = (
    nextStep: number,
    extra?: { committed?: boolean; completed?: boolean },
    overrideAssets?: typeof assets,
    overrideTransformation?: typeof transformation,
  ) => {
    const userStr = localStorage.getItem("wbe_user");
    if (!userStr) return;
    const user = JSON.parse(userStr) as { id: string };
    const payload = {
      userId: user.id,
      step: nextStep,
      completed: extra?.completed ?? false,
      committed: extra?.committed ?? committed,
      topBusiness,
      assets: overrideAssets ?? assets,
      transformation: overrideTransformation ?? transformation,
    };
    fetch("/api/foundation/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((e) => console.error("[Foundation] Backend save failed:", e));
  };

  const handleStep2Continue = () => {
    const trimmed = {
      comesNaturally: assets.comesNaturally.trim(),
      helpedWith: assets.helpedWith.trim(),
      overcome: assets.overcome.trim(),
      energize: assets.energize.trim(),
    };
    const allFilled = Object.values(trimmed).every((v) => v.length > 0);
    console.log(
      "[Foundation] Step 2 click — allFilled:",
      allFilled,
      "trimmed:",
      trimmed,
    );
    if (!allFilled) {
      setStep2Error("Please fill in all four fields before continuing.");
      console.warn("[Foundation] Step 2 — validation failed, showing error");
      return;
    }
    setStep2Error("");
    saveToStorage();
    saveProgressToBackend(2);
    console.log("[Foundation] advancing to next step");
    setStep((prev) => prev + 1);
  };

  const handleStep3Continue = () => {
    const trimmed = {
      whoToHelp: transformation.whoToHelp.trim(),
      specificResult: transformation.specificResult.trim(),
      whyMatters: transformation.whyMatters.trim(),
      whyYou: transformation.whyYou.trim(),
    };
    const allFilled = Object.values(trimmed).every((v) => v.length > 0);
    console.log("[Foundation] Step 3 click — allFilled:", allFilled, "trimmed:", trimmed);
    if (!allFilled) {
      setStep3Error("Please fill in all four fields before continuing.");
      console.warn("[Foundation] Step 3 — validation failed, showing error");
      return;
    }
    setStep3Error("");
    saveToStorage();
    saveProgressToBackend(3);
    console.log("[Foundation] Step 3 — advancing to step 4");
    setStep((prev) => prev + 1);
  };

  const accentColor = profile?.color ?? "#D4AF37";
  const secondaryColor = profile?.secondaryColor ?? "#F4D58D";

  if (!authChecked || !profile) return null;

  if (done) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: `${accentColor}08` }}
          />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center space-y-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <CheckCircle2
              className="w-8 h-8"
              style={{ color: accentColor }}
              strokeWidth={1.5}
            />
          </div>

          <div className="space-y-4">
            <h1
              className="text-2xl font-bold text-white leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
              data-testid="text-phase1-complete"
            >
              Phase 1 Complete.{" "}
              <span style={{ color: accentColor }}>Your Foundation Is Set.</span>
            </h1>
            <p className="text-white/55 text-sm leading-relaxed">
              You now have something most people never get… clarity.
            </p>
            <p className="text-white/45 text-sm leading-relaxed">
              And clarity without action… changes nothing.
            </p>
            <p
              className="text-white/35 text-xs tracking-wide"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              This is where your empire begins to take shape.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/premium")}
              data-testid="button-activate-empire"
              className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
              style={{
                height: "auto",
                background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
                border: "none",
              }}
            >
              Activate My Empire Path
            </Button>

            <button
              type="button"
              data-testid="button-download-blueprint"
              onClick={() => {
                try {
                  const resultStr = localStorage.getItem("wbe_result");
                  const result = resultStr ? JSON.parse(resultStr) : {};
                  const foundationStr = localStorage.getItem(STORAGE_KEY);
                  const foundation = foundationStr ? JSON.parse(foundationStr) : {};
                  generateBlueprintPDF({
                    dnaType: result.dnaType ?? "",
                    transformation: foundation.transformation ?? {
                      whoToHelp: "", specificResult: "", whyMatters: "", whyYou: "",
                    },
                  });
                } catch (e) {
                  console.error("[Foundation] PDF generation failed:", e);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${accentColor}30`,
                color: accentColor,
              }}
            >
              <Download className="w-4 h-4" />
              Download My Empire Blueprint
            </button>

            <p className="text-white/25 text-xs text-center">
              Continue to build your system, structure, and next steps
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-3xl"
          style={{ background: `${accentColor}06` }}
        />
      </div>

      {/* Progress indicator — Step 4 of 5 */}
      <JourneyProgress step={4} />

      <div className="relative z-10 max-w-sm mx-auto w-full px-5">
        <div className="pt-4 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
            <button
              type="button"
              onClick={() =>
                step > 0 ? setStep(step - 1) : navigate("/compatibility")
              }
              data-testid="button-foundation-back"
              className="text-white/30 text-sm"
            >
              ←
            </button>
          </div>
          <ProgressDots current={step} total={5} />
          <span className="text-white/25 text-xs">{step + 1} / 5</span>
        </div>

        <div>
          {step === 0 && (
            <Step1
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              onContinue={() => {
                saveProgressToBackend(1);
                console.log("[Foundation] setStep(1)");
                setStep(1);
              }}
            />
          )}
          {step === 1 && (
            <Step2
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              assets={assets}
              setAssets={setAssets}
              error={step2Error}
              onContinue={handleStep2Continue}
            />
          )}
          {step === 2 && (
            <Step3
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              transformation={transformation}
              setTransformation={setTransformation}
              error={step3Error}
              onContinue={handleStep3Continue}
            />
          )}
          {step === 3 && (
            <Step4
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              topBusiness={topBusiness}
              onContinue={() => {
                saveToStorage();
                saveProgressToBackend(4);
                console.log("[Foundation] setStep(4)");
                setStep(4);
              }}
            />
          )}
          {step === 4 && (
            <Step5
              accentColor={accentColor}
              secondaryColor={secondaryColor}
              committed={committed}
              setCommitted={setCommitted}
              onComplete={() => {
                saveToStorage({ committed: true, completed: true, step: 4 });
                saveProgressToBackend(4, { committed: true, completed: true });
                saveOnboardingStep("foundation");
                console.log("[Foundation] Phase 1 complete → setDone(true)");
                setDone(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step1({
  accentColor,
  secondaryColor,
  onContinue,
}: {
  accentColor: string;
  secondaryColor: string;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Phase 1 · Foundation
        </p>
        <h1
          className="text-2xl font-bold text-white leading-snug"
          style={{ fontFamily: "Playfair Display, serif" }}
          data-testid="text-step1-title"
        >
          Laying the Foundation of Your Online Empire
        </h1>
      </div>

      <div className="w-10 h-px" style={{ background: `${accentColor}50` }} />

      <div
        className="rounded-md p-5 space-y-4"
        style={{
          background: `linear-gradient(135deg, ${accentColor}08 0%, ${secondaryColor}05 100%)`,
          border: `1px solid ${accentColor}18`,
        }}
      >
        <p className="text-white/70 text-sm leading-relaxed">
          You are not here to copy someone else's blueprint.
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          You are here to build something that actually fits you.
        </p>
        <p className="text-white/70 text-sm leading-relaxed">
          Because when alignment is right…
          <br />
          momentum becomes inevitable.
        </p>
        <p
          className="text-white text-sm font-semibold leading-relaxed"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Today, you stop guessing.
          <br />
          Today, you start building.
        </p>
      </div>

      <Button
        type="button"
        onClick={onContinue}
        data-testid="button-step1-continue"
        className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
          border: "none",
        }}
      >
        Continue
      </Button>
    </div>
  );
}

function Step2({
  accentColor,
  secondaryColor,
  assets,
  setAssets,
  error,
  onContinue,
}: {
  accentColor: string;
  secondaryColor: string;
  assets: {
    comesNaturally: string;
    helpedWith: string;
    overcome: string;
    energize: string;
  };
  setAssets: (a: typeof assets) => void;
  error: string;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-1">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Step 2 · Assets
        </p>
        <h2
          className="text-2xl font-bold text-white leading-snug"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Discover the Assets You Already Carry
        </h2>
      </div>
      <div className="space-y-2">
        <p
          className="text-white/80 text-sm leading-relaxed italic"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Everything you need… you already carry.
        </p>
        <p className="text-white/50 text-sm leading-relaxed">
          You don't start from zero.
          <br />
          You start from awareness.
        </p>
      </div>

      <div className="space-y-4">
        <FieldGroup
          label="What comes naturally to you?"
          value={assets.comesNaturally}
          onChange={(v) => setAssets({ ...assets, comesNaturally: v })}
          placeholder="Skills, talents, or ways of thinking that feel effortless..."
          helperText="Skills, talents, or abilities that feel easy for you."
        />
        <FieldGroup
          label="What do people ask you for help with?"
          value={assets.helpedWith}
          onChange={(v) => setAssets({ ...assets, helpedWith: v })}
          placeholder="The advice, help, or expertise people naturally seek from you..."
          helperText="Problems others naturally come to you for."
        />
        <FieldGroup
          label="What have you personally overcome?"
          value={assets.overcome}
          onChange={(v) => setAssets({ ...assets, overcome: v })}
          placeholder="Challenges, struggles, or transformations you have been through..."
          helperText="Challenges or life experiences that shaped you."
        />
        <FieldGroup
          label="What topics energize you?"
          value={assets.energize}
          onChange={(v) => setAssets({ ...assets, energize: v })}
          placeholder="Subjects you could talk about for hours without getting tired..."
          helperText="Subjects you could talk about or learn about for hours."
        />
      </div>

      {error && (
        <p
          data-testid="error-step2"
          className="text-[#E8A0BF] text-xs text-center"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={onContinue}
        data-testid="button-step2-continue"
        className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
          border: "none",
        }}
      >
        Save & Continue
      </Button>
    </div>
  );
}

function Step3({
  accentColor,
  secondaryColor,
  transformation,
  setTransformation,
  error,
  onContinue,
}: {
  accentColor: string;
  secondaryColor: string;
  transformation: {
    whoToHelp: string;
    specificResult: string;
    whyMatters: string;
    whyYou: string;
  };
  setTransformation: (t: typeof transformation) => void;
  error: string;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-1">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Step 3 · Transformation
        </p>
        <h2
          className="text-2xl font-bold text-white leading-snug"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Define the Transformation You Are Here to Create
        </h2>
      </div>
      <div className="space-y-2">
        <p
          className="text-white/80 text-sm leading-relaxed italic"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Clarity here changes everything.
        </p>
        <p className="text-white/50 text-sm leading-relaxed">
          Because once you define the transformation…
          <br />
          your business builds itself around it.
        </p>
      </div>

      <div className="space-y-4">
        <FieldGroup
          label="Who do you want to help?"
          value={transformation.whoToHelp}
          onChange={(v) =>
            setTransformation({ ...transformation, whoToHelp: v })
          }
          placeholder="Describe the specific woman you are here to serve..."
        />
        <FieldGroup
          label="What specific result do you help them achieve?"
          value={transformation.specificResult}
          onChange={(v) =>
            setTransformation({ ...transformation, specificResult: v })
          }
          placeholder="The concrete outcome or transformation she will experience..."
        />
        <FieldGroup
          label="Why does this transformation matter deeply to them?"
          value={transformation.whyMatters}
          onChange={(v) =>
            setTransformation({ ...transformation, whyMatters: v })
          }
          placeholder="What changes in her life when she achieves this result..."
        />
        <FieldGroup
          label="Why are you uniquely positioned to guide them?"
          value={transformation.whyYou}
          onChange={(v) => setTransformation({ ...transformation, whyYou: v })}
          placeholder="Your experience, perspective, or story that qualifies you..."
        />
      </div>

      {error && (
        <p
          data-testid="error-step3"
          className="text-[#E8A0BF] text-xs text-center"
        >
          {error}
        </p>
      )}

      <Button
        type="button"
        onClick={onContinue}
        data-testid="button-step3-continue"
        className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
          border: "none",
        }}
      >
        Save & Continue
      </Button>
    </div>
  );
}

function Step4({
  accentColor,
  secondaryColor,
  topBusiness,
  onContinue,
}: {
  accentColor: string;
  secondaryColor: string;
  topBusiness: string;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Step 4 · Direction
        </p>
        <h2
          className="text-2xl font-bold text-white leading-snug"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Your Primary Online Empire Path
        </h2>
      </div>

      <div className="space-y-2">
        <p className="text-white/60 text-sm leading-relaxed">
          This is where your alignment is strongest.
        </p>
        <p className="text-white/60 text-sm leading-relaxed">
          This is where things will feel easier… faster… and more natural.
        </p>
        <p className="text-white/45 text-sm leading-relaxed">
          You can explore other paths later.
        </p>
        <p
          className="text-white/75 text-sm leading-relaxed font-medium"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          But this is where you win first.
        </p>
      </div>

      <div
        className="rounded-md p-6 text-center space-y-3"
        style={{
          background: `linear-gradient(135deg, ${accentColor}10 0%, ${secondaryColor}07 100%)`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        <div
          className="text-xs tracking-widest uppercase font-medium"
          style={{ color: accentColor }}
        >
          Your Highest Aligned Path
        </div>
        <h3
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "Playfair Display, serif" }}
          data-testid="text-top-empire-path"
        >
          {topBusiness}
        </h3>
        <p className="text-white/40 text-xs leading-relaxed">
          This is the business model most aligned with how you are naturally
          wired to build, create, and earn.
        </p>
      </div>

      <Button
        type="button"
        onClick={onContinue}
        data-testid="button-step4-commit"
        className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
        style={{
          height: "auto",
          background: `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`,
          border: "none",
        }}
      >
        This Is My Path
      </Button>
    </div>
  );
}

function Step5({
  accentColor,
  secondaryColor,
  committed,
  setCommitted,
  onComplete,
}: {
  accentColor: string;
  secondaryColor: string;
  committed: boolean;
  setCommitted: (v: boolean) => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Step 5 · Commitment
        </p>
        <h2
          className="text-2xl font-bold text-white leading-snug"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Commit to Building
        </h2>
      </div>

      <div
        className="rounded-md p-5 space-y-3"
        style={{
          background: `linear-gradient(135deg, ${accentColor}08 0%, ${secondaryColor}05 100%)`,
          border: `1px solid ${accentColor}18`,
        }}
      >
        <p
          className="text-white text-base leading-relaxed"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          An empire is not built by thinking.
        </p>
        <p
          className="text-white text-base leading-relaxed"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          It is built the moment you decide you're no longer going back.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommitted(!committed)}
        data-testid="checkbox-commitment"
        className="w-full flex items-start gap-3 text-left"
      >
        <div
          className="mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: committed ? accentColor : "rgba(255,255,255,0.2)",
            background: committed ? accentColor : "transparent",
          }}
        >
          {committed && (
            <svg
              className="w-3 h-3 text-black"
              fill="none"
              viewBox="0 0 12 12"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2 6l3 3 5-5"
              />
            </svg>
          )}
        </div>
        <span
          className="text-sm leading-relaxed transition-colors duration-200"
          style={{
            color: committed
              ? "rgba(255,255,255,0.85)"
              : "rgba(255,255,255,0.45)",
          }}
        >
          I commit to building my online empire from alignment.
        </span>
      </button>

      <Button
        type="button"
        onClick={onComplete}
        data-testid="button-step5-complete"
        className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
        style={{
          height: "auto",
          background: committed
            ? `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`
            : "rgba(255,255,255,0.06)",
          border: "none",
          color: committed ? "#000" : "rgba(255,255,255,0.2)",
        }}
      >
        I'm Ready to Build
      </Button>
    </div>
  );
}
