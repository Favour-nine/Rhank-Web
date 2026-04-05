"use client";

import { useEffect, useState } from "react";
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

function MobileMenu({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  // Prevent SSR/first render issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-[#1a5fff]/90 backdrop-blur-md"
        onClick={close}
      />

      {/* content panel */}
      <div
        className="relative h-full w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed X (no border) */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={close}
          className="absolute right-6 top-4 p-2 text-white/90 hover:text-white transition-colors"
        >
          <span className="sr-only">Close</span>
          <span className="relative block h-5 w-6">
            <span className="absolute left-0 top-[9px] h-[1px] w-6 bg-current rotate-45" />
            <span className="absolute left-0 top-[9px] h-[1px] w-6 bg-current -rotate-45" />
          </span>
        </button>

        <div className="mx-auto h-full max-w-6xl px-6 pt-4 pb-10">
          <div className="mb-8 py-2">
            <Image src="/r_white.svg" alt="Rhank" width={32} height={14} />
          </div>
          <div className="border-t border-white/20 pt-10">
            <nav className={`${bebas.className} flex flex-col gap-7 text-2xl tracking-[0.12em] uppercase text-white/90`}>
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={close}
                  className="hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="mt-10 border-t border-white/20 pt-8">
              <a
                href="#register"
                onClick={close}
                className="
                  inline-flex w-full items-center justify-center
                  border border-white/30
                  px-5 py-4
                  text-[11px] font-semibold tracking-[0.26em] uppercase
                  text-white
                  hover:bg-white hover:text-black
                  transition-colors duration-200
                "
              >
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

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [bg, setBg] = useState<"blue" | "white" | "yellow">("blue");

  useEffect(() => {
    const update = () => {
      const NAVBAR_H = 64;
      // Check yellow sections first (they're inside white-section)
      for (const id of ["why", "phase1"]) {
        const el = document.getElementById(id);
        if (el) {
          const { top, bottom } = el.getBoundingClientRect();
          if (top <= NAVBAR_H && bottom > NAVBAR_H) { setBg("yellow"); return; }
        }
      }
      const ws = document.getElementById("white-section");
      if (ws) {
        const { top, bottom } = ws.getBoundingClientRect();
        if (top <= NAVBAR_H && bottom > NAVBAR_H) { setBg("white"); return; }
      }
      setBg("blue");
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`sticky top-0 z-20 backdrop-blur transition-colors duration-300 ${bg === "white" ? "bg-white/90" : bg === "yellow" ? "bg-[#ffe600]/90" : "bg-[#1a5fff]/70"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Brand */}
          <a href="#" className="flex items-center">
            <Image
              src={bg === "blue" ? "/r_white.svg" : "/r_black.svg"}
              alt="Rhank"
              width={32}
              height={14}
              priority
            />
          </a>

          {/* Desktop nav */}
          <nav className={`hidden items-center gap-8 text-[11px] font-medium tracking-[0.26em] uppercase md:flex transition-colors duration-300 ${bg === "blue" ? "text-white/60" : "text-black/50"}`}>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`transition-colors ${bg === "blue" ? "hover:text-white" : "hover:text-black"}`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <a
            href="#register"
            className={`hidden md:inline-flex border px-5 py-3 text-[11px] font-semibold tracking-[0.26em] uppercase transition-colors duration-200 ${bg === "blue" ? "border-white/20 text-white hover:bg-white hover:text-black" : "border-black/20 text-black hover:bg-black hover:text-white"}`}
          >
            Secure your Rhank
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`md:hidden inline-flex items-center justify-center p-2 transition-colors ${bg === "blue" ? "text-white/90 hover:text-white" : "text-black/70 hover:text-black"}`}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-5 w-6">
              <span
                className={[
                  "absolute left-0 top-[2px] h-[1px] w-6 bg-current transition-transform duration-200",
                  open ? "translate-y-[8px] rotate-45 opacity-0" : "",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[9px] h-[1px] w-6 bg-current transition-opacity duration-200",
                  open ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute left-0 top-[16px] h-[1px] w-6 bg-current transition-transform duration-200",
                  open ? "-translate-y-[6px] -rotate-45 opacity-0" : "",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Full screen portal menu */}
      <MobileMenu open={open} close={close} />
    </>
  );
}
