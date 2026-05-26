"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FollowButton({ slug }: { slug: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }
      setAuthed(true);
      const res = await fetch(`/api/rhanks/${slug}/follow`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const json = await res.json();
      setFollowing(json.following ?? false);
      setLoading(false);
    });
  }, [slug]);

  const toggle = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    setLoading(true);
    const res = await fetch(`/api/rhanks/${slug}/follow`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const json = await res.json();
    setFollowing(json.following ?? false);
    setLoading(false);
  };

  if (!authed) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 border px-6 py-3 text-sm font-semibold tracking-[0.18em] uppercase transition-colors disabled:opacity-50 ${
        following
          ? "border-[#ffe600]/60 text-[#ffe600] hover:bg-[#ffe600]/10"
          : "border-white/25 text-white hover:bg-white/10"
      }`}
    >
      {loading ? "…" : following ? "✓ Following" : "Follow"}
    </button>
  );
}
