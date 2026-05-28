import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Target, Zap } from "lucide-react";
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
      desc: "How your mind is wired for success",
    },
    {
      icon: Sparkles,
      label: "Natural Strengths",
      desc: "The gifts you were born with",
    },
    {
      icon: Target,
      label: "Business Alignment",
      desc: "Which empire model fits you perfectly",
    },
    {
      icon: Zap,
      label: "Entrepreneurial Style",
      desc: "How you are designed to build",
    },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[350px] h-[350px] rounded-full bg-[#E8A0BF]/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] rounded-full bg-[#D4AF37]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
            <button
              onClick={() => navigate("/")}
              data-testid="button-back-intro"
              className="text-white/40 text-sm"
            >
              ←
            </button>
            <span className="text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase">
              The Assessment
            </span>
          </div>
          <button
            onClick={() => navigate("/signup?mode=signin&redirect=/report")}
            data-testid="button-login-intro"
            className="text-white/35 text-xs hover:text-white/60 transition-colors"
          >
            Already have an account?{" "}
            <span className="text-[#D4AF37]/70 underline underline-offset-2">
              Log in
            </span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs tracking-widest uppercase font-medium">
                25 Questions · 5 Minutes
              </span>
            </div>

            <h1
              className="text-3xl font-bold text-white leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Reveal Your <span className="text-[#D4AF37]">Entrepreneur</span>{" "}
              <span className="text-[#E8A0BF]">DNA</span>
            </h1>

            <p className="text-white/60 text-sm leading-relaxed font-light">
              This is not a personality test. This is a deep analysis of how you
              are wired to build wealth, create impact, and lead your empire.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {pillars.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-white/[0.03] border border-white/[0.07] rounded-md p-4 space-y-2"
              >
                <div className="w-8 h-8 rounded-md bg-[#D4AF37]/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <p className="text-white text-sm font-medium leading-tight">
                  {label}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#E8A0BF]/5 border border-[#E8A0BF]/15 rounded-md p-4 space-y-2">
            <p className="text-[#E8A0BF] text-xs tracking-widest uppercase font-medium">
              8 Possible Identities
            </p>
            <p className="text-white/60 text-xs leading-relaxed">
              Your results are unique to you. Answer honestly and instinctively
              — there are no wrong answers, only your truth.
            </p>
          </div>
        </div>

        <div className="pt-3">
          <p className="text-center text-white/70 text-xs mt-4 mb-2">
            Takes 5 minutes… your answers stay private.
          </p>
          <Button
            onClick={() => {
              localStorage.setItem("wbe_intro_complete", "true");
              navigate("/quiz");
            }}
            data-testid="button-begin-quiz"
            className="w-full mt-4 bg-[#D4AF37] text-black font-semibold text-base py-6 rounded-md tracking-wide"
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
