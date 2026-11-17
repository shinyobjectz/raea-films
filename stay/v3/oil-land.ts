// The oil painting's sky and land (v3/oil.tsx): a summer evening on a hill. A meadow runs up to the door standing at
// its top; past it the hill falls away to a valley of fields and a river under far blue hills; an old tree stands on
// the right near the brow; and over it all a towering sky of cumulus lit gold from the low sun behind us and to the
// left, their far sides lavender. Every part painted in strokes (v3/oil-glsl.ts).
//
// The land's strokes are laid in Q, the land as a fixed eye behind where we start (RE) sees it: so each stroke is about
// the same size in the picture near and far (a painter's foreground strokes are not a hundred times the far ones), and
// fixed to the ground as we walk over it. The sky's are laid in its directions (they don't move as we walk).
import type { V3 } from "../v2/math";
import { BRUSH, NOISE, RELIEF, WEAVE, field } from "./oil-glsl";

export const DZ = -3.2;                                  // the door's plane (the take's door line)
/** toward the sun: low (20 degrees), behind us and to the left: the door's face and every leftward slope lit gold */
export const SUN: V3 = (() => { const v = [-0.72, 0.36, 0.6], l = Math.hypot(...v); return v.map((x) => x / l) as V3; })();
/** the land's painter's eye, behind where we start */
export const RE: V3 = [0, 1.75, 14.0];
/** and its eye near the door, for the ground we come close to (from z = its w on, the far eye's) */
export const RE2: [number, number, number, number] = [0, 1.6, DZ + 6.0, DZ + 3.0];
/** the old tree: its crown (centre, radius) and its trunk (x, z, radius, height) */
export const TREE = { crown: [6.9, 6.3, -7.6, 4.3] as [number, number, number, number], trunk: [6.6, -7.4, 0.42, 5.2] as [number, number, number, number] };
/** the brow, where the hill falls away (z, at the middle) */
const BROW = DZ - 7.5;

const smooth = (a: number, b: number, x: number) => { const q = Math.min(1, Math.max(0, (x - a) / (b - a))); return q * q * (3 - 2 * q); };

/** the ground's height at (x, z): the meadow rising gently to the door, rolling; past the brow the long fall to the valley */
export function land(x: number, z: number): number {
  let y = -0.03 * (z - DZ);
  y += 0.22 * Math.sin(x * 0.13 + 0.6) * Math.sin(z * 0.11 + 0.3) + 0.1 * Math.sin(x * 0.37 - z * 0.29 + 1.2) + 0.04 * Math.sin(x * 1.1 + z * 0.8);
  const bz = BROW + 2.5 * Math.sin(x * 0.07 + 0.4) - 0.004 * x * x;
  const b = bz - z;
  if (b > 0) y -= 72 * (1 - Math.exp(-(b * b) / (2 * 120 * 120))) + 0.012 * b * smooth(0, 30, b) * (1 - smooth(200, 500, b));
  if (b > 200) y += 6 * Math.sin(x / 230 + 1.0) * Math.sin(z / 310) * smooth(200, 400, b);
  return y - Y0;
}
const Y0 = (() => { let y = -0.03 * 0; y += 0.22 * Math.sin(0.6) * Math.sin(DZ * 0.11 + 0.3) + 0.1 * Math.sin(-DZ * 0.29 + 1.2) + 0.04 * Math.sin(DZ * 0.8); return y; })();

/** the land as one mesh: fine near the walk, opening out to 60 m cells at its edge 1.8 km off */
export const LAND = (() => {
  const axis = (from: number, to: number, fine: number, near: [number, number]) => {
    const a: number[] = [];
    let x = from;
    while (x < to) {
      a.push(x);
      const d = Math.max(0, near[0] - x, x - near[1]);
      x += Math.min(60, fine * Math.pow(1.06, d / fine / 4));
    }
    a.push(to);
    return a;
  };
  const xs = axis(-1800, 1800, 0.35, [-30, 30]), zs = axis(-1800, 16, 0.35, [-24, 16]);
  const positions: number[] = [], normals: number[] = [], indices: number[] = [];
  const e = 0.05;
  for (const z of zs) for (const x of xs) {
    positions.push(x, land(x, z), z);
    const gx = (land(x + e, z) - land(x - e, z)) / (2 * e), gz = (land(x, z + e) - land(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz);
    normals.push(-gx / l, 1 / l, -gz / l);
  }
  const nx = xs.length;
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  return { positions, normals, indices };
})();

// ---- shared: the light, the shadows the door and the tree throw ------------------------------------------------------
const LIGHT = /* glsl */ `
uniform vec4 uSun;     // toward the sun
uniform vec4 uDoor;    // the door's box: half-width, height, its plane's z, how much of its shadow is painted yet
uniform vec4 uCrown;   // the tree's crown: centre, radius
uniform vec4 uTrunk;   // its trunk: x, z, radius, height
float shadowAt(vec3 p) {
  vec3 L = uSun.xyz;
  float sh = 0.0;
  // the crown: a ball, its edge soft (leaves, light through them)
  vec3 o = p - uCrown.xyz; float b = dot(o, L); float c = dot(o, o) - uCrown.w * uCrown.w; float h = b * b - c;
  if (h > 0.0 && -b > 0.0) { sh = max(sh, smoothstep(0.0, 0.35, h / (uCrown.w * uCrown.w)) * (0.82 + 0.18 * vnoise(p.xz * 0.9))); }
  // the trunk: a post
  vec2 q = p.xz - uTrunk.xy; vec2 d2 = normalize(L.xz); float tb = dot(q, d2); float tc = dot(q, q) - uTrunk.z * uTrunk.z;
  if (tb < 0.0 && tb * tb - tc > 0.0) { float tt = -tb / length(L.xz); if (p.y + L.y * tt < uTrunk.w) { sh = 1.0; } }
  // the door: a slab in its plane
  vec3 lo = vec3(-uDoor.x, 0.0, uDoor.z - 0.12); vec3 hi = vec3(uDoor.x, uDoor.y, uDoor.z + 0.12);
  vec3 inv = 1.0 / L; vec3 t0 = (lo - p) * inv; vec3 t1 = (hi - p) * inv;
  vec3 tmin = min(t0, t1); vec3 tmax = max(t0, t1);
  float tn = max(max(tmin.x, tmin.y), tmin.z); float tf = min(min(tmax.x, tmax.y), tmax.z);
  if (tf > max(tn, 0.0)) { sh = max(sh, uDoor.w); }
  return sh;
}
/** a colour lit: in the sun, warm; in shadow, cool violet (a painter's light and shade, not the engine's) */
vec3 lightUp(vec3 alb, vec3 n, float sh) {
  float lam = max(dot(n, uSun.xyz), 0.0);
  float lit = smoothstep(0.02, 0.3, lam) * (1.0 - sh);
  vec3 litC = alb * vec3(1.13, 1.0, 0.78) + vec3(0.075, 0.045, 0.0);
  vec3 shC = alb * vec3(0.44, 0.48, 0.7) + vec3(0.05, 0.07, 0.17);
  return mix(shC, litC, lit);
}
`;

const VERTEX = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// ---- the land ----------------------------------------------------------------------------------------------------
const DZ_GLSL = (DZ - 0.1).toFixed(3);
const LAND_FRAG = NOISE + BRUSH + RELIEF + WEAVE + LIGHT + /* glsl */ `
uniform vec4 uRE;      // the painter's eye
varying vec3 vW;
varying vec3 vN;
uniform vec4 uRE2;     // the painter's eye near the door (for the ground we come close to)
vec3 gW; vec3 gN; float gT; vec3 gRE;

/** the land's own colour at p (its albedo and its light, and the air) */
vec3 landColour(vec3 p, vec3 n) {
  float dist = length(p.xz - vec2(0.0, 14.0));
  float down = smoothstep(-3.0, -22.0, p.y);
  // the meadow: grass going gold, darker tufts, and drifts of flowers
  float g1 = fbm3(p.xz * 0.45); float g2 = fbm3(p.xz * 1.6 + 4.0);
  vec3 alb = mix(vec3(0.52, 0.6, 0.24), vec3(0.76, 0.68, 0.34), smoothstep(0.3, 0.75, g1));
  alb = mix(alb, vec3(0.34, 0.47, 0.2), smoothstep(0.58, 0.85, g2) * 0.5);
  float drift = fbm3(p.xz * 0.09 + 11.0);
  float sp = h21(floor(p.xz * 3.2)); float sp2 = h21(floor(p.xz * 3.2) + 7.0);
  // (the flowers are standing strokes near us, v3/oil-cards.ts; far off, a warm haze of them in the grass)
  float far = smoothstep(20.0, 40.0, dist) * (1.0 - smoothstep(80.0, 160.0, dist));
  if (drift > 0.6 && sp > 0.75 && p.x < -4.0) { alb = mix(alb, vec3(0.8, 0.3, 0.16), far * 0.7); }
  // the trodden path up to the door
  float path = (1.0 - smoothstep(0.45, 0.75, abs(p.x - 0.12 * sin(p.z * 0.6)))) * step(${DZ_GLSL}, p.z) * (1.0 - smoothstep(10.0, 14.0, p.z));
  alb = mix(alb, vec3(0.7, 0.58, 0.4) * (0.9 + 0.2 * g2), path * 0.8);
  // the valley: fields, each its crop, hedges between, woods, the river
  vec2 fp = p.xz + 40.0 * vec2(fbm3(p.xz * 0.004), fbm3(p.xz * 0.004 + 3.0));
  vec2 fc = floor(fp / vec2(150.0, 95.0)); vec2 ff = fract(fp / vec2(150.0, 95.0));
  float k = h21(fc);
  vec3 crop = k < 0.2 ? vec3(0.86, 0.74, 0.42) : k < 0.4 ? vec3(0.46, 0.58, 0.3) : k < 0.55 ? vec3(0.62, 0.66, 0.46) : k < 0.68 ? vec3(0.64, 0.56, 0.76) : k < 0.84 ? vec3(0.82, 0.62, 0.34) : vec3(0.36, 0.5, 0.28);
  float edge = min(min(ff.x, 1.0 - ff.x) * 150.0, min(ff.y, 1.0 - ff.y) * 95.0);
  crop = mix(vec3(0.2, 0.32, 0.18), crop, smoothstep(2.0, 6.0, edge));
  float wood = smoothstep(0.6, 0.66, fbm3(p.xz * 0.006 + 20.0));
  crop = mix(crop, vec3(0.18, 0.3, 0.17), wood);
  float rx = -90.0 + 140.0 * sin(p.z / 420.0) + 50.0 * sin(p.z / 160.0 + 1.0);
  float river = 1.0 - smoothstep(10.0, 16.0, abs(p.x - rx));
  alb = mix(alb, crop, down);
  vec3 c = lightUp(alb, n, shadowAt(p));
  c = mix(c, vec3(0.86, 0.9, 0.92) + vec3(0.12, 0.06, -0.04) * vnoise(p.xz * 0.05), river * down);
  // the air: far land goes to the haze's blue
  float a = 1.0 - exp(-dist / 1300.0);
  return mix(c, vec3(0.7, 0.78, 0.87), a * 0.86);
}

/** under the stroke whose middle is c: the land the painter's eye sees there (on this surface), and the stroke's way */
vec4 landAt(vec2 c) {
  vec3 dir = vec3(c.x, c.y, -1.0);
  float dn = dot(dir, gN);
  float t = gT;
  if (dn < -1e-4) { t = clamp(dot(gW - gRE, gN) / dn, gT * 0.6, gT * 1.8); }
  vec3 p = gRE + dir * t;
  float ang = (fbm3(p.xz * 0.07) - 0.5) * 0.5 + 0.12 * sin(p.x * 0.05);
  return vec4(landColour(p, gN), ang);
}
` + field("paintLand", "landAt", [
  { cell: 0.034, len: [1.6, 2.2], wid: 0.95, spread: 0.3, dry: 0.45, vary: 0.07, hue: 0.03 },
  { cell: 0.019, len: [1.5, 2.2], wid: 0.85, spread: 0.45, dry: 0.65, vary: 0.09, hue: 0.03 },
]) + /* glsl */ `
vec3 paintFrom(vec3 eye, vec3 own) {
  gRE = eye; gT = max(eye.z - gW.z, 0.05);
  vec2 Q = vec2(gW.x - eye.x, gW.y - eye.y) / gT;
  float px = length(fwidth(Q)) * 0.7;
  // the underpainting: the land's colour, thin over the warm ground of the canvas
  vec3 base = mix(own, vec3(0.72, 0.5, 0.32), 0.26) * (0.95 + 0.07 * weave(Q * 900.0));
  vec4 f = paintLand(Q, base, px);
  return relief(f.rgb, f.a, Q, 0.45);
}
void main() {
  gW = vW; gN = normalize(vN);
  vec3 own = landColour(vW, gN);
  // (the far eye paints what we see from afar; the near one, the ground by the door that we come close to)
  float k = smoothstep(uRE2.w - 1.0, uRE2.w + 1.5, vW.z);
  vec3 c;
  if (k > 0.999) { c = paintFrom(uRE.xyz, own); }
  else if (k < 0.001) { c = paintFrom(uRE2.xyz, own); }
  else { c = mix(paintFrom(uRE2.xyz, own), paintFrom(uRE.xyz, own), k); }
  gl_FragColor = vec4(c, 1.0);
}`;

// ---- the sky -----------------------------------------------------------------------------------------------------
// In its directions: Q = (how far round from straight ahead, how far up), radians. The clouds are heaps, each a dome of
// billows on a flat base, lit from the left (the low sun behind us there) and in shadow on their right and under; far
// low clouds along the horizon; high cirrus. Below the far hills' line (the land's mesh ends 1.8 km off) the far land.
const SKY_FRAG = NOISE + BRUSH + RELIEF + WEAVE + /* glsl */ `
uniform vec4 uCloud[8];   // each heap: its middle (round), its base (up), half its width, its height
uniform vec4 uDrift;      // how far the clouds have drifted (radians round), the light's way on the sky (x, y)
varying vec3 vW;
varying vec3 vN;

vec4 heaps(vec2 q) {
  // the densest heap here: (cover, light 0..1, its form's way, its billows)
  float best = 0.0; float lit = 0.0; float ang = 0.0; float bil = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 m = uCloud[i];
    if (m.z <= 0.0) { continue; }
    vec2 p = vec2((q.x - m.x - uDrift.x) / m.z, (q.y - m.y) / m.w);
    if (p.y < -0.25 || p.y > 1.6 || abs(p.x) > 1.5) { continue; }
    float fi = float(i) * 7.31;
    float top = pow(max(0.0, 1.0 - p.x * p.x), 0.55) * (0.72 + 0.4 * fbm3(vec2(p.x * 2.2 + fi, fi)));
    float b1 = fbm(vec2(p.x * 5.0 + fi, p.y * 4.0 - fi));
    float inside = top + 0.22 * (b1 - 0.5) - p.y;
    float fb = smoothstep(-0.02, 0.07, p.y + 0.05 * (fbm3(vec2(p.x * 9.0, fi)) - 0.5));
    float d = smoothstep(-0.04, 0.06, inside) * fb;
    if (d > best) {
      best = d;
      // its form: a dome round its middle, and each billow a lesser dome
      vec2 n2 = normalize(vec2(p.x * m.z, (p.y - 0.28) * m.w * 1.3) + 1e-5);
      float e = 0.02;
      float bx = fbm(vec2((p.x + e) * 5.0 + fi, p.y * 4.0 - fi)) - b1;
      float by = fbm(vec2(p.x * 5.0 + fi, (p.y + e) * 4.0 - fi)) - b1;
      vec2 nb = normalize(n2 + vec2(bx, by) * 6.0);
      float l = dot(nb, uDrift.yz) * 0.5 + 0.5;
      l *= mix(0.55, 1.0, smoothstep(0.0, 0.3, p.y));
      lit = l;
      ang = atan(nb.y, nb.x) + 1.5708;
      bil = b1;
    }
  }
  return vec4(best, lit, ang, bil);
}

/** the far hills' line, and the far land under it */
float hills(float th) { return 0.006 + 0.022 * fbm3(vec2(th * 2.6 + 3.0, 1.0)) + 0.012 * smoothstep(0.2, 0.9, th) ; }
float nearHills(float th) { return -0.004 + 0.016 * fbm3(vec2(th * 4.1 + 9.0, 2.0)) - 0.01 * smoothstep(-0.4, 0.4, th); }

vec4 skyAt(vec2 q) {
  float th = q.x; float ph = q.y;
  float y = max(ph, 0.0);
  vec3 c = mix(vec3(0.86, 0.9, 0.86), vec3(0.42, 0.66, 0.9), smoothstep(0.0, 0.2, y));
  c = mix(c, vec3(0.2, 0.42, 0.8), smoothstep(0.16, 0.62, y));
  // the low sun's warmth along the horizon on its side
  float side = smoothstep(0.3, -1.0, th);
  c = mix(c, vec3(1.0, 0.86, 0.64), (1.0 - smoothstep(0.0, 0.22, y)) * side * 0.75);
  float ang = 0.42 + 0.5 * (fbm3(q * 3.0) - 0.5) - 0.3 * (1.0 - smoothstep(0.0, 0.15, y));
  // high cirrus, drawn out along the wind
  vec2 cq = vec2(q.x * 0.94 + q.y * 0.34, -q.x * 0.34 + q.y * 0.94);
  float ci = smoothstep(0.58, 0.8, fbm(cq * vec2(3.0, 22.0) + vec2(uDrift.x * 3.0, 0.0))) * smoothstep(0.16, 0.34, ph);
  c = mix(c, vec3(1.0, 0.9, 0.86), ci * 0.6);
  if (ci > 0.15) { ang = 0.36; }
  float detail = ci * 0.6;
  // the heaps
  vec4 h = heaps(q);
  if (h.x > 0.0) {
    vec3 sh = vec3(0.6, 0.62, 0.77); vec3 mid = vec3(0.88, 0.85, 0.86); vec3 lt = vec3(1.0, 0.95, 0.84); vec3 gold = vec3(1.0, 0.82, 0.58);
    vec3 cc = mix(sh, mid, smoothstep(0.15, 0.5, h.y));
    cc = mix(cc, lt, smoothstep(0.5, 0.75, h.y));
    cc = mix(cc, gold, smoothstep(0.82, 0.98, h.y));
    cc *= 0.94 + 0.12 * h.w;
    c = mix(c, cc, h.x);
    ang = mix(ang, h.z, smoothstep(0.1, 0.6, h.x));
    detail = max(detail, smoothstep(0.05, 0.5, h.x));
  }
  // the far hills, and the far land under them
  float fh = hills(th); float nh = nearHills(th);
  if (ph < fh) {
    vec3 hc = mix(vec3(0.6, 0.64, 0.82), vec3(0.78, 0.72, 0.78), smoothstep(-0.2, -0.9, th) * 0.7);
    hc = mix(hc, vec3(0.72, 0.78, 0.88), smoothstep(fh - 0.004, fh, ph) * 0.3);
    c = hc; ang = 0.05 * sin(th * 9.0);
  }
  if (ph < nh) {
    vec3 lc = mix(vec3(0.5, 0.58, 0.74), vec3(0.62, 0.66, 0.66), fbm3(vec2(th * 30.0, ph * 200.0)));
    c = lc; ang = 0.03 * sin(th * 13.0);
  }
  if (ph < fh) { detail = 0.6; }
  return vec4(c, ang + 20.0 * floor(clamp(detail, 0.0, 1.0) * 8.0 + 0.5));
}
` + field("paintSky", "skyAt", [
  { cell: 0.075, len: [1.8, 2.2], wid: 0.95, spread: 0.45, dry: 0.4, vary: 0.02, hue: 0.05 },
  { cell: 0.042, len: [1.7, 2.2], wid: 0.85, spread: 0.4, dry: 0.55, vary: 0.025, hue: 0.05 },
  { cell: 0.022, len: [1.5, 2.2], wid: 0.9, spread: 0.45, dry: 0.65, vary: 0.05, hue: 0.04, masked: true },
]) + /* glsl */ `
void main() {
  vec3 rd = normalize(vW - cameraPosition);
  vec2 Q = vec2(atan(rd.x, -rd.z), asin(clamp(rd.y, -1.0, 1.0)));
  float px = length(fwidth(Q)) * 0.7;
  vec3 own = skyAt(Q).rgb;
  vec3 base = mix(own, vec3(0.74, 0.54, 0.36), 0.2) * (0.95 + 0.07 * weave(Q * 1400.0));
  vec4 f = paintSky(Q, base, px);
  gl_FragColor = vec4(relief(f.rgb, f.a * 0.6, Q, 0.25), 1.0);
}`;

export const LAND_GLSL = { vertex: VERTEX, fragment: LAND_FRAG };
export const SKY_GLSL = { vertex: VERTEX, fragment: SKY_FRAG };

/** the sky's heaps of cloud: [round, base, half width, height] (radians) */
export const CLOUDS: number[] = [
  0.3, 0.05, 0.24, 0.33,      // the great tower, right, behind the tree
  -0.4, 0.035, 0.22, 0.17,    // a broad heap on the left, toward the sun, gilded
  0.0, 0.135, 0.075, 0.06,    // small ones over the door
  -0.13, 0.24, 0.06, 0.05,
  0.62, 0.11, 0.13, 0.11,
  0.85, 0.06, 0.16, 0.08,     // a heap far right
  -0.75, 0.2, 0.1, 0.07,
  0, 0, 0, 0,
];
