"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const PARTICLE_COUNT = 3000;

export default function ThreeBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Setup (Fireship style)
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --- Postprocessing (Bloom)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,  // strength
      0.5,  // radius (spread)
      1.1   // threshold above 1.0 = only emissive stars bloom
    );

    // --- Background (space image)
    const textureLoader = new THREE.TextureLoader();
    const spaceTexture = textureLoader.load("/space.jpg");
    spaceTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = spaceTexture;

    composer.addPass(bloomPass);

    camera.position.setZ(30);
    camera.position.setX(-3);

    // --- Responsive sizing
    const isMobile = window.innerWidth < 768;
    const BITMAN_SIZE  = isMobile ? 12 : 28;
    const STAIRS_SIZE  = isMobile ? 16 : 38;
    const MODEL_CENTER_X = isMobile ? 0 : 7; // centered on mobile, offset right on desktop

    // --- Morph state
    let morphProgress = 0;
    let sharedRotation = 0;               // single Y-rotation shared by all three objects
    let posA: Float32Array | null = null;  // bitman edge samples (model-center-relative)
    let posB: Float32Array | null = null;  // stairs edge samples (model-center-relative)
    let turbulence: Float32Array | null = null; // per-particle random drift offsets
    let particleGeo: THREE.BufferGeometry | null = null;
    let particleMat: THREE.PointsMaterial | null = null;
    let particles: THREE.Points | null = null;
    // Stairs wireframe — kept in scene, fades in as particles converge
    let stairsMat: THREE.LineBasicMaterial | null = null;
    let stairsEdgeGeos: THREE.EdgesGeometry[] = [];

    // Sample PARTICLE_COUNT world-space positions from all LineSegments in a group
    function samplePositions(group: THREE.Group, count: number): Float32Array {
      group.updateWorldMatrix(false, true);
      const allVerts: number[] = [];
      group.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          const pos = child.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(pos, i);
            v.applyMatrix4(child.matrixWorld);
            allVerts.push(v.x, v.y, v.z);
          }
        }
      });
      const vertCount = allVerts.length / 3;
      const result = new Float32Array(count * 3);
      if (vertCount === 0) return result;
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * vertCount);
        result[i * 3]     = allVerts[idx * 3];
        result[i * 3 + 1] = allVerts[idx * 3 + 1];
        result[i * 3 + 2] = allVerts[idx * 3 + 2];
      }
      return result;
    }

    // Convert a loaded OBJ group to wireframe LineSegments.
    // Pass forceScale to reuse another model's scale; otherwise auto-scales to targetSize.
    function objToWireframe(
      obj: THREE.Group,
      mat: THREE.LineBasicMaterial,
      targetSize: number,
      offsetX: number,
      forceScale?: number
    ): { geos: THREE.EdgesGeometry[]; scale: number } {
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
      const scale = forceScale ?? (targetSize / Math.max(size.x, size.y, size.z));
      obj.scale.setScalar(scale);
      obj.position.set(-center.x * scale + offsetX, -center.y * scale, -center.z * scale);
      return { geos, scale };
    }

    // Once both models are loaded, compute turbulence offsets and create particle system
    function trySetupMorph() {
      if (!posA || !posB) return;

      // Re-center posA and posB relative to the shared model center so that
      // rotating the particles object around that center matches the wireframes
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posA[i * 3] -= MODEL_CENTER_X;
        posB[i * 3] -= MODEL_CENTER_X;
      }

      // Per-particle random drift — peaks at morph midpoint, zero at start/end
      const turbScale = BITMAN_SIZE * 0.18;
      turbulence = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        turbulence[i * 3]     = (Math.random() - 0.5) * 2 * turbScale;
        turbulence[i * 3 + 1] = (Math.random() - 0.5) * 2 * turbScale;
        turbulence[i * 3 + 2] = (Math.random() - 0.5) * 2 * turbScale;
      }

      particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(posA), 3)
      );
      particleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.04,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      particles = new THREE.Points(particleGeo, particleMat);
      particles.position.set(MODEL_CENTER_X, 0, 0);
      scene.add(particles);
    }

    // --- Objects
    let model: THREE.Group | null = null;
    let stairsModel: THREE.Group | null = null;
    const edgeGeometries: THREE.EdgesGeometry[] = [];
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    // Load bitman
    const objLoader = new OBJLoader();
    objLoader.load("/bitman.obj", (obj) => {
      model = obj;
      const { geos } = objToWireframe(obj, lineMat, BITMAN_SIZE, MODEL_CENTER_X);
      edgeGeometries.push(...geos);
      scene.add(obj);
      posA = samplePositions(obj, PARTICLE_COUNT);
      trySetupMorph();
    });

    // Load stairs — invisible wireframe, fades in at end of morph
    stairsMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    const stairsLoader = new OBJLoader();
    stairsLoader.load("/stairs.obj", (obj) => {
      stairsModel = obj;
      const { geos: stairsGeos } = objToWireframe(obj, stairsMat!, STAIRS_SIZE, MODEL_CENTER_X);
      stairsEdgeGeos = stairsGeos;
      scene.add(obj);
      posB = samplePositions(obj, PARTICLE_COUNT);
      trySetupMorph();
    });

    // --- Lights
    const pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(5, 5, 5);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(pointLight, ambientLight);

    // --- Stars
    const stars: THREE.Mesh[] = [];

    function addStar() {
      const geometry = new THREE.SphereGeometry(0.25, 16, 16);

      const startOpacity = Math.random();

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: startOpacity,
        depthWrite: false,
      });

      const star = new THREE.Mesh(geometry, material);

      const [x, y, z] = Array(3)
        .fill(0)
        .map(() => THREE.MathUtils.randFloatSpread(100));

      star.position.set(x, y, z);

      (star as any).userData = {
        baseY: y,
        speed: Math.random() * 0.5 + 0.2,
        flickerOffset: Math.random() * 1000,
        opacity: startOpacity,
        targetOpacity: 1,
        twinkleTimer: Math.random() * 3 + 1,
        fadeSpeed: Math.random() * 0.9 + 0.15,
      };

      stars.push(star);
      scene.add(star);
    }

    Array(200).fill(0).forEach(addStar);

    // --- Scroll animation (Fireship pattern)
    const moveCamera = () => {
      const t = document.body.getBoundingClientRect().top;
      const scrollY = -t;

      camera.position.z = t * -0.01 + 30;
      camera.position.x = t * -0.0002 - 3;
      camera.rotation.y = t * -0.0002;

      if (scene.background instanceof THREE.Texture) {
        scene.background.offset.y = t * -0.00005;
      }
      spaceTexture.wrapS = THREE.RepeatWrapping;
      spaceTexture.wrapT = THREE.RepeatWrapping;

      // Morph: starts at 200px scroll, complete at 900px (long immersive window)
      morphProgress = Math.max(0, Math.min(1, (scrollY - 200) / 700));
    };

    document.addEventListener("scroll", moveCamera, { passive: true });
    moveCamera();

    // --- Resize handling
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

      // Stars: float + random fade out/in
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

        data.opacity = THREE.MathUtils.lerp(
          data.opacity,
          data.targetOpacity,
          dt * data.fadeSpeed
        );

        if (Math.abs(data.opacity - data.targetOpacity) < 0.01) {
          data.opacity = data.targetOpacity;
        }

        mat.opacity = data.opacity;
        mat.emissiveIntensity = 0.6 * data.opacity;
      });

      // All three objects share one rotation so they stay perfectly in sync
      sharedRotation += 0.0015;

      // Bitman wireframe: fade out by morphProgress=0.2
      if (model) {
        model.rotation.y = sharedRotation;
        const fade = Math.max(0, 1 - morphProgress * 3);
        lineMat.opacity = 0.9 * fade;
        model.visible = fade > 0;
      }

      // Stairs wireframe: fade in from 70%→100% of morph
      if (stairsModel) {
        stairsModel.rotation.y = sharedRotation;
        if (stairsMat) {
          stairsMat.opacity = 0.9 * Math.max(0, (morphProgress - 0.55) / 0.45);
        }
      }

      // Particles rotate with the same shared angle
      if (particles) {
        particles.rotation.y = sharedRotation;
      }

      // Particles: direct posA → posB with turbulence peaking at midpoint
      if (particles && particleGeo && particleMat && posA && posB && turbulence) {
        if (morphProgress > 0) {
          const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
          const arr = posAttr.array as Float32Array;

          // Ease in-out cubic on direct lerp
          const m = morphProgress;
          const ease = m < 0.5 ? 4 * m * m * m : 1 - Math.pow(-2 * m + 2, 3) / 2;

          // Turbulence envelope: sin(progress * π) — 0 at start, peaks at 50%, 0 at end
          const turbEnv = Math.sin(morphProgress * Math.PI);

          for (let i = 0; i < PARTICLE_COUNT; i++) {
            arr[i * 3]     = posA[i * 3]     + (posB[i * 3]     - posA[i * 3])     * ease + turbulence[i * 3]     * turbEnv;
            arr[i * 3 + 1] = posA[i * 3 + 1] + (posB[i * 3 + 1] - posA[i * 3 + 1]) * ease + turbulence[i * 3 + 1] * turbEnv;
            arr[i * 3 + 2] = posA[i * 3 + 2] + (posB[i * 3 + 2] - posA[i * 3 + 2]) * ease + turbulence[i * 3 + 2] * turbEnv;
          }
          posAttr.needsUpdate = true;

          // Appear fast, then fade out as stairs wireframe takes over (from 70%→100%)
          const fadeIn  = Math.min(1, morphProgress * 3);
          const fadeOut = Math.max(0, 1 - Math.max(0, (morphProgress - 0.55) / 0.45));
          particleMat.opacity = fadeIn * fadeOut * 0.9;
        } else {
          particleMat.opacity = 0;
        }
      }

      composer.render();
    };

    animate();

    // --- Cleanup (important in Next.js)
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", moveCamera);

      // Dispose model
      if (model) {
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).geometry.dispose();
          }
        });
      }
      edgeGeometries.forEach((g) => g.dispose());
      lineMat.dispose();

      // Dispose stars
      stars.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });

      // Dispose particles
      if (particleGeo) particleGeo.dispose();
      if (particleMat) particleMat.dispose();

      // Dispose stairs
      stairsEdgeGeos.forEach((g) => g.dispose());
      if (stairsMat) stairsMat.dispose();

      composer.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg"
      className="fixed inset-0 -z-10 h-full w-full"
    />
  );
}
