import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { participant_name, value, proof_url } = await req.json();

  if (!participant_name || value === undefined || value === null) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const num = Number(value);
  if (isNaN(num)) {
    return NextResponse.json({ error: "Value must be a number." }, { status: 400 });
  }

  const { data: rhank, error: rhankErr } = await supabase
    .from("rhanks")
    .select("id")
    .eq("slug", slug)
    .single();

  if (rhankErr || !rhank) {
    return NextResponse.json({ error: "Rhank not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("entries")
    .insert({
      rhank_id: rhank.id,
      participant_name,
      value: num,
      proof_url: proof_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
