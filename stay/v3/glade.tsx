// The glade: a dense forest floor in morning light, in the road's old slot (song 56.63-63.16), three shots of one place
// getting wider until the dock. the director, 11-12: "forest logs fauna moss mushrooms ferns maybe then a close up of water
// droplets form the edge of the fern. maybe start with the ferm and then cut to the wider shot and then an even wider
// shot then the dock", "should be a super dense scene".
//   fern   56.63-58.49  a fern's frond edge from a hand's width, water hanging at its leaflets' tips, one letting go
//   floor  58.49-60.06  the floor from knee height: a mossy fallen log, sulphur tufts and bonnets on it, ferns past it
//   wide   60.06-63.16  (on the song's strongest hit) the glade from the edge of the trees, sun shafts through the firs
// The things are scans (Poly Haven, CC0; blender/glade.py, media/models/glade) and the firs and saplings are the forest
// kit's (blender/forest.py); the mushrooms are modelled (glade.py). The moss is Moss 01's scanned clumps by the
// thousand over the log, the stump, the rocks and the floor, where glade.py's skins say each faces up.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, DepthOfField, Environment, FogVolume, Instances, Model, ShaderMesh, Shadows, ToneMapping, VolumetricFog } from "raea/3d";
import type { Instance } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight, SolariLighting } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { clamp01, ease, type V3 } from "../v2/math";
import FLOOR from "../media/models/glade/floor-height.json";
import LOG_SKIN from "../media/models/glade/log-skin.json";
import STUMP_SKIN from "../media/models/glade/stump-skin.json";
import ROCKS_SKIN from "../media/models/glade/rocks-skin.json";
import TIPS from "../media/models/glade/fern-hero-tips.json";
import type { ReactNode } from "react";
import { FilmLook } from "./look";

export const FERN_LEN = 56, FLOOR_LEN = 47, WIDE_LEN = 93;

const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 233.1 + 0.37) * 43758.5453; return x - Math.floor(x); };
const norm = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** a frame's Euler angles for raea's rotation (Rx * Ry * Rz), from its axes */
function euler(xa: V3, ya: V3, za: V3): V3 {
  const s = Math.max(-1, Math.min(1, za[0]));
  return [Math.atan2(-za[1], za[2]), Math.asin(s), Math.atan2(-ya[0], xa[0])];
}
/** the rotation standing a thing's +y on n, turned `yaw` about it */
function onNormal(n: V3, yaw: number): V3 {
  const ya = norm(n);
  const ref: V3 = Math.abs(ya[1]) > 0.9 ? [Math.cos(yaw), 0, Math.sin(yaw)] : [0, 1, 0];
  let xa = norm(cross(ya, ref));
  if (Math.abs(ya[1]) <= 0.9) { const c = Math.cos(yaw), s = Math.sin(yaw), za0 = cross(xa, ya); xa = norm(add([xa[0] * c, xa[1] * c, xa[2] * c], [za0[0] * s, za0[1] * s, za0[2] * s])); }
  const za = cross(xa, ya);
  return euler(xa, ya, za);
}

// ---- the ground: glade.py's floor, 8 x 8 m, its heights every 5 cm ------------------------------------------------
const F = FLOOR as { size: number; n: number; step: number; y: number[] };
export function floorY(x: number, z: number) {
  const fx = (x + F.size / 2) / F.step, fz = (z + F.size / 2) / F.step;
  const i = Math.max(0, Math.min(F.n - 2, Math.floor(fx))), j = Math.max(0, Math.min(F.n - 2, Math.floor(fz)));
  const u = clamp01(fx - i), v = clamp01(fz - j), at = (a: number, b: number) => F.y[b * F.n + a];
  return (at(i, j) * (1 - u) + at(i + 1, j) * u) * (1 - v) + (at(i, j + 1) * (1 - u) + at(i + 1, j + 1) * u) * v;
}

// ---- where the big things stand (x, z, yaw; y from the floor) ------------------------------------------------------
type Place = { at: V3; yaw: number; scale?: number };
const stand = (x: number, z: number, yaw: number, sink = 0, scale = 1): Place => ({ at: [x, floorY(x, z) - sink, z], yaw, scale });
const LOG = stand(-0.1, -0.55, 0.32, 0.06);
const STUMP = stand(-1.75, -1.7, 1.1, 0.05);
const ROCKS = stand(1.4, -3.4, -0.25, 0.25, 0.8);
const ROOTS = stand(2.1, -1.6, 2.4, 0.12, 0.7);
/** a point of a thing's own space (glade.py's skins) where the thing stands */
function placed(p: Place, q: V3): V3 {
  const c = Math.cos(p.yaw), s = Math.sin(p.yaw), k = p.scale ?? 1;
  return [p.at[0] + k * (q[0] * c + q[2] * s), p.at[1] + k * q[1], p.at[2] + k * (-q[0] * s + q[2] * c)];
}
function turned(p: Place, n: V3): V3 {
  const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  return [n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c];
}
type Skin = { up: number[][]; side: number[][] };
const skinOf = (s: Skin, p: Place, kind: "up" | "side") => s[kind].map((r) => ({ p: placed(p, [r[0], r[1], r[2]]), n: turned(p, [r[3], r[4], r[5]]) }));

const LOG_UP = skinOf(LOG_SKIN as Skin, LOG, "up"), STUMP_UP = skinOf(STUMP_SKIN as Skin, STUMP, "up");

// ---- the ferns: the hero (the close-up's) in front of the log, then dozens round the glade, densest at its edges -----
const CAM_WIDE0: V3 = [3.6, 1.45, 6.6], CAM_WIDE1: V3 = [4.3, 2.3, 8.6], WIDE_LOOK: V3 = [-0.1, 0.35, -0.9];
const HERO: Place = stand(0.62, 0.42, 2.5, 0.01, 1.25);
type Fern = Instance & { kind: number };
const FLOOR_EYE: V3 = add(LOG.at, [-0.45, 0.28, 1.1]);
/** clear of a camera's line to what it looks at, within `room` of it (metres) */
const clearOf = (eye: V3, at: V3, x: number, z: number, room: number) => {
  const dx = at[0] - eye[0], dz = at[2] - eye[2], L2 = dx * dx + dz * dz, t = clamp01(((x - eye[0]) * dx + (z - eye[2]) * dz) / L2);
  return Math.hypot(x - (eye[0] + dx * t), z - (eye[2] + dz * t)) > room;
};
/** clumps of ferns: 90 clump middles over the glade and out into the trees, each 3-12 ferns */
const FERNS: Fern[] = (() => {
  const out: Fern[] = [];
  for (let c = 0; c < 110; c++) {
    const a = 6.28 * rnd(c, 111), r = 0.9 + 9.0 * rnd(c, 112) ** 0.9;
    const cx = 0.2 + r * Math.cos(a), cz = -0.9 + 0.9 * r * Math.sin(a), n = 3 + Math.floor(10 * rnd(c, 115));
    for (let j = 0; j < n; j++) {
      const i = c * 31 + j, x = cx + 0.9 * (rnd(i, 116) - 0.5) * (1 + r / 8), z = cz + 0.9 * (rnd(i, 117) - 0.5) * (1 + r / 8);
      if (Math.hypot(x - HERO.at[0], z - HERO.at[2]) < 0.45) continue;                          // (the hero's own room)
      if (!clearOf(FLOOR_EYE, LOG.at, x, z, 0.35)) continue;                                   // (the floor shot's view in)
      if (Math.hypot(x - CAM_WIDE1[0], z - CAM_WIDE1[2]) < 1.2 || !clearOf(CAM_WIDE1, [LOG.at[0], 0, LOG.at[2] + 0.6], x, z, 0.25 + 0.12 * Math.hypot(x - LOG.at[0], z - LOG.at[2]) * 0)) { if (Math.hypot(x - LOG.at[0], z - LOG.at[2]) < 4.5) continue; }
      if (Math.abs(z - LOG.at[2] + 0.33 * (x - LOG.at[0])) < 0.2 && Math.abs(x - LOG.at[0]) < 1.6) continue;   // (not through the log)
      out.push({ kind: i % 3, position: [x, (Math.abs(x) < 3.9 && Math.abs(z) < 3.9 ? floorY(x, z) : 0) - 0.01, z], rotation: [0, 6.28 * rnd(i, 113), 0], scale: 0.75 + 0.7 * rnd(i, 114) });
    }
  }
  return out;
})();
const FERN_SET = [0, 1, 2].map((k) => FERNS.filter((f) => f.kind === k).map(({ kind: _, ...f }) => f as Instance));

// ---- the forest round the glade: firs and saplings out to 45 m, none in the wide's view in -----------------------
function inView(x: number, z: number, room: number) {
  // the corridor from the wide's camera to the glade
  const a = CAM_WIDE1, b = WIDE_LOOK, dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz);
  const t = clamp01(((x - a[0]) * dx + (z - a[2]) * dz) / (L * L));
  return Math.hypot(x - (a[0] + dx * t), z - (a[2] + dz * t)) < room;
}
type Tree = Instance & { kind: number };
const TREES: Tree[] = (() => {
  const out: Tree[] = [];
  for (let i = 0; out.length < 280 && i < 8000; i++) {
    const a = 6.28 * rnd(i, 121), r = 3.4 + 27 * rnd(i, 122) ** 1.25;
    const x = r * Math.cos(a), z = -1 + r * Math.sin(a);
    if (inView(x, z, 1.6 + 0.08 * r) && Math.hypot(x, z + 1) < 14) continue;
    if (out.some((t) => Math.hypot(t.position[0] - x, t.position[2] - z) < 1.7)) continue;
    out.push({ kind: r < 9 ? (i % 2) : 1, position: [x, -0.08, z], rotation: [0, 6.28 * rnd(i, 123), 0], scale: 0.85 + 0.35 * rnd(i, 124) });
  }
  return out;
})();
/** the far wall: firs from 30 to 75 m all round, so the wide's horizon is trees going into the haze, not the sky's */
for (let i = 0; i < 700; i++) {
  const a = 6.28 * rnd(i, 171), r = 30 + 45 * Math.sqrt(rnd(i, 172));
  TREES.push({ kind: 1, position: [r * Math.cos(a), -0.17, -1 + r * Math.sin(a)], rotation: [0, 6.28 * rnd(i, 173), 0], scale: 0.9 + 0.4 * rnd(i, 174) });
}
const FIRS = [0, 1].map((k) => TREES.filter((t) => t.kind === k).map(({ kind: _, ...t }) => t as Instance));
const SAPLINGS: Instance[] = Array.from({ length: 26 }, (_, i) => {
  const a = 6.28 * rnd(i, 131), r = 2.8 + 9 * rnd(i, 132);
  const x = r * Math.cos(a), z = -1 + r * Math.sin(a);
  return inView(x, z, 1.4) ? null : { position: [x, -0.06, z] as V3, rotation: [0, 6.28 * rnd(i, 133), 0] as V3, scale: 0.6 + 0.6 * rnd(i, 134) };
}).filter((x): x is Instance => !!x);
/** the floor's 8 m square again all round it (turned, so it doesn't read as a tile), 2 cm lower */
const FLOOR_ROUND: Instance[] = [-2, -1, 0, 1, 2].flatMap((i) => [-2, -1, 0, 1, 2].filter((j) => i || j).map((j) => ({ position: [8 * i, -0.02, 8 * j] as V3, rotation: [0, (Math.PI / 2) * ((i + 2 * j + 4) % 4), 0] as V3, scale: 1 })));
// ---- the ground cover, Brushify's way: layer over layer of scanned plants, stones and sticks, each where its noise
// says, so the floor's own picture shows only in the gaps ------------------------------------------------------------
/** the ground's height anywhere: the glade's floor, or the copy of it round it that (x, z) falls in (FLOOR_ROUND) */
export function groundY(x: number, z: number) {
  const i = Math.round(x / 8), j = Math.round(z / 8);
  if (!i && !j) return floorY(x, z);
  if (Math.abs(i) > 2 || Math.abs(j) > 2) return -0.165;   // (the far ground's top)
  const r = (Math.PI / 2) * ((i + 2 * j + 4) % 4), lx = x - 8 * i, lz = z - 8 * j, c = Math.cos(r), s = Math.sin(r);
  return floorY(lx * c - lz * s, lx * s + lz * c) - 0.02;
}
/** smooth value noise, 0..1 */
function vnoise(x: number, z: number, seed: number) {
  const h = (a: number, b: number) => rnd(a * 157 + b * 311 + seed * 7, seed);
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return (h(xi, zi) * (1 - u) + h(xi + 1, zi) * u) * (1 - v) + (h(xi, zi + 1) * (1 - u) + h(xi + 1, zi + 1) * u) * v;
}
const GLADE_MID: V3 = [0, 0, -0.8];
/** the room every layer leaves: the log, the hero fern, the near shots' lines of sight (for things taller than `tall`) */
function free(x: number, z: number, h: number) {
  if (Math.abs(z - LOG.at[2] + 0.33 * (x - LOG.at[0])) < 0.17 && Math.abs(x - LOG.at[0]) < 1.6) return false;
  if (Math.hypot(x - HERO.at[0], z - HERO.at[2]) < (h > 0.08 ? 0.4 : 0.25)) return false;
  if (Math.hypot(x - STUMP.at[0], z - STUMP.at[2]) < 0.65) return false;
  if (h > 0.12 && !clearOf(FLOOR_EYE, LOG.at, x, z, 0.3)) return false;
  if (h > 0.3 && Math.hypot(x - CAM_WIDE0[0], z - CAM_WIDE0[2]) < 1.5) return false;
  return true;
}
type Layer = { name: string; files: string[]; n: number; r: number; rmin?: number; size: [number, number]; h: number; scale: [number, number]; seed: number; mask: (x: number, z: number) => number; shadow?: boolean };
function scatterLayer(L: Layer): Instance[][] {
  const out: Instance[][] = L.files.map(() => []);
  for (let i = 0; i < L.n * 3 && out.reduce((a, b) => a + b.length, 0) < L.n; i++) {
    const a = 6.28 * rnd(i, L.seed), r0 = L.rmin ?? 0, r = Math.sqrt(r0 * r0 + (L.r * L.r - r0 * r0) * rnd(i, L.seed + 1));
    const x = GLADE_MID[0] + r * Math.cos(a), z = GLADE_MID[2] + r * Math.sin(a);
    if (rnd(i, L.seed + 2) > L.mask(x, z)) continue;
    const k = L.scale[0] + (L.scale[1] - L.scale[0]) * rnd(i, L.seed + 3);
    if (!free(x, z, L.h * k)) continue;
    const f = Math.floor(rnd(i, L.seed + 4) * L.files.length);
    out[f].push({ position: [x, groundY(x, z) - 0.008, z], rotation: [0.12 * (rnd(i, L.seed + 5) - 0.5), 6.28 * rnd(i, L.seed + 6), 0.12 * (rnd(i, L.seed + 7) - 0.5)], scale: k });
  }
  return out;
}
const N = (x: number, z: number, f: number, seed: number) => vnoise(x * f, z * f, seed);
const nearLog = (x: number, z: number) => Math.exp(-Math.hypot(x - LOG.at[0], (z - LOG.at[2]) * 2.5) / 1.6);
const files = (base: string, n: number) => Array.from({ length: n }, (_, i) => `${base}-${i + 1}`);
const LAYERS: Layer[] = [
  // wood sorrel: the carpet, everywhere but thickest in the shade by the log and in drifts
  { name: "sorrel", files: files("sorrel", 4), n: 26000, r: 7, size: [0, 0], h: 0.06, scale: [1.3, 2.4], seed: 200, mask: (x, z) => 0.35 + 0.65 * Math.max(nearLog(x, z), N(x, z, 1.3, 1) ** 1.5) },
  { name: "celandine", files: files("celandine", 5), n: 3200, r: 8, size: [0, 0], h: 0.17, scale: [0.8, 1.3], seed: 210, mask: (x, z) => clamp01((N(x, z, 0.8, 2) - 0.45) * 3) },
  { name: "periwinkle", files: files("periwinkle", 4), n: 2200, r: 8, size: [0, 0], h: 0.3, scale: [0.7, 1.1], seed: 220, mask: (x, z) => clamp01((N(x, z, 0.6, 3) - 0.5) * 3) },
  { name: "grass", files: [...files("grass", 8), ...files("grass2", 5)], n: 16000, r: 26, size: [0, 0], h: 0.25, scale: [0.8, 1.4], seed: 230, mask: (x, z) => clamp01((N(x, z, 0.35, 4) - 0.35) * 2.5) * (1 - 0.7 * nearLog(x, z)) },
  { name: "weed", files: files("weed", 4), n: 1600, r: 9, size: [0, 0], h: 0.07, scale: [0.9, 1.4], seed: 240, mask: (x, z) => 0.3 + 0.5 * N(x, z, 1.1, 5) },
  { name: "nettle", files: files("nettle", 3), n: 500, r: 10, size: [0, 0], h: 0.19, scale: [1.2, 2.2], seed: 250, mask: (x, z) => clamp01((N(x, z, 0.5, 6) - 0.55) * 4) },
  { name: "dandelion", files: files("dandelion", 3), n: 200, r: 10, size: [0, 0], h: 0.16, scale: [0.9, 1.2], seed: 260, mask: (x, z) => clamp01((N(x, z, 0.4, 7) - 0.6) * 4) },
  { name: "saplings", files: [...files("pine-small", 3), ...files("fir-small", 2)], n: 420, r: 34, size: [0, 0], h: 1.2, scale: [0.7, 1.5], seed: 270, mask: (x, z) => Math.hypot(x, z + 0.8) > 2.2 ? 0.8 : 0, shadow: true },
  { name: "stones", files: ["stone-1", "rock7-1", "rock9-1"], n: 500, r: 9, size: [0, 0], h: 0.1, scale: [0.6, 1.8], seed: 280, mask: (x, z) => 0.2 + 0.6 * N(x, z, 0.9, 8), shadow: true },
  { name: "debris", files: files("debris", 4), n: 700, r: 10, size: [0, 0], h: 0.2, scale: [0.4, 0.9], seed: 290, mask: () => 0.7, shadow: true },
  // out past the glade to the haze: the same floor, thinned to the cheap plants and bigger ferns, so it never just stops
  { name: "far-ferns", files: ["fern-b", "fern-c", "fern-d"], n: 9000, rmin: 7, r: 48, size: [0, 0], h: 0.4, scale: [0.9, 1.6], seed: 310, mask: (x, z) => 0.45 + 0.55 * N(x, z, 0.25, 9) },
  { name: "far-grass", files: ["grass-4", "grass-6", "grass-7", "grass-8", "grass2-1", "weed-3", "weed-4"], n: 60000, rmin: 10, r: 52, size: [0, 0], h: 0.15, scale: [1.0, 1.8], seed: 320, mask: (x, z) => 0.5 + 0.5 * N(x, z, 0.3, 10) },
  { name: "far-saplings", files: [...files("pine-small", 3), ...files("fir-small", 2)], n: 900, rmin: 14, r: 60, size: [0, 0], h: 1.2, scale: [0.8, 1.8], seed: 330, mask: () => 0.8, shadow: true },
  { name: "root", files: ["root-1"], n: 26, r: 9, size: [0, 0], h: 0.3, scale: [0.6, 1.1], seed: 300, mask: () => 0.6, shadow: true },
];
const COVER = LAYERS.map((L) => ({ L, sets: scatterLayer(L) }));
const BRANCHES: Instance[] = [[0.9, -0.1, 0.4], [-1.2, 0.5, 2.1], [1.9, -2.4, 4.0], [-2.6, -0.6, 1.0], [0.3, -2.6, 5.2]].map(([x, z, yaw]) => ({ position: [x, floorY(x, z) - 0.02, z] as V3, rotation: [0, yaw, 0] as V3, scale: 0.9 }));

// ---- water on the hero frond: drops hanging at its lowest tips, the camera's cluster ------------------------------
const TIP_W = (TIPS as number[][]).map((q) => placed(HERO, [q[0], q[1], q[2]]));
/** the tips the close-up sees: the frond-tip cluster nearest the fern shot's side (+x, +z), high enough to hang free */
const ANCHOR = TIP_W.filter((p) => p[1] - HERO.at[1] > 0.12).sort((a, b) => (b[2] + 0.6 * b[0]) - (a[2] + 0.6 * a[0]))[0] ?? TIP_W[0];
const HANG = TIP_W.filter((p) => Math.hypot(p[0] - ANCHOR[0], p[1] - ANCHOR[1], p[2] - ANCHOR[2]) < 0.07).slice(0, 12);
const DROP_WGSL = /* wgsl */ `
fn hs(n: f32) -> f32 { return fract(sin(n * 127.1 + 17.3) * 43758.5453); }
fn vn(x: f32) -> f32 { let i = floor(x); let f = fract(x); return mix(hs(i), hs(i + 1.0), f * f * (3.0 - 2.0 * f)); }
fn wood(d0: vec3<f32>) -> vec3<f32> {
  let d = normalize(d0); let az = atan2(d.x, -d.z);
  var c = vec3<f32>(0.78, 0.86, 0.72) * mix(0.8, 1.4, clamp(d.y, 0.0, 1.0));
  let trunk = smoothstep(0.62, 0.72, vn(az * 18.0 + 3.0));
  if (d.y > -0.05) { c = mix(c, vec3<f32>(0.05, 0.045, 0.035), trunk * 0.9); }
  if (d.y > 0.35) { c = mix(c, vec3<f32>(0.08, 0.14, 0.05), 0.75 * vn(az * 9.0 + d.y * 14.0)); }
  if (d.y < -0.05) { c = vec3<f32>(0.07, 0.11, 0.035) * (0.6 + 0.8 * vn(az * 31.0)); }
  return c * u_light().x;
}
fn shade(in: VertexOutput) -> vec4<f32> {
  let P = in.world_position.xyz; let N = normalize(in.world_normal); let V = normalize(view.world_position - P);
  let L = normalize(u_sun().xyz); let sun = vec3<f32>(1.0, 0.88, 0.7) * u_light().y;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
  let B = -V; let lat = N - dot(N, B) * B;
  // (through the drop the glade turns over: its bright canopy at the drop's foot, the dark floor at its top)
  var inside = wood(B - 2.4 * lat) * vec3<f32>(0.92, 1.0, 0.92);
  inside *= smoothstep(0.04, 0.45, nv);
  inside += sun * 1.2 * pow(max(dot(N, normalize(-L + 0.6 * V)), 0.0), 8.0);
  let R = reflect(-V, N);
  let col = mix(inside, wood(R), F) + sun * 60.0 * pow(max(dot(R, L), 0.0), 900.0) + sun * 1.2 * pow(max(dot(R, L), 0.0), 40.0);
  return vec4<f32>(col, 1.0);
}`;
type Drop = { position: V3; scale: V3 };
/** each tip's drop swelling; the anchor's lets go at 1.15 s and falls, a new bead starting in its place */
function drops(t: number): Drop[] {
  return HANG.map((p, i) => {
    const r0 = 0.0019 + 0.0011 * rnd(i, 151);
    if (i === 0) {
      const go = 1.15;
      if (t < go) { const r = r0 * (0.85 + 0.35 * clamp01(t / go)); return { position: add(p, [0, -0.85 * r - 0.0006 * clamp01(t / go), 0]), scale: [r, r * (1.1 + 0.25 * clamp01((t - go + 0.3) / 0.3)), r] }; }
      const s = t - go, r = r0 * 1.2, fall = 0.5 * 9.81 * s * s;
      return { position: add(p, [0, -r - fall, 0]), scale: [r * 0.92, r * (1.35 - 0.3 * clamp01(s / 0.1)), r * 0.92] };
    }
    const r = r0 * (0.9 + 0.12 * clamp01(t / 1.8));
    return { position: add(p, [0, -0.85 * r, 0]), scale: [r, r * 1.12, r] };
  });
}
const SUN: V3 = norm([-0.6, 0.2, -0.77]);   // (toward the sun: a dozen degrees up, behind the glade and to the left, so the ferns and moss are lit through and rimmed, and the wide can turn into it)
const LIGHT: [number, number] = [0.6, 1.4];
function Water({ t }: { t: number }) {
  const at = drops(t);
  const second = t > 1.15 ? [{ position: add(HANG[0], [0, -0.0011 * clamp01((t - 1.15) / 0.6), 0]) as V3, scale: [0.001 * clamp01((t - 1.15) / 0.6) + 0.0003, 0.0012 * clamp01((t - 1.15) / 0.6) + 0.0003, 0.001 * clamp01((t - 1.15) / 0.6) + 0.0003] as V3 }] : [];
  return <>{[...at, ...second].map((d, i) => <ShaderMesh key={i} name={`fern-drop-${i}`} shape={{ primitive: "Sphere", radius: 1 }} position={d.position} scale={d.scale} wgsl={DROP_WGSL} uniforms={{ sun: [...SUN, 0], light: [...LIGHT, 0, 0] }} />)}</>;
}

// ---- the set ---------------------------------------------------------------------------------------------------
const M = (f: string) => staticFile(`models/glade/${f}.glb`);
const lap = { allowOverlap: true } as object;
function Glade({ near, drift = 0 }: { near: boolean; /** seconds of the air's drift (the fog banks move on it) */ drift?: number }) {
  return (
    <>
      {/* (an overcast morning in thick fog, not the low sun: the director, 11-12, "instead of the sunlight is just a dense foggy
          atmosphere it will cover some fo the flows of the scene and ahev it lit more moody". The light is the sky's,
          soft and from above; a weak high key only to give the trunks a side; the fog swallows the forest within 20 m) */}
      {/* (and the fog with body, the director, 11-12: "i was hoping for volumetric fog". The even haze read as a flat grey, so
          over a thinner haze for the distance there are banks of it (media/fog/glade.ktx2, tools/fog-noise.ts), thickest
          on the ground, drifting on a slow air, with a high cool light behind the trees cutting shafts through them) */}
      <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={0.6} rotation={0} background />
      <AmbientLight color="#000000" brightness={0} />
      <DirectionalLight illuminance={30000} color="#e2e9ea" volumetric shadow_maps_enabled soft_shadow_size={0.8} transform={Transform.fromXyz(-12, 16, -40).lookingAt([0, 0, 0])} />
      <VolumetricFog ambient={0.1} />
      <FogVolume name="air" position={[0, 7, -2]} scale={[170, 16, 170]} density={near ? 0.008 : 0.012} color="#b9c4bd" scattering={0.85} absorption={0.015} anisotropy={0.6} />
      <FogVolume name="banks" position={[0.35 * drift, 5, -2 + 0.12 * drift]} scale={[70, 14, 70]} density={near ? 0.06 : 0.09} color="#c4cec8" scattering={0.9} absorption={0.01} anisotropy={0.6} density_texture={staticFile("fog/glade.ktx2")} />
      <Instances name="floor-round" src={M("floor")} at={FLOOR_ROUND} {...lap}><StandardMaterial perceptual_roughness={1} reflectance={0.08} /></Instances>
      <Model name="floor" src={M("floor")} {...lap}><StandardMaterial perceptual_roughness={1} reflectance={0.08} /></Model>
      {/* (the far floor darker and fully rough: at a grazing angle its sheen went white, a frozen lake in the haze) */}
      <Model name="far-ground" src={staticFile("models/forest/ground.glb")} position={[0, -0.12, 0]} scale={[2, 1, 2]} {...lap}><StandardMaterial base_color="#4a4632" perceptual_roughness={1} reflectance={0.05} /></Model>
      <Model name="log" src={M("log")} position={LOG.at} rotation={[0, LOG.yaw, 0]} {...lap} />
      <Model name="log-moss" src={M("log-moss")} position={LOG.at} rotation={[0, LOG.yaw, 0]} {...lap} />
      <Model name="stump-moss" src={M("stump-moss")} position={STUMP.at} rotation={[0, STUMP.yaw, 0]} {...lap} />
      <Model name="rocks-moss" src={M("rocks-moss")} position={ROCKS.at} rotation={[0, ROCKS.yaw, 0]} scale={ROCKS.scale} {...lap} />
      <Model name="stump" src={M("stump")} position={STUMP.at} rotation={[0, STUMP.yaw, 0]} {...lap} />
      <Model name="rocks" src={M("rocks")} position={ROCKS.at} rotation={[0, ROCKS.yaw, 0]} scale={ROCKS.scale} {...lap} />
      <Model name="roots" src={M("roots")} position={ROOTS.at} rotation={[0, ROOTS.yaw, 0]} scale={ROOTS.scale} {...lap} />
      {/* (lit through from behind as a frond is: green where the sun comes through, not black) */}
      <Model name="fern-hero" src={M("fern-hero")} position={HERO.at} rotation={[0, HERO.yaw, 0]} scale={HERO.scale} {...lap}><StandardMaterial diffuse_transmission={0.65} /></Model>
      {["fern-b", "fern-c", "fern-d"].map((f, k) => <Instances key={f} name={`ferns-${k}`} src={M(f)} at={FERN_SET[k]} {...lap} />)}
      {COVER.flatMap(({ L, sets }) => sets.map((at, k) => (at.length ? <Instances key={`${L.name}-${k}`} name={`${L.name}-${L.files[k]}`} src={M(L.files[k])} at={at} shadow={!!L.shadow} {...lap} /> : null)))}
      <Instances name="firs-b" src={staticFile("models/forest/fir-b.glb")} at={FIRS[0]} {...lap} />
      <Instances name="firs-c" src={staticFile("models/forest/fir-c.glb")} at={FIRS[1]} {...lap} />
    </>
  );
}

type Shot = { eye: V3; look: V3; fov: number; f: number; focus?: number; exposure: number; fog?: boolean; bloom?: number };
function Frame({ s, children, near, seed, t = 0, solari = true }: { s: Shot; children?: ReactNode; near: boolean; seed: number; t?: number; /** ray traced (Solari); off where a ShaderMesh is in the scene (the fern's drops): Solari's prepass refuses a ShaderMesh's pipeline */ solari?: boolean }) {
  const focus = s.focus ?? Math.hypot(s.eye[0] - s.look[0], s.eye[1] - s.look[1], s.eye[2] - s.look[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...s.eye).lookingAt(s.look)} projection={{ Perspective: { fov: (s.fov * Math.PI) / 180, near: near ? 0.01 : 0.05, far: 180 } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={s.f} max_circle_of_confusion_diameter={near ? 60 : 30} mode={"Bokeh" as never} />
          {/* (ray traced: the bounce under the canopy, the sky shut out by the trees, the director, 11-12: "volumetric light with fog ... we arent using solari") */}
          {solari && <SolariLighting bounces={2} />}
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={s.exposure} />
        <Bloom intensity={s.bloom ?? 0.18} threshold={0.9} />
        <Shadows mapSize={8192} distance={near ? 6 : 40} firstCascade={near ? 0.6 : 3} cascades={near ? 3 : 4} normalBias={2} />
        <Glade near={near} drift={t} />
        {children}
        <FilmLook look={{ base: 0, warm: 0.25, sat: 1.15, contrast: 0.65, halation: 0.5, vignette: 0.3 }} seed={seed} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

/** 56.63: the frond's edge from a hand's width, the drops in focus, the log and its mushrooms soft behind */
export function FernShot({ t }: { t: number }) {
  const k = ease(clamp01(t / (FERN_LEN / 30)));
  // (from the frond's side, a hand's width off, looking across its edge toward the sun: the drops backlit, the leaflets
  // running across the frame, the glade soft behind)
  const d = norm([ANCHOR[0] - HERO.at[0], 0, ANCHOR[2] - HERO.at[2]]);
  let side: V3 = [-d[2], 0, d[0]];
  if (side[2] < 0) side = [-side[0], 0, -side[2]];
  const look = add(ANCHOR, [-0.03 * d[0], -0.008, -0.03 * d[2]]);
  const dist = 0.17 - 0.03 * k;
  const eye = add(look, [side[0] * dist + 0.02 * d[0], 0.035, side[2] * dist + 0.02 * d[2]]);
  return <Frame s={{ eye, look, fov: 30, f: 4, exposure: 1.2 }} near seed={1911} t={t}><Water t={t} /></Frame>;
}
/** 58.49: the floor from knee height, sliding along the log */
export function FloorShot({ t }: { t: number }) {
  const k = ease(clamp01(t / (FLOOR_LEN / 30)));
  const look: V3 = add(LOG.at, [0.1 - 0.12 * k, 0.12, 0.08]);
  const eye: V3 = add(FLOOR_EYE, [-0.18 * k, 0.02 * k, -0.06 * k]);
  return <Frame s={{ eye, look, fov: 40, f: 4, exposure: 1.1 }} near seed={1913} t={t} />;
}
/** the wide's truck left, metres a second (v3/film.tsx's tree wipe and the dock's truck go at this speed's look) */
export const TRUCK = 0.9;
/** 60.06, the hit: the glade from the trees' edge, trucking left */
export function WideShot({ t }: { t: number }) {
  // (rising back over the glade, then in its last 1.4 s turning up into the sun through the trunks, the glare blooming
  // to white: the cut to the dock comes out of it. the director, 11-12: "have the wide be more looking into the sun so that the
  // sun glare causes the transition to the dock")
  // Now (the director, 11-12): "we truck left and then cross a tree in the foreground that masks a transiton to truck left into
  // the dock scene". The lens slides left along the glade's edge at one speed, already moving at the cut in; the tree
  // that crosses the lens over the cut is v3/film.tsx's (treeWipe), over the end of this and the dock's start.
  const T = WIDE_LEN / 30, u = clamp01(t / T);
  const f = norm([WIDE_LOOK[0] - CAM_WIDE0[0], 0, WIDE_LOOK[2] - CAM_WIDE0[2]]), right: V3 = [-f[2], 0, f[0]];
  const slide = -TRUCK * (u - 0.5) * T;                                      // metres along `right` (negative: left)
  const eye = add(CAM_WIDE0, [right[0] * slide, 0.15, right[2] * slide]);
  const look = add(WIDE_LOOK, [right[0] * slide, 0.15, right[2] * slide]);
  return <Frame s={{ eye, look, fov: 42, f: 8, exposure: 1.6 }} near={false} seed={1917} t={t} />;
}

/** (a look at the hero fern from half a metre, its drops at the tips, to frame the close-up by) */
export function FernSurvey({ t }: { t: number }) {
  const eye = add(HERO.at, [0.25 + 0.0 * t, 0.55, 0.55]);
  return <Frame s={{ eye, look: add(HERO.at, [0, 0.12, 0]), fov: 50, f: 16, exposure: 0.8 }} near seed={1} solari={false}><Water t={0.5} />{TIP_W.map((p, i) => <ShaderMesh key={i} name={`tip-${i}`} shape={{ primitive: "Sphere", radius: 1 }} position={p} scale={p === ANCHOR ? 0.012 : 0.004} wgsl={p === ANCHOR ? "fn shade(in: VertexOutput) -> vec4<f32> { return vec4<f32>(8.0, 0.0, 0.0, 1.0); }" : "fn shade(in: VertexOutput) -> vec4<f32> { return vec4<f32>(0.0, 3.0, 8.0, 1.0); }"} />)}</Frame>;
}
