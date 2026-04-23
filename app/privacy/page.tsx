import { Bebas_Neue } from "next/font/google";
import AppNav from "@/components/AppNav";
import ThreeBg from "@/components/ThreeBg";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

export const metadata = { title: "Privacy Policy — Rhank" };

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#1a5fff" }}>
      <ThreeBg />
      <AppNav />

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-24 md:pt-24">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-white/50 mb-3">Legal</p>
        <h1 className={`${bebas.className} text-6xl md:text-7xl leading-none mb-10`}>Privacy Policy.</h1>

        <div className="space-y-8 text-sm text-white/70 leading-relaxed">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white/30 mb-2">Last updated: April 2026</p>
            <p>Rhank (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates rhank.live. This policy explains what personal data we collect, why, and your rights under GDPR.</p>
          </div>

          <Section title="What we collect">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white/90">Account data</strong> — name and email address when you sign up.</li>
              <li><strong className="text-white/90">Leaderboard data</strong> — your display name, scores or token balances, and transaction history within leaderboards you join.</li>
              <li><strong className="text-white/90">Session data</strong> — an authentication token stored in your browser to keep you signed in.</li>
            </ul>
          </Section>

          <Section title="Why we collect it">
            <ul className="list-disc list-inside space-y-1">
              <li>To provide account authentication and session management.</li>
              <li>To display your position on leaderboards you have joined.</li>
              <li>To allow leaderboard creators to manage member token balances.</li>
            </ul>
            <p className="mt-3">Legal basis: performance of a contract (Article 6(1)(b) GDPR) and your explicit consent given at signup.</p>
          </Section>

          <Section title="What we do NOT do">
            <ul className="list-disc list-inside space-y-1">
              <li>We do not sell your data to third parties.</li>
              <li>We do not use advertising or tracking cookies.</li>
              <li>We do not share your data outside of the services necessary to operate Rhank (Supabase for database/auth, Vercel for hosting).</li>
            </ul>
          </Section>

          <Section title="Cookies and local storage">
            <p>We use browser localStorage only to store your authentication session token. This is strictly necessary for the service to function. No analytics or advertising scripts are loaded.</p>
          </Section>

          <Section title="Data retention">
            <p>Your account and leaderboard data is retained for as long as your account is active. You may request deletion at any time.</p>
          </Section>

          <Section title="Your rights (GDPR)">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white/90">Access</strong> — request a copy of your data.</li>
              <li><strong className="text-white/90">Rectification</strong> — correct inaccurate data.</li>
              <li><strong className="text-white/90">Erasure</strong> — request deletion of your account and associated data.</li>
              <li><strong className="text-white/90">Portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong className="text-white/90">Objection</strong> — object to processing of your data.</li>
            </ul>
            <p className="mt-3">To exercise any right, contact us at <strong className="text-white/90">jumiarmusic@gmail.com</strong>. We will respond within 30 days.</p>
          </Section>

          <Section title="Third-party processors">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white/90">Supabase</strong> (supabase.com) — database and authentication. Data stored in EU region.</li>
              <li><strong className="text-white/90">Vercel</strong> (vercel.com) — hosting and edge functions.</li>
            </ul>
          </Section>

          <Section title="Changes to this policy">
            <p>We may update this policy. The &ldquo;last updated&rdquo; date above will change when we do. Continued use of Rhank after changes constitutes acceptance.</p>
          </Section>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold tracking-[0.22em] uppercase text-white/90 mb-3">{title}</h2>
      {children}
    </div>
  );
}
