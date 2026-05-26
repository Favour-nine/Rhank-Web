import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Fetch rhanks that have a reset schedule
  const { data: rhanks } = await supabaseAdmin
    .from("rhanks")
    .select("id, slug, type, reset_schedule, last_reset_at")
    .not("reset_schedule", "is", null);

  if (!rhanks || rhanks.length === 0) return NextResponse.json({ reset: 0 });

  let reset = 0;

  for (const rhank of rhanks) {
    const lastReset = rhank.last_reset_at ? new Date(rhank.last_reset_at) : null;
    const isDue = isDueForReset(rhank.reset_schedule, lastReset, now);
    if (!isDue) continue;

    if (rhank.type === "score") {
      // Delete all entries
      await supabaseAdmin.from("entries").delete().eq("rhank_id", rhank.id);
    } else {
      // Reset all member balances to 0 and delete transactions
      await supabaseAdmin.from("members").update({ balance: 0 }).eq("rhank_id", rhank.id);
      await supabaseAdmin.from("token_transactions").delete().eq("rhank_id", rhank.id);
    }

    await supabaseAdmin
      .from("rhanks")
      .update({ last_reset_at: now.toISOString() })
      .eq("id", rhank.id);

    reset++;
  }

  return NextResponse.json({ reset });
}

function isDueForReset(
  schedule: "weekly" | "monthly",
  lastReset: Date | null,
  now: Date
): boolean {
  if (!lastReset) return true; // never reset — run immediately
  const ms = now.getTime() - lastReset.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  if (schedule === "weekly") return days >= 7;
  if (schedule === "monthly") return days >= 28;
  return false;
}
