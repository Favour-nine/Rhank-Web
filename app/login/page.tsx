"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const redirectTo = params.get("next") ?? "/rhanks";

  // Already signed in → redirect
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
    router.replace(redirectTo);
  };

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

          <Field label="Password">
            <input
              required
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </Field>

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
