// Hand-drawn ink: seeded randomness, stroke outlines (perfect-freehand), draw-on by trimming a stroke's points, and
// the stop-motion boil (each stroke's points nudged afresh every two frames, as a redrawn cel would be).
import { getStroke } from "perfect-freehand";

export type Pt = [number, number];
export type Line = Pt[];

/** a hash of numbers to [0, 1): the same inputs always give the same value */
export function hash(...xs: number[]): number {
  let h = 2166136261;
  for (const x of xs) {
    h ^= Math.floor(x * 1000003) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** a seeded generator */
export function rng(seed: number) {
  let s = (Math.floor(seed * 9301 + 49297) % 233280) + 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** smooth 1D value noise */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;
}

/** smooth 2D value noise in [0, 1) */
export function noise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** progress from frame a to frame b (a span under a frame counts as one frame) */
export const prog = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
/** progress across a part of a 0-1 range: frac(t, 0.7, 1) is 0 at t 0.7 and 1 at t 1 (prog is for frames: its span is
 * at least one, so prog(t, 0.7, 1) stops at 0.3, which left the eye's brow and lashes and the props half drawn) */
export const frac = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

/** stop motion: time held for n frames at a time */
export const step = (f: number, n = 2) => Math.floor(f / n) * n;

/** a stop-motion nudge: the same within each n-frame step, new on the next */
export function nudge(key: number, f: number, amp = 1, n = 2) {
  const s = Math.floor(f / n);
  return { x: (hash(key, s, 1) - 0.5) * 2 * amp, y: (hash(key, s, 2) - 0.5) * 2 * amp, r: (hash(key, s, 3) - 0.5) * 2 * amp * 0.35 };
}

/** a line's length */
export function length(line: Line): number {
  let l = 0;
  for (let i = 1; i < line.length; i++) l += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return l;
}

/** the first `t` (0-1) of a line by length, the last point interpolated */
export function trim(line: Line, t: number): Line {
  if (t >= 1) return line;
  if (t <= 0 || line.length < 2) return [];
  const total = length(line);
  let want = total * t;
  const out: Line = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const seg = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    if (seg >= want) {
      const k = seg ? want / seg : 0;
      out.push([lerp(line[i - 1][0], line[i][0], k), lerp(line[i - 1][1], line[i][1], k)]);
      return out;
    }
    want -= seg;
    out.push(line[i]);
  }
  return out;
}

/** resample a line to points about `every` apart (so boil and pressure look even) */
export function resample(line: Line, every: number): Line {
  if (line.length < 2) return line;
  const total = length(line);
  const n = Math.max(2, Math.ceil(total / every));
  const out: Line = [line[0]];
  let acc = 0;
  let seg = 1;
  const want = total / n;
  // walk the line once, dropping a point every total/n of length
  for (let i = 1; i <= n - 1; i++) {
    const target = want * i;
    while (seg < line.length) {
      const l = Math.hypot(line[seg][0] - line[seg - 1][0], line[seg][1] - line[seg - 1][1]);
      if (acc + l >= target) {
        const k = l ? (target - acc) / l : 0;
        out.push([lerp(line[seg - 1][0], line[seg][0], k), lerp(line[seg - 1][1], line[seg][1], k)]);
        break;
      }
      acc += l;
      seg++;
    }
  }
  out.push(line[line.length - 1]);
  return out;
}

/** the boil: each point moved by smooth noise that changes every `n` frames */
export function boil(line: Line, f: number, key: number, amp = 1.2, n = 2): Line {
  if (amp <= 0) return line;
  const s = Math.floor(f / n);
  return line.map(([x, y], i) => [x + (noise1(i * 0.35, key * 13 + s) - 0.5) * 2 * amp, y + (noise1(i * 0.35, key * 17 + s + 500) - 0.5) * 2 * amp]);
}

export type StrokeOpts = { size: number; thinning?: number; taper?: number; pressure?: (t: number) => number };

/** an inked stroke's filled outline as an SVG path (perfect-freehand), pressure from `pressure(t)` or a gentle swell */
export function inked(line: Line, o: StrokeOpts): string {
  if (line.length < 2) return "";
  const pres = o.pressure ?? ((t: number) => 0.55 + 0.35 * Math.sin(Math.PI * t));
  const pts = line.map(([x, y], i) => [x, y, pres(i / (line.length - 1))]);
  const outline = getStroke(pts, {
    size: o.size,
    thinning: o.thinning ?? 0.55,
    smoothing: 0.6,
    streamline: 0.35,
    simulatePressure: false,
    start: { taper: o.taper ?? o.size * 2, cap: true },
    end: { taper: o.taper ?? o.size * 2, cap: true },
  });
  if (outline.length < 3) return "";
  let d = `M${outline[0][0].toFixed(1)} ${outline[0][1].toFixed(1)}`;
  for (let i = 1; i < outline.length; i++) d += `L${outline[i][0].toFixed(1)} ${outline[i][1].toFixed(1)}`;
  return d + "Z";
}

/** a plain polyline path (for strings, dotted lines) */
export const polyline = (line: Line) => (line.length ? "M" + line.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") : "");

// ── shapes, as point lists
/** a wobbly hand-drawn ellipse that overshoots its start, like a pencil circle */
export function handCircle(cx: number, cy: number, rx: number, ry: number, seed: number, turns = 1.12, start = -0.6): Line {
  const r = rng(seed);
  const wob = 0.06 + r() * 0.04;
  const pts: Line = [];
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + t * Math.PI * 2 * turns;
    const k = 1 + (noise1(t * 4, seed) - 0.5) * wob * 2 + t * 0.05;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}

/** a hand-drawn straight-ish line */
export function handLine(x1: number, y1: number, x2: number, y2: number, seed: number, bow = 0.03): Line {
  const pts: Line = [];
  const n = Math.max(8, Math.round(Math.hypot(x2 - x1, y2 - y1) / 12));
  const nx = -(y2 - y1);
  const ny = x2 - x1;
  const b = (hash(seed, 9) - 0.5) * 2 * bow;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = Math.sin(Math.PI * t) * b + (noise1(t * 6, seed) - 0.5) * 0.006;
    pts.push([lerp(x1, x2, t) + nx * off, lerp(y1, y2, t) + ny * off]);
  }
  return pts;
}

/** a check mark */
export function checkMark(x: number, y: number, s: number, seed: number): Line {
  return resample([[x, y], [x + s * 0.35, y + s * 0.4], [x + s, y - s * 0.55]], 6).map(([px, py], i) => [px + (hash(seed, i) - 0.5) * 2, py + (hash(seed, i, 2) - 0.5) * 2]);
}

/** an arrow: its shaft and its two head strokes */
export function arrow(x1: number, y1: number, x2: number, y2: number, seed: number, bow = 0.08): Line[] {
  const shaft = handLine(x1, y1, x2, y2, seed, bow);
  const a = Math.atan2(y2 - shaft[shaft.length - 3][1], x2 - shaft[shaft.length - 3][0]);
  const h = Math.min(34, Math.hypot(x2 - x1, y2 - y1) * 0.18);
  const head = (da: number) => handLine(x2, y2, x2 - Math.cos(a + da) * h, y2 - Math.sin(a + da) * h, seed + da, 0.02);
  return [shaft, head(0.5), head(-0.5)];
}

/** point in polygon */
export function inside(p: Pt, poly: Line): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** a line cut to the parts inside a test */
export function clipLine(line: Line, keep: (p: Pt) => boolean): Line[] {
  const out: Line[] = [];
  let cur: Line = [];
  for (const p of line) {
    if (keep(p)) cur.push(p);
    else if (cur.length) {
      if (cur.length > 1) out.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** parallel hatching across a region, each line cut to it */
export function hatch(region: (p: Pt) => boolean, box: [number, number, number, number], angle: number, gap: number, seed: number, every = 6): Line[] {
  const [x0, y0, x1, y1] = box;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const out: Line[] = [];
  let k = 0;
  for (let o = -R; o <= R; o += gap) {
    const jitter = (hash(seed, k++) - 0.5) * gap * 0.5;
    const px = cx - dy * (o + jitter);
    const py = cy + dx * (o + jitter);
    const line = handLine(px - dx * R, py - dy * R, px + dx * R, py + dy * R, seed + k, 0.01);
    for (const piece of clipLine(resample(line, every), region)) if (piece.length > 2) out.push(piece);
  }
  return out;
}
