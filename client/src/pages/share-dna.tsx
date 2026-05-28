import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { dnaProfiles } from "@/lib/dna-data";
import type { DNAType } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2 } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok } from "react-icons/si";

export default function ShareDNA() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<
    (typeof dnaProfiles)[DNAType] | null
  >(null);
  const [secondaryType, setSecondaryType] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const resultStr = localStorage.getItem("wbe_result");
    if (!resultStr) {
      navigate("/");
      return;
    }
    const result = JSON.parse(resultStr);
    const dnaType: DNAType = result.dnaType;
    if (!dnaProfiles[dnaType]) {
      navigate("/");
      return;
    }
    setProfile(dnaProfiles[dnaType]);
    if (result.secondaryDnaType) setSecondaryType(result.secondaryDnaType);
    setTimeout(() => setVisible(true), 150);
  }, [navigate]);

  if (!profile) return null;

  const quizLink = `${window.location.origin}/intro`;

  const copyText = `My Entrepreneur DNA is ${profile.type}.\n\nApparently this means I build businesses through systems, strategy, and leverage.\n\nTake the test here:\n${quizLink}`;

  const socialCaption = `My Entrepreneur DNA is ${profile.type}.\n\nThis quiz actually nailed how I think about building a business.\n\nTake the test:\n${quizLink}`;

  const copy = (text: string, message: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ description: message }))
      .catch(() => toast({ description: "Copy failed — please try again." }));
  };

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizLink)}&quote=${encodeURIComponent(`My Entrepreneur DNA is ${profile.type}. Apparently this explains exactly how I build businesses. Take the test here: ${quizLink}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleInstagram = () => {
    copy(
      socialCaption,
      "Caption copied! Screenshot your card above and paste to Instagram.",
    );
  };

  const handleTikTok = () => {
    copy(
      socialCaption,
      "Caption copied! Screenshot your card above and paste to TikTok.",
    );
  };

  const handleCopy = () => {
    copy(copyText, "DNA result copied.");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: `${profile.color}08` }}
        />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-[#E8A0BF]/4 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto w-full space-y-7">
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => navigate("/reveal")}
            className="text-white/30 text-sm"
            data-testid="button-back-to-reveal"
          >
            ←
          </button>
          <span className="text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase ml-1">
            Share Your DNA
          </span>
        </div>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateY(0) scale(1)"
              : "translateY(24px) scale(0.95)",
            transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div
            className="rounded-2xl p-6 space-y-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, #0d0d0d 0%, #111 60%, ${profile.color}12 100%)`,
              border: `1px solid ${profile.color}30`,
              boxShadow: `0 0 60px ${profile.color}10, inset 0 0 60px ${profile.color}04`,
            }}
            data-testid="dna-share-card"
          >
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: `${profile.color}10` }}
            />

            <div className="flex items-center gap-2">
              <img
                src="/wbe-logo.png"
                alt="WBE"
                width={24}
                height={24}
                className="rounded-full opacity-80"
              />
              <span className="text-white/30 text-xs tracking-[0.35em] uppercase">
                Entrepreneur DNA
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full border flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  borderColor: `${profile.color}40`,
                  background: `${profile.color}10`,
                }}
              >
                <span style={{ color: profile.color }}>{profile.symbol}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h2
                  className="text-2xl font-bold leading-tight"
                  style={{
                    fontFamily: "Playfair Display, serif",
                    color: profile.color,
                    textShadow: `0 0 30px ${profile.color}50`,
                  }}
                  data-testid="text-share-dna-type"
                >
                  {profile.type}
                </h2>
                {secondaryType && (
                  <p className="text-white/35 text-xs mt-0.5">
                    + {secondaryType}
                  </p>
                )}
                {/* Future feature: display real distribution data once enough assessment results exist. */}
              </div>
            </div>

            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(90deg, ${profile.color}30 0%, transparent 100%)`,
              }}
            />

            <p
              className="text-white/55 text-sm leading-relaxed italic"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              "{profile.tagline}"
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-white/20 text-[10px] tracking-widest uppercase">
                Women Business Empires
              </span>
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: `${profile.color}60` }}
              >
                wbe.com
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease 0.3s",
          }}
          className="space-y-3"
        >
          <p className="text-white/30 text-xs text-center tracking-widest uppercase">
            Share Your DNA
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={shareOnFacebook}
              data-testid="button-share-facebook"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-white/[0.08] bg-white/[0.03] text-white/70 text-sm font-medium transition-all hover:border-[#1877F2]/40 hover:bg-[#1877F2]/8 hover:text-white active:scale-95"
            >
              <SiFacebook className="w-4 h-4 text-[#1877F2]" />
              Facebook
            </button>

            <button
              onClick={handleInstagram}
              data-testid="button-share-instagram"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-white/[0.08] bg-white/[0.03] text-white/70 text-sm font-medium transition-all hover:border-[#E1306C]/40 hover:bg-[#E1306C]/8 hover:text-white active:scale-95"
            >
              <SiInstagram className="w-4 h-4 text-[#E1306C]" />
              Instagram
            </button>

            <button
              onClick={handleTikTok}
              data-testid="button-share-tiktok"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-white/[0.08] bg-white/[0.03] text-white/70 text-sm font-medium transition-all hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-95"
            >
              <SiTiktok className="w-4 h-4 text-white/80" />
              TikTok
            </button>

            <button
              onClick={handleCopy}
              data-testid="button-copy-dna"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-white/[0.08] bg-white/[0.03] text-white/70 text-sm font-medium transition-all hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/8 hover:text-white active:scale-95"
            >
              <Copy className="w-4 h-4 text-[#D4AF37]" />
              Copy Result
            </button>
          </div>
        </div>

        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.5s",
          }}
          className="space-y-5"
        >
          <div
            className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center"
            data-testid="text-viral-stat"
          >
            <p className="text-white/50 text-sm leading-relaxed">
              <span className="text-[#D4AF37] font-semibold">97%</span> of
              women building online businesses don't know their Entrepreneur
              DNA.
            </p>
          </div>

          <Button
            onClick={() => navigate("/report")}
            data-testid="button-unlock-full-report"
            className="w-full font-semibold text-base py-6 rounded-md tracking-wide text-black"
            style={{
              height: "auto",
              background: `linear-gradient(135deg, ${profile.color} 0%, ${profile.secondaryColor} 100%)`,
              border: "none",
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Unlock My Full DNA Report
          </Button>

          <p className="text-white/20 text-xs text-center">
            See your strengths, growth path, and personalized business
            blueprint
          </p>
        </div>
      </div>
    </div>
  );
}
