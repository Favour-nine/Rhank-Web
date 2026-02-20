"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Optional: OrbitControls
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
      0.5, // strength
      1.2, // radius (spread)
      0.1 // threshold
    );

    // --- Background (space image)
    const textureLoader = new THREE.TextureLoader();
    const spaceTexture = textureLoader.load("/space.jpg");
    spaceTexture.colorSpace = THREE.SRGBColorSpace; // important for correct colors
    scene.background = spaceTexture;


    composer.addPass(bloomPass);

    camera.position.setZ(30);
    camera.position.setX(-3);

    // --- Objects
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(10, 3, 16, 100),
      new THREE.MeshStandardMaterial({ color: 0xff6347 })
    );
    scene.add(torus);

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
        opacity: startOpacity, // start at random opacity
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

        // twinkle state
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

      camera.position.z = t * -0.01 + 30; // keep baseline
      camera.position.x = t * -0.0002 - 3;
      camera.rotation.y = t * -0.0002;

      if (scene.background instanceof THREE.Texture) {
    scene.background.offset.y = t * -0.00005;
    }
    spaceTexture.wrapS = THREE.RepeatWrapping;
    spaceTexture.wrapT = THREE.RepeatWrapping;


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
      const dt = 1 / 60; // stable-enough timestep for twinkle

      // Stars: float + random fade out/in
      stars.forEach((star) => {
        const data = (star as any).userData;
        const mat = star.material as THREE.MeshStandardMaterial;

        // gentle floating
        star.position.y = data.baseY + Math.sin(time * data.speed) * 0.5;

        // twinkle timer
        data.twinkleTimer -= dt;

        if (data.twinkleTimer <= 0) {
          // 0.35 = balanced: occasional disappear
          data.targetOpacity = Math.random() < 0.35 ? 0 : 1;

          // next decision time
          data.twinkleTimer = Math.random() * 2.8 + 0.6;

          // random fade speed each cycle
          data.fadeSpeed = Math.random() * 0.9 + 0.15;
        }

        // smooth fade toward target
        data.opacity = THREE.MathUtils.lerp(
          data.opacity,
          data.targetOpacity,
          dt * data.fadeSpeed
        );

        // snap close values
        if (Math.abs(data.opacity - data.targetOpacity) < 0.01) {
          data.opacity = data.targetOpacity;
        }

        mat.opacity = data.opacity;

        // glow follows opacity (prevents bloom from glowing invisible stars)
        mat.emissiveIntensity = 0.6 * data.opacity;
      });

      // Torus rotation
      torus.rotation.x += 0.01;
      torus.rotation.y += 0.005;
      torus.rotation.z += 0.01;

      composer.render();
    };

    animate();

    // --- Cleanup (important in Next.js)
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", moveCamera);

      // Dispose torus
      torus.geometry.dispose();
      (torus.material as THREE.Material).dispose();

      // Dispose stars
      stars.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });

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
