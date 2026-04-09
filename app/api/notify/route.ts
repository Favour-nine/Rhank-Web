import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
    return NextResponse.json({ error: "Signups are not available yet." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

  try {
    const { name, email } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ") || "";

    const { error } = await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email: email.trim().toLowerCase(),
      firstName,
      lastName,
      unsubscribed: false,
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already exists") || error.name === "validation_error") {
        return NextResponse.json({ error: "This email is already on the list." }, { status: 409 });
      }
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notify route error:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
