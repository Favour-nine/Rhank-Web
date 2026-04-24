"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function EditRhankPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [form, setForm] = useState({ title: "", description: "", unit: "", direction: "high", join_mode: "open" });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "deleting">("idle");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=/r/${slug}/edit`);
  }, [user, authLoading, router, slug]);

  useEffect(() => {
    supabase.from("rhanks").select("*").eq("slug", slug).single().then(({ data }) => {
      if (!data) { router.replace("/my-rhanks"); return; }
      setRhank(data as Rhank);
      setForm({
        title: data.title,
        description: data.description ?? "",
        unit: data.unit ?? "",
        direction: data.direction,
        join_mode: data.join_mode,
      });
    });
  }, [slug, router]);

  useEffect(() => {
    if (rhank && user && rhank.user_id !== user.id) router.replace(`/r/${slug}`);
  }, [rhank, user, slug, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    const res = await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ edit: true, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setStatus("error"); return; }
    router.push(`/r/${slug}`);
  };

  const handleDelete = async () => {
    setStatus("deleting");
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    await fetch(`/api/rhanks/${slug}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    router.replace("/my-rhanks");
  };

  if (!rhank) return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg /><AppNav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1.5">
          {[0,1,2].map((i) => <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
        </div>
      </div>
    </main>
  );

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Edit Rhank</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>
          Edit<br />Leaderboard.
        </h1>

        <form onSubmit={handleSave} className="space-y-6">
          <Field label="Rhank title">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label={rhank.type === "token" ? "Token name" : "Unit"}>
            <input
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder={rhank.type === "token" ? "tokens, stars, points..." : "seconds, kg, reps..."}
              className={inputCls}
            />
          </Field>

          {rhank.type === "score" && (
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Who wins?</label>
              <p className="text-[11px] text-white/35 mb-3">Pick which end of the scale wins</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "high", icon: "↑", title: "Highest wins" },
                  { value: "low", icon: "↓", title: "Lowest wins" },
                ] as const).map((opt) => (
                  <button key={opt.value} type="button" onClick={() => set("direction", opt.value)}
                    className={`flex items-center gap-3 border py-4 px-4 transition-all ${form.direction === opt.value ? "border-white bg-white text-[#1a5fff]" : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"}`}>
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs font-bold tracking-[0.18em] uppercase">{opt.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Who can join?</label>
            <p className="text-[11px] text-white/35 mb-3">Control how members get on the board</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "open", icon: "🌐", title: "Open" },
                { value: "request", icon: "✋", title: "Request" },
                { value: "invite", icon: "🔒", title: "Invite only" },
              ] as const).map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("join_mode", opt.value)}
                  className={`flex flex-col items-start gap-1.5 border p-3 text-left transition-all ${form.join_mode === opt.value ? "border-white bg-white text-[#1a5fff]" : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"}`}>
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase">{opt.title}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-[#ffe600] border border-[#ffe600]/30 bg-[#ffe600]/10 px-4 py-3">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 bg-[#ffe600] px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
            >
              {status === "loading" ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/r/${slug}`)}
              className="border border-white/25 px-5 py-4 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Delete zone */}
        <div className="mt-12 border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-red-400/70 mb-1">Danger zone</p>
          <p className="text-[11px] text-white/30 mb-4">Deleting this Rhank removes all members, entries, and token history permanently.</p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-[11px] tracking-[0.18em] uppercase text-red-400 border border-red-400/30 px-5 py-2.5 hover:bg-red-500/10 transition-colors"
            >
              Delete this Rhank
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-white/70">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={status === "deleting"}
                  className="bg-red-500 px-6 py-2.5 text-sm font-bold tracking-[0.18em] uppercase text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {status === "deleting" ? "Deleting..." : "Yes, delete it"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const inputCls = "w-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60 mb-2 block">{label}</label>
      {children}
    </div>
  );
}
