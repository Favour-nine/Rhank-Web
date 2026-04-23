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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "confirm">("idle");
  const [error, setError] = useState("");

  const redirectTo = params.get("next") ?? "/rhanks";

  useEffect(() => {
    if (!loading && user) router.replace(redirectTo);
  }, [user, loading, redirectTo, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdprConsent) { setError("You must agree to the privacy policy to create an account."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setStatus("loading");
    setError("");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    });

    if (error) { setError(error.message); setStatus("error"); return; }
    setStatus("confirm");
  };

  if (status === "confirm") {
    return (
      <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
        <ThreeBg />
        <AppNav />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <p className="text-5xl mb-4">✉️</p>
          <h1 className={`${bebas.className} text-5xl md:text-6xl leading-none mb-4`}>Check your email.</h1>
          <p className="text-white/60 max-w-sm">
            We sent a confirmation link to <span className="text-white font-semibold">{form.email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
          >
            Go to sign in →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-md px-6 pt-20 pb-24 md:pt-32">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Create account</p>
        <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-10`}>Sign up.</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Your name">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jerome"
              className={inputCls}
            />
          </Field>

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

          <Field label="Password">
            <input
              required
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min. 8 characters"
              className={inputCls}
            />
          </Field>

          {/* GDPR consent */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#ffe600]"
            />
            <span className="text-[11px] tracking-[0.12em] text-white/50 leading-relaxed">
              I agree to the processing of my personal data (name, email, leaderboard activity) as described in the{" "}
              <a href="/privacy" className="underline text-white/70 hover:text-white transition-colors">privacy policy</a>.
            </span>
          </label>

          {error && <p className="text-sm text-yellow-300">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p className="mt-8 text-sm text-white/40 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline hover:text-white/80 transition-colors">
            Sign in
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
