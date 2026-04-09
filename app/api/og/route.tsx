import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Rhank";
  const creator = searchParams.get("creator") ?? "";
  const unit = searchParams.get("unit") ?? "";
  const direction = searchParams.get("direction") ?? "high";
  const entries = searchParams.get("entries") ?? "0";
  const location = searchParams.get("location") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#1a5fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
            }}
          >
            RHANK
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80" }} />
            LIVE LEADERBOARD
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Direction pill */}
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "6px 14px",
            }}
          >
            {direction === "high" ? "↑ HIGHEST" : "↓ LOWEST"} {unit.toUpperCase()} WINS
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? "72px" : "88px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {creator && (
              <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                By {creator}
              </div>
            )}
            {location && (
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>
                📍 {location}
              </div>
            )}
          </div>

          {/* Entry count */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div
              style={{
                fontSize: "72px",
                fontWeight: 900,
                color: "#ffe600",
                lineHeight: 1,
              }}
            >
              {entries}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              {Number(entries) === 1 ? "Entry" : "Entries"}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
