import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string }> };

// GET — list members for a rhank
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const { data: rhank } = await supabase.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("rhank_id", rhank.id)
    .order("balance", { ascending: false });

  return NextResponse.json(data ?? []);
}

// POST — join or request to join (or owner-add, always active)
export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { name, owner_add } = await req.json();

  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  // Get optional auth
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  let user_id: string | null = null;
  let callerId: string | null = null;
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user_id = data.user?.id ?? null;
    callerId = user_id;
  }

  const { data: rhank } = await supabase
    .from("rhanks")
    .select("id, join_mode, user_id")
    .eq("slug", slug)
    .single();

  if (!rhank) return NextResponse.json({ error: "Rhank not found." }, { status: 404 });

  const isOwner = callerId && rhank.user_id === callerId;

  // Owner-add always active; open join = active; request/invite = pending
  let status: "active" | "pending";
  if (isOwner && owner_add) {
    status = "active";
  } else if (rhank.join_mode === "open") {
    status = "active";
  } else {
    status = "pending";
  }

  // Members added by owner don't carry the owner's user_id
  const memberUserId = owner_add ? null : user_id;

  const { data, error } = await supabase
    .from("members")
    .insert({ rhank_id: rhank.id, name: name.trim(), user_id: memberUserId, status, balance: 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member: data, status }, { status: 201 });
}
