// The kelp world (the shot "living", 5.07 s), the third door's world. the director, 11-11: "i really do want every time that
// door opens its a whole new world"; "i like revampped cathedral and kelp".
// The door in the rock opens on the bottom of the sea. We come down through a kelp forest in 10 m of green water, the sun
// coming down through the canopy in shafts and running over the sand in caustics, marine snow hanging in the light. A
// school of jack mackerel mills in a ball across the way: the cursor reaches into it and clicks, and the ball bursts,
// every fish flashing silver as it turns away, and streams off into the kelp. Ahead, the side of a sunken ship stands out
// of the sand with a watertight door in it. The cursor takes the knob of the door's wheel and cranks it round on the
// beat: the seal goes, air streams out of the seams, and as the wheel stops the dogs let go in a gust of bubbles. It
// takes the wheel again and pulls: the door swings out at us, the hull's trapped air boils out over the sill and up, and
// the light of the next world (the clouds) pours out of the doorway into the water as a beam.
// The wreck, its wheel, the sand and the fish are blender/components/wreck/*; the kelp, rocks and the life on the sand
// are the old kelp set's (blender/components/kelp), recovered as golden blades lit through.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, Environment, Fog, FogVolume, FramePass, Cuboid, Instances, Model, Refinish, Shadows, Sphere, ToneMapping, VolumetricFog } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, SpotLight, SolariLighting } from "raea/light";
import { BufferMesh, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import HATCH from "../media/models/wreck/hatch.glb.json";
import { RZ } from "../sets/rooms";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import type { Cam } from "./cam";
import { Hand3D, at, front, type Key } from "./hand3d";
import { Portal, goOut, viewOf, type View, shotOf, Doorway } from "./kit";
import { TAKE_KEYS } from "./takekeys";
import { FilmLook, type Look, Finish } from "./look";
import { EdgeBlur } from "./edge-blur";
import { H as FRAME_H, W as FRAME_W, type Shot } from "./plan";
import { sandAt, sandMesh, type Blade, type Patch } from "./sand";
import { Silt, type Puff } from "./silt";
import { DOOR_HOLD, ROOM_T } from "./times";

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a: V3): V3 => scl(a, 1 / (len(a) || 1));
/** a fixed random number for (i, k) */
const rnd = (i: number, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 74.7) * 43758.5453; return x - Math.floor(x); };

// ---- where things stand ----------------------------------------------------------------------------------------
const NEXT = "study";                                                 // (the clouds)
const BACK = 10;                                                      // where we come in, through the rock's door
/** the wreck's frame (Blender's, origin the door's sill) into the world's: the hull's face toward us at z -RZ */
const W = (p: number[]): V3 => [p[0], p[2], -RZ - p[1]];
const NOTE = JSON.parse((HATCH as { notes: string }).notes) as { hinge: number[]; wheel: number[]; opening: { half_width: number; sill: number; top: number } };
const HINGE = W(NOTE.hinge), WHEEL = W(NOTE.wheel), OPEN_DEG = 100, WHEEL_R = 0.3, KNOB_OUT = 0.085;
const OPENING = NOTE.opening;
/** the sand's height at (x, z): blender/components/wreck/seabed.py height() without its ripples */
export function sand(x: number, z: number) {
  const y = -(z + RZ);
  const base = 0.16 * Math.sin(0.35 * x + 0.7) * Math.cos(0.29 * y - 0.3) + 0.08 * Math.sin(0.8 * x - 0.6 * y + 1.9) - 0.12;
  const d = Math.max(0, -y - 0.15);
  const pile = 0.45 * Math.exp(-d / 0.9) * (1 - 0.9 * Math.exp(-x * x));
  const bank = 0.36 * Math.exp(-Math.max(0, -y - 0.12) / 0.5) * Math.exp(-x * x / 1.6);
  return base + pile + bank;
}
/** the seabed's ripples (seabed.py ripple()), which the simulated patch starts with too */
export function ripple(x: number, z: number) {
  const y = -(z + RZ);
  const a = 0.35 + 0.15 * Math.sin(0.1 * x);
  const p = ((x * Math.cos(a) + y * Math.sin(a)) / 0.42) * 2 * Math.PI + 0.6 * Math.sin(0.5 * x + 0.3 * y);
  const near = 1 - 0.8 * Math.exp(-Math.max(0, -y - 0.15) / 0.6);
  return 0.022 * near * (Math.sin(p) + 0.3 * Math.sin(2 * p) - 0.1);
}
const on = (x: number, z: number, up = 0): V3 => [x, sand(x, z) + up, z];
/** the sun's way (toward it): high, a little behind us and to the left, so the wreck's face takes it raking down */
const SUN: V3 = nrm([-0.3, 1, 0.42]);

// ---- the door and its wheel ------------------------------------------------------------------------------------
const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
const leafYaw = (open: number) => (-OPEN_DEG * Math.PI) / 180 * open;
/** the wheel's hub, the leaf `open` */
const hubAt = (open: number): V3 => add(HINGE, rotY(sub(WHEEL, HINGE), leafYaw(open)));
/** the end of the spinner knob on the wheel's rim, turned `spin` (radians, about the axle, counter-clockwise as we see it) */
const knobAt = (open: number, spin: number): V3 => add(hubAt(open), rotY([WHEEL_R * Math.cos(spin), WHEEL_R * Math.sin(spin), KNOB_OUT], leafYaw(open)));
const SPIN0 = -0.75, TURNS = 1.25;

// ---- the school -------------------------------------------------------------------------------------------------
const FISH = 120;
const BALL: V3 = [0.6, 1.6, 5.7];                                      // the bait ball's middle, 2.8 m ahead at the click
/** fish i at t: milling round the ball until the click at `tc` (from `p`), then bursting away and streaming off left */
function fishAt(i: number, t: number, tc: number, p: V3): V3 {
  const w = (1.2 + 0.5 * rnd(i, 1)) * (rnd(i, 2) < 0.15 ? -1 : 1), r = 0.3 + 0.8 * Math.sqrt(rnd(i, 3)), h = (rnd(i, 4) - 0.5) * 0.9;
  const mill = (u: number): V3 => { const a = rnd(i, 5) * 6.283 + w * u; return add(BALL, [r * Math.cos(a), h + 0.06 * Math.sin(2.1 * u + i), 0.8 * r * Math.sin(a)]); };
  if (t <= tc) return mill(t);
  const o = mill(tc), dt = t - tc;
  let d = nrm(add(sub(o, p), [(rnd(i, 6) - 0.5) * 0.6, (rnd(i, 7) - 0.3) * 0.5, (rnd(i, 8) - 0.5) * 0.6]));
  if (d[2] > 0.25) d = nrm([d[0] + Math.sign(d[0] || 1) * 0.9, d[1], d[2] * 0.4]);   // (none dives into the lens)
  const near = 1 - clamp01(len(sub(o, p)) / 1.2);
  // (a school struck flashes open round what struck it, a hole the size of a man's arm, then closes up and makes off
  // together: the fountain a bait ball does round a diving bird, so the click's hole is seen opening and the school
  // is still in frame as it goes)
  const burst = (0.35 + 0.85 * near + 0.25 * rnd(i, 9)) * (1 - Math.exp(-7 * dt));
  const regroup = ease(ramp(dt, 0.35, 1.5));
  const stream = Math.max(0, dt - 0.25) ** 1.5 * (2.1 + 0.4 * rnd(i, 10));     // (up and off to the left, over the lens's way in)
  const tight = scl(sub(BALL, o), 0.4 * regroup);
  return add(add(add(o, scl(d, burst * (1 - 0.55 * regroup))), tight), scl(nrm([-1, 0.5, -0.3]), stream));
}
function school(t: number, tc: number, p: V3) {
  return Array.from({ length: FISH }, (_, i) => {
    const a = fishAt(i, t - 0.02, tc, p), b = fishAt(i, t + 0.02, tc, p), v = sub(b, a);
    const fast = clamp01(len(v) / 0.12);
    const yaw = Math.atan2(-v[2], v[0]) + (0.1 + 0.25 * fast) * Math.sin(t * (14 + 10 * fast) + i * 1.7);
    const pitch = Math.atan2(v[1], Math.hypot(v[0], v[2]));
    return { position: fishAt(i, t, tc, p), rotation: [0, yaw, pitch] as V3, scale: 0.85 + 0.3 * rnd(i, 11) };
  });
}

// ---- the air out of the door ------------------------------------------------------------------------------------
const BUBBLES = 150, TOUCHED = 128;
const PARKED: V3 = [0, -60, 0];
/** `kick`: the way it is thrown out as it is born, metres, spent in the first tenth of a second */
type Bubble = { born: number; from: V3; r: number; v: number; kick?: V3 };
/** a direction from two numbers 0..1, even over the sphere */
const anyWay = (a: number, b: number): V3 => { const z = 2 * a - 1, q = Math.sqrt(1 - z * z), p = 6.2832 * b; return [q * Math.cos(p), z, q * Math.sin(p)]; };
/** the air the cursor's own touches put into the water (the director, 11-11, on assembly 23: "add a bubble effect when
 *  interacting"): a burst where it clicks into the school, a puff as its hand closes on the wheel's knob, a stream shed
 *  off the knob as it cranks it round, and a puff as it takes the wheel again to pull the door */
function touchedOf(T: { click: number; turn: [number, number]; door: number }, click: V3, knob: (t: number) => V3): Bubble[] {
  // (a bubble rises faster the bigger it is; a puff is a few big ones in a cloud of fine ones, thrown out and then rising)
  // (off the knob, thrown out of the door's face toward us, never into the steel)
  const one = (i: number, born: number, from: V3, big: number, out: number, face = false): Bubble => {
    const a = anyWay(rnd(i, 1), rnd(i, 2)), w: V3 = face ? [a[0], a[1], Math.abs(a[2])] : a, r = 0.003 + big * rnd(i, 5) ** 2;
    return { born, from: add(from, scl(w, 0.025)), r, v: 0.25 + 18 * r + 0.1 * rnd(i, 6), kick: scl(w, out * (0.3 + 0.7 * rnd(i, 3))) };
  };
  return Array.from({ length: TOUCHED }, (_, j) => {
    const i = 400 + j;
    if (j < 64) return one(i, T.click + 0.05 * rnd(i, 4), click, 0.017, 0.22);
    if (j < 84) { const b = T.turn[0] + 0.05 * rnd(i, 4); return one(i, b, knob(b), 0.014, 0.14, true); }
    if (j < 108) { const b = T.turn[0] + 0.1 + (T.turn[1] - T.turn[0] - 0.15) * ((j - 84 + rnd(i, 4)) / 24); return one(i, b, knob(b), 0.01, 0.05, true); }
    const b = T.door + 0.05 * rnd(i, 4);
    return one(i, b, knob(b), 0.014, 0.14, true);
  });
}
function bubblesOf(T: { turn: [number, number]; door: number }): Bubble[] {
  const hw = OPENING.half_width + 0.07, top = OPENING.top + 0.07, sill = OPENING.sill - 0.05;
  const seam = (u: number): V3 => {
    // a point on the leaf's edge: up its right side, across its top, down its left (the top most of all)
    const k = u * 3;
    const p = k < 1 ? [hw, -0.13, sill + (top - sill) * k] : k < 2 ? [hw - 2 * hw * (k - 1), -0.13, top] : [-hw, -0.13, top - (top - sill) * (k - 2) * 0.6];
    return W(p);
  };
  return Array.from({ length: BUBBLES }, (_, i) => {
    if (i < 60) return { born: T.turn[0] + 0.12 + (T.turn[1] - T.turn[0] - 0.12) * Math.sqrt(rnd(i, 1)), from: seam(0.2 + 0.75 * rnd(i, 2)), r: 0.005 + 0.007 * rnd(i, 3), v: 0.5 + 0.4 * rnd(i, 4) };
    if (i < 90) return { born: T.turn[1] + 0.25 * rnd(i, 1), from: seam(0.33 + 0.34 * rnd(i, 2)), r: 0.007 + 0.011 * rnd(i, 3), v: 0.7 + 0.5 * rnd(i, 4) };
    return { born: T.door + 0.08 + 0.85 * rnd(i, 1) ** 1.4, from: W([(rnd(i, 2) - 0.5) * 0.9, -0.05 - 0.3 * rnd(i, 5), OPENING.top - 0.15 - 0.4 * rnd(i, 6)]), r: 0.008 + 0.02 * rnd(i, 3) ** 2, v: 0.9 + 0.7 * rnd(i, 4) };
  });
}
function bubblesAt(bs: Bubble[], t: number) {
  return bs.map((b, i) => {
    const a = t - b.born;
    if (a <= 0 || a > 6) return { position: PARKED, scale: 0.001 };
    const wob = 0.02 + 0.6 * b.r;
    const out = b.kick ? scl(b.kick, 1 - Math.exp(-a / 0.08)) : ([0, 0, 0] as V3);
    const pos = add(add(b.from, out), [wob * Math.sin(a * 11 + i), b.v * a + 0.22 * a * a, wob * Math.cos(a * 9 + i * 0.7) + 0.18 * a]);
    const sq = 1 + 0.25 * Math.sin(a * 23 + i);                    // (big ones wobble flat as they rise)
    return { position: pos, scale: [b.r * sq, b.r / sq, b.r * sq] as V3 };
  });
}

// ---- marine snow -------------------------------------------------------------------------------------------------
const SNOW = Array.from({ length: 1100 }, (_, i) => ({ position: [(rnd(i, 1) - 0.5) * 7, 0.2 + 4.2 * rnd(i, 2), -2.6 + 14 * rnd(i, 3)] as V3, scale: 0.0035 + 0.006 * rnd(i, 4) ** 2 }));
/** the snow this frame: a mote nearer the lens than 0.7 m shrinks away, so none drifts past as a blot */
const snowAt = (abs: number, eye: V3) => SNOW.map((m) => {
  const w = add(m.position, [0.04 * abs, -0.025 * abs, 0]);
  return { position: m.position, scale: m.scale * ease(ramp(len(sub(w, eye)), 0.35, 0.7)) + 1e-5 };
});

// ---- the canopy: giant kelp's fronds lying on the surface, high over the way ---------------------------------------
// (what breaks the light from over the wreck into shafts in the water; without it the open water only glowed)
const CANOPY = Array.from({ length: 140 }, (_, i) => ({
  position: [(rnd(i, 11) - 0.5) * 26, 9.6 + 0.5 * rnd(i, 12), -18 + 30 * rnd(i, 13)] as V3,
  rotation: [0.08 * (rnd(i, 14) - 0.5), rnd(i, 15) * Math.PI, 0.08 * (rnd(i, 16) - 0.5)] as V3,
  scale: [0.25 + 0.6 * rnd(i, 17), 0.04, 2 + 4 * rnd(i, 18)] as V3,
}));

// ---- the kelp ------------------------------------------------------------------------------------------------------
const KELP: { f: "a" | "b" | "c"; x: number; z: number; yaw: number; s?: number; y?: number }[] = [
  // the left side of the way, near to far
  { f: "a", x: -1.9, z: 8.2, yaw: 0.4 }, { f: "c", x: -2.6, z: 6.3, yaw: 2.1 }, { f: "b", x: -1.7, z: 4.6, yaw: -0.3 }, { f: "a", x: -2.4, z: 2.9, yaw: 1.1 },
  { f: "c", x: -1.65, z: 1.2, yaw: -1.6 }, { f: "b", x: -2.9, z: -0.6, yaw: 0.8 }, { f: "a", x: -3.8, z: 7.4, yaw: 2.8 }, { f: "b", x: -4.3, z: 4.4, yaw: -2.2 },
  { f: "c", x: -4.0, z: 1.6, yaw: 0.2 }, { f: "a", x: -5.6, z: 6.0, yaw: 1.7 }, { f: "c", x: -6.2, z: 2.6, yaw: -0.9 }, { f: "b", x: -7.4, z: 8.4, yaw: 0.6 },
  { f: "a", x: -5.0, z: -1.2, yaw: -1.3 },
  // the right side
  { f: "b", x: 1.95, z: 8.9, yaw: 2.6 }, { f: "a", x: 2.7, z: 7.0, yaw: -1.2 }, { f: "c", x: 2.1, z: 3.9, yaw: 0.2 }, { f: "b", x: 2.6, z: 2.1, yaw: 1.4 },
  { f: "a", x: 1.85, z: 0.4, yaw: -2.0 }, { f: "c", x: 3.9, z: 5.6, yaw: 2.9 }, { f: "a", x: 4.4, z: 2.9, yaw: 0.5 }, { f: "b", x: 3.4, z: -0.9, yaw: -0.4 },
  { f: "c", x: 5.6, z: 7.8, yaw: 1.0 }, { f: "b", x: 6.4, z: 4.2, yaw: -1.7 }, { f: "a", x: 7.6, z: 1.2, yaw: 2.3 }, { f: "c", x: 5.4, z: -1.5, yaw: 0.9 },
  // behind us as we come in, and beyond the wreck, seen over its torn top
  { f: "a", x: -1.4, z: 11.6, yaw: 1.0 }, { f: "c", x: 1.6, z: 12.3, yaw: -0.4 },
  { f: "a", x: -3.5, z: -7.5, yaw: 0.3 }, { f: "b", x: 1.2, z: -8.8, yaw: 1.9 }, { f: "c", x: 4.2, z: -6.2, yaw: -1.1 }, { f: "a", x: 7.5, z: -9.5, yaw: 2.4 }, { f: "b", x: -0.8, z: -5.6, yaw: 0.7 },
  // growing on the hull's top
  { f: "b", x: -2.6, z: -RZ - 0.15, yaw: 0.6, s: 0.5, y: 4.25 }, { f: "c", x: 1.9, z: -RZ - 0.15, yaw: -0.9, s: 0.45, y: 4.4 }, { f: "b", x: -5.4, z: -RZ - 0.1, yaw: 2.2, s: 0.4, y: 3.6 },
];
/** the blades lit through: gold where the sun comes through them, as a blade held up to the light is */
const KELP_LOOK = [
  { material: "giant_kelp_blade", emissive: "#5a3a08", roughness: 0.5 },
  { material: "giant_kelp_bladder", emissive: "#2a1a03", roughness: 0.35 },
];
/** each plant's sway in the swell: the shape keys' weights (sway down-current, lean across), slow and out of step */
const swayOf = (i: number, abs: number): number[] => [0.25 + 0.2 * Math.sin(abs * 0.55 + i * 1.7), 0.18 * Math.sin(abs * 0.43 + i * 2.3 + 1)];

// ---- the light on the sand ----------------------------------------------------------------------------------------
// Caustics: the sun's light focused by the swell overhead into a moving net of bright lines on whatever faces up. Laid in
// before the tone map over the frame, on each pixel put back in the world from the depth prepass, projected down the sun's
// way and fading with distance (the water takes them), on the faces the sun reaches (the normal prepass).
const CAUSTICS = /* wgsl */ `
fn caus(q0: vec2<f32>, t: f32) -> f32 {
  let p = q0 * 3.6 - vec2<f32>(250.0, 250.0);
  var i = p; var c = 1.0; let inten = 0.005;
  for (var n = 0; n < 5; n++) {
    let tt = t * (1.0 - 3.5 / f32(n + 1));
    i = p + vec2<f32>(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2<f32>(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c = c / 5.0; c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 7.0);
}
fn hh(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// the shafts' pattern on the surface: a few bright patches where the swell focuses the light, metres apart, drifting
// with the swell; sparse, so a line of sight through the water crosses one or two of them or none and they read as
// columns rather than an even glow
fn vn(p: vec2<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hh(i), hh(i + vec2<f32>(1.0, 0.0)), u.x), mix(hh(i + vec2<f32>(0.0, 1.0)), hh(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
fn shaft(q: vec2<f32>, t: f32) -> f32 {
  let w = q * 0.55 + vec2<f32>(t * 0.06, t * 0.035) + 0.25 * vec2<f32>(sin(t * 0.4 + q.y * 0.3), cos(t * 0.33 + q.x * 0.3));
  let n = vn(w) * 0.62 + vn(w * 2.2 + vec2<f32>(7.0, 3.0)) * 0.38;
  return smoothstep(0.6, 0.86, n);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  let tn = u_eye().w; let asp = u_fwd().w;
  let rd = normalize(u_fwd().xyz + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
  let sun = normalize(u_sun().xyz); let t = u_sun().w;
  let d = depth(uv);
  let open = d <= 0.0 || d > 200.0;
  // open water: what the fog fades to, brighter up toward the surface's light
  let deep = u_water().xyz * 0.35; let high = u_water().xyz * 1.6;
  let water = mix(deep, high, smoothstep(-0.35, 0.75, rd.y)) * u_water().w;
  var c = select(c0.rgb, water, open);
  var dist = select(d / max(dot(rd, u_fwd().xyz), 0.05), 40.0, open);
  // the doorway: what is seen through it is the next world's, drawn there already (its card writes no depth); the
  // water before it is marched, nothing behind it
  let tp = (u_door().z - u_eye().z) / rd.z;
  let pp = u_eye().xyz + rd * tp;
  let portal = tp > 0.0 && abs(pp.x - u_door().x) < u_door().w && abs(pp.y - u_doorh().x) < u_doorh().y && (open || dist > tp - 0.02);
  if (portal) { c = c0.rgb; dist = tp; }
  // the caustics on what faces the sun
  if (!open && !portal && dist < 40.0) {
    let p = u_eye().xyz + rd * dist;
    let q = p.xz + sun.xz / sun.y * (12.0 - p.y);
    let n = normal(uv);
    let facing = smoothstep(0.15, 0.85, dot(n, sun));
    let k = u_k().x * facing * exp(-dist * 0.07);
    let cr = caus(q + vec2<f32>(0.012, 0.0), t); let cg = caus(q, t); let cb = caus(q - vec2<f32>(0.012, 0.0), t);
    c = c * (vec3<f32>(1.0) + k * vec3<f32>(cr, cg, cb));
  }
  // the shafts: marched along the ray through the water to what it meets, each step lit by the pattern straight up the
  // sun's way from it, fading as the water takes it
  let L = min(dist, 20.0);
  let jit = hh(uv * vec2<f32>(${FRAME_W}.0, ${FRAME_H}.0) + vec2<f32>(t * 37.0, 0.0));
  var acc = vec3<f32>(0.0);
  for (var i = 0; i < 32; i++) {
    let s = (f32(i) + jit) / 32.0 * L;
    let q = u_eye().xyz + rd * s;
    let pr = q.xz + sun.xz / sun.y * (12.0 - q.y);
    acc += vec3<f32>(shaft(pr, t)) * exp(-s * 0.11) * (0.35 + 0.65 * smoothstep(0.0, 9.0, q.y));
  }
  let phase = 0.55 + 0.9 * pow(max(dot(rd, sun), 0.0), 3.0);
  c += acc * (L / 32.0) * u_k().y * phase * vec3<f32>(0.55, 0.9, 0.85) * 0.3;
  return vec4<f32>(c, c0.a);
}`;
function Caustics({ cam, t, k, shafts, water, level, door }: { cam: Cam; t: number; k: number; shafts: number; water: V3; level: number; door: { center: V3; half: [number, number] } }) {
  const f = nrm(sub(cam.look, cam.eye)), r = nrm([-f[2], 0, f[0]]);                 // (f x up, as FilmLook's)
  const u: V3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return <FramePass wgsl={CAUSTICS} prepass at="before-tonemap" uniforms={{ eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...f, FRAME_W / FRAME_H], right: [...r, 0], up: [...u, 0], sun: [...SUN, t * 0.9 + 17], k: [k, shafts], water: [...water, level], door: [door.center[0], 0, door.center[2], door.half[0]], doorh: [door.center[1], door.half[1], 0, 0] }} />;
}

// ---- the sand the door ploughs ------------------------------------------------------------------------------------
// (the director, 11-11: "alos make sure that the door opening moves the sand with physics".) The sand is drifted up the leaf
// to 0.45 m. As the leaf swings out its foot cuts through the drift: what it cuts is pushed ahead of its face, heaps
// there and slumps off at sand's angle under water (v3/sand.ts), and the silt goes up where it bit. The patch is the
// seabed's own sand (seabed.py drops away under it), simulated from the moment the door starts to open.
const PATCH: Patch = { x0: -2.3, z0: -RZ + 0.02, d: 0.04, nx: 92, nz: 56, ground: (x, z) => sand(x, z) + ripple(x, z), repose: Math.tan((30 * Math.PI) / 180), wall: (_x, z) => z < -RZ + 0.1 };
/** the leaf in plan, along it from the hinge (u) and out of its face (w), and its foot, which lifts at its round corners */
const LEAF = { u0: 0.035, u1: 1.295, w0: -0.03, w1: 0.045, r: 0.35, foot: 0.01 };
const openAt = (T: { door: number }, t: number) => jerk(ramp(t, T.door + 0.03, T.door + 0.85));
const leafPlan = (open: number) => { const a = leafYaw(open); return { dir: [Math.cos(a), -Math.sin(a)] as [number, number], face: [Math.sin(a), Math.cos(a)] as [number, number] }; };
function leafBlade(T: { door: number }): Blade {
  return (t) => {
    const { dir, face } = leafPlan(openAt(T, t));
    const push = (() => { const v = [face[0] + 0.3 * dir[0], face[1] + 0.3 * dir[1]]; const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l] as [number, number]; })();
    return {
      at: (x, z) => {
        const px = x - HINGE[0], pz = z - HINGE[2];
        const u = px * dir[0] + pz * dir[1], w = px * face[0] + pz * face[1];
        if (u < LEAF.u0 || u > LEAF.u1 || w < LEAF.w0 || w > LEAF.w1) return null;
        const e = Math.min(u - LEAF.u0, LEAF.u1 - u);
        const lift = e < LEAF.r ? LEAF.r - Math.sqrt(LEAF.r ** 2 - (LEAF.r - e) ** 2) : 0;
        return { bottom: LEAF.foot + lift, push, ahead: 0 };
      },
    };
  };
}
let BLADE: { door: number; blade: Blade } | null = null;
/** the silt the leaf's foot puts up: a puff every tenth of a second it is ploughing, from its outer half */
function puffsOf(T: { door: number }, t: number): Puff[] {
  return Array.from({ length: 8 }, (_, k) => {
    const at = T.door + 0.06 + 0.1 * k, { dir, face } = leafPlan(openAt(T, at)), u = 0.55 + 0.1 * k;
    const x = HINGE[0] + dir[0] * u + face[0] * 0.12, z = HINGE[2] + dir[1] * u + face[1] * 0.12;
    return { at: [x, sand(x, z) + 0.08, z] as V3, age: t - at, push: face };
  });
}

// ---- the keys -----------------------------------------------------------------------------------------------------
function kelpKeys(s: Shot, t: number) {
  const T = ROOM_T.living as { click: number; turn: [number, number]; door: number };
  const L = s.seconds;
  const spin = SPIN0 + TURNS * 2 * Math.PI * ease(ramp(t, T.turn[0], T.turn[1]));
  const open = openAt(T, t);
  const CLICK: V3 = add(BALL, [-0.08, 0.02, 0.05]);
  const knob = () => knobAt(open, spin);
  const keys: Key[] = [
    { t: T.click, p: at(CLICK), click: true, seen: "click into the school", margin: 0.1 },
    { t: T.turn[0], p: front(knob, 0.02), press: true, seen: "take the door's wheel by its knob and crank it round" },
    { t: T.turn[1], p: front(knob, 0.02) },
    { t: T.door, p: front(knob, 0.02), press: true, seen: "take the wheel and pull the door open" },
    { t: T.door + DOOR_HOLD, p: front(knob, 0.02) },
    ...goOut(L),
  ];
  return { T, L, spin, open, CLICK, keys };
}
TAKE_KEYS.living = (t: number) => kelpKeys(shotOf("living"), t).keys;
export const kelpView = (s: Shot, t: number): View => viewOf(s, t);

export function KelpWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, spin, open, CLICK } = kelpKeys(s, t);
  const { hand, cam: c } = v;
  const abs = s.from + t;
  const yaw = leafYaw(open);
  const hub = hubAt(open);
  const knobWhen = (x: number) => knobAt(openAt(T, x), SPIN0 + TURNS * 2 * Math.PI * ease(ramp(x, T.turn[0], T.turn[1])));
  const bubbles = bubblesAt([...bubblesOf(T), ...touchedOf(T, CLICK, knobWhen)], t);
  const fish = school(t, T.click, CLICK);
  const beam = ease(ramp(t, T.door + 0.1, T.door + 0.9));
  if (!BLADE || BLADE.door !== T.door) BLADE = { door: T.door, blade: leafBlade(T) };
  const patch = sandMesh(PATCH, sandAt(PATCH, BLADE.blade, T.door, Math.max(t, T.door)), 2.2, RZ);
  const look: Look = { base: 0, warm: -0.05, sat: 1.0, contrast: 0.6, halation: 0.5, vignette: 0.3 };
  const ev = 0.3;
  return (
    <AbsoluteFill style={{ background: "#1d7380" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 400 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={0.3} threshold={0.75} />
        <Shadows mapSize={4096} distance={36} firstCascade={10} cascades={3} />
        <Fog color="#1d7380" density={0.08} />
        {/* (Solari lights only from directional lights, emissive surfaces and the environment: the AmbientLight that was this
            world's fill, and the doorway's SpotLight, light nothing it traces. So the fill is the sky made stronger and a
            teal light straight down, the water's own downwelling glow) */}
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={0.55} rotation={1.0} />
        <VolumetricFog ambient={0} />
        <FogVolume name="water" position={[0, 6, 3]} scale={[30, 13, 34]} density={0.05} density_texture={staticFile("fog/glade.ktx2")} color="#86d6cc" scattering={0.7} absorption={0.1} anisotropy={0.72} />
        <AmbientLight color="#3aa0b0" brightness={750} />
        <DirectionalLight illuminance={22000} color="#c4ecdc" volumetric shadow_maps_enabled soft_shadow_size={1.2} transform={Transform.fromXyz(SUN[0] * 60, SUN[1] * 60, SUN[2] * 60 + 3).lookingAt([0, 0, 3])} />
        <DirectionalLight illuminance={16000} color="#3fb4bc" soft_shadow_size={6} transform={Transform.fromXyz(0.5, 60, 3.5).lookingAt([0, 0, 3])} />
        {/* the shafts (the director, 11-12: "add some volumetric light"): the light from high over the wreck, toward the lens through
            the kelp, so its beams in the water come at us; the sun behind the lens threw them away from it */}
        <DirectionalLight illuminance={20000} color="#d6f2e4" volumetric shadow_maps_enabled soft_shadow_size={0.6} transform={Transform.fromXyz(4, 40, -26).lookingAt([0, 0, 3])} />
        {/* the next world's light, out of the doorway into the water */}
        <SpotLight intensity={2.2e6 * beam + 1} color="#fff1dc" volumetric shadow_maps_enabled range={40} outer_angle={0.75} inner_angle={0.35} transform={Transform.fromXyz(0, 1.25, -RZ - 0.45).lookingAt([0, 0.9, 8])} />
        <Model name="seabed" src={staticFile("models/wreck/seabed.glb")} position={[0, 0, -RZ]} />
        <Mesh3d name="sand-patch"><BufferMesh {...patch} /><StandardMaterial base_color="#efebdf" base_color_texture={{ path: staticFile("tex/coast-sand-diff.jpg"), sampler: { filter: "linear", wrap: "repeat" } }} perceptual_roughness={0.95} /></Mesh3d>
        <Model name="hatch" src={staticFile("models/wreck/hatch.glb")} position={[0, 0, -RZ]} animation="open" time={clamp01(open) * 0.999} loop={false} {...({ allowOverlap: true } as object)} />
        <Model name="hatch-wheel" src={staticFile("models/wreck/hatch-wheel.glb")} position={hub} rotation={[0, yaw, spin]} {...({ allowOverlap: true } as object)} />
        <Portal next={NEXT} abs={abs} center={[0, (OPENING.sill + OPENING.top) / 2, -RZ - 0.05]} half={[OPENING.half_width, (OPENING.top - OPENING.sill) / 2]} cam={c} />
        <Refinish materials={KELP_LOOK}>
          {KELP.map((k, i) => (
            <Model key={i} name={`kelp-${i}`} src={staticFile(`models/wreck/giant-kelp-${k.f}.glb`)} position={k.y !== undefined ? [k.x, k.y, k.z] : on(k.x, k.z, -0.04)} rotation={[0, k.yaw, 0]} scale={k.s ?? 1}
              morphs={swayOf(i, abs)} {...({ allowOverlap: true } as object)} />
          ))}
        </Refinish>
        {/* rocks and the life on the sand, by the way and at the wreck's foot */}
        <Model name="reef" src={staticFile("models/kelp/reef.glb")} position={on(-3.6, 5.2, -0.25)} rotation={[0, 0.6, 0]} scale={0.7} />
        <Model name="boulders-b" src={staticFile("models/kelp/boulders.glb")} position={on(-3.9, -1.9, -0.2)} rotation={[0, 0.3, 0]} scale={0.6} />
        <Model name="boulders-c" src={staticFile("models/kelp/boulders.glb")} position={on(3.4, -2.1, -0.2)} rotation={[0, 1.4, 0]} scale={0.5} />
        <Model name="anemones" src={staticFile("models/kelp/anemones.glb")} position={on(1.2, 4.4)} animation="sway" time={(abs * 0.35) % 1} />
        <Model name="sea-fan" src={staticFile("models/kelp/sea-fan.glb")} position={on(-1.5, 3.4)} rotation={[0, 0.4, 0]} animation="sway" time={(abs * 0.3) % 1} />
        <Model name="urchins" src={staticFile("models/kelp/urchins.glb")} position={on(1.4, -1.0)} animation="bristle" time={(abs * 0.4) % 1} />
        <Model name="sea-stars" src={staticFile("models/kelp/sea-stars.glb")} position={on(-0.9, 0.2, 0.005)} />
        <Model name="shells" src={staticFile("models/kelp/shells.glb")} position={on(0.6, 2.2, 0.01)} />
        <Model name="garibaldi" src={staticFile("models/kelp/garibaldi.glb")} position={[-1.6 + 0.25 * abs, 0.7, -1.4]} rotation={[0, -0.3, 0]} animation="tail" time={(abs * 2.2) % 1} />
        <Model name="sheephead" src={staticFile("models/kelp/sheephead.glb")} position={[4.5 - 0.5 * (abs - 7), 2.2, 1.5]} rotation={[0, Math.PI - 0.2, 0]} animation="swim" time={(abs * 0.8) % 1} />
        <Instances name="school" src={staticFile("models/wreck/fish.glb")} at={fish} shadow={false} {...({ allowOverlap: true } as object)} />
        <Instances name="bubbles" at={bubbles} shadow={false} {...({ allowOverlap: true } as object)}><Sphere radius={1} ico={2} /><StandardMaterial base_color="#ffffff" emissive="#86c2c0" metallic={1} perceptual_roughness={0.04} /></Instances>
        <Instances name="canopy" at={CANOPY}><Cuboid half_size={[0.5, 0.5, 0.5]} /><StandardMaterial base_color="#3d4a22" perceptual_roughness={0.8} /></Instances>
        <Instances name="snow" at={snowAt(abs, c.eye)} position={[0.04 * abs, -0.025 * abs, 0]} shadow={false} {...({ allowOverlap: true } as object)}><Sphere radius={1} ico={1} /><StandardMaterial base_color="#d6efe8" emissive="#294843" perceptual_roughness={0.9} /></Instances>
        <Silt name="silt" puffs={puffsOf(T, t)} cam={c} t={abs} sun={SUN} sunColor={[0.62, 0.56, 0.42]} skyColor={[0.1, 0.17, 0.17]} />
        <Caustics cam={c} t={abs} k={2.4} shafts={1.0} water={[0.05, 0.42, 0.46]} level={1.0} door={{ center: [0, (OPENING.sill + OPENING.top) / 2, -RZ - 0.05], half: [OPENING.half_width, (OPENING.top - OPENING.sill) / 2] }} />
        <Hand3D hand={hand} cam={c} ev={ev} />
        <FilmLook look={look} seed={s.f0} cam={c} finish={false} />
        {/* the frame's edges a little soft, as a lens behind a dome port (the director, 11-12: "too crisp at the peripherals ...
            almost like blur volume at the perepherals just enough to make sure not everything is so sharp"): before the
            doorway, so the next world through it stays sharp; eased in over the first second, as the last world's door
            showed this one without it; none in a portal's render */}
        {!v.portal && <EdgeBlur px={8} from={0.4} k={ease(ramp(t, 0.1, 1.0))} />}
        <Doorway next={NEXT} abs={abs} cam={c} center={[0, (OPENING.sill + OPENING.top) / 2, -RZ - 0.05]} half={[OPENING.half_width, (OPENING.top - OPENING.sill) / 2]} />
        {!v.portal && <Finish look={look} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}
