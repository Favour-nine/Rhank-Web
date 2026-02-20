export async function sampleSvgToPoints(
  svg: string,
  count: number,
  opts?: { width?: number; height?: number; threshold?: number; jitter?: number }
): Promise<Float32Array> {
  const width = opts?.width ?? 520;
  const height = opts?.height ?? 520;
  const threshold = opts?.threshold ?? 10; // alpha threshold
  const jitter = opts?.jitter ?? 0.6; // subpixel jitter

  // Convert SVG to image
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.decoding = "async";
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load SVG image"));
  });

  URL.revokeObjectURL(url);

  // Draw to offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No 2D context");

  ctx.clearRect(0, 0, width, height);
  // Fit image into canvas
  ctx.drawImage(img, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;

  // Collect opaque pixels
  const candidates: number[] = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];
      if (a > threshold) candidates.push(x, y);
    }
  }

  // Fallback if silhouette is too thin
  if (candidates.length < 20) {
    throw new Error("Silhouette sampling found too few pixels. Check SVG fill.");
  }

  // Sample points and normalize to centered coordinates (-1..1)
  const out = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const pick = (Math.random() * (candidates.length / 2)) | 0;
    const x = candidates[pick * 2] + (Math.random() - 0.5) * jitter;
    const y = candidates[pick * 2 + 1] + (Math.random() - 0.5) * jitter;

    // normalize: center and aspect-correct
    const nx = (x / width) * 2 - 1;
    const ny = -((y / height) * 2 - 1);

    // Slight depth thickness so it feels 3D
    const z = (Math.random() - 0.5) * 0.12;

    out[i * 3] = nx * 1.6;
    out[i * 3 + 1] = ny * 1.6;
    out[i * 3 + 2] = z;
  }

  return out;
}
