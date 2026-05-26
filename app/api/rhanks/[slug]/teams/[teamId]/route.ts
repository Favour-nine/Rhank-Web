import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string; teamId: string }> };

async function isOwner(req: NextRequest, rhankId: string) {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  const userId = data.user?.id;
  if (!userId) return false;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("user_id").eq("id", rhankId).single();
  return rhank?.user_id === userId;
}

// PATCH — rename team or assign member to team
// Body: { name?, color? }  OR  { member_id, team_id }
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug, teamId } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isOwner(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Assign a member to this team
  if ("member_id" in body) {
    const { error } = await supabaseAdmin
      .from("members")
      .update({ team_id: body.member_id ? teamId : null })
      .eq("id", body.member_id)
      .eq("rhank_id", rhank.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Rename/recolor team
  const update: Record<string, string> = {};
  if (body.name) update.name = body.name.trim();
  if (body.color) update.color = body.color;
  const { error } = await supabaseAdmin.from("teams").update(update).eq("id", teamId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — delete team (members become unassigned)
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { slug, teamId } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isOwner(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabaseAdmin.from("teams").delete().eq("id", teamId);
  return NextResponse.json({ ok: true });
}
