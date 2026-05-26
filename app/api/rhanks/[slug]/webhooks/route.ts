import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WEBHOOK_EVENTS } from "@/lib/supabase";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string }> };

async function getOwnerId(req: NextRequest, rhankId: string) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  const userId = data.user?.id;
  if (!userId) return null;
  const { data: r } = await supabaseAdmin.from("rhanks").select("user_id").eq("id", rhankId).single();
  return r?.user_id === userId ? userId : null;
}

// GET — list webhooks for this rhank (owner only)
export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await getOwnerId(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin.from("webhooks").select("*").eq("rhank_id", rhank.id).order("created_at");
  return NextResponse.json({ webhooks: data ?? [] });
}

// POST — create webhook
export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await getOwnerId(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const url = (body.url ?? "").trim();
  if (!url || !url.startsWith("https://")) {
    return NextResponse.json({ error: "URL must start with https://" }, { status: 400 });
  }
  const events = (body.events ?? []).filter((e: string) => (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (events.length === 0) return NextResponse.json({ error: "At least one event required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("webhooks").insert({ rhank_id: rhank.id, url, events }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ webhook: data });
}
