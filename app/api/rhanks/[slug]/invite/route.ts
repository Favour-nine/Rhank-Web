import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { data: rhank } = await supabase
    .from("rhanks")
    .select("id, user_id, invite_token")
    .eq("slug", slug)
    .single();

  if (!rhank) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (rhank.user_id !== userData.user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let invite_token = rhank.invite_token as string | null;
  if (!invite_token) {
    invite_token = randomBytes(16).toString("hex");
    await supabase.from("rhanks").update({ invite_token }).eq("id", rhank.id);
  }

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;

  return NextResponse.json({ token: invite_token, url: `${baseUrl}/r/${slug}?invite=${invite_token}` });
}
