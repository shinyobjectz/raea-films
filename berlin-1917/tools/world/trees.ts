// Street and square trees in December: bare limes (Tilia), the tree of Unter den Linden and of most of the city's
// avenues and squares, as instanced props (City.tsx Props, from the placements bake.ts writes once the map lane's
// trees layer is in). Local frame: y up, metres, the origin at the foot of the trunk.
//   A lime's form, bare: a straight trunk to a crown base 3-4 m up (street trees were limbed up for traffic), a
//   dense ovoid crown of many ascending limbs that split and split again, fine twigs at the ends; 14-20 m tall when
//   grown. The sizes below are a grown street lime's, ASSUMED (no inventory of the 1917 trees read): the map lane's
//   layer may give each tree a height, which scales the instance.
//   lime-bare-0..2   three seeded crowns, ~3k triangles each (instanced by the hundred: Unter den Linden, the
//                    squares, the Tiergarten's edge); a tree at 300 m is a few pixels of twig haze, so no LOD yet
// Material "bark" (a dark wet grey-brown: the December trunks, wet and sooty).
// usage: bun tools/world/trees.ts   -> assets/world/props/lime-bare-<k>.glb
import { Builder, type Material, writeGlb } from "./glb";
import { hash } from "./geom";

type V3 = [number, number, number];
const out = `${import.meta.dir}/../../assets/world/props`;

export const ASSUMED = {
  /** the trunk to the crown base, its radius at the foot, the whole tree's height */
  clear: 3.4, trunkR: 0.26, height: 16,
  /** limbs off the trunk, each limb's splits, how deep the splitting goes, sides of a branch's tube */
  limbs: 6, splits: 2, depth: 5, sides: 4,
  /** each generation's length and radius against its parent's, the limbs' lean from upright (radians) */
  lenK: 0.68, radK: 0.6, lean: 0.62, spread: 0.55,
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** A tapered tube from a (radius r0) to b (radius r1), `sides` faces, open ends. */
function tube(B: Builder, a: V3, b: V3, r0: number, r1: number, sides: number, col: number[]) {
  const d = unit([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
  let s = cross(d, [0, 1, 0]);
  if (Math.hypot(...s) < 1e-3) s = [1, 0, 0];
  s = unit(s);
  const t = unit(cross(s, d));
  for (let k = 0; k < sides; k++) {
    const a0 = (2 * Math.PI * k) / sides, a1 = (2 * Math.PI * (k + 1)) / sides, am = (a0 + a1) / 2;
    const dir = (q: number): V3 => add(mul(s, Math.cos(q)), mul(t, Math.sin(q)));
    const n = dir(am);
    B.quad(add(a, mul(dir(a0), r0)), add(a, mul(dir(a1), r0)), add(b, mul(dir(a1), r1)), add(b, mul(dir(a0), r1)), n, col, [[k / sides, 0], [(k + 1) / sides, 0], [(k + 1) / sides, 1], [k / sides, 1]]);
  }
}

/** One bare lime, seeded. */
export function lime(seed: number) {
  const A = ASSUMED, B = new Builder(0), col = [255, 255, 255, 255];
  const r = (k: number) => hash(seed, k, 4021);
  let n = 0;
  const top: V3 = [0, A.clear, 0];
  tube(B, [0, 0, 0], top, A.trunkR, A.trunkR * 0.82, 6, col);
  // the leader on up the middle, and the limbs off it
  const crownH = A.height - A.clear;
  /** a branch from p along d, length L, radius rr, `gen` generations left */
  const branch = (p: V3, d: V3, L: number, rr: number, gen: number) => {
    // a little bend: two segments, the second turned up toward the light
    const mid = add(p, mul(d, L * 0.5));
    const d2 = unit(add(d, [(r(n++) - 0.5) * 0.3, 0.18, (r(n++) - 0.5) * 0.3]));
    const end = add(mid, mul(d2, L * 0.5));
    tube(B, p, mid, rr, rr * 0.85, gen > 2 ? A.sides : 3, col);
    tube(B, mid, end, rr * 0.85, rr * A.radK, gen > 2 ? A.sides : 3, col);
    if (gen <= 0) return;
    const kids = A.splits + (r(n++) < 0.35 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      // splay the children about the parent's line, held ascending (a lime's crown keeps its limbs up)
      const az = (2 * Math.PI * (k + r(n++) * 0.5)) / kids;
      let side = cross(d2, [0, 1, 0]);
      if (Math.hypot(...side) < 1e-3) side = [1, 0, 0];
      side = unit(side);
      const up = unit(cross(side, d2));
      const off = add(mul(side, Math.cos(az)), mul(up, Math.sin(az)));
      const cd = unit(add(add(d2, mul(off, A.spread)), [0, 0.12, 0]));
      branch(end, cd, L * A.lenK * (0.85 + r(n++) * 0.3), rr * A.radK, gen - 1);
    }
  };
  // the leader
  branch(top, unit([(r(1) - 0.5) * 0.1, 1, (r(2) - 0.5) * 0.1]), crownH * 0.42, A.trunkR * 0.7, A.depth - 1);
  for (let k = 0; k < A.limbs; k++) {
    const az = (2 * Math.PI * (k + r(10 + k) * 0.6)) / A.limbs, lean = A.lean * (0.8 + r(20 + k) * 0.4);
    const d: V3 = [Math.sin(lean) * Math.cos(az), Math.cos(lean), Math.sin(lean) * Math.sin(az)];
    const at = add(top, [0, (r(30 + k) - 0.3) * 1.2, 0]);
    branch(at, d, crownH * 0.34 * (0.85 + r(40 + k) * 0.3), A.trunkR * 0.55, A.depth - 1);
  }
  return B;
}

const MATS: Material[] = [{ name: "bark", color: [0.055, 0.045, 0.04, 1], roughness: 0.92 }];

if (import.meta.main) {
  for (let k = 0; k < 3; k++) {
    const B = lime(101 + k * 37);
    await Bun.write(`${out}/lime-bare-${k}.glb`, writeGlb([{ name: `lime-bare-${k}`, parts: [B.part()!] }], MATS));
    console.log(`lime-bare-${k}: ${B.indices.length / 3} tris`);
  }
}
