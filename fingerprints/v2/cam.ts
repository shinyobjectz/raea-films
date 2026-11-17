// The cameras: one per shot, each already moving when its shot opens and still moving when it cuts (a straight line
// from `eye[0]` to `eye[1]` over the shot, the same for what it looks at). project() says where a point in the scene
// is on the 1920x1080 frame, so type can be pinned to the hand and the desk.
import { SHOTS, shotAt, type ShotName } from "./time";
import type { V3 } from "./rig";

export type Shot = { eye: [V3, V3]; at: [V3, V3]; fov: number; fstop: number; focus?: V3 };
export const CAMS: Record<ShotName, Shot> = {
  hand: { eye: [[3.8, 1.9, -2.1], [3.2, 1.8, -1.5]], at: [[0.3, 0.7, 1.4], [0.3, 1.1, 1.4]], fov: 34, fstop: 4 },
  draw: { eye: [[3.0, 1.6, 3.5], [2.6, 1.35, 3.2]], at: [[0.35, 0.15, 2.3], [0.35, 0.15, 2.3]], fov: 30, fstop: 4, focus: [0.35, 0.05, 2.3] },
  paint: { eye: [[2.9, 2.3, 0.1], [2.5, 2.0, 0.4]], at: [[0.2, 0.1, 2.2], [0.2, 0.1, 2.2]], fov: 34, fstop: 4 },
  conduct: { eye: [[3.4, 4.6, -2.6], [2.7, 4.9, -3.0]], at: [[0.3, 5.3, 1.6], [0.3, 5.3, 1.6]], fov: 38, fstop: 4 },
  notes: { eye: [[-0.9, 3.5, -1.3], [0.7, 3.1, -1.1]], at: [[0.05, 0, 2.2], [0.05, 0, 2.2]], fov: 36, fstop: 4 },
  machine: { eye: [[3.2, 3.0, -2.0], [2.7, 2.8, -1.6]], at: [[0.2, 2.4, 1.6], [0.2, 2.4, 1.6]], fov: 32, fstop: 2.8 },
  print: { eye: [[2.9, 1.7, 1.9], [2.5, 1.35, 2.2]], at: [[0.5, 0.15, 3.3], [0.5, 0.1, 3.3]], fov: 30, fstop: 2.8, focus: [0.55, 0.05, 3.35] },
  approve: { eye: [[3.4, 3.7, -2.6], [2.9, 3.8, -2.2]], at: [[0.2, 3.9, 1.6], [0.2, 4.0, 1.6]], fov: 34, fstop: 2.8 },
  pick: { eye: [[3.1, 2.1, 4.0], [2.7, 1.9, 3.7]], at: [[0.1, 0.1, 2.5], [0.2, 0.1, 2.4]], fov: 34, fstop: 4 },
  hotel: { eye: [[3.2, 3.3, -2.0], [2.8, 3.2, -1.7]], at: [[0.2, 3.2, 1.6], [0.2, 3.2, 1.6]], fov: 34, fstop: 2.8 },
  strip: { eye: [[-0.2, 2.4, 0.0], [-0.5, 2.0, 0.3]], at: [[-0.3, 0, 2.75], [-0.5, 0, 2.8]], fov: 36, fstop: 4 },
  cover: { eye: [[-0.9, 3.6, -1.0], [-0.5, 3.2, -0.6]], at: [[-0.5, 0.1, 2.6], [-0.5, 0.1, 2.6]], fov: 36, fstop: 4 },
  work: { eye: [[2.7, 1.7, 4.1], [2.3, 1.5, 3.8]], at: [[0.35, 0.15, 2.75], [0.35, 0.15, 2.75]], fov: 30, fstop: 4, focus: [0.35, 0.05, 2.9] },
  end: { eye: [[0.05, 2.5, 3.05], [0.05, 2.1, 3.1]], at: [[0.05, 0, 3.25], [0.05, 0, 3.25]], fov: 28, fstop: 4, focus: [0.55, 0, 3.35] },
};

const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

export type Cam = { name: ShotName; index: number; eye: V3; at: V3; fov: number; fstop: number; focus: number; k: number; first: boolean };
/** the camera at second t (fps tells it which frame is a shot's first) */
export function camAt(t: number, fps = 24): Cam {
  const i = shotAt(t);
  const [name, from, to] = SHOTS[i];
  const c = CAMS[name];
  const k = (t - from) / (to - from);
  const eye = mix3(c.eye[0], c.eye[1], k);
  const at = mix3(c.at[0], c.at[1], k);
  return { name, index: i, eye, at, fov: c.fov, fstop: c.fstop, focus: Math.hypot(...sub(c.focus ?? at, eye)), k, first: i > 0 && Math.round((t - from) * fps) === 0 };
}
/** where p lands on the frame, in pixels of 1920x1080, and whether it is in front of the camera */
export function project(cam: Cam, p: V3, W = 1920, H = 1080): { x: number; y: number; front: boolean } {
  const f = norm(sub(cam.at, cam.eye));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(p, cam.eye);
  const z = dot(d, f);
  const s = H / 2 / Math.tan((cam.fov * Math.PI) / 360);
  return { x: W / 2 + (dot(d, r) / z) * s, y: H / 2 - (dot(d, u) / z) * s, front: z > 0.05 };
}
