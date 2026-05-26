"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, WEBHOOK_EVENTS, type Webhook } from "@/lib/supabase";
import { INPUT_CLS_INLINE } from "@/lib/ui";

export default function WebhookManager({ slug }: { slug: string }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["entry.created"]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const fetchWebhooks = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/rhanks/${slug}/webhooks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setWebhooks(data.webhooks ?? []);
  }, [slug]);

  useEffect(() => { if (open) fetchWebhooks(); }, [open, fetchWebhooks]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || events.length === 0) return;
    setCreating(true);
    setError("");
    const token = await getToken();
    const res = await fetch(`/api/rhanks/${slug}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ url, events }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setCreating(false); return; }
    setUrl("");
    setEvents(["entry.created"]);
    setCreating(false);
    fetchWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    const token = await getToken();
    await fetch(`/api/rhanks/${slug}/webhooks/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    fetchWebhooks();
  };

  const toggleEvent = (ev: string) => {
    setEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors flex items-center gap-2"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Webhooks {webhooks.length > 0 && `(${webhooks.length})`}
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {/* Existing webhooks */}
          {webhooks.length > 0 && (
            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div key={wh.id} className="border border-white/10 px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-white/70 truncate">{wh.url}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{wh.events.join(", ")}</p>
                    <p className="text-[10px] text-white/20 mt-0.5 font-mono">secret: {wh.secret.slice(0, 12)}…</p>
                  </div>
                  <button onClick={() => deleteWebhook(wh.id)}
                    className="text-[10px] text-white/20 hover:text-red-400 transition-colors shrink-0">Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Create form */}
          <form onSubmit={create} className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-1.5 block">Endpoint URL (https://)</label>
              <input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className={`w-full ${INPUT_CLS_INLINE}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-1.5 block">Events</label>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => toggleEvent(ev)}
                    className={`text-[10px] px-3 py-1.5 border font-mono transition-colors ${
                      events.includes(ev)
                        ? "border-[#ffe600]/50 bg-[#ffe600]/10 text-white"
                        : "border-white/20 text-white/40 hover:border-white/40"
                    }`}
                  >
                    {ev}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={creating}
              className="border border-white/25 px-5 py-2 text-[11px] font-bold tracking-[0.15em] uppercase text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
            >
              {creating ? "Adding…" : "Add webhook"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
