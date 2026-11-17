// What goes with the cursor in v3 (the cursor itself is v3/hand3d.tsx, a solid in the scene): where a carried thing is,
// the ring a click sends out, and a thing's rectangle on the frame for the pick box and the look's box mask.
import type { V3 } from "../v2/math";
import { project } from "../v2/ui";
import type { Cam } from "./cam";
import { H, W } from "./plan";

export type XY = [number, number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
export const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** where a carried thing is at t: from a to b over from..to, a few frames behind the hand, with a small settle */
export function carried(t: number, a: V3, b: V3, from: number, to: number, lift = 0): V3 {
  const k = jerk((t - from - 0.07) / (to - from));
  const settle = t > to ? Math.exp(-(t - to) * 12) * Math.sin((t - to) * 26) * 0.012 : 0;
  const p = mix3(a, b, k + settle);
  return [p[0], p[1] + lift * Math.sin(Math.PI * k), p[2]];
}
export const on = (cam: Cam, p: V3): XY => { const q = project(cam, p); return [q.x, q.y]; };
/** the 2D ring a click sends out: a thin circle growing and fading over 0.5 s */
export function Ripple({ at, t }: { at: XY; t: number }) {
  if (t < 0 || t > 0.5) return null;
  const k = t / 0.5, r = 14 + 70 * (1 - (1 - k) ** 2);
  return <div style={{ position: "absolute", left: at[0] - r, top: at[1] - r, width: 2 * r, height: 2 * r, borderRadius: r, boxSizing: "border-box", border: `2px solid rgba(255,255,255,${(0.9 * (1 - k)).toFixed(3)})` }} />;
}
/** the frame rectangle of a box in the scene (its centre and half-size), for the look's box mask: x0, y0, x1, y1 */
export function rectOf(cam: Cam, at: V3, half: V3, pad = 8): [number, number, number, number] {
  const c = [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => project(cam, [at[0] + sx * half[0], at[1] + sy * half[1], at[2] + sz * half[2]]))));
  if (c.some((p) => !p.front)) return [0, 0, 0, 0];
  return [Math.min(...c.map((p) => p.x)) - pad, Math.min(...c.map((p) => p.y)) - pad, Math.max(...c.map((p) => p.x)) + pad, Math.max(...c.map((p) => p.y)) + pad];
}

/** the shell of light a click sends out over the surfaces round it (v3/look.tsx `pulse`): of the clicks given, the
 *  latest one that has happened, for 0.7 s, going out at 1.6 m/s and fading */
export function pulseOf(t: number, clicks: { t: number; at: V3 }[]): { at: V3; r: number; k: number } | undefined {
  const c = clicks.filter((x) => t >= x.t && t < x.t + 0.7).sort((a, b) => b.t - a.t)[0];
  if (!c) return undefined;
  const u = (t - c.t) / 0.7;
  return { at: c.at, r: 0.04 + 1.6 * (t - c.t) * (1 - 0.35 * u), k: (1 - u) ** 1.5 };
}
/** a box in the world round a thing (its centre and half-size), a little proud of it: least and greatest corner */
export const boxOf = (at: V3, half: V3, pad = 0.03): [V3, V3] => [[at[0] - half[0] - pad, at[1] - half[1] - pad, at[2] - half[2] - pad], [at[0] + half[0] + pad, at[1] + half[1] + pad, at[2] + half[2] + pad]];
/** a reveal's radius: from a hand's width to `far` metres over `over` seconds, slow away and quickening */
export const spread = (t: number, over: number, far: number) => 0.25 + far * Math.min(1, Math.max(0, t / over)) ** 1.7;
