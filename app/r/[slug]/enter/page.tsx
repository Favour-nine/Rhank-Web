"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function EnterRhankPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ participant_name: "", value: "", proof_url: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  // Pre-fill name if signed in
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.name || user.email?.split("@")[0] || "";
      setForm((f) => ({ ...f, participant_name: name }));
    }
  }, [user]);

  useEffect(() => {
    supabase
      .from("rhanks")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setRhank(data as Rhank); }
        setLoading(false);
      });
  }, [slug]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`/api/rhanks/${slug}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setStatus("error"); return; }
      router.push(`/r/${slug}`);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (loading) return (
    <Shell>
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40"
            style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </Shell>
  );

  if (notFound) return (
    <Shell>
      <p className={`${bebas.className} text-5xl text-white/30 mb-4`}>Rhank not found.</p>
      <Link href="/rhanks/new" className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors">
        Create one →
      </Link>
    </Shell>
  );

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-lg px-6 pt-16 pb-24 md:pt-24">

        {/* Back link */}
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-white/35 hover:text-white/60 transition-colors mb-10"
        >
          ← {rhank!.title}
        </Link>

        {/* Header */}
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-2`}>
          Submit<br />entry.
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {rhank!.direction === "high" ? "Higher" : "Lower"} {rhank!.unit} ranks higher on this board.
        </p>

        {/* Sign-in credit prompt */}
        {!user && (
          <div className="mb-8 flex items-center justify-between gap-4 border-l-2 border-[#ffe600] pl-4 py-1">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/70">Want credit?</p>
              <p className="text-[11px] text-white/40 mt-0.5">Sign in to link this to your account</p>
            </div>
            <Link
              href={`/login?next=/r/${slug}/enter`}
              className="shrink-0 bg-[#ffe600] px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Signed-in badge */}
        {user && (
          <div className="mb-8 flex items-center gap-2 text-[11px] text-white/40 tracking-[0.15em] uppercase">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Submitting as <span className="text-white/70 font-semibold">{user.user_metadata?.name || user.email?.split("@")[0]}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Your name" hint="How you'll appear on the leaderboard">
            <input
              required
              value={form.participant_name}
              onChange={(e) => set("participant_name", e.target.value)}
              placeholder="Your name"
              className={inputCls}
            />
          </Field>

          <Field label={`Your ${rhank!.unit}`} hint={`Enter your score in ${rhank!.unit}`}>
            <div className="relative">
              <input
                required
                type="number"
                step="any"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="0"
                className={`${inputCls} pr-16`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-white/30 tracking-widest uppercase pointer-events-none">
                {rhank!.unit}
              </span>
            </div>
          </Field>

          <Field label="Proof" hint="Optional — link to video, photo, or screenshot">
            <input
              type="url"
              value={form.proof_url}
              onChange={(e) => set("proof_url", e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          {error && (
            <p className="text-sm text-[#ffe600] border border-[#ffe600]/30 bg-[#ffe600]/10 px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-[#ffe600] px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors mt-2"
          >
            {status === "submitting" ? "Submitting…" : "Submit entry →"}
          </button>
        </form>
      </section>
    </main>
  );
}

const inputCls =
  "w-full border border-white/15 bg-white/8 backdrop-blur px-4 py-3.5 text-white placeholder:text-white/25 outline-none focus:border-white/50 transition-colors text-sm";

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/50 mb-1 block">{label}</label>
      <p className="text-[11px] text-white/30 mb-2">{hint}</p>
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">{children}</div>
    </main>
  );
}
