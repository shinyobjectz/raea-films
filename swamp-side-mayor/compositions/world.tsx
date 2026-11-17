// The swamp: blue sky, clouds, a pond in a meadow, mud at the water's edge, cattails, willows. All of it grown or
// scattered from functions of the ground, drawn under the paint look (flat tones, ink line, wind in the grass).
import { Fragment } from "react";
import { staticFile } from "raea";
import { Grass, Instances, Look, Outline, Shadows, crossSection, manifold, scatter } from "raea/3d";
import { Cloud } from "../components/cloud";
import { DirectionalLight } from "raea/light";
import { ExtendedMaterial, PaintExtension, StandardMaterial } from "raea/pbr";
import { Capsule3d, Cuboid, Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Transform } from "raea/transform";

export type V3 = [number, number, number];
const hash = (x: number, z: number) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x: number, z: number) => { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return (hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u) * (1 - v) + (hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u) * v; };
/** The pond: an ellipse behind the stage, its shore wandering. Negative inside, 0 on the shore, 1 one radius out. */
export const POND: { c: [number, number]; r: [number, number] } = { c: [0, -13], r: [15, 8] };
const shoreR = (a: number) => 1 + 0.16 * Math.sin(a * 3 + 1) + 0.09 * Math.sin(a * 7 + 2) + 0.05 * Math.sin(a * 13);
export const pond = (x: number, z: number) => { const dx = (x - POND.c[0]) / POND.r[0], dz = (z - POND.c[1]) / POND.r[1]; return Math.hypot(dx, dz) / shoreR(Math.atan2(dz, dx)) - 1; };
/** The ground's height: flat land (the pond is cut out of it). */
export const ground = (_x: number, _z: number) => 0;
const ring = (k: number): [number, number][] => Array.from({ length: 96 }, (_, i) => { const a = (i / 96) * Math.PI * 2, r = shoreR(a) * k; return [POND.c[0] + Math.cos(a) * POND.r[0] * r, -(POND.c[1] + Math.sin(a) * POND.r[1] * r)] as [number, number]; }).reverse();
const hole = (k: number, h: number, y: number) => crossSection.polygon(ring(k)).extrude(h).rotate(-90, 0, 0).move(0, y, 0);
const LAND = manifold.box(160, 1, 160).move(0, -0.5, -10).minus(hole(1, 3, -2));
const MUD = hole(1.09, 0.02, -0.005).minus(hole(0.985, 1, -0.5));
const BED = manifold.box(POND.r[0] * 2.8, 0.2, POND.r[1] * 2.8).move(POND.c[0], -0.75, POND.c[1]);
export const WATER = -0.12;
const AREA = { min: [-60, -60] as [number, number], max: [60, 30] as [number, number] };
const reeds = scatter({ area: { min: [-18, -23], max: [18, -3] }, count: 150, spacing: 0.3, seed: 4, y: ground, density: (x, z) => { const p = pond(x, z); return p > -0.1 && p < 0.1 && (z < -13 || Math.abs(x) > 8.5) ? 1 : 0; }, scale: [0.7, 1.25], tilt: 0.12 });
const lilies = scatter({ area: { min: [-14, -20], max: [14, -6] }, count: 40, spacing: 1.1, seed: 7, y: () => WATER + 0.012, density: (x, z) => (pond(x, z) < -0.25 ? 1 : 0), scale: [0.7, 1.4] });
const WILLOWS: [number, number, number, number][] = [[-11, -4.5, 9, 1], [12.5, -6, 10.5, 2], [-20, -17, 12, 3], [21, -19, 11, 4], [2, -25, 13, 5], [-30, 2, 12, 6], [31, -2, 13, 7]];
// each willow: a trunk, a canopy of leaf masses, and curtains of thin strands hung under it that swing
const canopy = WILLOWS.flatMap(([x, z, h, seed]) => Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 + seed, r = i === 0 ? 0 : h * (0.2 + 0.12 * hash(i, seed));
  return { position: [x + Math.cos(a) * r, h * (0.86 - 0.1 * hash(i * 5, seed)) - (i === 0 ? -0.4 : 0), z + Math.sin(a) * r] as V3, scale: h * (0.2 + 0.07 * hash(i * 2, seed)) }; }));
const strands = WILLOWS.flatMap(([x, z, h, seed]) => Array.from({ length: 260 }, (_, i) => { const a = hash(i, seed) * Math.PI * 2, r = h * (0.12 + 0.36 * Math.sqrt(hash(i * 3, seed))), len = h * (0.25 + 0.45 * hash(i * 7, seed));
  return { position: [x + Math.cos(a) * r, h * (0.8 - 0.2 * (r / (h * 0.5)) ** 2) - len / 2, z + Math.sin(a) * r] as V3, rotation: [0.06 * Math.sin(i), a, 0.06 * Math.cos(i)] as V3, scale: [0.6 + hash(i * 9, seed), len, 1] as V3, k: i }; }));
export function World({ t, wind = 0.1 }: { t: number; wind?: number }) {
  return (
    <>
      <Look mode="paint" bands={2} shadow="#7f9bd0" mid="#c6d6f2" grain={0.12} rag={1.2} boil={3} sky={["#2f8fd6", "#6fc0ee"]} outline="#1d2a44" outlineWidth={3}
        water={WATER} foam={0.12} wash={1} skip={["ui", "hero"]} saturate={1.15} foliage={0.8} wind={wind} windDirection={[1, 0.3]} cloudShadows={0.25} cloudShadowDrift={[t * 1.5, 0]} haze="#8fd0f2" hazeStart={25} hazeDensity={0.012} />
      <Outline color="#1b2b4a" width={2.4} depth={0.14} normal={0} far={16} skip={["ui"]} />
      <DirectionalLight name="sun" transform={Transform.fromXyz(-14, 22, 12).lookingAt([0, 0, -6])} illuminance={21000} shadow_maps_enabled />
      <Shadows distance={70} firstCascade={50} cascades={1} mapSize={4096} />
      <Mesh3d name="land" shape={LAND}><ExtendedMaterial base={<StandardMaterial base_color="#6fc23a" perceptual_roughness={1} />} extension={<PaintExtension breakup={0.5} scale={0.5} color="#4fa62e" amount={0.7} />} /></Mesh3d>
      <Mesh3d name="mud" shape={MUD}><ExtendedMaterial base={<StandardMaterial base_color="#7a5234" perceptual_roughness={1} />} extension={<PaintExtension breakup={0.5} scale={0.3} color="#4f3320" amount={0.8} />} /></Mesh3d>
      <Mesh3d name="bed" shape={BED} allowOverlap><StandardMaterial base_color="#2f6f9a" perceptual_roughness={1} /></Mesh3d>
      <Mesh3d name="water" transform={Transform.fromXyz(POND.c[0], WATER - 0.02, POND.c[1])}><Cuboid half_size={[POND.r[0] * 1.3, 0.02, POND.r[1] * 1.3]} /><ExtendedMaterial base={<StandardMaterial base_color="#3f9fd8" perceptual_roughness={1} />} extension={<PaintExtension breakup={0.25} scale={1.2} color="#7cc8f0" amount={0.6} />} /></Mesh3d>
      <Grass name="meadow" area={AREA} height={ground} density={(x, z) => (pond(x, z) < 0.07 ? 0 : pond(x, z) < 0.25 ? 5 : 9)} patch={(x, z) => (noise(x * 0.12, z * 0.12) > 0.55 ? 1 : 0)} size={(x, z) => (0.7 + 0.9 * noise(x * 0.2 + 3, z * 0.2)) * (0.1 + 0.9 * Math.min(1, Math.max(0, Math.hypot(x, z - 0.6) - 1.2) / 4.5))}
        tints={[["#2f8a2a", "#8fdc3c"], ["#35912e", "#a4e044"]]} highlight="#d8f07a" highlightMix={0.12} bladeHeight={0.24} seed={2} />
      {/* cattails: a stem and a brown head, the same placements */}
      <Instances name="reed-stems" at={reeds.map((p) => ({ ...p, position: [p.position[0], p.position[1] + 0.7 * (p.scale as number ?? 1), p.position[2]] as V3 }))} shadow={false}><Cylinder radius={0.012} half_height={0.7} /><StandardMaterial base_color="#5c9a2e" perceptual_roughness={1} /></Instances>
      <Instances name="reed-heads" at={reeds.map((p) => ({ ...p, position: [p.position[0], p.position[1] + 1.3 * (p.scale as number ?? 1), p.position[2]] as V3 }))} shadow={false}><Capsule3d radius={0.035} half_length={0.09} /><StandardMaterial base_color="#6b3d1e" perceptual_roughness={1} /></Instances>
      <Instances name="lilies" at={lilies} shadow={false} allowOverlap><Cylinder radius={0.32} half_height={0.008} /><StandardMaterial base_color="#3fae4a" perceptual_roughness={1} /></Instances>
      {WILLOWS.map(([x, z, h], k) => (
        <Mesh3d key={k} name={`willow-trunk-${k}`} allowOverlap transform={Transform.fromXyz(x, h * 0.4, z)}><Cylinder radius={h * 0.035} half_height={h * 0.42} /><StandardMaterial base_color="#7a5636" perceptual_roughness={1} /></Mesh3d>
      ))}
      <Instances name="willow-canopy" at={canopy.map((c) => ({ position: c.position, scale: [c.scale, c.scale * 0.62, c.scale] as V3 }))}><Sphere radius={1} /><StandardMaterial base_color="#74c63a" perceptual_roughness={1} /></Instances>
      <Instances name="willow-strands" at={strands.map((s) => ({ position: [s.position[0] + 0.25 * Math.sin(t * 1.3 + s.k * 0.7) * (s.scale[1] / 4), s.position[1], s.position[2]] as V3, rotation: [s.rotation[0], s.rotation[1], s.rotation[2] + 0.08 * Math.sin(t * 1.3 + s.k * 0.7)] as V3, scale: s.scale }))} shadow={false}><Cuboid half_size={[0.022, 0.5, 0.008]} /><StandardMaterial base_color="#a8e650" perceptual_roughness={1} /></Instances>
      <Cloud name="cloud-a" position={[-26 + t * 0.25, 17, -48]} size={[26, 13, 10]} count={11} seed={1} time={t} resolution={48} />
      <Cloud name="cloud-b" position={[16 + t * 0.2, 21, -55]} size={[22, 11, 9]} count={9} seed={2} time={t} resolution={48} />
      <Cloud name="cloud-d" position={[-52 + t * 0.2, 12, -60]} size={[30, 16, 10]} count={12} seed={5} time={t} resolution={48} />
      <Cloud name="cloud-e" position={[70 + t * 0.25, 24, -70]} size={[34, 18, 10]} count={12} seed={6} time={t} resolution={48} />
      <Cloud name="cloud-f" position={[0 + t * 0.15, 30, -80]} size={[40, 14, 10]} count={10} seed={8} time={t} resolution={40} />
      <Cloud name="cloud-c" position={[44 + t * 0.3, 14, -50]} size={[18, 9, 8]} count={8} seed={3} time={t} resolution={40} />
    </>
  );
}
export const gooseSrc = () => staticFile("glb/goose-idle.glb");
