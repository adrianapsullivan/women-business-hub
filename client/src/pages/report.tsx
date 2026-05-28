import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Lock,
  Zap,
  Users,
  Star,
  ChevronRight,
  Compass,
  BarChart3,
  Mail,
  Map,
} from "lucide-react";
import JourneyProgress from "@/components/journey-progress";
import supabase from "@/lib/supabase";
import { saveUserProgress } from "@/lib/progress";
import { saveOnboardingStep } from "@/lib/onboarding";

type AuthState = "loading" | "guest" | "pending" | "unlocked";

export default function Report() {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState("");
  // Guard: only call saveUserProgress once per mount, even if onAuthStateChange fires multiple times
  const progressSavedRef = useRef(false);

  useEffect(() => {
    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) {
      navigate("/");
      return;
    }
    const result = JSON.parse(resultStr);
    const dnaType: DNAType = result.dnaType;
    if (dnaProfiles[dnaType]) {
      setProfile(dnaProfiles[dnaType]);
    }

    const resolveAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      applySession(session?.user ?? null);
    };

    resolveAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Gate: guests and unconfirmed users are redirected to signup — no partial content shown
  useEffect(() => {
    if (authState === "guest" || authState === "pending") {
      navigate("/signup?redirect=/report");
    }
  }, [authState, navigate]);

  const applySession = (user: { id?: string; email?: string | null; email_confirmed_at?: string | null } | null) => {
    if (!user) {
      setAuthState("guest");
      return;
    }
    setUserEmail(user.email ?? "");
    if (user.email_confirmed_at) {
      localStorage.setItem("wbe_report_unlocked", "true");
      if (user.id) {
        localStorage.setItem("wbe_user", JSON.stringify({ id: user.id, email: user.email }));
        // Guard: only save once per mount — prevents the onAuthStateChange loop
        // where updateUser() fires a USER_UPDATED event → applySession → updateUser() → loop
        if (!progressSavedRef.current) {
          progressSavedRef.current = true;
          saveUserProgress({ reportUnlocked: true });
          saveOnboardingStep("report");
        }
      }
      setAuthState("unlocked");
    } else {
      setAuthState("pending");
    }
  };

  if (!profile || authState === "loading") return null;

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

  const empireFeatures = [
    { icon: Map, label: "Your Daily Empire Roadmap" },
    { icon: Zap, label: "DNA-Matched Business Blueprint" },
    { icon: Users, label: "Weekly Empire-Building Sessions" },
    { icon: Star, label: "Private Empire Collective Community" },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: `${profile.color}08` }}
      />

      <JourneyProgress step={2} />

      <div className="relative z-10 max-w-sm mx-auto px-5">

        {/* Brand mark */}
        <div className="pt-4 pb-1">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
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
              data-testid="text-report-dna-type"
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

        {/* ── UNLOCKED VIEW ── confirmed email */}
        {authState === "unlocked" && (
          <>
            <div className="py-6 space-y-4">
              {sections.map(({ icon: Icon, label, color, content }, i) => (
                <div
                  key={i}
                  data-testid={`section-${label.toLowerCase().replace(/\s+/g, "-")}`}
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

            <div className="mb-10 rounded-md border border-white/[0.08] bg-white/[0.025] overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="w-8 h-px bg-[#D4AF37]/50 mb-3" />
                  <h2
                    className="text-xl font-bold text-white leading-snug"
                    style={{ fontFamily: "Playfair Display, serif" }}
                    data-testid="text-empire-journey-heading"
                  >
                    Your Empire Journey{" "}
                    <span className="text-[#D4AF37]">Starts Now</span>
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed font-light pt-1">
                    Now that you understand your Entrepreneur DNA, the next step
                    is activating it with the right systems, strategy, and support.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {empireFeatures.map(({ icon: FIcon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "#D4AF3715" }}
                      >
                        <FIcon className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                      </div>
                      <span className="text-white/70 text-sm">{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate("/compatibility")}
                  data-testid="button-start-empire-journey"
                  className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black mt-2"
                  style={{
                    height: "auto",
                    background: "linear-gradient(135deg, #D4AF37 0%, #E8A0BF 100%)",
                    border: "none",
                  }}
                >
                  Continue to My Empire Path
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                <button
                  onClick={() => window.open("https://start.womenbusinessempires.com/wbe-founding-membership", "_blank", "noopener,noreferrer")}
                  data-testid="button-apply-founding-membership-report"
                  className="w-full text-center text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors py-2"
                >
                  Apply for Founding Membership →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PENDING VIEW ── signed up, email not yet confirmed */}
        {authState === "pending" && (
          <div className="py-8 space-y-6 pb-16">
            {/* Teaser preview — locked */}
            <div className="space-y-3">
              <div className="bg-white/[0.025] border border-white/[0.07] rounded-md p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-[#E8A0BF]/10">
                    <Heart className="w-3.5 h-3.5 text-[#E8A0BF]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-white text-sm font-semibold">What This Means For You</h3>
                </div>
                <p className="text-white/65 text-sm leading-relaxed font-light">
                  {profile.personality.slice(0, 220)}…
                </p>
              </div>
            </div>

            {/* Email confirmation notice */}
            <div
              className="rounded-xl p-6 text-center space-y-4"
              style={{
                background: "linear-gradient(135deg, #D4AF3710 0%, #E8A0BF08 100%)",
                border: "1px solid #D4AF3730",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "#D4AF3718", border: "1px solid #D4AF3735" }}
              >
                <Mail className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <h3
                  className="text-lg font-bold text-white leading-snug"
                  style={{ fontFamily: "Playfair Display, serif" }}
                  data-testid="text-check-email-heading"
                >
                  Check Your Email to Unlock Your Full Results
                </h3>
                <p className="text-white/55 text-sm leading-relaxed">
                  We've sent a secure access link to{" "}
                  {userEmail ? (
                    <span className="text-white/80 font-medium">{userEmail}</span>
                  ) : (
                    "your email"
                  )}
                  .
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  To continue your journey and unlock your full DNA profile,
                  please open your email and click the link.
                </p>
              </div>

              <div className="pt-1 space-y-2">
                <p className="text-white/35 text-xs leading-relaxed">
                  This protects your results and keeps your experience private.
                </p>
                <p className="text-white/25 text-xs">
                  Didn't receive it? Check spam or wait a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── GUEST VIEW ── not signed in */}
        {authState === "guest" && (
          <div className="py-6 space-y-4 pb-10">

            {/* Partial preview — 2 teaser cards */}
            <div className="bg-white/[0.025] border border-white/[0.07] rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-[#E8A0BF]/10">
                  <Heart className="w-3.5 h-3.5 text-[#E8A0BF]" strokeWidth={1.5} />
                </div>
                <h3 className="text-white text-sm font-semibold">What This Means For You</h3>
              </div>
              <p className="text-white/65 text-sm leading-relaxed font-light">
                {profile.personality.slice(0, 240)}
                {profile.personality.length > 240 ? "…" : ""}
              </p>
            </div>

            <div className="bg-white/[0.025] border border-white/[0.07] rounded-md p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: `${profile.color}15` }}
                >
                  <Compass className="w-3.5 h-3.5" style={{ color: profile.color }} strokeWidth={1.5} />
                </div>
                <h3 className="text-white text-sm font-semibold">Your Strongest Empire Model</h3>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: profile.color }} />
                <span className="text-white/70 text-sm leading-relaxed">{profile.strengths[0]}</span>
              </div>
              <p
                className="text-white/45 text-xs leading-relaxed italic pt-1"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                "{profile.tagline}"
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-white/25 text-[10px] tracking-[0.25em] uppercase whitespace-nowrap">
                Continue Your Entrepreneur DNA Report
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Locked sections — blurred preview with overlay card */}
            <div className="relative rounded-md">
              {/* Blurred background cards */}
              <div
                className="space-y-3 pointer-events-none select-none"
                style={{ filter: "blur(5px)", opacity: 0.35 }}
              >
                {[
                  { icon: BarChart3, label: "Your Business Compatibility Map", color: "#D4AF37" },
                  { icon: TrendingUp, label: "Your Growth Pattern", color: "#E8A0BF" },
                  { icon: Zap, label: "Your Empire Strategy Blueprint", color: profile.color },
                ].map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="bg-white/[0.025] border border-white/[0.07] rounded-md p-5 space-y-3"
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
                    <div className="space-y-2">
                      <div className="h-2 bg-white/20 rounded-full w-full" />
                      <div className="h-2 bg-white/15 rounded-full w-4/5" />
                      <div className="h-2 bg-white/10 rounded-full w-3/5" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Unlock card — centered over blurred cards, no overflow:hidden so it never clips */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-3">
                <div className="w-full bg-black/90 border border-[#D4AF37]/30 rounded-xl p-6 text-center backdrop-blur-sm space-y-4">
                  <div
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: "#D4AF3720", border: "1px solid #D4AF3740" }}
                  >
                    <Lock className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-2">
                    <h3
                      className="text-lg font-bold text-white leading-snug"
                      style={{ fontFamily: "Playfair Display, serif" }}
                      data-testid="text-unlock-heading"
                    >
                      Unlock Your Full Entrepreneur DNA Profile
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed">
                      Create your free account to see your strengths, growth
                      path, and personalized business blueprint.
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate("/signup?redirect=/report")}
                    data-testid="button-unlock-report"
                    className="w-full font-semibold text-base py-5 rounded-md tracking-wide text-black"
                    style={{
                      height: "auto",
                      background: "linear-gradient(135deg, #D4AF37 0%, #E8A0BF 100%)",
                      border: "none",
                    }}
                  >
                    Unlock My Full DNA Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
