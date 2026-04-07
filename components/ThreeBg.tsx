"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Floating wireframe geometry shapes for app/demo pages

type ShapeData = {
  mesh: THREE.LineSegments;
  geo: THREE.EdgesGeometry;
  rotSpeed: THREE.Vector3;
  floatAmp: number;
  floatSpeed: number;
  floatOffset: number;
  baseY: number;
  driftX: number;
  driftZ: number;
};

export default function ThreeBg({ onReady, bgColor = 0x1a5fff }: { onReady?: () => void; bgColor?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.6, 0.85));

    scene.background = new THREE.Color(bgColor);
    camera.position.set(0, 0, 50);

    // --- Floating wireframe shapes
    const shapes: ShapeData[] = [];

    const GEOMETRIES = [
      () => new THREE.IcosahedronGeometry(1, 0),
      () => new THREE.OctahedronGeometry(1, 0),
      () => new THREE.TetrahedronGeometry(1, 0),
      () => new THREE.BoxGeometry(1.4, 1.4, 1.4),
      () => new THREE.IcosahedronGeometry(1, 1),
    ];

    // Two layers: background (large, faint) and foreground (smaller, brighter)
    const CONFIGS = [
      // Background layer — large, spread out, very faint
      ...Array(10).fill(0).map(() => ({ scale: THREE.MathUtils.randFloat(5, 14), opacity: THREE.MathUtils.randFloat(0.04, 0.10), layer: "bg" })),
      // Mid layer
      ...Array(14).fill(0).map(() => ({ scale: THREE.MathUtils.randFloat(2, 6),  opacity: THREE.MathUtils.randFloat(0.10, 0.22), layer: "mid" })),
      // Foreground — small, crisp
      ...Array(10).fill(0).map(() => ({ scale: THREE.MathUtils.randFloat(0.8, 2.5), opacity: THREE.MathUtils.randFloat(0.25, 0.55), layer: "fg" })),
    ];

    const SPREAD = 90;

    CONFIGS.forEach(({ scale, opacity }) => {
      const geoFn = GEOMETRIES[Math.floor(Math.random() * GEOMETRIES.length)];
      const baseGeo = geoFn();
      const edges = new THREE.EdgesGeometry(baseGeo);
      baseGeo.dispose();

      const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity });
      const mesh = new THREE.LineSegments(edges, mat);

      mesh.scale.setScalar(scale);
      mesh.position.set(
        THREE.MathUtils.randFloatSpread(SPREAD),
        THREE.MathUtils.randFloatSpread(SPREAD * 0.6),
        THREE.MathUtils.randFloatSpread(60) - 10,
      );
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      scene.add(mesh);

      shapes.push({
        mesh,
        geo: edges,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.003,
        ),
        floatAmp: THREE.MathUtils.randFloat(0.5, 2.5),
        floatSpeed: THREE.MathUtils.randFloat(0.2, 0.7),
        floatOffset: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
        driftX: (Math.random() - 0.5) * 0.008,
        driftZ: (Math.random() - 0.5) * 0.005,
      });
    });

    onReady?.();

    // --- Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // --- Animation loop
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      shapes.forEach((s) => {
        s.mesh.rotation.x += s.rotSpeed.x;
        s.mesh.rotation.y += s.rotSpeed.y;
        s.mesh.rotation.z += s.rotSpeed.z;

        // Gentle float + slow horizontal drift
        s.mesh.position.y = s.baseY + Math.sin(time * s.floatSpeed + s.floatOffset) * s.floatAmp;
        s.mesh.position.x += s.driftX;
        s.mesh.position.z += s.driftZ;

        // Wrap X
        if (s.mesh.position.x > SPREAD / 2) s.mesh.position.x = -SPREAD / 2;
        if (s.mesh.position.x < -SPREAD / 2) s.mesh.position.x = SPREAD / 2;
        // Wrap Z
        if (s.mesh.position.z > 30) s.mesh.position.z = -40;
        if (s.mesh.position.z < -40) s.mesh.position.z = 30;
      });

      composer.render();
    };
    animate();

    // --- Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      shapes.forEach((s) => {
        s.geo.dispose();
        (s.mesh.material as THREE.Material).dispose();
      });
      composer.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" className="fixed inset-0 -z-10 h-full w-full" />;
}
