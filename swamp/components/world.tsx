// The swamp as a real place: scanned trees, roots, rocks and plants (Poly Haven, CC0, each with its licence sidecar in
// assets/models), still water that mirrors them, and the parts that change with the film's four values.
import { IVY } from "./ivy-data";
import { interpolate, staticFile } from "raea";
import { Entity, Instances, Model, eulerOf, manifold, grow, scatter, sdf } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { Cuboid, Cylinder, Mesh3d, Sphere, Torus } from "raea/mesh";
import { FogVolume, StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import type { World } from "./set";
import { BEAM_AT } from "./groundbeam";
import { BOW, blockUnder, bowAt, carried } from "./opening";
import { type Q, qa, qm } from "./quat";
import type { ReactNode } from "react";
import { robotAt2 } from "./take";
import { GOOSE } from "./goose";
import { T, MON, MON_ROT, RINGS, SH, SW, type V3, clamp, hex, lerp, rnd, settleAt } from "./timeline";

const m = (id: string, part: string | number = "cut") => staticFile(`models/${id}/${id}.${part}.gltf`);
const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const quat = (x: number, y: number, z: number) => Quat.fromEuler("XYZ", x, y, z);
const out = (t: number) => 1 - (1 - t) * (1 - t);

// ------------------------------------------------------------------ trees
// two scanned trees, each split into wood and leaves so the canopy can come in on its own
const KIND = [
  { id: "island_tree_01", h: 5.0 },
  { id: "island_tree_02", h: 3.4 },
];
export const TREES: { p: [number, number]; k: number; yaw: number; s: number }[] = [
  { p: [-4.2, -10.0], k: 0, yaw: 0.3, s: 2.7 }, { p: [6.4, -3.6], k: 1, yaw: 4.4, s: 3.6 }, { p: [-13.5, 4.5], k: 1, yaw: 5.2, s: 3.3 },
  { p: [9.2, 2.6], k: 0, yaw: 0.9, s: 2.5 }, { p: [-6.6, 6.2], k: 0, yaw: 1.1, s: 2.3 }, { p: [6.6, 7.8], k: 1, yaw: 3.9, s: 3.2 },
  { p: [-16.0, -11.0], k: 1, yaw: 0.2, s: 3.9 }, { p: [11.2, -8.8], k: 0, yaw: 2.9, s: 3.0 }, { p: [-3.6, 12.5], k: 1, yaw: 4.9, s: 3.4 },
  { p: [4.0, 13.0], k: 0, yaw: 0.6, s: 2.6 }, { p: [-9.5, -15.5], k: 0, yaw: 1.9, s: 3.1 }, { p: [8.8, -10.4], k: 1, yaw: 3.3, s: 3.7 },
];
// the far wood: a ring of the same trees, standing back behind the monitor so the sky shows over it
const FAR = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * 6.283 + rnd(i, 61) * 0.12;
  const back = Math.sin(a) < 0 && Math.abs(Math.cos(a)) < 0.55;
  const r = back ? 38 + rnd(i, 62) * 12 : 17 + rnd(i, 62) * 14;
  const k = i % 2;
  return { k, position: [Math.cos(a) * r, -0.15, Math.sin(a) * r] as V3, rotation: [0, rnd(i, 63) * 6.28, 0] as V3, scale: (k ? 3.5 : 2.6) * (0.85 + rnd(i, 65) * 0.5), dist: r };
});
// and behind that, two more lines of them out to the horizon, bigger so they still stand over the haze: what fills
// the gaps between the near trunks with wood, not open sky
for (let i = 0; i < 64; i++) {
  const ring = i < 26 ? 0 : 1;
  const n = ring ? 38 : 26, j = ring ? i - 26 : i;
  const a = (j / n) * 6.283 + rnd(i, 71) * 0.2;
  const r = ring ? 105 + rnd(i, 72) * 45 : 58 + rnd(i, 72) * 26;
  const k = i % 2;
  FAR.push({ k, position: [Math.cos(a) * r, -0.15, Math.sin(a) * r] as V3, rotation: [0, rnd(i, 73) * 6.28, 0] as V3, scale: (k ? 3.5 : 2.6) * (ring ? 2.3 : 1.5) * (0.8 + rnd(i, 75) * 0.6), dist: r });
}
// low islands of mossy rock between the lines of trees
const ISLES = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * 6.283 + rnd(i, 81) * 0.3, r = 30 + rnd(i, 82) * 85;
  const w = 3 + rnd(i, 83) * 6 + r * 0.05;
  return { src: m("rock_moss_set_01", [0, 1, 4, 5][i % 4]), p: [Math.cos(a) * r, -0.5, Math.sin(a) * r] as V3, r: [0, rnd(i, 84) * 6.28, 0] as V3, s: [w, 1.1 + rnd(i, 85) * 1.2, w * (0.5 + rnd(i, 86) * 0.5)] as V3 };
}).filter((q) => Math.hypot(q.p[0], q.p[2] - 4) > 24);
const wave = (dist: number, g: number) => {
  // the leaves break out in a wave that rolls away from the monitor
  const d = Math.min(0.55, dist / 40);
  return out(interpolate(g, [d, d + 0.4], [0, 1], clamp));
};

// v5 (note 10): the beam's energy in the trees round the pit. As it fires (T.beam) each is pushed over, away from it,
// in a few frames, swings back and forth a few times as a tree does in a gust, and shudders, the shock running through
// the wood; then, while it hums, it settles leaning a little away (the beam's draught) and trembles. Harder the nearer
// the pit (6-20 m off). Each tree turns about its foot, where its model's origin is
const TREE_LEAN = 0.12; // radians at about 7 m: the push peaks near 4 degrees and swings back past upright by 3
export const treeSway = (x: number, z: number, f: number, i: number): Q => {
  if (f < T.beam || f >= T.orbit) return [0, 0, 0, 1];
  const dx = x - BEAM_AT[0], dz = z - BEAM_AT[2], d = Math.hypot(dx, dz);
  const ox = dx / d, oz = dz / d;
  const near = Math.min(1, Math.pow(7 / d, 0.8));
  const t = f - T.beam;
  // the push and its swings: pushed over in about 8 frames (as 25b-beam's camera whips up), swinging back with the
  // tree's own period (64-76 frames) in the steady frames after, dying away slowly as a big tree's swing does
  const push = (1 - Math.exp(-t / 4)) * Math.exp(-t / 40) * Math.cos((2 * Math.PI * t) / (64 + 12 * rnd(i, 91)));
  const draught = 0.2 * interpolate(t, [8, 40], [0, 1], clamp);
  const lean = TREE_LEAN * near * (push + draught);
  // the shudder (dying in about 10 frames) and the tremble it leaves while the beam hums. Small and no faster than about
  // 4 Hz: v5's first, 10 Hz and a degree, flickered the dark crowns against the sky past WCAG's three flashes a second
  // (raea check, 25b-beam)
  const sh = near * (0.005 * Math.exp(-t / 10) + 0.0015 * interpolate(t, [10, 24], [0, 1], clamp));
  const jx = sh * (Math.sin(t * 0.8 + i) + 0.6 * Math.sin(t * 1.1 + i * 2.1));
  const jz = sh * (Math.sin(t * 0.9 + i * 1.3) + 0.6 * Math.sin(t * 0.7 + i * 0.7));
  // turning about (oz, 0, -ox) tips the tree's top out, away from the beam
  return qm(qa([oz, 0, -ox], lean), qm(qa([1, 0, 0], jx), qa([0, 0, 1], jz)));
};

export function Trees({ w }: { w: World }) {
  const g = Math.round(w.grow * 60) / 60;
  return (
    <>
      {TREES.map((t, i) => {
        const e = wave(Math.hypot(t.p[0], t.p[1]), w.grow);
        const id = KIND[t.k].id;
        const sw = treeSway(t.p[0], t.p[1], w.f, i);
        const rot: V3 = sw[3] === 1 ? [0, t.yaw, 0] : (eulerOf(qm(sw, qa([0, 1, 0], t.yaw))) as V3);
        return (
          <Entity key={i} transform={Transform.IDENTITY}>
            <Model name={`tree-${i}`} allowOverlap src={m(id, "wood")} position={[t.p[0], -0.18, t.p[1]]} rotation={rot} scale={t.s} />
            {e > 0 && <Model name={`leaves-${i}`} allowOverlap src={m(id, "leaves")} position={[t.p[0], -0.18 + (1 - e) * KIND[t.k].h * t.s * 0.25, t.p[1]]} rotation={rot} scale={t.s * (0.45 + 0.55 * e)} />}
          </Entity>
        );
      })}
      {ISLES.map((q, i) => (
        <Model key={i} name={`isle-${i}`} src={q.src} position={q.p} rotation={q.r} scale={q.s} />
      ))}
      {[0, 1].map((k) => (
        <Instances key={k} name={`far-wood-${k}`} src={m(KIND[k].id, "wood")} at={FAR.filter((f) => f.k === k)} />
      ))}
      {g > 0.1 && [0, 1].map((k) => (
        <Instances key={k} name={`far-leaves-${k}`} src={m(KIND[k].id, "leaves")} at={FAR.filter((f) => f.k === k).map((f) => { const e = wave(f.dist * 0.6, g); return { position: [f.position[0], f.position[1] + (1 - e) * KIND[k].h * f.scale * 0.25, f.position[2]] as V3, rotation: f.rotation, scale: f.scale * (0.02 + 0.98 * e) }; })} />
      ))}
    </>
  );
}

// ------------------------------------------------------------------ the ground: bank, rocks, dead wood
type Put = { src: string; p: V3; r?: V3; s?: number | V3 };
const ROCKS: Put[] = [
  // the bank the keyboard lies on: a mound of earth and roots, flattened, its top just over the water
  { src: m("root_cluster_01"), p: [0.25, -0.36, 3.45], r: [0, 0.15, 0], s: [1.75, 0.42, 1.7] },
  // and its front lip, so the keyboard's near edge lies on earth, not over open water: a margin of about 0.9 m in front of
  // the keys and 1.4 m either side (it was a 5.8 x 1.6 m shelf at lens height that the low water shots ran into)
  { src: m("root_cluster_01"), p: [0.3, -0.39, 4.0], r: [0, 3.3, 0], s: [0.8, 0.42, 0.47] },
  { src: m("rock_moss_set_02", 4), p: [0.35, -0.04, 3.72], r: [0, 0.2, 0], s: [1.15, 0.3, 0.75] },
  // mossy rock round the monitor's foot and the bank
  { src: m("rock_moss_set_01", 2), p: [-2.6, -0.35, 0.4], r: [0, 0.6, 0], s: 0.8 },
  { src: m("rock_moss_set_02", 5), p: [2.7, -0.4, 0.2], r: [0, 2.4, 0], s: 0.9 },
  { src: m("rock_moss_set_02", 1), p: [-2.3, -0.2, 3.9], r: [0, 1.2, 0], s: 0.8 },
  { src: m("rock_moss_set_02", 3), p: [2.9, -0.45, 3.6], r: [0, 4.0, 0], s: 0.7 },
  { src: m("rock_moss_set_02", 0), p: [0.9, -0.2, 5.0], r: [0, 0.4, 0], s: 0.7 },
  { src: m("boulder_01"), p: [-3.6, -0.25, 2.6], r: [0, 2.0, 0], s: 0.9 },
  // islets under the near trees
  { src: m("rock_moss_set_01", 0), p: [-4.2, -0.75, -10.0], r: [0, 1.0, 0], s: 1.4 },
  { src: m("rock_moss_set_01", 1), p: [6.4, -0.7, -3.6], r: [0, 3.0, 0], s: 1.3 },
  { src: m("rock_moss_set_01", 4), p: [-13.5, -0.6, 4.5], r: [0, 0.2, 0], s: 1.3 },
  { src: m("rock_moss_set_01", 5), p: [9.2, -0.6, 2.6], r: [0, 5.0, 0], s: 1.3 },
  { src: m("rock_moss_set_01", 3), p: [-6.6, -0.95, 6.2], r: [0, 2.2, 0], s: 1.2 },
  { src: m("rock_moss_set_01", 0), p: [6.6, -0.8, 7.8], r: [0, 4.2, 0], s: 1.2 },
  // dead wood in the water
  { src: m("dead_tree_trunk_02"), p: [4.6, 0.05, 4.6], r: [0.05, 0.9, 0.08], s: 1.3 },
  { src: m("dead_tree_trunk"), p: [-4.4, 0.02, 5.2], r: [0, 2.3, 0.12], s: 1.5 },
  { src: m("dead_tree_trunk"), p: [3.2, 0.0, -2.2], r: [0, 0.3, -0.1], s: 1.6 },
  { src: m("tree_stump_01"), p: [-3.4, 0.0, -1.6], r: [0, 1.0, 0], s: 1.2 },
  { src: m("tree_stump_01"), p: [5.4, -0.05, 1.4], r: [0, 4.0, 0], s: 1.0 },
  { src: m("root_cluster_02", 7), p: [-1.9, 0.02, 1.2], r: [0, 0.8, 0], s: 1.1 },
  { src: m("root_cluster_02", 7), p: [2.0, 0.0, 1.1], r: [0, 3.6, 0], s: 1.0 },
  { src: m("single_root"), p: [-0.9, 0.05, 0.2], r: [0, 2.2, 0], s: 1.2 },
  { src: m("dry_branches_medium_01", 2), p: [1.9, 0.12, 4.4], r: [0, 1.0, 0], s: 1.2 },
  { src: m("dry_branches_medium_01", 1), p: [-1.7, 0.1, 4.6], r: [0, 4.0, 0], s: 1.1 },
];

// plants that come with the growth: [file, place, yaw, size, when in the wave it starts]
const fromTo = (list: [string, number | string, number, number, number, number][]) => list.map(([id, part, x, y, z, s], i) => ({ src: m(id, part), p: [x, y, z] as V3, yaw: rnd(i, 41) * 6.28, s, at: Math.min(0.5, Math.hypot(x, z) / 30) }));
const PLANTS = fromTo([
  ["fern_02", 0, -2.2, 0.16, 3.5, 1.5], ["fern_02", 1, 2.5, 0.1, 3.2, 1.4], ["fern_02", 0, -2.4, 0.2, 0.7, 1.6], ["fern_02", 1, 2.6, 0.15, 0.5, 1.5], ["fern_02", 2, 1.3, 0.2, 4.6, 1.5], ["fern_02", 3, -1.0, 0.2, 4.7, 1.5],
  ["fern_02", 0, -1.6, 0.22, 2.9, 1.0], ["fern_02", 1, 2.0, 0.2, 4.0, 1.0], ["fern_02", 3, -3.4, 0.35, 2.4, 1.2],
  ["anthurium_botany_01", 0, 2.9, 0.25, 0.9, 1.3], ["anthurium_botany_01", 1, -2.9, 0.3, 0.9, 1.3], ["anthurium_botany_01", 3, 1.5, 0.12, 2.3, 1.1],
  ["shrub_02", 1, -3.8, 0.35, -9.2, 0.9], ["shrub_02", 3, 6.0, 0.4, -2.9, 0.9], ["shrub_02", 0, -12.9, 0.4, 5.2, 0.8], ["shrub_02", 2, 8.6, 0.4, 3.2, 0.8], ["shrub_02", 1, -6.0, 0.2, 6.6, 0.8], ["shrub_02", 3, 6.1, 0.3, 8.2, 0.8],
  ["fern_02", 0, -3.6, 0.45, -10.6, 1.8], ["fern_02", 1, 6.9, 0.45, -4.2, 1.8], ["fern_02", 0, -13.9, 0.45, 3.9, 1.8], ["fern_02", 1, 9.6, 0.45, 2.0, 1.8], ["fern_02", 0, -7.0, 0.2, 5.7, 1.7], ["fern_02", 1, 7.0, 0.3, 7.2, 1.7],
  ["periwinkle_plant", 5, -0.9, 0.24, 3.0, 1.2], ["periwinkle_plant", 3, 1.5, 0.22, 3.0, 1.1], ["dandelion_01", 0, 0.9, 0.24, 4.1, 1.2], ["dandelion_01", 1, -0.5, 0.24, 4.2, 1.2],
]);

/** v5: the block each plant stands on, if it's on the slab (opening.tsx) */
const PLANT_BLOCK = PLANTS.map((p) => blockUnder(p.p[0], p.p[2]));

// grass over the bank and the keyboard's edges: dry and low while the world is dead, standing up green with the growth
const GRASS_KINDS = [1, 2, 3, 4];
const GRASS = GRASS_KINDS.map((k, n) =>
  scatter({ area: { min: [-2.3, 2.3], max: [2.8, 4.9] }, count: 110, spacing: 0.1, seed: 31 + n, yaw: [0, 6.28], tilt: 0.1, scale: [0.7, 1.25], y: (x, z) => 0.24 - 0.09 * Math.pow(Math.hypot((x - 0.25) / 2.6, (z - 3.55) / 1.3), 2.5), density: (x, z) => {
    const kb = Math.abs(x - 0.25) < 0.86 && Math.abs(z - 3.3) < 0.3; // the keys stay clear; blades crowd their edge
    if (Math.hypot(x - GOOSE.at[0], z - GOOSE.at[2] - 0.1) < 0.36) return 0; // v5: none under the goose's bones (goose.tsx)
    return kb ? 0 : Math.hypot((x - 0.25) / 2.6, (z - 3.55) / 1.3) < 1 ? 1 : 0;
  } }),
);

// v5 (notes 8 and 9): the clumps round the pit are drawn one by one, so they can move: those rooted on the slab ride the
// block of earth under each as it swells, tilts and is thrown (opening.tsx carried), sinking with it if it lands in the
// water; those round it bow to the blast and the beam (bowAt). v4 left them standing as the blocks rose under them and
// took the ones over the pit away at the blast
const nearPit = (g: { position: number[] }) => Math.hypot(g.position[0] - BEAM_AT[0], g.position[2] - BEAM_AT[2]) < BOW;
const GRASS_STILL = GRASS.map((l) => l.filter((g) => !nearPit(g)));
const qxyz = (r: number[]): Q => qm(qm(qa([1, 0, 0], r[0]), qa([0, 1, 0], r[1])), qa([0, 0, 1], r[2]));
const GRASS_RIDERS = GRASS.flatMap((l, n) =>
  l.filter(nearPit).map((g) => ({ n, p: g.position as V3, q: qxyz((g.rotation ?? [0, 0, 0]) as number[]), s: (g.scale ?? 1) as number, k: blockUnder(g.position[0], g.position[2]) })),
);
/** where something rooted at p (its turn q0) is at frame f, its turn, and whether it's gone with its block */
const ride = (p: V3, q0: Q, k: number | null, f: number, seed: number): { p: V3; q: Q; gone: boolean } => {
  if (k === null) return { p, q: qm(bowAt(p[0], p[2], f, seed), q0), gone: false };
  const c = carried(k, f);
  return { p: c.at(p), q: qm(c.q, q0), gone: c.gone };
};

// ------------------------------------------------------------------ water, lilies, reeds, rings
const PAD = manifold.cylinder(0.2, 0.012).rotate(-90, 0, 0).minus(manifold.box(0.3, 0.1, 0.05).move(0.17, 0, 0)).refineToLength(0.04).warp((x, y, z) => [x, y + 0.02 * (x * x + z * z) * 8 + 0.004 * Math.sin(Math.atan2(z, x) * 9), z]);
const LILY_FLOWER = grow.rosette({ leaves: 16, length: 0.11, width: 0.04, thick: 0.008, tilt: 40, rise: 0.04 });
export const LILIES = Array.from({ length: 110 }, (_, i) => {
  const p: V3 = [(rnd(i, 23) - 0.5) * 17, 0.006, 0.4 + rnd(i, 24) * 9];
  return { p, s: 0.7 + rnd(i, 25) * 1.0, yaw: rnd(i, 26) * 6.28, flower: i % 5 === 0, dist: Math.hypot(p[0], p[2] - 0.6) };
}).filter((l) => !(Math.abs(l.p[0] - 0.25) < 3.4 && l.p[2] > 1.9 && l.p[2] < 5.4));
const REED = [0, 1, 2].map((s) =>
  sdf.smoothUnion(0.01, sdf.tube([[0, 0, 0, 0.011], [0.02 + s * 0.02, 0.7, 0.01, 0.009], [0.07 + s * 0.04, 1.45 + s * 0.2, 0.02, 0.005]]), sdf.capsule([0.06 + s * 0.035, 1.15 + s * 0.17, 0.018], [0.068 + s * 0.04, 1.36 + s * 0.19, 0.02], 0.02)).solid(0.008),
);
const REED_LEAF = grow.loft([[0, "rect 0.016 0.002"], [0.6, "rect 0.013 0.002"], [1.25, "rect 0.002 0.001"]]).refineToLength(0.08).warp((x, y, z) => [x + y * y * 0.28, y, z]);
const reedSpots = (seed: number, count: number) =>
  scatter({ area: { min: [-9, 0.6], max: [9, 11] }, count, spacing: 0.06, seed, yaw: [0, 6.28], tilt: 0.1, scale: [0.7, 1.3], y: () => -0.03, density: (x, z) => {
    if (Math.abs(x - 0.25) < 3.2 && z > 2.0 && z < 5.4) return 0; // the bank
    if (Math.abs(x) < 2.4 && z < 2.4) return 0; // in front of the glass
    const clump = Math.sin(x * 1.3 + seed) * Math.cos(z * 0.9 + seed * 2) + Math.sin(x * 0.4 - z * 0.5);
    const lane = Math.abs(x + 3.0 - (9 - z) * 0.2) < 0.55 && z > 6.5 ? 0 : 1; // kept clear for the opening drift
    return clump > 0.7 ? lane : 0;
  } });
const REEDS = [reedSpots(3, 16), reedSpots(4, 16), reedSpots(5, 16)].map((l) => l.filter((r) => r.position[2] < 6.0 && Math.abs(r.position[0]) > 3.4));
const REED_LEAVES = reedSpots(6, 50).filter((r) => r.position[2] < 6.0 && Math.abs(r.position[0]) > 3.4);

export function Ground({ w }: { w: World }) {
  const { f } = w;
  // black peat water while dead; the picked colour clears it
  const waterCol = hex(hex("#050706", "#070b09", w.sun), "#020d0c", w.water);
  const dry = hex("#8a8468", "#b4b08c", w.sun);
  return (
    <>
      <Mesh3d name="water" allowOverlap transform={Transform.fromXyz(0, -0.02, 0)}>
        <Cuboid half_size={[400, 0.02, 400]} />
        <StandardMaterial base_color={waterCol} perceptual_roughness={lerp(0.07, 0.035, w.water)} reflectance={0.5} />
      </Mesh3d>
      <Mesh3d name="bed" allowOverlap transform={Transform.fromXyz(0, -0.9, 0)}>
        <Cuboid half_size={[400, 0.3, 400]} />
        <StandardMaterial base_color="#12160f" perceptual_roughness={1} />
      </Mesh3d>
      {ROCKS.map((r, i) => (
        <Model key={i} name={`ground-${i}`} src={r.src} position={r.p} rotation={r.r} scale={r.s ?? 1}>
          {i < 3 && <StandardMaterial base_color={i === 2 ? "#57534b" : "#6f6a60"} />}
        </Model>
      ))}
      {PLANTS.map((p, i) => {
        const e = out(interpolate(w.grow, [p.at, p.at + 0.35], [0, 1], clamp));
        if (e <= 0.02) return null;
        // v5: the plants by the pit ride the slab or bow to the blast, as the grass does (v4 flattened them and took them away)
        const r = ride(p.p, qa([0, 1, 0], p.yaw), PLANT_BLOCK[i], f, i * 3.1);
        return <Model key={i} name={`plant-${i}`} allowOverlap src={p.src} position={r.p} rotation={eulerOf(r.q)} scale={r.gone ? 1e-4 : p.s * e} />;
      })}
      {GRASS_STILL.map((at, n) => (
        <Instances key={n} name={`grass-${n}`} src={m("grass_medium_02", GRASS_KINDS[n])} at={at} shadow={false} scale={[1, 0.55 + 0.75 * w.grow, 1]}>
          <StandardMaterial base_color={hex(dry, "#ffffff", w.grow)} />
        </Instances>
      ))}
      {GRASS_RIDERS.map((g, i) => {
        const r = ride(g.p, g.q, g.k, f, i * 1.7);
        const s = r.gone ? 1e-4 : g.s;
        return (
          <Model key={`gr${i}`} name={`grass-near-${i}`} allowOverlap src={m("grass_medium_02", GRASS_KINDS[g.n])} position={r.p} rotation={eulerOf(r.q)} scale={[s, s * (0.55 + 0.75 * w.grow), s]} shadow={false}>
            <StandardMaterial base_color={hex(dry, "#ffffff", w.grow)} />
          </Model>
        );
      })}
      {REEDS.map((at, k) => (
        <Instances key={k} name={`reeds-${k}`} at={at} shape={REED[k]} shadow={false}>
          <StandardMaterial base_color={hex("#4d4a38", "#3f5a2c", w.grow)} perceptual_roughness={0.7} />
        </Instances>
      ))}
      <Instances name="reed-leaves" at={REED_LEAVES} shape={REED_LEAF} shadow={false} scale={[1, 0.8 + 0.3 * w.grow, 1]}>
        <StandardMaterial base_color={hex("#5a563e", "#4a7032", w.grow)} perceptual_roughness={0.55} double_sided cull_mode={null} />
      </Instances>
      {/* lilies unroll outward from the monitor's foot once the water's colour is picked */}
      {LILIES.map((l, i) => {
        const at = 0.08 + (l.dist / 10) * 0.8;
        const on = interpolate(w.water, [at, at + 0.16], [0, 1], clamp);
        if (on <= 0) return null;
        const e = out(on);
        return (
          <Entity key={i} transform={Transform.fromXyz(l.p[0], l.p[1] + Math.sin(f / 23 + i) * 0.002, l.p[2]).withRotation(quat(0, l.yaw + Math.sin(f / 50 + i) * 0.05, 0)).withScale([e * l.s, 1, e * l.s])}>
            <Mesh3d name={`pad-${i}`} allowOverlap shape={PAD}><StandardMaterial base_color={i % 3 === 0 ? "#3f6a2c" : "#35602a"} perceptual_roughness={0.32} reflectance={0.5} /></Mesh3d>
            {l.flower && (
              <Mesh3d name={`lily-${i}`} allowOverlap shape={LILY_FLOWER} transform={Transform.fromXyz(-0.03, 0.02, 0.02).withScale([e, e, e])}>
                <StandardMaterial base_color={i % 10 === 0 ? "#f3c9d9" : "#f6f0e4"} perceptual_roughness={0.5} />
              </Mesh3d>
            )}
          </Entity>
        );
      })}
      {f < WAKE_END && <Wake f={f} col={waterCol} />}
      {/* rings on the water where something touched it */}
      {RINGS.flatMap(([at, x, z], i) =>
        [0, 9].map((lag) => {
          const t = (f - at - lag) / 50;
          if (t <= 0 || t >= 1) return null;
          const r = 0.1 + t * 1.5;
          return (
            <Mesh3d key={`${i}-${lag}`} name={`ring-${i}-${lag}`} allowOverlap shadow={false} transform={Transform.fromXyz(x, -0.002, z).withRotation(quat(Math.PI / 2, 0, 0)).withScale([r, r, 0.5 * (1 - t)])}>
              <Torus major_radius={1} minor_radius={0.014} />
              <StandardMaterial base_color={waterCol} perceptual_roughness={0.04} reflectance={0.5} />
            </Mesh3d>
          );
        }),
      )}
    </>
  );
}

// v5 (note 15): the robot skimming in low over the water leaves a small wake, not a drop's ring. The crests spread
// sideways from under it as it goes: each leaves the path at tan(17 degrees) of the robot's own speed there (a fast
// small thing's wake is a little narrower than Kelvin's 19.5), so they make a V trailing from it, narrower where it flew
// faster, three crests deep (13 cm apart, a centimetre high at first), broadening, flattening and fading behind. It ends where the robot crosses onto the bank.
const WAKE_TAN = Math.tan((17 * Math.PI) / 180);
const WAKE_FROM = 6, WAKE_TO = 52, WAKE_STEP = 2, WAKE_END = 100;
const WAKE = Array.from({ length: (WAKE_TO - WAKE_FROM) / WAKE_STEP + 1 }, (_, i) => {
  const e = WAKE_FROM + i * WAKE_STEP;
  const a = robotAt2(e - 1), b = robotAt2(e + 1), p = robotAt2(e);
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1e-6;
  return { e, x: p[0], z: p[2], nx: -dz / len, nz: dx / len, v: len / 2 };
});
function Wake({ f, col }: { f: number; col: string }) {
  const fade = clamp01((WAKE_END - f) / 15);
  // a crest's point from emission j at frame f: k crests in (0 the outermost), on side s; null before it's made
  const point = (j: number, k: number, s: number) => {
    const w = WAKE[j];
    if (w.e > f) return null;
    const side = WAKE_TAN * w.v * (f - w.e) - k * 0.13;
    if (side <= 0.004) return null;
    const amp = (1 - 0.3 * k) * Math.exp(-(f - w.e) / 45) * Math.min(1, w.v / 0.08) * fade;
    return { x: w.x + s * w.nx * side, z: w.z + s * w.nz * side, amp, age: f - w.e };
  };
  const out: ReactNode[] = [];
  for (const k of [0, 1, 2])
    for (const s of [-1, 1])
      for (let j = 0; j < WAKE.length - 1; j++) {
        const a = point(j, k, s), b = point(j + 1, k, s);
        const on = a && b && Math.min(a.amp, b.amp) > 0.04;
        const amp = on ? (a.amp + b.amp) / 2 : 0;
        const ax = a?.x ?? 0, az = a?.z ?? 0, bx = b?.x ?? 0.01, bz = b?.z ?? 0;
        const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) * 1.12;
        const wide = 0.035 + 0.035 * Math.min(1, (a?.age ?? 0) / 30);
        // hidden by shrinking (a video render keeps what its first frame mounted)
        const sc: V3 = on ? [0.013 * amp, len, wide] : [1e-4, 1e-4, 1e-4];
        out.push(
          <Mesh3d key={`wake-${k}-${s}-${j}`} name={`wake-${k}-${s}-${j}`} allowOverlap shadow={false} transform={Transform.fromXyz((ax + bx) / 2, 0, (az + bz) / 2).withRotation(quat(0, Math.atan2(dz, -dx), Math.PI / 2)).withScale(sc)}>
            <Cylinder radius={1} half_height={0.5} />
            <StandardMaterial base_color={col} perceptual_roughness={0.04} reflectance={0.5} />
          </Mesh3d>,
        );
      }
  return <>{out}</>;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ------------------------------------------------------------------ what grows on the monitor
const BWH = (SW + 0.36) / 2, BHH = (SH + 0.36) / 2;
export function MonitorGrowth({ w }: { w: World }) {
  const e = out(interpolate(w.grow, [0.1, 0.6], [0, 1], clamp));
  return (
    <Entity transform={Transform.fromXyz(...MON).withRotation(quat(...MON_ROT))}>
      {/* ivy: bare woody stems up the left side and along the top while the world is dead; its leaves come in cluster by cluster, from the foot up */}
      <Model name="ivy-stems" src={staticFile("models/ivy/ivy.stems.gltf")} />
      {IVY.map((c, i) => {
        const k = out(interpolate(w.grow, [c.at, c.at + 0.3], [0, 1], clamp));
        return k <= 0 ? null : <Model key={i} name={`ivy-${i}`} src={staticFile(`models/ivy/ivy.c${i}.gltf`)} position={c.p} scale={k} />;
      })}
      {e > 0 && (
        <>
          <Model name="monitor-fern" src={m("fern_02", 2)} position={[-1.55, BHH + 0.0, 0.0]} rotation={[0, 0.8, 0]} scale={0.9 * e} />
          <Model name="monitor-grass-a" src={m("grass_medium_02", 3)} position={[-0.7, BHH, 0.02]} rotation={[0, 2.0, 0]} scale={0.8 * e} />
          <Model name="monitor-grass-b" src={m("grass_medium_02", 2)} position={[1.5, BHH, -0.02]} rotation={[0, 4.0, 0]} scale={0.8 * e} />
          <Model name="monitor-weed" src={m("periwinkle_plant", 2)} position={[0.6, BHH, 0.0]} rotation={[0, 1.0, 0]} scale={0.8 * e} />
        </>
      )}
    </Entity>
  );
}

// ------------------------------------------------------------------ fireflies and the mist
export const FLIES = Array.from({ length: 170 }, (_, i) => {
  const p: V3 = [(rnd(i, 9) - 0.5) * 19, 0.25 + rnd(i, 10) * 2.8, -5 + rnd(i, 11) * 13];
  return { p, dist: Math.hypot(p[0], p[2] - 0.5) };
});
/** v5: a firefly nearer the lens than this fades out (metres): in v4's 25-crack one drifted 15 cm from it and filled the
 *  corner of the frame as a dull golden ball */
const FLY_CLEAR = 0.6;
/** its radius (m), held to its size at FLY_D metres when it's nearer: at a 40 degree lens it's 47/d px across at 1080,
 *  so never more than about 10 px, the size the fireflies 5 m off are in 23-pull (v4's balls were 1-2 m off) */
const FLY_R = 0.016, FLY_D = 4.5;
export function Fireflies({ f, from, cam }: { f: number; from: number; cam?: V3 }) {
  return (
    <>
      {FLIES.map((fl, i) => {
        const at = from + fl.dist * 11;
        const on = interpolate(f, [at, at + 14], [0, 1], clamp);
        if (on <= 0) return null;
        const blink = 0.5 + 0.5 * Math.sin(f / (5 + (i % 5)) + i * 1.7);
        const p: V3 = [fl.p[0] + Math.sin(f / 43 + i) * 0.22, fl.p[1] + Math.sin(f / 31 + i * 2) * 0.14, fl.p[2] + Math.cos(f / 37 + i) * 0.2];
        const d = cam ? Math.hypot(p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]) : 6;
        const clear = interpolate(d, [FLY_CLEAR * 0.6, FLY_CLEAR], [0, 1], clamp);
        // sized by its distance when it's near, so it stays a point of light a few pixels across however near it drifts
        // (16 mm balls 1-2 m off read as golf balls in v4's 23-pull and 25-crack)
        const s = Math.max(1e-4, on * clear * (0.6 + 0.4 * blink) * Math.min(1, d / FLY_D));
        return (
          <Mesh3d key={i} name={`fly-${i}`} allowOverlap shadow={false} transform={Transform.fromXyz(...p).withScale([s, s, s])}>
            <Sphere radius={FLY_R} />
            <StandardMaterial base_color="#ffd27a" emissive={glow("#ffc24a", 900 * blink)} />
          </Mesh3d>
        );
      })}
    </>
  );
}

export function Mist({ w }: { w: World }) {
  // thick and low while the world is dead, thinner once the sun is up, warm again at dusk
  const low = lerp(lerp(0.04, 0.012, w.sun), 0.025, w.dusk);
  const settle = settleAt(w.f);
  return (
    <>
      {/* the note's answer: a bank of mist that rolls in over the water from the left, low enough that the sun cuts shafts through it */}
      {(w.mist ?? 0) > 0 && (
        <>
          <FogVolume name="mist-roll-a" position={[lerp(-34, -2, w.mist ?? 0), lerp(0.5, 0.2, settle), 5]} scale={[46, lerp(1.0, 0.4, settle), 30]} density={lerp(0.16, 0.06, w.dusk) * (w.mist ?? 0)} scattering={0.85} anisotropy={0.8} falloff={1} />
          <FogVolume name="mist-roll-b" position={[lerp(-50, 4, w.mist ?? 0), 1.3, -6]} scale={[60, 2.6, 30]} density={lerp(0.035, 0.012, w.dusk) * (w.mist ?? 0) * lerp(1, 0.35, settle)} scattering={0.8} anisotropy={0.8} falloff={1} />
        </>
      )}
      <FogVolume name="mist-low" position={[0, 0.9, 0]} scale={[90, 1.8, 90]} density={low} scattering={0.7} anisotropy={0.75} falloff={1} />
      {/* the far haze: a thin band out to the horizon, so each line of trees stands paler than the one in front */}
      <FogVolume name="mist-far" position={[0, 7, 0]} scale={[340, 14, 340]} density={lerp(lerp(0.0018, 0.0009, w.sun), 0.0014, w.dusk)} scattering={0.6} anisotropy={0.7} />
      <FogVolume name="mist-air" position={[0, 8, 0]} scale={[90, 16, 90]} density={lerp(lerp(0.005, 0.0004, w.sun), 0.0015, w.dusk)} scattering={0.6} anisotropy={0.8} />
    </>
  );
}
