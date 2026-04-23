import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string; memberId: string }> };

const getCallerAndRhank = async (req: NextRequest, slug: string) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: "Unauthorized.", status: 401 };
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return { error: "Unauthorized.", status: 401 };
  const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
  if (!rhank) return { error: "Not found.", status: 404 };
  return { user: userData.user, rhank, token };
};

// PATCH — approve/reject (owner) OR claim member record (any logged-in user)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, memberId } = await params;
  const body = await req.json();

  const result = await getCallerAndRhank(req, slug);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { user, rhank } = result;

  // Claim — link a logged-in user to an unclaimed member record
  if (body.claim) {
    const { data: member } = await supabase.from("members").select("user_id, status").eq("id", memberId).single();
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
    if (member.user_id) return NextResponse.json({ error: "This spot is already claimed." }, { status: 409 });

    const { data, error } = await supabase
      .from("members")
      .update({ user_id: user.id })
      .eq("id", memberId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Owner-only actions
  if (rhank.user_id !== user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { status } = body;
  if (!["active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("members")
    .update({ status })
    .eq("id", memberId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove a member (owner only)
export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug, memberId } = await params;

  const result = await getCallerAndRhank(req, slug);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  const { user, rhank } = result;

  if (rhank.user_id !== user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
