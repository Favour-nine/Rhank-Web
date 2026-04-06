"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why Rhank" },
  { href: "#phase1", label: "Phase 1" },
  { href: "#faq", label: "FAQ" },
];

function MobileMenu({ open, close }: { open: boolean; close: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-[#1a5fff]/90 backdrop-blur-md" onClick={close} />
      <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Close menu" onClick={close} className="absolute right-6 top-4 p-2 text-white/90 hover:text-white transition-colors">
          <span className="sr-only">Close</span>
          <span className="relative block h-5 w-6">
            <span className="absolute left-0 top-[9px] h-[1px] w-6 bg-current rotate-45" />
            <span className="absolute left-0 top-[9px] h-[1px] w-6 bg-current -rotate-45" />
          </span>
        </button>
        <div className="mx-auto h-full max-w-6xl px-6 pt-4 pb-8">
          <div className="mb-6 py-2">
            <Image src="/Rhank_White.svg" alt="Rhank" width={24} height={10} />
          </div>
          <div className="border-t border-white/20 pt-7">
            <nav className={`${bebas.className} flex flex-col gap-5 text-lg tracking-[0.12em] uppercase text-white/90`}>
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={close} className="hover:text-white transition-colors">{l.label}</a>
              ))}
            </nav>
            <div className="mt-8 border-t border-white/20 pt-6">
              <a href="#register" onClick={close} className="inline-flex w-full items-center justify-center border border-white/30 px-5 py-3 text-[10px] font-semibold tracking-[0.26em] uppercase text-white hover:bg-white hover:text-black transition-colors duration-200">
                Secure your Rhank
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

type BgType = "blue" | "white" | "yellow";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [bg, setBg] = useState<BgType>("blue");
  const prevBg = useRef<BgType>("blue");

  useEffect(() => {
    const H = 64;

    const update = () => {
      const ids: { id: string; color: BgType }[] = [
        { id: "why",    color: "yellow" },
        { id: "phase1", color: "yellow" },
        { id: "faq",    color: "white"  },
        { id: "how",    color: "white"  },
        { id: "white-section", color: "white" },
      ];

      for (const { id, color } of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= H && bottom > H) {
          if (prevBg.current !== color) { prevBg.current = color; setBg(color); }
          return;
        }
      }

      if (prevBg.current !== "blue") { prevBg.current = "blue"; setBg("blue"); }
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  const bgClass = bg === "white" ? "bg-white/95" : bg === "yellow" ? "bg-[#ffe600]" : "bg-[#1a5fff]/80";
  const textClass = bg === "blue" ? "text-white/60" : "text-black/50";
  const hoverClass = bg === "blue" ? "hover:text-white" : "hover:text-black";
  const ctaClass = bg === "blue"
    ? "border-white/20 text-white hover:bg-white hover:text-[#1a5fff]"
    : "border-black/20 text-black hover:bg-black hover:text-white";
  const hamClass = bg === "blue" ? "text-white/90" : "text-black/70";

  return (
    <>
      <header className={`sticky top-0 z-20 backdrop-blur-md ${bgClass}`} style={{ transition: "background-color 0.4s ease" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Brand */}
          <a href="#" className="relative flex items-center" style={{ width: 80, height: 24 }}>
            <img
              src="/Rhank_White.svg"
              alt="Rhank"
              style={{ position: "absolute", height: 24, width: "auto", transition: "opacity 0.3s ease", opacity: bg === "blue" ? 1 : 0 }}
            />
            <img
              src="/Rhank_Black.svg"
              alt="Rhank"
              style={{ position: "absolute", height: 24, width: "auto", transition: "opacity 0.3s ease", opacity: bg === "blue" ? 0 : 1 }}
            />
          </a>

          {/* Desktop nav */}
          <nav className={`hidden items-center gap-8 text-[11px] font-medium tracking-[0.26em] uppercase md:flex ${textClass}`} style={{ transition: "color 0.3s ease" }}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`transition-colors ${hoverClass}`}>{l.label}</a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <a href="#register" className={`hidden md:inline-flex border px-5 py-3 text-[11px] font-semibold tracking-[0.26em] uppercase transition-colors duration-300 ${ctaClass}`}>
            Secure your Rhank
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`md:hidden inline-flex items-center justify-center p-2 transition-colors ${hamClass}`}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-5 w-6">
              <span className={["absolute left-0 top-[2px] h-[1px] w-6 bg-current transition-transform duration-200", open ? "translate-y-[8px] rotate-45 opacity-0" : ""].join(" ")} />
              <span className={["absolute left-0 top-[9px] h-[1px] w-6 bg-current transition-opacity duration-200", open ? "opacity-0" : "opacity-100"].join(" ")} />
              <span className={["absolute left-0 top-[16px] h-[1px] w-6 bg-current transition-transform duration-200", open ? "-translate-y-[6px] -rotate-45 opacity-0" : ""].join(" ")} />
            </span>
          </button>
        </div>
      </header>

      <MobileMenu open={open} close={close} />
    </>
  );
}
