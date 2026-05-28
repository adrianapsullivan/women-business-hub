import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Crown, Mail } from "lucide-react";
import { createUserProgressRecord, syncUserToDatabase } from "@/lib/progress";
import { loadOnboardingProgress, resolveOnboardingRoute } from "@/lib/onboarding";

const formSchema = z.object({
  firstName: z.string().optional().default(""),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get("mode") === "signin" ? "signin" : "signup";
  const redirectTarget = params.get("redirect") || "/report";

  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [authError, setAuthError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const submittingRef = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", email: "", password: "" },
  });

  /**
   * Cross-device safe routing after any confirmed login.
   *
   * Uses DB-verified hasQuizResult (from syncUserToDatabase) combined with
   * localStorage fallback, then loads onboarding progress from the database.
   * This means a user who confirmed on phone and logs in on a new laptop will
   * be routed correctly even when localStorage is completely empty.
   */
  const routeAuthenticatedUser = async (
    user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
    syncedHasQuizResult?: boolean,
  ) => {
    localStorage.setItem("wbe_user", JSON.stringify({ id: user.id, email: user.email }));

    // If the caller already ran syncUserToDatabase, accept its result.
    // Otherwise run it now (e.g. from the useEffect fast-path).
    let hasQuizResult = syncedHasQuizResult ?? false;
    if (syncedHasQuizResult === undefined) {
      const result = await syncUserToDatabase(user);
      hasQuizResult = result.hasQuizResult;
    }

    // Combine DB result with localStorage (same-device backup)
    hasQuizResult = hasQuizResult || !!localStorage.getItem("wbe_result");

    // Load onboarding progress from DB — cross-device
    const onboardingProgress = await loadOnboardingProgress(user.id);

    // Pass redirectTarget as the fallback so ?redirect=/report is honoured
    // when the DB has no saved progress yet (e.g. first login on a new device
    // or while onboarding saves are failing).
    setLocation(resolveOnboardingRoute(onboardingProgress, hasQuizResult, redirectTarget));
  };

  // If user is already authenticated and confirmed on load, route them
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user && user.email_confirmed_at) {
        // syncUserToDatabase is called inside routeAuthenticatedUser when
        // syncedHasQuizResult is not provided.
        await routeAuthenticatedUser(user);
      }
    });
  }, []);

  const goBack = () => setLocation(redirectTarget);

  const switchMode = () => {
    setAuthError("");
    setShowForgot(false);
    setForgotSent(false);
    form.clearErrors();
    const newMode = mode === "signup" ? "signin" : "signup";
    setMode(newMode);
    setLocation(`/signup?mode=${newMode}&redirect=${encodeURIComponent(redirectTarget)}`);
  };

  // ── Forgot password ──
  const handleForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      setAuthError("Please enter your email address first.");
      return;
    }
    setIsPending(true);
    setAuthError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsPending(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setForgotEmail(email);
      setForgotSent(true);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setAuthError("");
    setIsPending(true);

    try {
      // ── SIGN IN ──
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          setAuthError(error.message);
          return;
        }

        const user = data?.user;
        if (!user) {
          setAuthError("Sign in failed. Please try again.");
          return;
        }

        if (!user.email_confirmed_at) {
          setConfirmedEmail(values.email);
          return;
        }

        // Sync to DB first, capture whether a quiz result exists in the DB.
        // This is the cross-device fix: on a new device localStorage is empty
        // but the DB has the quiz result — syncUserToDatabase returns that fact.
        const { hasQuizResult: dbHasQuizResult } = await syncUserToDatabase(user);
        await routeAuthenticatedUser(user, dbHasQuizResult);
        return;
      }

      // ── SIGN UP ──
      if (!values.firstName?.trim()) {
        form.setError("firstName", { message: "Please enter your first name" });
        return;
      }

      // Read DNA type from localStorage if available (set during quiz)
      let dnaType = "";
      try {
        const result = JSON.parse(localStorage.getItem("wbe_result") || "{}");
        dnaType = result.dnaType || "";
      } catch {
        // ignore
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName.trim(),
            // Store dna_type in auth metadata so it is available on ANY device
            // when the user signs in later (even with empty localStorage).
            ...(dnaType ? { dna_type: dnaType } : {}),
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("already") ||
          error.message.toLowerCase().includes("registered") ||
          (error as { status?: number }).status === 400
        ) {
          // Auto-switch to sign-in mode with the email pre-filled
          form.setValue("email", values.email);
          form.setValue("password", "");
          setMode("signin");
          setLocation(`/signup?mode=signin&redirect=${encodeURIComponent(redirectTarget)}`);
          setAuthError("An account with this email already exists. Sign in below.");
        } else {
          setAuthError(error.message);
        }
        return;
      }

      // identities array is empty → existing confirmed user
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        form.setValue("email", values.email);
        form.setValue("password", "");
        setMode("signin");
        setLocation(`/signup?mode=signin&redirect=${encodeURIComponent(redirectTarget)}`);
        setAuthError("An account with this email already exists. Sign in below.");
        return;
      }

      setConfirmedEmail(values.email);

      if (data?.user?.id) {
        localStorage.setItem(
          "wbe_user",
          JSON.stringify({ id: data.user.id, email: data.user.email })
        );
        await createUserProgressRecord(data.user.id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setAuthError(message);
    } finally {
      setIsPending(false);
      submittingRef.current = false;
    }
  };

  // ── Forgot password sent screen ──
  if (forgotSent) {
    return (
      <div className="min-h-screen bg-black flex flex-col px-6 py-10 relative">
        <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full justify-center">
          <div className="space-y-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "#D4AF3718", border: "1px solid #D4AF3735" }}
            >
              <Mail className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <div className="space-y-4">
              <h1
                className="text-2xl font-bold text-white leading-snug"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Check Your Email
              </h1>
              <p className="text-white/70 text-sm leading-relaxed">
                We sent a password reset link to{" "}
                <span className="text-white/85 font-medium">{forgotEmail}</span>.
              </p>
              <p className="text-white/40 text-xs leading-relaxed">
                Didn't receive it? Check spam or wait a few seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForgotSent(false);
                setShowForgot(false);
              }}
              className="text-white/40 text-xs underline cursor-pointer block mx-auto"
              data-testid="link-back-to-signin"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Email confirmation waiting screen (after signup) ──
  if (confirmedEmail) {
    return (
      <div className="min-h-screen bg-black flex flex-col px-6 py-10 relative">
        <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full justify-center">
          <div className="space-y-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "#D4AF3718", border: "1px solid #D4AF3735" }}
            >
              <Mail className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
            </div>

            <div className="space-y-4">
              <h1
                className="text-2xl font-bold text-white leading-snug"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                {mode === "signup"
                  ? "Confirm Your Email"
                  : "Check Your Email to Unlock Your Full Results"}
              </h1>
              <p className="text-white/70 text-sm leading-relaxed">
                {mode === "signup"
                  ? "Check your email to confirm your access. Then return here to sign in."
                  : "Check your email to confirm your access. If you already created an account, use Sign In instead."}
              </p>
              <p className="text-white/40 text-xs leading-relaxed">
                Sent to{" "}
                <span className="text-white/60 font-medium">{confirmedEmail}</span>.
                Didn't receive it? Check spam or wait a few seconds.
              </p>
            </div>

            <div
              className="rounded-xl p-5 space-y-3 text-center"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-white/40 text-xs leading-relaxed">
                This protects your results and keeps your experience private.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmedEmail("");
                setMode("signin");
                setLocation(`/signup?mode=signin&redirect=${encodeURIComponent(redirectTarget)}`);
              }}
              className="text-white/40 text-xs underline cursor-pointer block mx-auto"
              data-testid="link-already-have-account"
            >
              Already confirmed? Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign-up / Sign-in form ──
  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-10 relative">
      <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
          <button
            type="button"
            onClick={goBack}
            className="text-white/40 text-sm cursor-pointer"
          >
            ←
          </button>
          <span className="text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase">
            {mode === "signup" ? "Create Account" : "Sign In"}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/5">
              <Crown className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {mode === "signup" ? "Begin Your Journey" : "Welcome Back"}
            </h1>
            {mode === "signup" && (
              <p className="text-white/40 text-sm text-center leading-relaxed">
                Create your free account to unlock your full DNA profile.
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === "signup" && (
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-widest">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Your first name"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60 text-xs uppercase tracking-widest">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/60 text-xs uppercase tracking-widest">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Min. 6 characters"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {authError && (
                <div className="space-y-2 text-center">
                  <p
                    className="text-[#E8A0BF] text-xs leading-relaxed"
                    data-testid="error-auth"
                  >
                    {mode === "signin"
                      ? "We couldn't sign you in. Check your email and password, or reset your password below."
                      : authError}
                  </p>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-white/40 text-xs underline cursor-pointer"
                      data-testid="link-new-here"
                    >
                      New here? Create your account
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-auth"
                className="w-full bg-[#D4AF37] text-black font-semibold py-6"
                style={{ height: "auto" }}
              >
                {isPending
                  ? mode === "signup" ? "Creating Account…" : "Signing In…"
                  : mode === "signup" ? "Create Account" : "Sign In"}
              </Button>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isPending}
                  data-testid="link-forgot-password"
                  className="w-full text-white/35 text-xs text-center cursor-pointer hover:text-white/55 transition-colors pt-1"
                >
                  Forgot your password?
                </button>
              )}
            </form>
          </Form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-white/40 text-xs underline cursor-pointer"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New here? Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
