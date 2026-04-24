import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string }> };

const getOwner = async (req: NextRequest, slug: string) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: "Unauthorized.", status: 401 as const };
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return { error: "Unauthorized.", status: 401 as const };
  const { data: rhank } = await supabase.from("rhanks").select("*").eq("slug", slug).single();
  if (!rhank) return { error: "Not found.", status: 404 as const };
  if (rhank.user_id !== userData.user.id) return { error: "Forbidden.", status: 403 as const };
  return { user: userData.user, rhank };
};

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { data, error } = await supabase.from("rhanks").select("*").eq("slug", slug).single();
  if (error || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const body = await req.json();

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Claim ownerless rhank
  if (body.claim) {
    const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
    if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (rhank.user_id) return NextResponse.json({ error: "This Rhank already has an owner." }, { status: 409 });
    const { error } = await supabase.from("rhanks").update({ user_id: userData.user.id }).eq("slug", slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // All other updates require ownership
  const result = await getOwner(req, slug);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  // Full edit
  if (body.edit) {
    const { title, description, unit, direction, join_mode } = body;
    const updates: Record<string, unknown> = {};
    if (title?.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description || null;
    if (unit !== undefined) updates.unit = unit || null;
    if (direction && ["high", "low"].includes(direction)) updates.direction = direction;
    if (join_mode && ["open", "request", "invite"].includes(join_mode)) updates.join_mode = join_mode;

    const { data, error } = await supabase.from("rhanks").update(updates).eq("slug", slug).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Direction-only update (existing inline toggle)
  const { direction } = body;
  if (!["high", "low"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }
  const { error } = await supabase.from("rhanks").update({ direction }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const result = await getOwner(req, slug);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  // Delete members, entries, transactions, then the rhank
  const rhankId = result.rhank.id;
  await supabase.from("token_transactions").delete().eq("rhank_id", rhankId);
  await supabase.from("members").delete().eq("rhank_id", rhankId);
  await supabase.from("entries").delete().eq("rhank_id", rhankId);
  const { error } = await supabase.from("rhanks").delete().eq("id", rhankId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
