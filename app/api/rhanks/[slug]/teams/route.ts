import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string }> };

async function getOwnerUserId(req: NextRequest, rhankId: string) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  const userId = data.user?.id;
  if (!userId) return null;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("user_id").eq("id", rhankId).single();
  return rhank?.user_id === userId ? userId : null;
}

// GET — list teams with aggregated balance
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: teams } = await supabaseAdmin
    .from("teams").select("*").eq("rhank_id", rhank.id).order("created_at");

  const { data: members } = await supabaseAdmin
    .from("members").select("team_id, balance").eq("rhank_id", rhank.id).eq("status", "active");

  // Aggregate balances per team
  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const m of members ?? []) {
    if (!m.team_id) continue;
    totals[m.team_id] = (totals[m.team_id] ?? 0) + m.balance;
    counts[m.team_id] = (counts[m.team_id] ?? 0) + 1;
  }

  return NextResponse.json({
    teams: (teams ?? []).map((t) => ({ ...t, total: totals[t.id] ?? 0, member_count: counts[t.id] ?? 0 })),
  });
}

// POST — create team (owner only)
export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id, user_id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const owner = await getOwnerUserId(req, rhank.id);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name ?? "").trim();
  const color = body.color ?? "#ffffff";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("teams").insert({ rhank_id: rhank.id, name, color }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}
