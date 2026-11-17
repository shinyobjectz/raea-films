// Graybox v2's 2D layer over the 3D: the cursor and what it does. Everything here is placed by projecting a point of
// the scene through the shot's camera, so it sits on the thing it acts on, and is drawn in frame pixels at one size,
// so it reads the same in a wide shot and a close one. The cursor is the film's own arrow (blender/cursor.py's
// outline), 6% of the frame's height; pressed it shrinks a little and a ring goes out from its tip.
import { AbsoluteFill } from "raea";
import { H, W } from "./plan";
import { clamp01, type Cam, type V3 } from "./stage";

export { project } from "./aim";
import { project } from "./aim";

const OUTLINE: [number, number][] = [[5, 1], [46, 35.5], [29.5, 35.5], [37.5, 54.5], [26.5, 59.5], [18.5, 38.5], [5, 51]];
export const CURSOR_H = 0.06 * H;
/** the cursor with its tip at (x, y) frame pixels; `press` 0..1 (held down), `ring` 0..1 a click's ring going out */
export function Cursor({ x, y, press = 0, ring = -1 }: { x: number; y: number; press?: number; ring?: number }) {
  const s = (CURSOR_H / 58.5) * (1 - 0.14 * press);
  const pts = OUTLINE.map(([px, py]) => `${((px - 5) * s).toFixed(2)},${((py - 1) * s).toFixed(2)}`).join(" ");
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {ring >= 0 && ring < 1 && (
        <div style={{ position: "absolute", left: x - 10 - 46 * ring, top: y - 10 - 46 * ring, width: 20 + 92 * ring, height: 20 + 92 * ring, borderRadius: 999, boxSizing: "border-box", border: `${(5 * (1 - ring) + 1).toFixed(1)}px solid rgba(255,255,255,${(0.9 * (1 - ring)).toFixed(3)})` }} />
      )}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <polygon points={pts} transform={`translate(${(x + 3).toFixed(1)}, ${(y + 5).toFixed(1)})`} fill="rgba(0,0,0,0.45)" />
        <polygon points={pts} transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`} fill="#ffffff" stroke="#0b0b0d" strokeWidth={3.2 * s} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
}

/** the app's pick box round a thing: the frame-space rectangle of its box's eight corners, as corner brackets */
export function PickBox({ cam, at, half, show = 1, color = "#7c8cff" }: { cam: Cam; at: V3; half: V3; show?: number; color?: string }) {
  const c = [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => project(cam, [at[0] + sx * half[0], at[1] + sy * half[1], at[2] + sz * half[2]]))));
  if (show <= 0 || c.some((p) => !p.front)) return null;
  const x0 = Math.min(...c.map((p) => p.x)) - 6, x1 = Math.max(...c.map((p) => p.x)) + 6, y0 = Math.min(...c.map((p) => p.y)) - 6, y1 = Math.max(...c.map((p) => p.y)) + 6;
  const L = Math.min(34, (x1 - x0) / 3, (y1 - y0) / 3), t = 4, a = clamp01(show);
  const bar = (left: number, top: number, w: number, h: number, k: string) => <div key={k} style={{ position: "absolute", left, top, width: w, height: h, background: color, opacity: a }} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {bar(x0, y0, L, t, "a")}{bar(x0, y0, t, L, "b")}{bar(x1 - L, y0, L, t, "c")}{bar(x1 - t, y0, t, L, "d")}
      {bar(x0, y1 - t, L, t, "e")}{bar(x0, y1 - L, t, L, "f")}{bar(x1 - L, y1 - t, L, t, "g")}{bar(x1 - t, y1 - L, t, L, "h")}
    </AbsoluteFill>
  );
}

/** a path through frame points at times: where it is at t (eased between each pair), for the cursor's travel */
export function along(t: number, keys: [number, number, number][]): [number, number] {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const k = clamp01((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])), e = k * k * (3 - 2 * k);
      return [keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * e, keys[i - 1][2] + (keys[i][2] - keys[i - 1][2]) * e];
    }
  }
  const l = keys[keys.length - 1];
  return [l[1], l[2]];
}

/** the turn handle: a ring round a thing's pivot (frame pixels) with the arc turned so far drawn bright, and where the
 *  cursor is on it. the director, 11-11: "the mous emovements can do postion and rotatin ... we shoudl ahve more complex mouse
 *  movements": a turn is the cursor travelling round the ring, not a slide. */
export function turnAt(x: number, y: number, r: number, from: number, to: number, k: number): [number, number] {
  const a = ((from + (to - from) * k) * Math.PI) / 180;
  return [x + r * Math.cos(a), y + r * 0.62 * Math.sin(a)];
}
export function TurnRing({ x, y, r, from, to, k, color = "#7c8cff" }: { x: number; y: number; r: number; from: number; to: number; k: number; color?: string }) {
  const dots = 72;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: dots }, (_, i) => {
        const q = i / (dots - 1), [px, py] = turnAt(x, y, r, from, from + 360, q);
        const done = q * 360 <= Math.abs(to - from) * k;
        return <div key={i} style={{ position: "absolute", left: px - (done ? 4 : 2), top: py - (done ? 4 : 2), width: done ? 8 : 4, height: done ? 8 : 4, borderRadius: 4, background: color, opacity: done ? 1 : 0.35 }} />;
      })}
    </AbsoluteFill>
  );
}
