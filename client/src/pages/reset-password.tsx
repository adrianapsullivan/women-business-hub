import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
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
import { CheckCircle2, Lock } from "lucide-react";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // Supabase sends the recovery token via URL hash — getSession picks it up automatically
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Poll briefly for the session to resolve after hash parsing
        const t = setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setSessionReady(true);
          } else {
            setError("This reset link has expired or is invalid. Please request a new one.");
          }
        }, 1200);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });
    setIsPending(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
    }
  };

  // ── Success screen ──
  if (done) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#D4AF3718", border: "1px solid #D4AF3735" }}
            >
              <CheckCircle2 className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h1
              className="text-2xl font-bold text-white leading-snug"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Password Updated
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <Button
            onClick={() => navigate("/signup?mode=signin")}
            data-testid="button-go-to-signin"
            className="w-full font-semibold text-base py-6 rounded-md text-black"
            style={{
              height: "auto",
              background: "linear-gradient(135deg, #D4AF37 0%, #E8A0BF 100%)",
              border: "none",
            }}
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-10">
      <div className="relative z-10 flex-1 flex flex-col max-w-sm mx-auto w-full">

        <div className="flex items-center gap-3 mb-8">
          <img src="/wbe-logo.png" alt="Women Business Empires" className="w-9 h-9 object-contain" />
          <span className="text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase">
            Reset Password
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/5">
              <Lock className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Set New Password
            </h1>
            <p className="text-white/40 text-sm text-center leading-relaxed">
              Enter and confirm your new password below.
            </p>
          </div>

          {error && !sessionReady ? (
            <div className="space-y-6 text-center">
              <p className="text-[#E8A0BF] text-sm leading-relaxed" data-testid="error-reset">
                {error}
              </p>
              <button
                type="button"
                onClick={() => navigate("/signup?mode=signin")}
                className="text-white/40 text-xs underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-widest">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Min. 6 characters"
                          data-testid="input-new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs uppercase tracking-widest">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Repeat your password"
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && sessionReady && (
                  <p className="text-[#E8A0BF] text-xs text-center leading-relaxed" data-testid="error-reset">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isPending || !sessionReady}
                  data-testid="button-update-password"
                  className="w-full bg-[#D4AF37] text-black font-semibold py-6"
                  style={{ height: "auto" }}
                >
                  {isPending ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
