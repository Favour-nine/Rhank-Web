"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function MarketingBg({ onReady }: { onReady?: () => void }) {
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
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.5, 1.1));

    scene.background = new THREE.Color(0x1a5fff);

    camera.position.setZ(30);
    camera.position.setX(-3);

    const isMobile = window.innerWidth < 768;
    const STAIRS_SIZE = isMobile ? 36 : 38;
    const MODEL_CENTER_X = isMobile ? 0 : 7;

    let rotation = 0;

    function objToWireframe(obj: THREE.Group, mat: THREE.LineBasicMaterial, targetSize: number, offsetX: number) {
      const geos: THREE.EdgesGeometry[] = [];
      const toAdd: THREE.LineSegments[] = [];
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.visible = false;
          const edges = new THREE.EdgesGeometry(mesh.geometry, 5);
          geos.push(edges);
          const lines = new THREE.LineSegments(edges, mat);
          lines.position.copy(mesh.position);
          lines.rotation.copy(mesh.rotation);
          lines.scale.copy(mesh.scale);
          toAdd.push(lines);
        }
      });
      toAdd.forEach((l) => obj.add(l));
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const scale = targetSize / Math.max(size.x, size.y, size.z);
      obj.scale.setScalar(scale);
      obj.position.set(-center.x * scale + offsetX, -center.y * scale, -center.z * scale);
      return geos;
    }

    let model: THREE.Group | null = null;
    const edgeGeometries: THREE.EdgesGeometry[] = [];
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });

    new OBJLoader().load("/stairs.obj", (obj) => {
      model = obj;
      const geos = objToWireframe(obj, lineMat, STAIRS_SIZE, MODEL_CENTER_X);
      edgeGeometries.push(...geos);
      scene.add(obj);
      onReady?.();
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // --- Stars
    const stars: THREE.Mesh[] = [];
    function addStar() {
      const startOpacity = Math.random();
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, transparent: true, opacity: startOpacity, depthWrite: false })
      );
      const [x, y, z] = Array(3).fill(0).map(() => THREE.MathUtils.randFloatSpread(100));
      star.position.set(x, y, z);
      (star as any).userData = { baseY: y, speed: Math.random() * 0.5 + 0.2, opacity: startOpacity, targetOpacity: 1, twinkleTimer: Math.random() * 3 + 1, fadeSpeed: Math.random() * 0.9 + 0.15 };
      stars.push(star);
      scene.add(star);
    }
    Array(200).fill(0).forEach(addStar);

    // --- Scroll
    const moveCamera = () => {
      const t = document.body.getBoundingClientRect().top;
      camera.position.z = t * -0.01 + 30;
      camera.position.x = t * -0.0002 - 3;
      camera.rotation.y = t * -0.0002;
    };
    document.addEventListener("scroll", moveCamera, { passive: true });
    moveCamera();

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
      const dt = 1 / 60;

      stars.forEach((star) => {
        const data = (star as any).userData;
        const mat = star.material as THREE.MeshStandardMaterial;
        star.position.y = data.baseY + Math.sin(time * data.speed) * 0.5;
        data.twinkleTimer -= dt;
        if (data.twinkleTimer <= 0) {
          data.targetOpacity = Math.random() < 0.35 ? 0 : 1;
          data.twinkleTimer = Math.random() * 2.8 + 0.6;
          data.fadeSpeed = Math.random() * 0.9 + 0.15;
        }
        data.opacity = THREE.MathUtils.lerp(data.opacity, data.targetOpacity, dt * data.fadeSpeed);
        mat.opacity = data.opacity;
        mat.emissiveIntensity = 0.6 * data.opacity;
      });

      rotation += 0.0015;
      if (model) model.rotation.y = rotation;

      composer.render();
    };
    animate();

    // --- Cleanup
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", moveCamera);
      if (model) model.traverse((child) => { if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).geometry.dispose(); });
      edgeGeometries.forEach((g) => g.dispose());
      lineMat.dispose();
      stars.forEach((s) => { s.geometry.dispose(); (s.material as THREE.Material).dispose(); });
      composer.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <canvas ref={canvasRef} id="bg" className="fixed inset-0 -z-10 h-full w-full" />;
}
