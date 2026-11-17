// Where a point of the scene lands on the frame, and a camera turned so that it lands on a thirds place: how a shot's
// hook is put where the chain says (board/chain.ts). No engine imports: the cut check runs this under bun.
import type { At } from "../board/thirds";
import { H, W, px } from "./plan";
import type { V3 } from "./math";

export type Lens = { eye: V3; look: V3; fov: number };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const basis = (c: Lens) => { const f = norm(sub(c.look, c.eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f); return { f, r, u }; };
/** where a point lands on the frame, pixels, and whether it's in front of the camera */
export function project(c: Lens, p: V3): { x: number; y: number; front: boolean; depth: number } {
  const { f, r, u } = basis(c), d = sub(p, c.eye), z = dot(d, f), k = 1 / Math.tan((c.fov * Math.PI) / 360);
  return { x: W / 2 + (dot(d, r) / Math.max(z, 1e-6)) * k * (H / 2), y: H / 2 - (dot(d, u) / Math.max(z, 1e-6)) * k * (H / 2), front: z > 0.05, depth: z };
}
/** the same eye and lens, turned so `target` lands on the thirds place `at` */
export function aim<T extends { eye: V3; look: V3; fov?: number }>(view: T, target: V3, at: At): T {
  const want = px(at), fov = view.fov ?? 38;
  let look: V3 = [...target];
  for (let i = 0; i < 12; i++) {
    const c = { eye: view.eye, look, fov }, got = project(c, target), { r, u } = basis(c);
    const m = got.depth / ((1 / Math.tan((fov * Math.PI) / 360)) * (H / 2));
    const dx = (got.x - want[0]) * m, dy = (got.y - want[1]) * m;
    look = [look[0] + r[0] * dx - u[0] * dy, look[1] + r[1] * dx - u[1] * dy, look[2] + r[2] * dx - u[2] * dy];
  }
  return { ...view, look };
}
