import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string; webhookId: string }> };

async function isOwner(req: NextRequest, rhankId: string) {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  const userId = data.user?.id;
  if (!userId) return false;
  const { data: r } = await supabaseAdmin.from("rhanks").select("user_id").eq("id", rhankId).single();
  return r?.user_id === userId;
}

// PATCH — toggle active
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug, webhookId } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank || !(await isOwner(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { error } = await supabaseAdmin.from("webhooks").update({ active: !!body.active }).eq("id", webhookId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — remove webhook
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { slug, webhookId } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank || !(await isOwner(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabaseAdmin.from("webhooks").delete().eq("id", webhookId);
  return NextResponse.json({ ok: true });
}
