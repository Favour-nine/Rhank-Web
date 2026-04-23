"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase fires an onAuthStateChange with event PASSWORD_RECOVERY
    // when the user lands here via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStatus("loading");
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setStatus("error"); return; }
    setStatus("done");
    setTimeout(() => router.replace("/rhanks"), 2000);
  };

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-md px-6 pt-20 pb-24 md:pt-32">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Account</p>
        <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-10`}>New password.</h1>

        {status === "done" ? (
          <div className="border border-white/20 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm text-white/80 mb-1">Password updated.</p>
            <p className="text-[11px] text-white/40">Redirecting you now…</p>
          </div>
        ) : !ready ? (
          <div className="border border-white/10 bg-white/5 px-5 py-6">
            <p className="text-sm text-white/50">Waiting for reset link verification…</p>
            <p className="text-[11px] text-white/30 mt-2">Make sure you opened this page from the link in your email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60 mb-2 block">New password</label>
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60 mb-2 block">Confirm password</label>
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            {error && <p className="text-sm text-yellow-300">{error}</p>}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {status === "loading" ? "Saving…" : "Set new password →"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const inputCls =
  "w-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors";
