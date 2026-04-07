"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type Location = { latitude: number; longitude: number; location_name: string } | null;

export default function NewRhankPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    unit: "",
    direction: "high",
    creator_name: "",
  });
  const [location, setLocation] = useState<Location>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return; }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode using browser-native API (no key needed)
        let location_name = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          location_name = [city, country].filter(Boolean).join(", ");
        } catch {
          location_name = "";
        }
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
      const res = await fetch("/api/rhanks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      <section className="mx-auto max-w-2xl px-6 pt-20 pb-24 md:pt-32">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">New Rhank</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>
          Create a<br />Leaderboard.
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Rhank title" hint="e.g. Longest dead hang in the gym">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Longest dead hang in the gym"
              className={inputCls}
            />
          </Field>

          <Field label="Description" hint="Optional — extra context or rules">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Must be filmed. No straps allowed."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <Field label="Unit" hint="What are entries measured in?">
            <input
              required
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="seconds, kg, reps…"
              className={inputCls}
            />
          </Field>

          <div>
            <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Who wins?</label>
            <p className="text-[11px] text-white/35 mb-3">Pick which end of the scale wins</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("direction", "high")}
                className={`flex flex-col items-center gap-2 border py-5 px-4 transition-all ${
                  form.direction === "high"
                    ? "border-white bg-white text-[#1a5fff]"
                    : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"
                }`}
              >
                <span className="text-2xl">↑</span>
                <span className="text-xs font-bold tracking-[0.18em] uppercase">Highest wins</span>
                <span className="text-[11px] opacity-60">e.g. most reps, heaviest lift</span>
              </button>
              <button
                type="button"
                onClick={() => set("direction", "low")}
                className={`flex flex-col items-center gap-2 border py-5 px-4 transition-all ${
                  form.direction === "low"
                    ? "border-white bg-white text-[#1a5fff]"
                    : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"
                }`}
              >
                <span className="text-2xl">↓</span>
                <span className="text-xs font-bold tracking-[0.18em] uppercase">Lowest wins</span>
                <span className="text-[11px] opacity-60">e.g. fastest time, least errors</span>
              </button>
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
                <button
                  type="button"
                  onClick={requestLocation}
                  className="text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white underline transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-yellow-300">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {status === "loading" ? "Creating…" : "Create Rhank →"}
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
