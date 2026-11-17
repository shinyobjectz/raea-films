// The cathedral's sunset (v3/nave.tsx), on the song's boom: the director, 11-11, "more dramtic lighting or better raytracing in
// the cchurch its when the big booming bass happens ... we need something extraordinary to happen". As the nave takes
// fire the sun comes out under the cloud, low in the west on the left, and pours in through the windows: through the
// aisle's lancets and on under the arcade, it lays their quarry glass on the floor and the pews in long amber pools
// with a lattice of lead in them and a coloured border; through the clerestory it crosses the nave high up in shafts,
// lit in the candles' smoke, and lands on the far wall. Each bay's windows take the light as the fire's rush passes it.
//
// Drawn as a pass over the lit frame, before the tone mapper, from the camera's depth and normals: the sun's light at a
// point is found by following the line to the sun out through the walls, the window it leaves by (and whether a pier,
// the arcade's spandrels or the choir screen is in the way) giving its colour; the same at each step of a march along
// the line of sight through the haze gives the shafts. The set's geometry, as built (blender/components/cathedral
// arcade_bay.py, aisle_wall.py; v3/nave.tsx's screen), in the world's frame: the nave's walls at x -3.2 and +3.2, the
// aisles' at -6.6 and +6.6, the bays 4.5 m long with their middles at BAY_Z.
import { FramePass } from "raea/3d";
import type { V3 } from "../v2/math";
import { H, W } from "./plan";

/** the bays' middles along the nave, and the piers between them (world z: the set's moved by nave.tsx's DZ) */
export const NAVE_DZ = 1.3;
export const BAY_Z = [-6.75, -2.25, 2.25, 6.75].map((z) => z + NAVE_DZ);
/** toward the sun: low (25 degrees), from the left (the west) and a little behind us, so that one aisle window's light,
 *  the second bay's, under the arcade and across the nave, lands on the choir screen's middle: a lancet of amber laid
 *  over the door the cursor is going to, its lattice and its border in it, and the floor before it */
const SUN: V3 = (() => { const v: V3 = [-0.85, 0.425, 0.29]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; })();
/** a low sun's colour */
const SUN_RGB: V3 = [1.0, 0.53, 0.22];

const WGSL = /* wgsl */ `
const PI: f32 = 3.14159265;
const DZ: f32 = ${NAVE_DZ.toFixed(3)};
const RZ: f32 = 3.2;

// inside a pointed (equilateral) arch: |u| within half its span w, from base up, its arcs springing at y0
fn inArch(u: f32, y: f32, w: f32, base: f32, y0: f32) -> bool {
  if (abs(u) > w || y < base) { return false; }
  if (y <= y0) { return true; }
  let r = 2.0 * w;
  return length(vec2<f32>(u + w, y - y0)) < r && length(vec2<f32>(u - w, y - y0)) < r;
}
// the same, softly: how far inside it (0 out, 1 more than e in), so a pool's edge has the sun's own penumbra
fn archSoft(u: f32, y: f32, w: f32, base: f32, y0: f32, e: f32) -> f32 {
  var k = smoothstep(0.0, e, w - abs(u)) * smoothstep(0.0, e, y - base);
  if (y > y0) { let r = 2.0 * w; k *= smoothstep(0.0, e, r - max(length(vec2<f32>(u + w, y - y0)), length(vec2<f32>(u - w, y - y0)))); }
  return k;
}
fn bayOf(z: f32) -> i32 { return clamp(i32(round((z - DZ + 6.75) / 4.5)), 0, 3); }
fn bayK(i: i32) -> f32 { let b = u_bays(); if (i == 0) { return b.x; } if (i == 1) { return b.y; } if (i == 2) { return b.z; } return b.w; }
fn bayMid(i: i32) -> f32 { return -6.75 + 4.5 * f32(i) + DZ; }
fn h21(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }

// the light through quarry glass at (u across, v up) of a lancet w wide: pale diamond quarries in their lead, a few of
// them gold, and a border of ruby and blue
fn glass(u: f32, v: f32, w: f32) -> vec3<f32> {
  let uu = u / (2.0 * w) + 0.5;
  if (uu < 0.09 || uu > 0.91) {
    let k = floor(v / 0.22);
    let lead = smoothstep(0.0, 0.03, abs(fract(v / 0.22) - 0.5) - 0.44);
    let c = select(vec3<f32>(0.25, 0.42, 1.0), vec3<f32>(1.0, 0.16, 0.08), (i32(k) % 2) == 0);
    return c * (1.0 - 0.8 * lead);
  }
  let g1 = (uu + v / (2.0 * w)) * 6.0; let g2 = (uu - v / (2.0 * w)) * 6.0;
  let lead = max(1.0 - smoothstep(0.02, 0.06, abs(fract(g1) - 0.5) * -1.0 + 0.5), 1.0 - smoothstep(0.02, 0.06, abs(fract(g2) - 0.5) * -1.0 + 0.5));
  let hs = h21(vec2<f32>(floor(g1), floor(g2)));
  let c = select(vec3<f32>(1.0, 0.95, 0.82), vec3<f32>(1.0, 0.78, 0.3), hs < 0.14);
  return c * (1.0 - 0.85 * lead);
}

// the sun's light reaching p (rgb, 0 where it is shut out), through the clerestory over the nave or the aisle's windows
fn sunAt(p: vec3<f32>) -> vec3<f32> {
  let L = u_sun().xyz;
  var out = vec3<f32>(0.0);
  // (the choir screen across the nave shuts out what comes over it from beyond: a wall 5.4 m high at z -RZ)
  let sScreen = select(1e5, (-RZ - p.z) / L.z, p.z > -RZ && L.z < 0.0);
  // the clerestory: its lancets two to a bay, 0.86 wide, from 10.95 m, springing at 12.3, in a wall 0.9 thick
  if (p.x > -2.75) {
    let s0 = (-2.75 - p.x) / L.x; let s1 = (-3.65 - p.x) / L.x;
    let a = p + L * s0; let b = p + L * s1;
    let i = bayOf(a.z);
    for (var k = 0; k < 2; k++) {
      let zc = bayMid(i) + select(-0.62, 0.62, k == 1);
      if (inArch(a.z - zc, a.y, 0.43, 10.95, 12.3) && inArch(b.z - zc, b.y, 0.43, 10.95, 12.3)) {
        let blocked = sScreen < s0 && abs((p + L * sScreen).x) < 3.2 && (p + L * sScreen).y < 5.4;
        if (!blocked) { out += glass(a.z - zc, a.y - 10.95, 0.43) * bayK(i); }
      }
    }
  }
  // the aisle's windows, one to a bay, 1.2 wide from 2.7 m, springing at 5.0 (splayed: wider on the inside), and on
  // into the nave under the arcade's arches (3.5 wide, springing at 5.5) between its piers
  let sA = (-6.0 - p.x) / L.x; let sB = (-6.6 - p.x) / L.x;
  let a = p + L * sA; let b = p + L * sB;
  let i = bayOf(b.z);
  let zc = bayMid(i);
  let soft = archSoft(b.z - zc, b.y, 0.6, 2.7, 5.0, 0.05);
  if (inArch(a.z - zc, a.y, 0.75, 2.6, 5.0) && soft > 0.0) {
    var ok = true;
    if (p.x > -3.2) {
      let sC = (-3.2 - p.x) / L.x; let c = p + L * sC;
      let j = bayOf(c.z);
      ok = inArch(c.z - bayMid(j), c.y, 1.75, 0.0, 5.5) && abs(c.z - bayMid(j)) < 1.45;
      if (sScreen < sC && abs((p + L * sScreen).x) < 3.2 && (p + L * sScreen).y < 5.4) { ok = false; }
    }
    if (ok) { out += glass(b.z - zc, b.y - 2.7, 0.6) * bayK(i) * soft; }
  }
  return out;
}

fn hash3(p: vec3<f32>) -> f32 { return fract(sin(dot(p, vec3<f32>(127.1, 311.7, 74.7))) * 43758.5453); }
fn vnoise(p: vec3<f32>) -> f32 {
  let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3<f32>(1.0, 0.0, 0.0)), u.x), mix(hash3(i + vec3<f32>(0.0, 1.0, 0.0)), hash3(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(hash3(i + vec3<f32>(0.0, 0.0, 1.0)), hash3(i + vec3<f32>(1.0, 0.0, 1.0)), u.x), mix(hash3(i + vec3<f32>(0.0, 1.0, 1.0)), hash3(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}
// the haze: the candles' smoke and the incense, thicker up under the vault, drifting up in slow folds
fn haze(p: vec3<f32>, t: f32) -> f32 {
  let q = p * 0.55 + vec3<f32>(0.0, -t * 0.12, t * 0.03);
  let n = 0.6 * vnoise(q) + 0.4 * vnoise(q * 2.3 + 7.0);
  return (0.55 + 0.45 * smoothstep(1.0, 12.0, p.y)) * (0.35 + 1.3 * n * n);
}
fn hg(c: f32, g: f32) -> f32 { let d = 1.0 + g * g - 2.0 * g * c; return (1.0 - g * g) / (4.0 * PI * d * sqrt(d)); }

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let c = frame(in.uv);
  let P = u_p();
  if (P.w <= 0.0) { return c; }
  let eye = u_eye(); let fw = u_fwd();
  let ndc = vec2<f32>(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let dir = normalize(fw.xyz + u_right().xyz * ndc.x * eye.w * fw.w + u_up().xyz * ndc.y * eye.w);
  let d = depth(in.uv);
  let along = max(dot(dir, fw.xyz), 1e-3);
  let tEnd = select(60.0, min(d / along, 60.0), d > 0.0);
  let L = u_sun().xyz;
  let sunc = u_sunc().rgb * P.w;
  // the surface: the glass's pools on what faces the sun, and the glass itself where it is seen
  var col = c.rgb;
  if (d > 0.0) {
    let ps = eye.xyz + dir * tEnd;
    let n = normal(in.uv);
    let lam = max(dot(n, L), 0.0);
    if (lam > 0.0) {
      let lum = max(max(c.r, c.g), max(c.b, 1e-4));
      let alb = mix(vec3<f32>(0.5, 0.45, 0.38), c.rgb / lum * 0.5, 0.35);
      col += alb * sunAt(ps + n * 0.03) * lam * sunc * P.y;
    }
    // (seen through: the lancet's own glass, the sun behind it)
    let onClere = abs(ps.x + 3.3) < 0.2 && ps.y > 10.9;
    let onAisle = abs(ps.x + 6.48) < 0.2 && ps.y > 2.6 && ps.y < 6.1;
    if (onClere || onAisle) {
      let i = bayOf(ps.z);
      if (onAisle && inArch(ps.z - bayMid(i), ps.y, 0.6, 2.7, 5.0)) { col += glass(ps.z - bayMid(i), ps.y - 2.7, 0.6) * bayK(i) * sunc * P.y * 0.9; }
      for (var k = 0; k < 2; k++) {
        let zc = bayMid(i) + select(-0.62, 0.62, k == 1);
        if (onClere && inArch(ps.z - zc, ps.y, 0.43, 10.95, 12.3)) { col += glass(ps.z - zc, ps.y - 10.95, 0.43) * bayK(i) * sunc * P.y * 0.9; }
      }
    }
  }
  // the shafts: in-scattered sun along the line of sight through the haze, in the nave and its aisles
  let ph = hg(dot(dir, L), 0.55) * 4.0 * PI * 0.6 + 0.4;
  let jit = fract(52.9829189 * fract(0.06711056 * in.position.x + 0.00583715 * in.position.y + 0.37 * P.x));
  let N = 64;
  let span = min(tEnd, 40.0);
  let h = span / f32(N);
  var T = 1.0;
  var S = vec3<f32>(0.0);
  for (var k = 0; k < N; k++) {
    let t = (f32(k) + jit) * h;
    let p = eye.xyz + dir * t;
    if (abs(p.x) > 6.6 || p.y < 0.0 || p.y > 14.3) { continue; }
    let sig = u_sunc().w * haze(p, P.x);
    let li = sunAt(p);
    S += T * sig * h * li * sunc * ph * P.z;
    T *= exp(-sig * h * 0.3);
  }
  return vec4<f32>(col * T + S, c.a);
}`;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The sunset through the cathedral's windows, `on` (0..1) overall, each bay's windows at `bays` (0..1, by BAY_Z), seen
 *  by `cam`, at the second `t` (its haze drifts) */
export function NaveSun({ cam, t, on, bays }: { cam: { eye: V3; look: V3; fov: number }; t: number; on: number; bays: number[] }) {
  const fw = norm(sub(cam.look, cam.eye)), right = norm(cross(fw, [0, 1, 0])), up = cross(right, fw);
  return (
    <FramePass wgsl={WGSL} at="before-tonemap" prepass
      uniforms={{
        eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...fw, W / H], right: [...right, 0], up: [...up, 0],
        sun: [...SUN, 0], sunc: [...SUN_RGB, 0.035], bays: [bays[0], bays[1], bays[2], bays[3]],
        // (the second, the pools' strength, the shafts', and how far the sun is out)
        p: [t, 7, 2.5, on],
      }} />
  );
}
