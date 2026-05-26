"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bebas_Neue } from "next/font/google";
import { supabase, type Rhank, type Entry, type Member } from "@/lib/supabase";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export default function EmbedPage() {
  const { slug } = useParams<{ slug: string }>();
  const [rhank, setRhank] = useState<Rhank | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.from("rhanks").select("*").eq("slug", slug).single().then(async ({ data, error }) => {
      if (error || !data) { setNotFound(true); return; }
      const r = data as Rhank;
      setRhank(r);

      if (r.type === "score") {
        const { data: e } = await supabase
          .from("entries").select("*").eq("rhank_id", r.id)
          .order("value", { ascending: r.direction === "low" })
          .limit(10);
        setEntries((e ?? []) as Entry[]);
      } else {
        const { data: m } = await supabase
          .from("members").select("*").eq("rhank_id", r.id).eq("status", "active")
          .order("balance", { ascending: false }).limit(10);
        setMembers((m ?? []) as Member[]);
      }
    });
  }, [slug]);

  if (notFound) return (
    <div style={{ background: "#1a5fff", color: "#fff", padding: "24px", fontFamily: "sans-serif", minHeight: "100vh" }}>
      <p style={{ opacity: 0.4, fontSize: 14 }}>Rhank not found.</p>
    </div>
  );

  if (!rhank) return (
    <div style={{ background: "#1a5fff", minHeight: "100vh" }} />
  );

  const rows = rhank.type === "score" ? entries : members;
  const unit = rhank.unit || (rhank.type === "token" ? "tokens" : "");

  return (
    <div style={{ background: "#1a5fff", color: "#fff", fontFamily: "sans-serif", minHeight: "100vh", padding: "20px 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
          {rhank.creator_name}
        </p>
        <h1 className={bebas.className} style={{ fontSize: 36, lineHeight: 1, margin: 0, letterSpacing: "0.02em" }}>
          {rhank.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Live</span>
          {rhank.type === "token" && (
            <span style={{ marginLeft: 8, fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 8px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>🪙 Token</span>
          )}
        </div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No entries yet.</p>
      ) : (
        <div>
          {rows.map((row, i) => {
            const name = rhank.type === "score" ? (row as Entry).participant_name : (row as Member).name;
            const value = rhank.type === "score" ? (row as Entry).value : (row as Member).balance;
            const isTop = i === 0;
            return (
              <div key={row.id} style={{
                display: "grid", gridTemplateColumns: "2rem 1fr auto",
                alignItems: "center", padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isTop ? "#ffe600" : "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span style={{ fontSize: 13, color: isTop ? "#fff" : "rgba(255,255,255,0.7)" }}>{name}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: isTop ? "#ffe600" : "rgba(255,255,255,0.55)", fontVariantNumeric: "tabular-nums" }}>
                  {typeof value === "number" && value > 0 && rhank.type === "token" ? "+" : ""}{value}
                  {unit ? <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.5 }}>{unit}</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {rows.length} {rhank.type === "score" ? "entries" : "members"}
        </span>
        <a
          href={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/r/${slug}`}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, color: "#ffe600", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}
        >
          View on Rhank →
        </a>
      </div>
    </div>
  );
}
