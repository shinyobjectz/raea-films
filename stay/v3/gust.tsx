// The canyon's gust (the director, 11-11: "add the dust and wind effects to the canyon like we did for the release ui concept
// should be similar and maybe we dont even need as much"). The release's canyon film (internal releases/0.1.1
// src/dust.tsx, canyon-motion.ts) stands in this same slot (its set is a snapshot of sets/canyon.tsx), so its sand is
// this film's too: the gust simulated in Mantaflow over a 0.1 m grid of the slot with its walls and rocks as obstacles
// (releases/0.1.1/src/dust-sim), baked a frame a layer into media/dust/sim/dNNN.png, and raymarched here over the lit
// frame before the tone mapper. On the drop the wind comes down the slot from the mouth behind us: the sand lifts and
// runs on ahead of the lens into the sun, the grass and shrubs lean, and the tumbleweed the cursor clicked is taken and
// bounds away down the slot. Less of it than the release's (its density at DENSITY).
//
// A layer of the texture array is one frame of the sim: its 46 height slices, 8 across and 6 down, each 62 texels across
// the slot by 234 along it (plus a one-texel border). R is the dust's density, G the sun reaching the cell past the
// canyon, B the dust's own depth toward the sun (/ 4), all sRGB-encoded (read back linear). The march runs in the set's
// unturned frame (sets/canyon.tsx spot() turns it by TURN): frame * transmittance + in-scattered light, the sun through a
// two-lobe Henyey-Greenstein phase (dust scatters forward: looking down the slot toward the sun it glows), shadowed by
// the walls (G) and by the dust itself (B), plus the slot's bounce light; noise carried down the slot with the wind
// erodes its edges to the detail the grid can't hold.
import { staticFile } from "raea";
import { FramePass } from "raea/3d";
import type { V3 } from "../v2/math";
import { H, W } from "./plan";

/** the sim's frames (its own numbering: the gust comes on at its frame 198), as many as the shot reaches */
export const FIRST = 198, LAST = 335;
const LAYERS = Array.from({ length: LAST - FIRST + 1 }, (_, i) => staticFile(`dust/sim/d${FIRST + i}.png`));
/** how much of the release's dust */
const DENSITY = 0.3;
/** how much of its light (the slot is lit from the far end, and the sand nearest the lens glowed white) */
const GAIN = 0.7;
/** the dust nearer the lens than this fades out (metres): sand running along the floor ahead, not a cloud in our face */
const NEAR: [number, number] = [1.2, 3.5];
const sstep = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
/** the wind the sim was blown by: up fast at its frame 198, dying away from 262 (releases/0.1.1/src/canyon-motion.ts) */
const blow = (f: number) => sstep(FIRST, FIRST + 14, f) * (1 - sstep(262, 292, f));
const gusty = (f: number) => 1 + 0.3 * Math.sin(0.21 * f) + 0.15 * Math.sin(0.57 * f + 1);
/** the wind's speed at the mouth, m/s */
const U = 8;
// how far the air has carried the dust's fine detail by sim frame f (metres down the slot)
const TRAVEL: number[] = (() => {
  const out: number[] = [];
  let d = 0;
  for (let f = 0; f <= LAST + 1; f++) { out.push(d); d += (U * blow(f) * (0.85 + 0.15 * gusty(f)) + 0.35) / 30; }
  return out;
})();

/** the gust `s` seconds after it comes (before it, none): the sim's frame, how hard it blows (0..1), and how far the
 *  plants lean ("sway" clip, 0 upright .. 1 leant down the slot) */
export function gustAt(s: number) {
  const f = FIRST + s * 30;
  const b = s < 0 ? 0 : blow(f);
  return { on: s >= 0, f, blow: b, sway: b * (0.6 + 0.25 * Math.sin(f * 0.21) + 0.15 * Math.sin(f * 0.57 + 1)) };
}

/** the tumbleweed taken by the gust `s` seconds in, from where it lay (unturned x, z): it rolls off, gathers speed and
 *  bounds away down the slot, bearing right of the boulder in the middle onto the release's line (its radius WEED_R) */
export const WEED_R = 0.29;
const HOP = 2.4;
export function weedRun(s: number, x0: number, z0: number) {
  const t = Math.max(0, s - 4 / 30);
  // (from rest up to 5.5 m/s in 0.45 s, held to 1.6 s, then settling to 3)
  const a = 0.45, v = 5.5;
  const d = t < a ? (v * t * t) / (2 * a) : (v * a) / 2 + v * (Math.min(t, 1.6) - a) + Math.max(0, t - 1.6) * 3 - (t > 1.6 ? 2.5 * (1 - Math.exp(-(t - 1.6))) * 0.24 : 0);
  const x = x0 + (0.95 - x0) * sstep(0, 3.2, d) + 0.18 * Math.sin(d * 0.7) * sstep(0, 1.5, d);
  const hop = Math.abs(Math.sin((Math.PI * d) / HOP)) * (0.22 + 0.25 * Math.exp(-t * 0.8)) * sstep(0, 0.6, d);
  return { x, z: z0 - d, hop, d, roll: (d / (2 * Math.PI * WEED_R)) % 1 };
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linHex = (hex: string): V3 => [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)) as V3;

const WGSL = /* wgsl */ `
const X0: f32 = -2.8;
const Y0: f32 = -0.1;
const ZT: f32 = 9.4;
const CELL: f32 = 0.1;
const NX: f32 = 62.0;
const NY: f32 = 234.0;
const NZ: f32 = 46.0;
const TW: f32 = 64.0;
const TH: f32 = 236.0;
const AW: f32 = 512.0;
const AH: f32 = 1416.0;
const TAU_MAX: f32 = 4.0;
const PI: f32 = 3.14159265;

fn slice(s: i32, ci: f32, cj: f32, layer: i32) -> vec3<f32> {
  let col = f32(s % 8);
  let row = f32(s / 8);
  let uv = vec2<f32>((col * TW + 1.5 + ci) / AW, (row * TH + 1.5 + cj) / AH);
  return textureSampleLevel(tex_dust, samp_dust, uv, layer, 0.0).rgb;
}
fn grid(p: vec3<f32>, layer: i32) -> vec3<f32> {
  let ci = clamp((p.x - X0) / CELL - 0.5, 0.0, NX - 1.0);
  let cj = clamp((ZT - p.z) / CELL - 0.5, 0.0, NY - 1.0);
  let ck = clamp((p.y - Y0) / CELL - 0.5, 0.0, NZ - 1.0);
  let k0 = floor(ck);
  let a = slice(i32(k0), ci, cj, layer);
  let b = slice(min(i32(k0) + 1, 45), ci, cj, layer);
  return mix(a, b, ck - k0);
}
fn hash3(p: vec3<i32>) -> f32 {
  var x = (bitcast<u32>(p.x) * 1597334677u) ^ (bitcast<u32>(p.y) * 3812015801u) ^ (bitcast<u32>(p.z) * 2798796415u);
  x = (x ^ (x >> 16u)) * 2246822519u;
  x = (x ^ (x >> 13u)) * 3266489917u;
  x = x ^ (x >> 16u);
  return f32(x) * (1.0 / 4294967295.0);
}
fn vnoise(p: vec3<f32>) -> f32 {
  let i = vec3<i32>(floor(p));
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let x00 = mix(hash3(i), hash3(i + vec3<i32>(1, 0, 0)), u.x);
  let x10 = mix(hash3(i + vec3<i32>(0, 1, 0)), hash3(i + vec3<i32>(1, 1, 0)), u.x);
  let x01 = mix(hash3(i + vec3<i32>(0, 0, 1)), hash3(i + vec3<i32>(1, 0, 1)), u.x);
  let x11 = mix(hash3(i + vec3<i32>(0, 1, 1)), hash3(i + vec3<i32>(1, 1, 1)), u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}
// wisps: noise warped by noise, stretched down the slot the way the wind draws it out
fn wisps(p: vec3<f32>) -> f32 {
  let q = p * vec3<f32>(1.0, 1.0, 0.45);
  let w = vec3<f32>(vnoise(q * 1.7 + vec3<f32>(3.1, 0.0, 0.0)), vnoise(q * 1.7 + vec3<f32>(0.0, 7.3, 0.0)), vnoise(q * 1.7 + vec3<f32>(0.0, 0.0, 5.9))) - 0.5;
  let r = q + w * 0.9;
  return 0.55 * vnoise(r) + 0.3 * vnoise(r * 2.3 + 11.0) + 0.15 * vnoise(r * 5.1 + 23.0);
}
fn hg(c: f32, g: f32) -> f32 {
  let d = 1.0 + g * g - 2.0 * g * c;
  return (1.0 - g * g) / (4.0 * PI * d * sqrt(d));
}
fn into_box(o: vec3<f32>, d: vec3<f32>) -> vec2<f32> {
  let lo = vec3<f32>(X0, Y0, ZT - NY * CELL);
  let hi = vec3<f32>(X0 + NX * CELL, Y0 + NZ * CELL, ZT);
  let dd = select(d, vec3<f32>(1e-6), abs(d) < vec3<f32>(1e-6));
  let a = (lo - o) / dd;
  let b = (hi - o) / dd;
  let n = min(a, b);
  let x = max(a, b);
  return vec2<f32>(max(max(n.x, n.y), n.z), min(min(x.x, x.y), x.z));
}

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let c = frame(in.uv);
  let P = u_p();
  if (P.w <= 0.0) { return c; }
  let layer = i32(P.x);
  let eye = u_eye();
  let fw = u_fwd();
  let ndc = vec2<f32>(in.uv.x * 2.0 - 1.0, 1.0 - in.uv.y * 2.0);
  let dir = normalize(fw.xyz + u_right().xyz * ndc.x * eye.w * fw.w + u_up().xyz * ndc.y * eye.w);
  let span = into_box(eye.xyz, dir);
  let scene = depth(in.uv) / max(dot(dir, fw.xyz), 1e-3);
  let t0 = max(span.x, 0.0);
  let t1 = min(span.y, select(1e5, scene, scene > 0.0));
  if (t1 <= t0) { return c; }
  let L = u_sun().xyz;
  let sun = u_sunc().rgb;
  let amb = u_amb().rgb;
  let alb = u_alb().rgb;
  let cv = dot(dir, L);
  let ph = 0.8 * hg(cv, 0.7) + 0.2 * hg(cv, -0.2);
  // a jitter per pixel and frame (interleaved gradient noise), so the march's steps don't band
  let px = in.position.xy + vec2<f32>(5.588238 * P.x, 3.1 * P.x);
  let j = fract(52.9829189 * fract(0.06711056 * px.x + 0.00583715 * px.y));
  let carry = vec3<f32>(0.0, -0.18 * P.z, P.z);
  var T = 1.0;
  var S = vec3<f32>(0.0);
  var dt = 0.025;
  var t = t0 + dt * j;
  for (var i = 0; i < 200; i++) {
    if (t >= t1 || T < 0.004) { break; }
    let h = min(dt, t1 - t);
    let p = eye.xyz + dir * t;
    let g = grid(p, layer);
    if (g.r > 0.0004) {
      let n = wisps((p + carry) * 6.0);
      let rho = max(g.r * (0.25 + 1.5 * n) - 0.02 * (1.0 - n), 0.0) * P.w * smoothstep(u_near().x, u_near().y, t);
      let sig = rho * P.y;
      if (sig > 0.0) {
        let lit = g.g * exp(-P.y * g.b * TAU_MAX * P.w);
        let up = clamp((p.y - Y0) / 4.6, 0.0, 1.0);
        let Lin = sun * ph * lit + amb * (0.55 + 0.45 * up);
        let tr = exp(-sig * h);
        S += T * alb * Lin * (1.0 - tr);
        T *= tr;
      }
    }
    t += h;
    dt = min(dt * 1.035, 0.3);
  }
  return vec4<f32>(c.rgb * T + S, c.a);
}`;

/** The gust's dust over the frame, `s` seconds into the gust (before it, nothing), seen by a lens given unturned (the
 *  set's own frame), lit by a sun from `sunDir` (unturned, toward the sun) of `lux` and `color`, at the scene's exposure
 *  `ev` (ToneMapping's: Bevy's EV100 9.7 less it) */
export function Dust({ s, eye, look, fov, sunDir, lux, color, ev }: { s: number; eye: V3; look: V3; fov: number; sunDir: V3; lux: number; color: string; ev: number }) {
  const g = gustAt(s);
  const fw = norm(sub(look, eye)), right = norm(cross(fw, [0, 1, 0])), up = cross(right, fw);
  const expo = 2 ** -(9.7 - ev) / 1.2;
  const sc = linHex(color);
  const sunc = sc.map((x) => x * lux * expo * GAIN);
  // the slot's own light: the sunlit walls' bounce, warm, and a little sky from the strip overhead
  const wall = linHex("#ff9d6b"), sky = linHex("#9fbfff");
  const amb = [0, 1, 2].map((i) => (wall[i] * 0.035 * 0.6 + sky[i] * 0.012) * lux * expo * GAIN);
  const layer = Math.max(0, Math.min(LAST - FIRST, Math.round(g.f) - FIRST));
  const travel = TRAVEL[Math.max(0, Math.min(TRAVEL.length - 1, Math.round(g.f)))];
  return (
    <FramePass wgsl={WGSL} at="before-tonemap" prepass
      textures={{ dust: { layers: LAYERS, sampler: { filter: "linear", mipmap: "none", wrap: "clamp" } } }}
      uniforms={{
        eye: [...eye, Math.tan((fov * Math.PI) / 360)], fwd: [...fw, W / H], right: [...right, 0], up: [...up, 0],
        sun: [...norm(sunDir), 0], sunc: [...sunc, 0], amb: [...amb, 0], alb: [...linHex("#f0bf98"), 0],
        p: [layer, 5, travel, g.on ? DENSITY : 0], near: [...NEAR, 0, 0],
      }} />
  );
}
