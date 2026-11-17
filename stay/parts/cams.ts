// The cameras: each shot's move as a lens and two places, eased, over the whole shot or from a moment in it. Pure.
// Places are in each place's own layout (blender/blockout.py): the pool hall's near wall at z 0, its pool z -4..-20,
// its high windows in the left wall (x -7) from y 3.0 to 4.2; the sea's water at y 0; the app's screen at its centre;
// the canyon's floor at y 0 running down -z; the glasshouse's bench at (-2.6, 0.9, -5); the road down -z, x -3.5..3.5.
import { PASS, SHOTS, endOf, shotAt } from "./plan";

export type V3 = [number, number, number];
export interface Cam { pos: V3; look: V3; mm: number; roll?: number }
export interface Move { a: Cam; b?: Cam; ease?: "linear" | "in" | "out" | "inout"; /** film seconds the move starts and ends (else the shot's) */ from?: number; to?: number }
/** the vertical field of view of a lens (mm) on a 24 mm-high frame */
export const fovOf = (mm: number) => 2 * Math.atan(12 / mm);
const c = (pos: V3, look: V3, mm: number, roll = 0): Cam => ({ pos, look, mm, roll });

const EASE = { linear: (u: number) => u, in: (u: number) => u * u * u, out: (u: number) => 1 - (1 - u) ** 3, inout: (u: number) => (u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2) };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

const POOL_LOCK = c([3.0, 1.6, -1.2], [-1.6, 0.9, -16], 35);
const SCREEN_DARK: V3 = [0, 1.35, 0];
const SCREEN_SEA: V3 = [0, 2.1, -9];
export const CAMS: Record<string, Move> = {
  none: { a: c([0, 1, 5], [0, 1, 0], 35) },
  // the generator's pool: locked off at eye height on the near deck, the only thing moving the place itself
  lock: { a: POOL_LOCK },
  // the held pool: locked until the comment is sent, then the film's first move, a slow push toward the windows
  push: { a: POOL_LOCK, b: c([1.2, 1.75, -5.5], [-7, 3.2, -12.5], 35), ease: "inout", from: 23.48, to: 27.7 },
  // along the water toward the sun, a few centimetres over it
  // level, a hand over the water, wide enough (24 mm) for the high windows and their reflection in it to share the frame
  water: { a: c([3.4, -0.18, -9.5], [-7, -0.1, -12.2], 24), b: c([2.6, -0.17, -9.9], [-7, -0.1, -12.2], 24), ease: "linear" },
  // the sea: low over the water, gliding out (its horizon where the pool's water line was)
  glide: { a: c([0, 0.22, 0], [0, 0.3, -200], 24), b: c([0, 0.5, -7], [0, 0.4, -200], 24), ease: "out" },
  held: { a: c([0, 0.9, 0], [0, 0.55, -40], 35) },
  // the app in the dark: out of its viewer and round it
  pullback: { a: c([SCREEN_DARK[0], SCREEN_DARK[1], 1.3], SCREEN_DARK, 30), b: c([1.4, 1.5, 3.6], [0.1, 1.3, 0], 30), ease: "out" },
  // the drop: straight at the screen and through it as it bursts, at one speed, so the canyon behind it (app.tsx
  // Through) grows steadily to fill the frame on the cut
  through: { a: c([0.9, 1.45, 2.6], [0.1, 1.35, 0], 30), b: c([0.05, 1.36, 0.3], [0, 1.35, -5], 24), ease: "linear" },
  // the canyon: fast down it, slowing as the light settles
  fly: { a: c([0.4, 1.9, 4], [0.2, 2.6, -20], 18), b: c([0.2, 1.6, -24], [0.2, 2.2, -50], 18), ease: "out" },
  // the glasshouse: a slow arc round the bench from the aisle
  arc: { a: c([1.3, 1.6, -2.6], [-2.6, 1.45, -5], 50), b: c([1.1, 1.55, -7.6], [-2.6, 1.45, -5], 50), ease: "inout" },
  // the push ends where the whole screen (1.92 m) fits the 40 mm frame: 2.9 m out along its face (it's turned 0.35)
  screen: { a: c([1.6, 1.5, -4.2], [0.5, 1.3, -8], 40), b: c([1.49, 1.35, -5.27], [0.5, 1.3, -8], 40), ease: "inout" },
  // the road: low at its edge, creeping forward; at the pass it whips with the car (cams.ts roadAt)
  edge: { a: c([3.1, 0.42, 0], [0.0, 0.5, -40], 35), b: c([3.1, 0.42, -1.2], [0.0, 0.5, -40], 35), ease: "linear" },
  // the paint: sliding along the car's side, close
  slide: { a: c([2.4, 0.78, 1.6], [0.9, 0.7, 0.9], 100), b: c([2.4, 0.78, -1.2], [0.9, 0.7, -1.9], 100), ease: "inout" },
  // the montage: one fast move a place, the same for its reroll and the directed one
  "m-pool": { a: c([5.5, 1.0, -3], [-2, 0.6, -14], 24), b: c([3.5, 1.2, -6], [-4, 0.8, -16], 24), ease: "linear" },
  "m-canyon": { a: c([0.3, 0.8, -6], [0.1, 6, -20], 18), b: c([0.3, 1.2, -10], [0.1, 8, -24], 18), ease: "linear" },
  "m-sea": { a: c([-2, 0.3, 0], [2, 0.6, -60], 28, -0.02), b: c([2, 0.5, -2], [-2, 0.6, -60], 28, 0.02), ease: "linear" },
  "m-glass": { a: c([0.4, 1.5, -2.9], [-2.6, 1.45, -5], 35), b: c([0.1, 1.5, -7.0], [-2.6, 1.45, -5], 35), ease: "linear" },
  "m-road": { a: c([1.0, 0.2, 2], [-0.5, 0.3, -40], 24), b: c([0.6, 0.35, -3], [-0.5, 0.3, -40], 24), ease: "linear" },
  "m-paint": { a: c([2.0, 0.6, 1.0], [0.9, 0.75, 0.2], 85), b: c([2.0, 0.9, -0.6], [0.9, 0.7, -1.0], 85), ease: "linear" },
  // the hero: out of the viewer over the sea, back over the water
  pullout: { a: c([SCREEN_SEA[0], SCREEN_SEA[1], SCREEN_SEA[2] + 1.3], SCREEN_SEA, 30), b: c([1.6, 1.5, SCREEN_SEA[2] + 5.4], [0, 1.9, SCREEN_SEA[2] - 2], 26), ease: "out" },
};

// a montage pair is one move picked up across its cut: the reroll runs its first half, the directed shot the rest
for (const [k, m] of Object.entries(CAMS)) {
  if (!k.startsWith("m-")) continue;
  const idx = SHOTS.flatMap((s, i) => (s.cam === k ? [i] : []));
  m.from = SHOTS[idx[0]].t;
  m.to = endOf(idx[idx.length - 1]);
}

/** the camera at film second `t` */
export function camAt(t: number): Cam {
  const { i, s } = shotAt(t);
  const m = CAMS[s.cam];
  if (!m) throw new Error(`${s.name}: no camera ${s.cam}`);
  if (!m.b) return m.a;
  const a = m.from ?? s.t, b = m.to ?? endOf(i);
  const u = EASE[m.ease ?? "inout"](Math.min(1, Math.max(0, (t - a) / (b - a))));
  const cam: Cam = { pos: lerp3(m.a.pos, m.b.pos, u), look: lerp3(m.a.look, m.b.look, u), mm: lerp(m.a.mm, m.b.mm, u), roll: lerp(m.a.roll ?? 0, m.b.roll ?? 0, u) };
  // the road's whip: from just before the pass the camera's aim follows the car (its lane x -1.6) as it goes by
  if (s.cam === "edge" && t > PASS - 0.6) {
    const k = Math.min(1, (t - (PASS - 0.6)) / 0.9);
    const e = EASE.inout(k);
    cam.look = lerp3(cam.look, [cam.pos[0] - 2.5, 0.5, cam.pos[2] + 12], e);
  }
  return cam;
}
export { SHOTS };
