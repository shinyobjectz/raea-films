// The drawn props: an engraving-style eye whose iris is a fingerprint, a film strip of the coffee film, a sound
// track drawn in ink (with its hiss as stipple), a laptop, film reels and a padlock. Geometry is built once and
// drawn on by `t`; everything boils on twos.
import { Img, staticFile } from "raea";
import { type Line, type Pt, arrow, clamp, frac, handCircle, handLine, hash, hatch, inside, lerp, noise1, resample, rng } from "./ink";
import { C, Ink, Wire } from "./draw";
import { PRINT_RIDGES } from "./draw";

// ── the eye ───────────────────────────────────────────────────────────────────────────────────────────────────
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 60): Line =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  });
const INNER: Pt = [-1, 0.02];
const OUTER: Pt = [1, -0.04];
const UPPER = bez(INNER, [-0.55, -0.66], [0.45, -0.74], OUTER);
const LOWER = bez(INNER, [-0.45, 0.44], [0.5, 0.38], OUTER);
const CREASE = bez([-0.92, -0.2], [-0.5, -0.98], [0.55, -1.02], [1.1, -0.16]);
const OPENING: Line = [...UPPER, ...[...LOWER].reverse()];
const lidY = (curve: Line, x: number) => {
  for (let i = 1; i < curve.length; i++) if (curve[i][0] >= x) return lerp(curve[i - 1][1], curve[i][1], (x - curve[i - 1][0]) / (curve[i][0] - curve[i - 1][0] || 1));
  return curve[curve.length - 1][1];
};
const IRIS_C: Pt = [0.02, -0.1];
const IRIS_R = 0.4;

function eyeLayers(gx: number, gy: number) {
  const ic: Pt = [IRIS_C[0] + gx, IRIS_C[1] + gy];
  const inOpen = (p: Pt) => inside(p, OPENING);
  const inIris = (p: Pt) => Math.hypot(p[0] - ic[0], p[1] - ic[1]) < IRIS_R;
  const outPupil = (p: Pt) => Math.hypot(p[0] - ic[0], p[1] - ic[1]) > 0.16;
  const clip = (l: Line, test: (p: Pt) => boolean): Line[] => {
    const out: Line[] = [];
    let cur: Line = [];
    for (const p of l) {
      if (test(p)) cur.push(p);
      else if (cur.length > 1) { out.push(cur); cur = []; } else cur = [];
    }
    if (cur.length > 1) out.push(cur);
    return out;
  };
  const limbus = clip(handCircle(ic[0], ic[1], IRIS_R, IRIS_R, 11, 1.05, -1.2), inOpen);
  const ridges: Line[] = [];
  for (const r of PRINT_RIDGES) {
    const l = r.line.map(([x, y]) => [ic[0] + (x - 0.03) * 0.46, ic[1] + (y + 0.22) * 0.4] as Pt);
    for (const piece of clip(l, (p) => inOpen(p) && inIris(p) && outPupil(p))) ridges.push(piece);
  }
  // radial fibres between the ridges, thin
  const fibres: Line[] = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2 + hash(k, 4) * 0.05;
    const r0 = 0.17 + hash(k, 5) * 0.03;
    const r1 = IRIS_R - 0.02 - hash(k, 6) * 0.08;
    const l: Line = resample([[ic[0] + Math.cos(a) * r0, ic[1] + Math.sin(a) * r0], [ic[0] + Math.cos(a + 0.05) * r1, ic[1] + Math.sin(a + 0.05) * r1]], 0.02);
    for (const piece of clip(l, inOpen)) fibres.push(piece);
  }
  return { ic, limbus, ridges, fibres };
}

const LASHES_UP: Line[] = Array.from({ length: 38 }, (_, i) => {
  const t = 0.06 + (i / 37) * 0.9;
  const idx = Math.round(t * (UPPER.length - 1));
  const p = UPPER[idx];
  const q = UPPER[Math.min(UPPER.length - 1, idx + 1)];
  const tx = q[0] - p[0];
  const ty = q[1] - p[1];
  const len = Math.hypot(tx, ty) || 1;
  const nx = ty / len;
  const ny = -tx / len; // outward (up)
  const L = 0.1 + 0.16 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + hash(i, 1) * 0.04;
  const lean = 0.25 + t * 0.9;
  return resample(bez(p, [p[0] + nx * L * 0.5 + lean * L * 0.2, p[1] + ny * L * 0.5], [p[0] + nx * L * 0.85 + lean * L * 0.6, p[1] + ny * L * 0.8], [p[0] + nx * L + lean * L * 0.9, p[1] + ny * L * 0.75 - 0.02], 10), 0.012);
});
const LASHES_DOWN: Line[] = Array.from({ length: 20 }, (_, i) => {
  const t = 0.18 + (i / 19) * 0.76;
  const p = LOWER[Math.round(t * (LOWER.length - 1))];
  const L = 0.04 + 0.05 * Math.sin(Math.PI * t) + hash(i, 2) * 0.02;
  return resample([p, [p[0] + 0.02 + t * 0.04, p[1] + L * 0.6], [p[0] + 0.03 + t * 0.07, p[1] + L]], 0.01);
});
// shading: the fold between lid and crease, under the lower lid, and the lid's shadow on the eyeball
const FOLD = hatch((p) => p[1] < lidY(UPPER, p[0]) - 0.02 && p[1] > lidY(CREASE, p[0]) + 0.04 && p[0] > -0.9 && p[0] < 1.04, [-1, -1.1, 1.1, 0], -0.7, 0.05, 21, 0.02);
const FOLD_X = hatch((p) => p[1] < lidY(UPPER, p[0]) - 0.03 && p[1] > lidY(CREASE, p[0]) + 0.12 && (p[0] < -0.45 || p[0] > 0.55), [-1, -1.1, 1.1, 0], 0.5, 0.06, 22, 0.02);
const UNDER = hatch((p) => p[1] > lidY(LOWER, p[0]) + 0.03 && p[1] < lidY(LOWER, p[0]) + 0.2 - Math.abs(p[0]) * 0.1 && p[0] > -0.85 && p[0] < 0.95, [-1, -0.1, 1.1, 0.7], 0.35, 0.05, 23, 0.02);
const BALL = hatch((p) => inside(p, OPENING) && p[1] < lidY(UPPER, p[0]) + 0.1, [-1, -0.8, 1.1, 0.1], -0.1, 0.035, 24, 0.02);
const CREASE_DOUBLE = bez([-0.85, -0.26], [-0.5, -1.03], [0.55, -1.08], [1.05, -0.24]);
const OUTLINE: Line[] = [UPPER, LOWER, CREASE, CREASE_DOUBLE].map((l) => resample(l, 0.015));

/** the eye: drawn on as t goes 0 to 1; gaze moves the iris (x, y in units of the eye's half-width). It has no brow on
 * purpose: it's the film's emblem, not a face, and a brow above it read as a stray lash (the director, v1 and v5) */
export function Eye({ f, t, cx, cy, s, gaze = [0, 0], k = 30 }: { f: number; t: number; cx: number; cy: number; s: number; gaze?: [number, number]; k?: number }) {
  const L = eyeLayers(gaze[0], gaze[1]);
  const S = (lines: Line[]) => lines.map((l) => l.map(([x, y]) => [cx + x * s, cy + y * s] as Pt));
  const ph = (a: number, b: number) => frac(t, a, b);
  const pupil: Pt = [cx + L.ic[0] * s, cy + L.ic[1] * s];
  return (
    <g>
      <Ink lines={S(BALL)} f={f} t={ph(0.55, 0.85)} size={s * 0.006} k={k + 7} color={C.ink} opacity={0.75} />
      <Ink lines={S(L.fibres)} f={f} t={ph(0.4, 0.62)} size={s * 0.004} k={k + 8} opacity={0.55} />
      <Ink lines={S(L.ridges)} f={f} t={ph(0.38, 0.75)} size={s * 0.008} k={k + 9} />
      <Ink lines={S(L.limbus)} f={f} t={ph(0.28, 0.4)} size={s * 0.022} k={k + 10} />
      {ph(0.3, 0.36) > 0 ? <circle cx={pupil[0]} cy={pupil[1]} r={s * 0.15 * clamp(ph(0.3, 0.38) * 1.2)} fill={C.ink} /> : null}
      {ph(0.36, 0.4) > 0 ? <ellipse cx={pupil[0] + s * 0.1} cy={pupil[1] - s * 0.11} rx={s * 0.055} ry={s * 0.045} fill={C.paper} /> : null}
      <Ink lines={S(OUTLINE)} f={f} t={ph(0, 0.3)} size={s * 0.016} k={k} />
      <Ink lines={S(LASHES_UP)} f={f} t={ph(0.42, 0.62)} size={s * 0.011} k={k + 1} />
      <Ink lines={S(LASHES_DOWN)} f={f} t={ph(0.5, 0.65)} size={s * 0.007} k={k + 2} />
      <Ink lines={S(FOLD)} f={f} t={ph(0.6, 0.85)} size={s * 0.0055} k={k + 3} opacity={0.85} />
      <Ink lines={S(FOLD_X)} f={f} t={ph(0.75, 0.95)} size={s * 0.005} k={k + 4} opacity={0.8} />
      <Ink lines={S(UNDER)} f={f} t={ph(0.68, 0.92)} size={s * 0.005} k={k + 5} opacity={0.8} />
    </g>
  );
}

// ── the film strip ──────────────────────────────────────────────────────────────────────────────────────────
export const STILL = (v: "v1" | "v3", i: number) => staticFile(`stills/${v}-${i}.jpg`);

/** a strip of film printed on paper: frames of the coffee film with sprocket holes; `frames` are image URLs */
export function FilmStrip({ frames, fw = 300, gap = 14, styleOf, labels }: { frames: string[]; fw?: number; gap?: number; styleOf?: (i: number) => React.CSSProperties; labels?: string[] }) {
  const fh = Math.round(fw * 0.5625);
  const band = Math.round(fw * 0.1);
  const W = frames.length * (fw + gap) + gap;
  const H = fh + band * 2;
  const holes = Math.floor(W / (fw * 0.11));
  return (
    <div style={{ position: "relative", width: W, height: H, background: "#191510" }}>
      {[0, 1].map((row) =>
        Array.from({ length: holes }, (_, i) => (
          <div key={`${row}-${i}`} style={{ position: "absolute", left: 10 + i * (fw * 0.11), top: row ? H - band * 0.72 : band * 0.28, width: fw * 0.055, height: band * 0.44, borderRadius: 3, background: "#e9dfc9" }} />
        )),
      )}
      {frames.map((src, i) => (
        <div key={i} style={{ position: "absolute", left: gap + i * (fw + gap), top: band, width: fw, height: fh, overflow: "hidden", background: "#000" }}>
          <Img src={src} style={{ width: fw, height: fh, objectFit: "cover", ...(styleOf ? styleOf(i) : {}) }} />
        </div>
      ))}
      {labels
        ? labels.map((l, i) => (
            // edge print sits in the sprocket band: a film-black backing keeps it off the cream holes behind it
            <div key={`l${i}`} style={{ position: "absolute", left: gap + i * (fw + gap) + 4, top: H - band + 2, padding: "1px 5px", background: "#191510", fontFamily: "Special Elite", fontSize: band * 0.62, color: "#e9dfc9", lineHeight: 1 }}>
              {l}
            </div>
          ))
        : null}
    </div>
  );
}

// ── the sound, drawn ────────────────────────────────────────────────────────────────────────────────────────
/** a voice's waveform drawn in ink as a sound track is drawn (a stroke per sliver, top to bottom), with hiss as a
 * dense speckle between hissFrom and hissTo (0-1 of its width) at strength `hiss` */
export function Waveform({ f, x, y, w, h, t = 1, hiss = 0, hissFrom = 0, hissTo = 1, k = 50, color = C.ink, hissColor = C.ink }: { f: number; x: number; y: number; w: number; h: number; t?: number; hiss?: number; hissFrom?: number; hissTo?: number; k?: number; color?: string; hissColor?: string }) {
  const n = Math.round(w / 7);
  const bars: Line[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const word = Math.pow(noise1(u * 14, k), 1.4) * (0.35 + 0.65 * noise1(u * 3.1, k + 1));
    const gapless = noise1(u * 5.3, k + 2) > 0.22 ? 1 : 0.12;
    const env = Math.max(0.04, word * gapless * (u > 0.02 && u < 0.98 ? 1 : 0.2));
    const px = x + u * w;
    bars.push([[px, y - env * h * 0.5], [px + 0.5, y + env * h * 0.5]]);
  }
  const dots: [number, number, number][] = [];
  if (hiss > 0) {
    const r = rng(k + Math.floor(f / 2) * 3);
    const count = Math.round(900 * hiss * (hissTo - hissFrom));
    for (let i = 0; i < count; i++) {
      const px = x + w * (hissFrom + r() * (hissTo - hissFrom));
      const py = y + (r() - 0.5) * h * (0.5 + 0.6 * hiss);
      dots.push([px, py, 1 + r() * 1.4]);
    }
  }
  return (
    <g>
      <Ink lines={bars} f={f} t={t} size={3.4} k={k} color={color} boilAmp={0.6} />
      {dots.length ? <path d={dots.map(([px, py, r]) => `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`).join("")} fill={hissColor} /> : null}
    </g>
  );
}

// ── a laptop, drawn ─────────────────────────────────────────────────────────────────────────────────────────
const LAPTOP = (() => {
  const lines: Line[] = [];
  const box = (x0: number, y0: number, x1: number, y1: number, seed: number) => {
    lines.push(handLine(x0, y0, x1, y0, seed, 0.01), handLine(x1, y0, x1, y1, seed + 1, 0.01), handLine(x1, y1, x0, y1, seed + 2, 0.01), handLine(x0, y1, x0, y0, seed + 3, 0.01));
  };
  box(0, 0, 1, 0.64, 1); // the lid
  box(0.045, 0.05, 0.955, 0.6, 5); // the screen
  lines.push(handCircle(0.5, 0.025, 0.006, 0.006, 9, 1.05));
  // the base, in perspective toward us
  lines.push(handLine(-0.04, 0.66, 1.04, 0.66, 12, 0.005), handLine(1.04, 0.66, 1.12, 0.98, 13, 0.01), handLine(1.12, 0.98, -0.12, 0.98, 14, 0.005), handLine(-0.12, 0.98, -0.04, 0.66, 15, 0.01));
  lines.push(handLine(-0.12, 1.0, 1.12, 1.0, 16, 0.003));
  // keys: five rows, narrowing up the base
  for (let r = 0; r < 5; r++) {
    const y0 = 0.685 + r * 0.04;
    const y1 = y0 + 0.032;
    const xl = lerp(0.02, -0.03, r / 5);
    const xr = lerp(0.98, 1.03, r / 5);
    const n = r === 4 ? 9 : 13;
    for (let i = 0; i < n; i++) {
      let a = lerp(xl, xr, i / n) + 0.004;
      let b = lerp(xl, xr, (i + 1) / n) - 0.004;
      if (r === 4 && i === 4) { b = lerp(xl, xr, 5 / n) - 0.004; }
      if (r === 4 && i > 4 && i < 5) continue;
      box(a, y0, b, y1, 100 + r * 20 + i);
      void a;
    }
  }
  box(0.36, 0.895, 0.64, 0.965, 300); // the trackpad
  return lines.map((l) => resample(l, 0.008));
})();
const LAPTOP_SHADE = hatch((p) => (p[0] < 0.045 || p[0] > 0.955 || p[1] < 0.05 || p[1] > 0.6) && p[0] > 0 && p[0] < 1 && p[1] > 0 && p[1] < 0.64, [0, 0, 1, 0.64], -0.8, 0.012, 7, 0.006);

/** a laptop drawn in ink, w wide; its screen is (0.045..0.955, 0.05..0.6) of w */
export function Laptop({ f, t, x, y, w, k = 70 }: { f: number; t: number; x: number; y: number; w: number; k?: number }) {
  const S = (ls: Line[]) => ls.map((l) => l.map(([px, py]) => [x + px * w, y + py * w] as Pt));
  return (
    <g>
      <Ink lines={S(LAPTOP)} f={f} t={frac(t, 0, 0.75)} size={w * 0.0042} k={k} />
      <Ink lines={S(LAPTOP_SHADE)} f={f} t={frac(t, 0.5, 1)} size={w * 0.0022} k={k + 1} opacity={0.8} />
    </g>
  );
}

// ── film reels and a padlock ────────────────────────────────────────────────────────────────────────────────
export function Reel({ f, t, cx, cy, r, k = 80, color = C.ink }: { f: number; t: number; cx: number; cy: number; r: number; k?: number; color?: string }) {
  const lines: Line[] = [handCircle(cx, cy, r, r, k, 1.04), handCircle(cx, cy, r * 0.22, r * 0.22, k + 1, 1.04), handCircle(cx, cy, r * 0.07, r * 0.07, k + 2, 1.02)];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    lines.push(handCircle(cx + Math.cos(a) * r * 0.58, cy + Math.sin(a) * r * 0.58, r * 0.2, r * 0.2, k + 10 + i, 1.03));
  }
  const winds: Line[] = [];
  for (let i = 0; i < 9; i++) winds.push(handCircle(cx, cy, r * (0.86 + i * 0.012), r * (0.86 + i * 0.012), k + 30 + i, 1.0, hash(k, i) * 6));
  return (
    <g>
      <Ink lines={lines} f={f} t={t} size={Math.max(2.2, r * 0.035)} k={k} color={color} />
      <Ink lines={winds} f={f} t={frac(t, 0.5, 1)} size={1.6} k={k + 1} color={color} opacity={0.7} />
    </g>
  );
}

export function Padlock({ f, t, x, y, s, k = 90, color = C.ink, open = 0 }: { f: number; t: number; x: number; y: number; s: number; k?: number; color?: string; open?: number }) {
  const lift = open * s * 0.25;
  const shackle: Line = Array.from({ length: 40 }, (_, i) => {
    const a = Math.PI + (i / 39) * Math.PI;
    return [x + s * 0.5 + Math.cos(a) * s * 0.3, y + s * 0.42 - lift + Math.sin(a) * s * 0.36] as Pt;
  });
  shackle.unshift([x + s * 0.2, y + s * 0.5 - lift]);
  shackle.push([x + s * 0.8, y + s * 0.5 - lift]);
  const body: Line[] = [handLine(x + s * 0.08, y + s * 0.48, x + s * 0.92, y + s * 0.48, k, 0.01), handLine(x + s * 0.92, y + s * 0.48, x + s * 0.9, y + s * 1.05, k + 1, 0.01), handLine(x + s * 0.9, y + s * 1.05, x + s * 0.1, y + s * 1.05, k + 2, 0.01), handLine(x + s * 0.1, y + s * 1.05, x + s * 0.08, y + s * 0.48, k + 3, 0.01)];
  const hole: Line[] = [handCircle(x + s * 0.5, y + s * 0.7, s * 0.06, s * 0.06, k + 4, 1.05), handLine(x + s * 0.5, y + s * 0.75, x + s * 0.5, y + s * 0.88, k + 5, 0.02)];
  const shade = hatch((p) => p[0] > x + s * 0.55 && p[0] < x + s * 0.88 && p[1] > y + s * 0.52 && p[1] < y + s * 1.02, [x, y + s * 0.48, x + s, y + s * 1.05], -0.9, s * 0.05, k + 6, 3);
  return (
    <g>
      <Ink lines={[resample(shackle, 4)]} f={f} t={t} size={s * 0.07} k={k} color={color} />
      <Ink lines={body.map((l) => resample(l, 4))} f={f} t={frac(t, 0.2, 0.8)} size={s * 0.04} k={k + 1} color={color} />
      <Ink lines={hole.map((l) => resample(l, 2))} f={f} t={frac(t, 0.6, 1)} size={s * 0.03} k={k + 2} color={color} />
      <Ink lines={shade} f={f} t={frac(t, 0.6, 1)} size={s * 0.012} k={k + 3} color={color} opacity={0.8} />
    </g>
  );
}

export { arrow, handCircle, handLine };
