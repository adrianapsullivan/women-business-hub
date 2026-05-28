import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  ChevronLeft,
} from "lucide-react";

export default function DnaReport() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);

  useEffect(() => {
    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) {
      navigate("/dashboard");
      return;
    }
    const result = JSON.parse(resultStr);
    const dnaType: DNAType = result.dnaType;
    if (dnaProfiles[dnaType]) {
      setProfile(dnaProfiles[dnaType]);
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  if (!profile) return null;

  const sections = [
    {
      icon: Heart,
      label: "Personality Profile",
      color: "#E8A0BF",
      content: (
        <p className="text-white/65 text-sm leading-relaxed font-light">
          {profile.personality}
        </p>
      ),
    },
    {
      icon: CheckCircle2,
      label: "Your Natural Strengths",
      color: "#D4AF37",
      content: (
        <ul className="space-y-2">
          {profile.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div
                className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#D4AF37" }}
              />
              <span className="text-white/70 text-sm">{s}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: TrendingUp,
      label: "Skills to Develop",
      color: profile.color,
      content: (
        <ul className="space-y-2">
          {profile.skillsToDevelop.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-white/30" />
              <span className="text-white/60 text-sm">{s}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: AlertCircle,
      label: "Why Past Attempts May Not Have Worked",
      color: "#E8A0BF",
      content: (
        <p className="text-white/65 text-sm leading-relaxed font-light">
          {profile.whyItHasntWorked}
        </p>
      ),
    },
    {
      icon: TrendingUp,
      label: "Your Future Potential",
      color: "#D4AF37",
      content: (
        <p className="text-white/65 text-sm leading-relaxed font-light">
          {profile.futurePotential}
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: `${profile.color}08` }}
      />

      <div className="relative z-10 max-w-sm mx-auto px-5">

        {/* Top nav */}
        <div className="pt-5 pb-2 flex items-center gap-3">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            data-testid="button-back-to-dashboard-top"
            className="flex items-center gap-1 text-white/35 text-sm hover:text-white/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* DNA Identity header */}
        <div className="py-6 flex flex-col items-center text-center gap-4 border-b border-white/[0.06]">
          <span className="text-white/30 text-xs tracking-widest uppercase">DNA Report</span>

          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: `${profile.color}25` }}
            />
            <div
              className="relative w-20 h-20 rounded-full border flex items-center justify-center text-3xl"
              style={{ borderColor: `${profile.color}40`, background: `${profile.color}08` }}
            >
              <span style={{ color: profile.color }}>{profile.symbol}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "Playfair Display, serif", color: profile.color }}
              data-testid="text-dna-report-type"
            >
              {profile.type}
            </h1>
            <p className="text-white/40 text-xs tracking-widest uppercase">
              Entrepreneur DNA Identity
            </p>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>8</div>
              <div className="text-white/30 text-xs uppercase tracking-widest mt-0.5">DNA Types</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>25</div>
              <div className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Questions</div>
            </div>
          </div>
        </div>

        {/* Full report sections — always shown (user is already authenticated & has completed journey) */}
        <div className="py-6 space-y-4">
          {sections.map(({ icon: Icon, label, color, content }, i) => (
            <div
              key={i}
              data-testid={`section-dna-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="bg-white/[0.025] border border-white/[0.07] rounded-md p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={1.5} />
                </div>
                <h3 className="text-white text-sm font-semibold">{label}</h3>
              </div>
              {content}
            </div>
          ))}
        </div>

        {/* Back to Dashboard */}
        <div className="pb-12">
          <Button
            onClick={() => navigate("/dashboard")}
            data-testid="button-back-to-dashboard-bottom"
            className="w-full font-semibold text-base py-5 rounded-md tracking-wide"
            style={{
              height: "auto",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>

      </div>
    </div>
  );
}
