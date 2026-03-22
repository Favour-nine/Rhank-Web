"use client";

import { useCallback } from "react";
import Particles from "@tsparticles/react";
import type { Engine } from "@tsparticles/engine";
import { loadFull } from "tsparticles";

export default function ParticlesBg() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="h-full w-full"
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: {
              value: 140,
              density: { enable: true, value: 900 },
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
