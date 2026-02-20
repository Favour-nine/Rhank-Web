"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PanelKey = "secure" | "how";

export default function HeroCtaPanel() {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;

    const onDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;

      // If click is outside the CTA block, close it
      if (!el.contains(e.target as Node)) setOpen(null);
    };

    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const content = useMemo(() => {
    if (open === "secure") {
      return {
        title: "Secure your Rhank",
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-black/70">
            <p>
              Register once to reserve your Rhank position. Phase 1 focuses on a
              clean, fair entry system with anti-abuse protections.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Unique Rhank ID</li>
              <li>Early access status</li>
              <li>Duplicate &amp; bot protection</li>
            </ul>
            <div className="pt-2">
              <a
                href="#register"
                className="inline-flex border border-black/20 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-black transition-colors hover:bg-black hover:text-white"
              >
                Go to registration
              </a>
            </div>
          </div>
        ),
      };
    }

    if (open === "how") {
      return {
        title: "How it works",
        body: (
          <div className="space-y-3 text-sm leading-relaxed text-black/70">
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <span className="font-semibold text-black">Register</span> —
                choose a username and verify once.
              </li>
              <li>
                <span className="font-semibold text-black">
                  Secure your place
                </span>{" "}
                — your position is reserved early.
              </li>
              <li>
                <span className="font-semibold text-black">Participate</span> —
                leaderboards and community ranking layers come later.
              </li>
            </ol>
            <div className="pt-2">
              <a
                href="#how"
                className="inline-flex border border-black/20 px-4 py-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-black transition-colors hover:bg-black hover:text-white"
              >
                Read more below
              </a>
            </div>
          </div>
        ),
      };
    }

    return null;
  }, [open]);

  const toggle = (key: PanelKey) => setOpen((prev) => (prev === key ? null : key));

  return (
    // FULL WIDTH: fill the hero container
    <div ref={rootRef} className="mt-10 w-full">
      {/* Buttons sit on a hairline divider */}
      <div className="flex items-stretch border-t border-white/15">
        <button
          type="button"
          onClick={() => toggle("secure")}
          className={[
            "flex-1 border-r border-white/15 px-6 py-4 text-center text-xs font-semibold tracking-[0.22em] uppercase transition-colors",
            open === "secure"
              ? "bg-white text-black"
              : "bg-white/90 text-black hover:bg-white",
          ].join(" ")}
        >
          Secure your Rhank
        </button>

        <button
          type="button"
          onClick={() => toggle("how")}
          className={[
            "flex-1 px-6 py-4 text-center text-xs font-semibold tracking-[0.22em] uppercase transition-colors",
            open === "how"
              ? "bg-white text-black"
              : "bg-transparent text-white/85 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          How it works
        </button>
      </div>

      {/* Sliding panel (full width) */}
      <div
        className={[
          "overflow-hidden transition-[max-height,opacity] duration-500 ease-out",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        {/* Force full width under the CTA row */}
        <div className="w-full border-t border-white/15 bg-white">
          <div className="w-full px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="text-[11px] font-semibold tracking-[0.22em] uppercase text-black/80">
                {content?.title}
              </div>

              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-black/50 transition-colors hover:text-black"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">{content?.body}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
