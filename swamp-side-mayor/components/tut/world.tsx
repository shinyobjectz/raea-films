// The tutorial's swamp (tutorial.script.ts): the music video's world2.tsx as it stood on 11-16, copied so the music
// video's v5 session can go on changing its own. Two changes, both for the tutorial: no bush grows where the four doors
// stand (components/tut/doors.tsx; the rest of the scatter keeps its places), and the floating motes can be turned off
// (`moteCount`), so nothing drifts over the app in a teaching close-up of the glass. Since (the director, 11-16): everything
// that grows moves in one wind (wind.ts), and great ruins stand hazed on the far hills, so the back of the wide isn't bare.
import { Fragment } from "react";
import { staticFile } from "raea";
import { BufferMesh, ImagePlane, Instances, Look, Model, Shadows, crossSection, scatter } from "raea/3d";
import { DirectionalLight } from "raea/light";
import { ExtendedMaterial, PaintExtension, StandardMaterial } from "raea/pbr";
import { Capsule3d, Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Transform } from "raea/transform";
import { POND, WATER, fbm, ground, hash, height, noise, pond, type V3 } from "../../compositions/set";
import { Motes, Ripples, Ruins, pondRings, type Ring } from "../../compositions/ruins";
import { doorsClear } from "./doors";
import { lean, swayRotation } from "./wind";

export const SUN: V3 = [-14, 22, 12];
// ---- the ground: a grid, finer near the stage, coloured by what it is
const GX = [-150, 150], GZ = [-190, 110];
const axis = (lo: number, hi: number) => { const out: number[] = []; let v = lo; while (v <= hi) { out.push(v); const d = Math.abs(v); v += d < 25 ? 0.5 : d < 60 ? 1.2 : 3; } return out; };
const XS = axis(GX[0], GX[1]), ZS = axis(GZ[0], GZ[1]);
const hex = (h: string) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const mixc = (a: number[], b: number[], u: number) => a.map((v, i) => v + (b[i] - v) * u);
const GRASS_A = hex("#57ad37"), GRASS_B = hex("#7cc847"), GRASS_DARK = hex("#3f8f30"), MUD = hex("#7a5435"), MUD_WET = hex("#4e3523"), BED = hex("#2d6a8c");
const TERRAIN = (() => {
  const positions: number[] = [], normals: number[] = [], colors: number[] = [], indices: number[] = [];
  for (const z of ZS) for (const x of XS) {
    const y = height(x, z), e = 0.25, nx = height(x - e, z) - height(x + e, z), nz = height(x, z - e) - height(x, z + e), l = Math.hypot(nx, 2 * e, nz);
    positions.push(x, y, z); normals.push(nx / l, (2 * e) / l, nz / l);
    const g = ground(x, z), p = pond(x, z);
    let c = mixc(GRASS_A, GRASS_B, Math.min(1, Math.max(0, fbm(x * 0.07, z * 0.07) * 1.6 - 0.35)));
    c = mixc(c, GRASS_DARK, Math.max(0, 0.6 - fbm(x * 0.03 + 9, z * 0.03) * 1.2));
    if (g === 1) c = mixc(MUD, MUD_WET, Math.min(1, Math.max(0, (0.06 - p) / 0.08)) * 0.8 + 0.2 * noise(x * 2, z * 2));
    if (g === 2) c = mixc(MUD_WET, BED, Math.min(1, -p * 6));
    colors.push(c[0], c[1], c[2], 1);
  }
  const W = XS.length;
  for (let j = 0; j < ZS.length - 1; j++) for (let i = 0; i < W - 1; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; indices.push(a, c, b, b, c, d); }
  return { positions, normals, colors, indices };
})();
// ---- what grows
const near = { min: [-60, -60] as [number, number], max: [60, 40] as [number, number] };
const shore = (x: number, z: number) => { const p = pond(x, z); return p > -0.07 && p < 0.06; };
const clumps = (x: number, z: number) => noise(x * 0.35 + 4, z * 0.35) > 0.48;
const cattails = scatter({ area: { min: [-26, -30], max: [26, -2] }, count: 150, spacing: 0.45, seed: 11, y: height, density: (x, z) => (shore(x, z) && clumps(x, z) && Math.hypot(x, z) > 7 ? 1 : 0), scale: [0.75, 1.3], tilt: 0.1 });
const lilyShape = crossSection.polygon(Array.from({ length: 30 }, (_, i) => { const a = 0.32 + (i / 29) * (Math.PI * 2 - 0.64); return [Math.cos(a) * 0.38, Math.sin(a) * 0.38] as [number, number]; }).concat([[0, 0]])).extrude(0.012).rotate(-90, 0, 0);
const lilies = scatter({ area: { min: [-17, -24], max: [17, -6] }, count: 90, spacing: 0.75, seed: 7, y: () => WATER + 0.006, density: (x, z) => (pond(x, z) < -0.12 && noise(x * 0.25, z * 0.25) > 0.42 ? 1 : 0), scale: [0.6, 1.5] });
const lotus = lilies.filter((_, i) => hash(i, 3) > 0.8);
const flowers = scatter({ area: near, count: 900, spacing: 0.6, seed: 21, y: height, density: (x, z) => (ground(x, z) === 0 && Math.hypot(x, z) > 2.2 && noise(x * 0.2 + 2, z * 0.2) > 0.5 ? 1 : 0), scale: [0.7, 1.3] });
const WILLOWS: { at: [number, number]; k: number; s: number; turn: number }[] = [
  { at: [-15.5, -8.5], k: 0, s: 1.05, turn: 0.4 }, { at: [14.5, -9.5], k: 1, s: 1.1, turn: 2.1 }, { at: [-23, -23], k: 2, s: 1.15, turn: 1 }, { at: [21, -25], k: 0, s: 1.2, turn: 3 },
  { at: [4, -31], k: 1, s: 1.2, turn: 5 }, { at: [-34, -6], k: 2, s: 1.1, turn: 0.2 }, { at: [34, -8], k: 0, s: 1.1, turn: 4 }, { at: [-19, 15], k: 1, s: 1.05, turn: 2.5 }, { at: [21, 13], k: 2, s: 1.0, turn: 1.5 },
];
// the meadow: clumps of our grass on a jittered grid, five a square metre near the stage thinning to one in two
// past 30 m (each bigger, to cover), short where the goose stands, none on mud or in water
const MEADOW: { position: V3; rotation: V3; scale: V3 }[][] = [[], [], []];
for (let gz = -50; gz < 40; gz++) for (let gx = -50; gx < 50; gx++) {
  const d = Math.hypot(gx, gz), per = d < 12 ? 5 : d < 30 ? 1.8 : 0.6, n = Math.floor(per + hash(gx, gz));
  for (let i = 0; i < n; i++) {
    const x = gx + hash(gx * 3 + i, gz * 7), z = gz + hash(gx * 5, gz * 11 + i), dd = Math.hypot(x, z);
    if (ground(x, z) !== 0 || pond(x, z) < 0.12) continue;
    const near = 0.35 + 0.65 * Math.min(1, Math.max(0, dd - 1.4) / 4), far = 1 + Math.max(0, dd - 12) * 0.035, s = (0.8 + 0.5 * hash(x, z)) * near * far * (0.75 + 0.5 * fbm(x * 0.15, z * 0.15));
    MEADOW[(i + gx + gz) % 3 < 0 ? 0 : (i + gx + gz) % 3].push({ position: [x, height(x, z) - 0.01, z], rotation: [0, hash(z, x) * 6.28, 0], scale: [s, s, s] });
  }
}
const RUSHES = scatter({ area: { min: [-26, -30], max: [26, -2] }, count: 900, spacing: 0.3, seed: 5, y: height, density: (x, z) => (shore(x, z) && clumps(x + 3, z) && Math.hypot(x, z) > 6 ? 1 : 0), scale: [0.9, 1.3] })
  .map((r, i) => ({ position: r.position, yaw: hash(i, 2) * 6.28, scale: [(r.scale as number) * 1.3, (r.scale as number) * 1.9, (r.scale as number) * 1.3] as V3 }));
const bushesAll = scatter({ area: { min: [-40, -36], max: [40, 25] }, count: 70, spacing: 1.8, seed: 41, y: height, density: (x, z) => { const p = pond(x, z); return Math.hypot(x, z) > 8 && ((p > 0.08 && p < 0.35 && noise(x * 0.2, z * 0.2) > 0.5) || (p > 0.9 && noise(x * 0.1 + 5, z * 0.1) > 0.62)) ? 1 : 0; }, scale: [0.8, 1.5] });
// none where a door stands, nor in the way of the walk up to it
const bushes = bushesAll.filter((b) => !doorsClear(b.position[0], b.position[2]));
const far = scatter({ area: { min: [-145, -185], max: [145, 105] }, count: 260, spacing: 4, seed: 31, y: height, density: (x, z) => { const d = Math.hypot(x * 0.85, z + 12); return d > 55 && d < 150 && noise(x * 0.025, z * 0.025) > 0.62 ? 1 : 0; }, scale: [0.9, 1.7] });
// the great ruins on the far hills (the director, 11-16: "maybe we could see some large ruins in the distance"): the near ruins'
// own stones five times over, past the far trees, so the haze takes them: a temple's front (a giant trilithon between
// a colonnade, two columns broken) behind the pond to the right, and a great arch to the left
type FarRuin = { src: string; at: [number, number]; s: number; sink: number; lean?: [number, number]; turn?: number };
const row = (c: [number, number], along: number, out = 0): [number, number] => { const l = Math.hypot(c[0], c[1] - 9), ax = -(c[1] - 9) / l, az = c[0] / l, fx = -c[0] / l, fz = -(c[1] - 9) / l; return [c[0] + ax * along + fx * out, c[1] + az * along + fz * out]; };
const TEMPLE: [number, number] = [40, -92], ARCH: [number, number] = [-62, -108];
const FAR_RUINS: FarRuin[] = [
  { src: "trilithon", at: row(TEMPLE, 0), s: 5.4, sink: 1.2 },
  { src: "column-0", at: row(TEMPLE, -13), s: 4.6, sink: 0.6 }, { src: "column-1", at: row(TEMPLE, -20), s: 4.6, sink: 0.4 },
  { src: "column-0", at: row(TEMPLE, 13), s: 4.6, sink: 0.6 }, { src: "column-2", at: row(TEMPLE, 20), s: 4.6, sink: 0.3 },
  { src: "column-0", at: row(TEMPLE, 27), s: 4.4, sink: 0.8, lean: [0, -0.14] },
  { src: "stone-fallen", at: row(TEMPLE, 7, 9), s: 4.5, sink: 0.6, turn: 0.5 }, { src: "drum", at: row(TEMPLE, 22, 6), s: 4.5, sink: 0.3, lean: [1.2, 0] },
  { src: "drum", at: row(TEMPLE, -9, 7), s: 4, sink: 0.4, lean: [0.2, 0.3] },
  { src: "arch", at: row(ARCH, 0), s: 6.5, sink: 1.5 },
  { src: "column-0", at: row(ARCH, 22), s: 5, sink: 0.6 }, { src: "column-1", at: row(ARCH, -21), s: 5, sink: 0.4, lean: [0.08, 0] },
  { src: "stone-fallen", at: row(ARCH, -5, 8), s: 4.2, sink: 0.5, turn: -0.4 },
];
const CLOUDS = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2 + 0.3 * hash(i, 1), r = 260 + 60 * hash(i, 2); return { a, r, y: 45 + 70 * hash(i, 3), w: 110 + 90 * hash(i, 4), k: i % 6 }; });
const CLOUD_AR = [0.46, 0.51, 0.35, 0.48, 0.36, 0.54];

const RIDGES = (() => {
  const positions: number[] = [], colors: number[] = [], indices: number[] = []; const N = 360, rows = [330, 420, 520];
  rows.forEach((r, ri) => { for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, h = (22 + ri * 26) * (0.35 + fbm(Math.cos(a) * 3 + ri * 5, Math.sin(a) * 3) * 1.1) * (0.6 + 0.4 * Math.abs(Math.sin(a * 2.5 + ri)));
    positions.push(Math.cos(a) * r, -5, Math.sin(a) * r - 12, Math.cos(a) * r, h, Math.sin(a) * r - 12); const c = hex(["#5f9fb8", "#73adc9", "#86bbd8"][ri]); colors.push(...c, 1, ...c, 1); } });
  rows.forEach((_, ri) => { const o = ri * (N + 1) * 2; for (let i = 0; i < N; i++) { const a = o + i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
  return { positions, colors, indices };
})();
export function TutWorld({ t, wind = 0.1, rings = [], motes = 0, moteCount = 260 }: { t: number; wind?: number; rings?: Ring[]; motes?: number; moteCount?: number }) {
  const blow = wind / 0.1;
  return (
    <>
      <Look mode="paint" bands={2} shadow="#9bb7da" mid="#cddbef" grain={0.05} rag={1.4} boil={3} sky={["#3896d4", "#72bfe9"]}
        water={WATER} foam={0.1} wash={0.6} stroke={0.25} strokeScale={0.3} saturate={1.1} foliage={0} wind={wind} windDirection={[1, 0.3]}
        cloudShadows={0.3} cloudShadowSize={45} cloudShadowDrift={[t * 1.4, t * 0.3]} haze="#7fc3ea" hazeStart={30} hazeDensity={0.009} hazeHeight={8} hazeMost={0.75}
        skip={["ui", "hero"]} />
      <DirectionalLight name="sun" transform={Transform.fromXyz(...SUN).lookingAt([0, 0, -6])} illuminance={20000} shadow_maps_enabled />
      <Shadows distance={90} firstCascade={30} cascades={2} mapSize={4096} />
      <Mesh3d name="ridges" allowOverlap><BufferMesh {...RIDGES} /><StandardMaterial base_color="#ffffff" perceptual_roughness={1} reflectance={0} double_sided cull_mode={null} /></Mesh3d>
      <Mesh3d name="terrain" allowOverlap><BufferMesh {...TERRAIN} /><StandardMaterial base_color="#ffffff" perceptual_roughness={1} reflectance={0} /></Mesh3d>
      <Mesh3d name="water" allowOverlap transform={Transform.fromXyz(POND.c[0], WATER, POND.c[1])}><Cuboid half_size={[POND.r[0] * 1.35, 0.005, POND.r[1] * 1.35]} />
        <ExtendedMaterial base={<StandardMaterial base_color="#4aa9df" perceptual_roughness={1} reflectance={0} />} extension={<PaintExtension breakup={0.3} scale={1.6} color="#7fcaf0" amount={0.55} />} /></Mesh3d>
      {/* light on the water: thin flat streaks that drift and wink */}
      <Instances name="glints" shadow={false} at={Array.from({ length: 60 }, (_, i) => { const u = hash(i, 9), v = hash(i, 10), x = POND.c[0] + (u - 0.5) * POND.r[0] * 1.6 + Math.sin(t * 0.3 + i) * 0.4, z = POND.c[1] + (v - 0.5) * POND.r[1] * 1.4;
        const on = pond(x, z) < -0.1 ? 0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.3) : 0; return { position: [x, WATER + 0.008, z] as V3, scale: [(0.4 + 1.6 * hash(i, 11)) * Math.max(0.001, on), 1, Math.max(0.001, on)] as V3 }; })}>
        <Cuboid half_size={[0.5, 0.002, 0.03]} /><StandardMaterial base_color="#ffffff" unlit /></Instances>
      {MEADOW.map((at, k) => <Instances key={k} name={`grass-${k}`} receiveShadow={false} shadow={false} src={staticFile(`glb/grass-${k}.glb`)} at={at} />)}
      <Instances name="rushes" receiveShadow={false} shadow={false} src={staticFile("glb/grass-1.glb")} at={RUSHES.map((r, i) => ({ position: r.position, rotation: swayRotation(r.yaw, lean(r.position[0], r.position[2], t, 0.09 * blow, 1.9, i)), scale: r.scale }))} />
      {[0, 1].map((k) => <Instances key={k} name={`daisies-${k}`} receiveShadow={false} shadow={false} src={staticFile(`glb/daisy-${k}.glb`)} at={flowers.filter((_, i) => i % 2 === k).map((f, i) => ({ position: f.position, rotation: [0, hash(i, k + 3) * 6.28, 0] as V3, scale: (f.scale as number) * 1.2 }))} />)}
      {[0, 1, 2].map((k) => <Instances key={k} name={`cattails-${k}`} allowOverlap receiveShadow={false} src={staticFile(`glb/cattail-${k}.glb`)} at={cattails.filter((_, i) => i % 3 === k).map((c, i) => ({ position: c.position, rotation: swayRotation(hash(i, k + 9) * 6.28, lean(c.position[0], c.position[2], t, 0.07 * blow, 1.3, i * 1.7)), scale: c.scale as number }))} />)}
      <Instances name="lilies" shape={lilyShape} shadow={false} at={lilies.map((l, i) => ({ position: [l.position[0], WATER + 0.004 + 0.002 * (i % 3), l.position[2]] as V3, rotation: [0, hash(i, 1) * 6.28, 0] as V3, scale: l.scale }))}><StandardMaterial base_color="#4eb04a" perceptual_roughness={1} reflectance={0} /></Instances>
      <Instances name="lotus" allowOverlap receiveShadow={false} shadow={false} src={staticFile("glb/lotus.glb")} at={lotus.map((l, i) => ({ position: [l.position[0] + 0.05, WATER + 0.012, l.position[2]] as V3, rotation: [0, hash(i, 4) * 6.28, 0] as V3, scale: (l.scale as number) * 1.4 }))} />
      {WILLOWS.map((w, i) => (
        <Fragment key={i}>
          <Model name={`willow-${i}-wood`} src={staticFile(`glb/willow-${w.k}-wood.glb`)} position={[w.at[0], height(w.at[0], w.at[1]) - 0.1, w.at[1]]} rotation={[0, w.turn, 0]} scale={w.s} />
          <Model name={`willow-${i}-leaves`} receiveShadow={false} src={staticFile(`glb/willow-${w.k}-leaves.glb`)} position={[w.at[0], height(w.at[0], w.at[1]) - 0.1, w.at[1]]} rotation={swayRotation(w.turn, lean(w.at[0], w.at[1], t, 0.022 * blow, 0.8, i * 2))} scale={w.s} />
        </Fragment>
      ))}
      {[0, 1].map((k) => <Instances key={k} name={`bushes-${k}`} allowOverlap receiveShadow={false} src={staticFile(`glb/bush-${k}.glb`)} at={bushes.filter((_, i) => i % 2 === k).map((b, i) => ({ position: b.position, rotation: swayRotation(hash(i, k + 7) * 6.28, lean(b.position[0], b.position[2], t, 0.035 * blow, 1.1, i)), scale: b.scale }))} />)}
      {[0, 1, 2].map((k) => <Instances key={k} name={`far-${k}`} allowOverlap receiveShadow={false} src={staticFile(`glb/tree-${k}.glb`)} at={far.filter((_, i) => i % 3 === k).map((f, i) => ({ position: [f.position[0], f.position[1] - 0.2, f.position[2]] as V3, rotation: swayRotation(hash(i, k) * 6.28, lean(f.position[0], f.position[2], t, 0.018 * blow, 0.7, i)), scale: (f.scale as number) * 1.3 }))} />)}
      {FAR_RUINS.map((r, i) => (
        <Model key={`far-ruin-${i}`} name={`far-ruin-${i}`} receiveShadow={false} src={staticFile(`glb/ruin-${r.src}.glb`)} position={[r.at[0], height(r.at[0], r.at[1]) - r.sink, r.at[1]]}
          rotation={[r.lean?.[0] ?? 0, Math.atan2(-r.at[0], 9 - r.at[1]) + (r.turn ?? 0), r.lean?.[1] ?? 0]} scale={r.s} />
      ))}
      <Ruins />
      <Ripples rings={[...pondRings(t), ...rings]} />
      {moteCount > 0 && <Motes t={t} n={moteCount} glow={motes} />}
      {CLOUDS.map((c, i) => { const a = c.a + t * 0.0009, x = Math.cos(a) * c.r, z = Math.sin(a) * c.r - 12;
        return <ImagePlane key={i} name={`cloud-${i}`} src={staticFile(`sky/cloud-${c.k}.png`)} width={c.w} height={c.w * CLOUD_AR[c.k]} position={[x, c.y, z]} rotation={[0, Math.atan2(-x, -(z + 12)), 0]} shadow={false} />; })}
    </>
  );
}
