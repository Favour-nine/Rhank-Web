"use client";

import { useState } from "react";

export default function EmbedSnippet({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const code = `<iframe src="${siteUrl}/embed/${slug}" width="400" height="520" frameborder="0" style="border:none;border-radius:0;" title="Rhank Leaderboard"></iframe>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase text-white hover:bg-white/10 transition-colors"
      >
        {open ? "Hide embed" : "Embed"}
      </button>

      {open && (
        <div className="mt-3 border border-white/15 bg-white/5 p-4 space-y-3">
          <p className="text-[11px] text-white/40 uppercase tracking-[0.15em]">Embed this leaderboard on any site</p>
          <pre className="text-[10px] text-white/60 font-mono bg-black/20 px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all select-all">
            {code}
          </pre>
          <button
            onClick={copy}
            className="text-[11px] tracking-[0.15em] uppercase text-[#ffe600] hover:text-[#ffe600]/80 transition-colors"
          >
            {copied ? "Copied!" : "Copy code"}
          </button>
        </div>
      )}
    </div>
  );
}
