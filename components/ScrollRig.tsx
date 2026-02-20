"use client";

import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function ScrollRig() {
  const scroll = useScroll();
  const t = useRef(0);

  useFrame(({ camera }) => {
    // scroll.offset is 0..1 across the ScrollControls pages
    const target = scroll.offset;

    // smooth it (makes it feel premium)
    t.current = THREE.MathUtils.lerp(t.current, target, 0.06);

    // Map scroll to camera like Fireship (t is 0..1)
    camera.position.z = THREE.MathUtils.lerp(6, 14, t.current);   // zoom out slowly
    camera.position.x = THREE.MathUtils.lerp(0, -2.5, t.current); // drift
    camera.rotation.y = THREE.MathUtils.lerp(0, -0.25, t.current);

    camera.updateProjectionMatrix();
  });

  return null;
}
