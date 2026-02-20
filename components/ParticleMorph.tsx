"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import {
  FACE_SVG,
  HUMAN_SVG,
  QUEUE_SVG,
  GLOBE_SVG,
  BRAIN_SVG,
} from "./shapes/silhouettes";
import { sampleSvgToPoints } from "./shapes/sampleSvgToPoints";

const COUNT = 3200;

type ShapeSet = {
  face: Float32Array;
  human: Float32Array;
  queue: Float32Array;
  globe: Float32Array;
  brain: Float32Array;
};

export default function ParticleMorph() {
  const pointsRef = useRef<THREE.Points>(null!);

  // scroll progress 0..1
  const scrollTarget = useRef(0);
  // smoothed morph progress
  const smooth = useRef(0);

  const [shapes, setShapes] = useState<ShapeSet | null>(null);

  // Seeds for continuous “alive” motion
  const seeds = useMemo(() => {
    const s = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      s[i * 3] = Math.random() * 10;
      s[i * 3 + 1] = Math.random() * 10;
      s[i * 3 + 2] = Math.random() * 10;
    }
    return s;
  }, []);

  // Load shapes once on client
  useEffect(() => {
    let alive = true;

    (async () => {
      const [face, human, queue, globe, brain] = await Promise.all([
        sampleSvgToPoints(FACE_SVG, COUNT, { width: 520, height: 520 }),
        sampleSvgToPoints(HUMAN_SVG, COUNT, { width: 520, height: 520 }),
        sampleSvgToPoints(QUEUE_SVG, COUNT, { width: 620, height: 420 }),
        sampleSvgToPoints(GLOBE_SVG, COUNT, { width: 520, height: 520 }),
        sampleSvgToPoints(BRAIN_SVG, COUNT, { width: 620, height: 420 }),
      ]);

      if (!alive) return;
      setShapes({ face, human, queue, globe, brain });
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      scrollTarget.current = THREE.MathUtils.clamp(p, 0, 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3)
    );
    return geo;
  }, []);

  // Material (slight glow)
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.02,
      color: new THREE.Color("#9bbcff"),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (!shapes) return;

    const time = state.clock.getElapsedTime();

    // Smooth scroll progress (slows morphing A LOT)
    smooth.current = THREE.MathUtils.lerp(
      smooth.current,
      scrollTarget.current,
      0.02
    );

    // Map progress to stages (Face -> Human -> Queue -> Globe -> Brain)
    const stages = 5;
    const scaled = smooth.current * (stages - 1);
    const idx = Math.floor(scaled);
    const localT = scaled - idx;

    const from = idx === 0 ? shapes.face :
                 idx === 1 ? shapes.human :
                 idx === 2 ? shapes.queue :
                 idx === 3 ? shapes.globe : shapes.brain;

    const to   = idx === 0 ? shapes.human :
                 idx === 1 ? shapes.queue :
                 idx === 2 ? shapes.globe :
                 idx === 3 ? shapes.brain : shapes.brain;

    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    // Continuous life motion even when not scrolling
    const wobble = 0.045; // smaller = calmer
    const w1 = 0.65, w2 = 0.85, w3 = 0.75;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;

      // Base morph position
      const bx = THREE.MathUtils.lerp(from[ix], to[ix], localT);
      const by = THREE.MathUtils.lerp(from[ix + 1], to[ix + 1], localT);
      const bz = THREE.MathUtils.lerp(from[ix + 2], to[ix + 2], localT);

      const sx = seeds[ix];
      const sy = seeds[ix + 1];
      const sz = seeds[ix + 2];

      // pseudo-noise drift
      const dx = Math.sin(time * w2 + sx) * wobble;
      const dy = Math.sin(time * w1 + sy) * wobble * 0.7;
      const dz = Math.sin(time * w3 + sz) * wobble;

      positions[ix] = bx + dx;
      positions[ix + 1] = by + dy;
      positions[ix + 2] = bz + dz;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Gentle “breathing” rotation so it feels alive (super subtle)
    pointsRef.current.rotation.y = Math.sin(time * 0.12) * 0.08;
    pointsRef.current.rotation.x = Math.sin(time * 0.08) * 0.04;
  });

  // Until shapes load, don’t render points
  if (!shapes) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
