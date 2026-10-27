import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Target, Zap } from "lucide-react";
import supabase from "@/lib/supabase";

export default function Intro() {
  const [, navigate] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;

      if (user && user.email_confirmed_at) {
        localStorage.setItem(
          "wbe_user",
          JSON.stringify({ id: user.id, email: user.email })
        );
      }
    });
  }, []);

  const pillars = [
    {
      icon: Brain,
      label: "Personality Profile",
      desc: "Discover how you naturally think.",
    },
    {
      icon: Sparkles,
      label: "Natural Strengths",
      desc: "Recognize what comes naturally to you.",
    },
    {
      icon: Target,
      label: "Business Alignment",
      desc: "Explore business models that may suit you.",
    },
    {
      icon: Zap,
      label: "Entrepreneurial Style",
      desc: "Understand how you approach opportunities.",
    },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 py-6 relative overflow-x-hidden sm:px-6 sm:py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[350px] h-[350px] rounded-full bg-[#E8A0BF]/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] rounded-full bg-[#D4AF37]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between gap-4 mb-7">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/wbe-logo.png"
              alt="Women Business Empires"
              className="w-14 h-14 flex-shrink-0 object-contain sm:w-[60px] sm:h-[60px]"
            />
            <span className="text-[#D4AF37] text-[10px] tracking-[0.16em] uppercase font-semibold leading-relaxed sm:text-xs">
              The DNA Experience
            </span>
          </div>
          <button
            onClick={() => navigate("/signup?mode=signin&redirect=/report")}
            data-testid="button-login-intro"
            className="flex-shrink-0 text-[#D4AF37]/80 text-sm underline underline-offset-4 hover:text-[#D4AF37] transition-colors"
          >
            Log In
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3.5 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span className="text-[#D4AF37] text-[11px] tracking-wider uppercase font-medium whitespace-nowrap">
                25 Questions · About 10 Minutes
              </span>
            </div>

            <h1
              className="text-3xl font-bold text-white leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Reveal Your <span className="text-[#D4AF37]">Entrepreneur</span>{" "}
              <span className="text-[#E8A0BF]">DNA</span>
            </h1>

            <p className="text-white/65 text-sm leading-relaxed font-light">
              Discover your natural strengths, how you approach opportunities,
              and the entrepreneurial path that may fit you best.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {pillars.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="space-y-2 rounded-md border border-white/[0.07] bg-white/[0.03] p-3.5"
              >
                <div className="w-8 h-8 rounded-md bg-[#D4AF37]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <p className="text-white text-sm font-medium leading-tight">
                  {label}
                </p>
                <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-md border border-[#E8A0BF]/15 bg-[#E8A0BF]/5 p-4">
            <p className="text-[#E8A0BF] text-xs tracking-widest uppercase font-medium">
              8 Possible Identities
            </p>
            <p className="text-white/60 text-xs leading-relaxed">
              Discover which of the 8 Entrepreneur DNA identities best reflects
              your natural strengths.
            </p>
          </div>
        </div>

        <div className="pt-5 pb-2">
          <p className="text-center text-white/60 text-xs mb-3">
            Your answers stay private.
          </p>
          <Button
            onClick={() => navigate("/assessment-instructions")}
            data-testid="button-open-instructions"
            className="w-full bg-[#D4AF37] text-black font-semibold text-base py-6 rounded-md tracking-wide"
            style={{ height: "auto" }}
          >
            Begin My DNA Analysis
          </Button>
          <p className="text-center text-white/60 text-xs mt-3">
            Free · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
