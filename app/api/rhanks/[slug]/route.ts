import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const body = await req.json();

  // Verify caller
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Claim — sets user_id on ownerless rhanks
  if (body.claim) {
    const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
    if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (rhank.user_id) return NextResponse.json({ error: "This Rhank already has an owner." }, { status: 409 });

    const { error } = await supabase.from("rhanks").update({ user_id: userData.user.id }).eq("slug", slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Update direction (owner only)
  const { direction } = body;
  if (!["high", "low"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  const { data: rhank } = await supabase.from("rhanks").select("user_id").eq("slug", slug).single();
  if (!rhank || rhank.user_id !== userData.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await supabase.from("rhanks").update({ direction }).eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { data, error } = await supabase.from("rhanks").select("*").eq("slug", slug).single();
  if (error || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(data);
}
