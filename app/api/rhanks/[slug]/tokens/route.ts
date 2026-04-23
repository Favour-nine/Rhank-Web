import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string }> };

// POST — award or deduct tokens (owner only)
export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { member_id, amount, reason } = await req.json();

  if (!member_id || amount === undefined || amount === 0) {
    return NextResponse.json({ error: "member_id and non-zero amount are required." }, { status: 400 });
  }

  // Verify owner
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: rhank } = await supabase.from("rhanks").select("id, user_id").eq("slug", slug).single();
  if (!rhank || rhank.user_id !== userData.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Insert transaction
  const { data: tx, error: txErr } = await supabase
    .from("token_transactions")
    .insert({ rhank_id: rhank.id, member_id, amount: Number(amount), reason: reason || null, created_by: userData.user.id })
    .select()
    .single();

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  // Update member balance
  const { data: member } = await supabase.from("members").select("balance").eq("id", member_id).single();
  const newBalance = (member?.balance ?? 0) + Number(amount);

  await supabase.from("members").update({ balance: newBalance }).eq("id", member_id);

  return NextResponse.json({ transaction: tx, new_balance: newBalance }, { status: 201 });
}

// GET — fetch transactions for a member
export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const member_id = searchParams.get("member_id");

  const { data: rhank } = await supabase.from("rhanks").select("id").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const query = supabase
    .from("token_transactions")
    .select("*")
    .eq("rhank_id", rhank.id)
    .order("created_at", { ascending: false });

  if (member_id) query.eq("member_id", member_id);

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
