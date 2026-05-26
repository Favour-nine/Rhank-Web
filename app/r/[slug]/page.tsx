"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";
import TokenLeaderboard from "@/components/leaderboard/TokenLeaderboard";
import ScoreLeaderboard from "@/components/leaderboard/ScoreLeaderboard";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("rhanks").select("*").eq("slug", slug).single().then(({ data, error }) => {
      if (error || !data) setNotFound(true);
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
        <p className="text-white/40 text-sm">This leaderboard doesn&apos;t exist or may have been removed.</p>
        <Link href="/rhanks/new"
          className="inline-flex items-center bg-white px-6 py-3 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors">
          Create one →
        </Link>
      </div>
    </main>
  );
}
