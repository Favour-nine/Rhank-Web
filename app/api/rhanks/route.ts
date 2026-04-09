import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  // Get authenticated user from bearer token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  let user_id: string | null = null;
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    user_id = data.user?.id ?? null;
  }

  if (!user_id) {
    return NextResponse.json({ error: "You must be signed in to create a Rhank." }, { status: 401 });
  }

  const { title, description, unit, direction, creator_name, latitude, longitude, location_name } = await req.json();

  if (!title || !unit || !direction || !creator_name) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!["high", "low"].includes(direction)) {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  const base = slugify(title);
  const suffix = Math.random().toString(36).slice(2, 7);
  const slug = `${base}-${suffix}`;

  const { data, error } = await supabase
    .from("rhanks")
    .insert({
      title,
      description: description || null,
      unit,
      direction,
      creator_name,
      slug,
      user_id,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      location_name: location_name || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug: data.slug }, { status: 201 });
}
