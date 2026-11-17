// The clouds world (the shot "study", 2.83 s, on the song's drop), the fourth door's world. the director, 11-11: "maybe one
// could be ... a door in the clouds of a hyper realistic sky clouds, birds etc".
// The wreck's door opens on white: we come through it into the middle of a cloud, lit gold. On the drop the cursor
// clicks, and the cloud blows open from the click, a shell of it thrown out round a hole that grows till the whole bank
// is gone, and a flock of white doves bursts out of it with it, wings beating, climbing away toward the sun. What it
// leaves is the sky at evening: a sea of cloud tops to the horizon, lit low from the left, towers of cumulus standing
// out of it far off, and on the cloud in front of us a door in its frame and nothing else, painted blue. The cursor
// takes its knob and pulls; it swings out at us, and through it is the next world (the pixel world).
// The clouds are drawn by a pass that marches every pixel's line of sight through them (CLOUDS), stopping at whatever
// the scene has drawn there (the door, the doves, the cursor) or at the doorway, which shows the next world. The door
// and the dove are blender/components/sky/*.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, Environment, FramePass, Model, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import DOOR from "../media/models/sky/door.glb.json";
import { RZ } from "../sets/rooms";
import { clamp01, ramp, type V3 } from "../v2/math";
import type { Cam } from "./cam";
import { Hand3D, at, front, type Key } from "./hand3d";
import { Portal, goOut, viewOf, type View, shotOf, Doorway } from "./kit";
import { TAKE_KEYS } from "./takekeys";
import { FilmLook, type Look, Finish } from "./look";
import { H, W, type Shot } from "./plan";
import { DOOR_HOLD, ROOM_T } from "./times";

const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a: V3): V3 => scl(a, 1 / (len(a) || 1));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rnd = (i: number, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); };

// ---- where things stand ----------------------------------------------------------------------------------------
const NEXT = "greenhouse";                                            // (the pixel world)
const BACK = 6;                                                       // where we come in, through the wreck's door
/** the door's frame (Blender's, origin the threshold's middle) into the world's: its face toward us at z -RZ */
const D = (p: number[]): V3 => [p[0], p[2], -RZ - p[1]];
const NOTE = JSON.parse((DOOR as { notes: string }).notes) as { hinge: number[]; knob: number[]; opening: { half_width: number; sill: number; top: number } };
const HINGE = D(NOTE.hinge), KNOB = D(NOTE.knob), OPENING = NOTE.opening, OPEN_DEG = 100;
/** the sun's way (toward it): low, ahead on the left just out of the frame, so the clouds stand against it lit round
 *  their edges, and the door throws its shadow back through the mist at us */
const SUN: V3 = nrm([-0.75, 0.2, -0.6]);
/** the sun's light as the pass and the lights both have it: linear colour, and a white card facing it in the pass's
 *  units (lux / pi times the camera's exposure: Bevy's default EV100 9.7) */
const SUNC: V3 = [1.0, 0.66, 0.38], SUN_I = 4.0;
const LUX = SUN_I * Math.PI * 1.2 * 2 ** 9.7;

const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const leafYaw = (open: number) => (-OPEN_DEG * Math.PI) / 180 * open;
const knobAt = (open: number): V3 => add(HINGE, rotY(sub(KNOB, HINGE), leafYaw(open)));
const openAt = (T: { door: number }, t: number) => jerk(ramp(t, T.door + 0.03, T.door + 0.8));

// ---- the doves ------------------------------------------------------------------------------------------------------
const DOVES = 34;
/** the flock in the cloud before the click: ahead of where the cursor clicks, out of sight in the bank */
const NEST: V3 = [0.15, 1.5, 3.4];
/** where the flock makes for: up and away to the left, toward the sun */
const AWAY: V3 = nrm([-0.75, 0.42, -0.5]);
type Dove = { p: V3; v: V3 };
const DOVE_KEPT = new Map<number, { t: number; d: Dove[] }>();
function doveStart(i: number, cl: V3): Dove {
  const p = add(NEST, [(rnd(i, 1) - 0.5) * 3.2, (rnd(i, 2) - 0.4) * 1.6, (rnd(i, 3) - 0.5) * 2.6]);
  let d = nrm(add(sub(p, cl), [0, 0.6, -0.4]));
  if (d[2] > -0.15) d = nrm([d[0] * 1.2, d[1], -0.15 - 0.3 * rnd(i, 4)]);              // (none flies back at the lens)
  return { p, v: scl(d, 6.5 + 3 * rnd(i, 5)) };
}
/** every dove at t (seconds since the click): thrown out of the cloud, slowing to a beating cruise, all turning to AWAY;
 *  stepped at 240 Hz from the click (kept, so a render running forward steps a frame at a time) */
function flock(dt: number, cl: V3): Dove[] {
  const key = Math.round(cl[2] * 1000);
  let k = DOVE_KEPT.get(key);
  if (!k || k.t > dt + 1e-6) k = { t: 0, d: Array.from({ length: DOVES }, (_, i) => doveStart(i, cl)) };
  const h = 1 / 240;
  let now = k.t;
  const d = k.d.map((x) => ({ p: [...x.p] as V3, v: [...x.v] as V3 }));
  while (now < dt - 1e-9) {
    const s = Math.min(h, dt - now);
    d.forEach((b, i) => {
      const cruise = 4.6 + 1.2 * rnd(i, 6);
      const want = scl(nrm(add(AWAY, [(rnd(i, 7) - 0.5) * 0.5, (rnd(i, 8) - 0.5) * 0.3, (rnd(i, 9) - 0.5) * 0.4])), cruise);
      const turn = 1.4 + 1.2 * rnd(i, 10);                              // (how hard each one steers to the rest)
      b.v = add(b.v, scl(sub(want, b.v), turn * s));
      b.p = add(b.p, scl(b.v, s));
    });
    now += s;
  }
  DOVE_KEPT.set(key, { t: now, d });
  return d;
}
/** a rotation (raea's Euler XYZ, R = Rx Ry Rz) that points a bird's nose (+x) along v, its back up, banked `roll` */
function aim(v: V3, roll: number): V3 {
  const f = nrm(v), side0 = cross([0, 1, 0], f);
  const s = len(side0) > 1e-4 ? nrm(side0) : ([0, 0, 1] as V3);       // (its right wing's way, -z when it flies +x)
  const up0 = cross(f, s);
  const c = Math.cos(roll), q = Math.sin(roll);
  const up = add(scl(up0, c), scl(s, -q)), right = cross(f, up);
  // the columns: where the bird's x (nose), y (back) and z go
  const R = [[f[0], up[0], right[0]], [f[1], up[1], right[1]], [f[2], up[2], right[2]]];
  const b = Math.asin(Math.max(-1, Math.min(1, R[0][2])));
  const a = Math.atan2(-R[1][2], R[2][2]);
  const cc = Math.atan2(-R[0][1], R[0][0]);
  return [a, b, cc];
}

// ---- the keys -----------------------------------------------------------------------------------------------------
function cloudKeys(s: Shot, t: number) {
  const T = ROOM_T.study as { click: number; door: number };
  const L = s.seconds;
  const open = openAt(T, t);
  const CLICK: V3 = [0.12, 1.22, BACK - 1.05];
  const knob = () => knobAt(open);
  const keys: Key[] = [
    { t: T.click, p: at(CLICK), click: true, seen: "click in the cloud, and it blows open", margin: 0.1 },
    { t: T.door, p: front(knob, 0.02), press: true, seen: "take the door's knob and pull it open" },
    { t: T.door + DOOR_HOLD, p: front(knob, 0.02) },
    ...goOut(L),
  ];
  return { T, L, open, CLICK, keys };
}
TAKE_KEYS.study = (t: number) => cloudKeys(shotOf("study"), t).keys;
export const cloudView = (s: Shot, t: number): View => viewOf(s, t);

// ---- the sky and its clouds -----------------------------------------------------------------------------------------
const CLOUDS = /* wgsl */ `
fn h3(p: vec3<f32>) -> f32 { var q = fract(p * 0.1031); q += dot(q, q.zyx + 31.32); return fract((q.x + q.y) * q.z); }
fn h2(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn n3(p: vec3<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3<f32>(1.0, 0.0, 0.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 0.0)), h3(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(h3(i + vec3<f32>(0.0, 0.0, 1.0)), h3(i + vec3<f32>(1.0, 0.0, 1.0)), u.x), mix(h3(i + vec3<f32>(0.0, 1.0, 1.0)), h3(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y), u.z); }
fn n2(p: vec2<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2<f32>(1.0, 0.0)), u.x), mix(h2(i + vec2<f32>(0.0, 1.0)), h2(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
fn fbm2(p0: vec2<f32>) -> f32 { var p = p0; var a = 0.5; var s = 0.0;
  for (var i = 0; i < 5; i++) { s += a * n2(p); p = mat2x2<f32>(1.6, 1.2, -1.2, 1.6) * p + vec2<f32>(3.1, 1.7); a *= 0.5; } return s / 0.97; }
fn fbm3(p0: vec3<f32>, oct: i32) -> f32 { var p = p0; var a = 0.5; var s = 0.0; var w = 0.0;
  for (var i = 0; i < oct; i++) { s += a * n3(p); w += a; p = mat3x3<f32>(0.0, 0.8, 0.6, -0.8, 0.36, -0.48, -0.6, -0.48, 0.64) * p * 2.03 + vec3<f32>(1.7, 9.2, 3.3); a *= 0.5; }
  return s / w; }

// we stand on the top of a cumulus head, soft and misty underfoot, a little rise under the door; its sides fall away
// in billows thirty metres off to the sea of cloud sixty metres down, whose tops roll in lumps a hundred metres across
// to the horizon
const MC = vec2<f32>(0.0, 3.0);
fn deckTop(xz: vec2<f32>) -> f32 {
  let far = -58.0 + 34.0 * (fbm2(xz * 0.0035 + vec2<f32>(3.1, 7.2)) - 0.47) + 11.0 * (fbm2(xz * 0.015 + vec2<f32>(9.0, 1.0)) - 0.5);
  let dz = xz.y + ${RZ.toFixed(3)};
  let local = -0.6 + 1.5 * (fbm2(xz * 0.16 + vec2<f32>(2.0, 5.0)) - 0.5) + 1.2 * exp(-(xz.x * xz.x + dz * dz) / 7.0);
  let r = length(xz - MC) + 8.0 * (fbm2(xz * 0.045 + vec2<f32>(4.0, 2.0)) - 0.5);
  return mix(local, far, pow(smoothstep(8.5, 34.0, r), 0.75));
}
fn deck(p: vec3<f32>, t: f32) -> f32 {
  let h = deckTop(p.xz) - p.y;
  if (h < -7.0) { return 0.0; }
  let w = vec3<f32>(u_sun().w * 0.25, 0.0, u_sun().w * 0.08);
  let near = fbm3(p * 0.12 + w * 0.12, 3) - 0.5 + (fbm3(p * 0.42 + w, 2) - 0.5) * 0.3;
  let far = fbm3(p * 0.028 + w * 0.03, 4) - 0.5;
  let n = mix(near, far, smoothstep(60.0, 260.0, t));
  let firm = mix(0.75, 0.4, smoothstep(8.0, 30.0, length(p.xz - MC)));         // (the mist underfoot thickens below its top)
  var d = clamp(h * firm + n * 2.8, 0.0, 1.0);
  // the mist the door stands in, lying round its foot and creeping a little way up it
  let dz = p.z + ${RZ.toFixed(3)};
  let r2 = p.x * p.x * 0.6 + dz * dz;
  if (r2 < 9.0) {
    let m = fbm3(p * vec3<f32>(1.1, 2.2, 1.1) + vec3<f32>(u_sun().w * 0.2, 0.0, 0.0), 3) - 0.5;
    d = max(d, clamp((0.28 - p.y) * 2.2 + m * 1.6, 0.0, 1.0) * exp(-r2 / 2.2));
  }
  return d;
}
// the towers of cumulus far off: x, z, radius, height
fn tower(p: vec3<f32>, c: vec4<f32>) -> f32 {
  let y = (p.y + 62.0) / c.w;
  if (y < -0.05 || y > 1.15) { return 0.0; }
  let q = (p.xz - c.xy) / c.z;
  let r = 1.0 - 0.5 * y * y;
  let k = 1.0 - length(q) / r;
  if (k < -0.6) { return 0.0; }
  let n = fbm3(p / (c.z * 0.3), 4) - 0.5;
  let cap = smoothstep(1.02, 0.8, y + n * 0.3);
  return clamp((k + n * 1.4) * 2.4, 0.0, 1.0) * cap;
}
// the bank we come in through, and the click blowing it open: a hole growing from the click, its edge torn by the
// noise, the cloud it throws out heaped in a shell at its edge, thinning as it goes
fn bank(p: vec3<f32>) -> f32 {
  let c = vec3<f32>(0.0, 1.4, ${(BACK + 1.6).toFixed(2)});
  let q = (p - c) / vec3<f32>(6.5, 3.2, 4.4);
  let n = fbm3(p * 0.5 + vec3<f32>(0.0, u_sun().w * 0.1, 0.0), 3) - 0.5;
  var d = 1.0 - length(q) + n * 1.5;
  let dt = u_sun().w - u_click().w;
  if (dt > 0.0) {
    let R = 13.0 * (1.0 - exp(-2.3 * dt));
    let r = length(p - u_click().xyz) + (fbm3(p * 0.28, 3) - 0.5) * 3.4 * min(1.0, dt * 2.5);
    let shell = exp(-pow((r - R) / (0.45 + 0.12 * R), 2.0)) * 0.95 * exp(-dt * 1.3);
    d = d * smoothstep(R - 0.8, R + 1.6, r) + shell * smoothstep(-0.7, 0.2, d);
  }
  return clamp(d * 1.2, 0.0, 1.0);
}
const T1 = vec4<f32>(-460.0, -1350.0, 270.0, 950.0);
const T2 = vec4<f32>(700.0, -1750.0, 360.0, 620.0);
const T3 = vec4<f32>(-1700.0, -2700.0, 520.0, 1250.0);
const T4 = vec4<f32>(230.0, -880.0, 140.0, 300.0);
const T5 = vec4<f32>(-150.0, -310.0, 55.0, 95.0);
const T6 = vec4<f32>(280.0, -450.0, 75.0, 120.0);
fn dens(p: vec3<f32>, t: f32) -> f32 {
  var d = deck(p, t);
  if (t < 40.0) { d = max(d, bank(p)); }
  if (t > 120.0) { d = max(d, max(tower(p, T5), tower(p, T6))); }
  if (t > 500.0) { d = max(d, max(max(tower(p, T1), tower(p, T2)), max(tower(p, T3), tower(p, T4)))); }
  return d;
}
// thicker near, thinner far: what a step can resolve (the far towers' edges soften over metres, not centimetres)
fn sig(t: f32) -> f32 { return 1.5 / (1.0 + t / 30.0); }
fn sunOD(p: vec3<f32>, t: f32, sun: vec3<f32>) -> f32 {
  var od = 0.0;
  // the door's shadow: its frame stands between the mist before it and the sun
  let sh = (-${RZ.toFixed(3)} - p.z) / sun.z;
  if (sh > 0.0 && t < 40.0) { let k = p + sun * sh; if (abs(k.x) < 0.6 && k.y > -0.1 && k.y < 2.3) { od += 7.0; } } var s = 0.3 * (1.0 + t * 0.03); var q = p;
  for (var i = 0; i < 5; i++) { q += sun * s; od += dens(q, t + s) * s * sig(t); s *= 2.0; }
  return od;
}
fn hg(c: f32, g: f32) -> f32 { return (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * c, 1.5); }
fn sky(rd: vec3<f32>, sun: vec3<f32>) -> vec3<f32> {
  let y = clamp(rd.y + 0.02, 0.0, 1.0);
  let zen = vec3<f32>(0.03, 0.2, 0.52) * 1.6;
  let hor = vec3<f32>(1.0, 0.66, 0.4) * 2.5;
  var c = zen + (hor - zen) * exp(-y * 7.0) + vec3<f32>(0.25, 0.12, 0.05) * exp(-y * 2.2);
  let s = max(dot(rd, sun), 0.0);
  c += u_sunc().xyz * (pow(s, 14.0) * 0.8 + pow(s, 90.0) * 2.5);
  return c * u_lv().x;
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  let tn = u_eye().w; let asp = u_fwd().w;
  let fwd = u_fwd().xyz;
  let rd = normalize(fwd + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
  let eye = u_eye().xyz;
  let sun = normalize(u_sun().xyz);
  let d = depth(uv);
  let hit = d > 0.0 && d < 1000.0;
  var tmax = 5000.0;
  if (hit) { tmax = d / max(dot(rd, fwd), 0.05); }
  // the doorway: what is seen through it is the next world's, drawn there already; the march stops at it
  var base = select(sky(rd, sun), c0.rgb, hit);
  let tp = (u_door().z - eye.z) / rd.z;
  let pp = eye + rd * tp;
  if (tp > 0.0 && abs(pp.x - u_door().x) < u_door().w && abs(pp.y - u_doorh().x) < u_doorh().y && (!hit || tmax > tp - 0.02)) {
    tmax = tp; base = c0.rgb;
  }
  let cosT = dot(rd, sun);
  let ph = mix(hg(cosT, -0.15), hg(cosT, 0.7), 0.5);
  let ph2 = mix(hg(cosT, -0.1), hg(cosT, 0.35), 0.5);
  let sunC = u_sunc().xyz * u_sunc().w;
  // (a small jitter, smooth from pixel to pixel: a full step's of white noise set the clouds' thin edges fizzing, and none
  // leaves them in terraces)
  let px = uv * vec2<f32>(${W}.0, ${H}.0);
  let jit = fract(52.9829189 * fract(dot(px, vec2<f32>(0.06711056, 0.00583715))));
  var T = 1.0; var L = vec3<f32>(0.0);
  var t = 0.05;
  for (var i = 0; i < 520; i++) {
    if (t > tmax || T < 0.006) { break; }
    let p = eye + rd * t;
    if (p.y > 1400.0 && rd.y > 0.0) { break; }
    var dt = min(select(clamp(t * 0.018, 0.05, 1.2), min(t * 0.08, 160.0), t > 60.0), tmax - t + 0.001);
    var dd = dens(p + rd * dt * (jit - 0.5) * 0.7, t);
    if (dd > 0.003 && t < 25.0) { dt = dt * 0.5; }                     // (finer steps inside the near cloud, where its edges are)
    let q = p + rd * dt * (jit - 0.5) * 0.7;
    if (t < 25.0) { dd = dens(q, t); }
    if (dd > 0.003) {
      let od = sunOD(q, t, sun);
      let up = smoothstep(-8.0, 3.0, q.y - deckTop(q.xz)) * 0.6 + 0.4 * clamp(q.y / 900.0, 0.0, 1.0);
      let amb = mix(vec3<f32>(0.12, 0.14, 0.2), vec3<f32>(0.2, 0.3, 0.55), up) * u_lv().y;
      var lum = sunC * (exp(-od) * ph + 0.28 * exp(-od * 0.25) * ph2 + 0.09 * exp(-od * 0.08)) + amb;
      lum = mix(lum, sky(normalize(vec3<f32>(rd.x, max(rd.y, 0.0) * 0.4, rd.z)), sun), 1.0 - exp(-t / 2800.0));
      let tr = exp(-dd * sig(t) * dt);
      L += T * lum * (1.0 - tr);
      T *= tr;
    }
    t += dt;
  }
  return vec4<f32>(base * T + L, c0.a);
}`;
function Clouds({ cam, t, click, door }: { cam: Cam; t: number; click: { at: V3; t: number }; door: { center: V3; half: [number, number] } }) {
  const f = nrm(sub(cam.look, cam.eye)), r = nrm([-f[2], 0, f[0]]);
  const u: V3 = cross(r, f);
  return (
    <FramePass wgsl={CLOUDS} prepass at="before-tonemap" uniforms={{
      eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...f, W / H], right: [...r, 0], up: [...u, 0],
      sun: [...SUN, t], sunc: [...SUNC, SUN_I], lv: [1.0, 1.0, 0, 0], click: [...click.at, click.t],
      door: [door.center[0], 0, door.center[2], door.half[0]], doorh: [door.center[1], door.half[1], 0, 0],
    }} />
  );
}

export function CloudsWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, open, CLICK } = cloudKeys(s, t);
  const { hand, cam: c } = v;
  const abs = s.from + t;
  const yaw = leafYaw(open);
  const dt = t - T.click;
  const birds = dt > 0 ? flock(dt, CLICK) : null;
  const center: V3 = [0, (OPENING.sill + OPENING.top) / 2, -RZ - 0.03];
  const half: [number, number] = [OPENING.half_width, (OPENING.top - OPENING.sill) / 2];
  const look: Look = { base: 0, warm: 0.06, sat: 1.12, contrast: 0.65, halation: 0.6, vignette: 0.28 };
  const ev = -0.6;
  return (
    <AbsoluteFill style={{ background: "#e9cfae" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 1000 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={0.22} threshold={0.8} />
        <Shadows mapSize={4096} distance={20} firstCascade={6} cascades={3} />
        <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={0.3} rotation={2.2} />
        <AmbientLight color="#9fb9e6" brightness={900} />
        <DirectionalLight illuminance={LUX} color="#ffd5a7" shadow_maps_enabled soft_shadow_size={0.4} transform={Transform.fromXyz(SUN[0] * 40, SUN[1] * 40, SUN[2] * 40 - RZ).lookingAt([0, 0, -RZ])} />
        {/* the lit cloud in front of the door gives the sun back onto its face, warm and soft */}
        <DirectionalLight illuminance={LUX * 0.42} color="#ffe9d2" transform={Transform.fromXyz(2, -3, -RZ + 10).lookingAt([0, 1, -RZ])} />
        <Model name="door" src={staticFile("models/sky/door.glb")} position={[0, 0, -RZ]} animation="open" time={clamp01(open) * 0.999} loop={false} {...({ allowOverlap: true } as object)} />
        <Portal next={NEXT} abs={abs} center={center} half={half} cam={c} />
        {Array.from({ length: DOVES }, (_, i) => {
          const b = birds?.[i];
          if (!b) return <Model key={i} name={`dove-${i}`} src={staticFile("models/sky/dove.glb")} position={[0, -200 - i, 0]} scale={0.001} morphs={[0, 0]} {...({ allowOverlap: true } as object)} />;
          const sp = len(b.v);
          const beat = (9 - 3 * clamp01((7 - sp) / 2.5)) * dt + rnd(i, 11);       // (beats a second: fast as it bursts out, slower at cruise)
          const ph = Math.sin(beat * 2 * Math.PI);
          const roll = 0.5 * Math.sin(abs * 1.3 + i) * clamp01(dt * 2);
          return <Model key={i} name={`dove-${i}`} src={staticFile("models/sky/dove.glb")} position={b.p} rotation={aim(b.v, roll)} scale={0.95 + 0.15 * rnd(i, 12)} morphs={[Math.max(0, ph), Math.max(0, -ph)]} {...({ allowOverlap: true } as object)} />;
        })}
        <Clouds cam={c} t={abs} click={{ at: CLICK, t: s.from + T.click }} door={{ center, half }} />
        <Hand3D hand={hand} cam={c} ev={ev} />
        <FilmLook look={look} seed={s.f0} cam={c} finish={false} />
        <Doorway next={NEXT} abs={abs} cam={c} center={center} half={half} />
        {!v.portal && <Finish look={look} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}
