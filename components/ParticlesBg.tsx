"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";

export default function ParticlesBg() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <div className="absolute inset-0 -z-10">
      <Particles
        id="tsparticles"
        className="h-full w-full"
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: {
              value: 140,
              density: { enable: true, width: 900, height: 900 },
            },
            color: { value: "#ffffff" },
            opacity: { value: 0.3 },
            size: { value: { min: 1, max: 2 } },
            move: {
              enable: true,
              speed: 0.6,
              outModes: { default: "out" },
            },
            links: {
              enable: true,
              distance: 120,
              opacity: 0.18,
              width: 1,
              color: "#ffffff",
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
            },
            modes: {
              repulse: { distance: 120, duration: 0.2 },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  );
}
