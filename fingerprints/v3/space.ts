// Where everything is, and the one camera that flies through it. The splats stand along a line through space (each
// about two units across); the camera's path is a smooth curve through keys of [second, where it is, what it looks
// at], so it never cuts and never stops: it pans, pushes and swings round each thing as the narrator gets to it.
import { CUE, SECONDS } from "./time";

export type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** the stations */
export const AT = {
  nothing: [0, 0, 0] as V3, // the dust, and the hand that comes out of it
  brain: [7, 1, -5] as V3,
  neurons: [14, -1, -1] as V3,
  loop: [17.5, 1.5, -7] as V3, // the attractor
  paint: [25, 0, -3] as V3,
  vase: [29.5, -0.3, 1.5] as V3,
  whorl: [36.5, 1, -6] as V3,
  camera: [43, 0, -1] as V3,
  film: [49, 0.5, -8] as V3, // the cut's helix, with Fingerprint's whorl inside it
  machine: [59, 0, -3] as V3, // the galaxy in its frame
  cat: [67, 0.4, 1] as V3,
  sky: [53, 6, -14] as V3, // the galaxy, over the far end of it all
};
/** the two flagged frames on the helix, relative to its middle (v3 splats: frame 21 "too dark", frame 12 "hiss") */
const frameAt = (i: number): V3 => { const u = i / 35, a = u * 2.1 * Math.PI * 2; return [Math.cos(a), (u - 0.5) * 1.7, Math.sin(a)]; };
export const DARK = add(AT.film, frameAt(21));
export const HISS = add(AT.film, frameAt(12));
const out = (i: number, d: number): V3 => { const f = frameAt(i); return add(AT.film, [f[0] * d, f[1], f[2] * d]); };

type Key = [number, V3, V3];
const K = (t: number, of: V3, eye: V3, look: V3 = [0, 0, 0]): Key => [t, add(of, eye), add(of, look)];
export const KEYS: Key[] = [
  K(0, AT.nothing, [1.6, 0.6, 8.2]),
  K(CUE.colourful + 2.2, AT.nothing, [2.4, 0.7, 4.4]),
  K(CUE.stayed + 0.6, AT.nothing, [1.2, 0.6, 3.3]),
  K(CUE.bold + 0.6, AT.nothing, [-1.4, 0.5, 2.3]),
  K(CUE.trouble, AT.brain, [-3.2, 0.6, 3.2]),
  K(CUE.touchEnd + 0.35, AT.brain, [-0.5, 0.3, 2.0]), // leaning in: this is the touch
  K(CUE.pop + 0.9, AT.brain, [-0.2, 0.3, 4.4]), // and the flinch
  K(CUE.anyway + 0.8, AT.brain, [1.8, 0.7, 3.2]),
  K(CUE.this, AT.neurons, [-2.2, 0.6, 3.2]),
  K(CUE.looping - 0.4, AT.neurons, [1.2, 0.1, 2.4], [1.2, 0.8, -2]),
  K(CUE.opinions + 0.4, AT.loop, [-1.2, 0.3, 3.2]),
  K(CUE.refusals, AT.paint, [-2.6, 0.7, 3.4]),
  K(CUE.blue + 0.4, AT.paint, [0.8, 0.2, 2.8]),
  K(CUE.vase + 0.2, AT.vase, [-1.2, 0.4, 2.9]),
  K(CUE.know, AT.vase, [1.3, 0.3, 2.7], [0.8, 0.1, 0]),
  K(CUE.pattern + 0.3, AT.whorl, [-1.8, 0.2, 3.2]),
  K(CUE.biometrics + 0.8, AT.whorl, [1.5, 0.5, 2.4]),
  K(CUE.videos + 0.5, AT.camera, [-1.6, 0.6, 2.8]),
  K(CUE.wrong, AT.film, [-3.6, 1.2, 4.6]),
  [CUE.dark + 0.3, out(21, 2.5), DARK],
  K(CUE.notes + 1.2, AT.film, [-2.1, 0.7, 3.1]),
  K(CUE.words, AT.film, [2.0, 0.6, 3.0]),
  [CUE.fixed + 0.3, add(out(21, 2.7), [0.3, 0.1, 0]), DARK],
  K((CUE.fixed + CUE.there) / 2 + 0.6, AT.film, [-3.5, 0.5, 0.2]), // round the outside of the helix, not through it
  [CUE.there + 0.2, out(12, 2.6), HISS],
  K(CUE.insufferable + 0.8, AT.film, [-3.0, 0.8, -3.0]),
  K(CUE.machine + 0.2, AT.machine, [-4.4, 1.9, 5.8]),
  K(CUE.never + 0.6, AT.machine, [2.4, 1.5, 5.2]),
  [CUE.chaos2 + 0.4, [47, 7, 19], [42, 0, -4]], // back far enough to see most of it at once
  [CUE.pattern2 + 1.0, [54, 5, 15], [50, 0, -4]],
  K(CUE.cat - 0.2, AT.cat, [-2.6, 0.6, 3.2]),
  K(CUE.consulted + 0.6, AT.cat, [0.4, 0.25, 2.6], [-0.5, 0, 0]),
  K(SECONDS, AT.cat, [0.9, 0.5, 3.5], [-1.7, -0.1, 0]),
];

// Catmull-Rom through the keys, by time
function curve(t: number, pick: (k: Key) => V3): V3 {
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++;
  const k0 = KEYS[Math.max(0, i - 1)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const u = Math.min(1, Math.max(0, (t - k1[0]) / (k2[0] - k1[0])));
  const a = pick(k0), b = pick(k1), c = pick(k2), d = pick(k3);
  // tangents by the keys' times, so an uneven spacing doesn't lurch
  const dt = k2[0] - k1[0];
  const m1 = b.map((_, q) => ((c[q] - a[q]) / Math.max(1e-3, k2[0] - k0[0])) * dt) as V3;
  const m2 = b.map((_, q) => ((d[q] - b[q]) / Math.max(1e-3, k3[0] - k1[0])) * dt) as V3;
  const h1 = 2 * u ** 3 - 3 * u ** 2 + 1, h2 = u ** 3 - 2 * u ** 2 + u, h3 = -2 * u ** 3 + 3 * u ** 2, h4 = u ** 3 - u ** 2;
  return [0, 1, 2].map((q) => h1 * b[q] + h2 * m1[q] + h3 * c[q] + h4 * m2[q]) as V3;
}
export type Cam = { eye: V3; at: V3; fov: number };
export function camAt(t: number): Cam {
  return { eye: curve(t, (k) => k[1]), at: curve(t, (k) => k[2]), fov: 42 };
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** where p lands on the 1920x1080 frame */
export function project(cam: Cam, p: V3): { x: number; y: number; front: boolean } {
  const f = norm(sub(cam.at, cam.eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, cam.eye), z = dot(d, f);
  const s = 540 / Math.tan((cam.fov * Math.PI) / 360);
  return { x: 960 + (dot(d, r) / z) * s, y: 540 - (dot(d, u) / z) * s, front: z > 0.1 };
}
