import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "signups.json");

async function readSignups(): Promise<{ name: string; email: string; createdAt: string }[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeSignups(signups: { name: string; email: string; createdAt: string }[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(signups, null, 2));
}

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const signups = await readSignups();

  const already = signups.find((s) => s.email.toLowerCase() === email.toLowerCase().trim());
  if (already) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
  }

  signups.push({ name: name.trim(), email: email.toLowerCase().trim(), createdAt: new Date().toISOString() });
  await writeSignups(signups);

  return NextResponse.json({ ok: true });
}
