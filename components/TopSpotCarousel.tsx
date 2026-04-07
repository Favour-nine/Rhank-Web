"use client";

import { useEffect, useState } from "react";
import { Bebas_Neue } from "next/font/google";
import { supabase } from "@/lib/supabase";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });

type Slide = {
  rhankTitle: string;
  unit: string;
  direction: "high" | "low";
  name: string;
  value: number;
  slug: string;
  locationName?: string | null;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TopSpotCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function load() {
      // Get visitor location (best effort, non-blocking)
      let userLat: number | null = null;
      let userLon: number | null = null;
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation?.getCurrentPosition(
            (pos) => { userLat = pos.coords.latitude; userLon = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 4000 }
          );
        });
      } catch {}

      const { data: rhanks } = await supabase
        .from("rhanks")
        .select("id, title, unit, direction, slug, latitude, longitude, location_name")
        .order("created_at", { ascending: false });

      if (!rhanks?.length) return;

      const results: Slide[] = [];

      await Promise.all(
        rhanks.map(async (r) => {
          const { data: entries } = await supabase
            .from("entries")
            .select("participant_name, value")
            .eq("rhank_id", r.id)
            .order("value", { ascending: r.direction === "low" })
            .limit(1);

          if (entries?.length) {
            results.push({
              rhankTitle: r.title,
              unit: r.unit,
              direction: r.direction,
              name: entries[0].participant_name,
              value: entries[0].value,
              slug: r.slug,
              locationName: r.location_name,
            });
          }
        })
      );

      // Sort: nearby rhanks first (those with coords), then rest
      if (userLat !== null && userLon !== null) {
        const withCoords = rhanks.filter((r) => r.latitude != null && r.longitude != null);
        const withoutCoords = rhanks.filter((r) => r.latitude == null || r.longitude == null);

        const sortedIds = [
          ...withCoords.sort((a, b) =>
            haversineKm(userLat!, userLon!, a.latitude, a.longitude) -
            haversineKm(userLat!, userLon!, b.latitude, b.longitude)
          ),
          ...withoutCoords,
        ].map((r) => r.id);

        results.sort((a, b) => {
          const ai = sortedIds.findIndex((id) => rhanks.find((r) => r.slug === a.slug)?.id === id);
          const bi = sortedIds.findIndex((id) => rhanks.find((r) => r.slug === b.slug)?.id === id);
          return ai - bi;
        });
      }

      setSlides(results);
    }

    load();
  }, []);

  // Auto-cycle with fade
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <div className="text-center">
        <p className={`${bebas.className} text-7xl md:text-9xl leading-none text-black/20`}>
          No entries yet.
        </p>
        <p className="mt-4 text-black/40 text-sm tracking-widest uppercase">Create a Rhank to get started</p>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <div
      className="text-center w-full"
      style={{ transition: "opacity 0.4s ease", opacity: visible ? 1 : 0 }}
    >
      {/* Category label */}
      <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-black/40 mb-3">
        #1 in {slide.rhankTitle}{slide.locationName ? ` · ${slide.locationName}` : ""}
      </p>

      {/* Winner name */}
      <h1 className={`${bebas.className} text-7xl md:text-[10rem] leading-none tracking-tight text-black`}>
        {slide.name}
      </h1>

      {/* Score */}
      <p className={`${bebas.className} text-4xl md:text-6xl text-black/50 mt-2`}>
        {slide.value} {slide.unit}
      </p>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true); }, 400); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === index ? "bg-black w-6" : "bg-black/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
