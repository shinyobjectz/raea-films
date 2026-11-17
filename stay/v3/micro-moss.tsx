// The micro shots in the road's slot, before the wide on the song's hit (60.06): an oak's bark, then a boulder's crack,
// each a scan (blender/micro.py, real furrows and cracks that throw shadows) seen from a few centimetres, moss on them
// and water moving over them. the director, 11-12: "a ghigh res tree and have a super closeup of the bark or something with
// moss ... maybe something like rock with moss after that"; then "add some water effects like droplets or something to
// also give some physics. maybe keep the moss stationary or have the water just interact with it"; and "make sure
// backgrounds feel environmental to a forrest or to the lgihting not just black" (the forest past them is the
// Environment's, sunset_forest, out of focus; the trunk and boulder go on past the scans, TRUNK and BOULDER below).
// The moss is Poly Haven's scanned shoots (Moss 01, media/micro/moss-atlas.png), each a pair of crossed cards, still,
// where the scan is mossiest (the bark's furrows, the rock's crack), some holding a bead at the tip; water moves it.
//   bark  56.63-58.49: up an oak's trunk in low morning light raking across it, drops running down its furrows
//   rock  58.49-60.06: over the boulder's top, the forest past it, rain landing and splashing, the moss bouncing
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, DepthOfField, Environment, Instances, Model, ShaderMesh, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { BufferMesh, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import BARK from "../media/models/micro/bark-field.json";
import ROCK from "../media/models/micro/rock-field.json";
import { FilmLook } from "./look";

type Field = { w: number; h: number; p: number[]; n: number[]; green: number[]; lum: number[] };
const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 233.1 + 0.37) * 43758.5453; return x - Math.floor(x); };
const norm = (v: V3): V3 => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** a frame's Euler angles for raea's rotation (X then Y then Z composed, Rx * Ry * Rz), from its axes */
function euler(xa: V3, ya: V3, za: V3): V3 {
  const s = Math.max(-1, Math.min(1, za[0]));
  return [Math.atan2(-za[1], za[2]), Math.asin(s), Math.atan2(-ya[0], xa[0])];
}

// ---- the shoots: their boxes in the 2048 atlas (tools/micro-tex.sh), each a pair of crossed cards a unit tall -------
const BOXES: [number, number, number, number][] = [
  [1443, 1321, 335, 489], [539, 1334, 336, 489], [556, 128, 163, 991], [1294, 328, 312, 617], [869, 112, 178, 964],
  [998, 1278, 245, 543], [115, 1318, 306, 395], [1696, 352, 222, 348], [100, 181, 222, 348],
];
const SPRIGS = BOXES.map(([x, y, w, h]) => {
  const a = w / h / 2, u0 = x / 2048, u1 = (x + w) / 2048, v0 = y / 2048, v1 = (y + h) / 2048;
  // (card one faces +z, card two +x; the shoot's foot at the origin)
  const P = [-a, 0, 0, a, 0, 0, a, 1, 0, -a, 1, 0, 0, 0, -a, 0, 0, a, 0, 1, a, 0, 1, -a];
  const N = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0];
  const U = [u0, v1, u1, v1, u1, v0, u0, v0, u0, v1, u1, v1, u1, v0, u0, v0];
  return { mesh: { positions: P, normals: N, uvs: U, indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7] }, tall: 0.0035 + 0.008 * (h / 991) };
});
const MOSS_MAT = {
  base_color: "#ffffff", base_color_texture: staticFile("micro/moss-atlas.png"), normal_map_texture: staticFile("micro/moss-nor.jpg"),
  alpha_mode: { Mask: 0.45 }, double_sided: true, cull_mode: null, perceptual_roughness: 0.6, diffuse_transmission: 0.55,
};

type Shoot = { p: V3; n: V3; kind: number; size: number; birth: number; yaw: number; ph: number; i: number };
/** where the moss comes up on a field: its points inside `keep`, as many as `score` says (0..1), each born when
 *  `birth` says (seconds into the shot) */
function shootsOn(f: Field, keep: (p: V3) => boolean, score: (j: number, p: V3) => number, birth: (j: number, p: V3, s: number) => number, per = 2): Shoot[] {
  const out: Shoot[] = [];
  const step = Math.hypot(f.p[3] - f.p[0], f.p[4] - f.p[1], f.p[5] - f.p[2]);
  for (let j = 0; j < f.w * f.h; j++) {
    const p: V3 = [f.p[3 * j], f.p[3 * j + 1], f.p[3 * j + 2]];
    if (!keep(p)) continue;
    const s = score(j, p);
    for (let k = 0; k < per; k++) {
      const i = j * 7 + k;
      if (rnd(i, 1) > s) continue;
      const n: V3 = [f.n[3 * j], f.n[3 * j + 1], f.n[3 * j + 2]];
      const q: V3 = [p[0] + step * (rnd(i, 2) - 0.5), p[1] + step * (rnd(i, 3) - 0.5), p[2] + step * (rnd(i, 4) - 0.5)];
      out.push({ p: q, n, kind: Math.floor(rnd(i, 5) * SPRIGS.length), size: 0.6 + 0.6 * rnd(i, 6), birth: birth(j, p, s) + 0.25 * (rnd(i, 7) - 0.5), yaw: 6.28 * rnd(i, 8), ph: 6.28 * rnd(i, 9), i });
    }
  }
  return out;
}

/** what water does to the moss at t: each touch pushes the shoots within `r` of it away from it by `k` (radians-ish
 *  of lean; signed, so a ringing shoot swings back through) */
type Touch = { at: V3; r: number; k: number };
type Bead = { position: V3; scale: V3 };
/** each shoot at t: standing out of the surface and up toward the light, still (the director, 11-12: "keep the moss
 *  stationary or have the water just interact with it"), leaned only where water touches it; one in six holds a bead of
 *  water at its tip */
function placed(shoots: Shoot[], up: V3, touches: Touch[]) {
  const by: { position: V3; rotation: V3; scale: number }[][] = SPRIGS.map(() => []);
  const beads: Bead[] = [];
  for (const s of shoots) {
    let ya = norm([s.n[0] * 0.65 + up[0] * 0.55, s.n[1] * 0.65 + up[1] * 0.55, s.n[2] * 0.65 + up[2] * 0.55]);
    for (const w of touches) {
      const d: V3 = [s.p[0] - w.at[0], s.p[1] - w.at[1], s.p[2] - w.at[2]], l = Math.hypot(...d);
      if (l > 2.5 * w.r || l < 1e-6) continue;
      const f = w.k * Math.exp(-((l / w.r) ** 2));
      ya = norm([ya[0] + (d[0] / l) * f, ya[1] + (d[1] / l) * f, ya[2] + (d[2] / l) * f]);
    }
    const side0 = norm(cross(ya, Math.abs(ya[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const side1 = cross(ya, side0);
    const xa = norm([side0[0] * Math.cos(s.yaw) + side1[0] * Math.sin(s.yaw), side0[1] * Math.cos(s.yaw) + side1[1] * Math.sin(s.yaw), side0[2] * Math.cos(s.yaw) + side1[2] * Math.sin(s.yaw)]);
    const za = cross(xa, ya);
    const tall = SPRIGS[s.kind].tall * s.size;
    by[s.kind].push({ position: s.p, rotation: euler(xa, ya, za), scale: tall });
    if (s.i % 40 === 0) {
      const r = 0.0005 + 0.0005 * rnd(s.i, 11);
      beads.push({ position: [s.p[0] + ya[0] * tall * 0.9, s.p[1] + ya[1] * tall * 0.9 - r * 0.3, s.p[2] + ya[2] * tall * 0.9], scale: [r, r * 1.08, r] });
    }
  }
  return { by, beads };
}

function Moss({ shoots, up, touches, name, sun, light }: { shoots: Shoot[]; up: V3; touches: Touch[]; name: string; sun: V3; light: [number, number] }) {
  const { by, beads } = placed(shoots, up, touches);
  return (
    <>
      {SPRIGS.map((sp, k) => (
        <Instances key={k} name={`${name}-moss-${k}`} at={by[k]} {...({ allowOverlap: true } as object)}>
          <BufferMesh {...sp.mesh} /><StandardMaterial {...(MOSS_MAT as object)} />
        </Instances>
      ))}
      <Water name={`${name}-beads`} at={beads} sun={sun} light={light} />
    </>
  );
}

// ---- water: each drop drawn as the ball of water it is ---------------------------------------------------------------
// (Bevy's transmission drew them clear and in focus they vanished: the director, 11-12, "no water is even visible at all just
// when blurry".) A drop shows the forest round it turned over and drawn small through it (its top the dark ground, its
// foot the bright sky between the pines), darkening to its rim where the light inside turns back, the sun's hot point
// and the sky on its skin, and the sun focused through it into a bright crescent on its far side.
const DROP_WGSL = /* wgsl */ `
fn hs(n: f32) -> f32 { return fract(sin(n * 127.1 + 17.3) * 43758.5453); }
fn vn(x: f32) -> f32 { let i = floor(x); let f = fract(x); return mix(hs(i), hs(i + 1.0), f * f * (3.0 - 2.0 * f)); }
fn forest(d0: vec3<f32>) -> vec3<f32> {
  let d = normalize(d0); let az = atan2(d.x, -d.z);
  var c = vec3<f32>(0.95, 0.97, 1.0) * mix(0.9, 1.5, clamp(d.y, 0.0, 1.0));
  let trunk = smoothstep(0.66, 0.74, vn(az * 22.0 + 3.0));
  if (d.y > -0.08) { c = mix(c, vec3<f32>(0.07, 0.055, 0.045), trunk * 0.92); }
  if (d.y > 0.45) { c = mix(c, vec3<f32>(0.1, 0.13, 0.07), 0.7 * vn(az * 9.0 + d.y * 14.0)); }
  if (d.y < -0.08) { c = vec3<f32>(0.13, 0.17, 0.08) * (0.6 + 0.8 * vn(az * 31.0)); }
  return c * u_light().x;
}
fn shade(in: VertexOutput) -> vec4<f32> {
  let P = in.world_position.xyz; let N = normalize(in.world_normal); let V = normalize(view.world_position - P);
  let L = normalize(u_sun().xyz); let sun = vec3<f32>(1.0, 0.86, 0.66) * u_light().y;
  let nv = clamp(dot(N, V), 0.0, 1.0);
  let F = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
  let B = -V; let lat = N - dot(N, B) * B;
  var inside = forest(B - 2.4 * lat) * vec3<f32>(0.9, 0.96, 0.94);
  inside *= smoothstep(0.06, 0.5, nv);
  inside += sun * 0.9 * pow(max(dot(N, normalize(-L + 0.6 * V)), 0.0), 10.0);
  let R = reflect(-V, N);
  let col = mix(inside, forest(R), F) + sun * 40.0 * pow(max(dot(R, L), 0.0), 1200.0) + sun * 1.5 * pow(max(dot(R, L), 0.0), 60.0);
  return vec4<f32>(col, 1.0);
}`;
function Water({ name, at, sun, light }: { name: string; at: Bead[]; sun: V3; light: [number, number] }) {
  return (
    <>
      {at.map((d, i) => (
        <ShaderMesh key={i} name={`${name}-${i}`} shape={{ primitive: "Sphere", radius: 1 }} position={d.position} scale={d.scale} wgsl={DROP_WGSL} uniforms={{ sun: [...sun, 0], light: [...light, 0, 0] }} />
      ))}
    </>
  );
}
/** a field's nearest point to (x, z) on its grid, given the grid's x and z spans (the rock's: its surface's height) */
const fieldAt = (f: Field, x: number, z: number, x0: number, x1: number, z0: number, z1: number) => {
  const i = Math.round(clamp01((x - x0) / (x1 - x0)) * (f.w - 1)), j = Math.round(clamp01((z - z0) / (z1 - z0)) * (f.h - 1)), k = j * f.w + i;
  return { p: [f.p[3 * k], f.p[3 * k + 1], f.p[3 * k + 2]] as V3, n: [f.n[3 * k], f.n[3 * k + 1], f.n[3 * k + 2]] as V3 };
};

// ---- the bark ----------------------------------------------------------------------------------------------------
// The shoots where the scan is green, in the frame's reach; the front runs up the trunk from below the frame and in
// from the furrows (the greenest first)
const BARK_SHOOTS = shootsOn(
  BARK as Field,
  (p) => p[0] > -0.07 && p[0] < 0.17 && p[1] > -0.2 && p[1] < 0.08,
  (j) => 0.7 * clamp01(((BARK as Field).green[j] - 0.035) / 0.035) ** 1.5,
  (j, p, s) => -0.2 + 16 * (p[1] + 0.09) + 0.8 * (1 - s) + 5 * Math.abs(p[0] - 0.05),
  1,
);
/** toward each shot's sun; the drops' sky and sun brightness (their shader's units: calibrated by eye on stills) */
const BARK_SUN: V3 = [-0.9, 0.5, 0.35], ROCK_SUN: V3 = [-1, 0.4, -0.45];
const LIGHT: [number, number] = [1, 1];
export const BARK_LEN = 56;
export function Bark({ t }: { t: number }) {
  const water = barkWater(t);
  const k = ease(clamp01(t / (BARK_LEN / 30)));
  const look: V3 = [0.07, -0.06 + 0.03 * k, -0.008];
  const eye: V3 = [-0.045 - 0.01 * k, -0.075 + 0.025 * k, 0.25 - 0.025 * k];
  const focus = Math.hypot(eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (32 * Math.PI) / 180, near: 0.005, far: 60 } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={4} max_circle_of_confusion_diameter={40} mode={"Bokeh" as never} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={0} />
        <Bloom intensity={0.2} threshold={0.9} />
        <Shadows mapSize={8192} distance={0.8} firstCascade={0.25} cascades={2} normalBias={3} />
        <Environment src={staticFile("hdri/sunset_forest.hdr")} intensity={0.7} rotation={0} background />
        <AmbientLight color="#000000" brightness={0} />
        {/* morning sun low from the upper left, raking across the bark so every ridge throws its furrow into shadow */}
        <DirectionalLight illuminance={30000} color="#ffd9a8" shadow_maps_enabled transform={Transform.fromXyz(...BARK_SUN).lookingAt([0, 0, 0])} />
        <Model name="bark" src={staticFile("models/micro/bark.glb")} />
        <Mesh3d name="trunk" {...({ allowOverlap: true } as object)}><BufferMesh {...TRUNK} /><StandardMaterial base_color_texture={{ path: staticFile("micro/bark-far.jpg"), sampler: { filter: "linear", wrap: "repeat" } } as never} perceptual_roughness={0.9} cull_mode={null} /></Mesh3d>
        <Moss name="bark" shoots={BARK_SHOOTS} up={[0, 1, 0]} touches={water.touches} sun={BARK_SUN} light={LIGHT} />
        <Water name="bark-runs" at={water.drops} sun={BARK_SUN} light={LIGHT} />
        <FilmLook look={{ base: 0, warm: 0.2, sat: 1.0, contrast: 0.6, halation: 0.5, vignette: 0.3 }} seed={1903} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// ---- the rock ----------------------------------------------------------------------------------------------------
// The shoots along the crack (where the scan is darkest) and over the lichen near it, the crack's first
const ROCK_SHOOTS = shootsOn(
  ROCK as Field,
  (p) => Math.abs(p[0]) < 0.22 && p[2] > -0.3 && p[2] < 0.16,
  (j) => 0.9 * clamp01((0.27 - (ROCK as Field).lum[j]) / 0.04),
  (j, p) => 0.05 + 2.2 * clamp01(((ROCK as Field).lum[j] - 0.1) / 0.3) + 4 * Math.abs(p[0] + 0.02),
  2,
);
export const ROCK_LEN = 47;
export function Rock({ t }: { t: number }) {
  const water = rockWater(t, ROCK_SHOOTS);
  const k = ease(clamp01(t / (ROCK_LEN / 30)));
  const look: V3 = [0.0, 0.0, -0.08 - 0.015 * k];
  const eye: V3 = [0.06 - 0.02 * k, 0.14 - 0.01 * k, 0.17 - 0.02 * k];
  const focus = Math.hypot(eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (34 * Math.PI) / 180, near: 0.005, far: 60 } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={2.8} max_circle_of_confusion_diameter={50} mode={"Bokeh" as never} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={-0.9} />
        <Bloom intensity={0.25} threshold={0.85} />
        <Shadows mapSize={8192} distance={1.0} firstCascade={0.35} cascades={2} normalBias={3.5} />
        <Environment src={staticFile("hdri/sunset_forest.hdr")} intensity={0.7} rotation={0} background />
        <AmbientLight color="#000000" brightness={0} />
        {/* the sun low behind the boulder: the moss lit through, the lichen's crust rimmed, the crack in shadow */}
        <DirectionalLight illuminance={34000} color="#ffc98a" shadow_maps_enabled transform={Transform.fromXyz(...ROCK_SUN).lookingAt([0, 0, 0])} />
        <Model name="rock" src={staticFile("models/micro/rock.glb")} />
        <Mesh3d name="boulder" {...({ allowOverlap: true } as object)}><BufferMesh {...BOULDER} /><StandardMaterial base_color_texture={{ path: staticFile("micro/rock-far.jpg"), sampler: { filter: "linear", wrap: "repeat" } } as never} perceptual_roughness={0.85} cull_mode={null} /></Mesh3d>
        <Moss name="rock" shoots={ROCK_SHOOTS} up={[0, 1, 0]} touches={water.touches} sun={ROCK_SUN} light={LIGHT} />
        <Water name="rock-rain" at={water.drops} sun={ROCK_SUN} light={LIGHT} />
        <FilmLook look={{ base: 0, warm: 0.3, sat: 1.0, contrast: 0.6, halation: 0.6, vignette: 0.3 }} seed={1907} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// ---- what is past the scans, out of focus: the rest of the oak's trunk and of the boulder, the scan's own colour tiled
// over them (the forest beyond is the Environment's, sunset_forest: pines over sunlit undergrowth, the lens looking -z)
/** a grid over (u, v) in 0..1, placed by `at`, its texture repeating every `tile` of u and v */
function sheet(nu: number, nv: number, at: (u: number, v: number) => { p: V3; n: V3 }, tile: [number, number]) {
  const P: number[] = [], N: number[] = [], U: number[] = [], I: number[] = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const { p, n } = at(i / nu, j / nv);
    P.push(...p); N.push(...n); U.push((i / nu) * tile[0], (j / nv) * tile[1]);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  return { positions: P, normals: N, uvs: U, indices: I };
}
/** the trunk: 76 cm across less a few mm (the scan stands on it), 3 m of it, its axis 38 cm behind the scan */
const TRUNK = sheet(96, 24, (u, v) => {
  const a = u * 2 * Math.PI, R = 0.374;
  return { p: [R * Math.sin(a), -1.5 + 3 * v, -0.38 + R * Math.cos(a)], n: [Math.sin(a), 0, Math.cos(a)] };
}, [2 * Math.PI * 0.374 / 0.35, 3 / 0.45]);
/** the boulder: its crown (the scan's sphere, 80 cm round) 3 cm under the scan (below its deepest crack), down to its waist */
const BOULDER = sheet(96, 48, (u, v) => {
  const a = u * 2 * Math.PI, e = (v * Math.PI) / 2, R = 0.77;
  const n: V3 = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
  return { p: [R * n[0], -0.8 + R * n[1], R * n[2]], n };
}, [8, 3]);

// ---- the bark's water: drops running down its furrows ---------------------------------------------------------------
// Each starts above the frame and runs down under its own weight, slow at first and gathering (a film's slow motion:
// gravity a twentieth of g), down whichever way is deepest from where it is (the furrows lead it), leaving beads behind
// it, and pushing the moss aside where it passes through.
const BF = BARK as Field;
const BARK_R = 0.38;
const barkDepth = (k: number) => { const x = BF.p[3 * k], z = BF.p[3 * k + 2]; return z - (-BARK_R + Math.sqrt(BARK_R * BARK_R - x * x)); };
function furrow(x0: number, y0: number) {
  let best = 0, bd = 1e9;
  for (let k = 0; k < BF.w * BF.h; k++) { const d = Math.hypot(BF.p[3 * k] - x0, BF.p[3 * k + 1] - y0); if (d < bd) { bd = d; best = k; } }
  let i = best % BF.w;
  const pts: { p: V3; n: V3 }[] = [];
  for (let j = Math.floor(best / BF.w); j < BF.h; j++) {
    const k = j * BF.w + i;
    pts.push({ p: [BF.p[3 * k], BF.p[3 * k + 1], BF.p[3 * k + 2]], n: [BF.n[3 * k], BF.n[3 * k + 1], BF.n[3 * k + 2]] });
    if (j + 1 >= BF.h) break;
    let bi = i, bdp = 1e9;
    for (const di of [-1, 0, 1]) { const ii = i + di; if (ii < 0 || ii >= BF.w) continue; const dp = barkDepth((j + 1) * BF.w + ii) + 0.0004 * Math.abs(di); if (dp < bdp) { bdp = dp; bi = ii; } }
    i = bi;
  }
  return pts;
}
const ROW = 0.45 / (BF.h - 1);
const RUNS = [
  { x: 0.065, y: -0.004, t0: -0.35, a: 0.05, r: 0.0036 },
  { x: 0.105, y: -0.012, t0: 0.1, a: 0.06, r: 0.003 },
  { x: 0.025, y: -0.006, t0: 0.55, a: 0.075, r: 0.0027 },
].map((r) => ({ ...r, path: furrow(r.x, r.y) }));
function barkWater(t: number) {
  const drops: Bead[] = [], touches: Touch[] = [];
  RUNS.forEach((run, n) => {
    const tau = t - run.t0;
    if (tau <= 0) return;
    const d = 0.5 * run.a * tau * tau + 0.008 * tau, f = d / ROW, k = Math.min(Math.floor(f), run.path.length - 2), u = f - k;
    const A = run.path[k], B = run.path[k + 1];
    const lift = run.r * 0.5;
    const at: V3 = [A.p[0] + (B.p[0] - A.p[0]) * u + A.n[0] * lift, A.p[1] + (B.p[1] - A.p[1]) * u + A.n[1] * lift, A.p[2] + (B.p[2] - A.p[2]) * u + A.n[2] * lift];
    const v = run.a * tau + 0.008;
    drops.push({ position: at, scale: [run.r, run.r * (1.1 + 4 * v), run.r * 0.62] });
    touches.push({ at, r: 0.0045, k: 0.9 });
    // the beads it leaves where it has been
    for (let q = 4; q < k - 1; q += 5) {
      if (rnd(n * 97 + q, 3) < 0.35) continue;
      const P = run.path[q], br = run.r * (0.18 + 0.2 * rnd(n * 97 + q, 4));
      drops.push({ position: [P.p[0] + P.n[0] * br * 0.4 + 0.0006 * (rnd(n * 97 + q, 5) - 0.5), P.p[1] + P.n[1] * br * 0.4, P.p[2] + P.n[2] * br * 0.4], scale: [br, br, br * 0.6] });
    }
  });
  return { drops, touches };
}

// ---- the rock's water: rain landing on it ---------------------------------------------------------------------------
// Drops fall in from above the frame (gravity a seventh of g: slow motion) and land, three of them in the crack's moss
// (it bounces, and rings back); each throws a crown of droplets that arc out and bead where they come down, and leaves
// a flattened bead where it hit.
const RF = ROCK as Field;
const rockAt = (x: number, z: number) => fieldAt(RF, x, z, -0.3, 0.3, -0.3, 0.3);
const G = 1.4, FALL = 0.07;
const HITS = [
  { x: -0.012, z: -0.09, t: 0.22, moss: true }, { x: 0.026, z: -0.125, t: 0.48, moss: false }, { x: -0.03, z: -0.07, t: 0.7, moss: true },
  { x: 0.012, z: -0.15, t: 0.93, moss: false }, { x: 0.038, z: -0.08, t: 1.1, moss: false }, { x: -0.018, z: -0.128, t: 1.27, moss: true },
  { x: 0.003, z: -0.058, t: 1.44, moss: false },
];
type Hit = { at: V3; t: number; r: number; crown: { v: V3; r: number; land: number; rest: V3 }[] };
let HIT_CACHE: Hit[] | null = null;
function hits(shoots: Shoot[]): Hit[] {
  if (HIT_CACHE) return HIT_CACHE;
  HIT_CACHE = HITS.map((h, n) => {
    let x = h.x, z = h.z;
    if (h.moss) {
      // (onto the nearest moss)
      let bd = 1e9;
      for (const s of shoots) { const d = Math.hypot(s.p[0] - h.x, s.p[2] - h.z); if (d < bd) { bd = d; x = s.p[0]; z = s.p[2]; } }
    }
    const top = rockAt(x, z).p[1] + (h.moss ? 0.004 : 0);
    const at: V3 = [x, top, z];
    const crown = Array.from({ length: 11 }, (_, k) => {
      const a = (2 * Math.PI * k) / 11 + 0.5 * rnd(n * 31 + k, 1), sp = 0.1 + 0.14 * rnd(n * 31 + k, 2), vy = 0.16 + 0.16 * rnd(n * 31 + k, 3);
      const v: V3 = [Math.cos(a) * sp, vy, Math.sin(a) * sp], r = 0.00035 + 0.0006 * rnd(n * 31 + k, 4);
      let land = 0.6, rest: V3 = at;
      for (let tau = 0.02; tau < 0.6; tau += 1 / 240) {
        const p: V3 = [at[0] + v[0] * tau, at[1] + v[1] * tau - 0.5 * G * tau * tau, at[2] + v[2] * tau];
        if (v[1] - G * tau < 0 && p[1] < rockAt(p[0], p[2]).p[1] + r * 0.6) { land = tau; rest = [p[0], rockAt(p[0], p[2]).p[1] + r * 0.45, p[2]]; break; }
      }
      return { v, r, land, rest };
    });
    return { at, t: h.t, r: 0.003, crown };
  });
  return HIT_CACHE;
}
function rockWater(t: number, shoots: Shoot[]) {
  const drops: Bead[] = [], touches: Touch[] = [];
  for (const h of hits(shoots)) {
    const tau = t - h.t;
    if (tau < 0) {
      const y = h.at[1] + 0.5 * G * tau * tau;
      if (y - h.at[1] < FALL) drops.push({ position: [h.at[0], y + h.r, h.at[2]], scale: [h.r, h.r * 1.12, h.r] });
      continue;
    }
    // the hit: spread flat, then a bead
    const spread = 1 + 0.6 * Math.exp(-tau * 9);
    drops.push({ position: [h.at[0], h.at[1] + h.r * 0.35, h.at[2]], scale: [h.r * 1.25 * spread, h.r * 0.5, h.r * 1.25 * spread] });
    touches.push({ at: h.at, r: 0.009, k: 1.2 * Math.exp(-tau * 4.5) * Math.cos(tau * 26) });
    for (const c of h.crown) {
      if (tau < c.land) {
        drops.push({ position: [h.at[0] + c.v[0] * tau, h.at[1] + c.v[1] * tau - 0.5 * G * tau * tau, h.at[2] + c.v[2] * tau], scale: [c.r, c.r * 1.15, c.r] });
      } else {
        drops.push({ position: c.rest, scale: [c.r * 1.15, c.r * 0.55, c.r * 1.15] });
      }
    }
  }
  return { drops, touches };
}
