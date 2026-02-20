"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ParticleMorph from "./ParticleMorph";

export default function WebGLScene() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 h-full w-[42vw] min-w-[380px] max-w-[620px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }}>
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 6, 18]} />

        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <ParticleMorph />
        </Suspense>
      </Canvas>
    </div>
  );
}
