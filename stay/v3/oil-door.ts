// The painting's door (v3/oil.tsx): the one thing in the picture not yet painted. It stands at the top of the meadow as
// bare primed canvas, its lines sketched in charcoal (its frame, the leaf's two panels, the knob). The cursor sweeps
// over it once, top to bottom, as a painter blocks in, and the paint comes off the brush where it passes and runs out
// from there over the whole door: every stroke laid head to tail, wet and glinting, then settling. A warm white frame
// with a little cornice, a red leaf with two sunk panels, a brass knob, a flagstone at its foot. Then the cursor takes
// the knob and the leaf swings open toward us on its left side.
//
// Each part is a box (or the knob's ball) drawn by DOOR_GLSL, which paints its faces as a field of strokes in the face's
// own metres (v3/oil-glsl.ts), each stroke laid at the moment the paint reaches it (PATH, the sweep).
import type { V3 } from "../v2/math";
import { BRUSH, NOISE, RELIEF, WEAVE, field } from "./oil-glsl";
import { DZ, SUN } from "./oil-land";

/** the opening (half width, height), the frame's front plane */
export const OPENING = { half: 0.48, top: 2.1 };
export const FRONT = DZ + 0.1;
/** the frame's outline for its shadow on the land: half width, height */
export const FRAME = { half: 0.72, top: 2.39 };
/** the leaf: its size, and its hinge (its front face's left edge) */
export const LEAF = { half: [0.47, 1.04, 0.025] as V3, hinge: [-0.47, DZ - 0.02] as [number, number] };
/** the knob, from the hinge (along the leaf, up, out from its face), and its radius */
export const KNOB = { at: [0.83, 1.02, 0.042] as V3, r: 0.036 };

export type Part = { name: string; kind: number; half: V3; at: V3 };
/** the parts that never move: jambs, lintel, cornice, flagstone (kind: 0 jamb, 1 lintel, 2 cornice, 5 stone) */
export const PARTS: Part[] = [
  { name: "jamb-l", kind: 0, half: [0.08, 1.16, 0.1], at: [-0.56, 1.16, DZ] },
  { name: "jamb-r", kind: 0, half: [0.08, 1.16, 0.1], at: [0.56, 1.16, DZ] },
  { name: "lintel", kind: 1, half: [0.64, 0.11, 0.11], at: [0, 2.21, DZ] },
  { name: "cornice", kind: 2, half: [0.72, 0.035, 0.15], at: [0, 2.355, DZ + 0.01] },
  { name: "stone", kind: 5, half: [0.75, 0.06, 0.28], at: [0, -0.03, DZ + 0.3] },
];
/** the leaf's middle when shut, and where it and the knob are with the leaf open `a` radians toward us */
export const LEAF_REST: V3 = [LEAF.hinge[0] + LEAF.half[0], LEAF.half[1] + 0.01, LEAF.hinge[1] - LEAF.half[2]];
const turn = (a: number, x: number, z: number): [number, number] => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
export function leafAt(a: number): { at: V3; rot: V3 } {
  const [x, z] = turn(a, LEAF.half[0], -LEAF.half[2]);
  return { at: [LEAF.hinge[0] + x, LEAF_REST[1], LEAF.hinge[1] + z], rot: [0, -a, 0] };
}
export function knobAt(a: number): V3 {
  const [x, z] = turn(a, KNOB.at[0], KNOB.at[2]);
  return [LEAF.hinge[0] + x, KNOB.at[1], LEAF.hinge[1] + z];
}
export const KNOB_REST: V3 = knobAt(0);

// ---- the sweep -----------------------------------------------------------------------------------------------------
/** where the brush goes over the door (x, y in its plane): from the cornice's left end, across and back down it in
 *  three wide swings, to the foot of the leaf */
const SWEEP: [number, number][] = [[-0.7, 2.34], [0.5, 2.06], [-0.44, 1.42], [0.44, 0.8], [-0.2, 0.24]];
const spline = (() => {
  // Catmull-Rom through the points, measured along its length
  const P = [SWEEP[0], ...SWEEP, SWEEP[SWEEP.length - 1]];
  const pts: [number, number][] = [];
  for (let i = 1; i < P.length - 2; i++) {
    for (let k = 0; k < 60; k++) {
      const u = k / 60, u2 = u * u, u3 = u2 * u;
      const f = (j: number) => 0.5 * (2 * P[i][j] + (-P[i - 1][j] + P[i + 1][j]) * u + (2 * P[i - 1][j] - 5 * P[i][j] + 4 * P[i + 1][j] - P[i + 2][j]) * u2 + (-P[i - 1][j] + 3 * P[i][j] - 3 * P[i + 1][j] + P[i + 2][j]) * u3);
      pts.push([f(0), f(1)]);
    }
  }
  pts.push(SWEEP[SWEEP.length - 1]);
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[acc.length - 1];
  return (a: number): [number, number] => {
    const d = Math.min(1, Math.max(0, a)) * total;
    let i = 1;
    while (i < acc.length - 1 && acc[i] < d) i++;
    const k = (d - acc[i - 1]) / Math.max(1e-9, acc[i] - acc[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
  };
})();
const smoother = (k: number) => { const q = Math.min(1, Math.max(0, k)); return q * q * q * (q * (q * 6 - 15) + 10); };
/** how far along the sweep the brush is at t (0..1): it sets off and ends gently, steady between */
export const sweepAt = (t: number, from: number, to: number) => smoother((t - from) / (to - from));
/** the brush's point on the door at t */
export function brushAt(t: number, from: number, to: number): V3 {
  const [x, y] = spline(sweepAt(t, from, to));
  return [x, y, FRONT];
}
/** the sweep for the shader: 16 points along it in time, each (x, y, the second the brush is there, 0) */
export function sweepPath(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 16; i++) {
    const t = from + ((to - from) * i) / 15;
    const [x, y] = spline(sweepAt(t, from, to));
    out.push(x, y, t, 0);
  }
  return out;
}

// ---- the shader ----------------------------------------------------------------------------------------------------
const VERTEX = /* glsl */ `
varying vec3 vL;
varying vec3 vNL;
varying vec3 vNW;
void main() {
  vL = position; vNL = normal;
  vNW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

const FRAG = NOISE + BRUSH + RELIEF + WEAVE + /* glsl */ `
uniform vec4 uSize;     // the part's half size; w its kind (0 jamb, 1 lintel, 2 cornice, 3 leaf, 4 knob, 5 stone)
uniform vec4 uRest;     // its middle, standing shut
uniform vec4 uSun;      // toward the sun
uniform vec4 uPaint;    // the second now, how fast the paint runs out from the brush (m/s), how long a stroke takes, 0
uniform vec4 uFrame;    // the frame's front plane z, the opening's half width and height, 0
uniform vec4 uPath[16]; // the sweep: x, y, the second the brush is there
varying vec3 vL;
varying vec3 vNL;
varying vec3 vNW;
vec3 gL; vec3 gNL; vec3 gNW; float gWet;

vec2 faceQ(vec3 l, vec3 n) { if (abs(n.z) > 0.5) { return l.xy; } if (abs(n.x) > 0.5) { return vec2(l.z, l.y); } return l.xz; }
vec3 faceL(vec2 q, vec3 l, vec3 n) { if (abs(n.z) > 0.5) { return vec3(q, l.z); } if (abs(n.x) > 0.5) { return vec3(l.x, q.y, q.x); } return vec3(q.x, l.y, q.y); }

/** the second the paint reaches p (in the door's plane): when the brush passes nearest, and then the run out from it */
float paintAt(vec2 p) {
  float best = 1.0e9;
  for (int i = 0; i < 15; i++) {
    vec2 a = uPath[i].xy; vec2 b = uPath[i + 1].xy; vec2 ab = b - a;
    float u = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float d = length(p - a - ab * u);
    best = min(best, mix(uPath[i].z, uPath[i + 1].z, u) + d / uPaint.y);
  }
  return best;
}

/** the leaf's two sunk panels, from its middle: (inside the panel, on its shaded top/left bevel, on its lit
 *  bottom/right one); and the way the wood runs there (the bevels along their edge, the rest up) in w */
vec4 panels(vec2 q) {
  vec2 c = vec2(0.0, q.y > 0.0 ? 0.475 : -0.475);
  vec2 hs = vec2(0.3, 0.375);
  vec2 d = q - c;
  vec2 e = hs - abs(d);
  float inside = step(0.0, min(e.x, e.y));
  float wall = 1.0 - smoothstep(0.042, 0.05, min(e.x, e.y));
  bool topBottom = e.y < e.x;
  float shaded = inside * wall * ((topBottom && d.y > 0.0) || (!topBottom && d.x < 0.0) ? 1.0 : 0.0);
  float lit = inside * wall * (1.0 - shaded);
  float way = 1.5708;
  if (inside * wall > 0.5 && topBottom) { way = 0.0; }
  // the rails (across the leaf, between and over the panels) run across
  if (inside < 0.5 && abs(q.x) < 0.33 && (abs(q.y) < 0.1 || abs(q.y) > 0.85)) { way = 0.0; }
  return vec4(inside, shaded, lit, way);
}

/** the paint's colour at a point of the part (local l, and where that is standing shut) */
vec3 doorColour(vec3 l, vec3 rest) {
  float kind = uSize.w;
  vec3 alb = vec3(0.95, 0.91, 0.82);
  float sh = 0.0;
  vec3 n = gNW;
  if (kind > 1.5 && kind < 2.5) { alb = vec3(0.92, 0.88, 0.78); }
  if (kind > 2.5 && kind < 3.5) {
    alb = vec3(0.8, 0.17, 0.1);
    if (gNL.z > 0.5) {
      vec4 pn = panels(l.xy);
      alb = mix(alb, vec3(0.66, 0.11, 0.1), pn.x);
      alb = mix(alb, vec3(0.36, 0.06, 0.12), pn.y);
      alb = mix(alb, vec3(0.98, 0.42, 0.2), pn.z);
    }
    // the frame's shadow on it: where the line to the sun leaves through the frame and not the opening
    if (gNL.z > 0.5) {
      float k = (uFrame.x - rest.z) / max(uSun.z, 0.05);
      float xa = rest.x + uSun.x * k; float ya = rest.y + uSun.y * k;
      sh = max(step(uFrame.y, abs(xa)), step(uFrame.z, ya)) * (1.0 - smoothstep(0.0, 0.2, uPaint.w));
    }
  }
  if (kind > 3.5 && kind < 4.5) {
    alb = vec3(0.86, 0.6, 0.2);
    n = normalize(gNW);
  }
  if (kind > 4.5) { alb = vec3(0.64, 0.6, 0.52) * (0.9 + 0.2 * vnoise(rest.xz * 6.0)); }
  // the inner faces of the jambs and the lintel's underside, round the opening
  float lam = max(dot(n, uSun.xyz), 0.0);
  float lit = smoothstep(0.02, 0.32, lam) * (1.0 - sh);
  vec3 litC = alb * vec3(1.08, 1.0, 0.84) + vec3(0.05, 0.03, 0.0);
  vec3 shC = alb * vec3(0.48, 0.48, 0.72) + vec3(0.06, 0.06, 0.16);
  vec3 c = mix(shC, litC, lit);
  if (kind > 3.5 && kind < 4.5) { c += vec3(1.0, 0.85, 0.5) * pow(max(dot(reflect(-uSun.xyz, n), vec3(0.0, 0.0, 1.0)), 0.0), 12.0) * 0.6; }
  return c;
}

/** the stroke whose middle is c on this face: its colour, and its way (the jambs' and the leaf's up, the rest across) */
vec4 doorAt(vec2 c) {
  vec3 l = faceL(c, gL, gNL);
  vec3 rest = uRest.xyz + l;
  float kind = uSize.w;
  float ang = 0.0;
  if (kind < 0.5 || (kind > 2.5 && kind < 3.5)) { ang = abs(gNL.y) > 0.5 ? 0.0 : 1.5708; }
  if (kind > 2.5 && kind < 3.5 && gNL.z > 0.5) { ang = panels(l.xy).w; }
  if (kind > 3.5 && kind < 4.5) { ang = 0.8; }
  return vec4(doorColour(l, rest), ang);
}
/** how much of that stroke is laid yet, and how wet */
vec2 doorDraw(vec2 c) {
  vec3 rest = uRest.xyz + faceL(c, gL, gNL);
  float t0 = paintAt(rest.xy) + 0.09 * h21(c * 97.0);
  float age = uPaint.x - t0;
  return vec2(clamp(age / uPaint.z, 0.0, 1.0), 0.35 + 0.65 * exp(-max(age, 0.0) / 1.4));
}

/** the bare canvas and its charcoal lines: the part's outline on this face, the panels, the knob */
vec3 canvas(vec3 l) {
  vec2 q = faceQ(l, gNL);
  vec2 hs = abs(faceQ(uSize.xyz, gNL));
  vec2 e = hs - abs(q);
  float wob = 0.003 * sin(q.x * 9.0 + q.y * 7.0) + 0.002 * sin(q.y * 23.0);
  float d = min(e.x, e.y);
  float line = 1.0 - smoothstep(0.005, 0.011, abs(d - 0.008 - wob));
  line = max(line, (1.0 - smoothstep(0.002, 0.006, abs(d - 0.03 + wob))) * 0.5);
  if (uSize.w > 2.5 && uSize.w < 3.5 && gNL.z > 0.5) {
    vec2 c = vec2(0.0, q.y > 0.0 ? 0.475 : -0.475);
    vec2 pe = vec2(0.3, 0.375) - abs(q - c);
    float pd = min(pe.x, pe.y);
    line = max(line, 1.0 - smoothstep(0.004, 0.009, abs(pd - wob)));
    line = max(line, (1.0 - smoothstep(0.002, 0.006, abs(pd - 0.048 + wob))) * 0.6);
  }
  if (uSize.w > 3.5 && uSize.w < 4.5) { line = 0.8; }
  // the shaded faces (away from the sun) hatched, as a draughtsman shades
  float away = 1.0 - smoothstep(-0.1, 0.2, dot(gNW, uSun.xyz));
  float hatch = (1.0 - smoothstep(0.25, 0.45, abs(fract((q.x + q.y) * 38.0) - 0.5))) * away * 0.6;
  float grain = smoothstep(0.2, 0.75, vnoise(q * 300.0 + 3.0)) * 0.55 + 0.45;
  float shade = abs(gNL.z) > 0.5 ? 1.0 : abs(gNL.y) > 0.5 ? 1.02 : 0.9;
  vec3 cv = vec3(0.79, 0.75, 0.66) * shade * (0.9 + 0.14 * weave(q * 260.0));
  return mix(cv, vec3(0.14, 0.13, 0.15), max(line, hatch) * grain * 0.9);
}
` + field("paintDoor", "doorAt", [
  { cell: 0, cellXY: [0.085, 0.22], orient: 1.5708, len: [1.3, 2.1], wid: 1.0, spread: 0.1, dry: 0.2, vary: 0.035, hue: 0.015 },
  { cell: 0, cellXY: [0.22, 0.085], orient: 0, len: [1.3, 2.1], wid: 1.0, spread: 0.1, dry: 0.2, vary: 0.035, hue: 0.015 },
  { cell: 0, cellXY: [0.042, 0.12], orient: 1.5708, len: [1.2, 2.1], wid: 0.9, spread: 0.08, dry: 0.35, vary: 0.04, hue: 0.015 },
  { cell: 0, cellXY: [0.12, 0.042], orient: 0, len: [1.2, 2.1], wid: 0.9, spread: 0.08, dry: 0.35, vary: 0.04, hue: 0.015 },
], "doorDraw") + /* glsl */ `
void main() {
  gL = vL; gNL = normalize(vNL); gNW = normalize(vNW); gWet = 0.0;
  vec2 Q = faceQ(vL, gNL);
  float px = length(fwidth(Q)) * 0.7;
  vec3 rest = uRest.xyz + vL;
  // under the strokes: the canvas and its lines, till the first wash of paint reaches this point
  vec3 own = doorColour(vL, rest);
  float t0 = paintAt(rest.xy) + 0.12;
  float washed = smoothstep(0.0, 0.25, uPaint.x - t0);
  vec3 base = mix(canvas(vL), own * 0.94, washed);
  vec4 f = paintDoor(Q, base, px);
  gl_FragColor = vec4(relief(f.rgb, f.a * 2.2, Q, 0.4 + 1.6 * gWet), 1.0);
}`;

export const DOOR_GLSL = { vertex: VERTEX, fragment: FRAG };

// The sketch runs on past the door, as a draughtsman's lines do: the frame's verticals down into the grass and up past
// the cornice, the lintel's and cornice's lines out into the sky. They are on a card in the door's plane, drawn only
// outside the door, and each fades as the paint reaches its end of the door (the meadow and the sky painted over them).
const SKETCH_VERTEX = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKETCH_FRAG = NOISE + /* glsl */ `
uniform vec4 uPaint;
uniform vec4 uPath[16];
varying vec3 vW;
float paintAt(vec2 p) {
  float best = 1.0e9;
  for (int i = 0; i < 15; i++) {
    vec2 a = uPath[i].xy; vec2 b = uPath[i + 1].xy; vec2 ab = b - a;
    float u = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    best = min(best, mix(uPath[i].z, uPath[i + 1].z, u) + length(p - a - ab * u) / uPaint.y);
  }
  return best;
}
float stroke(float d, float w) { return 1.0 - smoothstep(w * 0.5, w, abs(d)); }
void main() {
  vec2 p = vW.xy;
  // (not over the door itself)
  if ((abs(p.x) < 0.645 && p.y < 2.325) || (abs(p.x) < 0.725 && p.y < 2.395 && p.y > 2.315)) { discard; }
  float wob = 0.004 * sin(p.y * 7.0 + p.x * 3.0);
  float l = 0.0;
  // verticals: the jambs' outer edges and the cornice's ends, on past the door
  l = max(l, stroke(abs(p.x) - 0.64 + wob, 0.032) * (1.0 - smoothstep(2.5, 2.85, p.y)) * smoothstep(-0.32, -0.05, p.y));
  l = max(l, stroke(abs(p.x) - 0.72 - wob, 0.024) * (1.0 - smoothstep(2.48, 2.7, p.y)) * smoothstep(2.1, 2.3, p.y) * 0.7);
  // horizontals: the lintel's foot, the cornice's top, out into the sky
  l = max(l, stroke(p.y - 2.395 + wob, 0.03) * (1.0 - smoothstep(0.85, 1.1, abs(p.x))));
  l = max(l, stroke(p.y - 2.1 - wob, 0.024) * (1.0 - smoothstep(0.75, 0.98, abs(p.x))) * 0.8);
  l = max(l, stroke(p.y + 0.01 + wob, 0.026) * (1.0 - smoothstep(0.85, 1.15, abs(p.x))) * 0.7);
  float grain = smoothstep(0.2, 0.75, vnoise(p * 120.0)) * 0.55 + 0.45;
  vec2 near = vec2(clamp(p.x, -0.64, 0.64), clamp(p.y, 0.0, 2.39));
  float gone = smoothstep(0.1, 0.5, uPaint.x - paintAt(near));
  float a = l * grain * 0.85 * (1.0 - gone);
  if (a < 0.01) { discard; }
  gl_FragColor = vec4(vec3(0.13, 0.12, 0.14), a);
}`;
export const SKETCH_GLSL = { vertex: SKETCH_VERTEX, fragment: SKETCH_FRAG };
export const doorUniforms = (p: { kind: number; half: V3; rest: V3 }, t: number, from: number, to: number, opened: number) => ({
  uSize: [...p.half, p.kind], uRest: [...p.rest, 0], uSun: [...SUN, 0],
  uPaint: [t, 1.25, 0.24, opened], uFrame: [FRONT, OPENING.half, OPENING.top, 0], uPath: sweepPath(from, to),
});
