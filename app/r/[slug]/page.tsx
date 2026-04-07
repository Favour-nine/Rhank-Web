"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingDirection, setEditingDirection] = useState(false);
  const [savingDirection, setSavingDirection] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: r, error } = await supabase
      .from("rhanks")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !r) { setNotFound(true); setLoading(false); return; }
    setRhank(r as Rhank);

    const { data: e } = await supabase
      .from("entries")
      .select("*")
      .eq("rhank_id", r.id)
      .order("value", { ascending: r.direction === "low" });

    setEntries((e ?? []) as Entry[]);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel(`entries-${slug}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [slug, fetchData]);

  const saveDirection = async (dir: "high" | "low") => {
    if (!rhank || dir === rhank.direction) { setEditingDirection(false); return; }
    setSavingDirection(true);
    await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: dir }),
    });
    await fetchData();
    setSavingDirection(false);
    setEditingDirection(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !rhank) return <LoadingScreen />;
  if (notFound) return <NotFoundScreen />;

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 md:pt-32">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-2">
            Created by {rhank!.creator_name}
          </p>
          <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none`}>
            {rhank!.title}
          </h1>
          {rhank!.description && (
            <p className="mt-4 text-white/60 text-base leading-relaxed max-w-xl">
              {rhank!.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {!editingDirection ? (
              <>
                <p className="text-sm text-white/40">
                  Ranked by: <span className="text-white/70 font-medium">
                    {rhank!.direction === "high" ? "↑ Highest" : "↓ Lowest"} {rhank!.unit} wins
                  </span>
                </p>
                <button
                  onClick={() => setEditingDirection(true)}
                  className="text-[11px] tracking-[0.18em] uppercase text-white/30 hover:text-white/60 underline transition-colors"
                >
                  Change
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-white/40 uppercase tracking-widest">Who wins?</span>
                <button
                  disabled={savingDirection}
                  onClick={() => saveDirection("high")}
                  className={`px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase border transition-all ${
                    rhank!.direction === "high"
                      ? "border-white bg-white text-[#1a5fff]"
                      : "border-white/30 text-white hover:border-white"
                  }`}
                >
                  ↑ Highest
                </button>
                <button
                  disabled={savingDirection}
                  onClick={() => saveDirection("low")}
                  className={`px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase border transition-all ${
                    rhank!.direction === "low"
                      ? "border-white bg-white text-[#1a5fff]"
                      : "border-white/30 text-white hover:border-white"
                  }`}
                >
                  ↓ Lowest
                </button>
                <button
                  onClick={() => setEditingDirection(false)}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href={`/r/${slug}/enter`}
            className="inline-flex items-center bg-white px-5 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors"
          >
            + Submit entry
          </Link>
          <button
            onClick={copyLink}
            className="inline-flex items-center border border-white/25 px-5 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
          >
            {copied ? "Copied!" : "Share link"}
          </button>
        </div>

        {/* Leaderboard */}
        {entries.length === 0 ? (
          <div className="border border-white/15 bg-white/5 p-12 text-center">
            <p className="text-white/50 text-lg">No entries yet.</p>
            <p className="text-white/30 text-sm mt-2">Be the first to submit.</p>
          </div>
        ) : (
          <div className="border border-white/15 divide-y divide-white/10">
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_auto] px-5 py-3 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/35">
              <span>#</span>
              <span>Name</span>
              <span>{rhank!.unit}</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`grid grid-cols-[3rem_1fr_auto] items-center px-5 py-4 transition-colors ${i === 0 ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <span className={`text-lg font-bold ${i === 0 ? "text-[#ffe600]" : "text-white/40"}`}>
                  {i < 3 ? medal[i] : i + 1}
                </span>
                <div>
                  <p className={`font-semibold ${i === 0 ? "text-white" : "text-white/80"}`}>
                    {entry.participant_name}
                  </p>
                  {entry.proof_url && (
                    <a
                      href={entry.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-white/35 hover:text-white/60 underline transition-colors"
                    >
                      proof
                    </a>
                  )}
                </div>
                <span className={`text-xl font-bold tabular-nums ${i === 0 ? "text-[#ffe600]" : "text-white/70"}`}>
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-[11px] text-white/25 text-center">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} · updates live
        </p>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className={`${bebas.className} text-4xl text-white/40 tracking-widest`}>Loading…</p>
      </div>
    </main>
  );
}

function NotFoundScreen() {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <p className={`${bebas.className} text-6xl text-white/40`}>Rhank not found.</p>
        <Link href="/rhanks/new" className="border border-white/25 px-5 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors">
          Create one →
        </Link>
      </div>
    </main>
  );
}
