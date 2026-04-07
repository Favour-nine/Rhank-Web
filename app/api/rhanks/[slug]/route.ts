import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { direction } = await req.json();

  if (!["high", "low"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  const { error } = await supabase
    .from("rhanks")
    .update({ direction })
    .eq("slug", slug);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
