"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry, type Member } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type MemberWithRhank = Member & { rhank: Pick<Rhank, "title" | "slug" | "unit" | "type"> };
type EntryWithRhank = Entry & { rhank: Pick<Rhank, "title" | "slug" | "unit"> };

export default function PublicProfilePage() {
  const { username: userId } = useParams<{ username: string }>();
  const [displayName, setDisplayName] = useState("");
  const [rhanks, setRhanks] = useState<Rhank[]>([]);
  const [memberships, setMemberships] = useState<MemberWithRhank[]>([]);
  const [entries, setEntries] = useState<EntryWithRhank[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { data: rhankRows },
        { data: memberRows },
        { data: entryRows },
      ] = await Promise.all([
        supabase.from("rhanks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("members").select("*, rhank:rhank_id(title, slug, unit, type)").eq("user_id", userId).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("entries").select("*, rhank:rhank_id(title, slug, unit)").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);

      const owned = (rhankRows ?? []) as Rhank[];
      const membered = (memberRows ?? []) as MemberWithRhank[];
      const scored = (entryRows ?? []) as EntryWithRhank[];

      if (owned.length === 0 && membered.length === 0 && scored.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Derive display name: creator_name from owned rhanks, else member name, else "User"
      const name =
        owned[0]?.creator_name ||
        membered[0]?.name ||
        scored[0]?.participant_name ||
        "User";

      setDisplayName(name);
      setRhanks(owned);
      setMemberships(membered);
      setEntries(scored);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg /><AppNav />
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

  if (notFound) return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg /><AppNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <p className={`${bebas.className} text-6xl text-white/30`}>User not found.</p>
        <p className="text-white/40 text-sm">No profile exists for this user.</p>
      </div>
    </main>
  );

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-3">Profile</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-2`}>{displayName}</h1>

        <div className="flex items-center gap-4 mb-10 text-[10px] text-white/30 tracking-[0.2em] uppercase">
          {rhanks.length > 0 && <span>{rhanks.length} {rhanks.length === 1 ? "rhank" : "rhanks"} created</span>}
          {memberships.length > 0 && <span>{memberships.length} {memberships.length === 1 ? "membership" : "memberships"}</span>}
          {entries.length > 0 && <span>{entries.length} {entries.length === 1 ? "score entry" : "score entries"}</span>}
        </div>

        {/* Created rhanks */}
        {rhanks.length > 0 && (
          <div className="mb-12">
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Created leaderboards</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rhanks.map((r) => (
                <Link key={r.id} href={`/r/${r.slug}`}
                  className="group border border-white/10 bg-white/5 px-5 py-4 hover:border-white/30 hover:bg-white/10 transition-all">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-white/30 mb-1.5">
                    {r.type === "token" ? "🪙 Token" : "🏆 Score"}
                    {r.location_name ? ` · 📍 ${r.location_name}` : ""}
                  </p>
                  <p className={`${bebas.className} text-2xl leading-tight text-white group-hover:text-[#ffe600] transition-colors`}>{r.title}</p>
                  {r.unit && <p className="text-[11px] text-white/30 mt-1">{r.unit}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Token memberships */}
        {memberships.length > 0 && (
          <div className="mb-12">
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Token leaderboards</p>
            <div className="border border-white/10 divide-y divide-white/5">
              {memberships.map((m) => (
                <Link key={m.id} href={`/r/${m.rhank.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center px-5 py-4 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/80">{m.rhank.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">as {m.name}</p>
                  </div>
                  <span className={`text-lg font-bold tabular-nums ${m.balance >= 0 ? "text-[#ffe600]" : "text-red-400"}`}>
                    {m.balance > 0 ? "+" : ""}{m.balance}
                    <span className="text-xs ml-1 font-sans font-normal text-white/30">{m.rhank.unit || "tokens"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Score entries */}
        {entries.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Score entries</p>
            <div className="border border-white/10 divide-y divide-white/5">
              {entries.map((e) => (
                <Link key={e.id} href={`/r/${e.rhank.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center px-5 py-4 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/80">{e.rhank.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">as {e.participant_name}</p>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-white/60">
                    {e.value} <span className="text-xs font-sans font-normal text-white/30">{e.rhank.unit}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
