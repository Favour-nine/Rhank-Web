import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rhank.com";

export async function GET(req: NextRequest) {
  // Protect: only Vercel Cron (or manual calls with the secret) can invoke this
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all rhanks that have at least one follower
  const { data: follows } = await supabaseAdmin
    .from("rhank_follows")
    .select("rhank_id, user_id");

  if (!follows || follows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group follower user_ids by rhank_id
  const byRhank: Record<string, string[]> = {};
  for (const row of follows) {
    (byRhank[row.rhank_id] ??= []).push(row.user_id);
  }

  let sent = 0;

  for (const [rhankId, userIds] of Object.entries(byRhank)) {
    const { data: rhank } = await supabaseAdmin
      .from("rhanks").select("*").eq("id", rhankId).single();
    if (!rhank) continue;

    // Fetch top 3
    let top3: { name: string; value: string }[] = [];
    if (rhank.type === "score") {
      const { data: entries } = await supabaseAdmin
        .from("entries").select("participant_name, value")
        .eq("rhank_id", rhankId)
        .order("value", { ascending: rhank.direction === "low" })
        .limit(3);
      top3 = (entries ?? []).map((e) => ({ name: e.participant_name, value: `${e.value} ${rhank.unit}` }));
    } else {
      const { data: members } = await supabaseAdmin
        .from("members").select("name, balance")
        .eq("rhank_id", rhankId).eq("status", "active")
        .order("balance", { ascending: false })
        .limit(3);
      top3 = (members ?? []).map((m) => ({ name: m.name, value: `${m.balance > 0 ? "+" : ""}${m.balance} ${rhank.unit || "tokens"}` }));
    }

    // Resolve emails for followers
    for (const userId of userIds) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userData.user?.email;
      if (!email) continue;

      const rows = top3.map((r, i) =>
        `<tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:12px;">${["🥇","🥈","🥉"][i] ?? i + 1}</td><td style="padding:6px 8px;font-size:14px;font-weight:600;color:#fff;">${r.name}</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#ffe600;">${r.value}</td></tr>`
      ).join("");

      await resend.emails.send({
        from: "Rhank <digest@rhank.com>",
        to: email,
        subject: `Weekly top 3: ${rhank.title}`,
        html: `
          <div style="background:#1a5fff;padding:40px 32px;font-family:sans-serif;max-width:480px;margin:0 auto;">
            <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Weekly digest</p>
            <h1 style="font-size:32px;color:#fff;margin:0 0 24px;line-height:1.1;">${rhank.title}</h1>
            <table style="width:100%;border-collapse:collapse;">${rows}</table>
            <div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
              <a href="${SITE_URL}/r/${rhank.slug}" style="color:#ffe600;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">View full leaderboard →</a>
            </div>
          </div>`,
      });
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
