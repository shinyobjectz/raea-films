// The painting's standing strokes (v3/oil.tsx): what stands up out of the ground, each one a single stroke of paint on
// a card that turns to face us as we walk, so it has the brush's shape and relief from wherever we are and the meadow
// has real depth: grass blades in tufts, wildflowers on their stems (poppies in drifts on the left, daisies,
// buttercups, cornflowers), the old tree (its trunk in long strokes up, its crown in dabs heaped in clumps, gaps of sky
// through it) and the rope swing that hangs from it. The wind rolls over the meadow in gusts and the grass bows to them;
// the swing sways.
//
// Every stroke's colour is mixed here, as a painter mixes it: the thing's own colour in the low sun (warm), or in the
// shadow of the tree or the door (violet-blue); a blade's tip catches more light than its root. They are drawn far to
// near (sorted along z: we walk down z), blended, so each lies over what is behind it as paint over paint.
import type { V3 } from "../v2/math";
import { BRUSH, NOISE, RELIEF } from "./oil-glsl";
import { DZ, SUN, TREE, land } from "./oil-land";
import { FRAME } from "./oil-door";

type Stroke = { root: V3; dir: V3; len: number; wid: number; bend: number; kind: number; wind: number; col: V3; tip: V3; seed: number; dry: number; lift: number };

const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** in the shadow of the tree's crown or trunk, or of the door, at p (0..1) */
function shadowAt(p: V3): number {
  const L = SUN;
  const [cx, cy, cz, cr] = TREE.crown;
  const o: V3 = [p[0] - cx, p[1] - cy, p[2] - cz], b = o[0] * L[0] + o[1] * L[1] + o[2] * L[2], c = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - cr * cr, h = b * b - c;
  let sh = 0;
  if (h > 0 && -b > 0) sh = Math.max(sh, Math.min(1, h / (cr * cr) / 0.35) * 0.9);
  const [tx, tz, tr, th] = TREE.trunk;
  const lxz = Math.hypot(L[0], L[2]), d2 = [L[0] / lxz, L[2] / lxz], q = [p[0] - tx, p[2] - tz], tb = q[0] * d2[0] + q[1] * d2[1], tc = q[0] * q[0] + q[1] * q[1] - tr * tr;
  if (tb < 0 && tb * tb - tc > 0 && p[1] + (L[1] * -tb) / lxz < th) sh = 1;
  // the door: its frame as a slab in its plane
  const k = (DZ + 0.12 - p[2]) / L[2];
  if (k > 0) { const x = p[0] + L[0] * k, y = p[1] + L[1] * k; if (Math.abs(x) < FRAME.half && y > 0 && y < FRAME.top) sh = Math.max(sh, 1); }
  return sh;
}
/** a colour in the low sun, or in shadow (a painter's warm light and violet shade) */
const lit = (alb: V3, sh: number, sun = 1): V3 => {
  const L: V3 = [alb[0] * 1.13 + 0.075, alb[1] * 1.0 + 0.045, alb[2] * 0.78];
  const S: V3 = [alb[0] * 0.44 + 0.05, alb[1] * 0.48 + 0.07, alb[2] * 0.7 + 0.17];
  return mix3(S, L, Math.max(0, Math.min(1, sun * (1 - sh))));
};

// ---- the meadow -----------------------------------------------------------------------------------------------------
const CAMZ = [DZ, DZ + 12.4];
/** how far p is from the walk (the lens's line up the meadow to the door) */
const fromWalk = (x: number, z: number) => Math.hypot(x, Math.max(0, z - CAMZ[1], CAMZ[0] - z));
/** on the trodden path to the door, or the flagstone */
const onPath = (x: number, z: number) => z > DZ - 0.1 && Math.abs(x - 0.12 * Math.sin(z * 0.6)) < 0.5 + 0.06 * Math.sin(z * 2.3);
const drift = (x: number, z: number) => 0.5 + 0.3 * Math.sin(x * 0.31 + 1.3) * Math.sin(z * 0.27 + 0.4) + 0.2 * Math.sin(x * 0.83 - z * 0.61);

function meadow(out: Stroke[]) {
  const r = rng(11);
  const GREENS: V3[] = [[0.24, 0.38, 0.17], [0.4, 0.52, 0.2], [0.53, 0.57, 0.22], [0.66, 0.6, 0.28], [0.3, 0.42, 0.3]];
  const TIPS: V3[] = [[0.93, 0.82, 0.42], [0.8, 0.8, 0.38], [0.98, 0.9, 0.55], [0.7, 0.72, 0.3]];
  for (let n = 0; n < 11000; n++) {
    const x = (r() * 2 - 1) * 17, z = CAMZ[1] - 1.8 - r() * 25.7;
    const d = fromWalk(x, z);
    const dens = d < 3 ? 1 : d < 9 ? 1 - ((d - 3) / 6) * 0.75 : d < 16 ? 0.25 * (1 - (d - 9) / 7) : 0;
    if (r() > dens) continue;
    const path = onPath(x, z);
    if (path && r() > 0.12) continue;
    if (Math.abs(x) < 0.85 && Math.abs(z - DZ) < 0.25) continue;                   // (not through the door)
    const y = land(x, z);
    const scale = 1 + d * 0.07;
    const blades = 3 + Math.floor(r() * 5);
    const g = Math.floor(r() * GREENS.length), tall = path ? 0.4 : 0.75 + 0.5 * r();
    for (let b = 0; b < blades; b++) {
      const lean = (r() * 2 - 1) * 0.45, az = r() * Math.PI * 2;
      const dir = norm([Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az)]);
      const root: V3 = [x + (r() - 0.5) * 0.12 * scale, y - 0.03, z + (r() - 0.5) * 0.12 * scale];
      const sh = shadowAt([root[0], root[1] + 0.3, root[2]]);
      const self = r() < 0.22 ? 0.45 : 1;                                          // (a blade in its neighbours' shade)
      const col = lit(mix3(GREENS[g], GREENS[Math.floor(r() * GREENS.length)], 0.4), sh, self * 0.85);
      const tip = lit(TIPS[Math.floor(r() * TIPS.length)], sh, self);
      out.push({ root, dir, len: (0.22 + 0.32 * r()) * tall * scale, wid: (0.018 + 0.016 * r()) * scale, bend: (r() * 2 - 1) * 0.35, kind: 0, wind: 0.8 + 0.4 * r(), col, tip, seed: r(), dry: 0.55 + 0.3 * r(), lift: 0 });
    }
  }
}

function flowers(out: Stroke[]) {
  const r = rng(23);
  const STEM: V3 = [0.32, 0.44, 0.18];
  const put = (x: number, z: number, head: V3[], eye: V3 | null, size: number, h: number) => {
    const y = land(x, z), d = fromWalk(x, z), scale = 1 + d * 0.06;
    const lean = (r() * 2 - 1) * 0.25, az = r() * Math.PI * 2;
    const dir = norm([Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az)]);
    const len = h * scale;
    const top: V3 = [x + dir[0] * len, y + dir[1] * len, z + dir[2] * len];
    const sh = shadowAt(top);
    out.push({ root: [x, y - 0.02, z], dir, len, wid: 0.009 * scale, bend: (r() * 2 - 1) * 0.3, kind: 0, wind: 1, col: lit(STEM, sh, 0.7), tip: lit(STEM, sh, 1), seed: r(), dry: 0.3, lift: 0 });
    // the head: a few dabs over each other, turned every way
    for (let k = 0; k < head.length; k++) {
      const c = lit(head[k], sh);
      out.push({ root: [top[0] + (r() - 0.5) * 0.02 * size, top[1] + (r() - 0.3) * 0.02 * size, top[2]], dir: [r() * Math.PI, len, 0], len: size * (0.8 + 0.4 * r()) * scale, wid: size * (0.6 + 0.3 * r()) * scale, bend: 0, kind: 1, wind: 1, col: c, tip: mix3(c, [1, 0.95, 0.8], 0.15), seed: r(), dry: 0.25, lift: len });
    }
    if (eye) out.push({ root: [top[0], top[1] + 0.004, top[2] + 0.01], dir: [r() * Math.PI, len, 0], len: size * 0.38 * scale, wid: size * 0.32 * scale, bend: 0, kind: 1, wind: 1, col: lit(eye, sh), tip: lit(eye, sh), seed: r(), dry: 0.1, lift: len });
  };
  const POPPY: V3[] = [[0.86, 0.15, 0.09], [0.94, 0.28, 0.12], [0.78, 0.1, 0.1]];
  for (let n = 0; n < 2600; n++) {
    const x = (r() * 2 - 1) * 15, z = CAMZ[1] - 4 - r() * 21;
    const d = fromWalk(x, z);
    if (d > 13 || onPath(x, z) || (Math.abs(x) < 0.85 && Math.abs(z - DZ) < 0.3)) continue;
    const dr = drift(x, z);
    const pick = r();
    if (x < -1.0 && dr > 0.62 && pick < 0.55) put(x, z, POPPY.slice(0, 2 + Math.floor(r() * 2)), [0.12, 0.08, 0.12], 0.075, 0.38 + 0.28 * r());
    else if (dr < 0.42 && pick < 0.3) put(x, z, [[0.97, 0.95, 0.88], [0.93, 0.92, 0.86]], [0.96, 0.78, 0.2], 0.05, 0.22 + 0.15 * r());
    else if (pick < 0.07) put(x, z, [[0.98, 0.84, 0.2]], null, 0.035, 0.28 + 0.2 * r());
    else if (pick < 0.095) put(x, z, [[0.36, 0.46, 0.9], [0.3, 0.38, 0.82]], null, 0.045, 0.4 + 0.2 * r());
  }
}

// ---- the old tree, and its swing ------------------------------------------------------------------------------------
export const SWING = { pivot: [5.0, 4.75, -6.6] as V3, axis: norm([Math.cos(0.9), 0, Math.sin(0.9)]), seat: 0.6, half: 0.26 };

function tree(out: Stroke[]) {
  const r = rng(37);
  const [cx, cy, cz, cr] = TREE.crown;
  const [tx, tz] = TREE.trunk;
  const ground = land(tx, tz);
  // the trunk: long strokes up it, lit on its left (toward the sun), and its limbs up into the crown
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI - Math.PI / 2;                                  // (round its front half, -90..90 from facing us)
    const ox = Math.sin(a) * 0.42, oz = Math.cos(a) * 0.42;
    const y0 = ground - 0.05 + r() * 1.8;
    const litk = Math.max(0, Math.min(1, 0.5 - Math.sin(a) * 0.9));
    const col = lit([0.5, 0.42, 0.33], 0, litk);
    out.push({ root: [tx + ox, y0, tz + oz], dir: norm([(r() - 0.5) * 0.08 - ox * 0.06, 1, 0]), len: 1.4 + 1.6 * r(), wid: 0.13 + 0.06 * r(), bend: (r() - 0.5) * 0.1, kind: 0, wind: 0, col, tip: mix3(col, lit([0.6, 0.5, 0.38], 0, litk), 0.5), seed: r(), dry: 0.6, lift: 0 });
  }
  for (let k = 0; k < 6; k++) {
    const a = -1.2 + (k / 5) * 2.4;
    const root: V3 = [tx + (r() - 0.5) * 0.3, ground + 3.6 + r() * 1.0, tz];
    out.push({ root, dir: norm([Math.sin(a), Math.cos(a) * 1.2, (r() - 0.5) * 0.4]), len: 1.8 + 1.2 * r(), wid: 0.12, bend: (r() - 0.5) * 0.4, kind: 0, wind: 0.05, col: lit([0.32, 0.28, 0.28], 0, 0.3), tip: lit([0.4, 0.34, 0.3], 0, 0.5), seed: r(), dry: 0.7, lift: 0 });
  }
  // the crown: clumps of leaves, each a heap of dabs lit as a ball is (gold-green toward the sun, blue-green away, darker
  // under), with gaps of sky between
  const clumps: [V3, number][] = [];
  for (let k = 0; k < 34; k++) {
    let p: V3;
    do { p = [(r() * 2 - 1), (r() * 2 - 1) * 0.8, (r() * 2 - 1)]; } while (Math.hypot(...p) > 1);
    clumps.push([[cx + p[0] * cr * 0.85, cy + p[1] * cr * 0.85, cz + p[2] * cr * 0.85], 1.0 + 0.9 * r()]);
  }
  const LEAF_LIT: V3 = [0.64, 0.66, 0.26], LEAF_MID: V3 = [0.33, 0.46, 0.2], LEAF_DARK: V3 = [0.13, 0.25, 0.22];
  for (const [c, rad] of clumps) {
    for (let k = 0; k < 95; k++) {
      let n: V3;
      do { n = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1]; } while (Math.hypot(...n) > 1 || Math.hypot(...n) < 0.2);
      n = norm(n);
      if (n[2] < -0.35 && r() < 0.8) continue;                                   // (the far side, mostly hidden)
      const p: V3 = [c[0] + n[0] * rad, c[1] + n[1] * rad * 0.85, c[2] + n[2] * rad];
      const whole = norm([p[0] - cx, (p[1] - cy) * 1.2, p[2] - cz]);
      const nn = norm([n[0] * 0.6 + whole[0] * 0.4, n[1] * 0.6 + whole[1] * 0.4, n[2] * 0.6 + whole[2] * 0.4]);
      const lam = nn[0] * SUN[0] + nn[1] * SUN[1] + nn[2] * SUN[2];
      const under = Math.max(0, Math.min(1, (cy - p[1]) / (cr * 0.9)));
      let alb = lam > 0.35 ? mix3(LEAF_MID, LEAF_LIT, Math.min(1, (lam - 0.35) / 0.4)) : mix3(LEAF_DARK, LEAF_MID, Math.max(0, (lam + 0.3) / 0.65));
      alb = mix3(alb, LEAF_DARK, under * 0.55);
      const col = lam > 0.3 ? lit(alb, 0, 1) : lit(alb, 0.6, 0.8);
      const tang = Math.atan2(-n[0], n[1]) + (r() - 0.5) * 0.9;
      out.push({ root: p, dir: [tang, 0, 0], len: 0.34 + 0.24 * r(), wid: 0.2 + 0.12 * r(), bend: 0, kind: 1, wind: 0.25, col, tip: mix3(col, [1, 0.95, 0.7], lam > 0.5 ? 0.12 : 0), seed: r(), dry: 0.45, lift: 1.2 });
    }
  }
  // the swing: two ropes from the limb, and its seat
  const { pivot, axis, seat, half } = SWING;
  const rope: V3 = [0.86, 0.8, 0.62], wood: V3 = [0.6, 0.4, 0.24];
  for (const s of [-1, 1]) {
    const top: V3 = [pivot[0] + axis[0] * half * s, pivot[1], pivot[2] + axis[2] * half * s];
    out.push({ root: [top[0], seat, top[2]], dir: [0, 1, 0], len: pivot[1] - seat, wid: 0.016, bend: 0, kind: 2, wind: 0, col: lit(rope, shadowAt([top[0], 2, top[2]]), 0.9), tip: lit(rope, 0.5, 0.6), seed: r(), dry: 0.2, lift: 0 });
  }
  const s0: V3 = [pivot[0] - axis[0] * (half + 0.06), seat - 0.02, pivot[2] - axis[2] * (half + 0.06)];
  out.push({ root: s0, dir: axis, len: 2 * (half + 0.06), wid: 0.06, bend: 0, kind: 2, wind: 0, col: lit(wood, 0, 1), tip: lit(wood, 0.3, 0.8), seed: r(), dry: 0.3, lift: 0 });
}

/** every standing stroke, as one buffer mesh: 6 vertices each (a strip of two, so a blade can bend), far to near */
export const CARDS = (() => {
  const all: Stroke[] = [];
  meadow(all);
  flowers(all);
  tree(all);
  all.sort((a, b) => a.root[2] - b.root[2]);
  const positions: number[] = [], uvs: number[] = [], colors: number[] = [], indices: number[] = [];
  const aDir: number[] = [], aShape: number[] = [], aTip: number[] = [], aMore: number[] = [];
  for (const s of all) {
    const b = positions.length / 3;
    for (const u of [0, 0.5, 1]) for (const v of [0, 1]) {
      positions.push(...s.root); uvs.push(u, v); colors.push(...s.col, 1);
      aDir.push(...s.dir, s.len); aShape.push(s.wid, s.bend, s.kind, s.wind); aTip.push(...s.tip, s.seed); aMore.push(s.dry, s.lift, 0, 0);
    }
    indices.push(b, b + 2, b + 1, b + 1, b + 2, b + 3, b + 2, b + 4, b + 3, b + 3, b + 4, b + 5);
  }
  return { count: all.length, mesh: { positions, uvs, colors, indices, attributes: { aDir: { size: 4, values: aDir }, aShape: { size: 4, values: aShape }, aTip: { size: 4, values: aTip }, aMore: { size: 4, values: aMore } } } };
})();

const VERTEX = /* glsl */ `
attribute vec4 aDir;
attribute vec4 aShape;
attribute vec4 aTip;
attribute vec4 aMore;
uniform vec4 uWind;    // the second, the gusts' strength, the wind's way (x, z)
uniform vec4 uSwing;   // the swing's limb (x, y, z) and how far it has swung (radians)
uniform vec4 uAxis;    // the swing's axis
varying vec2 vUv;
varying vec3 vCol;
varying vec3 vTip;
varying vec2 vSD;
float windAt(vec2 p, float t) {
  float sway = sin(t * 1.9 + p.x * 0.7 + p.y * 0.5) * 0.35 + sin(t * 3.1 + p.x * 1.7 - p.y * 1.3) * 0.15;
  // gusts rolling over the meadow
  float g = sin(dot(p, vec2(0.42, 0.25)) * 0.8 - t * 2.2) * 0.5 + 0.5;
  return 0.22 + sway * 0.3 + smoothstep(0.45, 1.0, g) * 0.9;
}
vec3 turnAbout(vec3 v, vec3 k, float a) { return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a)); }
void main() {
  float kind = aShape.z;
  vec3 root = position;
  float L = aDir.w; float W = aShape.x;
  vec3 p;
  if (kind < 0.5 || kind > 1.5) {
    vec3 dir = normalize(aDir.xyz);
    float u = uv.x;
    vec3 toCam = normalize(cameraPosition - root);
    vec3 side = cross(dir, toCam); float sl = length(side);
    side = sl > 1e-4 ? side / sl : vec3(1.0, 0.0, 0.0);
    float w = windAt(root.xz, uWind.x) * uWind.y * aShape.w;
    vec3 off = vec3(uWind.z, 0.0, uWind.w) * w * u * u * L * 0.55 + side * aShape.y * u * u * L;
    off.y -= 0.5 * dot(off.xz, off.xz) / max(L, 0.01) * u;
    float taper = kind < 0.5 ? (1.0 - 0.5 * u) : 1.0;
    p = root + dir * L * u + off + side * (uv.y - 0.5) * W * taper;
    if (kind > 1.5) { p = uSwing.xyz + turnAbout(p - uSwing.xyz, uAxis.xyz, uSwing.w); }
  } else {
    vec3 toCam = normalize(cameraPosition - root);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    vec3 up = cross(toCam, right);
    float a = aDir.x;
    vec3 d = cos(a) * right + sin(a) * up;
    vec3 n = -sin(a) * right + cos(a) * up;
    float w = windAt(root.xz, uWind.x) * uWind.y * aShape.w;
    vec3 c = root + vec3(uWind.z, 0.0, uWind.w) * w * aMore.y * 0.3;
    p = c + d * (uv.x - 0.5) * L + n * (uv.y - 0.5) * W;
  }
  vUv = uv; vCol = color.rgb; vTip = aTip.rgb; vSD = vec2(aTip.w, aMore.x);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const FRAG = NOISE + BRUSH + RELIEF + /* glsl */ `
varying vec2 vUv;
varying vec3 vCol;
varying vec3 vTip;
varying vec2 vSD;
void main() {
  float s = vUv.x; float r = vUv.y * 2.0 - 1.0;
  float fr = max(fwidth(r), 1e-4);
  vec3 b = brush(s, r, vSD.x, vSD.y, fr * 1.2, fwidth(s) * 1.2);
  if (b.x < 0.01) { discard; }
  vec3 col = mix(vCol, vTip, smoothstep(0.1, 0.95, s)) * (0.95 + 0.1 * b.z);
  // its relief, lit as the rest: in the picture's own units (its height a share of its width on the screen)
  vec2 Q = vec2(gl_FragCoord.x, -gl_FragCoord.y) / 1080.0;
  float H = b.y * (2.0 / fr) * 0.16 / 1080.0;
  gl_FragColor = vec4(relief(col, H, Q, 0.4), b.x);
}`;
export const CARDS_GLSL = { vertex: VERTEX, fragment: FRAG, vertexColors: true };
