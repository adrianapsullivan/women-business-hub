import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function AssessmentInstructions() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 py-6 relative overflow-x-hidden sm:px-6 sm:py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[350px] h-[350px] rounded-full bg-[#E8A0BF]/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] rounded-full bg-[#D4AF37]/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="flex items-center gap-3 mb-10">
          <img
            src="/wbe-logo.png"
            alt="Women Business Empires"
            className="w-14 h-14 flex-shrink-0 object-contain sm:w-[60px] sm:h-[60px]"
          />
          <button
            type="button"
            onClick={() => navigate("/intro")}
            data-testid="button-back-instructions"
            aria-label="Back to assessment welcome"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/55 hover:text-white hover:border-white/20 transition-colors"
          >
            ←
          </button>
          <span className="text-[#D4AF37] text-[10px] tracking-[0.16em] uppercase font-semibold leading-relaxed sm:text-xs">
            The DNA Experience
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-8 py-4 -translate-y-12">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h1
              className="text-3xl font-bold text-white leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Before You <span className="text-[#D4AF37]">Begin</span>
            </h1>
          </div>

          <div className="space-y-5 text-white/70 text-sm leading-relaxed font-light">
            <p className="text-[#E8A0BF] text-base font-medium">
              There are no right or wrong answers.
            </p>
            <p>
              Think about how you naturally approach situations, not what you
              think you should do or what your current circumstances require.
            </p>
            <p>
              If two answers feel right, choose the one that feels most like you.
            </p>
            <div className="border-l-2 border-[#D4AF37]/60 pl-4 py-1">
              <p className="text-white/90 font-medium">
                Trust your instincts. Don&apos;t overthink it.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-2">
          <Button
            onClick={() => {
              localStorage.setItem("wbe_intro_complete", "true");
              navigate("/quiz");
            }}
            data-testid="button-begin-quiz"
            className="w-full bg-[#D4AF37] text-black font-semibold text-base py-6 rounded-md tracking-wide"
            style={{ height: "auto" }}
          >
            Begin Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
