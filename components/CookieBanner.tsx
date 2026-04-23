"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("rhank_cookie_consent")) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("rhank_cookie_consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#1a5fff]/95 backdrop-blur px-6 py-4">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[11px] text-white/60 leading-relaxed max-w-xl">
          We use strictly necessary cookies to keep you signed in and remember your session.
          No tracking or advertising cookies are used.{" "}
          <a href="/privacy" className="underline text-white/40 hover:text-white/70 transition-colors">
            Privacy policy
          </a>
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-white px-6 py-2.5 text-[11px] font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
