"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ExportType = "entries" | "members" | "transactions";

export default function ExportButton({ slug, types }: { slug: string; types: ExportType[] }) {
  const [loading, setLoading] = useState<ExportType | null>(null);

  const download = async (type: ExportType) => {
    setLoading(type);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`/api/rhanks/${slug}/export?type=${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) { setLoading(null); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(null);
  };

  const labels: Record<ExportType, string> = {
    entries: "Export entries",
    members: "Export members",
    transactions: "Export transactions",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => download(type)}
          disabled={loading === type}
          className="border border-white/20 px-4 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-white/60 hover:border-white/40 hover:text-white disabled:opacity-50 transition-colors"
        >
          {loading === type ? "Exporting…" : `↓ ${labels[type]}`}
        </button>
      ))}
    </div>
  );
}
