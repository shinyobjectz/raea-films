// The pixel world's layout (the shot "greenhouse"), shared by its maker (tools/pixel-world.ts, which writes its splats
// and its painted sky) and its scene (v3/pixel.tsx). No imports: the tool runs it under bun without the renderer.
// World metres, the take's: we come in at z 5 and the door stands on the path at z -RZ (sets/rooms.ts RZ, 3.2).
export type V3 = [number, number, number];
export const RZ = 3.2;
/** the lake, right of the path: its middle, half-widths across and along, its water's height */
export const LAKE = { cx: 3.4, cz: -2.0, rx: 2.6, rz: 6.5, y: -0.12 };
/** where the cursor clicks the water (the lake's splats ripple out from here: the splat file's middle is put here) */
export const CLICK: V3 = [1.8, LAKE.y, -3.5];                        // (out in the sun's glitter, where the rings stay in the frame as we walk)
/** the water's rings round the click, metres out (each ring is its own splat file: media/splat/pixel-lake-K.splat) */
export const RINGS = [0, 0.3, 0.65, 1.05, 1.5, 2.0, 2.6, 3.3, 4.2, 5.4, 20];
/** the sun's way (toward it): low, ahead and to the right, setting behind the mountains */
const n = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
export const SUN: V3 = n([0.35, 0.22, -1]);
/** the sky card: a painting of the sky and the mountains standing this far ahead, this wide and this high */
export const CARD = { z: -280, w: 900, y0: -40, y1: 380, px: [1024, 478] as [number, number] };
/** the palette everything is snapped to (sRGB), dusk: indigo to amber sky, greens, water blues, earth, stone, wood */
export const PALETTE = [
  "#0b0a12", "#1b1340", "#2b1e4f", "#3b1f5c", "#45426e", "#6a2c70", "#6b5b95", "#8f7fb3",
  "#b83b5e", "#e86a92", "#f08a5d", "#f9b45b", "#f9ed69", "#fff6e0", "#0f2d2a", "#1d4a3a",
  "#2e6b47", "#4f9b4f", "#8cc152", "#1f3b44", "#1e3a5f", "#2f6690", "#4fa3c7", "#a6e3e9",
  "#5a3d2b", "#8a5a3b", "#c2895a", "#3d3d4a", "#6b6b7a", "#a0a0ad", "#6b3a1f", "#a35b2b",
];
export const hex = (h: string): V3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** a fixed random number for (i, k) */
export const rnd = (i: number, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); };
const h2 = (x: number, z: number) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
/** value noise, 0..1 */
export function vn(x: number, z: number) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = h2(i, j), b = h2(i + 1, j), c = h2(i, j + 1), d = h2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** how far inside the lake (x, z) is: below 1 inside its shore */
export const lakeE = (x: number, z: number) => ((x - LAKE.cx) / LAKE.rx) ** 2 + ((z - LAKE.cz) / LAKE.rz) ** 2;
/** the path's middle line at z (it wanders a little) */
export const pathX = (z: number) => 0.18 * Math.sin(z * 0.55 + 0.7);
/** the ground's height at (x, z): a meadow, rising into the wood on the left, down to the lake's shore on the right */
export function ground(x: number, z: number) {
  let h = 0.16 * vn(x * 0.22, z * 0.22) + 0.06 * vn(x * 0.9 + 3, z * 0.9) - 0.1;
  h += 0.9 * smooth(-1.8, -9, x) * (0.6 + 0.4 * vn(x * 0.1, z * 0.1));
  const e = lakeE(x, z);
  h = h + (LAKE.y - 0.3 - h) * smooth(1.45, 0.82, e);
  const p = Math.abs(x - pathX(z));
  h = h + (0.0 - h) * smooth(1.2, 0.5, p) * (z > -RZ - 1 ? 1 : 0.4);
  return h;
}
