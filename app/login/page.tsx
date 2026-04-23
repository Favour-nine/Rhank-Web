"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [view, setView] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [resetError, setResetError] = useState("");

  const redirectTo = params.get("next") ?? "/rhanks";

  useEffect(() => {
    if (!loading && user) router.replace(redirectTo);
  }, [user, loading, redirectTo, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) { setError(error.message); setStatus("error"); return; }

    if (rememberMe) {
      localStorage.setItem("rhank_session_type", "persistent");
      sessionStorage.removeItem("rhank_session_active");
    } else {
      localStorage.setItem("rhank_session_type", "session");
      sessionStorage.setItem("rhank_session_active", "1");
    }

    router.replace(redirectTo);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("loading");
    setResetError("");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setResetError(error.message); setResetStatus("error"); return; }
    setResetStatus("sent");
  };

  if (view === "reset") {
    return (
      <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
        <ThreeBg />
        <AppNav />
        <section className="mx-auto max-w-md px-6 pt-20 pb-24 md:pt-32">
          <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Password reset</p>
          <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-4`}>Forgot?</h1>
          <p className="text-white/40 text-sm mb-10">Enter your email and we'll send you a reset link.</p>

          {resetStatus === "sent" ? (
            <div className="border border-white/20 bg-white/5 px-5 py-6 text-center">
              <p className="text-sm text-white/80 mb-1">Check your inbox.</p>
              <p className="text-[11px] text-white/40">A reset link was sent to <span className="text-white/70">{resetEmail}</span></p>
              <button onClick={() => setView("login")} className="mt-6 text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white underline transition-colors">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <Field label="Email">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </Field>

              {resetError && <p className="text-sm text-yellow-300">{resetError}</p>}

              <button
                type="submit"
                disabled={resetStatus === "loading"}
                className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
              >
                {resetStatus === "loading" ? "Sending…" : "Send reset link →"}
              </button>

              <button type="button" onClick={() => setView("login")} className="w-full text-center text-[11px] tracking-[0.18em] uppercase text-white/30 hover:text-white/60 transition-colors">
                Back to sign in
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-md px-6 pt-20 pb-24 md:pt-32">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Welcome back</p>
        <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-10`}>Sign in.</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Email">
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Password</label>
              <button
                type="button"
                onClick={() => { setResetEmail(form.email); setView("reset"); }}
                className="text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-[#ffe600]"
            />
            <span className="text-[11px] tracking-[0.15em] uppercase text-white/50">Remember me</span>
          </label>

          {error && <p className="text-sm text-yellow-300">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="mt-8 text-sm text-white/40 text-center">
          No account?{" "}
          <Link href={`/signup${redirectTo !== "/rhanks" ? `?next=${redirectTo}` : ""}`} className="text-white underline hover:text-white/80 transition-colors">
            Sign up free
          </Link>
        </p>
      </section>
    </main>
  );
}

const inputCls =
  "w-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60 mb-2 block">{label}</label>
      {children}
    </div>
  );
}
