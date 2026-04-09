import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: rhank } = await supabase
    .from("rhanks")
    .select("id, title, creator_name, unit, direction, location_name")
    .eq("slug", slug)
    .single();

  if (!rhank) return { title: "Rhank not found" };

  const { count: entryCount } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("rhank_id", rhank.id);

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const ogParams = new URLSearchParams({
    title: rhank.title,
    creator: rhank.creator_name,
    unit: rhank.unit,
    direction: rhank.direction,
    entries: String(entryCount ?? 0),
    ...(rhank.location_name ? { location: rhank.location_name } : {}),
  });

  const ogImage = `${baseUrl}/api/og?${ogParams.toString()}`;
  const pageUrl = `${baseUrl}/r/${slug}`;
  const count = entryCount ?? 0;
  const description = `${count} ${count === 1 ? "entry" : "entries"} · ${rhank.direction === "high" ? "Highest" : "Lowest"} ${rhank.unit} wins · Created by ${rhank.creator_name}`;

  return {
    title: `${rhank.title} — Rhank`,
    description,
    openGraph: {
      title: rhank.title,
      description,
      url: pageUrl,
      siteName: "Rhank",
      images: [{ url: ogImage, width: 1200, height: 630, alt: rhank.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: rhank.title,
      description,
      images: [ogImage],
    },
  };
}

export default function RhankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
