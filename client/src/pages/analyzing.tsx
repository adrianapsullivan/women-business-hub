import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const phases = [
  "Scanning personality architecture...",
  "Mapping entrepreneurial tendencies...",
  "Analyzing leadership patterns...",
  "Decoding your risk profile...",
  "Identifying your natural strengths...",
  "Cross-referencing business alignment...",
  "Calculating your Entrepreneur DNA...",
  "Preparing your reveal...",
];

export default function Analyzing() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase((p) => {
        if (p >= phases.length - 1) {
          clearInterval(phaseInterval);
          setTimeout(() => navigate("/reveal"), 800);
          return p;
        }
        return p + 1;
      });
    }, 700);

    return () => clearInterval(phaseInterval);
  }, [navigate]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  const progress = ((phase + 1) / phases.length) * 100;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-[#E8A0BF]/5 blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center space-y-10">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
              />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="url(#dnaGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.7s ease" }}
              />
              <defs>
                <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#E8A0BF" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-[#D4AF37] text-xl font-bold"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Analyzing Your<br />
              <span className="text-[#D4AF37]">Entrepreneur DNA</span>
            </h1>
            <p
              className="text-white/40 text-sm h-5 transition-all duration-300"
              data-testid="text-analysis-phase"
            >
              {phases[phase]}{dots}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((p, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300 ${
                  i < phase
                    ? "bg-[#D4AF37]"
                    : i === phase
                    ? "bg-[#E8A0BF] scale-125"
                    : "bg-white/10"
                }`}
              />
              <span
                className={`text-xs transition-colors duration-300 ${
                  i < phase
                    ? "text-white/40 line-through decoration-[#D4AF37]/30"
                    : i === phase
                    ? "text-white/80"
                    : "text-white/15"
                }`}
              >
                {p}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
