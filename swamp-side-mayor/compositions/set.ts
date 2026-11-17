// The swamp's ground as numbers, shared by everything that stands on it (the terrain mesh, grass, reeds, trees,
// critters, the goose's feet, the lens): a flat meadow stage at the origin, a pond behind it, a mud bank around the
// water, the land rolling up into hills on every side.
export type V3 = [number, number, number];
export const hash = (x: number, z: number) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise = (x: number, z: number) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return (hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u) * (1 - v) + (hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u) * v; };
export const fbm = (x: number, z: number) => noise(x, z) * 0.55 + noise(x * 2.1 + 7, z * 2.1 + 3) * 0.3 + noise(x * 4.3 + 1, z * 4.3 + 9) * 0.15;
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The pond behind the stage: an ellipse with a wandering shore. Negative inside, 0 on the shore, 1 one radius out. */
export const POND = { c: [0, -15] as [number, number], r: [17, 9] as [number, number] };
const shoreR = (a: number) => 1 + 0.14 * Math.sin(a * 3 + 1) + 0.08 * Math.sin(a * 7 + 2) + 0.04 * Math.sin(a * 13);
export const pond = (x: number, z: number) => { const dx = (x - POND.c[0]) / POND.r[0], dz = (z - POND.c[1]) / POND.r[1]; return Math.hypot(dx, dz) / shoreR(Math.atan2(dz, dx)) - 1; };
export const WATER = -0.16;
/** The ground's height at (x, z). The stage (within 5 m of the origin) is flat at 0. */
export function height(x: number, z: number) {
  const p = pond(x, z), stage = sm(5, 12, Math.hypot(x, z));
  const basin = p < 0 ? -0.18 - 1.0 * sm(0, 0.35, -p) : 0.06 * Math.exp(-(((p - 0.05) / 0.05) ** 2));   // the bowl, and a lip of mud on the shore
  const d = Math.hypot(x * 0.85, z + 12);
  const hills = sm(24, 95, d) * (5 + 9 * fbm(x * 0.012 + 3, z * 0.012)) + sm(60, 140, d) * 10 * fbm(x * 0.006, z * 0.006 + 5);
  const roll = (fbm(x * 0.06, z * 0.06) - 0.5) * 0.9 * stage * sm(0.15, 0.5, p);
  return basin + hills + roll;
}
/** The dance floor: a flat of trodden mud at the water's edge, inside the ring of old stones, its edge wandering. Negative inside. */
export const FLOOR = { c: [0, -3.4] as [number, number], r: 2.8 };
export const floor = (x: number, z: number) => { const dx = x - FLOOR.c[0], dz = z - FLOOR.c[1], a = Math.atan2(dz, dx); return Math.hypot(dx, dz * 1.15) - FLOOR.r * (1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7)); };
/** What the ground is at (x, z): 0 meadow, 1 mud, 2 under water. */
export const ground = (x: number, z: number) => { const p = pond(x, z); return p < -0.03 ? 2 : p < 0.09 + 0.04 * noise(x * 0.5, z * 0.5) || floor(x, z) < 0.15 * (noise(x * 3, z * 3) - 0.5) ? 1 : 0; };
