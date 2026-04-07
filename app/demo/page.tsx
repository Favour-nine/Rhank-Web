"use client";

import Link from "next/link";
import ThreeBg from "@/components/ThreeBg";
import AppNav from "@/components/AppNav";
import TopSpotCarousel from "@/components/TopSpotCarousel";

export default function DemoPage() {
  return (
    <main className="relative min-h-screen text-black" style={{ backgroundColor: "#ffe600" }}>
      <ThreeBg bgColor={0xffe600} />
      <AppNav variant="yellow" />
      <div className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100vh - 64px)" }}>

      <div className="relative z-10 max-w-xl w-full text-center">
        <div className="mb-12 w-full">
          <TopSpotCarousel />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/rhanks/new"
            className="inline-flex items-center justify-center bg-black px-8 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#ffe600] hover:bg-black/80 transition-colors"
          >
            + Create a Rhank
          </Link>
          <Link
            href="/rhanks"
            className="inline-flex items-center justify-center border border-black/25 px-8 py-4 text-sm font-semibold tracking-[0.18em] uppercase text-black hover:bg-black/10 transition-colors"
          >
            View all Rhanks
          </Link>
        </div>

        <div className="mt-16 border-t border-black/10 pt-8">
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] uppercase text-black/30 hover:text-black/60 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </div>
      </div>
    </main>
  );
}
