import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { REACTION_EMOJIS, type ReactionEmoji } from "@/lib/supabase";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string; entryId: string }> };

async function getUserId(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace("Bearer ", "");
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

// GET /api/rhanks/[slug]/entries/[entryId]/reactions
// Returns counts per emoji and which ones the current user has set
export async function GET(req: NextRequest, ctx: Ctx) {
  const { entryId } = await ctx.params;
  const userId = await getUserId(req);

  const { data, error } = await supabaseAdmin
    .from("entry_reactions")
    .select("emoji, user_id")
    .eq("entry_id", entryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  const mine: string[] = [];
  for (const row of data ?? []) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
    if (userId && row.user_id === userId) mine.push(row.emoji);
  }

  return NextResponse.json({ counts, mine });
}

// POST /api/rhanks/[slug]/entries/[entryId]/reactions
// Body: { emoji: "🔥" }  — toggles the reaction (add if absent, remove if present)
export async function POST(req: NextRequest, ctx: Ctx) {
  const { entryId } = await ctx.params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const emoji = body.emoji as ReactionEmoji;

  if (!REACTION_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  // Check if already reacted
  const { data: existing } = await supabaseAdmin
    .from("entry_reactions")
    .select("id")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("entry_reactions").delete().eq("id", existing.id);
    return NextResponse.json({ action: "removed" });
  }

  const { error } = await supabaseAdmin
    .from("entry_reactions")
    .insert({ entry_id: entryId, user_id: userId, emoji });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: "added" });
}
