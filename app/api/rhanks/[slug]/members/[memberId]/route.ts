import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string; memberId: string }> };

// PATCH — approve/reject/update member (owner only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, memberId } = await params;
  const { status } = await req.json();

  if (!["active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  // Verify caller is owner
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
  if (!rhank || rhank.user_id !== userData.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
  if (!rhank || rhank.user_id !== userData.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
