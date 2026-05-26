"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BTN_PRIMARY, BTN_GHOST } from "@/lib/ui";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";
import EntryReactions from "@/components/EntryReactions";
import EmbedSnippet from "@/components/EmbedSnippet";
import FollowButton from "@/components/FollowButton";
import WebhookManager from "@/components/WebhookManager";
import ExportButton from "@/components/ExportButton";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function ScoreLeaderboard({ slug, rhank, isOwner, user }: {
  slug: string;
  rhank: Rhank;
  isOwner: boolean;
  user: ReturnType<typeof useAuth>["user"];
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pendingEntries, setPendingEntries] = useState<Entry[]>([]);
  const [moderating, setModerating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingDirection, setEditingDirection] = useState(false);
  const [savingDirection, setSavingDirection] = useState(false);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [myEntryId, setMyEntryId] = useState<string | null>(null);
  const [showClaimPicker, setShowClaimPicker] = useState(false);
  const [entryClaiming, setEntryClaiming] = useState(false);
  const [entryClaimed, setEntryClaimed] = useState(false);

  const fetchEntries = useCallback(async (highlightId?: string) => {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("rhank_id", rhank.id)
      .order("value", { ascending: rhank.direction === "low" });
    const all = (data ?? []) as Entry[];
    setEntries(all.filter((e) => !e.status || e.status === "approved"));
    setPendingEntries(all.filter((e) => e.status === "pending"));
    if (user) {
      const mine = all.find((e) => e.user_id === user.id);
      if (mine) setMyEntryId(mine.id);
    }
    if (highlightId) {
      setNewEntryId(highlightId);
      setTimeout(() => setNewEntryId(null), 2500);
    }
  }, [rhank.id, rhank.direction, user]);

  useEffect(() => {
    fetchEntries();
    const channel = supabase
      .channel(`entries-${slug}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "entries" }, (payload) => {
        fetchEntries((payload.new as Entry).id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug, fetchEntries]);

  const saveDirection = async (dir: "high" | "low") => {
    if (dir === rhank.direction) { setEditingDirection(false); return; }
    setSavingDirection(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ direction: dir }),
    });
    await fetchEntries();
    setSavingDirection(false);
    setEditingDirection(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    setClaiming(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ claim: true }),
    });
    if (res.ok) setClaimed(true);
    setClaiming(false);
  };

  const moderateEntry = async (entryId: string, status: "approved" | "rejected") => {
    setModerating(entryId);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`/api/rhanks/${slug}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status }),
    });
    fetchEntries();
    setModerating(null);
  };

  const handleClaimEntry = async (entryId: string) => {
    setEntryClaiming(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`/api/rhanks/${slug}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ claim: true }),
    });
    if (res.ok) {
      setMyEntryId(entryId);
      setShowClaimPicker(false);
      setEntryClaimed(true);
      fetchEntries();
    }
    setEntryClaiming(false);
  };

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
          <span className="ml-auto flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        </div>

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
                <button onClick={() => setEditingDirection(true)}
                  className="text-[10px] tracking-[0.18em] uppercase text-white/25 hover:text-white/50 underline transition-colors">
                  Edit
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Who wins?</span>
              {(["high", "low"] as const).map((dir) => (
                <button key={dir} disabled={savingDirection} onClick={() => saveDirection(dir)}
                  className={`px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase border transition-all ${
                    rhank.direction === dir ? "border-white bg-white text-[#1a5fff]" : "border-white/30 text-white hover:border-white"
                  }`}>
                  {dir === "high" ? "↑ Highest" : "↓ Lowest"}
                </button>
              ))}
              <button onClick={() => setEditingDirection(false)} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Cancel</button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link href={`/r/${slug}/enter`} className={BTN_PRIMARY}>
            + Submit entry
          </Link>
          <button onClick={copyLink} className={BTN_GHOST}>
            {copied ? <><span className="w-2 h-2 rounded-full bg-green-400" /> Copied!</> : "Share link"}
          </button>
          {isOwner && (
            <Link href={`/r/${slug}/edit`} className={BTN_GHOST}>Edit</Link>
          )}
          <FollowButton slug={slug} />
          {user && !rhank.user_id && !claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex items-center gap-2 border border-[#ffe600]/50 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-[#ffe600] hover:bg-[#ffe600]/10 disabled:opacity-50 transition-colors"
            >
              {claiming ? "Claiming…" : "Claim this Rhank"}
            </button>
          )}
          {claimed && (
            <span className="inline-flex items-center gap-2 text-sm text-green-400 font-semibold tracking-[0.18em] uppercase">
              <span className="w-2 h-2 rounded-full bg-green-400" /> Claimed. Reload to manage.
            </span>
          )}
        </div>

        {/* Empty */}
        {entries.length === 0 && (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center">
            <p className={`${bebas.className} text-4xl text-white/20 mb-3`}>No entries yet.</p>
            <p className="text-white/30 text-sm mb-6">Be the first to get on the board.</p>
            <Link href={`/r/${slug}/enter`}
              className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors">
              Submit first entry →
            </Link>
          </div>
        )}

        {/* Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {top3.map((entry, i) => (
              <div key={entry.id} className={`relative p-5 border transition-all duration-700 ${
                myEntryId === entry.id ? "border-[#ffe600] bg-[#ffe600]/10" :
                newEntryId === entry.id ? "border-[#ffe600] bg-[#ffe600]/10" :
                i === 0 ? "border-[#ffe600]/60 bg-white/10" : "border-white/10 bg-white/5"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold tracking-[0.2em] uppercase ${i === 0 ? "text-[#ffe600]" : "text-white/30"}`}>
                    {i === 0 ? "🥇 1st" : i === 1 ? "🥈 2nd" : "🥉 3rd"}
                  </span>
                  {myEntryId === entry.id && (
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#ffe600] bg-[#ffe600]/15 px-2 py-0.5">You</span>
                  )}
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
                <EntryReactions slug={slug} entryId={entry.id} />
              </div>
            ))}
          </div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div className="border border-white/10 divide-y divide-white/5">
            <div className="grid grid-cols-[2.5rem_1fr_auto] px-5 py-2.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/25">
              <span>#</span><span>Name</span><span>{rhank.unit}</span>
            </div>
            {rest.map((entry, i) => (
              <div key={entry.id} className={`grid grid-cols-[2.5rem_1fr_auto] items-center px-5 py-3.5 transition-all duration-700 ${
                myEntryId === entry.id ? "bg-[#ffe600]/10" :
                newEntryId === entry.id ? "bg-[#ffe600]/10" : "hover:bg-white/5"
              }`}>
                <span className="text-sm font-bold text-white/30 tabular-nums">{i + 4}</span>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    {entry.participant_name}
                    {myEntryId === entry.id && (
                      <span className="ml-2 text-[9px] font-bold tracking-[0.2em] uppercase text-[#ffe600]">You</span>
                    )}
                  </p>
                  {entry.proof_url && (
                    <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-white/30 hover:text-white/55 underline transition-colors">proof</a>
                  )}
                  <EntryReactions slug={slug} entryId={entry.id} />
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

        {/* Moderation queue — owner only */}
        {isOwner && pendingEntries.length > 0 && (
          <div className="mt-8 border border-[#ffe600]/25 bg-[#ffe600]/5">
            <div className="px-5 py-3 border-b border-[#ffe600]/15">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#ffe600]/70">
                Pending approval ({pendingEntries.length})
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {pendingEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-white/80">{entry.participant_name}</p>
                    <p className="text-[11px] text-white/40">{entry.value} {rhank.unit}</p>
                    {entry.proof_url && (
                      <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-white/30 underline">proof</a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => moderateEntry(entry.id, "approved")}
                      disabled={moderating === entry.id}
                      className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#ffe600] text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderateEntry(entry.id, "rejected")}
                      disabled={moderating === entry.id}
                      className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/20 text-white/50 hover:text-white hover:border-white/50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <EmbedSnippet slug={slug} />
          {isOwner && (
            <>
              <ExportButton slug={slug} types={["entries"]} />
              <WebhookManager slug={slug} />
            </>
          )}
        </div>

        {/* Claim entry section */}
        {user && !myEntryId && !entryClaimed && entries.some((e) => !e.user_id) && (
          <div className="border border-white/15 bg-white/5 px-5 py-6 mt-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/50 mb-1">Is one of these entries yours?</p>
            <p className="text-[11px] text-white/30 mb-4">Link your account to your score so you can track it.</p>
            {!showClaimPicker ? (
              <button
                onClick={() => setShowClaimPicker(true)}
                className="text-sm font-semibold tracking-[0.18em] uppercase text-[#ffe600] hover:text-[#ffe600]/80 transition-colors"
              >
                Claim your entry →
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2">Select your entry:</p>
                {entries.filter((e) => !e.user_id).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => handleClaimEntry(e.id)}
                    disabled={entryClaiming}
                    className="w-full flex items-center justify-between border border-white/15 px-4 py-3 hover:border-[#ffe600]/50 hover:bg-[#ffe600]/5 transition-colors disabled:opacity-50 text-left"
                  >
                    <span className="text-sm font-medium text-white/80">{e.participant_name}</span>
                    <span className="text-sm font-bold tabular-nums text-white/40">{e.value} {rhank.unit}</span>
                  </button>
                ))}
                <button onClick={() => setShowClaimPicker(false)} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        )}
        {entryClaimed && (
          <div className="border border-white/15 bg-white/5 px-5 py-4 mt-6">
            <p className="text-sm text-green-400 font-medium">Your entry has been linked to your account.</p>
          </div>
        )}
      </section>
    </main>
  );
}
