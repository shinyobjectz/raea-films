// v4, 30-hands: skin for the alien hands (room.tsx). The hands are level sets, smooth as clay at the grid raea samples
// them on (a cube of n³ distances, too coarse for skin), so the skin is put on after: each part's mesh is refined to
// edges a third of a millimetre long, every vertex pulled back onto the true surface (one Newton step along the
// distance's gradient) and then pushed out along the normal by a height field: the furrows that part skin into small
// plateaus, scattered raised bumps, a slow unevenness, and per part the wrinkles over the joints (room.tsx gives those).
// The colour's mottle is a texture (assets/textures/skin, scripts/make_skin.py). A solid's texture coordinates are a
// box projection over its own bounds, so a finger and the back of the hand would take the picture at different sizes:
// every skin part is held in the same cube by two specks at its corners, and the texture has one size on all of them.
import { manifold, type Solid } from "raea/3d";

type V3 = [number, number, number];
export type SDF = (x: number, y: number, z: number) => number;
/** a height over the surface, metres, outward positive */
export type Field = (x: number, y: number, z: number) => number;

const fract = (v: number) => v - Math.floor(v);
const hash = (i: number, j: number, k: number, s: number) => fract(Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + s * 19.31) * 43758.5453);
export const hash1 = (i: number, s = 0) => fract(Math.sin(i * 91.7 + s * 47.3) * 43758.5453);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** the nearest and second nearest of a jittered lattice's points, `c` apart: [F1, F2, the nearest one's own number] */
export function worley(x: number, y: number, z: number, c: number, seed: number): [number, number, number] {
  const X = x / c, Y = y / c, Z = z / c;
  const i0 = Math.floor(X), j0 = Math.floor(Y), k0 = Math.floor(Z);
  let f1 = 1e9, f2 = 1e9, id = 0;
  for (let di = -1; di <= 1; di++)
    for (let dj = -1; dj <= 1; dj++)
      for (let dk = -1; dk <= 1; dk++) {
        const i = i0 + di, j = j0 + dj, k = k0 + dk;
        const dx = i + hash(i, j, k, seed) - X, dy = j + hash(i, j, k, seed + 1) - Y, dz = k + hash(i, j, k, seed + 2) - Z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < f1) {
          f2 = f1;
          f1 = d;
          id = hash(i, j, k, seed + 3);
        } else if (d < f2) f2 = d;
      }
  return [Math.sqrt(f1) * c, Math.sqrt(f2) * c, id];
}

/** smooth value noise, 0..1, features about `c` across */
export function vnoise(x: number, y: number, z: number, c: number, seed: number) {
  const X = x / c, Y = y / c, Z = z / c;
  const i = Math.floor(X), j = Math.floor(Y), k = Math.floor(Z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(X - i), v = s(Y - j), w = s(Z - k);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  const h = (a: number, b: number, d: number) => hash(i + a, j + b, k + d, seed);
  return L(L(L(h(0, 0, 0), h(1, 0, 0), u), L(h(0, 1, 0), h(1, 1, 0), u), v), L(L(h(0, 0, 1), h(1, 0, 1), u), L(h(0, 1, 1), h(1, 1, 1), u), v), w);
}

/** skin everywhere: furrows parting it into plateaus about `cell` across, `depth` deep; a scatter of raised bumps;
 *  a slow unevenness */
export function skinField(cell: number, depth: number, seed: number): Field {
  return (x, y, z) => {
    const [f1, f2] = worley(x, y, z, cell, seed);
    const s = Math.min(1, (f2 - f1) / (0.42 * cell));
    let h = -depth * (1 - s) * (1 - s);
    // bumps: one cell in three of a coarser lattice raises a soft dome
    const [b1, , bid] = worley(x, y, z, cell * 2.3, seed + 11);
    if (bid > 0.62) {
      const r = b1 / (cell * 0.75);
      if (r < 1) h += depth * 1.6 * (bid - 0.5) * 2 * (1 - r * r) * (1 - r * r);
    }
    h += (vnoise(x, y, z, cell * 3.2, seed + 23) - 0.5) * depth * 1.4;
    return h;
  };
}

/** wrinkles as grooves: lines `gap` apart across `s` (each its own depth and reach), `sigma` wide, `depth` deep */
export function grooves(s: number, lateral: number, gap: number, sigma: number, depth: number, reach: number, seed: number) {
  const t = s / gap, k = Math.round(t), d = (t - k) * gap;
  const own = 0.45 + 0.55 * hash1(k, seed);
  const r = reach * (0.55 + 0.45 * hash1(k, seed + 7));
  const lat = Math.exp(-Math.pow(lateral / r, 4));
  return -depth * own * lat * Math.exp(-(d * d) / (sigma * sigma));
}

/** the mesh refined to `edge`, its vertices back on the true surface, then out along the normal by `field` */
export function skinned(base: Solid, sdf: SDF, field: Field, edge: number): Solid {
  const e = 2e-5;
  return base.refineToLength(edge).warp((x, y, z) => {
    let gx = sdf(x + e, y, z) - sdf(x - e, y, z), gy = sdf(x, y + e, z) - sdf(x, y - e, z), gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const g = Math.hypot(gx, gy, gz) || 1;
    gx /= g;
    gy /= g;
    gz /= g;
    // back onto the surface: the sampled mesh sits off it by a fraction of its grid. A vertex further off than that
    // isn't on the skin (a cut face): it stays where it is
    const d = sdf(x, y, z) / ((g / (2 * e)) || 1);
    if (Math.abs(d) > 0.0008) return [x, y, z];
    const px = x - gx * d, py = y - gy * d, pz = z - gz * d;
    const h = field(px, py, pz);
    return [px + gx * h, py + gy * h, pz + gz * h];
  });
}

/** a speck a tenth of a millimetre across at p */
const speck = (p: V3): Solid => manifold.hull([p, [p[0] + 1e-4, p[1], p[2]], [p[0], p[1] + 1e-4, p[2]], [p[0], p[1], p[2] + 1e-4]]);
/** the half-size of the cube every skin part is held in, metres: the texture spans 2·CUBE */
export const CUBE = 0.2;
/** the part held in the cube [-CUBE, CUBE]³ by two specks at its corners, so its box projection spans that cube */
export const cubed = (s: Solid): Solid => manifold.compose(s, speck([-CUBE, -CUBE, -CUBE]), speck([CUBE - 1e-4, CUBE - 1e-4, CUBE - 1e-4]));
