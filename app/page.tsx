"use client";

import ThreeBg from "@/components/ThreeBg";
import NavBar from "@/components/NavBar";
import HeroCtaPanel from "@/components/HeroCtaPanel";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
});



export default function Home() {
  return (
    <main className="relative min-h-screen text-white">
      <ThreeBg />
      <NavBar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-14 md:pt-28">
        <div className="max-w-2xl">
          <h1 className={`${bebas.className} text-7xl md:text-9xl tracking-[0.05em] leading-[0.9]`}>
            Secure your place
            <br />
            in the Rhanks.
          </h1>

          <p className="mt-6 text-pretty text-base leading-relaxed text-white/70 md:text-lg">
            Rhank is a global, opt-in ranking system for everyday people.
            Register once to secure a unique Rhank ID and early access status.
          </p>

          {/* CTA row */}
          <div className="mt-10 ">
            <HeroCtaPanel />
          </div>

          <div className="mt-12 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
              <FeatureCard
                title="One entry"
                desc="Anti-abuse checks to reduce duplicates."
                icon="shield"
              />
              <FeatureCard
                title="Global rank"
                desc="A public global leaderboard."
                icon="globe"
              />
              <FeatureCard
                title="Future perks"
                desc="Early users may qualify for drops."
                icon="spark"
              />
            </div>

          </div>

        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card
            title="1) Register"
            body="Choose a username and verify once. You’ll receive a unique Rhank ID."
          />
          <Card
            title="2) Secure your place"
            body="Your rank is reserved early. Later, ranks can evolve with the system."
          />
          <Card
            title="3) Participate"
            body="Join or create leaderboards later. Phase 1 focuses on registration + global Rhanks."
          />
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold md:text-3xl">Why Rhank</h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Most ranking systems focus on celebrities and institutions. Rhank flips it:
            everyday people can opt in, secure a position, and be discoverable through
            community-made leaderboards—while keeping a global Rhanks layer as the anchor.
          </p>
        </div>
      </section>

      {/* Phase 1 */}
      <section id="phase1" className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold md:text-3xl">Phase 1: Registration & Rank MVP</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card
            title="What’s included"
            body={
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>Registration + unique Rhank ID assignment</li>
                <li>Global Rhanks (basic public leaderboard)</li>
                <li>Anti-abuse controls (rate limits, verification layer)</li>
              </ul>
            }
          />
          <Card
            title="What’s coming later"
            body={
              <ul className="list-disc pl-5 text-white/70 space-y-2">
                <li>User-made leaderboards</li>
                <li>Stronger uniqueness verification</li>
                <li>Eligibility-based airdrops/rewards (no promises)</li>
              </ul>
            }
          />
        </div>
      </section>

      {/* Register */}
      <section id="register" className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Secure your Rhank</h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              Register once to reserve your Rhank position. Phase 1 is focused on building
              a clean, fair entry system.
            </p>
            <p className="mt-3 text-xs text-white/50">
              Note: This is an early MVP. No profit promises. Rewards are eligibility-based.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
            <form className="space-y-4">
              <div>
                <label className="text-sm text-white/70">Username</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="e.g. cyril"
                />
              </div>
              <div>
                <label className="text-sm text-white/70">Email</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-white px-5 py-3 font-semibold text-black hover:bg-white/90"
              >
                Secure my rank
              </button>


              <p className="text-xs text-white/50">
                We’ll add verification + duplicate protection in Phase 1.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-14 pb-24">
        <h2 className="text-2xl font-semibold md:text-3xl">FAQ</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Faq
            q="Is this a memecoin or a product?"
            a="Phase 1 is product-first: registration + rank. Token details (if any) come later."
          />
          <Faq
            q="How do you limit one entry per person?"
            a="We’ll combine rate limits, verification, and anti-bot checks. Stronger methods can be added later."
          />
          <Faq
            q="Will everyone get an airdrop?"
            a="No promises. Early registration may qualify for future eligibility-based rewards."
          />
          <Faq
            q="When do user-made leaderboards arrive?"
            a="After Phase 1 proves demand and the entry system is stable."
          />
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-white/50">
          © {new Date().getFullYear()} Rhank. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: "shield" | "globe" | "spark";
}) {
  return (
    <div
      className={cn(
        "group relative aspect-square border border-white/10 bg-black/30 backdrop-blur p-7 transition",
        "hover:border-white/20"
      )}
    >
      <div className="mb-6 inline-flex h-11 w-11 items-center justify-center border border-white/15 bg-white/5">
        <Icon name={icon} />
      </div>

      <div className="text-sm font-semibold tracking-[0.14em] uppercase text-white/90">
        {title}
      </div>

      <div className="mt-3 text-sm leading-relaxed text-white/65">{desc}</div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-white/30 transition-all duration-300 group-hover:w-full" />
    </div>
  );
}

function Icon({ name }: { name: "shield" | "globe" | "spark" }) {
  const common = "h-5 w-5";
  const stroke = { stroke: "currentColor", strokeWidth: 1.5 };
  const cap = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (name === "shield") {
    return (
      <svg className={cn(common, "text-white/85")} viewBox="0 0 24 24" fill="none">
        <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" {...stroke} />
        <path d="M9 12l2 2 4-4" {...stroke} {...cap} />
      </svg>
    );
  }

  if (name === "globe") {
    return (
      <svg className={cn(common, "text-white/85")} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M3 12h18" {...stroke} {...cap} />
        <path d="M12 3c3 3 3 15 0 18" {...stroke} {...cap} />
        <path d="M12 3c-3 3-3 15 0 18" {...stroke} {...cap} />
      </svg>
    );
  }

  return (
    <svg className={cn(common, "text-white/85")} viewBox="0 0 24 24" fill="none">
      <path d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2z" {...stroke} {...cap} />
      <path d="M19 14l.7 3 2.3 1-2.3 1-.7 3-.7-3-2.3-1 2.3-1 .7-3z" {...stroke} {...cap} />
    </svg>
  );
}

function Card({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-3 text-sm leading-relaxed">{body}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
      <div className="font-semibold">{q}</div>
      <div className="mt-2 text-sm text-white/70 leading-relaxed">{a}</div>
    </div>
  );
}
