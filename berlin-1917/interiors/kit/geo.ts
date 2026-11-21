// Solid helpers for the interior kit. Every prop stands on y = 0, centred on x and z, its front toward +z (into the
// room), in metres. Manifold's primitives are centred and its cylinders run along z; these put a part's bottom at y.
import { crossSection, manifold, type Solid } from "raea/3d";

export type V3 = [number, number, number];

/** Segments for a round part by its radius: a 1 cm knob 9, a 5 cm post 11, a 20 cm drum 20, 40 cm and over 32.
 *  raea's sphere, cylinder and cone take no segment count and use the engine's fixed one at any size (a 1 cm sphere is
 *  1,152 triangles: an SDK gap, interiors/SYSTEM.md), so the kit's round parts are revolved here instead. */
export const segs = (r: number) => Math.max(6, Math.min(32, Math.round(8 + 60 * r)));
const rev = (outline: [number, number][], r: number) => crossSection.polygon(outline).revolve({ segments: segs(r) }); // about z: the outline's y becomes z
/** A sheet of cloth w wide, h tall and t thick, in vertical folds (a sine of frequency f, depth a, across x), built as
 *  one profile extruded upward: eight facets a fold across and none up, where a refined box warped into folds pays
 *  for both ways. Centred on x and z, its foot at y = 0; `divisions` adds rows up for a later warp. */
export const folds = (w: number, h: number, t: number, f: number, a: number, divisions = 0): Solid => {
  const n = Math.max(2, Math.ceil((w * f * 8) / (2 * Math.PI))), xs = Array.from({ length: n + 1 }, (_, i) => -w / 2 + (w * i) / n);
  const s = (x: number) => Math.sin(x * f) * a;
  let pts: [number, number][] = [...xs.map((x): [number, number] => [x, -(s(x) + t / 2)]), ...[...xs].reverse().map((x): [number, number] => [x, -(s(x) - t / 2)])];
  let area = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; area += x0 * y1 - x1 * y0; }
  if (area < 0) pts = pts.reverse();
  return crossSection.polygon(pts).extrude(h, { divisions }).rotate(-90, 0, 0); // the profile's y becomes -z
};
/** A torus as manifold.torus (a tube r round a circle R, revolved about the same axis) but with few facets: its own
 *  are 48 by 24, about 2,300 triangles for a cup's handle. */
export const ring = (R: number, r: number, around = segs(R) * 2, tube = 8): Solid => {
  const pts: [number, number][] = [];
  for (let i = 0; i < tube; i++) { const a = (2 * Math.PI * i) / tube; pts.push([R + r * Math.cos(a), r * Math.sin(a)]); }
  return crossSection.polygon(pts).revolve({ segments: around });
};
/** A cylinder along z, centred, as manifold.cylinder but with segments by its radius. */
export const zcyl = (r: number, h: number): Solid => rev([[0, -h / 2], [r, -h / 2], [r, h / 2], [0, h / 2]], r);
/** A cone along z, centred, r0 at -z and r1 at +z, as manifold.cone but with segments by its radius. */
export const zcone = (r0: number, r1: number, h: number): Solid =>
  rev(r1 > 1e-6 ? [[0, -h / 2], [r0, -h / 2], [r1, h / 2], [0, h / 2]] : [[0, -h / 2], [r0, -h / 2], [0, h / 2]], Math.max(r0, r1));
/** A sphere of radius r, centred, with segments by its radius. */
export const ball = (r: number): Solid => {
  const n = Math.max(3, Math.round(segs(r) / 2)), pts: [number, number][] = [[0, -r]];
  for (let i = 1; i < n; i++) { const a = -Math.PI / 2 + (Math.PI * i) / n; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
  pts.push([0, r]);
  return rev(pts, r);
};

/** A box w x h x d, its bottom at y, centred on (x, z). */
export const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0): Solid => manifold.box(w, h, d).move(x, y + h / 2, z);
/** A rounded box, as box. */
export const rbox = (w: number, h: number, d: number, r: number, x = 0, y = 0, z = 0): Solid => {
  // the hull of each corner's eighth of a ball, with segments by the radius (manifold.roundedBox's corners are the
  // engine's fixed count, about 2,000 triangles a box at any size)
  const rr = Math.min(r, w / 2, h / 2, d / 2) * 0.999;
  if (rr < 1e-4) return box(w, h, d, x, y, z);
  const n = Math.max(2, Math.round(segs(rr) / 4)), cx = w / 2 - rr, cy = h / 2 - rr, cz = d / 2 - rr, pts: [number, number, number][] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
    for (let i = 0; i <= n; i++)
      for (let j = 0; j <= n; j++) {
        const phi = (Math.PI / 2) * (i / n), th = (Math.PI / 2) * (j / n);
        pts.push([sx * (cx + rr * Math.cos(phi) * Math.cos(th)), sy * (cy + rr * Math.sin(phi)), sz * (cz + rr * Math.cos(phi) * Math.sin(th))]);
      }
  return manifold.hull(pts).move(x, y + h / 2, z);
};
/** A cylinder standing on y (axis y). */
export const post = (r: number, h: number, x = 0, y = 0, z = 0): Solid => zcyl(r, h).rotate(-90, 0, 0).move(x, y + h / 2, z);
/** A tapered cylinder standing on y: r0 at the bottom, r1 at the top. */
export const taper = (r0: number, r1: number, h: number, x = 0, y = 0, z = 0): Solid => zcone(r0, r1, h).rotate(-90, 0, 0).move(x, y + h / 2, z);
/** A rod along x, centred at (x, y, z). */
export const rodX = (r: number, len: number, x = 0, y = 0, z = 0): Solid => zcyl(r, len).rotate(0, 90, 0).move(x, y, z);
/** A rod along z, centred at (x, y, z). */
export const rodZ = (r: number, len: number, x = 0, y = 0, z = 0): Solid => zcyl(r, len).move(x, y, z);
/** A turned shape: a profile of [radius, height] points (radius >= 0) spun round y, its base at y. */
export const lathe = (profile: [number, number][], x = 0, y = 0, z = 0, segments?: number): Solid =>
  crossSection.polygon(profile).revolve({ segments: segments ?? segs(Math.max(...profile.map((p) => p[0]))) }).rotate(-90, 0, 0).move(x, y, z);
/** A 2D outline in the x-y plane extruded d along z, centred on z. */
export const plate = (outline: [number, number][], d: number, x = 0, y = 0, z = 0): Solid =>
  crossSection.polygon(outline).extrude(d).move(x, y, z - d / 2);
export const union = (...s: Solid[]): Solid => (s.length === 1 ? s[0] : manifold.union(...s));

/** A hash in 0..1 from integers: the kit's only randomness, so a prop is the same on every frame and every machine. */
import { hash } from "../plan/hash";
export { hash };
/** Smooth value noise in -1..1 (for lumpy heaps and sagging cloth). */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const f = (t: number) => t * t * (3 - 2 * t);
  const u = f(x - xi), v = f(y - yi), w = f(z - zi);
  const c = (a: number, b: number, d: number) => hash(xi + a, yi + b, zi + d, seed) * 2 - 1;
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
/** A heap (coal, potatoes' bed, rubble dust): a low cone, lumped by noise and settled flat at the bottom. */
export function heap(r: number, h: number, lump: number, seed: number, x = 0, z = 0): Solid {
  return taper(r, r * 0.12, h)
    .refineToLength(Math.max(0.06, r / 8)) // coarse: the lumps are noise at this scale, and a heap is a floor-sized prop
    .warp((px, py, pz) => {
      const k = Math.min(1, py / (h * 0.15));
      const n = noise3(px * 6, py * 6, pz * 6, seed) * lump * k;
      const d = Math.hypot(px, pz) || 1;
      return [px + (px / d) * n, Math.max(0, py + n * 0.6), pz + (pz / d) * n];
    })
    .move(x, 0, z);
}

/** A low lump (a potato, a stone, a coal): the hull of 14 jittered points on an r-sized ellipsoid, about 24 triangles. */
export function lump(r: number, seed: number, sx = 1.35, sy = 0.85, sz = 1): Solid {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const u = (i + 0.5) / 14, phi = Math.acos(1 - 2 * u), th = i * 2.39996 + hash(seed, i) * 0.6, k = 0.85 + hash(seed, i, 9) * 0.3;
    pts.push([Math.sin(phi) * Math.cos(th) * r * sx * k, Math.cos(phi) * r * sy * k, Math.sin(phi) * Math.sin(th) * r * sz * k]);
  }
  return manifold.hull(pts);
}
