// A Hobrecht sewer under the Friedrichstadt (Radialsystem III, built 1873-76): the brick egg, its black water, a side
// branch dropping in, a manhole shaft up to the street, and the dust a thud shakes from the crown.
//
// Sourced (Hobrecht's "Die Canalisation von Berlin", 1884, as summarised by the Berliner Wasserbetriebe's museum and
// landschaften-in-deutschland.de): pipes under 48 cm were glazed stoneware; larger sewers were egg profiles
// ("Eikanäle") of hard-burnt brick, 0.70 m to 2.00 m high; a mixed system, rain and foul water in one channel, so
// storms fill them high. Bricks are the Reichsformat, standard from 1872: 25 x 12 x 6.5 cm. The egg is the Normal-
// Eiprofil, 2:3: crown radius r, invert radius r/2, sides 3r, height 3r. Drawn, not sourced: the branch's drop, the
// shaft's step irons and cover, the tide and slime lines, the lime sinter.
//
// Frame: metres, Y up; the origin on the invert (the egg's lowest point) at the tunnel's start; the tunnel runs along
// -z for `len`; +x is the right wall. The set brings no light of its own but the daylight through the manhole cover;
// lanterns come with the patrol (SewerLantern).
//
// Game-ready: the tube is one BufferMesh with UVs in metres (rings every 0.5 m, fine only round the openings), the
// brick is all shader (no textures), so a 40 m run is about 14k vertices and four draws. lod 1 halves the profile.
import { BufferMesh, Cylinder, Entity, FogVolume, Instances, Sphere, manifold, type Solid } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { PointLight, SpotLight } from "raea/light";
import { Mesh3d } from "raea/mesh";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { Mat } from "../../interiors/draw/set";

type V3 = [number, number, number];
const PI = Math.PI;

// ------------------------------------------------------------------------------------------------ the egg
type EggPt = { x: number; y: number; nx: number; ny: number; u: number };
/** The Normal-Eiprofil of height H as `n` points evenly spaced by arc length, from the invert round the right wall,
 *  over the crown and back down the left; each with its inward normal and `u`, the arc length from the invert. */
export function eggPoints(H: number, n: number): EggPt[] {
  const r = H / 3, k = Math.atan2(0.75, 1); // 36.87°: where the invert arc meets the side arc
  const arcs: { c: [number, number]; R: number; a0: number; a1: number }[] = [
    { c: [0, r / 2], R: r / 2, a0: -PI / 2, a1: -k },
    { c: [-2 * r, 2 * r], R: 3 * r, a0: -k, a1: 0 },
    { c: [0, 2 * r], R: r, a0: 0, a1: PI },
    { c: [2 * r, 2 * r], R: 3 * r, a0: PI, a1: PI + k },
    { c: [0, r / 2], R: r / 2, a0: PI + k, a1: (3 * PI) / 2 },
  ];
  const lens = arcs.map((a) => a.R * (a.a1 - a.a0)), total = lens.reduce((a, b) => a + b, 0);
  const out: EggPt[] = [];
  for (let i = 0; i <= n; i++) {
    let s = (i / n) * total, j = 0;
    while (j < arcs.length - 1 && s > lens[j]) { s -= lens[j]; j++; }
    const a = arcs[j], th = a.a0 + s / a.R, cx = Math.cos(th), cy = Math.sin(th);
    out.push({ x: a.c[0] + a.R * cx, y: a.c[1] + a.R * cy, nx: -cx, ny: -cy, u: (i / n) * total });
  }
  return out;
}
/** The egg's half-width at height y (0 below the invert or above the crown). */
export function eggHalfWidth(H: number, y: number): number {
  const r = H / 3;
  if (y <= 0 || y >= H) return 0;
  if (y >= 2 * r) return Math.sqrt(Math.max(0, r * r - (y - 2 * r) ** 2));
  const ySide = 0.2 * r; // below it, the invert arc
  if (y <= ySide) return Math.sqrt(Math.max(0, (r / 2) ** 2 - (y - r / 2) ** 2));
  return -2 * r + Math.sqrt(Math.max(0, 9 * r * r - (y - 2 * r) ** 2));
}
/** The egg's outline as a polygon (for manifold), grown outward by `grow` (a ring's outer face: grow by the wall). */
export function eggOutline(H: number, n = 64, grow = 0): [number, number][] {
  return eggPoints(H, n).slice(0, n).map((p) => [p.x - p.nx * grow, p.y - p.ny * grow]);
}
/** The brick ring as a solid along -z from 0 to -len: for the section cutaway, where the egg is seen cut. */
export function eggRing(H: number, len: number, wall = 0.25, n = 48): Solid {
  const outer = manifold.extrude([eggOutline(H, n, wall)], len), inner = manifold.extrude([eggOutline(H, n, 0)], len + 0.2).move(0, 0, -0.1);
  return outer.minus(inner).move(0, 0, -len);
}

// ------------------------------------------------------------------------------------------------ meshes
type Buf = { positions: number[]; normals: number[]; uvs: number[]; indices: number[] };
const buf = (): Buf => ({ positions: [], normals: [], uvs: [], indices: [] });
/** Stations along a run: every `coarse` metres, every `fine` metres within `pad` of each opening. */
function stations(len: number, openings: number[], coarse = 0.5, fine = 0.04, pad = 0.8): number[] {
  const out: number[] = [];
  let z = 0;
  while (z < len) {
    out.push(z);
    if (openings.some((o) => Math.abs(z - o) < pad)) { z += fine; continue; }
    const next = Math.min(Infinity, ...openings.map((o) => o - pad).filter((q) => q > z + 1e-6));
    z += Math.max(fine, Math.min(coarse, next - z));
  }
  out.push(len);
  return out;
}
/** The main tube's inner face. `hole(x, y, d)` (d metres along the run) says where the wall is cut away. */
function tubeMesh(H: number, len: number, prof: number, opens: number[], hole: (x: number, y: number, d: number) => boolean): Buf {
  const P = eggPoints(H, prof), S = stations(len, opens), b = buf(), W = P.length;
  for (const d of S) for (const p of P) {
    b.positions.push(p.x, p.y, -d);
    b.normals.push(p.nx, p.ny, 0);
    b.uvs.push(p.u, d);
  }
  for (let j = 0; j < S.length - 1; j++) for (let i = 0; i < W - 1; i++) {
    const p = P[i], q = P[i + 1], dm = (S[j] + S[j + 1]) / 2;
    if (hole((p.x + q.x) / 2, (p.y + q.y) / 2, dm)) continue;
    const a = j * W + i, c = (j + 1) * W + i;
    // seen from inside (the normals' side), counter-clockwise
    b.indices.push(a, a + 1, c, a + 1, c + 1, c);
  }
  return b;
}
/** A side branch: a smaller egg of height h whose invert is `drop` above the main's, running out along +x from the main's
 *  right wall (its first ring lies on that wall) for `len`, centred at `at` metres along the main. */
function branchMesh(Hm: number, h: number, drop: number, at: number, len: number, prof: number): Buf {
  const P = eggPoints(h, prof), b = buf(), W = P.length, steps = Math.ceil(len / 0.5);
  for (let s = 0; s <= steps; s++) for (const p of P) {
    const y = p.y + drop, x0 = eggHalfWidth(Hm, y) - 0.01, x = s === 0 ? x0 : x0 + (s / steps) * len;
    // the branch's profile lies across z (its own x), the run along +x
    b.positions.push(x, y, -at + p.x);
    b.normals.push(0, p.ny, p.nx);
    b.uvs.push(p.u, x);
  }
  for (let s = 0; s < steps; s++) for (let i = 0; i < W - 1; i++) {
    const a = s * W + i, c = (s + 1) * W + i;
    b.indices.push(a, a + 1, c, a + 1, c + 1, c);
  }
  return b;
}
/** The manhole shaft: a brick cylinder of radius R from the main's crown up `rise`, at `at` metres along the run. Its uv
 *  runs height first, round second, so the courses lie level. */
function shaftMesh(H: number, R: number, at: number, rise: number, n = 40): Buf {
  const r = H / 3, b = buf(), steps = Math.ceil(rise / 0.25);
  for (let s = 0; s <= steps; s++) for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * PI, x = Math.cos(a) * R, z = Math.sin(a) * R;
    const foot = 2 * r + Math.sqrt(Math.max(0, r * r - x * x)) - 0.015, y = s === 0 ? foot : H + (s / steps) * rise;
    b.positions.push(x, y, -at + z);
    b.normals.push(-Math.cos(a), 0, -Math.sin(a));
    b.uvs.push(y, (i / n) * 2 * PI * R);
  }
  const W = n + 1;
  for (let s = 0; s < steps; s++) for (let i = 0; i < n; i++) {
    const a = s * W + i, c = (s + 1) * W + i;
    b.indices.push(a, a + 1, c, a + 1, c + 1, c);
  }
  return b;
}
/** The water's surface: a strip across the egg at depth `w`, along the run. */
function waterMesh(H: number, w: number, len: number): Buf {
  const hw = eggHalfWidth(H, w) + 0.01, b = buf(), steps = Math.ceil(len / 1);
  for (let s = 0; s <= steps; s++) {
    const d = (s / steps) * len;
    b.positions.push(-hw, w, -d, hw, w, -d);
    b.normals.push(0, 1, 0, 0, 1, 0);
    b.uvs.push(0, d, 2 * hw, d);
  }
  for (let s = 0; s < steps; s++) {
    const a = 2 * s;
    b.indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return b;
}

// ------------------------------------------------------------------------------------------------ shaders
export const NOISE = /* wgsl */ `
fn h21(p: vec2<f32>) -> f32 {
  var q = fract(p * vec2<f32>(0.1031, 0.1030));
  q = q + dot(q, q.yx + 33.33);
  return fract((q.x + q.y) * q.x);
}
fn vn2(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2<f32>(1.0, 0.0)), u.x), mix(h21(i + vec2<f32>(0.0, 1.0)), h21(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}
fn fbm2(p: vec2<f32>) -> f32 {
  var a = 0.5;
  var s = 0.0;
  var q = p;
  for (var k = 0; k < 4; k = k + 1) {
    s = s + a * vn2(q);
    q = q * 2.03 + vec2<f32>(1.7, 9.2);
    a = a * 0.5;
  }
  return s;
}
`;
/** Reichsformat brick on the uv (x: across the courses, y: along the bricks, both in metres): the courses 6.5 cm and a
 *  1.2 cm joint, the bricks 25 cm in running bond. Returns the face's height (0 in the joint, 1 on a brick's face,
 *  worn at the arrises), and the brick's id. */
const BRICK = NOISE + /* wgsl */ `
const CH: f32 = 0.077;
const BL: f32 = 0.262;
fn brick_at(uv: vec2<f32>) -> vec3<f32> {
  let row = floor(uv.x / CH);
  let off = select(0.0, 0.5, fract(row * 0.5) > 0.25);
  let cf = uv.y / BL + off;
  let col = floor(cf);
  let fx = fract(cf) * BL;
  let fy = fract(uv.x / CH) * CH;
  let e = min(min(fx, BL - fx), min(fy, CH - fy));
  // the joint (6 mm a side), the arris worn round, the face pitted
  let face = smoothstep(0.0035, 0.0085, e) * (0.94 + 0.06 * vn2(uv * vec2<f32>(160.0, 160.0)));
  return vec3<f32>(face, row, col);
}
fn brick_h(uv: vec2<f32>) -> f32 { return brick_at(uv).x * 0.009; }
`;
/** The sewer's brick: firing colours, recessed joints, the storm tide line, the slime band at the water, seepage
 *  streaks, lime sinter from the crown's joints. Uniforms: floor (the invert's world y), water (its depth), tide (the
 *  storm line's height), wet (0..1 overall), sinter (0..1), branch (z, drop, half-width: wet below the branch's lip). */
export const SEWER_BRICK = BRICK + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let uv = in.uv;
  let wp = in.world_position.xyz;
  let n = normalize((*pbr).N);
  // the cotangent frame from the uv's screen derivatives: t along the courses' stacking, b along the bricks
  let dp1 = dpdx(wp);
  let dp2 = dpdy(wp);
  let du1 = dpdx(uv);
  let du2 = dpdy(uv);
  let p2 = cross(dp2, n);
  let p1 = cross(n, dp1);
  var t = p2 * du1.x + p1 * du2.x;
  var b = p2 * du1.y + p1 * du2.y;
  let im = inverseSqrt(max(max(dot(t, t), dot(b, b)), 1e-12));
  t = t * im;
  b = b * im;
  let e = 0.0015;
  let br = brick_at(uv);
  let h0 = br.x * 0.009;
  let ht = brick_h(uv + vec2<f32>(e, 0.0));
  let hb = brick_h(uv + vec2<f32>(0.0, e));
  let nn = normalize(n - ((ht - h0) / e) * t - ((hb - h0) / e) * b);
  let id = vec2<f32>(br.y, br.z);
  let r = h21(id * vec2<f32>(1.0, 7.31));
  let r2 = h21(id * vec2<f32>(3.7, 1.13));
  // hard-burnt brick: red to brown, a dark overburnt clinker in eight; the mortar lime grey
  var brickc = mix(vec3<f32>(0.42, 0.17, 0.10), vec3<f32>(0.55, 0.27, 0.16), r);
  brickc = mix(brickc, vec3<f32>(0.20, 0.11, 0.08), step(0.875, r2));
  brickc = brickc * (0.85 + 0.3 * vn2(uv * 21.0));
  let mortar = vec3<f32>(0.42, 0.40, 0.36) * (0.8 + 0.4 * vn2(uv * 37.0));
  let joint = 1.0 - smoothstep(0.2, 0.8, br.x);
  var col = mix(brickc, mortar, joint);
  var rough = mix(0.82, 0.92, joint);
  let hgt = wp.y - u_floor();
  // the storm tide: everything below it stained and silted, its top edge ragged
  let tideEdge = u_tide() + 0.08 * (fbm2(vec2<f32>(uv.y * 1.3, 0.0)) - 0.5);
  let below = 1.0 - smoothstep(tideEdge - 0.02, tideEdge + 0.02, hgt);
  col = mix(col, col * vec3<f32>(0.55, 0.5, 0.42) + vec3<f32>(0.03, 0.025, 0.015), below * 0.8);
  // the slime band ("Sielhaut") at the waterline, glossy and green-brown
  let slime = smoothstep(u_water() + 0.14, u_water() + 0.04, hgt) * (0.7 + 0.3 * fbm2(uv * vec2<f32>(4.0, 1.0)));
  col = mix(col, vec3<f32>(0.07, 0.075, 0.04), clamp(slime, 0.0, 1.0));
  // seepage: wet streaks running down from the joints of the upper wall
  let seep = smoothstep(0.55, 0.75, fbm2(vec2<f32>(uv.y * 2.2, uv.x * 0.35))) * smoothstep(0.5, 1.4, hgt);
  // below the branch's lip, its trickle down the wall
  let br3 = u_branch();
  let fall = (1.0 - smoothstep(br3.z * 0.5, br3.z * 0.5 + 0.12, abs(wp.z - br3.x))) * step(hgt, br3.y + 0.02) * step(0.0, wp.x);
  let wet = clamp(u_wet() * 0.35 + seep + slime + below * 0.5 + fall, 0.0, 1.0);
  col = col * mix(1.0, 0.52, wet);
  rough = mix(rough, 0.16, wet);
  // lime sinter: white crusts bleeding from the crown's joints
  let crown = smoothstep(1.15, 1.6, hgt);
  let sinter = u_sinter() * crown * joint * smoothstep(0.45, 0.7, fbm2(vec2<f32>(uv.y * 3.1, uv.x * 1.7))) + u_sinter() * crown * 0.35 * smoothstep(0.62, 0.8, fbm2(vec2<f32>(uv.y * 5.0, uv.x * 0.6)));
  col = mix(col, vec3<f32>(0.74, 0.72, 0.66), clamp(sinter, 0.0, 0.85));
  rough = mix(rough, 0.5, clamp(sinter, 0.0, 1.0));
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = rough;
  (*pbr).N = normalize(mix(nn, n, wet * 0.6));
}
`;
/** The water: near black, a slow flow down the run (-z), ripples, a skin of scum. Uniforms: time (s), flow (m/s). */
export const SEWER_WATER = NOISE + /* wgsl */ `
fn wh(p: vec2<f32>, t: f32) -> f32 {
  return fbm2(vec2<f32>(p.x * 7.0, p.y * 3.0 + t * 2.6)) * 0.006 + vn2(vec2<f32>(p.x * 23.0, p.y * 9.0 + t * 5.0)) * 0.002;
}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let wp = in.world_position.xyz;
  let t = u_time() * u_flow();
  let p = vec2<f32>(wp.x, wp.z);
  let e = 0.01;
  let h0 = wh(p, t);
  let hx = wh(p + vec2<f32>(e, 0.0), t);
  let hz = wh(p + vec2<f32>(0.0, e), t);
  (*pbr).N = normalize(vec3<f32>(-(hx - h0) / e, 1.0, -(hz - h0) / e));
  let scum = smoothstep(0.58, 0.72, fbm2(vec2<f32>(p.x * 2.5, p.y * 0.9 + t * 0.9)));
  let col = mix(vec3<f32>(0.018, 0.016, 0.012), vec3<f32>(0.075, 0.065, 0.045), scum * 0.7);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = mix(0.035, 0.55, scum);
}
`;

// ------------------------------------------------------------------------------------------------ pieces
/** A Berlin cast-iron manhole cover, 62 cm across: a ribbed disc with pick holes (the light through them is the shot). */
export const COVER = (() => {
  const disc = manifold.cylinder(0.31, 0.04);
  const holes = Array.from({ length: 16 }, (_, i) => manifold.cylinder(0.019, 0.1).move(Math.cos((i / 16) * 2 * PI) * 0.22, Math.sin((i / 16) * 2 * PI) * 0.22, 0));
  const inner = Array.from({ length: 8 }, (_, i) => manifold.cylinder(0.016, 0.1).move(Math.cos((i / 8) * 2 * PI + 0.2) * 0.11, Math.sin((i / 8) * 2 * PI + 0.2) * 0.11, 0));
  const ribs = Array.from({ length: 8 }, (_, i) => manifold.box(0.56, 0.018, 0.02).move(0, 0, -0.025).rotate(0, 0, (i * 180) / 8));
  return manifold.union(disc, ...ribs).minus(...holes, ...inner, manifold.cylinder(0.02, 0.1)).rotate(-90, 0, 0);
})();
/** A U-shaped step iron ("Steigeisen") set in the shaft wall, its tread facing in. */
const STEP = manifold.union(manifold.box(0.3, 0.025, 0.025).move(0, 0, 0.15), manifold.box(0.025, 0.025, 0.17).move(-0.14, 0, 0.065), manifold.box(0.025, 0.025, 0.17).move(0.14, 0, 0.065));

const SPEC = { H: 2.0, len: 30, branchAt: 12, branchH: 1.2, branchDrop: 0.32, branchLen: 7, shaftAt: 19, shaftR: 0.45, shaftRise: 3.2, water: 0.12 };
const MESH = new Map<string, { tube: Buf; branch: Buf; shaft: Buf; water: Buf }>();
/** A breach in the left wall : metres along the run, its axis's height, its radius. */
export type Breach = { d: number; y: number; r: number };
function sewerMeshes(lod: 0 | 1, breach?: Breach) {
  const k = breach ? `${lod}:${breach.d}:${breach.y}:${breach.r}` : String(lod);
  let m = MESH.get(k);
  if (!m) {
    const { H, len, branchAt, branchH, branchDrop, branchLen, shaftAt, shaftR, shaftRise, water } = SPEC, prof = lod ? 64 : 128;
    const hole = (x: number, y: number, d: number) =>
      (x > 0.2 && Math.abs(d - branchAt) < eggHalfWidth(branchH, y - branchDrop) + 0.035 && y > branchDrop - 0.02 && y < branchDrop + branchH + 0.02) ||
      (y > H - 0.4 && x * x + (d - shaftAt) ** 2 < (shaftR + 0.03) ** 2) ||
      (!!breach && x < -0.12 && (y - breach.y) ** 2 + (d - breach.d) ** 2 < breach.r ** 2);
    MESH.set(k, (m = { tube: tubeMesh(H, len, prof, breach ? [branchAt, shaftAt, breach.d] : [branchAt, shaftAt], hole), branch: branchMesh(H, branchH, branchDrop, branchAt, branchLen, lod ? 48 : 96), shaft: shaftMesh(H, shaftR, shaftAt, shaftRise), water: waterMesh(H, water, len) }));
  }
  return m;
}
/** Where things are, for shots and the patrol's path. */
export const SEWER = {
  ...SPEC,
  /** the shaft's foot, on the axis under the cover */
  shaftFoot: [0, SPEC.H, -SPEC.shaftAt] as V3,
  /** the branch's mouth, on the right wall at its invert */
  branchMouth: [eggHalfWidth(SPEC.H, SPEC.branchDrop + 0.6), SPEC.branchDrop, -SPEC.branchAt] as V3,
  /** where a man stands in the branch's mouth, flat against its brick and out of the main's lantern light */
  hide: [eggHalfWidth(SPEC.H, SPEC.branchDrop + 0.6) + 0.55, SPEC.branchDrop, -SPEC.branchAt - 0.22] as V3,
};

/** Brick collars round the two openings: each a ring of the opening's shape, cut to a 3.5 cm skin just inside the
 *  main egg, so it stands proud of the wall and covers the cut's edge (the tube's mesh cuts by whole quads). */
const COLLARS = (() => {
  const { H, branchH, branchDrop, branchAt, shaftAt, shaftR } = SPEC;
  const skin = (z0: number, z1: number) => manifold.extrude([eggOutline(H, 96, 0)], z1 - z0).minus(manifold.extrude([eggOutline(H, 96, -0.035)], z1 - z0 + 0.2).move(0, 0, -0.1)).move(0, 0, z0);
  const shaftRing = manifold.cylinder(shaftR + 0.11, 2).minus(manifold.cylinder(shaftR, 2.2)).rotate(-90, 0, 0).move(0, H, -shaftAt);
  const branchRing = manifold.extrude([eggOutline(branchH, 64, 0.11)], 2).minus(manifold.extrude([eggOutline(branchH, 64, 0)], 2.2).move(0, 0, -0.1)).rotate(0, 90, 0).move(-0.2, branchDrop, -branchAt);
  return manifold.union(shaftRing.intersect(skin(-shaftAt - 1, -shaftAt + 1)), branchRing.intersect(skin(-branchAt - 1, -branchAt + 1)));
})();

function Brick({ mesh, uni }: { mesh: Buf; uni: Record<string, number | number[]> }) {
  return (
    <Mesh3d allowOverlap>
      <BufferMesh positions={mesh.positions} normals={mesh.normals} uvs={mesh.uvs} indices={mesh.indices} />
      <ExtendedMaterial base={<StandardMaterial base_color="#6a3a28" perceptual_roughness={0.85} />} extension={<ShaderExtension wgsl={SEWER_BRICK} uniforms={uni} />} />
    </Mesh3d>
  );
}

export type SewerState = {
  /** seconds, for the water's flow */
  t: number;
  /** the street's daylight through the cover, 0 night to 1 a grey winter day */
  day?: number;
  /** dust from the crown: seconds since the thud (negative: none yet) */
  thud?: number;
  lod?: 0 | 1;
  /** fog in the air (0 none to 1 the shaft's beams thick) */
  haze?: number;
};

/** The dust a thud shakes loose: grains sifting from the crown's joints over a few metres of run, falling and spreading.
 *  A fixed count (instanced, one draw); grains not falling are parked out of sight. */
function Dust({ since, around }: { since: number; around: number }) {
  const N = 600, at: { position: V3; scale?: number }[] = [];
  const r = SPEC.H / 3;
  for (let i = 0; i < N; i++) {
    const h1 = Math.sin(i * 12.9898) * 43758.5453, h2 = Math.sin(i * 78.233) * 12543.21, h3 = Math.sin(i * 39.425) * 9631.7;
    const fx = h1 - Math.floor(h1), fz = h2 - Math.floor(h2), fd = h3 - Math.floor(h3);
    const t = since - fd * 1.6; // grains loosen over 1.6 s
    const x = (fx - 0.5) * r * 1.4, y0 = 2 * r + Math.sqrt(Math.max(0, r * r - x * x)) - 0.01;
    const y = y0 - 0.5 * 9.81 * 0.18 * t * t; // fine dust: air drag holds it to about a fifth of free fall
    const z = -(around + (fz - 0.5) * 5) + Math.sin(i + t * 2) * 0.02 * t;
    at.push(t < 0 || y < SPEC.water ? { position: [0, -20, -around] } : { position: [x + Math.sin(i * 3 + t) * 0.03 * t, y, z] });
  }
  return (
    <Instances name="sewer-dust" at={at}>
      <Sphere radius={0.0018} />
      <StandardMaterial base_color="#b8ad98" perceptual_roughness={1} />
    </Instances>
  );
}

/** The sewer set. */
export function SewerSet({ s, origin = [0, 0, 0], dustAt = 6, breach }: { s: SewerState; origin?: V3; dustAt?: number; breach?: Breach }) {
  const { t, day = 0.6, thud = -1, lod = 0, haze = 0.5 } = s;
  const m = sewerMeshes(lod, breach);
  const base = { floor: origin[1], water: SPEC.water, tide: 0.62, wet: 0.6, sinter: 0.7, branch: [origin[2] - SPEC.branchAt, SPEC.branchDrop, SPEC.branchH * 0.33] };
  const steps = Array.from({ length: Math.floor((SPEC.shaftRise + 0.3) / 0.3) }, (_, i) => i);
  return (
    <Entity transform={Transform.fromXyz(...origin)}>
      <Brick mesh={m.tube} uni={base} />
      <Brick mesh={m.branch} uni={{ ...base, floor: origin[1] + SPEC.branchDrop, water: 0.04, tide: 0.4 }} />
      <Brick mesh={m.shaft} uni={{ ...base, tide: -1, water: -1, wet: 0.3, sinter: 0.2 }} />
      <Mesh3d shape={COLLARS} allowOverlap>
        <Mat id="brick" />
      </Mesh3d>
      <Mesh3d allowOverlap>
        <BufferMesh positions={m.water.positions} normals={m.water.normals} uvs={m.water.uvs} indices={m.water.indices} />
        <ExtendedMaterial base={<StandardMaterial base_color="#050403" perceptual_roughness={0.04} reflectance={0.5} />} extension={<ShaderExtension wgsl={SEWER_WATER} uniforms={{ time: t, flow: 0.35 }} />} />
      </Mesh3d>

      {/* the shaft: step irons in two staggered columns, the cover at the street, the day through its holes */}
      {steps.map((i) => (
        <Mesh3d key={i} shape={STEP} transform={Transform.fromXyz((i % 2 ? 0.12 : -0.12), SPEC.H + 0.25 + i * 0.3, -SPEC.shaftAt - SPEC.shaftR + 0.005).withRotation(Quat.fromEuler("XYZ", 0, 0, 0))} allowOverlap>
          <Mat id="iron-rust" />
        </Mesh3d>
      ))}
      <Mesh3d shape={COVER} transform={Transform.fromXyz(0, SPEC.H + SPEC.shaftRise + 0.02, -SPEC.shaftAt)} allowOverlap>
        <Mat id="iron" />
      </Mesh3d>
      {/* the brick corbel under the cover: the shaft narrows to the frame */}
      <Mesh3d shape={manifold.cylinder(SPEC.shaftR + 0.05, 0.12).minus(manifold.cylinder(0.3, 0.2)).rotate(90, 0, 0)} transform={Transform.fromXyz(0, SPEC.H + SPEC.shaftRise - 0.08, -SPEC.shaftAt)} allowOverlap>
        <Mat id="brick-raw" />
      </Mesh3d>
      {/* the sky far above: nearly parallel through the holes, so each beam stays as thin as its hole */}
      {day > 0.01 ? (
        <SpotLight transform={Transform.fromXyz(0.4, SPEC.H + SPEC.shaftRise + 25, -SPEC.shaftAt - 0.3).lookingAt([0, 0, -SPEC.shaftAt])} intensity={day * 4e6 * 1800} range={40} outer_angle={0.022} inner_angle={0.014} color="#c6d0dc" shadow_maps_enabled volumetric />
      ) : null}
      {/* the day's bounce down the shaft's own brick: no shadow, just enough to show the irons */}
      {day > 0.01 ? <PointLight transform={Transform.fromXyz(0, SPEC.H + SPEC.shaftRise - 0.4, -SPEC.shaftAt)} intensity={day * 25 * 1800} range={5} radius={0.3} color="#a8b4c4" /> : null}
      {haze > 0 ? <FogVolume name="sewer-air" position={[0, SPEC.H / 2 + 1, -SPEC.len / 2]} scale={[SPEC.H * 2.5, SPEC.H + SPEC.shaftRise + 1, SPEC.len]} density={0.035 * haze} color="#8a8478" scattering={0.6} absorption={0.15} anisotropy={0.6} /> : null}
      <Dust since={thud < 0 || thud > 8 ? -1 : thud} around={dustAt} />
    </Entity>
  );
}

/** A patrol's lantern: a hurricane lantern's flame and the pool it throws; carried, so it sways. */
export function SewerLantern({ at, k = 1, shadow = true }: { at: V3; k?: number; shadow?: boolean }) {
  return (
    <>
      <Mesh3d transform={Transform.fromXyz(...at)} allowOverlap>
        <Cylinder radius={0.05} half_height={0.08} />
        <StandardMaterial base_color="#c8a060" emissive={LinearRgba.from(Srgba.hex("#ffb060")).mul(24 * k)} perceptual_roughness={0.2} />
      </Mesh3d>
      <PointLight transform={Transform.fromXyz(at[0], at[1], at[2])} intensity={k * 90 * 1800} range={14} radius={0.04} color="#ffb060" shadow_maps_enabled={shadow} soft_shadows_enabled={shadow} />
    </>
  );
}
