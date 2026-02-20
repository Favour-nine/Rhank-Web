// Solid, filled silhouettes as SVG strings.
// Keep viewBox consistent-ish for easier framing.

export const FACE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <path fill="#fff" d="
    M155 35
    C125 35 98 55 92 88
    C86 120 94 150 92 175
    C90 200 104 232 128 252
    C145 266 165 268 182 258
    C210 245 230 216 228 178
    C226 150 236 118 228 88
    C219 55 190 35 155 35
    Z
    M135 112
    C140 106 148 104 156 104
    C166 104 175 108 178 116
    C168 114 162 114 156 114
    C150 114 144 114 135 112
    Z
  "/>
</svg>
`;

export const HUMAN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500">
  <path fill="#fff" d="
    M150 50
    A45 45 0 1 1 149.9 50
    Z
    M90 170
    C90 135 110 120 150 120
    C190 120 210 135 210 170
    L210 330
    C210 350 200 370 180 380
    L180 460
    C180 480 165 495 150 495
    C135 495 120 480 120 460
    L120 380
    C100 370 90 350 90 330
    Z
  "/>
</svg>
`;

// Placeholders for later (queue, globe, brain).
// We'll replace with nicer silhouettes once Face/Human works.
export const QUEUE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <g fill="#fff">
    <circle cx="140" cy="90" r="40"/><rect x="105" y="135" width="70" height="190" rx="30"/>
    <circle cx="280" cy="90" r="40"/><rect x="245" y="135" width="70" height="190" rx="30"/>
    <circle cx="420" cy="90" r="40"/><rect x="385" y="135" width="70" height="190" rx="30"/>
  </g>
</svg>
`;

export const GLOBE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <path fill="#fff" d="
    M200 30
    A170 170 0 1 1 199.9 30 Z
    M200 40
    C150 80 150 320 200 360
    C250 320 250 80 200 40 Z
    M50 200
    C100 170 300 170 350 200
    C300 230 100 230 50 200 Z
  "/>
</svg>
`;

export const BRAIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
  <path fill="#fff" d="
    M190 70
    C150 40 90 60 85 115
    C40 135 55 200 95 205
    C85 250 120 290 165 275
    C180 320 240 330 255 300
    C270 330 330 320 345 275
    C390 290 425 250 405 205
    C445 200 460 135 415 115
    C410 60 350 40 310 70
    C290 40 210 40 190 70
    Z
  "/>
</svg>
`;
