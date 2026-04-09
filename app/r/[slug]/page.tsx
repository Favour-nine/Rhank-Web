"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingDirection, setEditingDirection] = useState(false);
  const [savingDirection, setSavingDirection] = useState(false);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);

  const fetchData = useCallback(async (highlightId?: string) => {
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

    if (highlightId) {
      setNewEntryId(highlightId);
      setTimeout(() => setNewEntryId(null), 2500);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`entries-${slug}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, (payload) => {
        fetchData((payload.new as Entry).id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug, fetchData]);

  const saveDirection = async (dir: "high" | "low") => {
    if (!rhank || dir === rhank.direction) { setEditingDirection(false); return; }
    setSavingDirection(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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

  const isOwner = !!user && !!rhank.user_id && user.id === rhank.user_id;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 md:pt-24">

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40">
            By {rhank.creator_name}
          </span>
          {rhank.location_name && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">📍 {rhank.location_name}</span>
            </>
          )}
          {/* Live indicator */}
          <span className="ml-auto flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Title */}
        <h1 className={`${bebas.className} text-5xl md:text-8xl leading-none mb-3`}>
          {rhank.title}
        </h1>

        {rhank.description && (
          <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-4">{rhank.description}</p>
        )}

        {/* Direction row */}
        <div className="flex items-center gap-3 flex-wrap mb-8">
          {!editingDirection ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase text-white/40 bg-white/10 px-3 py-1.5">
                {rhank.direction === "high" ? "↑ Highest" : "↓ Lowest"} {rhank.unit} wins
              </span>
              {isOwner && (
                <button
                  onClick={() => setEditingDirection(true)}
                  className="text-[10px] tracking-[0.18em] uppercase text-white/25 hover:text-white/50 underline transition-colors"
                >
                  Edit
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Who wins?</span>
              {(["high", "low"] as const).map((dir) => (
                <button
                  key={dir}
                  disabled={savingDirection}
                  onClick={() => saveDirection(dir)}
                  className={`px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border transition-all ${
                    rhank.direction === dir ? "border-white bg-white text-[#1a5fff]" : "border-white/30 text-white hover:border-white"
                  }`}
                >
                  {dir === "high" ? "↑ Highest" : "↓ Lowest"}
                </button>
              ))}
              <button onClick={() => setEditingDirection(false)} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href={`/r/${slug}/enter`}
            className="inline-flex items-center gap-2 bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors"
          >
            + Submit entry
          </Link>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <><span className="w-2 h-2 rounded-full bg-green-400" /> Copied!</>
            ) : (
              "Share link"
            )}
          </button>
        </div>

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center">
            <p className={`${bebas.className} text-4xl text-white/20 mb-3`}>No entries yet.</p>
            <p className="text-white/30 text-sm mb-6">Be the first to get on the board.</p>
            <Link
              href={`/r/${slug}/enter`}
              className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors"
            >
              Submit first entry →
            </Link>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {top3.map((entry, i) => (
              <div
                key={entry.id}
                className={`relative p-5 border transition-all duration-700 ${
                  newEntryId === entry.id ? "border-[#ffe600] bg-[#ffe600]/10" :
                  i === 0
                    ? "border-[#ffe600]/60 bg-white/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {/* Rank badge */}
                <div className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${i === 0 ? "text-[#ffe600]" : "text-white/30"}`}>
                  {i === 0 ? "🥇 1st" : i === 1 ? "🥈 2nd" : "🥉 3rd"}
                </div>
                <p className={`font-bold text-lg leading-tight mb-1 ${i === 0 ? "text-white" : "text-white/80"}`}>
                  {entry.participant_name}
                </p>
                <p className={`${bebas.className} text-3xl ${i === 0 ? "text-[#ffe600]" : "text-white/60"}`}>
                  {entry.value}
                  <span className="text-sm ml-1 font-sans font-normal opacity-60">{rhank.unit}</span>
                </p>
                {entry.proof_url && (
                  <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-[10px] tracking-[0.18em] uppercase text-white/30 hover:text-white/60 underline transition-colors">
                    View proof
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rest of entries */}
        {rest.length > 0 && (
          <div className="border border-white/10 divide-y divide-white/5">
            <div className="grid grid-cols-[2.5rem_1fr_auto] px-5 py-2.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/25">
              <span>#</span>
              <span>Name</span>
              <span>{rhank.unit}</span>
            </div>
            {rest.map((entry, i) => (
              <div
                key={entry.id}
                className={`grid grid-cols-[2.5rem_1fr_auto] items-center px-5 py-3.5 transition-all duration-700 ${
                  newEntryId === entry.id ? "bg-[#ffe600]/10" : "hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-bold text-white/30 tabular-nums">{i + 4}</span>
                <div>
                  <p className="text-sm font-medium text-white/70">{entry.participant_name}</p>
                  {entry.proof_url && (
                    <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-white/30 hover:text-white/55 underline transition-colors">
                      proof
                    </a>
                  )}
                </div>
                <span className="text-base font-bold tabular-nums text-white/60">{entry.value}</span>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <p className="mt-5 text-[10px] text-white/20 text-center tracking-[0.18em] uppercase">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} · updates live
          </p>
        )}
      </section>
    </main>
  );
}

function LoadingScreen() {
  const bebas2 = bebas;
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40"
              style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </main>
  );
}

function NotFoundScreen() {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
        <p className={`${bebas.className} text-6xl md:text-7xl text-white/30`}>Rhank not found.</p>
        <p className="text-white/40 text-sm">This leaderboard doesn't exist or may have been removed.</p>
        <Link href="/rhanks/new"
          className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors">
          Create one →
        </Link>
      </div>
    </main>
  );
}
