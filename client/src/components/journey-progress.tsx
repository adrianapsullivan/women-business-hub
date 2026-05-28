const STEPS = [
  "Your DNA Reveal",
  "Your DNA Report",
  "Business Compatibility",
  "Empire Path",
  "Start Your Journey",
];

interface JourneyProgressProps {
  step: number;
}

export default function JourneyProgress({ step }: JourneyProgressProps) {
  return (
    <div className="w-full max-w-sm mx-auto px-5 pt-5 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/30 text-[10px] tracking-[0.25em] uppercase">
          Step {step} of {STEPS.length}
        </span>
        <span className="text-white/40 text-[10px] tracking-wide">
          {STEPS[step - 1]}
        </span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-px rounded-full transition-all duration-500"
            style={{
              background:
                i < step
                  ? "linear-gradient(90deg, #D4AF37, #E8A0BF)"
                  : "rgba(255,255,255,0.08)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
