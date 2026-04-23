"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry, type Member, type TokenTransaction } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("rhanks").select("*").eq("slug", slug).single().then(({ data, error }) => {
      if (error || !data) { setNotFound(true); }
      else setRhank(data as Rhank);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingScreen />;
  if (notFound || !rhank) return <NotFoundScreen />;

  const isOwner = !!user && !!rhank.user_id && user.id === rhank.user_id;

  if (rhank.type === "token") {
    return <TokenLeaderboard slug={slug} rhank={rhank} isOwner={isOwner} user={user} />;
  }
  return <ScoreLeaderboard slug={slug} rhank={rhank} isOwner={isOwner} user={user} />;
}

// ─── TOKEN LEADERBOARD ────────────────────────────────────────────────────────

function TokenLeaderboard({ slug, rhank, isOwner, user }: {
  slug: string; rhank: Rhank; isOwner: boolean; user: ReturnType<typeof useAuth>["user"];
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Member[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [showClaimPicker, setShowClaimPicker] = useState(false);
  const [history, setHistory] = useState<TokenTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Join form
  const [joinName, setJoinName] = useState("");
  const [joinStatus, setJoinStatus] = useState<"idle" | "loading" | "done" | "pending_approval">("idle");

  // Owner panel
  const [ownerTab, setOwnerTab] = useState<"approve" | "award" | "add">("approve");
  const [awardMemberIds, setAwardMemberIds] = useState<Set<string>>(new Set());
  const [awardAmount, setAwardAmount] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardMsg, setAwardMsg] = useState("");
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("rhank_id", rhank.id)
      .order("balance", { ascending: false });
    const all = (data ?? []) as Member[];
    setMembers(all.filter((m) => m.status === "active"));
    setPending(all.filter((m) => m.status === "pending"));
  }, [rhank.id]);

  useEffect(() => {
    fetchMembers();
    const stored = localStorage.getItem(`rhank_member_${slug}`);
    if (stored) { setMyMemberId(stored); loadHistory(stored); }

    // Also check if logged-in user already has a linked member record
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      const { data: linked } = await supabase
        .from("members")
        .select("id")
        .eq("rhank_id", rhank.id)
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (linked && !localStorage.getItem(`rhank_member_${slug}`)) {
        localStorage.setItem(`rhank_member_${slug}`, linked.id);
        setMyMemberId(linked.id);
        loadHistory(linked.id);
      }
    });

    const channel = supabase
      .channel(`members-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, fetchMembers)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [slug, fetchMembers, rhank.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) return;
    setJoinStatus("loading");
    const token = await getToken();
    const res = await fetch(`/api/rhanks/${slug}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: joinName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem(`rhank_member_${slug}`, data.member.id);
      setMyMemberId(data.member.id);
      setJoinStatus(data.status === "active" ? "done" : "pending_approval");
      fetchMembers();
    } else {
      setJoinStatus("idle");
    }
  };

  const handleClaimSpot = async (memberId: string) => {
    setClaiming(true);
    const token = await getToken();
    const res = await fetch(`/api/rhanks/${slug}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ claim: true }),
    });
    if (res.ok) {
      localStorage.setItem(`rhank_member_${slug}`, memberId);
      setMyMemberId(memberId);
      setShowClaimPicker(false);
      setClaimed(true);
      fetchMembers();
      loadHistory(memberId);
    }
    setClaiming(false);
  };

  const loadHistory = async (memberId: string) => {
    const { data } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    setHistory((data ?? []) as TokenTransaction[]);
  };

  const handleApprove = async (memberId: string, status: "active" | "rejected") => {
    const token = await getToken();
    await fetch(`/api/rhanks/${slug}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ status }),
    });
    fetchMembers();
  };

  const handleDeleteMember = async (memberId: string) => {
    const token = await getToken();
    await fetch(`/api/rhanks/${slug}/members/${memberId}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    fetchMembers();
  };

  const toggleAwardMember = (id: string) => {
    setAwardMemberIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllMembers = () => {
    setAwardMemberIds((prev) =>
      prev.size === members.length ? new Set() : new Set(members.map((m) => m.id))
    );
  };

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (awardMemberIds.size === 0 || !awardAmount || Number(awardAmount) === 0) return;
    setAwardLoading(true);
    setAwardMsg("");
    const token = await getToken();
    await Promise.all([...awardMemberIds].map((member_id) =>
      fetch(`/api/rhanks/${slug}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ member_id, amount: Number(awardAmount), reason: awardReason || null }),
      })
    ));
    setAwardMsg(`Done. ${awardMemberIds.size} ${awardMemberIds.size === 1 ? "member" : "members"} updated.`);
    setAwardAmount("");
    setAwardReason("");
    setAwardMemberIds(new Set());
    fetchMembers();
    setAwardLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddLoading(true);
    const token = await getToken();
    await fetch(`/api/rhanks/${slug}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ name: addName.trim(), owner_add: true }),
    });
    setAddName("");
    setAddLoading(false);
    fetchMembers();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const token = await getToken();

    // Skip header row if it looks like "name" or "Name"
    const start = /^name$/i.test(lines[0]) ? 1 : 0;
    const names = lines.slice(start).map((l) => l.split(",")[0].trim()).filter(Boolean);

    await Promise.all(names.map((name) =>
      fetch(`/api/rhanks/${slug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, owner_add: true }),
      })
    ));
    if (csvRef.current) csvRef.current.value = "";
    setCsvLoading(false);
    fetchMembers();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    setClaiming(true);
    const token = await getToken();
    const res = await fetch(`/api/rhanks/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ claim: true }),
    });
    if (res.ok) setClaimed(true);
    setClaiming(false);
  };

  const unit = rhank.unit || "tokens";
  const isMember = !!myMemberId;
  const myMember = members.find((m) => m.id === myMemberId);
  const canJoin = !isMember && rhank.join_mode !== "invite";

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
          <span className="text-[10px] tracking-[0.18em] uppercase text-white/30 bg-white/10 px-2 py-0.5">
            🪙 Token Rhank
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

        {/* Title */}
        <h1 className={`${bebas.className} text-5xl md:text-8xl leading-none mb-3`}>
          {rhank.title}
        </h1>
        {rhank.description && (
          <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-4">{rhank.description}</p>
        )}

        {/* Share */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
          >
            {copied ? <><span className="w-2 h-2 rounded-full bg-green-400" /> Copied!</> : "Share link"}
          </button>
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

        {/* My balance banner */}
        {myMember && (
          <div className="border border-[#ffe600]/40 bg-[#ffe600]/10 mb-6">
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#ffe600]/70">Your balance</p>
                <p className="font-bold text-lg">{myMember.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`${bebas.className} text-4xl ${myMember.balance >= 0 ? "text-[#ffe600]" : "text-red-400"}`}>
                    {myMember.balance > 0 ? "+" : ""}{myMember.balance}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{unit}</p>
                </div>
                <button
                  onClick={() => { setShowHistory((v) => !v); if (!showHistory && myMemberId) loadHistory(myMemberId); }}
                  className="text-[10px] tracking-[0.18em] uppercase text-[#ffe600]/50 hover:text-[#ffe600] underline transition-colors"
                >
                  {showHistory ? "Hide" : "History"}
                </button>
              </div>
            </div>
            {showHistory && (
              <div className="border-t border-[#ffe600]/20 divide-y divide-white/5 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-white/30">No transactions yet.</p>
                ) : history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div>
                      <p className="text-[10px] text-white/30 mb-0.5">
                        {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-sm text-white/70">{tx.reason || "No reason given"}</p>
                    </div>
                    <span className={`text-base font-bold tabular-nums shrink-0 ${tx.amount >= 0 ? "text-[#ffe600]" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount} {unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Claim your spot — for logged-in users not yet linked to a member */}
        {user && !myMemberId && !isOwner && members.some((m) => !m.user_id) && (
          <div className="border border-white/15 bg-white/5 px-5 py-5 mb-6">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/50 mb-1">Already on this board?</p>
            <p className="text-[11px] text-white/30 mb-4">If your name is listed, claim your spot to track your balance and history.</p>
            {!showClaimPicker ? (
              <button
                onClick={() => setShowClaimPicker(true)}
                className="text-[11px] tracking-[0.18em] uppercase text-white border border-white/25 px-5 py-2.5 hover:bg-white/10 transition-colors"
              >
                Claim your spot →
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.15em] uppercase text-white/30 mb-2">Select your name:</p>
                {members.filter((m) => !m.user_id).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleClaimSpot(m.id)}
                    disabled={claiming}
                    className="w-full flex items-center justify-between border border-white/15 px-4 py-3 hover:border-[#ffe600]/50 hover:bg-[#ffe600]/5 transition-colors disabled:opacity-50 text-left"
                  >
                    <span className="text-sm font-medium text-white/80">{m.name}</span>
                    <span className={`text-sm font-bold tabular-nums ${m.balance >= 0 ? "text-white/40" : "text-red-400"}`}>
                      {m.balance > 0 ? "+" : ""}{m.balance} {unit}
                    </span>
                  </button>
                ))}
                <button onClick={() => setShowClaimPicker(false)} className="text-[10px] text-white/20 hover:text-white/50 transition-colors">Cancel</button>
              </div>
            )}
          </div>
        )}

        {/* Pending approval banner */}
        {joinStatus === "pending_approval" && (
          <div className="border border-white/20 bg-white/5 px-5 py-4 mb-6">
            <p className="text-sm text-white/70">✋ Your request to join is pending approval from the creator.</p>
          </div>
        )}

        {/* Members leaderboard */}
        {members.length === 0 ? (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center mb-8">
            <p className={`${bebas.className} text-4xl text-white/20 mb-3`}>No members yet.</p>
            {canJoin && <p className="text-white/30 text-sm">Be the first to join below.</p>}
          </div>
        ) : (
          <div className="mb-8">
            {/* Top 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {members.slice(0, 3).map((m, i) => (
                <div key={m.id} className={`relative p-5 border ${
                  m.id === myMemberId ? "border-[#ffe600]/60 bg-[#ffe600]/10" :
                  i === 0 ? "border-[#ffe600]/40 bg-white/10" : "border-white/10 bg-white/5"
                }`}>
                  <div className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${i === 0 ? "text-[#ffe600]" : "text-white/30"}`}>
                    {i === 0 ? "🥇 1st" : i === 1 ? "🥈 2nd" : "🥉 3rd"}
                  </div>
                  <p className={`font-bold text-lg leading-tight mb-1 ${i === 0 ? "text-white" : "text-white/80"}`}>
                    {m.name}
                  </p>
                  <p className={`${bebas.className} text-3xl ${m.balance >= 0 ? (i === 0 ? "text-[#ffe600]" : "text-white/60") : "text-red-400"}`}>
                    {m.balance > 0 ? "+" : ""}{m.balance}
                    <span className="text-sm ml-1 font-sans font-normal opacity-60">{unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Rest */}
            {members.length > 3 && (
              <div className="border border-white/10 divide-y divide-white/5">
                <div className="grid grid-cols-[2.5rem_1fr_auto] px-5 py-2.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/25">
                  <span>#</span><span>Name</span><span>{unit}</span>
                </div>
                {members.slice(3).map((m, i) => (
                  <div key={m.id} className={`grid grid-cols-[2.5rem_1fr_auto] items-center px-5 py-3.5 ${
                    m.id === myMemberId ? "bg-[#ffe600]/5" : "hover:bg-white/5"
                  }`}>
                    <span className="text-sm font-bold text-white/30 tabular-nums">{i + 4}</span>
                    <p className="text-sm font-medium text-white/70">{m.name}</p>
                    <span className={`text-base font-bold tabular-nums ${m.balance >= 0 ? "text-white/60" : "text-red-400"}`}>
                      {m.balance > 0 ? "+" : ""}{m.balance}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-[10px] text-white/20 text-center tracking-[0.18em] uppercase">
              {members.length} {members.length === 1 ? "member" : "members"} · updates live
            </p>
          </div>
        )}

        {/* Join section */}
        {canJoin && joinStatus !== "done" && joinStatus !== "pending_approval" && (
          <div className="border border-white/15 bg-white/5 px-5 py-6 mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/50 mb-1">
              {rhank.join_mode === "open" ? "Join this leaderboard" : "Request to join"}
            </p>
            <p className="text-[11px] text-white/30 mb-4">
              {rhank.join_mode === "open" ? "Enter your name to appear on the board." : "Your request will be reviewed by the creator."}
            </p>
            <form onSubmit={handleJoin} className="flex gap-3">
              <input
                required
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
                className="flex-1 border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/50 text-sm transition-colors"
              />
              <button
                type="submit"
                disabled={joinStatus === "loading"}
                className="bg-[#ffe600] px-6 py-2.5 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
              >
                {joinStatus === "loading" ? "…" : rhank.join_mode === "open" ? "Join" : "Request"}
              </button>
            </form>
          </div>
        )}

        {rhank.join_mode === "invite" && !isMember && !isOwner && (
          <div className="border border-white/10 bg-white/5 px-5 py-4 mb-8">
            <p className="text-sm text-white/40">🔒 This leaderboard is invite-only. The creator adds members directly.</p>
          </div>
        )}

        {/* Owner panel */}
        {isOwner && (
          <div className="border border-white/20 bg-white/5">
            <div className="border-b border-white/10 px-5 pt-5 pb-0">
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Creator panel</p>
              <div className="flex gap-0">
                {(["approve", "award", "add"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOwnerTab(tab)}
                    className={`px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors border-t border-x ${
                      ownerTab === tab
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-transparent text-white/30 hover:text-white/60"
                    }`}
                  >
                    {tab === "approve" ? `Pending${pending.length > 0 ? ` (${pending.length})` : ""}` : tab === "award" ? "Award / Deduct" : "Add Members"}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {/* Approve tab */}
              {ownerTab === "approve" && (
                <>
                  {pending.length === 0 ? (
                    <p className="text-sm text-white/30">No pending requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {pending.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-4 border border-white/10 px-4 py-3">
                          <p className="text-sm font-medium text-white/80">{m.name}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(m.id, "active")}
                              className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase bg-[#ffe600] text-black hover:bg-[#ffe600]/90 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(m.id, "rejected")}
                              className="px-4 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase border border-white/20 text-white/50 hover:text-white hover:border-white/50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {members.length > 0 && (
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/30 mb-3">Active members</p>
                      <div className="space-y-1">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-4 px-3 py-2 hover:bg-white/5 rounded">
                            <p className="text-sm text-white/70">{m.name}</p>
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-bold tabular-nums ${m.balance >= 0 ? "text-white/50" : "text-red-400"}`}>
                                {m.balance > 0 ? "+" : ""}{m.balance} {unit}
                              </span>
                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Award / Deduct tab */}
              {ownerTab === "award" && (
                <form onSubmit={handleAward} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40">Members</label>
                      <button type="button" onClick={toggleAllMembers}
                        className="text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 underline transition-colors">
                        {awardMemberIds.size === members.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div className="border border-white/15 divide-y divide-white/5 max-h-52 overflow-y-auto">
                      {members.map((m) => (
                        <label key={m.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${awardMemberIds.has(m.id) ? "bg-white/10" : "hover:bg-white/5"}`}>
                          <input
                            type="checkbox"
                            checked={awardMemberIds.has(m.id)}
                            onChange={() => toggleAwardMember(m.id)}
                            className="w-4 h-4 accent-[#ffe600] shrink-0"
                          />
                          <span className="flex-1 text-sm text-white/80">{m.name}</span>
                          <span className={`text-xs tabular-nums ${m.balance >= 0 ? "text-white/40" : "text-red-400"}`}>
                            {m.balance > 0 ? "+" : ""}{m.balance} {unit}
                          </span>
                        </label>
                      ))}
                    </div>
                    {awardMemberIds.size > 0 && (
                      <p className="text-[10px] text-white/30 mt-1.5">{awardMemberIds.size} selected</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-1.5 block">
                      Amount <span className="text-white/25">(positive = award, negative = deduct)</span>
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAwardAmount((v) => String(Number(v || 0) - 1))}
                        className="border border-white/20 px-4 py-2.5 text-white/60 hover:text-white hover:border-white/50 text-lg transition-colors">−</button>
                      <input
                        required
                        type="number"
                        value={awardAmount}
                        onChange={(e) => setAwardAmount(e.target.value)}
                        placeholder="0"
                        className="flex-1 border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/50 text-sm transition-colors text-center tabular-nums"
                      />
                      <button type="button" onClick={() => setAwardAmount((v) => String(Number(v || 0) + 1))}
                        className="border border-white/20 px-4 py-2.5 text-white/60 hover:text-white hover:border-white/50 text-lg transition-colors">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-1.5 block">Reason <span className="text-white/25">(optional)</span></label>
                    <input
                      value={awardReason}
                      onChange={(e) => setAwardReason(e.target.value)}
                      placeholder="e.g. Great participation today"
                      className="w-full border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/50 text-sm transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={awardLoading}
                    className="w-full bg-[#ffe600] px-5 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 disabled:opacity-50 transition-colors"
                  >
                    {awardLoading
                      ? "Saving…"
                      : Number(awardAmount) < 0
                        ? `Deduct ${Math.abs(Number(awardAmount))} ${unit}${awardMemberIds.size > 1 ? ` · ${awardMemberIds.size} members` : ""}`
                        : `Award ${awardAmount || "0"} ${unit}${awardMemberIds.size > 1 ? ` · ${awardMemberIds.size} members` : ""}`
                    }
                  </button>
                  {awardMsg && <p className="text-sm text-white/60 text-center">{awardMsg}</p>}
                </form>
              )}

              {/* Add Members tab */}
              {ownerTab === "add" && (
                <div className="space-y-6">
                  <form onSubmit={handleAddMember} className="space-y-3">
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 block">Add single member</label>
                    <div className="flex gap-3">
                      <input
                        required
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="Member name"
                        className="flex-1 border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/50 text-sm transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={addLoading}
                        className="bg-white px-6 py-2.5 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
                      >
                        {addLoading ? "…" : "Add"}
                      </button>
                    </div>
                  </form>

                  <div className="border-t border-white/10 pt-5">
                    <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 block mb-1.5">Bulk import via CSV</label>
                    <p className="text-[11px] text-white/30 mb-3">Upload a CSV file with one name per row (or a "name" header column). All members are added as active.</p>
                    <input
                      ref={csvRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCSV}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className={`inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase cursor-pointer transition-colors ${
                        csvLoading ? "text-white/30 pointer-events-none" : "text-white hover:bg-white/10"
                      }`}
                    >
                      {csvLoading ? "Importing…" : "Upload CSV"}
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// ─── SCORE LEADERBOARD ────────────────────────────────────────────────────────

function ScoreLeaderboard({ slug, rhank, isOwner, user }: {
  slug: string; rhank: Rhank; isOwner: boolean; user: ReturnType<typeof useAuth>["user"];
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);
  const [editingDirection, setEditingDirection] = useState(false);
  const [savingDirection, setSavingDirection] = useState(false);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const fetchEntries = useCallback(async (highlightId?: string) => {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("rhank_id", rhank.id)
      .order("value", { ascending: rhank.direction === "low" });
    setEntries((data ?? []) as Entry[]);
    if (highlightId) {
      setNewEntryId(highlightId);
      setTimeout(() => setNewEntryId(null), 2500);
    }
  }, [rhank.id, rhank.direction]);

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
          <Link href={`/r/${slug}/enter`}
            className="inline-flex items-center gap-2 bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors">
            + Submit entry
          </Link>
          <button onClick={copyLink}
            className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors">
            {copied ? <><span className="w-2 h-2 rounded-full bg-green-400" /> Copied!</> : "Share link"}
          </button>
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
                newEntryId === entry.id ? "border-[#ffe600] bg-[#ffe600]/10" :
                i === 0 ? "border-[#ffe600]/60 bg-white/10" : "border-white/10 bg-white/5"
              }`}>
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

        {/* Rest */}
        {rest.length > 0 && (
          <div className="border border-white/10 divide-y divide-white/5">
            <div className="grid grid-cols-[2.5rem_1fr_auto] px-5 py-2.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-white/25">
              <span>#</span><span>Name</span><span>{rhank.unit}</span>
            </div>
            {rest.map((entry, i) => (
              <div key={entry.id} className={`grid grid-cols-[2.5rem_1fr_auto] items-center px-5 py-3.5 transition-all duration-700 ${
                newEntryId === entry.id ? "bg-[#ffe600]/10" : "hover:bg-white/5"
              }`}>
                <span className="text-sm font-bold text-white/30 tabular-nums">{i + 4}</span>
                <div>
                  <p className="text-sm font-medium text-white/70">{entry.participant_name}</p>
                  {entry.proof_url && (
                    <a href={entry.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-white/30 hover:text-white/55 underline transition-colors">proof</a>
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

// ─── SHARED SCREENS ───────────────────────────────────────────────────────────

function LoadingScreen() {
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
