import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string }> };

async function getUser(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  return data.user ?? null;
}

// GET  — check if current user follows this rhank
export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ following: false });

  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabaseAdmin
    .from("rhank_follows").select("id").eq("rhank_id", rhank.id).eq("user_id", user.id).maybeSingle();

  return NextResponse.json({ following: !!data });
}

// POST — toggle follow
export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: existing } = await supabaseAdmin
    .from("rhank_follows").select("id").eq("rhank_id", rhank.id).eq("user_id", user.id).maybeSingle();

  if (existing) {
    await supabaseAdmin.from("rhank_follows").delete().eq("id", existing.id);
    return NextResponse.json({ following: false });
  }

  await supabaseAdmin.from("rhank_follows").insert({ rhank_id: rhank.id, user_id: user.id });
  return NextResponse.json({ following: true });
}
