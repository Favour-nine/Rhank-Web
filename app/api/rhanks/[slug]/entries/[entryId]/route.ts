import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string; entryId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, entryId } = await params;
  const body = await req.json();

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (body.claim) {
    const { data: rhank } = await supabase.from("rhanks").select("id").eq("slug", slug).single();
    if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const { data: entry } = await supabase
      .from("entries")
      .select("id, rhank_id, user_id")
      .eq("id", entryId)
      .single();

    if (!entry || entry.rhank_id !== rhank.id) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    if (entry.user_id) {
      return NextResponse.json({ error: "This entry has already been claimed." }, { status: 409 });
    }

    const { error } = await supabase
      .from("entries")
      .update({ user_id: userData.user.id })
      .eq("id", entryId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
