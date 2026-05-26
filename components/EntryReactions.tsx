"use client";

import { useEffect, useState, useCallback } from "react";
import { REACTION_EMOJIS, type ReactionEmoji } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

type Props = {
  slug: string;
  entryId: string;
};

export default function EntryReactions({ slug, entryId }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [loading, setLoading] = useState<ReactionEmoji | null>(null);

  const fetchReactions = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`/api/rhanks/${slug}/entries/${entryId}/reactions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const data = await res.json();
    setCounts(data.counts ?? {});
    setMine(data.mine ?? []);
  }, [slug, entryId]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  const toggle = async (emoji: ReactionEmoji) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return; // silently ignore unauthenticated clicks
    setLoading(emoji);

    // Optimistic update
    const already = mine.includes(emoji);
    setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] ?? 0) + (already ? -1 : 1)) }));
    setMine((prev) => already ? prev.filter((e) => e !== emoji) : [...prev, emoji]);

    const token = sessionData.session.access_token;
    await fetch(`/api/rhanks/${slug}/entries/${entryId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    });

    setLoading(null);
  };

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total === 0 && mine.length === 0) {
    // Still render the buttons so users can react
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {REACTION_EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = mine.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={loading === emoji}
            title={active ? "Remove reaction" : "React"}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border transition-all ${
              active
                ? "border-[#ffe600]/60 bg-[#ffe600]/15 text-white"
                : "border-white/15 bg-white/5 text-white/50 hover:border-white/30 hover:text-white/80"
            } ${loading === emoji ? "opacity-50" : ""}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums text-[10px]">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
