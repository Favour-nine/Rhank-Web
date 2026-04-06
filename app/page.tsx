"use client";

import React, { useState } from "react";
import ThreeBg from "@/components/ThreeBg";
import NavBar from "@/components/NavBar";
import HeroCtaPanel from "@/components/HeroCtaPanel";
import FadeUp from "@/components/FadeUp";
import { Bebas_Neue } from "next/font/google";
// bebas is used by StepCard and other sub-components via closure

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});

const BRANDS = [
  { name: "Nike", file: "nike-6.svg" },
  { name: "Starbucks", file: "starbucks-logo-ab-2011.svg" },
  { name: "Red Bull", file: "redbullenergydrink-1.svg" },
  { name: "Discord", file: "discord-wordmark-1.svg" },
  { name: "Twitch", file: "twitch-blacklogo.svg" },
  { name: "Adidas", file: "adidas2.svg" },
  { name: "Spotify", file: "spotify-logo.svg" },
  { name: "Puma", file: "puma-logo.svg" },
  { name: "ESPN", file: "espn.svg" },
  { name: "Hublot", file: "hublot-logo-1.svg" },
  { name: "Nintendo", file: "nintendo-4.svg" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen text-white">
      <ThreeBg />
      <NavBar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-32">
        <div className="max-w-2xl">
          <FadeUp>
            <h1 className={`${bebas.className} text-7xl md:text-[10rem] tracking-[0.03em] leading-[0.88]`}>
              Rhank<br />anything.<br />Earn<br />your place.
            </h1>
          </FadeUp>

          <FadeUp delay={150}>
            <p className="mt-8 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              Create a public leaderboard for literally anything. The tallest, the fastest,
              the most loyal. Set the rules, people enter, the board ranks them live.
              Reach #1 and earn Rhank tokens.
            </p>
          </FadeUp>

          <FadeUp delay={300}>
            <div className="mt-10">
              <HeroCtaPanel />
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20 border border-white/20">
            <FeatureCard title="Create a Rhank" desc="Any subject, any group, any scale. Set the rules and open it up." />
            <FeatureCard title="Enter & compete" desc="Join any Rhank and get placed on the live leaderboard instantly." />
            <FeatureCard title="Earn tokens" desc="Reach #1 and earn Rhank tokens. The harder the Rhank, the more it's worth." />
          </div>
        </FadeUp>
      </section>

      {/* White section — How it works + Why + Carousel */}
      <div id="white-section" className="relative bg-white text-black">

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <FadeUp>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-black/40 mb-3">How it works</p>
            <h2 className={`${bebas.className} text-6xl md:text-7xl text-black`}>Three steps. Any subject.</h2>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="mt-10 grid gap-0 md:grid-cols-3 border border-black/10">
              <StepCard num="01" title="Create a Rhank" body="Pick a subject: tallest, strongest, best dressed, most loyal. Set the rules and open it up." />
              <StepCard num="02" title="Enter & get ranked" body="Anyone can join. Submit your entry, get placed on the leaderboard, and see where you stand." />
              <StepCard num="03" title="Top the board" body="Reach #1 and earn Rhank tokens. The harder the Rhank, the more it's worth." />
            </div>
          </FadeUp>
        </section>

        {/* Why Rhank */}
        <section id="why" className="bg-[#ffe600] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeUp>
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-black/50 mb-3">Why Rhank</p>
              <h2 className={`${bebas.className} text-6xl md:text-7xl text-black`}>Leaderboards for everyone.</h2>
              <p className="mt-6 max-w-2xl text-black/70 leading-relaxed text-lg">
                Leaderboards exist everywhere: sports, games, business. But they're always built
                for institutions. Rhank puts that power in anyone's hands. A teacher, a coffee shop,
                a friend group. If there's a comparison to be made, there's a Rhank for it.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* Brand carousel */}
        <section id="phase1" className="bg-[#ffe600] py-14">
          <p className="text-center text-[10px] tracking-[0.22em] uppercase text-black/40 mb-8">
            Brands we want to Rhank with
          </p>
          <DraggableCarousel />
        </section>

      </div>

      {/* Notify */}
      <section id="register" className="mx-auto max-w-6xl px-6 py-20 text-white">
        <FadeUp>
          <div className="grid gap-12 md:grid-cols-2 md:items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/60 mb-3">Early access</p>
              <h2 className={`${bebas.className} text-6xl md:text-7xl`}>Be first in line.</h2>
              <p className="mt-6 text-white/70 leading-relaxed text-lg">
                Drop your name and email. We'll reach out the moment you can create your first Rhank.
              </p>
              <p className="mt-3 text-xs text-white/40">No spam. One email when we launch.</p>
            </div>
            <div className="border border-white/25 bg-white/10 backdrop-blur p-8">
              <NotifyForm />
            </div>
          </div>
        </FadeUp>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white text-black">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <FadeUp>
            <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-black/40 mb-3">FAQ</p>
            <h2 className={`${bebas.className} text-6xl md:text-7xl text-black mb-10`}>Questions.</h2>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="grid gap-px md:grid-cols-2 border border-black/10 bg-black/10">
              <FaqCard q="What can you Rhank?" a="Literally anything. If there's a way to compare people, you can build a Rhank for it." />
              <FaqCard q="How do Rhank tokens work?" a="When you reach #1 on a leaderboard, you earn Rhank tokens. The more competitive the Rhank, the greater the reward." />
              <FaqCard q="Who can create a Rhank?" a="Anyone. Teachers, shop owners, friends, communities. If you have a comparison in mind, you can create a Rhank." />
              <FaqCard q="When does Rhank launch?" a="We're building now. Leave your email above and you'll be the first to know." />
            </div>
          </FadeUp>
        </div>
      </section>

      <footer className="bg-[#1450d8] border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-white/40">
          © {new Date().getFullYear()} Rhank. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function NotifyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="py-6 text-center">
        <p className="text-white font-semibold text-lg">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-white/60">We&apos;ll reach out the moment Rhank launches.</p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full border border-white/20 bg-white/10 px-4 py-3 outline-none focus:border-white/50 text-white placeholder:text-white/30 rounded-none"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="text-xs font-semibold tracking-[0.18em] uppercase text-white/60">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border border-white/20 bg-white/10 px-4 py-3 outline-none focus:border-white/50 text-white placeholder:text-white/30 rounded-none"
          placeholder="you@example.com"
        />
      </div>
      {message && <p className="text-sm text-yellow-300">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-white px-5 py-4 text-sm font-bold tracking-[0.18em] uppercase text-[#1a5fff] hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {status === "loading" ? "Submitting…" : "Notify me at launch"}
      </button>
    </form>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-[#1450d8]/60 backdrop-blur p-8">
      <div className="text-xs font-bold tracking-[0.18em] uppercase text-white/90 mb-3">{title}</div>
      <div className="text-sm leading-relaxed text-white/60">{desc}</div>
    </div>
  );
}

function StepCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="p-8 border-r border-black/10 last:border-r-0">
      <div className={`${bebas.className} text-5xl text-black/10 mb-4`}>{num}</div>
      <div className="text-base font-semibold text-black mb-2">{title}</div>
      <div className="text-sm leading-relaxed text-black/55">{body}</div>
    </div>
  );
}

function FaqCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white p-8">
      <div className="font-semibold text-black mb-2">{q}</div>
      <div className="text-sm text-black/55 leading-relaxed">{a}</div>
    </div>
  );
}

function DraggableCarousel() {
  const ref = React.useRef<HTMLDivElement>(null);
  const animRef = React.useRef<number>(0);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const speed = React.useRef(0.5);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Auto-scroll
    const tick = () => {
      if (!isDragging.current) {
        el.scrollLeft += speed.current;
        // Seamless loop: when we've scrolled half, reset to start
        if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft.current - (x - startX.current);
    };
    const onMouseUp = () => { isDragging.current = false; el.style.cursor = "grab"; };

    const onTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      startX.current = e.touches[0].pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft.current - (x - startX.current);
    };
    const onTouchEnd = () => { isDragging.current = false; };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(animRef.current);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#ffe600] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#ffe600] to-transparent z-10" />
      <div
        ref={ref}
        className="flex whitespace-nowrap overflow-x-scroll select-none"
        style={{ scrollbarWidth: "none", cursor: "grab" }}
      >
        {[...BRANDS, ...BRANDS].map((brand, i) => (
          <div key={i} className="mx-10 shrink-0 flex items-center justify-center w-24 h-10">
            <img src={`/logos/${brand.file}`} alt={brand.name} className="max-h-full max-w-full w-auto h-auto opacity-50 object-contain" draggable={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
