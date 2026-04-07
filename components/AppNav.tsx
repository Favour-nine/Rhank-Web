"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AppNav({ variant = "blue" }: { variant?: "blue" | "yellow" }) {
  const path = usePathname();
  const yellow = variant === "yellow";

  return (
    <header className={`sticky top-0 z-20 backdrop-blur-md ${yellow ? "bg-[#ffe600]" : "bg-[#1a5fff]/80"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/demo" className="flex items-center" style={{ height: 24 }}>
          <Image
            src={yellow ? "/Rhank_Black.svg" : "/Rhank_White.svg"}
            alt="Rhank"
            width={80}
            height={24}
            style={{ height: 24, width: "auto" }}
          />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-[11px] font-medium tracking-[0.26em] uppercase">
          <Link
            href="/rhanks"
            className={`transition-colors ${yellow
              ? path === "/rhanks" ? "text-black" : "text-black/50 hover:text-black"
              : path === "/rhanks" ? "text-white" : "text-white/50 hover:text-white"
            }`}
          >
            Browse
          </Link>
          <Link
            href="/rhanks/new"
            className={`border px-5 py-2.5 transition-colors duration-200 ${yellow
              ? "border-black/25 text-black hover:bg-black hover:text-[#ffe600]"
              : "border-white/25 text-white hover:bg-white hover:text-[#1a5fff]"
            }`}
          >
            + Create
          </Link>
        </nav>
      </div>
    </header>
  );
}
