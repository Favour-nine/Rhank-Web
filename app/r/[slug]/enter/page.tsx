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
      router.push(`/r/${slug}?entered=1`);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (loading) return <Shell><p className="text-white/40 text-lg">Loading…</p></Shell>;
  if (notFound) return (
    <Shell>
      <p className={`${bebas.className} text-5xl text-white/40`}>Rhank not found.</p>
      <Link href="/rhanks/new" className="mt-6 inline-block border border-white/25 px-5 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors">
        Create one →
      </Link>
    </Shell>
  );

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-xl px-6 pt-20 pb-24 md:pt-32">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          ← Back to leaderboard
        </Link>

        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-2">
          {rhank!.title}
        </p>
        <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-6`}>
          Submit<br />your entry.
        </h1>

        {/* Sign-in credit prompt — only show if not signed in */}
        {!user && (
          <div className="mb-8 border border-white/15 bg-white/5 px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Earn credit for this entry</p>
              <p className="text-[11px] text-white/35 mt-0.5">Sign in to link this submission to your account</p>
            </div>
            <Link
              href={`/login?next=/r/${slug}/enter`}
              className="shrink-0 border border-white/25 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white hover:bg-white hover:text-[#1a5fff] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Your name" hint="How you'll appear on the leaderboard">
            <input
              required
              value={form.participant_name}
              onChange={(e) => set("participant_name", e.target.value)}
              placeholder="Jerome"
              className={inputCls}
            />
          </Field>

          <Field label={rhank!.unit} hint={`${rhank!.direction === "high" ? "Higher" : "Lower"} is better`}>
            <input
              required
              type="number"
              step="any"
              value={form.value}
              onChange={(e) => set("value", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>

          <Field label="Proof URL" hint="Optional — link to video, photo, or screenshot">
            <input
              type="url"
              value={form.proof_url}
              onChange={(e) => set("proof_url", e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </Field>

          {error && <p className="text-sm text-yellow-300">{error}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? "Submitting…" : "Submit entry →"}
          </button>
        </form>
      </section>
    </main>
  );
}

const inputCls =
  "w-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors";

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">{label}</label>
      <p className="text-[11px] text-white/35 mb-2">{hint}</p>
      {children}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh]">{children}</div>
    </main>
  );
}
