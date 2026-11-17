// The dunes (the shot "cellar", 6.1 s), the seventh and last door's world. the director, 11-11: "dunes are also cool if we do
// the relaistic sand simulation like we did for the ui post"; "alos make sure that the door opening moves the sand with
// physics".
// The cathedral's door opens on the desert at sundown: a flat of sand between dunes, the sun low ahead and to the left,
// the crests sharp against it and their slip faces in shadow. A door lies buried in a drift ahead of us, the top of its
// lintel all that shows. The cursor takes the lintel and pulls, and the door comes up out of the sand: the drift on its
// lintel slides off and pours down over its face, and the sand round it drains into the hollow it leaves, smoking with
// dust. Then the cursor takes its ring and pulls the leaf open toward us; its foot ploughs the drift, and through it is
// the canyon, in its lines (the next shot starts as a drawing).
// Drawn without the ray-traced light, as the clouds are (the sand moves every frame): the sun with cascaded shadows,
// the sky's light, and the sky and the air drawn by a pass (SKY). The sand round the door is v3/sand.ts's heightfield;
// everything beyond it is one mesh of the same ground with the patch's square let down out of sight under it.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, Environment, FramePass, Model, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { BufferMesh, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import DOOR_JSON from "../media/models/dunes/door.glb.json";
import { RZ } from "../sets/rooms";
import { clamp01, ramp, type V3 } from "../v2/math";
import type { Cam } from "./cam";
import { Hand3D, front, type Key } from "./hand3d";
import { Doorway, Portal, goOut, shotOf, viewOf, type View } from "./kit";
import { FilmLook, Finish, type Look } from "./look";
import { NoShadowMesh } from "./noshadow";
import { H, W, type Shot } from "./plan";
import { sandAt, sandMesh, type Blade, type Patch } from "./sand";
import { Silt, type Puff } from "./silt";
import { TAKE_KEYS } from "./takekeys";
import { DOOR_HOLD, ROOM_T } from "./times";

const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const smooth = (a: number, b: number, x: number) => { const q = clamp01((x - a) / (b - a)); return q * q * (3 - 2 * q); };
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const notes = <T,>(j: unknown) => JSON.parse((j as { notes: string }).notes) as T;

const NEXT = "canyon";
const DOOR = notes<{ hinge: number[]; ring: number[]; opening: { half_width: number; top: number }; frame: { half_width: number; jamb_out: number; depth: number; lintel_top: number; front: number }; leaf: { width: number; thickness: number } }>(DOOR_JSON);
const DZ = -RZ;                                                          // the door's plane, on the take's door line
/** the door's foot, buried and then pulled up: its sill a hand under the sand at the last */
const BURIED = -2.0, RAISED = -0.06;
const TILE = 2.0;                                                        // metres of ground to a tile of the sand's maps (blender/components/dunes/ripples.py)
/** toward the sun: low (15 degrees), behind us and to the left, so its light rakes the door's face and the ridges' left
 *  slopes, and their slip faces are in shadow; its colour and strength (the sky's units: v3/clouds.tsx) */
const SUN: V3 = nrm([-0.8, 0.27, 0.53]);
const SUNC: V3 = [1.0, 0.7, 0.45], SUN_I = 5.0;
const LUX = SUN_I * Math.PI * 1.2 * 2 ** 9.7;
const SAND_RGB: V3 = [0.92, 0.74, 0.52];                                   // (the sand's own colour, for what the passes draw of it)

// ---- the ground ---------------------------------------------------------------------------------------------------
/** the dune field's height at (x, z): the flat we come down, a drift heaped on the buried door, and the dunes: a street
 *  between two ridges that runs on ahead of us to the horizon, widening; the ridges run away from us (15 degrees off
 *  our line), the wind from the left, so each is a long slope up from the left to a sharp brink and a steep slip face
 *  down to the right; and far off the great dunes, the same shape a few times the size */
export function ground(x: number, z: number): number {
  let h = 0.14 * Math.sin(x * 0.21 + 0.4) * Math.sin(z * 0.17 + 1.1) + 0.06 * Math.sin(x * 0.53 - z * 0.31 + 0.7) + lumps(x, z);
  const dx = x / 1.8, dz = (z - DZ) / 1.3;
  h += 0.17 * Math.exp(-(dx * dx + dz * dz));
  const ahead = Math.max(0, DZ - z);
  const halfW = 5.5 + 0.13 * ahead;
  const out = Math.max(0, Math.abs(x - 0.06 * ahead * Math.sin(ahead / 70)) - halfW) + Math.max(0, z - 18);
  const m = smooth(0, 11 + 0.06 * ahead, out);
  if (m <= 0) return h;
  const a = 0.26, ca = Math.cos(a), sa = Math.sin(a);
  const along = z * ca + x * sa, across = x * ca - z * sa;
  const dune = (lam: number, w: number) => { const f = w / lam - Math.floor(w / lam); return f < 0.66 ? 0.5 - 0.5 * Math.cos((Math.PI * f) / 0.66) : Math.pow(1 - (f - 0.66) / 0.34, 1.1); };
  const w1 = across + 7 * Math.sin(along / 41 + 0.7) + 2.6 * Math.sin(along / 13 + 2.1) + 0.9 * Math.sin(along / 5.3);
  const dist = Math.hypot(x, z - DZ);
  // (no steeper than sand stands: a slip face drops its height over a third of the spacing)
  const A1 = Math.min(10.5, 5 + 0.04 * dist) * (0.78 + 0.22 * Math.sin(along / 83 + 1.3));
  const w2 = across * 0.92 + 30 * Math.sin(along / 190 + 2.2) + 9 * Math.sin(along / 61);
  const A2 = 46 * smooth(90, 420, dist) * (0.7 + 0.3 * Math.sin(along / 310 + 0.4));
  return h + m * (A1 * dune(52, w1) + A2 * dune(240, w2));
}

// The sand's own lumps (the director, 11-11: "it shoudl be light sand color and lumpy not just flat"): rounded hummocks a metre
// or two across where it has drifted, standing over a scoured floor, and lesser lumps on them, a little longer across
// the wind than down it. Smooth value noise; what is finer than these (the ripples, the grain) is the sand's maps.
const hash2 = (i: number, j: number) => { let h = (i * 374761393 + j * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
function vnoise(x: number, z: number): number {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function lumps(x: number, z: number): number {
  const m = vnoise(x / 1.9 + 3.1, z / 1.45 + 7.7);
  const mound = 0.2 * Math.pow(Math.max(0, m - 0.32) / 0.68, 1.5);
  const mid = 0.075 * (vnoise(x / 0.95 + 11.3, z / 0.8 + 2.9) - 0.5);
  const small = 0.03 * (vnoise(x / 0.48 + 23.5, z / 0.4 + 17.2) - 0.5);
  return mound + mid + small - 0.06;
}

/** the patch of sand round the door that moves (v3/sand.ts): 4.4 m square, 4 cm cells */
const PATCH_HALF = 2.2;
const PATCH: Patch = {
  x0: -PATCH_HALF, z0: DZ - PATCH_HALF, d: 0.04, nx: 111, nz: 111, ground, repose: Math.tan((33 * Math.PI) / 180),
  // (the jambs, and the leaf shut between them, are stone and wood: sand doesn't go into them)
  wall: (x, z) => {
    const zb = DZ - z, ax = Math.abs(x);                                 // (zb: the door's own y, toward the lens negative)
    return (ax > DOOR.opening.half_width - 0.01 && ax < DOOR.frame.jamb_out + 0.01 && Math.abs(zb) < DOOR.frame.depth / 2 + 0.01) || (ax <= DOOR.opening.half_width && zb > DOOR.hinge[1] - 0.005 && zb < DOOR.hinge[1] + DOOR.leaf.thickness);
  },
};
/** the far ground: one mesh, a grid fine near the patch (12 cm, for the lumps) and opening out to 40 m cells at the horizon, the patch's own
 *  square sunk 3 m under it (the patch is drawn there) */
const FAR = (() => {
  const axis = (lo: number, hi: number) => {
    const side = (from: number, dir: number) => { const a: number[] = []; let x = from, d = 0.12; while (Math.abs(x - from) < 900) { x += dir * d; a.push(x); if (Math.abs(x - from) > 14) d = Math.min(40, d * 1.07); } return a; };
    return [...side(lo, -1).reverse(), lo, (lo + hi) / 2, hi, ...side(hi, 1)];
  };
  const xs = axis(-PATCH_HALF, PATCH_HALF), zs = axis(DZ - PATCH_HALF, DZ + PATCH_HALF);
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const e = 0.08;
  for (const z of zs) for (const x of xs) {
    const inside = x > -PATCH_HALF + 1e-6 && x < PATCH_HALF - 1e-6 && z > DZ - PATCH_HALF + 1e-6 && z < DZ + PATCH_HALF - 1e-6;
    positions.push(x, ground(x, z) - (inside ? 3 : 0), z);
    const gx = (ground(x + e, z) - ground(x - e, z)) / (2 * e), gz = (ground(x, z + e) - ground(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz);
    normals.push(-gx / l, 1 / l, -gz / l);
    uvs.push(x / TILE, z / TILE);
  }
  const nx = xs.length;
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  return { positions, normals, uvs, indices };
})();
const tex = (path: string) => ({ path: staticFile(path), sampler: { filter: "linear" as const, mipmap: "linear" as const, wrap: "repeat" as const, anisotropy: 16 } });
const SAND_MAT = { base_color: "#f2d4a8", base_color_texture: tex("tex/dunes-sand-diff.png"), normal_map_texture: tex("tex/dunes-ripple-nor.png"), perceptual_roughness: 0.96, reflectance: 0.12 };

// ---- the door: pulled up, then opened ---------------------------------------------------------------------------
const riseOf = (T: Times, t: number) => jerk(ramp(t, T.pull[0], T.pull[1]));
const yOf = (T: Times, t: number) => BURIED + (RAISED - BURIED) * riseOf(T, t);
// (quickly, and done while the lens is still over a metre out: it swings toward us, across the frame, and stands open at
// its left edge as we go through; slower, it was in front of the lens)
const openAt = (T: Times, t: number, _L: number) => jerk(ramp(t, T.door + 0.03, T.door + 0.75));
type Times = { pull: [number, number]; door: number };
/** the hinge in plan (world x, z), and the leaf's way and its face's at `open` (it swings out toward us, 100 degrees) */
const HX = DOOR.hinge[0], HZ = DZ - DOOR.hinge[1];
const leafPlan = (open: number) => { const a = (100 * Math.PI) / 180 * open; return { dir: [Math.cos(a), Math.sin(a)] as [number, number], face: [-Math.sin(a), Math.cos(a)] as [number, number] }; };
/** the ring's grip, the leaf `open`, the door's foot at y */
const RING = (open: number, y: number): V3 => {
  const { dir, face } = leafPlan(open), u = DOOR.ring[0] - DOOR.hinge[0], w = DOOR.hinge[1] - DOOR.ring[1];
  return [HX + dir[0] * u + face[0] * w, y + DOOR.ring[2], HZ + dir[1] * u + face[1] * w];
};
/** where the cursor takes the lintel: the top of its front edge, a little right of the middle */
const LINTEL = (y: number): V3 => [0.22, y + DOOR.frame.lintel_top - 0.02, DZ - DOOR.frame.front + 0.01];

// The sand as the door comes up and opens. Coming up, the door leaves a hollow under it that the sand round it runs
// into: a share of its plan's area times how far it rose this step goes out of the sand at its foot, most at its
// edge, and the slopes that leaves slump in at the angle of repose (a funnel round it). Opening, the leaf's foot cuts
// through the drift in front of it and pushes what it cuts on ahead of its face, where it heaps and slumps.
const DRAIN = 0.16;
const frameDist = (x: number, z: number) => {
  const zb = DZ - z;
  const dx = Math.max(0, Math.abs(x) - DOOR.frame.jamb_out), dz = Math.max(0, Math.abs(zb) - DOOR.frame.depth / 2);
  return Math.hypot(dx, dz);
};
const LEAF = { u0: 0.01, u1: DOOR.leaf.width - 0.004, w0: -DOOR.leaf.thickness, w1: 0.02, foot: 0.02 };
function doorBlade(T: Times, L: number): Blade {
  return (t) => {
    const y = yOf(T, t), dy = y - yOf(T, t - 1 / 120);
    const open = openAt(T, t, L);
    const { dir, face } = leafPlan(open);
    const push = (() => { const v = [face[0] + 0.3 * dir[0], face[1] + 0.3 * dir[1]]; const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l] as [number, number]; })();
    return {
      at: (x, z) => {
        if (open <= 0.002) return null;
        const px = x - HX, pz = z - HZ;
        const u = px * dir[0] + pz * dir[1], w = px * face[0] + pz * face[1];
        if (u < LEAF.u0 || u > LEAF.u1 || w < LEAF.w0 || w > LEAF.w1) return null;
        return { bottom: y + LEAF.foot, push, ahead: 0 };
      },
      drain: dy > 1e-7 ? (x, z) => { const d = frameDist(x, z); return DRAIN * dy * Math.exp(-(d * d) / (0.38 * 0.38)); } : undefined,
    };
  };
}
let BLADE: { key: string; blade: Blade } | null = null;

// ---- the keys -----------------------------------------------------------------------------------------------------
function dunesKeys(s: Shot, t: number) {
  const T = ROOM_T.cellar as Times;
  const L = s.seconds;
  const open = openAt(T, t, L);
  const at = (k: number) => T.pull[0] + (T.pull[1] - T.pull[0]) * k;
  const keys: Key[] = [
    { t: T.pull[0], p: front(() => LINTEL(yOf(T, T.pull[0])), 0.03), press: true, seen: "take the buried door by its lintel and pull it up out of the sand", margin: 0.1 },
    ...[0.25, 0.5, 0.75].map((k): Key => ({ t: at(k), p: front(() => LINTEL(yOf(T, at(k))), 0.03), press: true })),
    { t: T.pull[1], p: front(() => LINTEL(RAISED), 0.03) },
    { t: T.door, p: front(() => RING(0, RAISED), 0.03), press: true, seen: "take the door's ring and pull it open" },
    { t: T.door + DOOR_HOLD, p: front(() => RING(open, RAISED), 0.03) },
    ...goOut(L),
  ];
  return { T, L, open, keys };
}
TAKE_KEYS.cellar = (t: number) => dunesKeys(shotOf("cellar"), t).keys;
export const dunesView = (s: Shot, t: number): View => viewOf(s, t);

// ---- the sand that pours off the lintel ---------------------------------------------------------------------------
const NOISE = /* wgsl */ `
fn fh(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn fn2(p: vec2<f32>) -> f32 { let i = floor(p); let f = fract(p); let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(fh(i), fh(i + vec2<f32>(1.0, 0.0)), u.x), mix(fh(i + vec2<f32>(0.0, 1.0)), fh(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
fn fbm2(p0: vec2<f32>) -> f32 { var p = p0; var a = 0.5; var s = 0.0; for (var i = 0; i < 4; i++) { s += a * fn2(p); p = p * 2.03 + vec2<f32>(1.7, 9.2); a *= 0.5; } return s; }
`;
// A sheet of sand falling from an edge, on a card that hangs from it (uv x along the edge, y 0 at it and 1 at the
// card's foot; the sand it falls onto hides the rest). Every grain at a depth y left the edge sqrt(2y/g) seconds ago,
// so the pattern is drawn in that time of leaving: it speeds up as it falls and its clumps draw out into streaks.
// u_span: when sand runs off the edge (from, to); u_size the card's metres; lit by the low sun, glowing when the sun
// is behind it, and by the sky.
const POUR = NOISE + /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let x = in.uv.x * u_size().x;
  let y = in.uv.y * u_size().y;
  let t = u_time();
  let r = t - sqrt(2.0 * max(y, 0.0) / 9.8);
  let on = smoothstep(u_span().x, u_span().x + 0.1, r) * (1.0 - smoothstep(u_span().y - 0.55, u_span().y, r));
  if (on <= 0.0) { return vec4<f32>(0.0); }
  // where along the edge it runs: a few broad falls and many threads, shifting as the drift breaks up
  let along = fbm2(vec2<f32>(x * 5.5 + u_seed(), r * 1.4));
  let thread = fn2(vec2<f32>(x * 38.0 + u_seed() * 3.0, r * 2.0));
  let stream = smoothstep(0.55, 0.72, along) * 0.9 + smoothstep(0.8, 0.93, thread) * 0.45;
  // the grains: clumps in the time they left, so they stretch as they fall faster
  let g1 = fbm2(vec2<f32>(x * 70.0, r * 30.0));
  let g2 = fn2(vec2<f32>(x * 240.0, r * 110.0));
  let grains = smoothstep(0.38, 0.8, g1 * 0.75 + g2 * 0.4);
  let thin = 1.0 / (1.0 + y * 1.1);
  let ends = smoothstep(0.0, 0.03, in.uv.x) * smoothstep(0.0, 0.03, 1.0 - in.uv.x) * smoothstep(0.0, 0.015, y);
  let d = on * stream * grains * thin * ends;
  if (d < 0.004) { return vec4<f32>(0.0); }
  let rd = normalize(in.world_position.xyz - view.world_position.xyz);
  let fw = pow(max(dot(rd, normalize(u_sun().xyz)), 0.0), 4.0);
  let c = u_sand().xyz * (u_sunc().xyz * (1.0 + 2.0 * fw) + u_skyc().xyz);
  let a = clamp(d * 1.7, 0.0, 0.9);
  return vec4<f32>(c * a, a);
}`;
const POUR_W = 2 * DOOR.frame.half_width + 0.04, POUR_H = 2.7;

// ---- the sky and the air ------------------------------------------------------------------------------------------
// Wherever nothing is drawn, the sky at sundown: deep blue overhead going to a pale band at the horizon, peach and gold
// toward the sun, its glow and its disc. Over what is drawn, the air: the far dunes go into the haze of the low sun.
// The doorway shows the next world (drawn there already): left as it is.
const SKY = /* wgsl */ `
fn sky(rd: vec3<f32>, sun: vec3<f32>) -> vec3<f32> {
  let y = max(rd.y, 0.0);
  let s = max(dot(rd, sun), 0.0);
  let zen = vec3<f32>(0.035, 0.13, 0.46);
  let mid = vec3<f32>(0.2, 0.38, 0.78);
  let hor = mix(vec3<f32>(1.02, 0.8, 0.66), vec3<f32>(1.5, 0.92, 0.52), pow(s, 2.2));
  var c = mix(hor, mid, 1.0 - exp(-y * 9.0));
  c = mix(c, zen, smoothstep(0.08, 0.7, y));
  c += vec3<f32>(1.0, 0.55, 0.24) * (pow(s, 10.0) * 0.8 + pow(s, 60.0) * 1.6);
  c += u_sunc().xyz * smoothstep(0.99955, 0.99975, s) * 26.0;
  return c * u_lv().x;
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let c0 = frame(uv);
  let tn = u_eye().w; let asp = u_fwd().w; let fwd = u_fwd().xyz;
  let rd = normalize(fwd + u_right().xyz * (uv.x * 2.0 - 1.0) * tn * asp - u_up().xyz * (uv.y * 2.0 - 1.0) * tn);
  let eye = u_eye().xyz;
  let sun = normalize(u_sun().xyz);
  let d = depth(uv);
  let hit = d > 0.0 && d < 2900.0;
  var dist = 1.0e9;
  if (hit) { dist = d / max(dot(rd, fwd), 0.05); }
  let tp = (u_door().z - eye.z) / rd.z;
  let pp = eye + rd * tp;
  if (tp > 0.0 && abs(pp.x - u_door().x) < u_door().w && abs(pp.y - u_doorh().x) < u_doorh().y && dist > tp - 0.05) { return c0; }
  if (!hit) { return vec4<f32>(sky(rd, sun), c0.a); }
  let k = (1.0 - exp(-dist / 1300.0)) * 0.9;
  let hz = sky(normalize(vec3<f32>(rd.x, 0.02, rd.z)), sun);
  return vec4<f32>(mix(c0.rgb, hz, k), c0.a);
}`;
function Sky({ cam, door }: { cam: Cam; door: { center: V3; half: [number, number] } }) {
  const f = nrm(sub(cam.look, cam.eye)), r = nrm([-f[2], 0, f[0]]), u = cross(r, f);
  return (
    <FramePass wgsl={SKY} prepass at="before-tonemap" uniforms={{
      eye: [...cam.eye, Math.tan((cam.fov * Math.PI) / 360)], fwd: [...f, W / H], right: [...r, 0], up: [...u, 0],
      sun: [...SUN, 0], sunc: [...SUNC, SUN_I], lv: [1.0, 0, 0, 0],
      door: [door.center[0], 0, door.center[2], door.half[0]], doorh: [door.center[1], door.half[1], 0, 0],
    }} />
  );
}

// ---- the dust -----------------------------------------------------------------------------------------------------
/** the dust the falling sand puts up where it lands, along the door's foot, as it comes up; and the leaf's foot's */
function dustOf(T: Times, L: number, t: number): { pour: Puff[]; plough: Puff[] } {
  const pour = Array.from({ length: 8 }, (_, k): Puff => {
    const at = T.pull[0] + 0.25 + 0.16 * k, x = ((k * 0.618) % 1) * 1.5 - 0.75;
    return { at: [x, ground(x, DZ + 0.4) + 0.05, DZ - DOOR.frame.front + 0.18], age: t - at, push: [x * 0.4, 0.8] };
  });
  const plough = Array.from({ length: 8 }, (_, k): Puff => {
    const at = T.door + 0.08 + 0.12 * k, { dir, face } = leafPlan(openAt(T, at, L)), u = 0.45 + 0.065 * k;
    const x = HX + dir[0] * u + face[0] * 0.1, z = HZ + dir[1] * u + face[1] * 0.1;
    return { at: [x, ground(x, z) + 0.05, z], age: t - at, push: face };
  });
  return { pour, plough };
}

/** the sand's heights as drawn: each cell's height averaged with its neighbours' twice over (the simulation's 4 cm steps
 *  and terraces caught the low sun as glitter); the border kept, where it meets the far ground */
function softened(h: Float32Array): Float32Array {
  const { nx, nz } = PATCH;
  let a = h, b = new Float32Array(h.length);
  for (let pass = 0; pass < 2; pass++) {
    b.set(a);
    for (let j = 1; j < nz - 1; j++) for (let i = 1; i < nx - 1; i++) {
      const k = j * nx + i;
      b[k] = (4 * a[k] + a[k - 1] + a[k + 1] + a[k - nx] + a[k + nx]) / 8;
    }
    [a, b] = [b, a];
  }
  return a;
}

/** the patch with a skirt hung 0.4 m down from its border, facing out: the far ground's edge under the patch's border is
 *  ruled straight between a few points, so where the sand bulges there was a sliver of the sunk hole to see through */
function skirted(m: ReturnType<typeof sandMesh>) {
  const { nx, nz } = PATCH;
  const positions = m.positions.slice(), normals = m.normals.slice(), uvs = m.uvs.slice(), indices = m.indices.slice();
  const ring: number[] = [];
  for (let i = 0; i < nx; i++) ring.push(i);                                  // (the far edge, z least)
  for (let j = 1; j < nz; j++) ring.push(j * nx + nx - 1);                    // (the right, x most)
  for (let i = nx - 2; i >= 0; i--) ring.push((nz - 1) * nx + i);             // (the near edge, z most)
  for (let j = nz - 2; j > 0; j--) ring.push(j * nx);                         // (the left)
  const base = positions.length / 3;
  const cx = PATCH.x0 + ((nx - 1) * PATCH.d) / 2, cz = PATCH.z0 + ((nz - 1) * PATCH.d) / 2;
  for (const k of ring) {
    positions.push(m.positions[3 * k], m.positions[3 * k + 1] - 0.4, m.positions[3 * k + 2]);
    const ox = m.positions[3 * k] - cx, oz = m.positions[3 * k + 2] - cz, l = Math.hypot(ox, oz) || 1;
    normals.push(ox / l, 0, oz / l);
    uvs.push(m.uvs[2 * k], m.uvs[2 * k + 1]);
  }
  for (let r = 0; r < ring.length; r++) {
    const a = ring[r], b = ring[(r + 1) % ring.length], a2 = base + r, b2 = base + ((r + 1) % ring.length);
    // (wound to face out: away from the patch's middle)
    const ax = m.positions[3 * a], az = m.positions[3 * a + 2], bx = m.positions[3 * b], bz = m.positions[3 * b + 2];
    const nxv = -(bz - az), nzv = bx - ax;                                    // (a x b's normal for the order a, a2, b)
    const out = nxv * ((ax + bx) / 2 - cx) + nzv * ((az + bz) / 2 - cz) > 0;
    if (out) indices.push(a, a2, b, b, a2, b2); else indices.push(a, b, a2, b, b2, a2);
  }
  return { positions, normals, uvs, indices };
}

// ---- the world ----------------------------------------------------------------------------------------------------
export function DunesWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, L, open } = dunesKeys(s, t);
  const { hand, cam: c } = v;
  const abs = s.from + t;
  const y = yOf(T, t);
  const key = `${T.pull}-${T.door}-${L}`;
  if (!BLADE || BLADE.key !== key) BLADE = { key, blade: doorBlade(T, L) };
  const t0 = T.pull[0] - 0.02;
  // (not lifted: the far ground is sunk out of the way under it, and a lift opened a crack along its edge)
  const patch = skirted(sandMesh(PATCH, softened(sandAt(PATCH, BLADE.blade, t0, Math.max(t, t0))), TILE, 0, 0));
  // the drift on the lintel: it slides off as the door starts to come up (what pours from it is POUR)
  const cap = 1 - smooth(T.pull[0], T.pull[0] + 0.5, t);
  const top = y + DOOR.frame.lintel_top;
  const center: V3 = [0, y + DOOR.opening.top / 2, DZ - 0.03];
  const half: [number, number] = [DOOR.opening.half_width, DOOR.opening.top / 2];
  const dust = dustOf(T, L, t);
  const look: Look = { base: 0, warm: 0.16, sat: 1.06, contrast: 0.62, halation: 0.55, vignette: 0.28 };
  const ev = -0.55;
  const sky: V3 = [0.2, 0.24, 0.32];
  return (
    <AbsoluteFill style={{ background: "#d8a878" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 3000 } }} />
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={0.2} threshold={0.82} />
        <Shadows mapSize={4096} distance={320} firstCascade={7} cascades={4} />
        <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={0.34} rotation={2.4} />
        <AmbientLight color="#86a0d6" brightness={760} />
        <DirectionalLight illuminance={LUX} color="#ffcf9a" shadow_maps_enabled soft_shadow_size={0.25} transform={Transform.fromXyz(SUN[0] * 80, SUN[1] * 80, DZ + SUN[2] * 80).lookingAt([0, 0, DZ])} />
        <Mesh3d name="dunes-far"><BufferMesh {...FAR} /><StandardMaterial {...SAND_MAT} /></Mesh3d>
        <Mesh3d name="dunes-sand"><BufferMesh {...patch} /><StandardMaterial {...SAND_MAT} /></Mesh3d>
        <Model name="door" src={staticFile("models/dunes/door.glb")} position={[0, y, DZ]} animation="open" time={clamp01(open) * 0.999} loop={false} {...({ allowOverlap: true } as object)} />
        <Mesh3d name="lintel-drift" castShadow={false} {...({ allowOverlap: true } as object)} transform={Transform.fromXyz(0, top - 0.004, DZ).withScale([1, Math.max(1e-3, cap), 1])}>
          <BufferMesh {...DRIFT} /><StandardMaterial {...SAND_MAT} />
        </Mesh3d>
        <NoShadowMesh name="pour" shape={{ primitive: "Rectangle", half_size: [POUR_W / 2, POUR_H / 2] }} position={[0, top - POUR_H / 2, DZ - DOOR.frame.front + 0.03]} rotation={[0, 0, 0]} alpha="premultiplied" doubleSided
          wgsl={POUR} uniforms={{ time: t, span: [T.pull[0] + 0.04, T.pull[1] + 0.45], size: [POUR_W, POUR_H], seed: 3.7, sun: [...SUN, 0], sunc: [SUNC[0] * SUN_I * 0.5, SUNC[1] * SUN_I * 0.5, SUNC[2] * SUN_I * 0.5, 0], skyc: [...sky, 0], sand: [...SAND_RGB, 0] }} />
        <Silt name="dust-pour" puffs={dust.pour} cam={c} t={abs} sun={SUN} sunColor={[1.5, 0.8, 0.4]} skyColor={[0.26, 0.19, 0.14]} thick={0.2} />
        <Silt name="dust-plough" puffs={dust.plough} cam={c} t={abs} sun={SUN} sunColor={[1.5, 0.8, 0.4]} skyColor={[0.26, 0.19, 0.14]} thick={0.22} />
        <Portal next={NEXT} abs={abs} center={center} half={half} cam={c} />
        <Sky cam={c} door={{ center, half }} />
        <Hand3D hand={hand} cam={c} ev={ev} />
        <FilmLook look={look} seed={s.f0} cam={c} finish={false} />
        <Doorway next={NEXT} abs={abs} cam={c} center={center} half={half} />
        {!v.portal && <Finish look={look} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}

/** the drift on the lintel, at full: a long low heap along its top, a little over its edges (its own mesh, scaled down
 *  to nothing as it slides off) */
const DRIFT = (() => {
  const nx = 36, nz = 10, hw = DOOR.frame.half_width + 0.02, hd = DOOR.frame.depth / 2 + 0.04;
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
  const hgt = (u: number, w: number) => 0.075 * Math.max(0, 1 - u ** 4) * Math.max(0, 1 - w * w) * (0.8 + 0.2 * Math.sin(u * 7 + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const u = (i / nx) * 2 - 1, w = (j / nz) * 2 - 1, x = u * hw, z = DZ - w * hd;
    positions.push(x, hgt(u, w), -w * hd);
    const e = 0.01, gx = (hgt(u + e, w) - hgt(u - e, w)) / (2 * e * hw), gz = (hgt(u, w + e) - hgt(u, w - e)) / (2 * e * hd), l = Math.hypot(gx, 1, gz);
    normals.push(-gx / l, 1 / l, gz / l);
    uvs.push(x / TILE, z / TILE);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    indices.push(a, b, c, b, d, c);
  }
  return { positions, normals, uvs, indices };
})();
