"use client";

import { useEffect, useState } from "react";
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
  const [rhanks, setRhanks] = useState<Rhank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/my-rhanks");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("rhanks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRhanks((data ?? []) as Rhank[]);
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
        ) : rhanks.length === 0 ? (
          <div className="border border-white/10 bg-white/5 px-8 py-16 text-center">
            <p className={`${bebas.className} text-4xl text-white/20 mb-3`}>No Rhanks yet.</p>
            <p className="text-white/30 text-sm mb-6">Create your first leaderboard to get started.</p>
            <Link href="/rhanks/new"
              className="inline-flex items-center bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors">
              Create a Rhank →
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {rhanks.map((r) => (
                <Link key={r.id} href={`/r/${r.slug}`}
                  className="group border border-white/10 bg-white/5 p-5 hover:border-white/30 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] tracking-[0.18em] uppercase text-white/30 bg-white/10 px-2 py-0.5">
                      {r.type === "token" ? "🪙 Token" : "🏆 Score"}
                    </span>
                    <span className="text-[10px] tracking-[0.15em] uppercase text-white/20">
                      {r.join_mode}
                    </span>
                  </div>
                  <p className={`${bebas.className} text-2xl leading-tight mb-2 group-hover:text-[#ffe600] transition-colors`}>
                    {r.title}
                  </p>
                  {r.description && (
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-3">{r.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {r.location_name && (
                      <span className="text-[10px] text-white/25">📍 {r.location_name}</span>
                    )}
                    <span className="text-[10px] text-white/30 ml-auto">
                      {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/rhanks/new"
              className="inline-flex items-center bg-[#ffe600] px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-black hover:bg-[#ffe600]/90 transition-colors">
              + Create another
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
