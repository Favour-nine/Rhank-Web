import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = { params: Promise<{ slug: string }> };

async function isOwner(req: NextRequest, rhankId: string) {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const { data } = await supabaseAdmin.auth.getUser(auth.replace("Bearer ", ""));
  const userId = data.user?.id;
  if (!userId) return false;
  const { data: r } = await supabaseAdmin.from("rhanks").select("user_id").eq("id", rhankId).single();
  return r?.user_id === userId;
}

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\r\n");
}

// GET /api/rhanks/[slug]/export?type=entries|members|transactions
export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { data: rhank } = await supabaseAdmin.from("rhanks").select("id, type, unit").eq("slug", slug).single();
  if (!rhank) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isOwner(req, rhank.id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exportType = new URL(req.url).searchParams.get("type") ?? (rhank.type === "score" ? "entries" : "members");

  let csv = "";
  let filename = "";

  if (exportType === "entries") {
    const { data } = await supabaseAdmin
      .from("entries").select("participant_name, value, proof_url, created_at")
      .eq("rhank_id", rhank.id)
      .order("value", { ascending: false });
    csv = toCSV(["participant_name", "value", "proof_url", "created_at"], data ?? []);
    filename = `${slug}-entries.csv`;
  } else if (exportType === "members") {
    const { data } = await supabaseAdmin
      .from("members").select("name, balance, status, created_at")
      .eq("rhank_id", rhank.id)
      .order("balance", { ascending: false });
    csv = toCSV(["name", "balance", "status", "created_at"], data ?? []);
    filename = `${slug}-members.csv`;
  } else if (exportType === "transactions") {
    const { data } = await supabaseAdmin
      .from("token_transactions").select("member_id, amount, reason, created_at")
      .eq("rhank_id", rhank.id)
      .order("created_at", { ascending: false });
    csv = toCSV(["member_id", "amount", "reason", "created_at"], data ?? []);
    filename = `${slug}-transactions.csv`;
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
