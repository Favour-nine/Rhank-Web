"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type RhankWithCount = Rhank & { count: number };

export default function RhanksPage() {
  const { user } = useAuth();
  const [rhanks, setRhanks] = useState<RhankWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: rhankData } = await supabase
        .from("rhanks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!rhankData) { setLoading(false); return; }

      // Fetch entry counts (score rhanks) and member counts (token rhanks)
      const [{ data: entryCounts }, { data: memberCounts }] = await Promise.all([
        supabase.from("entries").select("rhank_id"),
        supabase.from("members").select("rhank_id").eq("status", "active"),
      ]);

      const entryMap: Record<string, number> = {};
      (entryCounts ?? []).forEach((e: { rhank_id: string }) => {
        entryMap[e.rhank_id] = (entryMap[e.rhank_id] ?? 0) + 1;
      });

      const memberMap: Record<string, number> = {};
      (memberCounts ?? []).forEach((m: { rhank_id: string }) => {
        memberMap[m.rhank_id] = (memberMap[m.rhank_id] ?? 0) + 1;
      });

      setRhanks(rhankData.map((r) => ({
        ...r,
        count: r.type === "token" ? (memberMap[r.id] ?? 0) : (entryMap[r.id] ?? 0),
      })) as RhankWithCount[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? rhanks.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.creator_name.toLowerCase().includes(search.toLowerCase()) ||
        r.unit.toLowerCase().includes(search.toLowerCase())
      )
    : rhanks;

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-5xl px-6 pt-16 pb-24 md:pt-24">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-2">
              {loading ? "—" : `${rhanks.length} board${rhanks.length !== 1 ? "s" : ""}`}
            </p>
            <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none`}>Browse.</h1>
          </div>
          <Link
            href="/rhanks/new"
            className="inline-flex self-start sm:self-auto items-center gap-2 bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors"
          >
            + Create a Rhank
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, creator, or unit…"
            className="w-full border border-white/15 bg-white/5 backdrop-blur px-5 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40"
                  style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Empty — no rhanks at all */}
        {!loading && rhanks.length === 0 && (
          <div className="border border-white/10 bg-white/5 px-8 py-20 text-center">
            <p className={`${bebas.className} text-5xl text-white/20 mb-3`}>Nothing here yet.</p>
            <p className="text-white/30 text-sm mb-8">Be the first to create a leaderboard.</p>
            <Link href="/rhanks/new"
              className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors">
              Create the first Rhank →
            </Link>
          </div>
        )}

        {/* No search results */}
        {!loading && rhanks.length > 0 && filtered.length === 0 && (
          <div className="border border-white/10 bg-white/5 px-8 py-12 text-center">
            <p className="text-white/40 text-sm">No results for <span className="text-white/70">"{search}"</span></p>
            <button onClick={() => setSearch("")} className="mt-3 text-[11px] tracking-[0.18em] uppercase text-white/30 hover:text-white/60 underline transition-colors">
              Clear search
            </button>
          </div>
        )}

        {/* Card grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <RhankCard key={r.id} rhank={r} isOwner={!!user && r.user_id === user.id} count={r.count} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function RhankCard({ rhank, isOwner, count }: { rhank: RhankWithCount; isOwner: boolean; count: number }) {
  const isToken = rhank.type === "token";
  return (
    <Link
      href={`/r/${rhank.slug}`}
      className="group relative flex flex-col border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25 transition-all duration-200 p-5"
    >
      {/* Owner badge */}
      {isOwner && (
        <span className="absolute top-4 right-4 text-[9px] font-bold tracking-[0.2em] uppercase text-[#ffe600] bg-[#ffe600]/10 border border-[#ffe600]/20 px-2 py-0.5">
          Yours
        </span>
      )}

      {/* Type / direction pill */}
      <span className="inline-flex items-center self-start text-[9px] font-bold tracking-[0.2em] uppercase text-white/40 border border-white/10 px-2 py-1 mb-4">
        {isToken
          ? `🪙 ${rhank.unit || "tokens"}`
          : `${rhank.direction === "high" ? "↑ Highest" : "↓ Lowest"} ${rhank.unit}`}
      </span>

      {/* Title */}
      <h2 className={`${bebas.className} text-3xl leading-tight text-white group-hover:text-[#ffe600] transition-colors duration-200 mb-3 flex-1`}>
        {rhank.title}
      </h2>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-white/35 tracking-[0.15em] uppercase">{rhank.creator_name}</span>
          {rhank.location_name && (
            <span className="text-[10px] text-white/25 tracking-[0.12em]">📍 {rhank.location_name}</span>
          )}
        </div>
        <div className="text-right">
          <span className={`${bebas.className} text-2xl text-white/60 group-hover:text-white/90 transition-colors`}>
            {count}
          </span>
          <p className="text-[9px] text-white/25 tracking-[0.15em] uppercase">
            {isToken ? (count === 1 ? "member" : "members") : (count === 1 ? "entry" : "entries")}
          </p>
        </div>
      </div>
    </Link>
  );
}
