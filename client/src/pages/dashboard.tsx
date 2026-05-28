import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Flame,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  Lock,
  FileText,
  Users,
  ChevronRight,
  LogOut,
} from "lucide-react";
import supabase from "@/lib/supabase";
import { saveUserProgress } from "@/lib/progress";
import { saveOnboardingStep } from "@/lib/onboarding";

// ── localStorage keys ─────────────────────────────────────────────────────────
const EMPIRE_PATH_KEY        = "wbe_empire_path";
const ACTIVATION_DATE_KEY    = "wbe_last_activation_date";
const DAY_STREAK_KEY         = "wbe_day_streak";
const MISSION_DATE_KEY       = "wbe_today_mission_date";
const MISSION_DONE_KEY       = "wbe_today_mission_completed";
const EMPIRE_SCORE_KEY       = "wbe_empire_score";
const WEEKLY_GOALS_KEY       = "wbe_weekly_goals";

type EmpirePath = "builder" | "creator" | "connector" | null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getInt(key: string, fallback = 0) {
  return parseInt(localStorage.getItem(key) ?? String(fallback), 10) || fallback;
}

/** Read streak from storage — resets to 1 if the user skipped a day */
function getStoredStreak(): number {
  const saved = getInt(DAY_STREAK_KEY, 1);
  const lastDate = localStorage.getItem(ACTIVATION_DATE_KEY);
  if (!lastDate) return 1;
  // Valid streak = activated today or yesterday
  if (lastDate === todayStr() || lastDate === yesterdayStr()) return saved;
  // Broken streak
  return 1;
}

function getStoredFirstName() {
  try {
    const u = JSON.parse(localStorage.getItem("wbe_user") ?? "{}");
    return u?.firstName ?? u?.first_name ?? "";
  } catch { return ""; }
}

function getStoredDnaType(): string {
  try {
    const r = JSON.parse(localStorage.getItem("wbe_result") ?? "{}");
    return r?.dnaType ?? "";
  } catch { return ""; }
}

function getWeeklyGoals(): boolean[] {
  try {
    const s = localStorage.getItem(WEEKLY_GOALS_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return [false, false, false, false, false];
}

// ── Static data ───────────────────────────────────────────────────────────────
const paths = [
  {
    id: "builder" as const,
    title: "THE BUILDER",
    description: "You build through systems, structure, and scalable income. You feel strongest when things are organized and moving forward.",
    dnaTypes: "Strategic Builder · Action Taker · Legacy Builder",
    gradient: "from-[#D4AF37]/20 to-[#D4AF37]/5",
    border: "border-[#D4AF37]/30",
    activeBorder: "border-[#D4AF37]",
  },
  {
    id: "creator" as const,
    title: "THE CREATOR",
    description: "You build through ideas, content, and expression. You need space to create and share your message with the world.",
    dnaTypes: "Visionary Leader · Knowledge Authority · Freedom Strategist",
    gradient: "from-[#E8A0BF]/20 to-[#E8A0BF]/5",
    border: "border-[#E8A0BF]/30",
    activeBorder: "border-[#E8A0BF]",
  },
  {
    id: "connector" as const,
    title: "THE CONNECTOR",
    description: "You build through people, trust, and relationships. You thrive when you are connecting and creating belonging.",
    dnaTypes: "Community Builder · Influence Creator",
    gradient: "from-white/10 to-white/5",
    border: "border-white/20",
    activeBorder: "border-white/50",
  },
];

const missions: Record<"builder" | "creator" | "connector", { title: string; description: string }> = {
  builder: {
    title: "Define Your Core Offer",
    description: "Write your one core offer in one sentence. Clarity is your first system. Builders do not move without a clear foundation.",
  },
  creator: {
    title: "Write Your Brand Story",
    description: "Write your brand story in three sentences. Your voice is your empire. People follow creators who know who they are.",
  },
  connector: {
    title: "Find Your Community",
    description: "Identify three communities where your ideal client already spends time. Connectors go where the people are.",
  },
};

// Enhanced 7-day coaching missions for Creator path.
// Index 0 = Monday … Index 6 = Sunday  (formula: (getDay()+6)%7)
type CreatorMission = {
  title: string;
  identityShift: string;
  whatMatters: string;
  execution: string;
};

const creatorDailyMissions: CreatorMission[] = [
  {
    title: "Write Your Brand Story",
    identityShift: "You are not starting… you are revealing who you already are.",
    whatMatters: "Clarity comes from simplifying your story, not overthinking it. Your story only needs three parts: where you were, what changed, and where you are going.",
    execution: "I used to __. Then I realized __. Now I'm building __.",
  },
  {
    title: "Teach What You Know",
    identityShift: "You don't need more knowledge… you need to use what you already know.",
    whatMatters: "People don't follow experts… they follow clarity. If you can explain something simply, you already have authority.",
    execution: "Create one post: \"3 things I wish I knew before __.\"",
  },
  {
    title: "Say Something Real",
    identityShift: "Connection beats perfection… every time.",
    whatMatters: "People trust honesty more than polish. Saying what others are afraid to say builds trust fast.",
    execution: "Post: \"The truth is… I used to think __. Now I see __.\"",
  },
  {
    title: "Multiply Your Content",
    identityShift: "You don't need more ideas… you need to reuse your ideas.",
    whatMatters: "One idea can become multiple pieces of content. Smart creators multiply, they don't restart.",
    execution: "Take one past post and rewrite it in a different format.",
  },
  {
    title: "Study What Works",
    identityShift: "You don't guess… you observe.",
    whatMatters: "Success leaves patterns. When something performs well, there is always a reason.",
    execution: "Find 3 posts in your niche and write why they worked.",
  },
  {
    title: "Find Your Voice",
    identityShift: "You are not here to sound like everyone… you are here to sound like you.",
    whatMatters: "Your voice is how you naturally explain things. Not perfect… just real.",
    execution: "Explain something you know in 3 sentences like you're talking to a friend.",
  },
  {
    title: "Review Your Week",
    identityShift: "You are already building momentum.",
    whatMatters: "Growth happens when you reflect, not just when you act.",
    execution: "Answer: What felt easy? What worked? What felt like you?",
  },
];

const weeklyGoalLabels = [
  "Post 3 times this week",
  "Complete today's mission every day",
  "Engage with 20 accounts in your niche",
  "Review your DNA report once this week",
  "Write down one win before the week ends",
];

// Day-of-week activation messages (0 = Sunday … 6 = Saturday)
const dailyActivationMessages: Record<number, string> = {
  0: "A new week begins tomorrow. You already know what to do.",
  1: "See your business running. See the income coming in. That is already yours.",
  2: "You are not building from scratch. You are claiming what was always meant for you.",
  3: "Close your eyes. See the life on the other side of consistency. She is you.",
  4: "Every woman who has what you want once stood exactly where you are.",
  5: "You made it through another week of building. That is not small.",
  6: "Rest is part of building. You are not behind.",
};

// DNA-type affirmations
const dnaAffirmations: Record<string, string> = {
  "Strategic Builder":  "I build systems that create unstoppable momentum.",
  "Visionary Leader":   "I see the future clearly and I lead others toward it.",
  "Influence Creator":  "I attract the right people by being authentically me.",
  "Community Builder":  "I create belonging and turn connection into empire.",
  "Knowledge Authority":"My expertise is my currency and I share it powerfully.",
  "Action Taker":       "I move first. I figure it out as I go.",
  "Freedom Strategist": "I build on my terms. Freedom is my business model.",
  "Legacy Builder":     "Everything I build today becomes what I leave behind.",
};

const journeyPhases = [
  { label: "Foundation", active: true },
  { label: "Momentum", active: false },
  { label: "Visibility", active: false },
  { label: "Empire", active: false },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function WbeLogo({ size = 48 }: { size?: number }) {
  return (
    <img
      src="/wbe-logo.png"
      alt="Women Business Empires"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-white/30 text-xs uppercase tracking-[0.25em] mb-3"
      style={{ fontFamily: "Playfair Display, serif" }}
    >
      {children}
    </p>
  );
}

function Card({ children, className = "", testId }: { children: React.ReactNode; className?: string; testId?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/8 p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.04)" }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [, navigate] = useLocation();

  // auth / meta
  const [userId, setUserId]        = useState<string | null>(null);
  const [firstName, setFirstName]  = useState(getStoredFirstName());
  const [dnaType]                  = useState(getStoredDnaType());
  const [loading, setLoading]      = useState(true);

  // path selection
  const [empirePath, setEmpirePath]     = useState<EmpirePath>(
    () => (localStorage.getItem(EMPIRE_PATH_KEY) as EmpirePath) ?? null,
  );
  const [selectedPath, setSelectedPath] = useState<EmpirePath>(null);

  // activation gate — true only when last_activation_date === today.
  // Shows once per calendar day for ALL users, even returning users.
  const [activated, setActivated] = useState<boolean>(
    () => localStorage.getItem(ACTIVATION_DATE_KEY) === todayStr(),
  );

  // streak and score — Supabase is the ONLY source of truth; start at 0 until DB responds
  const [dayStreak, setDayStreak]   = useState<number>(0);
  const [empireScore, setEmpireScore] = useState<number>(0);

  // mission state — false until DB confirms; submitting guards against double-clicks
  const [missionDone, setMissionDone]           = useState<boolean>(false);
  const [missionSubmitting, setMissionSubmitting] = useState<boolean>(false);
  // Extra mission metadata kept in state so handleMissionComplete needs no extra getUser() call
  const [lastActiveDate, setLastActiveDate]       = useState<string | null>(null);
  const [missionsCompleted, setMissionsCompleted] = useState<string[]>([]);

  // weekly goals — Supabase metadata is source of truth; localStorage is cache only
  const [weeklyGoals, setWeeklyGoals] = useState<boolean[]>(getWeeklyGoals);

  // ── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    // getUser() verifies the JWT against Supabase and returns fresh metadata.
    // This is important so score/streak/missions are never read from a stale cache.
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user || !user.email_confirmed_at) {
        navigate("/signup?redirect=/dashboard");
        return;
      }

      setUserId(user.id);

      // Sync wbe_user so saveUserProgress and other pages can read the id
      try {
        const stored = JSON.parse(localStorage.getItem("wbe_user") ?? "{}");
        localStorage.setItem("wbe_user", JSON.stringify({ ...stored, id: user.id, email: user.email }));
      } catch {
        localStorage.setItem("wbe_user", JSON.stringify({ id: user.id, email: user.email }));
      }

      const m = user.user_metadata ?? {};

      // ── First name ─────────────────────────────────────────────────────────
      const metaName = (m.first_name ?? m.firstName ?? "") as string;
      if (metaName && !firstName) {
        setFirstName(metaName);
        try {
          const u = JSON.parse(localStorage.getItem("wbe_user") ?? "{}");
          localStorage.setItem("wbe_user", JSON.stringify({ ...u, firstName: metaName }));
        } catch {}
      }

      const today = todayStr();

      // ── Empire path ────────────────────────────────────────────────────────
      const metaPath = typeof m.path_type === "string" ? m.path_type : null;
      if (metaPath) {
        localStorage.setItem(EMPIRE_PATH_KEY, metaPath);
        setEmpirePath(metaPath as EmpirePath);
        // Do NOT setActivated(true) here — activation is gated by last_activation_date below
      }

      // ── Score + streak ─────────────────────────────────────────────────────
      const score  = typeof m.empire_score === "number" ? m.empire_score : 0;
      const streak = typeof m.day_streak   === "number" ? m.day_streak   : 0;
      const lad    = typeof m.last_active_date === "string" ? m.last_active_date : null;
      setEmpireScore(score);
      setDayStreak(streak);
      setLastActiveDate(lad);
      localStorage.setItem(EMPIRE_SCORE_KEY, String(score));
      localStorage.setItem(DAY_STREAK_KEY,   String(streak));

      // ── Missions completed list ────────────────────────────────────────────
      const completedDates: string[] = Array.isArray(m.missions_completed)
        ? (m.missions_completed as string[])
        : [];
      setMissionsCompleted(completedDates);
      const completedToday = completedDates.includes(today);
      if (completedToday) {
        setMissionDone(true);
        localStorage.setItem(MISSION_DATE_KEY, today);
        localStorage.setItem(MISSION_DONE_KEY, "true");
      }

      // ── Weekly goals — metadata overrides localStorage ────────────────────
      if (Array.isArray(m.weekly_goals) && (m.weekly_goals as unknown[]).length === 5) {
        const goals = m.weekly_goals as boolean[];
        setWeeklyGoals(goals);
        localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(goals));
      } else {
        // New user or no saved goals — reset so stale localStorage can't bleed through
        const fresh = [false, false, false, false, false];
        setWeeklyGoals(fresh);
        localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(fresh));
      }

      // ── Activation date — keep gate hidden if already activated today ────────
      const metaActivationDate = typeof m.last_activation_date === "string"
        ? m.last_activation_date
        : null;
      if (metaActivationDate === today) {
        setActivated(true);
        localStorage.setItem(ACTIVATION_DATE_KEY, today);
      }

      setLoading(false);
    });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectPath = () => {
    if (!selectedPath) return;
    const today = todayStr();
    localStorage.setItem(EMPIRE_PATH_KEY, selectedPath);
    localStorage.setItem(ACTIVATION_DATE_KEY, today);
    setEmpirePath(selectedPath);
    setActivated(true);
    saveUserProgress({ pathType: selectedPath, onboardingCompleted: true });
    saveOnboardingStep("dashboard", { onboardingComplete: true });
    supabase.auth.updateUser({ data: { last_activation_date: today } }).catch(() => {});
  };

  const handleActivate = () => {
    const today = todayStr();
    localStorage.setItem(ACTIVATION_DATE_KEY, today);
    setActivated(true);
    // Persist to Supabase so the gate stays hidden after logout/login on the same day
    supabase.auth.updateUser({ data: { last_activation_date: today } }).catch(() => {});
  };

  const handleMissionComplete = async () => {
    // Guard: already done, no path, or call already in flight
    if (missionDone || missionSubmitting || !empirePath || !userId) return;

    setMissionSubmitting(true);

    // Optimistic UI
    setMissionDone(true);
    const prevScore  = empireScore;
    const prevStreak = dayStreak;
    setEmpireScore(empireScore + 10);

    const today = todayStr();
    const yday  = yesterdayStr();

    // Compute new streak using state loaded on mount — no extra getUser() call
    const newScore  = prevScore + 10;
    const newStreak =
      lastActiveDate === today ? prevStreak          // already done today (shouldn't reach here)
      : lastActiveDate === yday ? prevStreak + 1     // continued streak
      : 1;                                           // gap or first time

    // Merge today into the completed list (idempotent)
    const newMissions = missionsCompleted.includes(today)
      ? missionsCompleted
      : [...missionsCompleted, today];

    try {
      // ONE updateUser call — Supabase merges the patch, existing keys are preserved
      const { error: saveErr } = await supabase.auth.updateUser({
        data: {
          empire_score:      newScore,
          day_streak:        newStreak,
          last_active_date:  today,
          missions_completed: newMissions,
        },
      });

      if (saveErr) {
        console.error("[Mission] save error:", saveErr);
        setMissionDone(false);
        setEmpireScore(prevScore);
      } else {
        setEmpireScore(newScore);
        setDayStreak(newStreak);
        setLastActiveDate(today);
        setMissionsCompleted(newMissions);
        localStorage.setItem(EMPIRE_SCORE_KEY, String(newScore));
        localStorage.setItem(DAY_STREAK_KEY,   String(newStreak));
        localStorage.setItem(MISSION_DATE_KEY, today);
        localStorage.setItem(MISSION_DONE_KEY, "true");
      }
    } catch (err) {
      console.error("[Mission] Unexpected error:", err);
      setMissionDone(false);
      setEmpireScore(prevScore);
    } finally {
      setMissionSubmitting(false);
    }
  };

  const toggleWeeklyGoal = (idx: number) => {
    const next = weeklyGoals.map((v, i) => (i === idx ? !v : v));
    setWeeklyGoals(next);
    localStorage.setItem(WEEKLY_GOALS_KEY, JSON.stringify(next));
    // Save to Supabase so weekly goals are per-user, not per-device
    supabase.auth.updateUser({ data: { weekly_goals: next } }).catch(() => {});
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Clear ALL WBE localStorage so the next user on this device starts clean
    Object.keys(localStorage)
      .filter((k) => k.startsWith("wbe_"))
      .forEach((k) => localStorage.removeItem(k));
    navigate("/signup");
  };

  // ── Path Selection Screen ─────────────────────────────────────────────────
  if (!loading && !empirePath) {
    return (
      <div className="min-h-screen bg-black px-5 py-10 flex flex-col">
        <div className="max-w-md mx-auto w-full flex flex-col gap-8">
          <div className="flex justify-center">
            <WbeLogo size={56} />
          </div>

          <div className="text-center space-y-3">
            <h1
              className="text-3xl font-bold text-white leading-tight"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Welcome to Your Empire.
            </h1>
            <p className="text-white/55 text-sm leading-relaxed">
              You have done the work. Now choose your Empire Path and let's build.
            </p>
            <p
              className="text-[#D4AF37] text-sm italic"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Your Entrepreneur DNA already revealed who you are. Here is where you belong.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {paths.map((p) => {
              const isSelected = selectedPath === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`card-path-${p.id}`}
                  onClick={() => setSelectedPath(p.id)}
                  className={`text-left rounded-2xl p-5 border transition-all duration-200 bg-gradient-to-br ${p.gradient} ${isSelected ? p.activeBorder : p.border}`}
                  style={{ boxShadow: isSelected ? "0 0 0 1px rgba(212,175,55,0.25)" : "none" }}
                >
                  <div className="space-y-2">
                    <p className="text-[#D4AF37] text-xs font-bold tracking-[0.25em] uppercase">
                      {p.title}
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">{p.description}</p>
                    <p className="text-white/35 text-xs leading-relaxed">{p.dnaTypes}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleSelectPath}
            disabled={!selectedPath}
            data-testid="button-select-path"
            className="w-full py-6 bg-[#D4AF37] text-black font-bold text-sm tracking-widest uppercase disabled:opacity-30"
            style={{ height: "auto" }}
          >
            This Is My Path
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading shell ─────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  const displayName = firstName || "";
  const displayDna  = dnaType  || "Empire Builder";
  const displayPath = empirePath
    ? empirePath.charAt(0).toUpperCase() + empirePath.slice(1) + " Path"
    : "";
  const mission     = empirePath ? missions[empirePath] : null;

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pb-12">
      <div className="max-w-md mx-auto px-5 py-6 flex flex-col gap-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between" data-testid="dashboard-header">
          <WbeLogo size={44} />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white/70 text-xs" data-testid="text-welcome-name">
                {displayName ? (
                  <>Welcome back,{" "}<span className="text-white font-semibold">{displayName}</span></>
                ) : (
                  <>Welcome back</>
                )}
              </p>
              {displayPath && (
                <p className="text-[#D4AF37]/70 text-xs italic" data-testid="text-empire-path">
                  {displayPath}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              data-testid="button-logout"
              title="Log Out"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* ── Empire Activation Gate — shows once per calendar day ── */}
        {!activated && (
          <section
            className="rounded-2xl border border-[#D4AF37]/25"
            style={{ background: "rgba(212,175,55,0.06)" }}
            data-testid="section-activation"
          >
            <div className="p-6 flex flex-col gap-5">
              {/* Label row */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/10 shrink-0">
                  <Crown className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#D4AF37] text-xs font-bold tracking-[0.25em] uppercase">
                    Empire Activation
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Start here. Every single day.
                  </p>
                </div>
              </div>

              {/* Daily message */}
              <p
                className="text-white text-base font-semibold leading-relaxed"
                style={{ fontFamily: "Playfair Display, serif" }}
                data-testid="text-daily-message"
              >
                "{dailyActivationMessages[new Date().getDay()]}"
              </p>

              {/* DNA affirmation */}
              {dnaType && dnaAffirmations[dnaType] && (
                <p
                  className="text-[#D4AF37]/80 text-sm leading-relaxed italic border-l-2 border-[#D4AF37]/30 pl-4"
                  data-testid="text-dna-affirmation"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {dnaAffirmations[dnaType]}
                </p>
              )}

              {/* Activate button */}
              <Button
                onClick={handleActivate}
                data-testid="button-activate"
                className="w-full py-5 bg-[#D4AF37] text-black font-bold text-sm tracking-wide"
                style={{ height: "auto" }}
              >
                I'm Ready. Let's Build.
              </Button>
            </div>
          </section>
        )}

        {/* ── Full dashboard — revealed after activation ── */}
        {activated && (
          <>
            {/* ── Empire Status Bar ── */}
            <section data-testid="section-status">
              <SectionHeading>Empire Status</SectionHeading>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  data-testid="card-empire-score"
                >
                  <Zap className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                    {empireScore}
                  </span>
                  <span className="text-white/35 text-xs leading-tight">Empire Score</span>
                </div>

                <div
                  className="rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  data-testid="card-day-streak"
                >
                  <Flame className="w-5 h-5 text-[#E8A0BF]" strokeWidth={1.5} />
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                    {dayStreak}
                  </span>
                  <span className="text-white/35 text-xs leading-tight">Day Streak</span>
                </div>

                <div
                  className="rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  data-testid="card-current-phase"
                >
                  <Target className="w-5 h-5 text-white/50" strokeWidth={1.5} />
                  <span className="text-sm font-bold text-white leading-tight" style={{ fontFamily: "Playfair Display, serif" }}>
                    Foundation
                  </span>
                  <span className="text-white/35 text-xs leading-tight">Current Phase</span>
                </div>
              </div>
            </section>

            {/* ── Empire Path Badge ── */}
            {empirePath && (
              <div
                className="rounded-xl border border-[#D4AF37]/15 px-5 py-4 flex items-center gap-3"
                style={{ background: "rgba(212,175,55,0.05)" }}
                data-testid="section-empire-path"
              >
                <Crown className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Your Path</p>
                  <p className="text-[#D4AF37] text-sm font-semibold">
                    The {empirePath.charAt(0).toUpperCase() + empirePath.slice(1)}
                  </p>
                </div>
              </div>
            )}

            {/* ── 1. Today's Mission ── */}
            {mission && (
              <section data-testid="section-mission">
                <SectionHeading>Today's Mission</SectionHeading>
                <Card testId="card-mission">
                  {empirePath === "creator" ? (() => {
                    // Creator path: enhanced 3-layer coaching card, rotating by day of week
                    const dayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
                    const cm = creatorDailyMissions[dayIdx];
                    return (
                      <div className="flex flex-col gap-4">
                        {/* Title */}
                        <p className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">
                          {cm.title}
                        </p>

                        {/* Layer 1 — Identity Shift */}
                        <p
                          className="text-white text-sm font-bold leading-snug"
                          style={{ fontFamily: "Playfair Display, serif" }}
                          data-testid="text-identity-shift"
                        >
                          "{cm.identityShift}"
                        </p>

                        {/* Layer 2 — What Actually Matters */}
                        <div className="border-l-2 border-white/10 pl-3">
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#A0A0A0" }}>
                            What Actually Matters
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "#A0A0A0" }} data-testid="text-what-matters">
                            {cm.whatMatters}
                          </p>
                        </div>

                        {/* Layer 3 — Execution */}
                        <div className="rounded-xl px-4 py-3 border border-[#D4AF37]/20" style={{ background: "rgba(212,175,55,0.05)" }}>
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#D4AF37]/60 mb-1">
                            Your Move Today
                          </p>
                          <p className="text-white/80 text-sm leading-relaxed font-medium" data-testid="text-execution">
                            {cm.execution}
                          </p>
                        </div>

                        {/* Mark Complete button — unchanged behavior */}
                        <Button
                          onClick={handleMissionComplete}
                          disabled={missionDone || missionSubmitting}
                          data-testid="button-mission-complete"
                          className={`w-full py-5 font-bold text-sm tracking-wide ${
                            missionDone
                              ? "bg-white/8 text-white/40 cursor-default"
                              : "bg-[#D4AF37] text-black"
                          }`}
                          style={{ height: "auto" }}
                        >
                          {missionDone ? (
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                              Completed Today
                            </span>
                          ) : missionSubmitting ? (
                            "Saving..."
                          ) : (
                            "Mark Complete"
                          )}
                        </Button>

                        {missionDone && (
                          <p
                            className="text-center text-[#D4AF37]/80 text-xs leading-relaxed italic"
                            data-testid="text-mission-completion-message"
                            style={{ fontFamily: "Playfair Display, serif" }}
                          >
                            That's how empires are built. Come back tomorrow for your next move.
                          </p>
                        )}
                      </div>
                    );
                  })() : (
                    /* Builder / Connector: existing simple card */
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <p className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase">
                          {mission.title}
                        </p>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {mission.description}
                        </p>
                      </div>
                      <Button
                        onClick={handleMissionComplete}
                        disabled={missionDone || missionSubmitting}
                        data-testid="button-mission-complete"
                        className={`w-full py-5 font-bold text-sm tracking-wide ${
                          missionDone
                            ? "bg-white/8 text-white/40 cursor-default"
                            : "bg-[#D4AF37] text-black"
                        }`}
                        style={{ height: "auto" }}
                      >
                        {missionDone ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                            Completed Today
                          </span>
                        ) : missionSubmitting ? (
                          "Saving..."
                        ) : (
                          "Mark Complete"
                        )}
                      </Button>

                      {missionDone && (
                        <p
                          className="text-center text-[#D4AF37]/80 text-xs leading-relaxed italic"
                          data-testid="text-mission-completion-message"
                          style={{ fontFamily: "Playfair Display, serif" }}
                        >
                          That's how empires are built. Come back tomorrow for your next move.
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </section>
            )}

            {/* ── 2. Weekly Empire Goals ── */}
            <section data-testid="section-weekly-goals">
              <SectionHeading>Your Weekly Empire Goals</SectionHeading>
              <Card>
                <div className="flex flex-col gap-4">
                  {/* Context lines */}
                  <div className="space-y-0.5 pb-1 border-b border-white/6">
                    <p className="text-xs font-semibold" style={{ color: "#A0A0A0" }}>
                      This week, your focus is simple…
                    </p>
                    <p className="text-xs" style={{ color: "#A0A0A0" }}>
                      Each check is proof you are building your empire.
                    </p>
                  </div>

                  {weeklyGoalLabels.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleWeeklyGoal(idx)}
                      data-testid={`goal-${idx}`}
                      className="flex items-center gap-3 text-left w-full cursor-pointer"
                    >
                      {weeklyGoals[idx] ? (
                        <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                      ) : (
                        <Circle className="w-5 h-5 text-white/20 shrink-0" strokeWidth={1.5} />
                      )}
                      <span
                        className={`text-sm leading-snug transition-colors ${
                          weeklyGoals[idx] ? "line-through" : ""
                        }`}
                        style={{ color: weeklyGoals[idx] ? "#555" : "#A0A0A0" }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            </section>

            {/* ── 3. Empire Mindset ── */}
            <section data-testid="section-mindset">
              <SectionHeading>Empire Mindset</SectionHeading>
              <div
                className="rounded-2xl border border-[#D4AF37]/15 px-6 py-6 text-center"
                style={{ background: "rgba(212,175,55,0.04)" }}
              >
                <p
                  className="text-white text-lg font-bold leading-relaxed italic"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  "It's already mine. I just need to go claim it."
                </p>
              </div>
            </section>

            {/* ── 4. Empire Journey Map ── */}
            <section data-testid="section-journey-map">
              <SectionHeading>Empire Journey Map</SectionHeading>
              <div className="grid grid-cols-4 gap-2">
                {journeyPhases.map((phase, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl py-4 px-2 flex flex-col items-center gap-2 text-center border transition-all ${
                      phase.active ? "border-[#D4AF37]/40" : "border-white/8"
                    }`}
                    style={{
                      background: phase.active
                        ? "rgba(212,175,55,0.08)"
                        : "rgba(255,255,255,0.03)",
                    }}
                    data-testid={`phase-${phase.label.toLowerCase()}`}
                  >
                    {phase.active ? (
                      <Zap className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                    ) : (
                      <Lock className="w-4 h-4 text-white/20" strokeWidth={1.5} />
                    )}
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        phase.active ? "text-[#D4AF37]" : "text-white/25"
                      }`}
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      {phase.label}
                    </span>
                    <span
                      className={`text-[10px] leading-tight ${
                        phase.active ? "text-[#D4AF37]/60" : "text-white/20"
                      }`}
                    >
                      {phase.active ? "Active" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5. DNA Report Access ── */}
            <section data-testid="section-dna-report">
              <SectionHeading>Your Entrepreneur DNA</SectionHeading>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/8 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white text-sm font-semibold"
                      style={{ fontFamily: "Playfair Display, serif" }}
                    >
                      Your Entrepreneur DNA
                    </p>
                    {displayDna && displayDna !== "Empire Builder" && (
                      <p className="text-[#D4AF37]/70 text-xs mt-0.5">{displayDna}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/dna-report")}
                    data-testid="button-view-dna-report"
                    className="flex items-center gap-1 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors shrink-0"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            </section>

            {/* ── 6. Empire Mastermind Gateway ── */}
            <section data-testid="section-mastermind">
              <SectionHeading>Empire Community</SectionHeading>
              <div
                className="rounded-2xl border border-white/8 p-5 opacity-60"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-white/35" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p
                        className="text-white/60 text-sm font-semibold"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Empire Mastermind
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Lock className="w-3 h-3 text-white/30" strokeWidth={2} />
                        <span className="text-white/30 text-xs">Locked</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/35 text-sm leading-relaxed">
                    Complete your Foundation and Momentum phases to unlock the mastermind community.
                  </p>
                  <button
                    type="button"
                    disabled
                    data-testid="button-mastermind-locked"
                    className="w-full py-3.5 rounded-xl border border-white/12 text-white/25 text-sm font-semibold cursor-not-allowed"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    Unlocks at Day 60
                  </button>
                </div>
              </div>
            </section>

            {/* ── 7. Founding Membership CTA ── */}
            <section data-testid="section-founding-membership">
              <div
                className="rounded-2xl border border-[#D4AF37]/20 p-5"
                style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(232,160,191,0.04) 100%)" }}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p
                        className="text-white text-sm font-semibold"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Founding Membership
                      </p>
                      <p className="text-[#D4AF37]/60 text-xs mt-0.5">Limited spots available</p>
                    </div>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Get founding access to the full Empire Journey — live sessions, DNA-matched systems, and the private community.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open("https://start.womenbusinessempires.com/wbe-founding-membership", "_blank", "noopener,noreferrer")}
                    data-testid="button-apply-founding-membership-dashboard"
                    className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide text-black transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #D4AF37 0%, #E8A0BF 100%)" }}
                  >
                    Apply for Founding Membership
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
