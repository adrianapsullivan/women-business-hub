import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Download } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import JourneyProgress from "@/components/journey-progress";
import { saveOnboardingStep } from "@/lib/onboarding";

export default function Reveal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [stage, setStage] = useState(0);
  const [profile, setProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);
  const [secondaryProfile, setSecondaryProfile] = useState<(typeof dnaProfiles)[DNAType] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const secondaryDnaType: DNAType | undefined = result.secondaryDnaType;
    if (secondaryDnaType && dnaProfiles[secondaryDnaType]) {
      setSecondaryProfile(dnaProfiles[secondaryDnaType]);
    }
    saveOnboardingStep("reveal");
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1200);
    const t3 = setTimeout(() => setStage(3), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): number => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, currentY);
    return currentY;
  };

  const downloadDNACard = () => {
    if (!profile) return;
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 900, 500);

    const grad = ctx.createLinearGradient(0, 0, 900, 500);
    grad.addColorStop(0, `${profile.color}18`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 500);

    ctx.fillStyle = profile.color;
    ctx.fillRect(0, 0, 5, 500);

    ctx.fillStyle = `${profile.color}20`;
    ctx.beginPath();
    ctx.arc(820, 80, 160, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = profile.color;
    ctx.font = "bold 90px serif";
    ctx.textAlign = "center";
    ctx.fillText(profile.symbol, 820, 110);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.textAlign = "left";
    ctx.fillText("ENTREPRENEUR DNA", 60, 80);

    ctx.fillStyle = profile.color;
    ctx.font = "bold 58px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(profile.type, 60, 175);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText("Entrepreneur DNA Identity", 60, 210);

    ctx.fillStyle = `${profile.color}60`;
    ctx.fillRect(60, 235, 120, 1);

    const shortDesc = profile.personality.split(".")[0] + ".";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "18px system-ui, sans-serif";
    wrapText(ctx, shortDesc, 60, 272, 680, 30);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(60, 455, 780, 1);

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Women Business Empires", 60, 480);

    ctx.fillStyle = `${profile.color}50`;
    ctx.textAlign = "right";
    ctx.fillText("wbe.com", 840, 480);

    const link = document.createElement("a");
    link.download = `entrepreneur-dna-${profile.type.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ description: "Your DNA Card has been downloaded." });
  };

  if (!profile) return null;

  const quizLink = `${window.location.origin}/intro`;
  const shareCaption = `I just discovered my Entrepreneur DNA: ${profile.type}. What's yours?\n\n${quizLink}`;

  const copy = (text: string, msg: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ description: msg }))
      .catch(() => toast({ description: "Copy failed — please try again." }));
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizLink)}&quote=${encodeURIComponent(`I just discovered my Entrepreneur DNA: ${profile.type}. What's yours? ${quizLink}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${profile.color}10 0%, transparent 70%)`,
            opacity: stage >= 2 ? 1 : 0,
            transition: "opacity 1.5s ease",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full blur-3xl"
          style={{
            background: "#E8A0BF08",
            opacity: stage >= 3 ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
          }}
        />
      </div>

      {/* Progress indicator — Step 1 of 5 */}
      <JourneyProgress step={1} />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 pb-16 space-y-8">

        {/* Stage 1: Logo + identity badge */}
        <div
          style={{
            opacity: stage >= 1 ? 1 : 0,
            transform: stage >= 1 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease",
          }}
          className="flex flex-col items-center gap-4 pt-4"
        >
          <img
            src="/wbe-logo.png"
            alt="Women Business Empires"
            width={80}
            height={80}
            className="rounded-full"
          />
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span className="text-white/50 text-xs tracking-widest uppercase">
              Your Entrepreneur DNA
            </span>
          </div>
        </div>

        {/* Stage 2: DNA type badge — visually prominent */}
        <div
          style={{
            opacity: stage >= 2 ? 1 : 0,
            transform: stage >= 2 ? "scale(1)" : "scale(0.85)",
            transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          className="text-center"
        >
          <div className="relative mx-auto w-28 h-28 mb-5">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: `${profile.color}30` }}
            />
            <div
              className="relative w-28 h-28 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: `${profile.color}40`,
                background: `${profile.color}08`,
              }}
            >
              <span className="text-4xl font-bold" style={{ color: profile.color }}>
                {profile.symbol}
              </span>
            </div>
          </div>

          <p className="text-white/40 text-xs tracking-[0.4em] uppercase mb-1">
            Entrepreneur DNA
          </p>
          <h1
            className="text-4xl font-bold leading-tight mb-2"
            style={{
              fontFamily: "Playfair Display, serif",
              color: profile.color,
              textShadow: `0 0 40px ${profile.color}40`,
            }}
            data-testid="text-dna-type"
          >
            {profile.type}
          </h1>

          {/* DNA Identity Badge — Section 2 */}
          <div
            className="inline-flex flex-col items-center gap-0.5 px-5 py-2 rounded-full mx-auto"
            style={{
              background: `${profile.color}12`,
              border: `1px solid ${profile.color}30`,
            }}
          >
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: profile.color }}
            >
              {profile.type}
            </span>
            <span className="text-white/35 text-[10px] tracking-[0.3em] uppercase">
              Entrepreneur DNA Identity
            </span>
          </div>

          {secondaryProfile && (
            <p className="text-white/45 text-sm mt-3">
              With strong traits of:{" "}
              <span className="text-white/70 font-medium">
                {secondaryProfile.type}
              </span>
            </p>
          )}
        </div>

        {/* Stage 3: Messaging + share + CTA */}
        <div
          style={{
            opacity: stage >= 3 ? 1 : 0,
            transform: stage >= 3 ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease 0.2s",
          }}
          className="space-y-7"
        >
          {/* Identity messaging */}
          <div className="space-y-4">
            <p className="text-white/80 text-sm leading-relaxed font-medium text-center">
              Your answers reveal a rare pattern of entrepreneurial thinking.
            </p>
          </div>

          {/* Emotional connection block */}
          <div className="space-y-5 text-center px-1">
            <p
              className="text-white/55 text-xs tracking-[0.3em] uppercase"
            >
              This might feel familiar…
            </p>
            <div className="space-y-4">
              <p className="text-white/75 text-sm leading-relaxed">
                You're not here by accident.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                This was created by a woman who reached a point where everything
                looked fine… but didn't feel right anymore.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Long days. Longer commutes.
                <br />
                Coming home exhausted… with nothing left to give to the people
                she loved the most.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Not because she didn't care…
                <br />
                But because everything was going to something that wasn't hers.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                She didn't need more motivation.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                She needed a different path.
              </p>
              <p
                className="text-sm leading-relaxed italic"
                style={{
                  color: `${profile.color}cc`,
                  fontFamily: "Playfair Display, serif",
                }}
              >
                That's why this exists.
              </p>
            </div>
          </div>

          {/* Download DNA Card — Section 4 */}
          <div
            className="rounded-xl p-5 space-y-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, #0d0d0d 0%, #111 60%, ${profile.color}12 100%)`,
              border: `1px solid ${profile.color}25`,
            }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: `${profile.color}10` }}
            />
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  borderColor: `${profile.color}40`,
                  background: `${profile.color}10`,
                  color: profile.color,
                }}
              >
                {profile.symbol}
              </div>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: profile.color, fontFamily: "Playfair Display, serif" }}
                >
                  {profile.type}
                </p>
                <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase">
                  Entrepreneur DNA Identity
                </p>
              </div>
            </div>
            <p
              className="text-white/50 text-xs leading-relaxed italic"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              "{profile.personality.split(".")[0]}."
            </p>
            <button
              onClick={downloadDNACard}
              data-testid="button-download-dna-card"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-md border text-sm font-medium transition-all active:scale-95"
              style={{
                borderColor: `${profile.color}40`,
                color: profile.color,
                background: `${profile.color}10`,
              }}
            >
              <Download className="w-4 h-4" />
              Download My DNA Card
            </button>
          </div>

          {/* Share section — Section 3 */}
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <p className="text-white/30 text-[10px] tracking-[0.35em] uppercase">
                Share Your Entrepreneur DNA
              </p>
              <p className="text-white/50 text-xs leading-relaxed px-2">
                Your Entrepreneur DNA is unique. Share the assessment with
                another woman ready to build something of her own.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareOnFacebook}
                data-testid="button-reveal-share-facebook"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md border border-white/[0.08] bg-white/[0.02] text-white/55 text-xs font-medium transition-all hover:border-[#1877F2]/40 hover:text-white active:scale-95"
              >
                <SiFacebook className="w-3.5 h-3.5 text-[#1877F2]" />
                Facebook
              </button>
              <button
                onClick={() =>
                  copy(
                    shareCaption,
                    "Caption copied! Screenshot and share to Instagram.",
                  )
                }
                data-testid="button-reveal-share-instagram"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md border border-white/[0.08] bg-white/[0.02] text-white/55 text-xs font-medium transition-all hover:border-[#E1306C]/40 hover:text-white active:scale-95"
              >
                <SiInstagram className="w-3.5 h-3.5 text-[#E1306C]" />
                Instagram
              </button>
              <button
                onClick={() =>
                  copy(
                    shareCaption,
                    "Caption copied! Screenshot and share to TikTok.",
                  )
                }
                data-testid="button-reveal-share-tiktok"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md border border-white/[0.08] bg-white/[0.02] text-white/55 text-xs font-medium transition-all hover:border-white/20 hover:text-white active:scale-95"
              >
                <SiTiktok className="w-3.5 h-3.5 text-white/70" />
                TikTok
              </button>
              <button
                onClick={() => copy(shareCaption, "Share link copied.")}
                data-testid="button-reveal-copy-link"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md border border-white/[0.08] bg-white/[0.02] text-white/55 text-xs font-medium transition-all hover:border-[#D4AF37]/40 hover:text-white active:scale-95"
              >
                <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                Copy Link
              </button>
            </div>
          </div>

          {/* Transition + CTA */}
          <div className="space-y-5">
            <div className="text-center space-y-3 px-2">
              <p className="text-white/50 text-sm leading-relaxed">
                You can keep trying to figure this out on your own…
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: `${profile.color}cc`, fontFamily: "Playfair Display, serif" }}
              >
                Or…
              </p>
              <p className="text-white/65 text-sm leading-relaxed">
                You can finally follow a path that was built for you.
              </p>
            </div>

            <Button
              onClick={() => navigate("/report")}
              data-testid="button-read-full-report"
              className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
              style={{
                height: "auto",
                background: `linear-gradient(135deg, ${profile.color} 0%, ${profile.secondaryColor} 100%)`,
                border: "none",
              }}
            >
              Unlock My Full DNA Report
            </Button>
            <p className="text-white/30 text-xs text-center leading-relaxed px-4">
              You're stepping into a new way of building… with women who are done settling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
