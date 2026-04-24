"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function MyRhanksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [owned, setOwned] = useState<Rhank[]>([]);
  const [memberOf, setMemberOf] = useState<{ rhank: Rhank; balance: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/my-rhanks");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("rhanks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("members").select("*, rhanks(*)").eq("user_id", user.id).eq("status", "active"),
    ]).then(([{ data: ownedData }, { data: memberData }]) => {
      setOwned((ownedData ?? []) as Rhank[]);
      const memberships = (memberData ?? []).map((m: { balance: number; name: string; rhanks: Rhank }) => ({
        rhank: m.rhanks,
        balance: m.balance,
        name: m.name,
      }));
      setMemberOf(memberships);
      setLoading(false);
    });
  }, [user]);

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Your account</p>
        <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none mb-10`}>My Rhanks.</h1>

        {loading ? (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-1.5 h-1.5 rounded-full bg-white/40"
                style={{ animation: `loadDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Owned */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Rhanks you created</p>
              {owned.length === 0 ? (
                <div className="border border-white/10 bg-white/5 px-8 py-12 text-center">
                  <p className="text-white/30 text-sm mb-4">No Rhanks created yet.</p>
                  <Link href="/rhanks/new"
                    className="inline-flex items-center bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors">
                    Create a Rhank →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {owned.map((r) => (
                    <RhankCard key={r.id} rhank={r} onDelete={() => setOwned((prev) => prev.filter((x) => x.id !== r.id))} />
                  ))}
                </div>
              )}
              {owned.length > 0 && (
                <div className="mt-4">
                  <Link href="/rhanks/new"
                    className="inline-flex items-center bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors">
                    + Create another
                  </Link>
                </div>
              )}
            </div>

            {/* Member of */}
            {memberOf.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/30 mb-4">Rhanks you&apos;re on</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memberOf.map(({ rhank: r, balance, name }) => (
                    <Link key={r.id} href={`/r/${r.slug}`}
                      className="group border border-white/10 bg-white/5 p-5 hover:border-white/30 hover:bg-white/10 transition-all">
                      <p className={`${bebas.className} text-2xl leading-tight mb-1 group-hover:text-[#ffe600] transition-colors`}>
                        {r.title}
                      </p>
                      <p className="text-[11px] text-white/40 mb-3">{name}</p>
                      <div className="flex items-center justify-between">
                        <span className={`${bebas.className} text-2xl ${balance >= 0 ? "text-[#ffe600]" : "text-red-400"}`}>
                          {balance > 0 ? "+" : ""}{balance}
                          <span className="text-sm ml-1 font-sans font-normal opacity-60">{r.unit || "tokens"}</span>
                        </span>
                        <span className="text-[10px] tracking-[0.15em] uppercase text-white/20">{r.type === "token" ? "🪙" : "🏆"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function RhankCard({ rhank: r, onDelete }: { rhank: Rhank; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirm) return;
    function handleClick(e: MouseEvent) {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) setConfirm(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [confirm]);

  const handleDelete = async () => {
    setDeleting(true);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    await fetch(`/api/rhanks/${r.slug}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    onDelete();
  };

  return (
    <div className="group border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all flex flex-col">
      <Link href={`/r/${r.slug}`} className="p-5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] tracking-[0.18em] uppercase text-white/30 bg-white/10 px-2 py-0.5">
            {r.type === "token" ? "🪙 Token" : "🏆 Score"}
          </span>
          <span className="text-[10px] tracking-[0.15em] uppercase text-white/20">{r.join_mode}</span>
        </div>
        <p className={`${bebas.className} text-2xl leading-tight mb-2 group-hover:text-[#ffe600] transition-colors`}>
          {r.title}
        </p>
        {r.description && (
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-3">{r.description}</p>
        )}
        <div className="flex items-center justify-between">
          {r.location_name && <span className="text-[10px] text-white/25">📍 {r.location_name}</span>}
          <span className="text-[10px] text-white/30 ml-auto">
            {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </Link>

      {confirm ? (
        <div ref={confirmRef} className="border-t border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[11px] text-red-300">Delete this Rhank?</span>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[11px] font-bold tracking-[0.15em] uppercase text-white bg-red-500 px-3 py-1.5 hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 flex">
          <Link href={`/r/${r.slug}/edit`}
            className="flex-1 text-center py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors">
            Edit
          </Link>
          <Link href={`/r/${r.slug}`}
            className="flex-1 text-center py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors border-l border-white/10">
            View
          </Link>
          <button
            onClick={() => setConfirm(true)}
            className="flex-1 text-center py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors border-l border-white/10"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
