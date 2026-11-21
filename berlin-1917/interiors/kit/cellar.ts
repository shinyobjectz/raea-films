// Cellar kit: the house cellar under a Mietshaus front building. Slatted compartments
// (Kellerverschläge, one per flat), coal and briquettes, potatoes, preserves, a candle. research/catalogue: below.
import { manifold, sdf, type Solid } from "raea/3d";
import { ball, zcone, zcyl, box, hash, heap, lathe, post, rbox, rodX, taper, union, lump, ring } from "./geo";
import { prop } from "./prop";
import { byMat } from "./store";

const H = 2.05; // a partition's height: the vault's springing line in most cellars is about 2.1 m

/** A run of vertical slats w wide, on two rails at the back, with a post at each end. */
function slats(w: number, seed: number, door = false): Solid[] {
  const s: Solid[] = [];
  const pitch = 0.105, sw = 0.075;
  const n = Math.floor((w - 0.08) / pitch);
  const off = (w - n * pitch) / 2;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + off + pitch * (i + 0.5);
    const top = H - 0.02 - (door ? 0.08 : hash(seed, i) * 0.04); // hand-sawn: the tops never line up
    s.push(box(sw - hash(seed, i, 2) * 0.01, top - 0.03, 0.02, x, 0.03, 0.012));
  }
  return s;
}
const rails = (w: number) => [box(w, 0.075, 0.045, 0, 0.22, -0.022), box(w, 0.075, 0.045, 0, 1.75, -0.022)];

// whole and half metres for the corridor walls; the cross walls between compartments (interiors/cellars.ts) run from
// the outer wall to 6 cm short of the corridor wall, for compartments 1.5-3 m deep
for (const [id, w] of [["slats-2", 2.0], ["slats-1", 1.0], ["slats-3", 3.0], ["slats-h", 0.5], ["slats-x15", 1.43], ["slats-x20", 1.93], ["slats-x25", 2.43], ["slats-x30", 2.93]] as const)
  prop({
    id, items: ["cellar-cages"], size: [w, H, 0.1], place: "floor", where: "cellar", tris: 2500,
    parts: () => [{ mat: "wood-raw", solid: union(...slats(w, w * 7), ...rails(w), box(0.08, H, 0.08, -w / 2 + 0.04, 0, -0.02), box(0.08, H, 0.08, w / 2 - 0.04, 0, -0.02)) }],
  });

prop({
  id: "slats-door", items: ["cellar-cages"], size: [0.9, H, 0.12], place: "floor", where: "cellar", tris: 2500,
  parts: () => {
    const w = 0.84;
    const brace = box(0.07, Math.hypot(w - 0.1, 1.4), 0.03).rotate(0, 0, -Math.atan2(w - 0.1, 1.4) * 57.3).move(0, 0.3, -0.03);
    return [
      { mat: "wood-raw", solid: union(...slats(w, 31, true), box(w, 0.08, 0.035, 0, 0.25, -0.025), box(w, 0.08, 0.035, 0, 1.7, -0.025), brace) },
      // the hasp and a padlock: a flat's cellar is locked, and the lock is the first thing a lamp finds
      { mat: "iron", solid: union(box(0.03, 0.14, 0.012, w / 2 - 0.06, 1.0, 0.03), box(0.12, 0.03, 0.01, w / 2 - 0.01, 1.1, 0.03)) },
      { mat: "brass", solid: union(rbox(0.045, 0.05, 0.02, 0.006, w / 2 - 0.02, 0.98, 0.045), rodX(0.004, 0.03, w / 2 - 0.02, 1.045, 0.045)) },
    ];
  },
});

prop({
  id: "coal-heap", items: ["briquettes"], size: [1.5, 0.55, 1.2], place: "corner", where: "cellar", tris: 6000,
  parts: () => {
    const lumps: Solid[] = [];
    for (let i = 0; i < 16; i++) {
      const a = hash(i, 1) * Math.PI * 2, r = 0.55 + hash(i, 2) * 0.3, s = 0.025 + hash(i, 3) * 0.035;
      const pts: [number, number, number][] = [];
      for (let k = 0; k < 9; k++) pts.push([(hash(i, k, 4) - 0.5) * s * 2, hash(i, k, 5) * s * 1.4, (hash(i, k, 6) - 0.5) * s * 2]);
      lumps.push(manifold.hull(pts).move(Math.cos(a) * r, 0, Math.sin(a) * r * 0.75));
    }
    return [{ mat: "coal", solid: union(heap(0.7, 0.5, 0.06, 3).scale(1, 1, 0.8), ...lumps) }];
  },
});

prop({
  id: "briquette-stack", items: ["briquettes"], size: [0.8, 0.84, 0.38], place: "wall", tris: 8000,
  parts: () => {
    // Rekord briquettes, 18 x 6 x 5.5 cm, stacked crosswise in the Berlin way: the stack's face shows their ends
    const b: Solid[] = [];
    const rows = 14, per = 12;
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < per; i++) {
        if (r === rows - 1 && hash(r, i) < 0.45) continue; // the top row half used
        const x = -0.36 + i * 0.065 + (r % 2) * 0.02;
        b.push(box(0.058, 0.055, 0.18, x, r * 0.06, 0.09), box(0.058, 0.055, 0.18, x, r * 0.06, -0.1));
      }
    return [{ mat: "briquette", solid: union(...b) }];
  },
});

prop({
  id: "potato-sack", items: ["hoard"], size: [0.5, 0.72, 0.4], place: "floor", tris: 8000,
  parts: () => [
    { mat: "jute", solid: sdf.smoothUnion(0.09, sdf.ellipsoid(0.22, 0.24, 0.17).move(0, 0.3, 0), sdf.ellipsoid(0.24, 0.12, 0.19).move(0, 0.12, 0), sdf.capsule([0, 0.5, 0], [0.02, 0.66, 0.01], 0.05)).displace(0.012, 9, 3, 2).solid(0.035).simplify(0.00875) },
    { mat: "linen-grey", solid: ring(0.052, 0.012).rotate(90, 0, 0).move(0.01, 0.59, 0.005), overlap: true }, // the string cinches the neck
  ],
});
prop({
  id: "potato-sack-slumped", items: ["hoard"], size: [0.6, 0.42, 0.55], place: "floor", tris: 5000,
  parts: () => [{ mat: "jute", solid: sdf.smoothUnion(0.1, sdf.ellipsoid(0.27, 0.15, 0.22).move(0, 0.15, 0), sdf.ellipsoid(0.16, 0.12, 0.14).move(0.05, 0.28, -0.04), sdf.capsule([0.08, 0.3, -0.05], [0.25, 0.08, 0.2], 0.05)).displace(0.012, 9, 3, 5).solid(0.035).simplify(0.00875) }],
});

/** Potatoes, one by one: a layer of n lumpy ellipsoids over a w x d patch at height y. */
function potatoes(n: number, w: number, d: number, y: number, seed: number): Solid {
  const p: Solid[] = [];
  for (let i = 0; i < n; i++) {
    const s = 0.03 + hash(seed, i) * 0.018;
    p.push(lump(s, seed * 100 + i).rotate(0, hash(seed, i, 1) * 180, hash(seed, i, 2) * 30).move((hash(seed, i, 3) - 0.5) * w, y + hash(seed, i, 4) * 0.05, (hash(seed, i, 5) - 0.5) * d));
  }
  return union(...p);
}
prop({
  id: "potato-bin", items: ["hoard"], size: [0.9, 0.72, 0.62], place: "wall", tris: 9000,
  parts: () => {
    const w = 0.9, h = 0.72, d = 0.62, s: Solid[] = [];
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) s.push(box(0.05, h, 0.05, x * (w / 2 - 0.025), 0, z * (d / 2 - 0.025)));
    for (let k = 0; k < 4; k++) {
      const y = 0.05 + k * 0.17;
      s.push(box(w, 0.1, 0.02, 0, y, d / 2 - 0.01), box(w, 0.1, 0.02, 0, y, -d / 2 + 0.01), box(0.02, 0.1, d, w / 2 - 0.01, y, 0), box(0.02, 0.1, d, -w / 2 + 0.01, y, 0));
    }
    s.push(box(w, 0.02, d, 0, 0.04, 0));
    // the war's potatoes: the bin is a third full in December 1917 (the turnip winter is a year behind)
    const bed = heap(0.33, 0.12, 0.03, 9).scale(1.25, 1, 0.85).move(0, 0.06, 0);
    return [{ mat: "wood-raw", solid: union(...s) }, { mat: "potato", solid: union(bed, potatoes(34, 0.7, 0.45, 0.1, 4)) }];
  },
});

prop({
  id: "preserve-shelf", items: ["preserving-jars", "cellar-cages"], size: [1.2, 1.7, 0.32], place: "wall", tris: 12000,
  parts: () => {
    const w = 1.2, d = 0.3, wood: Solid[] = [box(0.03, 1.7, d, -w / 2 + 0.015, 0, 0), box(0.03, 1.7, d, w / 2 - 0.015, 0, 0)];
    const glass: Solid[] = [], fill: Solid[] = [], lids: Solid[] = [];
    [0.08, 0.5, 0.92, 1.34].forEach((y, row) => {
      wood.push(box(w, 0.025, d, 0, y, 0));
      for (let i = 0; i < 7; i++) {
        if (hash(row, i, 7) < 0.3) continue; // gaps where a jar went upstairs
        const x = -w / 2 + 0.11 + i * 0.165, r = 0.05 + (row % 2) * 0.01, jh = 0.15 + (row % 2) * 0.05;
        glass.push(post(r, jh, x, y + 0.025, 0.02));
        if (hash(row, i, 8) < 0.45) fill.push(post(r - 0.006, jh * (0.5 + hash(row, i, 9) * 0.35), x, y + 0.03, 0.02)); // most are empty
        lids.push(post(r + 0.004, 0.012, x, y + 0.025 + jh, 0.02));
      }
    });
    return [{ mat: "wood-grey", solid: union(...wood) }, { mat: "glass", solid: union(...glass) }, { mat: "flower", solid: union(...fill) }, { mat: "glass-dark", solid: union(...lids) }];
  },
});

prop({
  id: "crock", items: ["hoard"], size: [0.42, 0.62, 0.42], place: "floor", tris: 2500,
  parts: () => [
    { mat: "stoneware", solid: lathe([[0, 0], [0.17, 0], [0.19, 0.04], [0.2, 0.36], [0.19, 0.44], [0.18, 0.46], [0, 0.46]]) },
    { mat: "wood-grey", solid: post(0.16, 0.02, 0, 0.46, 0) },
    { mat: "rubble", solid: ball(0.075).scale(1.2, 0.7, 1).move(0.02, 0.52, 0) }, // the weighting stone
  ],
});

prop({
  id: "candle", items: ["candle"], size: [0.14, 0.12, 0.14], place: "on", tris: 2500,
  parts: () => [
    { mat: "enamel", solid: union(lathe([[0, 0], [0.06, 0], [0.065, 0.012], [0.058, 0.014], [0.02, 0.012], [0.016, 0.035], [0, 0.035]]), ring(0.02, 0.005).rotate(90, 0, 0).move(0.075, 0.012, 0)) },
    { mat: "wax", solid: union(post(0.011, 0.055, 0, 0.03, 0), heap(0.016, 0.012, 0.003, 2).move(0, 0.03, 0)) },
    { mat: "iron", solid: post(0.0012, 0.008, 0, 0.085, 0) },
    { mat: "flame", solid: ball(0.006).scale(1, 2.4, 1).move(0, 0.1, 0) },
  ],
  glow: [{ at: [0, 0.1, 0], lumens: 12, color: "#ffb36b", range: 6, shadow: true, flicker: 0.12 }],
});

prop({
  id: "coal-shovel", items: ["coal-box"], size: [0.25, 0.95, 0.1], place: "wall", tris: 600,
  parts: () => [
    { mat: "iron", solid: union(box(0.24, 0.3, 0.008, 0, 0, 0).minus(box(0.2, 0.28, 0.02, 0, 0.03, 0.02)), box(0.24, 0.006, 0.05, 0, 0, 0.02)) },
    { mat: "wood-soft", solid: union(post(0.016, 0.62, 0, 0.3, -0.01), rodX(0.012, 0.12, 0, 0.93, -0.01)) },
  ],
});

prop({
  id: "kiepe", items: ["coal-box"], size: [0.5, 0.55, 0.5], place: "floor", tris: 2500,
  parts: () => [{ mat: "wood-grey", solid: lathe([[0, 0], [0.16, 0], [0.24, 0.5], [0.25, 0.53], [0.23, 0.53], [0.15, 0.03], [0, 0.03]], 0, 0, 0, 20) }],
});

prop({
  id: "firewood", items: ["briquettes"], size: [0.5, 0.25, 0.4], place: "floor", tris: 2500,
  parts: () => {
    const s: Solid[] = [];
    for (let i = 0; i < 14; i++) {
      const r = 0.02 + hash(i, 11) * 0.02;
      s.push(zcyl(r, 0.32 + hash(i, 12) * 0.1, ).rotate(0, 90, (hash(i, 13) - 0.5) * 20).move((hash(i, 14) - 0.5) * 0.06, r + Math.floor(i / 5) * 0.045, -0.15 + (i % 5) * 0.07));
    }
    return [{ mat: "wood-raw", solid: union(...s) }];
  },
});

prop({
  id: "sledge", items: ["cellar-cages"], size: [0.42, 0.3, 1.0], place: "wall", tris: 2000,
  parts: () => {
    const run = (x: number) => union(box(0.025, 0.04, 0.9, x, 0, 0), box(0.025, 0.2, 0.04, x, 0.04, 0.3), box(0.025, 0.2, 0.04, x, 0.04, -0.3), ring(0.08, 0.012).rotate(0, 90, 0).move(x, 0.1, 0.45).trim(0, 0, 1, 0.45));
    const slatsTop: Solid[] = [];
    for (let i = 0; i < 6; i++) slatsTop.push(box(0.4, 0.02, 0.07, 0, 0.24, -0.33 + i * 0.13));
    return [{ mat: "wood-mid", solid: union(...slatsTop, box(0.025, 0.2, 0.04, 0.18, 0.04, 0.3), box(0.025, 0.2, 0.04, -0.18, 0.04, 0.3), box(0.025, 0.2, 0.04, 0.18, 0.04, -0.3), box(0.025, 0.2, 0.04, -0.18, 0.04, -0.3)) }, { mat: "iron-rust", solid: union(box(0.02, 0.03, 0.92, 0.18, 0, 0), box(0.02, 0.03, 0.92, -0.18, 0, 0)) }];
  },
});

/** Fresh rubble at a breakthrough: brick halves and whole bricks (25 x 12 x 6.5 cm) on a bed of mortar dust. */
prop({
  id: "rubble-heap", items: [], size: [1.2, 0.4, 1.0], place: "floor", tris: 9000,
  parts: () => {
    const bricks: Solid[] = [];
    for (let i = 0; i < 26; i++) {
      const half = hash(i, 21) < 0.5, a = hash(i, 22) * Math.PI * 2, r = Math.sqrt(hash(i, 23)) * 0.5;
      bricks.push(box(half ? 0.12 : 0.24, 0.065, 0.115).rotate((hash(i, 24) - 0.5) * 50, hash(i, 25) * 180, (hash(i, 26) - 0.5) * 50).move(Math.cos(a) * r, 0.04 + (0.5 - r) * 0.35 * hash(i, 27), Math.sin(a) * r * 0.8));
    }
    return [{ mat: "brick-raw", solid: union(...bricks) }, { mat: "rubble", solid: heap(0.55, 0.16, 0.05, 12).scale(1, 1, 0.8) }];
  },
});

/** The cellar's gas meter and its pipes: every house's supply comes in here from the street. */
prop({
  id: "gas-meter", items: [], size: [0.4, 0.5, 0.25], place: "hung", tris: 1500,
  parts: () => [
    { mat: "iron", solid: union(rbox(0.36, 0.38, 0.22, 0.02), rodX(0.02, 0.5, 0, 0.42, 0), post(0.02, 0.2, -0.16, 0.38, 0), post(0.02, 0.2, 0.16, 0.38, 0)) },
    { mat: "glass-dark", solid: box(0.16, 0.1, 0.01, 0, 0.18, 0.11) },
    { mat: "brass", solid: box(0.08, 0.04, 0.01, 0, 0.32, 0.112) },
  ],
});

prop({
  id: "bucket", items: ["coal-box"], size: [0.32, 0.4, 0.32], place: "floor", tris: 1200,
  parts: () => [{ mat: "zinc", solid: union(taper(0.13, 0.15, 0.3).minus(taper(0.12, 0.14, 0.3, 0, 0.02, 0)), ring(0.15, 0.004).rotate(0, 90, 0).trim(0, 1, 0, 0).move(0, 0.3, 0)) }],
});

export const KIT_CELLAR = true;

/** A pail turned over to stand a candle on: a cellar table. */
prop({
  id: "bucket-up", items: ["coal-box"], size: [0.32, 0.3, 0.32], place: "floor", tris: 1200,
  parts: () => [{ mat: "zinc", solid: taper(0.15, 0.13, 0.3).minus(taper(0.14, 0.12, 0.3, 0, -0.02, 0)) }],
});

/** The cellar's way in from the court or the pavement (Kellerhals): out through the arch in an outer wall, a landing,
 *  nine brick steps with cement treads up between whitewashed walls under a stepped soffit, and a ledged door at the
 *  top, daylight at its edges and under it. Origin: the arch's foot on the room's face of a 0.64 m outer wall; the
 *  stair climbs to -z, the room is at +z. */
prop({
  id: "cellar-steps", items: ["cellar-cages"], size: [1.65, 4.02, 4.92], place: "wall", where: "cellar", tris: 1800,
  parts: () => {
    const b = byMat(), W = 1.05, T0 = 0.642, land = 0.6, n = 9, r = 0.18, t = 0.28, top = 0.9, Y = n * r;
    const z1 = -T0 - land, zTop = z1 - n * t, zEnd = zTop - top, back = zEnd - 0.25;
    b.add("floor-cellar", box(W, 0.06, land, 0, -0.06, -T0 - land / 2));
    // brick under each tread, the cement tread on top with a 3 cm nosing
    const brick: Solid[] = [], treads: Solid[] = [];
    for (let k = 0; k < n; k++) {
      const zc = z1 - t * (k + 0.5), y = r * (k + 1);
      brick.push(box(W, y - 0.04, t, 0, 0, zc));
      treads.push(box(W, 0.04, t + 0.03, 0, y - 0.04, zc + 0.015));
    }
    brick.push(box(W, Y - 0.04, top, 0, 0, zTop - top / 2));
    treads.push(box(W, 0.04, top + 0.03, 0, Y - 0.04, zTop - top / 2 + 0.015));
    b.add("brick", union(...brick));
    b.add("cement", union(...treads));
    // the passage: side walls, a soffit stepping up with the flight, the end wall with the door's opening
    const ww = 0.25, x = W / 2 + ww / 2, L = -T0 - back, zm = (-T0 + back) / 2, hi = Y + 2.4;
    const soffit: Solid[] = [box(W + 2 * ww, 0.15, land, 0, 2.5, -T0 - land / 2)];
    for (let k = 0; k < n; k++) soffit.push(box(W + 2 * ww, 0.15, t, 0, Math.max(2.5, r * (k + 1) + 2.1), z1 - t * (k + 0.5)));
    soffit.push(box(W + 2 * ww, 0.15, top + 0.25, 0, Y + 2.1, zTop - (top + 0.25) / 2));
    const end = box(W + 2 * ww + 0.1, hi, 0.25, 0, 0, zEnd - 0.125).minus(box(0.85, 2.05, 0.4, 0, Y, zEnd - 0.125));
    b.add("brick-wash", union(box(ww, hi, L, -x, 0, zm), box(ww, hi, L, x, 0, zm), ...soffit, end));
    // the door: five boards with gaps between, a 3 cm gap under it, ledges and a frame
    const dz = zEnd - 0.06, boards: Solid[] = [];
    for (let i = 0; i < 5; i++) boards.push(box(0.15, 1.98, 0.03, -0.324 + i * 0.162, Y + 0.03, dz));
    b.add("wood-grey", union(...boards, box(0.7, 0.1, 0.025, 0, Y + 0.3, dz + 0.028), box(0.7, 0.1, 0.025, 0, Y + 1.6, dz + 0.028)));
    b.add("paint-brown", union(box(0.05, 2.05, 0.06, -0.4, Y, zEnd - 0.03), box(0.05, 2.05, 0.06, 0.4, Y, zEnd - 0.03)));
    b.add("iron", union(box(0.4, 0.03, 0.006, -0.17, Y + 0.33, dz + 0.044), box(0.4, 0.03, 0.006, -0.17, Y + 1.63, dz + 0.044), box(0.1, 0.02, 0.015, 0.29, Y + 1.0, dz + 0.035)));
    return b.parts();
  },
  // grey court daylight behind the door, through its cracks; a little of it bounced off the top steps
  glow: [
    { at: [0, 2.9, -5.3], lumens: 260, color: "#c9d3e2", range: 9, shadow: true },
    { at: [0, 2.0, -3.9], lumens: 18, color: "#aeb8c8", range: 4, fill: true },
  ],
});
