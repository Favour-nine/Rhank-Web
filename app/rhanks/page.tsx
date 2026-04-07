"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function RhanksPage() {
  const [rhanks, setRhanks] = useState<Rhank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("rhanks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRhanks((data ?? []) as Rhank[]);
        setLoading(false);
      });
  }, []);

  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-3xl px-6 pt-20 pb-24 md:pt-32">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-2">All boards</p>
            <h1 className={`${bebas.className} text-6xl md:text-8xl leading-none`}>Rhanks</h1>
          </div>
          <Link
            href="/rhanks/new"
            className="inline-flex items-center bg-white px-5 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors"
          >
            + New
          </Link>
        </div>

        {loading ? (
          <p className="text-white/40">Loading…</p>
        ) : rhanks.length === 0 ? (
          <div className="border border-white/15 bg-white/5 p-12 text-center">
            <p className="text-white/50 text-lg">No Rhanks yet.</p>
            <Link href="/rhanks/new" className="mt-4 inline-block text-sm text-white/40 hover:text-white/70 underline transition-colors">
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="border border-white/15 divide-y divide-white/10">
            {rhanks.map((r) => (
              <Link
                key={r.id}
                href={`/r/${r.slug}`}
                className="grid grid-cols-[1fr_auto] items-center px-5 py-5 hover:bg-white/5 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-white group-hover:text-white transition-colors">{r.title}</p>
                  <p className="text-[11px] text-white/35 mt-1">
                    {r.unit} · {r.direction === "high" ? "Highest" : "Lowest"} wins · by {r.creator_name}
                  </p>
                </div>
                <span className="text-white/25 group-hover:text-white/60 transition-colors text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
