import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { WebhookEvent } from "./supabase";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function fireWebhooks(
  rhankId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  const { data: hooks } = await supabaseAdmin
    .from("webhooks")
    .select("url, secret, events")
    .eq("rhank_id", rhankId)
    .eq("active", true);

  if (!hooks || hooks.length === 0) return;

  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

  await Promise.allSettled(
    hooks
      .filter((h) => (h.events as string[]).includes(event))
      .map((h) => {
        const sig = crypto
          .createHmac("sha256", h.secret)
          .update(body)
          .digest("hex");
        return fetch(h.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Rhank-Signature": `sha256=${sig}`,
            "X-Rhank-Event": event,
          },
          body,
        }).catch(() => null); // fire-and-forget; don't fail the main request
      })
  );
}
