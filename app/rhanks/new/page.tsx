"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type Location = { latitude: number; longitude: number; location_name: string } | null;

export default function NewRhankPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/rhanks/new");
  }, [user, authLoading, router]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    unit: "",
    direction: "high",
    creator_name: "",
    type: "score",
    join_mode: "open",
  });
  const [location, setLocation] = useState<Location>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { requestLocation(); }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let location_name = "";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          location_name = [city, country].filter(Boolean).join(", ");
        } catch { location_name = ""; }
        setLocation({ latitude, longitude, location_name });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/rhanks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...form, ...location }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setStatus("error"); return; }
      router.push(`/r/${data.slug}`);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">New Rhank</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>
          Create a<br />Leaderboard.
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Rhank Type */}
          <div>
            <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Rhank type</label>
            <p className="text-[11px] text-white/35 mb-3">How are members ranked?</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "score", icon: "🏆", title: "Score", desc: "Members submit a one-time score. Ranked by highest or lowest." },
                { value: "token", icon: "🪙", title: "Token", desc: "Members earn or lose tokens over time. You control the balance." },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("type", opt.value)}
                  className={`flex flex-col items-start gap-2 border p-4 text-left transition-all ${
                    form.type === opt.value ? "border-white bg-white text-[#1a5fff]" : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-bold tracking-[0.18em] uppercase">{opt.title}</span>
                  <span className="text-[11px] opacity-70 leading-relaxed">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Rhank title" hint="e.g. Longest dead hang in the gym">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={form.type === "token" ? "Year 10 English — Period 3" : "Longest dead hang in the gym"}
              className={inputCls}
            />
          </Field>

          <Field label="Description" hint="Optional — extra context or rules">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={form.type === "token" ? "Earn tokens for participation. Lose tokens for disruption." : "Must be filmed. No straps allowed."}
              className={`${inputCls} resize-none`}
            />
          </Field>

          {/* Unit — only for score type */}
          {form.type === "score" && (
            <Field label="Unit" hint="What are entries measured in?">
              <input
                required={form.type === "score"}
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="seconds, kg, reps…"
                className={inputCls}
              />
            </Field>
          )}

          {/* Token unit label */}
          {form.type === "token" && (
            <Field label="Token name" hint="What are your tokens called?">
              <input
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="tokens, points, stars, merits…"
                className={inputCls}
              />
            </Field>
          )}

          {/* Direction — only for score type */}
          {form.type === "score" && (
            <div>
              <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Who wins?</label>
              <p className="text-[11px] text-white/35 mb-3">Pick which end of the scale wins</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "high", icon: "↑", title: "Highest wins", desc: "e.g. most reps, heaviest lift" },
                  { value: "low", icon: "↓", title: "Lowest wins", desc: "e.g. fastest time, least errors" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("direction", opt.value)}
                    className={`flex flex-col items-center gap-2 border py-5 px-4 transition-all ${
                      form.direction === opt.value ? "border-white bg-white text-[#1a5fff]" : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs font-bold tracking-[0.18em] uppercase">{opt.title}</span>
                    <span className="text-[11px] opacity-60">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Join mode */}
          <div>
            <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Who can join?</label>
            <p className="text-[11px] text-white/35 mb-3">Control how members get on the board</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "open", icon: "🌐", title: "Open", desc: "Anyone can join instantly" },
                { value: "request", icon: "✋", title: "Request", desc: "Anyone can request, you approve" },
                { value: "invite", icon: "🔒", title: "Invite only", desc: "You add members manually" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("join_mode", opt.value)}
                  className={`flex flex-col items-start gap-1.5 border p-3 text-left transition-all ${
                    form.join_mode === opt.value ? "border-white bg-white text-[#1a5fff]" : "border-white/20 text-white/60 hover:border-white/50 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase">{opt.title}</span>
                  <span className="text-[10px] opacity-70 leading-relaxed">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Your name" hint="Shown as creator">
            <input
              required
              value={form.creator_name}
              onChange={(e) => set("creator_name", e.target.value)}
              placeholder="Jerome"
              className={inputCls}
            />
          </Field>

          {/* Location */}
          <div className="border border-white/15 bg-white/5 px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Location</p>
              <p className="text-[11px] text-white/35 mt-0.5">
                {locationStatus === "loading" && "Detecting location…"}
                {locationStatus === "granted" && location && (location.location_name || "Location captured")}
                {locationStatus === "denied" && "Location not available"}
                {locationStatus === "idle" && "Detecting…"}
              </p>
            </div>
            <div className="shrink-0">
              {locationStatus === "granted" && (
                <span className="text-[11px] text-white/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Pinned
                </span>
              )}
              {locationStatus === "denied" && (
                <button type="button" onClick={requestLocation}
                  className="text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white underline transition-colors">
                  Retry
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-[#ffe600] border border-[#ffe600]/30 bg-[#ffe600]/10 px-4 py-3">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#ffe600] px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Creating…" : "Create Rhank →"}
          </button>
        </form>
      </section>
    </main>
  );
}

const inputCls = "w-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-white/60 transition-colors";

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">{label}</label>
      <p className="text-[11px] text-white/35 mb-2">{hint}</p>
      {children}
    </div>
  );
}
