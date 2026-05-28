import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Crown, Star, Zap, Map, Users, BookOpen } from "lucide-react";
import JourneyProgress from "@/components/journey-progress";
import { saveOnboardingStep } from "@/lib/onboarding";

const features = [
  {
    icon: Map,
    title: "Your Daily Empire Roadmap",
    desc: "Personalized daily actions aligned with your DNA to build momentum every single day.",
  },
  {
    icon: Zap,
    title: "DNA-Matched Business Blueprint",
    desc: "Step-by-step systems built specifically for your Entrepreneur DNA type.",
  },
  {
    icon: Star,
    title: "Weekly Empire-Building Sessions",
    desc: "Live strategy calls tailored to your business model and DNA identity.",
  },
  {
    icon: Users,
    title: "Private Empire Collective",
    desc: "Exclusive community of women with aligned DNA types building together.",
  },
  {
    icon: BookOpen,
    title: "The Empire Vault",
    desc: "Full access to DNA-specific resources, trainings, templates, and tools.",
  },
  {
    icon: Crown,
    title: "1:1 DNA Breakthrough Session",
    desc: "Personal deep-dive session to activate your empire plan immediately.",
  },
];

export default function Premium() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);

  useEffect(() => {
    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) { navigate("/"); return; }
    const stored = JSON.parse(resultStr);
    const type: DNAType = stored.dnaType;
    if (!dnaProfiles[type]) { navigate("/"); return; }

    // Guard: foundation must be fully completed (including commitment + checkmark)
    // before the user can access premium. This ensures Steps 4 and 5 of foundation
    // are never skipped via direct navigation or progress-based routing.
    const foundationStr = localStorage.getItem("empireFoundationData");
    let foundationDone = false;
    try {
      foundationDone = foundationStr
        ? JSON.parse(foundationStr)?.completed === true
        : false;
    } catch { foundationDone = false; }
    if (!foundationDone) {
      navigate("/foundation");
      return;
    }

    setProfile(dnaProfiles[type]);
    saveOnboardingStep("premium");
  }, [navigate]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl"
          style={{ background: `${profile.color}08` }} />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-3xl bg-[#E8A0BF]/5" />
      </div>

      {/* Progress indicator — Step 5 of 5 */}
      <JourneyProgress step={5} />

      <div className="relative z-10 max-w-sm mx-auto px-5">

        {/* Brand mark */}
        <div className="pt-5 pb-1">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
        </div>

        {/* Header */}
        <div className="py-8 text-center space-y-5 border-b border-white/[0.06]">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              background: `${profile.color}15`,
              border: `1px solid ${profile.color}30`,
            }}
          >
            <Crown className="w-3.5 h-3.5" style={{ color: profile.color }} />
            <span className="text-xs tracking-widest uppercase font-medium" style={{ color: profile.color }}>
              Empire Membership
            </span>
          </div>

          <div className="space-y-4">
            <h1
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Your Empire Journey{" "}
              <span style={{ color: profile.color }}>Starts Now</span>
            </h1>
            <p className="text-white/55 text-sm leading-relaxed">
              You've done what most people never do… you got clear.
            </p>
            <p className="text-white/55 text-sm leading-relaxed">
              Now it's time to build.
            </p>
            <p className="text-white/40 text-sm leading-relaxed">
              Because clarity without execution… changes nothing.
            </p>
          </div>

          <div className="pt-1 space-y-3">
            <p className="text-white/55 text-sm leading-relaxed">
              You don't need more information.
            </p>
            <p className="text-white/65 text-sm leading-relaxed font-medium">
              You need the right system… guidance… and environment.
            </p>
          </div>
        </div>

        {/* Founding access positioning */}
        <div
          className="mt-6 rounded-md p-5 space-y-3"
          style={{
            background: `linear-gradient(135deg, ${profile.color}10 0%, ${profile.secondaryColor}07 100%)`,
            border: `1px solid ${profile.color}25`,
          }}
        >
          <div className="space-y-1">
            <p className="text-white/35 text-xs tracking-[0.3em] uppercase">
              Founding Access
            </p>
            <p
              className="text-white text-base font-semibold leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              This is not open to everyone.
            </p>
          </div>
          <p className="text-white/55 text-sm leading-relaxed">
            We are currently onboarding a small group of founding members.
          </p>
          <p className="text-white/45 text-sm leading-relaxed">
            As a founding member, you'll receive early access, founding pricing,
            and direct support while this experience is being built.
          </p>
        </div>

        {/* Features */}
        <div className="py-6 space-y-3">
          <p className="text-white/30 text-xs tracking-widest uppercase mb-4">
            What's Inside the Empire Journey
          </p>

          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              data-testid={`feature-${i}`}
              className="flex items-start gap-3 p-4 bg-white/[0.025] border border-white/[0.06] rounded-md"
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: `${profile.color}12` }}
              >
                <Icon className="w-4 h-4" style={{ color: profile.color }} strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-white text-sm font-semibold break-words">{title}</p>
                <p className="text-white/45 text-xs leading-relaxed break-words">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA section */}
        <div className="pb-10 space-y-4">
          <Button
            data-testid="button-join-waitlist"
            onClick={() => window.open("https://start.womenbusinessempires.com/wbe-founding-membership", "_blank", "noopener,noreferrer")}
            className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
            style={{
              height: "auto",
              background: `linear-gradient(135deg, ${profile.color} 0%, ${profile.secondaryColor} 100%)`,
              border: "none",
            }}
          >
            Apply for Membership
          </Button>
          <p className="text-white/30 text-xs text-center leading-relaxed">
            Access your roadmap, systems, and private support environment
          </p>
        </div>
      </div>
    </div>
  );
}
