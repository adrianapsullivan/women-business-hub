import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType, BusinessScores } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import JourneyProgress from "@/components/journey-progress";
import { saveOnboardingStep } from "@/lib/onboarding";

interface BusinessModel {
  key: keyof BusinessScores;
  name: string;
  subtitle: string;
  description: string;
}

const businessModels: BusinessModel[] = [
  {
    key: "personalBrand",
    name: "Personal Brand Empire",
    subtitle: "You are the product",
    description: "Build wealth through your personality, story, and authority. Courses, coaching, speaking, and content.",
  },
  {
    key: "knowledge",
    name: "Knowledge Empire",
    subtitle: "Expertise monetized",
    description: "Transform your expertise into courses, certifications, books, and intellectual property.",
  },
  {
    key: "community",
    name: "Community Empire",
    subtitle: "Belonging as a business",
    description: "Build paid membership communities, masterminds, and group experiences that create lasting transformation.",
  },
  {
    key: "digital",
    name: "Digital Product Empire",
    subtitle: "Create once, sell forever",
    description: "Design templates, ebooks, software, and digital assets that generate passive income around the clock.",
  },
  {
    key: "affiliate",
    name: "Affiliate Empire",
    subtitle: "Curate and earn",
    description: "Build recurring income by recommending products you trust through content, email, and social platforms.",
  },
];

function ScoreBar({ score, color, delay }: { score: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}80 0%, ${color} 100%)`,
        }}
      />
    </div>
  );
}

export default function Compatibility() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);
  const [scores, setScores] = useState<BusinessScores | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) { navigate("/"); return; }
    const result = JSON.parse(resultStr);
    const dnaType: DNAType = result.dnaType;
    if (dnaProfiles[dnaType]) {
      setProfile(dnaProfiles[dnaType]);
    }
    if (result.businessScores) {
      setScores(result.businessScores);
      setTimeout(() => setVisible(true), 200);
    }
    saveOnboardingStep("compatibility");
  }, [navigate]);

  if (!profile || !scores) return null;

  const sortedModels = [...businessModels].sort((a, b) => scores[b.key] - scores[a.key]);
  const topModel = sortedModels[0];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full blur-3xl pointer-events-none"
        style={{ background: `${profile.color}06` }} />

      {/* Progress indicator — Step 3 of 5 */}
      <JourneyProgress step={3} />

      <div className="relative z-10 max-w-sm mx-auto px-5">

        {/* Brand mark */}
        <div className="pt-4 pb-1">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
        </div>

        <div className="py-6 text-center space-y-2 border-b border-white/[0.06]">
          <p className="text-white/30 text-xs tracking-widest uppercase">Business Compatibility</p>
          <h1
            className="text-2xl font-bold text-white"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Your Empire Alignment
          </h1>
          <p className="text-white/40 text-sm">
            Based on your <span style={{ color: profile.color }}>{profile.type}</span> DNA
          </p>
        </div>

        {/* Section 6: Context message */}
        <div className="mt-5 mb-1 px-1 space-y-3 text-center">
          <p className="text-white/55 text-sm leading-relaxed">
            You don't fail because you lack discipline.
            <br />
            You fail because you were building something that was never aligned with you.
          </p>
          <p className="text-white/45 text-sm leading-relaxed">
            Your DNA reveals the path where success feels natural… not forced.
          </p>
        </div>

        <div className="py-5">
          <div
            className="rounded-md p-5 mb-6"
            style={{
              background: `linear-gradient(135deg, ${profile.color}12 0%, ${profile.secondaryColor}08 100%)`,
              border: `1px solid ${profile.color}25`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: `${profile.color}20`, color: profile.color }}
              >
                {profile.symbol}
              </div>
              <div>
                <p className="text-white/40 text-xs tracking-widest uppercase mb-0.5">
                  Highest Compatibility
                </p>
                <p className="text-white/30 text-xs mb-0.5">
                  Best starting model for your DNA.
                </p>
                <h3
                  className="text-white font-bold text-base"
                  data-testid="text-top-business"
                >
                  {topModel.name}
                </h3>
                <p className="text-white/50 text-xs mt-0.5">{topModel.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sortedModels.map((model, i) => {
              const score = scores[model.key];
              const colors = ["#D4AF37", "#E8A0BF", "#C88C50", "#C8B49A", "#A888A8"];
              const barColor = colors[i % colors.length];

              return (
                <div
                  key={model.key}
                  data-testid={`compatibility-${model.key}`}
                  className="space-y-2.5 p-4 bg-white/[0.025] border border-white/[0.06] rounded-md"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(10px)",
                    transition: `all 0.5s ease ${i * 0.1}s`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{model.name}</p>
                      <p className="text-white/35 text-xs">{model.subtitle}</p>
                    </div>
                    <div
                      className="text-xl font-bold flex-shrink-0"
                      style={{ fontFamily: "Playfair Display, serif", color: barColor }}
                    >
                      {score}%
                    </div>
                  </div>
                  <ScoreBar score={score} color={barColor} delay={200 + i * 100} />
                  <p className="text-white/40 text-xs leading-relaxed">{model.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pb-10 space-y-3">
          <Button
            onClick={() => navigate("/foundation")}
            data-testid="button-unlock-journey"
            className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
            style={{
              height: "auto",
              background: `linear-gradient(135deg, ${profile.color} 0%, ${profile.secondaryColor} 100%)`,
              border: "none",
            }}
          >
            Continue to My Empire Path
          </Button>

          <button
            onClick={() => window.open("https://start.womenbusinessempires.com/wbe-founding-membership", "_blank", "noopener,noreferrer")}
            data-testid="button-apply-founding-membership-compatibility"
            className="w-full text-center text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors py-2"
          >
            Apply for Founding Membership →
          </button>

          <Button
            onClick={() => navigate("/report")}
            variant="ghost"
            data-testid="button-back-report"
            className="w-full text-white/40 text-sm py-3"
            style={{ height: "auto" }}
          >
            Back to DNA Report
          </Button>
        </div>
      </div>
    </div>
  );
}
