"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry, type Member } from "@/lib/supabase";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type UserProfile = {
  id: string;
  name: string;
  email?: string;
};

type MemberWithRhank = Member & { rhank: Pick<Rhank, "title" | "slug" | "unit" | "type"> };
type EntryWithRhank = Entry & { rhank: Pick<Rhank, "title" | "slug" | "unit"> };

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rhanks, setRhanks] = useState<Rhank[]>([]);
  const [memberships, setMemberships] = useState<MemberWithRhank[]>([]);
  const [entries, setEntries] = useState<EntryWithRhank[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Resolve user by display name stored in user_metadata
      // We query rhanks with creator_name matching username as a proxy lookup
      const { data: rhankRows } = await supabase
        .from("rhanks")
        .select("*")
        .ilike("creator_name", username)
        .not("user_id", "is", null)
        .order("created_at", { ascending: false });

      if (!rhankRows || rhankRows.length === 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const userId = (rhankRows[0] as Rhank).user_id!;
      setProfile({ id: userId, name: username });
      setRhanks(rhankRows as Rhank[]);

      // Memberships (token rhanks)
      const { data: memberRows } = await supabase
        .from("members")
        .select("*, rhank:rhank_id(title, slug, unit, type)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setMemberships((memberRows ?? []) as MemberWithRhank[]);

      // Score entries
      const { data: entryRows } = await supabase
        .from("entries")
        .select("*, rhank:rhank_id(title, slug, unit)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setEntries((entryRows ?? []) as EntryWithRhank[]);

      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg /><AppNav />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
        </div>
      </div>
    </main>
  );

  if (notFound || !profile) return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg /><AppNav />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
        <p className={`${bebas.className} text-6xl text-white/30`}>User not found.</p>
        <p className="text-white/40 text-sm">No profile found for &ldquo;{username}&rdquo;.</p>
      </div>
    </main>
  );

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-3">Profile</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>{profile.name}</h1>

        {/* Rhanks created */}
        <div className="mb-12">
          <h2 className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-4">
            Created leaderboards ({rhanks.length})
          </h2>
          {rhanks.length === 0 ? (
            <p className="text-white/30 text-sm">No leaderboards created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rhanks.map((r) => (
                <Link key={r.id} href={`/r/${r.slug}`}
                  className="border border-white/15 bg-white/5 px-5 py-4 hover:border-white/30 hover:bg-white/10 transition-all block">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-white/30 mb-1">
                    {r.type === "token" ? "🪙 Token" : "🏆 Score"}
                    {r.location_name && ` · 📍 ${r.location_name}`}
                  </p>
                  <p className="font-bold text-white/90 text-base leading-tight">{r.title}</p>
                  {r.unit && <p className="text-[11px] text-white/35 mt-1">{r.unit}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Token memberships */}
        {memberships.length > 0 && (
          <div className="mb-12">
            <h2 className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-4">
              Token memberships ({memberships.length})
            </h2>
            <div className="border border-white/10 divide-y divide-white/5">
              {memberships.map((m) => (
                <Link key={m.id} href={`/r/${m.rhank.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center px-5 py-3.5 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/80">{m.rhank.title}</p>
                    <p className="text-[10px] text-white/30">as {m.name}</p>
                  </div>
                  <span className={`text-base font-bold tabular-nums ${m.balance >= 0 ? "text-[#ffe600]" : "text-red-400"}`}>
                    {m.balance > 0 ? "+" : ""}{m.balance} {m.rhank.unit || "tokens"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Score entries */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/40 mb-4">
              Score entries ({entries.length})
            </h2>
            <div className="border border-white/10 divide-y divide-white/5">
              {entries.map((e) => (
                <Link key={e.id} href={`/r/${e.rhank.slug}`}
                  className="grid grid-cols-[1fr_auto] items-center px-5 py-3.5 hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white/80">{e.rhank.title}</p>
                    <p className="text-[10px] text-white/30">as {e.participant_name}</p>
                  </div>
                  <span className="text-base font-bold tabular-nums text-white/60">
                    {e.value} <span className="text-[11px] text-white/30">{e.rhank.unit}</span>
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
