"use client";

import React, { useState } from "react";
import ThreeBg from "@/components/ThreeBg";
import NavBar from "@/components/NavBar";
import HeroCtaPanel from "@/components/HeroCtaPanel";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});

const BRANDS = [
  "Nike", "Starbucks", "Red Bull", "Discord", "Twitch",
  "Adidas", "Gymshark", "Spotify", "Puma", "ESPN",
];



export default function Home() {
  return (
    <main className="relative min-h-screen text-white">
      <ThreeBg />
      <NavBar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-28">
        <div className="max-w-2xl">
          <h1 className={`${bebas.className} text-7xl md:text-9xl tracking-[0.05em] leading-[0.9]`}>
            Rhank anything.
            <br />
            Earn your place.
          </h1>

          <p className="mt-6 text-pretty text-base leading-relaxed text-white/70 md:text-lg">
            Rhank is a platform where anyone can create a public leaderboard — called a Rhank             for literally any comparison. The tallest person in a class, the most loyal customer
            at a coffee shop, the fastest sprinter on a team. You set the subject, people enter,
            and the board ranks them live. Reach #1 and you earn Rhank tokens. No institution needed.
            Any person, any group, any category.
          </p>

          {/* CTA row */}
          <div className="mt-10">
            <HeroCtaPanel />
          </div>

          <div className="mt-12 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
              <FeatureCard
                title="Create a Rhank"
                desc="Set a category, invite people. Any subject, any group, any scale."
              />
              <FeatureCard
                title="Enter & compete"
                desc="Join any Rhank and get ranked. The board is public and live."
              />
              <FeatureCard
                title="Earn tokens"
                desc="Max out a Rhank and earn Rhank tokens. Top the board, own the rank."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grey content area */}
      <div id="white-section" className="relative bg-white text-black">

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold md:text-3xl text-black">How it works</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <CardDark
              title="1) Create a Rhank"
              body="Pick a subject — tallest, strongest, best dressed, most loyal customer. Set the rules and open it up."
            />
            <CardDark
              title="2) Enter & get ranked"
              body="Anyone can join a Rhank. Submit your entry, get placed on the leaderboard, and see where you stand."
            />
            <CardDark
              title="3) Top the board"
              body="Reach #1 in a Rhank and earn Rhank tokens. The harder the Rhank, the more it’s worth."
            />
          </div>
        </section>

        {/* Why */}
        <section id="why" className="mx-auto max-w-6xl px-6 py-14">
          <div className="border border-black/10 p-8">
            <h2 className="text-2xl font-semibold md:text-3xl text-black">Why Rhank</h2>
            <p className="mt-4 text-black/60 leading-relaxed">
              Leaderboards exist everywhere — sports, games, business — but they’re always built
              for institutions. Rhank puts that power in anyone’s hands. A teacher can rank students
              by participation. A coffee shop can rank loyal customers. A friend group can rank
              literally anything. If there’s a comparison to be made, there’s a Rhank for it.
            </p>
          </div>
        </section>

        {/* Brand carousel */}
        <section id="phase1" className="py-14 border-t border-black/8">
          <p className="text-center text-[10px] tracking-[0.22em] uppercase text-black/30 mb-8">
            Brands we want to Rhank with
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-marquee whitespace-nowrap">
              {[...BRANDS, ...BRANDS].map((brand, i) => (
                <span
                  key={i}
                  className="mx-12 text-sm font-semibold tracking-[0.18em] uppercase text-black/25 shrink-0"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Notify */}
      <section id="register" className="mx-auto max-w-6xl px-6 py-14 text-white">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Get notified at launch</h2>
            <p className="mt-4 text-white/60 leading-relaxed">
              Rhank is in development. Drop your email and we’ll let you know
              the moment you can create your first Rhank.
            </p>
            <p className="mt-3 text-xs text-white/40">
              No spam. One email when we launch.
            </p>
          </div>

          <div className="border border-white/15 bg-black/30 backdrop-blur p-6">
            <NotifyForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-14 pb-24 text-white">
        <h2 className="text-2xl font-semibold md:text-3xl">FAQ</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <FaqDark
            q="What can you Rhank?"
            a="Literally anything. If there’s a way to compare people, you can build a Rhank for it."
          />
          <FaqDark
            q="How do Rhank tokens work?"
            a="When you reach #1 on a leaderboard, you earn Rhank tokens. The more competitive the Rhank, the greater the reward."
          />
          <FaqDark
            q="Who can create a Rhank?"
            a="Anyone. Teachers, shop owners, friends, communities if you have a comparison in mind, you can create a Rhank."
          />
          <FaqDark
            q="When does Rhank launch?"
            a="We’re building now. Leave your email above and you’ll be the first to know."
          />
        </div>
      </section>

      <footer className="border-t border-white/10">
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
        <p className="text-white font-semibold">You&apos;re on the list.</p>
        <p className="mt-2 text-sm text-white/50">We&apos;ll reach out the moment Rhank launches.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm text-white/60">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-none border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-white/30 text-white"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="text-sm text-white/60">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-none border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-white/30 text-white"
          placeholder="you@example.com"
        />
      </div>
      {message && <p className="text-sm text-red-400">{message}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-none bg-white px-5 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50"
      >
        {status === "loading" ? "Submitting…" : "Notify me at launch"}
      </button>
    </form>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className={cn(
        "group relative aspect-square border border-white/10 bg-black/30 backdrop-blur p-7 transition",
        "hover:border-white/20"
      )}
    >
      <div className="text-sm font-semibold tracking-[0.14em] uppercase text-white/90">
        {title}
      </div>

      <div className="mt-3 text-sm leading-relaxed text-white/65">{desc}</div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-white/30 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}


function CardDark({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="border border-black/10 p-6">
      <div className="text-lg font-semibold text-black">{title}</div>
      <div className="mt-3 text-sm leading-relaxed text-black/60">{body}</div>
    </div>
  );
}

function FaqDark({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-white/15 bg-black/20 backdrop-blur p-6">
      <div className="font-semibold">{q}</div>
      <div className="mt-2 text-sm text-white/60 leading-relaxed">{a}</div>
    </div>
  );
}
