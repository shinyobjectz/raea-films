// v4, 25-crack: the ground opens before the beam. From T.tremor the bank shakes (tremorAt); from T.crack a round slab
// of it, cut into voxels of earth with moss on their tops, swells and jostles as light leaks up between them; at
// T.blast they're thrown up and out, tumbling, and fall back over the bank and into the water, leaving a pit of light
// in a broken rim; at T.beam the beam stands up out of it (groundbeam.tsx). The pit is laid on the bank (its floor a
// glowing disc just over the ground, its rim tilted stubs and a dark lip), since the scanned bank can't be cut.
// Everything that glows here is a plain emissive, so Solari lights the flying chunks, the grass and the keys from it.
import type { ReactNode } from "react";
import { interpolate, staticFile } from "raea";
import { Affine2 } from "raea/math";
import { LinearRgba, Srgba } from "raea/color";
import { Cuboid, Mesh3d } from "raea/mesh";
import { manifold } from "raea/3d";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { BEAM_AT } from "./groundbeam";
import { type Q, qa, qm, qv } from "./quat";
import { groundAt, onBank } from "./ground";
import { T, type V3, clamp, rnd, shakeAt, tremorAt } from "./timeline";

const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
/** what a falling chunk lands on: the bank's real top, or the water */
const floorAt = groundAt;

/** the pit's radius, metres */
export const PIT = 0.34;
const VOX = 0.072, STEP = 0.078, TURN = 0.35; // a voxel's edge, the grid's pitch, the grid's turn off the axes
const G = 9.81 / 900; // m per frame²
const [CX, , CZ] = BEAM_AT;

type Vox = { x: number; z: number; d: number; a: number; s: number; layer: number; rim: boolean; col: string; i: number };
/** the keys' grime (already loaded by the keyboard in every swamp shot), for the earth's grain */
const GRIME = staticFile("textures/grime.png");
const MOSS = ["#55602c", "#4b5627", "#5f6633", "#434d25"];
const SOIL = ["#5c4029", "#4f3620", "#6a4b2e", "#43301f", "#5a4430", "#3d2b1b"];
const VOXELS: Vox[] = (() => {
  const out: Vox[] = [];
  const c = Math.cos(TURN), s = Math.sin(TURN);
  let i = 0;
  for (let gi = -6; gi <= 6; gi++)
    for (let gj = -6; gj <= 6; gj++) {
      const lx = gi * STEP, lz = gj * STEP;
      const x = CX + lx * c - lz * s, z = CZ + lx * s + lz * c;
      const d = Math.hypot(x - CX, z - CZ);
      const rim = d >= PIT && d < PIT + 0.16;
      if (d >= PIT + 0.16) continue;
      for (const layer of rim ? [0] : [0, 1]) {
        out.push({ x, z, d, a: Math.atan2(z - CZ, x - CX), s: VOX * (0.72 + 0.5 * rnd(i, 3)), layer, rim, col: SOIL[Math.floor(rnd(i, 5) * SOIL.length)], i });
        i++;
      }
    }
  return out;
})();

/** how far the slab has swollen before the blast, 0..1 */
const swellAt = (f: number) => Math.pow(interpolate(f, [T.crack, T.blast], [0, 1], clamp), 1.6);
/** how much light leaks up between the voxels (nits) */
const leakAt = (f: number) => {
  const flick = 0.7 + 0.3 * Math.sin(f * 2.3) * Math.sin(f * 1.1 + 0.7);
  return interpolate(f, [T.crack - 1, T.crack + 3, T.blast - 6, T.blast - 1], [0, 14000, 60000, 110000], clamp) * flick;
};
/** the pit's light after the blast (nits): a flash, a steady glow, a second flash as the beam fires */
export const pitAt = (f: number) =>
  f < T.blast ? 0 : interpolate(f, [T.blast, T.blast + 3, T.blast + 16, T.beam - 3, T.beam + 1, T.beam + 20], [60000, 80000, 14000, 16000, 70000, 20000], clamp);

/** a voxel's pose at the blast, and before it: lifted by the swell (most in the middle), pushed out a little, tilted
 *  out from the middle, jostled by the tremor */
const restPose = (v: Vox, f: number) => {
  const sw = swellAt(f), tr = tremorAt(f);
  const k = v.rim ? 0.35 : 1 - (v.d / PIT) ** 2;
  // proud of the light under it by a few mm at first, so the light shows only between the voxels
  const top = groundAt(v.x, v.z) + 0.006 - v.layer * VOX;
  const lift = sw * (0.06 * k + 0.03 * rnd(v.i, 71)) + tr * 0.005 * (0.5 + 0.5 * shakeAt(f, v.i));
  const push = sw * 0.016 * (v.d / PIT);
  const p: V3 = [v.x + Math.cos(v.a) * push, top - v.s / 2 + lift, v.z + Math.sin(v.a) * push];
  const out: V3 = [Math.cos(v.a), 0, Math.sin(v.a)];
  const tiltAxis: V3 = [-out[2], 0, out[0]]; // turning about it lifts the voxel's inner edge
  const tilt = sw * 0.3 * (v.d / PIT) * (v.rim ? 1.3 : 1) + tr * 0.03 * shakeAt(f, v.i + 40);
  // and each jostled its own way as it's pushed up
  const own: V3 = [rnd(v.i, 73) - 0.5, 0, rnd(v.i, 74) - 0.5];
  const q = qm(qa(own, sw * 0.35 * rnd(v.i, 75)), qm(qa(tiltAxis, -tilt), qa([0, 1, 0], -TURN)));
  return { p, q };
};

/** a voxel thrown by the blast: where it is, its turn, and whether it's gone (sunk) */
const flying = (v: Vox, f: number) => {
  const delay = v.layer === 0 ? (v.d / PIT) * 1.5 : 1.5 + rnd(v.i, 7) * 2.5;
  const t0 = T.blast + delay;
  const start = restPose(v, Math.min(f, t0));
  if (f <= t0) return { ...start, gone: false };
  const t = f - t0;
  const k = 1 - 0.45 * (v.d / PIT);
  const up = (v.layer === 0 ? 0.12 + 0.1 * rnd(v.i, 11) : 0.07 + 0.08 * rnd(v.i, 11)) * k;
  const out = (0.022 + 0.05 * rnd(v.i, 13)) * (0.3 + v.d / PIT);
  const side = (rnd(v.i, 17) - 0.5) * 0.02;
  const vx = Math.cos(v.a) * out - Math.sin(v.a) * side, vz = Math.sin(v.a) * out + Math.cos(v.a) * side;
  const spinAx: V3 = [rnd(v.i, 19) - 0.5, rnd(v.i, 23) - 0.5, rnd(v.i, 29) - 0.5];
  const spin = 0.15 + 0.3 * rnd(v.i, 31);
  // when it comes down: solved against the floor where it lands (twice, as the floor depends on where)
  let tl = 2 * up / G, lh = 0;
  for (let n = 0; n < 3; n++) {
    lh = floorAt(start.p[0] + vx * tl, start.p[2] + vz * tl) + v.s / 2;
    tl = (up + Math.sqrt(Math.max(0, up * up + 2 * G * (start.p[1] - lh)))) / G;
  }
  const tt = Math.min(t, tl);
  const p: V3 = [start.p[0] + vx * tt, start.p[1] + up * tt - 0.5 * G * tt * tt, start.p[2] + vz * tt];
  const q = qm(qa(spinAx, spin * tt), start.q);
  if (t <= tl) return { p, q, gone: false };
  const wet = !onBank(p[0], p[2]);
  // on the bank it stays where it fell; in the water it sinks out of sight
  if (wet) p[1] -= (t - tl) * 0.01;
  return { p, q, gone: wet && t - tl > 10 };
};

/** a rim stub: kicked up and tipped out by the blast, and left there */
const rimPose = (v: Vox, f: number) => {
  const r = restPose(v, Math.min(f, T.blast));
  if (f < T.blast) return r;
  const e = interpolate(f, [T.blast, T.blast + 4], [0, 1], clamp);
  const out: V3 = [Math.cos(v.a), 0, Math.sin(v.a)];
  const tiltAxis: V3 = [-out[2], 0, out[0]];
  // the inner ring stands up most, a ragged lip round the light; the outer ring heaps against it
  const inner = v.d < PIT + 0.08 ? 1 : 0.55;
  const p: V3 = [r.p[0] + out[0] * 0.03 * e, r.p[1] + (0.035 + 0.045 * rnd(v.i, 37)) * inner * e, r.p[2] + out[2] * 0.03 * e];
  return { p, q: qm(qa(tiltAxis, -(0.6 + 0.6 * rnd(v.i, 41)) * inner * e), r.q) };
};

/** the light under the slab, then the pit's floor: a plate of light on the ground under each voxel of the middle, so
 *  it follows the bank's real top (it shows between the voxels as they part, then is all that's left) */
const CELLS = VOXELS.filter((v) => !v.rim && v.layer === 0);
const fall = (d: number) => 0.04 + 0.96 * Math.exp(-((d / (0.5 * PIT)) ** 2)); // white-hot middle, dim blue edge
const cellCol = (d: number) => (d < 0.4 * PIT ? "#f2f9ff" : d < 0.7 * PIT ? "#cde6ff" : "#8fc2ec");

// the small stuff thrown with them: crumbs of earth, faster and further
const BITS = Array.from({ length: 64 }, (_, i) => ({
  a: rnd(i, 51) * Math.PI * 2, d: rnd(i, 53) * PIT, s: 0.012 + 0.018 * rnd(i, 55), up: 0.14 + 0.16 * rnd(i, 57), out: 0.05 + 0.08 * rnd(i, 59), col: SOIL[i % SOIL.length],
}));

/** the light pouring up out of the pit: a soft glow round its axis, falling off with height, worked out per pixel as
 *  the beam's glow is (groundbeam.tsx) and added to the frame. It isn't traced: the plates under it are the light */
const SHAFT_H = 2.4;
const SHAFT = manifold.cylinder(1, 1).rotate(-90, 0, 0); // a unit column, centred, sized by its transform
const R0 = 0.7, R1 = 0.6, KMAX = 6000; // the container's radius says how bright: R0 dark, R0 + R1 at KMAX
const SHAFT_WGSL = /* wgsl */ `
fn lit(in: VertexOutput, pbr: PbrInput, color: vec4<f32>) -> vec4<f32> {
  let C = view.world_position.xyz;
  let v = normalize(in.world_position.xyz - C);
  let a = u_foot();
  let w0 = C - a;
  let d = dot(v, w0);
  let den = max(1.0 - v.y * v.y, 1e-5);
  let s = clamp((w0.y - v.y * d) / den, 0.0, u_h());
  let q = a + vec3<f32>(0.0, s, 0.0);
  let t = max(dot(q - C, v), 0.0);
  let r = length(C + v * t - q);
  let x = r / u_w();
  let g = exp(-x * x * 1.6) * exp(-s / u_fade());
  // how bright, read from how wide the container is (its wall is where this fragment is): a ShaderExtension's uniforms
  // keep their first frame's values in a video render, and the transform is what updates
  let rc = length(in.world_position.xz - a.xz);
  let k = clamp((rc - u_r0()) / u_r1(), 0.0, 1.0) * u_kmax();
  return vec4<f32>(u_col().rgb * k * g * view.exposure, 1.0);
}`;
function Shaft({ k, f }: { k: number; f: number }) {
  void f;
  // mounted from the crack on, dark until it's wanted (a material first mounted mid-shot may not be ready in a video)
  const foot: V3 = [CX, groundAt(CX, CZ), CZ];
  const rc = R0 + R1 * Math.min(1, k / KMAX);
  return (
    <Mesh3d name="pit-shaft" castShadow={false} transform={Transform.fromXyz(foot[0], foot[1] + SHAFT_H / 2 - 0.3, foot[2]).withScale([rc, SHAFT_H, rc])} shape={SHAFT}>
      <ExtendedMaterial
        base={<StandardMaterial base_color="#000000" alpha_mode="Add" cull_mode="Front" reflectance={0} opaque_render_method="Forward" />}
        extension={<ShaderExtension wesl={SHAFT_WGSL} uniforms={{ foot, h: SHAFT_H, w: PIT * 0.75, fade: 0.32, r0: R0, r1: R1, kmax: KMAX, col: "#8fd0ff" }} />}
      />
    </Mesh3d>
  );
}

function Block({ name, p, q, s, col, moss, i }: { name: string; p: V3; q: Q; s: number; col: string; moss: boolean; i: number }) {
  // a moss cap on most top faces, as the bank's surface was, set in from the edges so the earth shows round it
  const cap = qv(q, [0, s / 2 + 0.0015, 0]);
  const uv = Affine2.fromScale([0.25 + 0.3 * rnd(i, 61), 0.25 + 0.3 * rnd(i, 62)]);
  const mossy = moss && rnd(i, 63) > 0.22;
  return (
    <>
      <Mesh3d name={name} allowOverlap transform={Transform.fromXyz(...p).withRotation(q)}>
        <Cuboid half_size={[s / 2, s / 2, s / 2]} />
        <StandardMaterial base_color={col} perceptual_roughness={0.95} base_color_texture={GRIME} uv_transform={uv} />
      </Mesh3d>
      {mossy && (
        <Mesh3d name={`${name}-moss`} allowOverlap transform={Transform.fromXyz(p[0] + cap[0], p[1] + cap[1], p[2] + cap[2]).withRotation(q)}>
          <Cuboid half_size={[s / 2 - 0.004 * rnd(i, 64), 0.002, s / 2 - 0.004 * rnd(i, 65)]} />
          <StandardMaterial base_color={MOSS[Math.floor(rnd(i, 66) * MOSS.length)]} perceptual_roughness={0.9} base_color_texture={GRIME} uv_transform={uv} />
        </Mesh3d>
      )}
    </>
  );
}

/** v5: where what the ground holds waits until it's wanted, PARK metres down (see Opening) */
const PARK = 40;
const parked = (p: V3): V3 => [p[0], p[1] - PARK, p[2]];

export function Opening({ f }: { f: number }) {
  // mounted from 25-crack's first frame (T.tremor - 2 is before it), so the shaft's material is ready; the voxels and
  // the light come in at the crack.
  // v5: the voxels, the pit's cells and the crumbs are mounted from that first frame too, PARK metres down until
  // they're wanted. Mounted at the crack, a render to PNG frames (the dark shots' lossless path) had the voxels'
  // shadows on the mud over them from the shot's first frame, a grid of soft dark squares (a render to mp4 didn't)
  if (f < T.tremor - 2 || f >= T.orbit) return null;
  const early = f < T.crack;
  const parts: ReactNode[] = [];
  const g0 = groundAt(CX, CZ);
  for (const v of VOXELS) {
    if (v.rim) {
      const { p, q } = rimPose(v, f);
      parts.push(<Block key={`r${v.i}`} name={`vox-${v.i}`} p={early ? parked(p) : p} q={q} s={v.s} col={v.col} moss i={v.i} />);
      continue;
    }
    const { p, q, gone } = f < T.blast ? { ...restPose(v, f), gone: false } : flying(v, f);
    if (gone) continue;
    parts.push(<Block key={`v${v.i}`} name={`vox-${v.i}`} p={early ? parked(p) : p} q={q} s={v.s} col={v.col} moss={v.layer === 0} i={v.i} />);
  }
  // (a crumb comes up from PARK a frame before the blast, where it's thrown from: the motion blur on from the blast
  // never sees it rise 40 m)
  BITS.forEach((b, i) => {
    const t = Math.max(0, f - T.blast);
    const y = g0 + b.up * t - 0.5 * G * t * t;
    const r = b.d + b.out * t;
    const x = CX + Math.cos(b.a) * r, z = CZ + Math.sin(b.a) * r;
    if (f >= T.blast && y < floorAt(x, z)) return;
    parts.push(
      <Mesh3d key={`b${i}`} name={`crumb-${i}`} allowOverlap shadow={false} transform={Transform.fromXyz(...(f < T.blast - 1 ? parked([x, y, z]) : ([x, y, z] as V3))).withRotation(qa([1, 0.4, 0.2], t * 0.4 + i))}>
        <Cuboid half_size={[b.s / 2, b.s / 2, b.s / 2]} />
        <StandardMaterial base_color={b.col} perceptual_roughness={0.95} />
      </Mesh3d>,
    );
  });
  const leak = early ? 0 : leakAt(f), pit = early ? 0 : pitAt(f);
  return (
    <>
      {parts}
      <Shaft f={f} k={f < T.blast ? leak * 0.014 : pit * 0.06} />
      {CELLS.map((v) => (
        <Mesh3d key={`c${v.i}`} name={`pit-cell-${v.i}`} allowOverlap shadow={false} transform={Transform.fromXyz(...(early ? parked([v.x, groundAt(v.x, v.z) + 0.003, v.z]) : ([v.x, groundAt(v.x, v.z) + 0.003, v.z] as V3))).withRotation(qa([0, 1, 0], -TURN))}>
          <Cuboid half_size={[STEP / 2, 0.002, STEP / 2]} />
          <StandardMaterial base_color="#000000" emissive={glow(cellCol(v.d), (f < T.blast ? leak * (1 - 0.4 * (v.d / PIT)) : pit) * fall(v.d))} />
        </Mesh3d>
      ))}
    </>
  );
}

// ---- v5 (notes 8 and 9): what grows on the slab rides it, and what grows round it bows to the blast
const TOP = VOXELS.filter((v) => v.layer === 0);
const qc = (q: Q): Q => [-q[0], -q[1], -q[2], q[3]];
/** the slab's reach from the pit's middle: a plant rooted within it stands on one of its blocks */
export const SLAB = PIT + 0.16;
/** the block a point of the bank stands on (an index into the slab's top layer, the nearest block), or null off it */
export const blockUnder = (x: number, z: number): number | null => {
  if (Math.hypot(x - CX, z - CZ) >= SLAB) return null;
  let best = 0, bd = 1e9;
  TOP.forEach((v, k) => {
    const d = (v.x - x) ** 2 + (v.z - z) ** 2;
    if (d < bd) [bd, best] = [d, k];
  });
  return best;
};
/** how block k has moved by frame f since before the tremor: a point p that rides it (a root on its top) is now at
 *  at(p), turned by q; gone once the block has sunk in the water. Before the tremor and from the orbit on, it hasn't */
export const carried = (k: number, f: number) => {
  const v = TOP[k];
  const a = restPose(v, T.tremor - 1);
  const b = f < T.tremor || f >= T.orbit ? { ...a, gone: false } : v.rim ? { ...rimPose(v, f), gone: false } : f < T.blast ? { ...restPose(v, f), gone: false } : flying(v, f);
  const q = qm(b.q, qc(a.q));
  const at = (p: V3): V3 => {
    const r = qv(q, [p[0] - a.p[0], p[1] - a.p[1], p[2] - a.p[2]]);
    return [b.p[0] + r[0], b.p[1] + r[1], b.p[2] + r[2]];
  };
  return { at, q, gone: !!b.gone };
};
/** how far round the pit the blast bends what grows (from its middle, metres) */
export const BOW = 0.85;
/** what grows near the pit but off the slab: shaken by the tremor, bent hard away from the pit by the blast and half
 *  straightened, bent again as the beam fires and left trembling while it hums. A turn about the plant's root */
export const bowAt = (x: number, z: number, f: number, seed: number): Q => {
  const dx = x - CX, dz = z - CZ, d = Math.hypot(dx, dz) || 1;
  if (d >= BOW || f < T.tremor || f >= T.orbit) return [0, 0, 0, 1];
  const ox = dx / d, oz = dz / d;
  // nearer bends further; the tremor shakes it each its own way
  const near = Math.min(1, (BOW - d) / (BOW - SLAB));
  const blast = interpolate(f, [T.blast, T.blast + 3, T.blast + 16, T.beam, T.beam + 4, T.beam + 30], [0, 0.95, 0.42, 0.4, 0.62, 0.3], clamp);
  const hum = f >= T.beam ? 0.05 * Math.sin(f * 1.9 + seed) * Math.sin(f * 0.7 + 2 * seed) : 0;
  const shake = tremorAt(f) * 0.05 * shakeAt(f, seed);
  return qa([oz, 0, -ox], near * (blast + hum) + shake);
};
