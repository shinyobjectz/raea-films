// Porter's kit: the loft over the stable at Ritterstraße 120 (right side wing, first floor), photographed for the
// Ortskrankenkasse's survey on 18 October 1917 (z2_1917_MP_0075 the Stube, 0077 the Kochraum; research/scenes.md).
// The iron spiral stair up from the stable, the broken tiled range with a small iron cannon stove set into it, the cup
// board under paper lace, a line of white coats, a petroleum lamp on a reflector; and the stable under it: two stands,
// mangers and hay racks, the bail pole, harness on pegs, the drain to the sewer.
import { crossSection, sdf, type Solid } from "raea/3d";
import { ball, box, hash, lathe, post, rbox, ring, rodX, rodZ, taper, union, zcyl, type V3 } from "./geo";
import { scallops } from "./kitchen";
import { prop } from "./prop";

/** A round bar from a to b. */
export function bar(a: V3, b: V3, r: number): Solid {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  return zcyl(r, L).rotate((-Math.asin(dy / L) * 180) / Math.PI, (Math.atan2(dx, dz) * 180) / Math.PI, 0).move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A flat plate from an outline in plan (x, z), its top at y, t thick. */
function flat(pts: [number, number][], t: number, y: number): Solid {
  let q = pts.map(([x, z]) => [x, -z] as [number, number]);
  let A = 0;
  for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; A += x0 * y1 - x1 * y0; }
  if (A < 0) q = q.reverse();
  return crossSection.polygon(q).extrude(t).rotate(-90, 0, 0).move(0, y - t, 0);
}
/** A side profile in (z, y) extruded `len` along x, centred on x. */
function sideways(profile: [number, number][], len: number): Solid {
  let q = profile.map(([z, y]) => [-z, y] as [number, number]);
  let A = 0;
  for (let i = 0; i < q.length; i++) { const [x0, y0] = q[i], [x1, y1] = q[(i + 1) % q.length]; A += x0 * y1 - x1 * y0; }
  if (A < 0) q = q.reverse();
  return crossSection.polygon(q).extrude(len).rotate(0, 90, 0).move(-len / 2, 0, 0);
}

// ---------------------------------------------------------------------------------------------------------------- the stair

/** The iron spiral stair (eiserne Wendeltreppe) from the stable floor to the loft's: 14 rises of 20.7 cm, 13 cast treads
 *  turning 26 degrees each round a newel, climbing from +z toward +x, then a landing plate at the loft's floor out to its
 *  hatch's +z and +x edges. Origin: the newel's foot. The hatch is the 1.5 m square round it with walls on its -x and -z
 *  sides; the landing opens to the room across its +z edge and the +x edge's +z half, a rail guards the rest. */
export const SPIRAL = { rise: 2.9, steps: 14, turn: 26, r: 0.66, hatch: 1.5 } as const;
prop({
  id: "spiral-iron", items: ["spiral-iron"], size: [1.5, 3.85, 1.5], place: "corner", where: "set", tris: 8000,
  parts: () => {
    const { rise, steps, turn, r, hatch } = SPIRAL, h = rise / steps, R = Math.PI / 180, e = hatch / 2;
    const P = (a: number, rr: number, y: number): V3 => [rr * Math.sin(a * R), y, rr * Math.cos(a * R)];
    const treads: Solid[] = [], frame: Solid[] = [], tops: V3[] = [];
    for (let k = 0; k < steps - 1; k++) {
      const a0 = k * turn - turn / 2, a1 = a0 + turn + 4, y = (k + 1) * h; // 4 degrees under the next tread
      const pts: [number, number][] = [];
      for (let i = 0; i <= 6; i++) { const p = P(a0 + ((a1 - a0) * i) / 6, r, 0); pts.push([p[0], p[2]]); }
      for (const a of [a1, a0]) { const p = P(a, 0.07, 0); pts.push([p[0], p[2]]); }
      treads.push(flat(pts, 0.016, y));
      // the rib cast under each tread, and the collar round the newel each one is cast with (stacked, they are the newel)
      const c = P(k * turn, 1, 0);
      frame.push(bar([c[0] * 0.08, y - 0.04, c[2] * 0.08], [c[0] * (r - 0.03), y - 0.024, c[2] * (r - 0.03)], 0.012));
      frame.push(post(0.075, h - 0.004, 0, y - h + 0.002, 0));
      const b = P(k * turn + turn / 4, r - 0.035, y);
      frame.push(post(0.008, 0.88, b[0], y, b[2]));
      tops.push([b[0], y + 0.88, b[2]]);
    }
    // the starter post on the floor, the handrail baluster to baluster, and its end post on the landing's edge
    const s = P(-turn / 2, r - 0.035, 0), end: V3 = [e * Math.tan(-35 * R) + 0.03, rise, e - 0.03];
    frame.push(post(0.016, 0.88 + h, s[0], 0, s[2]), post(0.016, 0.9, end[0], rise, end[2]));
    const rail: V3[] = [[s[0], 0.88 + h, s[2]], ...tops, [end[0], rise + 0.9, end[2]]];
    for (let i = 0; i + 1 < rail.length; i++) frame.push(bar(rail[i], rail[i + 1], 0.016));
    frame.push(post(0.04, rise + 0.9, 0, 0, 0), lathe([[0, 0], [0.16, 0], [0.16, 0.02], [0.06, 0.05], [0, 0.05]]));
    // the landing: chequer plate flush with the loft's boards, from the last tread's edge (-35 degrees) round to +x
    const land: [number, number][] = [[e * Math.tan(-35 * R), e], [e, e], [e, 0]];
    for (let a = 90; a >= -35; a -= 25) { const p = P(a, 0.07, 0); land.push([p[0], p[2]]); }
    treads.push(flat(land, 0.02, rise));
    // the landing's guard over the well: newel to the +x edge along the 90-degree line, then the +x edge back to the wall
    const g = [[0.04, 0], [e - 0.03, 0], [e - 0.03, -e + 0.03]] as const;
    for (const y of [0.45, 0.9]) for (let i = 0; i + 1 < g.length; i++) frame.push(bar([g[i][0], rise + y, g[i][1]], [g[i + 1][0], rise + y, g[i + 1][1]], y > 0.5 ? 0.016 : 0.008));
    frame.push(post(0.016, 0.9, g[1][0], rise, g[1][1]), post(0.016, 0.9, g[2][0], rise, g[2][1]));
    for (let k = 1; k < 5; k++) frame.push(post(0.008, 0.9, g[0][0] + ((g[1][0] - g[0][0]) * k) / 5, rise, 0), post(0.008, 0.9, g[1][0], rise, (g[2][1] * k) / 5));
    frame.push(lathe([[0, 0], [0.045, 0], [0.05, 0.04], [0.03, 0.07], [0, 0.075]], 0, rise + 0.9, 0)); // the newel's knob
    return [{ mat: "iron", solid: union(...frame) }, { mat: "iron-rust", solid: union(...treads) }];
  },
});

// ------------------------------------------------------------------------------------------------------------- the kochraum

/** The tiled range fallen apart (0077: "in den zerfallenen Kochherd ist ein kleiner eiserner Kanonenofen eingebaut"): its
 *  iron top and fire box gone, the right half of the tile body left standing as a shelf, the left knocked down to its
 *  footing, and a small iron cannon stove set into the gap, its pipe up and back into the chimney. Plates lean on the
 *  wall over the right half. Origin: floor, its back to the wall at z = -0.3. */
prop({
  id: "range-broken", items: ["range", "iron-stove", "range-broken"], size: [0.95, 1.5, 0.62], place: "wall", where: "set", tris: 9000,
  parts: () => {
    const d = 0.6, sx = -0.22, sz = 0.03, sy = 0.3;
    const tiles: Solid[] = [box(0.47, 0.76, d, 0.235, 0, 0), box(0.48, sy, d, -0.24, 0, 0), box(0.95, 0.1, 0.08, 0, 0, d / 2 + 0.04)];
    // the broken edge: tiles left standing at odd heights where the left half came away
    for (let i = 0; i < 4; i++) tiles.push(box(0.13, 0.13 * (1 + Math.floor(hash(i, 3) * 3)), 0.12, -0.07 - (i % 2) * 0.13, sy, -0.24 + Math.floor(i / 2) * 0.14));
    const stove = lathe([[0, 0], [0.11, 0], [0.11, 0.04], [0.16, 0.12], [0.17, 0.28], [0.13, 0.44], [0.145, 0.47], [0.145, 0.5], [0, 0.5]], sx, sy, sz);
    const pz = sz - 0.1, pipeUp = post(0.055, 0.66, sx, sy + 0.5, pz), elbow = ball(0.057).move(sx, sy + 1.16, pz);
    const pipeBack = rodZ(0.055, 0.34, sx, sy + 1.16, pz - 0.17);
    const stoveIron = union(stove, box(0.14, 0.12, 0.04, sx, sy + 0.1, sz + 0.15), box(0.36, 0.015, 0.36, sx, sy + 0.5, sz), pipeUp, elbow, pipeBack, ring(0.06, 0.006).rotate(90, 0, 0).move(sx, sy + 0.95, pz));
    const pot = lathe([[0, 0], [0.08, 0], [0.09, 0.02], [0.09, 0.11], [0.095, 0.115], [0, 0.115]], sx + 0.02, sy + 0.516, sz + 0.07);
    const cup = union(lathe([[0, 0], [0.035, 0], [0.042, 0.075], [0, 0.075]], 0.12, 0.76, 0.12), ring(0.02, 0.004).move(0.168, 0.8, 0.12));
    const plates: Solid[] = [];
    for (let i = 0; i < 3; i++) plates.push(lathe([[0, 0], [0.12, 0], [0.13, 0.012], [0.12, 0.014], [0, 0.006]], 0, 0, 0, 24).rotate(-90 + 12, 0, 0).move(0.12 + i * 0.12, 0.89, -0.25 + i * 0.012));
    return [
      { mat: "tile-white", solid: union(...tiles) },
      { mat: "iron", solid: stoveIron },
      { mat: "enamel", solid: union(pot, cup, ...plates) },
    ];
  },
  glow: [{ at: [-0.22, 0.42, 0.22], lumens: 30, color: "#ff8a3d", range: 3, flicker: 0.25 }],
});

/** A cup: a turned body and a handle ring, standing on y. */
const cup = (x: number, y: number, z: number, s = 1): Solid =>
  union(lathe([[0, 0], [0.032 * s, 0], [0.04 * s, 0.075 * s], [0, 0.075 * s]], x, y, z), ring(0.02 * s, 0.0045).move(x + 0.047 * s, y + 0.04 * s, z));

/** The cup board (0077): a framed board with three rows of hooks and a cup on each, two shelves over it edged with
 *  paper lace and the mugs turned down on top, a ladle and a skimmer on nails along its foot. Origin: its bottom middle
 *  on the wall. */
prop({
  id: "cup-board", items: ["plate-rack", "enamelware", "paper-edging"], size: [0.8, 0.98, 0.2], place: "hung", where: "set", tris: 16000,
  parts: () => {
    const w = 0.7, cups: Solid[] = [], iron: Solid[] = [];
    for (const [row, y] of [[0, 0.42], [1, 0.27], [2, 0.12]] as const)
      for (let i = 0; i < 3; i++) {
        const x = -0.22 + i * 0.2 + (row === 1 ? 0.04 : 0);
        iron.push(bar([x + 0.047, y, 0.012], [x + 0.047, y + 0.004, 0.045], 0.003));
        cups.push(cup(x, y - 0.088, 0.05));
      }
    for (let i = 0; i < 5; i++) cups.push(cup(-0.3 + i * 0.15, 0.84, 0.06, 0.9));
    for (let i = 0; i < 3; i++) cups.push(lathe([[0, 0], [0.05, 0], [0.055, 0.1], [0.04, 0.13], [0, 0.13]], -0.22 + i * 0.22, 0.62, 0.06)); // jugs on the lower shelf
    // a ladle and a skimmer on nails along the foot
    iron.push(bar([-0.12, -0.01, 0.03], [-0.12, -0.2, 0.03], 0.004), lathe([[0, 0], [0.032, 0.008], [0.036, 0.03], [0, 0.026]], -0.12, -0.235, 0.03));
    iron.push(bar([0.16, -0.01, 0.03], [0.16, -0.18, 0.03], 0.004), zcyl(0.04, 0.004).move(0.16, -0.22, 0.03));
    return [
      { mat: "wood-soft", solid: union(box(w, 0.5, 0.018, 0, 0, 0.009), box(w + 0.04, 0.03, 0.03, 0, -0.03, 0.02), box(w + 0.04, 0.03, 0.03, 0, 0.5, 0.02), box(0.03, 0.56, 0.03, -w / 2 - 0.005, -0.03, 0.02), box(0.03, 0.56, 0.03, w / 2 + 0.005, -0.03, 0.02), box(0.8, 0.02, 0.16, 0, 0.6, 0.08), box(0.8, 0.02, 0.16, 0, 0.82, 0.08)) },
      { mat: "paper", solid: union(scallops(0.78, 0.07, 0.6, 0.161), scallops(0.78, 0.07, 0.82, 0.161)) },
      { mat: "enamel", solid: union(...cups) },
      { mat: "iron", solid: union(...iron) },
    ];
  },
});

/** Salt and flour boxes (0077): two white enamel boxes, each on a back plate with a rounded top and a hole to hang it,
 *  a wooden lid. Origin: the lower box's bottom middle on the wall. */
prop({
  id: "salt-boxes", items: ["salt-box", "enamelware"], size: [0.18, 0.5, 0.13], place: "hung", where: "set", tris: 1200,
  parts: () => {
    const back = (y: number) => union(box(0.17, 0.16, 0.008, 0, y, 0.004), zcyl(0.06, 0.008).move(0, y + 0.16, 0.004));
    const body = (y: number) => rbox(0.16, 0.12, 0.11, 0.015, 0, y, 0.063);
    return [
      { mat: "enamel", solid: union(back(0), body(0), back(0.26), body(0.26)) },
      { mat: "wood-soft", solid: union(box(0.165, 0.012, 0.115, 0, 0.12, 0.063), box(0.165, 0.012, 0.115, 0, 0.38, 0.063)) },
    ];
  },
});

/** A bunch of herbs drying head down from a nail (0077, by the range). Origin: the nail. */
prop({
  id: "herbs", items: ["herbs-drying"], size: [0.14, 0.32, 0.1], place: "hung", where: "set", tris: 2500,
  parts: () => [
    { mat: "hay", solid: sdf.smoothUnion(0.02, sdf.cone([0, -0.04, 0.04], [0, -0.3, 0.05], 0.012, 0.055), sdf.cone([0.02, -0.06, 0.04], [0.05, -0.27, 0.06], 0.008, 0.035), sdf.cone([-0.02, -0.06, 0.04], [-0.05, -0.25, 0.03], 0.008, 0.03)).displace(0.008, 30, 2, 5).solid(0.008).simplify(0.002) },
    { mat: "jute", solid: union(bar([0, 0, 0.01], [0, -0.05, 0.04], 0.003), zcyl(0.015, 0.02).rotate(-90, 0, 0).move(0, -0.05, 0.04)), overlap: true },
  ],
});

/** A washing line across the Kochraum with three white coats on hangers bunched at its -x end (0077): the porter's wife
 *  takes in washing. Origin: the line's middle; it runs 2.7 m along x and sags 4 cm. */
prop({
  id: "kittel-line", items: ["drying-line-indoor", "white-coats"], size: [2.7, 1.15, 0.3], place: "ceiling", where: "set", tris: 16000,
  parts: () => {
    const L = 2.7, sag = 0.04, yAt = (x: number) => -sag * (1 - (2 * x / L) ** 2), line: Solid[] = [], hangers: Solid[] = [];
    for (let k = 0; k < 8; k++) { const a = -L / 2 + (L * k) / 8, b = a + L / 8; line.push(bar([a, yAt(a), 0], [b, yAt(b), 0], 0.003)); }
    const coats = [-1.12, -0.86, -0.6].map((x, i) => {
      const y = yAt(x), tw = (hash(i, 9) - 0.5) * 30, dz = (i - 1) * 0.07;
      hangers.push(union(rodX(0.008, 0.42, 0, -0.06, 0), bar([0, -0.06, 0], [0, 0, 0], 0.003)).rotate(0, tw, 0).move(x, y, dz));
      // shoulders, a body widening to the hem (a cone cut to a slab), sleeves hanging, a collar
      const body = sdf.smoothUnion(0.05,
        sdf.box(0.4, 0.14, 0.09, 0.04).move(0, -0.15, 0),
        sdf.intersect(sdf.cone([0, -0.2, 0], [0, -1.05 + i * 0.04, 0], 0.19, 0.27), sdf.box(0.8, 1.2, 0.09).move(0, -0.6, 0)),
        sdf.capsule([-0.2, -0.13, 0.02], [-0.23, -0.6, 0.05], 0.045), sdf.capsule([0.2, -0.13, 0.02], [0.23, -0.6, 0.05], 0.045),
      );
      return body.displace(0.007, 9, 3, 3 + i).rotate(0, tw, 0).move(x, y, dz);
    });
    return [
      { mat: "linen-grey", solid: union(...line) },
      { mat: "wood-soft", solid: union(...hangers) },
      { mat: "linen", solid: sdf.union(...coats).solid(0.022).simplify(0.0055) },
    ];
  },
});

/** A table under a printed cloth hung to the floor on three sides (0077, the near left). Origin: floor, its back to the
 *  wall at z = -0.32. */
prop({
  id: "cloth-table", items: ["kitchen-table", "table-cover"], size: [0.96, 0.8, 0.66], place: "wall", where: "set", tris: 9000,
  parts: () => {
    const legs = [[-0.42, -0.27], [0.42, -0.27], [-0.42, 0.27], [0.42, 0.27]].map(([x, z]) => box(0.045, 0.74, 0.045, x, 0, z));
    const cloth = sdf.subtract(sdf.box(0.98, 0.4, 0.68, 0.015).move(0, 0.58, 0.01), sdf.box(0.94, 0.38, 0.7, 0).move(0, 0.56, -0.02)).displace(0.008, 9, 3, 7);
    return [
      { mat: "wood-soft", solid: union(...legs, box(0.9, 0.03, 0.6, 0, 0.74, 0)) },
      { mat: "cloth-floral", solid: cloth.solid(0.018).simplify(0.0045) },
    ];
  },
});

/** On a table: an enamel basin with a jug standing in it, a stoneware jar, a cup. Origin: the table top. */
prop({
  id: "wash-things", items: ["enamelware", "basin", "jug"], size: [0.7, 0.32, 0.4], place: "on", where: "set", tris: 3000,
  parts: () => [
    { mat: "enamel", solid: union(lathe([[0, 0], [0.11, 0], [0.19, 0.09], [0.2, 0.1], [0.17, 0.1], [0.1, 0.012], [0, 0.012]], -0.12, 0, 0), lathe([[0, 0], [0.06, 0], [0.075, 0.12], [0.06, 0.2], [0.045, 0.24], [0.06, 0.26], [0, 0.26]], -0.12, 0.012, 0), cup(0.24, 0, 0.1)) },
    { mat: "enamel-blue", solid: union(ring(0.05, 0.007).rotate(0, 90, 0).move(-0.12 + 0.07, 0.15, 0)), overlap: true },
    { mat: "stoneware", solid: lathe([[0, 0], [0.06, 0], [0.065, 0.16], [0.045, 0.18], [0.05, 0.2], [0, 0.2]], 0.14, 0, -0.08) },
  ],
});

/** The partition between Stube and Kochraum (0077, the right): planks on end with a ledge across at knee and head
 *  height on the Kochraum side, a doorway framed and cased. Origin: its middle on the floor; it runs 3 m along x, the
 *  ledges on +z, the doorway from x = -1.3 to -0.55. */
prop({
  id: "plank-wall-door", items: ["partition-boards"], size: [3.0, 1.8, 0.1], place: "floor", where: "set", tris: 3000,
  parts: () => {
    const L = 3.0, H = 1.8, d0 = -1.3, d1 = -0.55, dh = 1.68, planks: Solid[] = [], ledges: Solid[] = [];
    for (let x = -L / 2, i = 0; x < L / 2 - 0.01; x += 0.186, i++) {
      const a = x, b = Math.min(L / 2, x + 0.18);
      if (b <= d0 || a >= d1) planks.push(box(b - a, H, 0.025, (a + b) / 2, 0, (hash(i, 4) - 0.5) * 0.004));
      else { if (a < d0) planks.push(box(d0 - a, H, 0.025, (a + d0) / 2, 0, 0)); if (b > d1) planks.push(box(b - d1, H, 0.025, (d1 + b) / 2, 0, 0)); planks.push(box(Math.min(b, d1) - Math.max(a, d0), H - dh, 0.025, (Math.max(a, d0) + Math.min(b, d1)) / 2, dh, 0)); }
    }
    for (const y of [0.35, 1.4]) for (const [a, b] of [[-L / 2, d0], [d1, L / 2]]) ledges.push(box(b - a, 0.1, 0.025, (a + b) / 2, y, 0.025));
    const casing = union(box(0.07, dh + 0.07, 0.08, d0 - 0.035, 0, 0), box(0.07, dh + 0.07, 0.08, d1 + 0.035, 0, 0), box(d1 - d0 + 0.14, 0.07, 0.08, (d0 + d1) / 2, dh, 0));
    return [{ mat: "wood-grey", solid: union(...planks, ...ledges) }, { mat: "paint-brown", solid: casing }];
  },
});

// ---------------------------------------------------------------------------------------------------------------- the stube

/** A petroleum wall lamp on an iron bracket with a white reflector disc behind its chimney (0075, upper right). Origin:
 *  its bottom middle on the wall. */
prop({
  id: "petroleum-wall", items: ["petroleum-lamp"], size: [0.28, 0.42, 0.2], place: "hung", where: "set", tris: 2500,
  parts: () => [
    { mat: "iron", solid: union(box(0.06, 0.12, 0.012, 0, 0, 0.006), bar([0, 0.06, 0.01], [0, 0.08, 0.13], 0.006), ring(0.05, 0.005).rotate(90, 0, 0).move(0, 0.085, 0.13)) },
    { mat: "brass", solid: union(lathe([[0, 0], [0.035, 0], [0.055, 0.035], [0.045, 0.06], [0.015, 0.07], [0, 0.07]], 0, 0.08, 0.13), taper(0.022, 0.018, 0.03, 0, 0.15, 0.13)) },
    { mat: "glass", solid: lathe([[0.017, 0], [0.022, 0.03], [0.026, 0.07], [0.016, 0.12], [0.015, 0.2], [0.012, 0.2], [0.012, 0.12], [0.022, 0.07], [0.018, 0.03], [0.013, 0]], 0, 0.18, 0.13) },
    { mat: "enamel", solid: lathe([[0, 0], [0.13, 0.02], [0.135, 0.028], [0, 0.01]], 0, 0, 0, 28).rotate(90, 0, 0).move(0, 0.27, 0.012) },
  ],
  glow: [{ at: [0, 0.23, 0.13], lumens: 170, color: "#ffb870", range: 7, shadow: true, flicker: 0.05 }, { at: [0, 0.27, 0.06], lumens: 35, color: "#ffd2a0", range: 3, fill: true }],
});

/** A petroleum table lamp: a brass foot and font, a glass chimney under an opal tulip shade. Origin: its foot. */
prop({
  id: "petroleum-lamp", items: ["petroleum-lamp"], size: [0.2, 0.5, 0.2], place: "on", tris: 2500,
  parts: () => [
    { mat: "brass", solid: union(lathe([[0, 0], [0.08, 0], [0.075, 0.015], [0.02, 0.04], [0.02, 0.17], [0.065, 0.2], [0.07, 0.25], [0.03, 0.28], [0, 0.28]]), taper(0.024, 0.02, 0.03, 0, 0.28, 0)) },
    { mat: "glass", solid: taper(0.02, 0.014, 0.18, 0, 0.31, 0) },
    { mat: "lamp-shade", solid: lathe([[0.03, 0], [0.085, 0.07], [0.09, 0.12], [0.06, 0.13], [0.025, 0.02]], 0, 0.3, 0) },
  ],
  glow: [{ at: [0, 0.36, 0], lumens: 180, color: "#ffb870", range: 7, shadow: true, flicker: 0.05 }],
});

/** A small mirror in a dark frame over a narrow shelf with a paper edge (0075, between the windows). Origin: the
 *  shelf's middle on the wall. */
prop({
  id: "mirror-small", items: ["mirror", "paper-edging"], size: [0.56, 0.72, 0.13], place: "hung", tris: 1200,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.52, 0.04, 0.03, 0, 0.06, 0.02), box(0.52, 0.04, 0.03, 0, 0.66, 0.02), box(0.04, 0.64, 0.03, -0.24, 0.06, 0.02), box(0.04, 0.64, 0.03, 0.24, 0.06, 0.02), box(0.56, 0.02, 0.12, 0, -0.02, 0.06), box(0.02, 0.06, 0.08, -0.22, -0.08, 0.04), box(0.02, 0.06, 0.08, 0.22, -0.08, 0.04)) },
    { mat: "mirror", solid: box(0.44, 0.56, 0.006, 0, 0.1, 0.012) },
    { mat: "paper", solid: scallops(0.55, 0.05, -0.02, 0.121) },
  ],
});

/** A plain cotton curtain on a rod, gathered to one side of a small window (0075, the left window). Origin: the rod's
 *  middle; the curtain hangs 0.95 below it on the -x side. */
prop({
  id: "curtain-plain", items: ["curtain"], size: [0.9, 1.0, 0.08], place: "hung", tris: 4000,
  parts: () => [
    { mat: "iron", solid: union(rodX(0.006, 0.9, 0, 0, 0.05), box(0.02, 0.04, 0.05, -0.43, -0.02, 0.025), box(0.02, 0.04, 0.05, 0.43, -0.02, 0.025)) },
    { mat: "linen-grey", solid: pleats(0.3, 0.95, 0.018).move(-0.27, -0.975, 0.055) },
  ],
});

/** A gathered curtain: a strip w wide, its folds `amp` deep, hanging h from y = h; a sine wave thickened 3 mm. */
function pleats(w: number, h: number, amp: number): Solid {
  const n = 28, k = (Math.PI * 2 * 6) / w, front: [number, number][] = [], back: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const x = -w / 2 + (w * i) / n, z = amp * Math.sin(k * x); front.push([x, z + 0.0015]); back.push([x, z - 0.0015]); }
  return crossSection.polygon([...back, ...front.reverse()]).extrude(h).rotate(-90, 0, 0); // counter-clockwise
}

// --------------------------------------------------------------------------------------------------------------- the stable

/** A manger and hay rack at the head of a stand: a whitewashed brick base, a cast-iron trough on it with a tethering
 *  ring, and the iron rack (Raufe) above leaning out from the wall, hay in it. Origin: floor, its back to the wall at
 *  z = -0.275. */
prop({
  id: "manger", items: ["manger", "hay-rack", "hay"], size: [1.45, 2.0, 0.55], place: "wall", where: "set", tris: 9000,
  parts: () => {
    const bars: Solid[] = [];
    for (let x = -0.66; x <= 0.661; x += 0.075) bars.push(bar([x, 1.3, -0.25], [x, 1.95, 0.18], 0.007));
    return [
      { mat: "brick-wash", solid: box(1.45, 0.85, 0.55, 0, 0, 0) },
      { mat: "iron", solid: union(box(1.4, 0.2, 0.44, 0, 0.85, 0.02).minus(box(1.32, 0.2, 0.36, 0, 0.88, 0.02)), ring(0.04, 0.007).move(0.55, 0.78, 0.28), ...bars, rodX(0.012, 1.42, 0, 1.3, -0.25), rodX(0.012, 1.42, 0, 1.95, 0.18), bar([-0.71, 1.3, -0.25], [-0.71, 1.95, 0.18], 0.012), bar([0.71, 1.3, -0.25], [0.71, 1.95, 0.18], 0.012)) },
      { mat: "hay", solid: sdf.box(1.3, 0.55, 0.32, 0.08).rotate(-34, 0, 0).move(0, 1.58, -0.06).displace(0.035, 7, 3, 2).solid(0.035).simplify(0.00875) },
    ];
  },
});

/** The bail pole between two stands (Flankierbaum): a round pole hooked to the manger at its head and hung by a chain
 *  from the vault at its tail, a stall post behind it, a horse blanket over it. Origin: the floor under its head; it
 *  runs 2.3 m along +x. */
prop({
  id: "stall-bail", items: ["stall-bail", "horse-blanket"], size: [2.5, 2.62, 0.2], place: "floor", where: "set", tris: 3000,
  parts: () => [
    { mat: "wood-raw", solid: bar([0.05, 0.92, 0], [2.3, 0.82, 0], 0.055) },
    { mat: "iron", solid: union(bar([2.2, 0.86, 0], [2.2, 2.6, 0], 0.006), bar([0.0, 0.92, 0], [0.08, 0.92, 0], 0.008), post(0.05, 1.3, 2.45, 0, 0), ball(0.065).move(2.45, 1.34, 0)) },
    { mat: "cloth-brown", solid: sdf.box(0.55, 0.5, 0.13, 0.05).move(1.55, 0.66, 0).displace(0.012, 6, 2, 21).solid(0.02).simplify(0.005) },
  ],
});

/** Straw bedding in a stand. Origin: its middle on the floor; 1.35 by 2.3 m. */
prop({
  id: "straw-bed", items: ["straw"], size: [1.35, 0.1, 2.3], place: "floor", where: "set", tris: 6000,
  parts: () => [{ mat: "straw", solid: sdf.box(1.35, 0.07, 2.3, 0.03).move(0, 0.02, 0).displace(0.025, 9, 3, 17).solid(0.04).simplify(0.01) }],
});

/** Harness on pegs (on the stable's end wall): a peg board, a horse collar (Kummet) of black leather with its two
 *  hames, the traces and reins hanging. Origin: the board's middle on the wall at its bottom. */
prop({
  id: "harness-pegs", items: ["harness", "horse-collar"], size: [1.1, 1.1, 0.25], place: "hung", where: "set", tris: 4500,
  parts: () => {
    const ring = (rx: number, ry: number, ix: number, iy: number, t: number) => crossSection.circle(1).scale(rx, ry).minus(crossSection.circle(1).scale(ix, iy)).extrude(t);
    const collar = ring(0.24, 0.33, 0.14, 0.22, 0.1).move(-0.25, -0.33, 0.05);
    const pad = ring(0.2, 0.29, 0.15, 0.24, 0.12).move(-0.25, -0.33, 0.04);
    const straps: Solid[] = [];
    for (let i = 0; i < 4; i++) straps.push(box(0.035, 0.75 + hash(i, 2) * 0.2, 0.006, 0.18 + i * 0.07, -0.8 - hash(i, 2) * 0.2, 0.06 + i * 0.008).rotate(0, 0, (hash(i, 5) - 0.5) * 6));
    return [
      { mat: "wood-grey", solid: union(box(1.0, 0.12, 0.025, 0, 0, 0.012), ...[-0.25, 0.25, 0.4].map((x) => bar([x, 0.05, 0.02], [x, 0.08, 0.16], 0.014))) },
      { mat: "leather", solid: union(collar, ...straps) },
      { mat: "fur", solid: pad, overlap: true },
      { mat: "brass", solid: union(bar([-0.5, -0.4, 0.13], [-0.47, 0.02, 0.12], 0.012), bar([0.0, -0.4, 0.13], [-0.03, 0.02, 0.12], 0.012)) },
    ];
  },
});

/** The oat bin (Haferkiste): a plank chest with a sloping lid, iron strap hinges, a tin scoop on the lid. Origin:
 *  floor, its back to the wall at z = -0.275. */
prop({
  id: "oat-bin", items: ["oat-bin"], size: [0.9, 0.8, 0.55], place: "wall", where: "set", tris: 800,
  parts: () => [
    { mat: "wood-grey", solid: union(sideways([[-0.275, 0], [0.275, 0], [0.275, 0.62], [-0.275, 0.74]], 0.9), sideways([[-0.29, 0.745], [0.3, 0.625], [0.3, 0.65], [-0.29, 0.77]], 0.92)) },
    { mat: "iron", solid: union(box(0.04, 0.005, 0.3, -0.3, 0.76, -0.15).rotate(12, 0, 0), box(0.04, 0.005, 0.3, 0.3, 0.76, -0.15).rotate(12, 0, 0)) },
    { mat: "zinc", solid: lathe([[0, 0], [0.06, 0], [0.065, 0.08], [0, 0.08]], 0, 0, 0).rotate(0, 0, 90).move(0.12, 0.76, 0.05) },
  ],
});

/** A stable lantern (Sturmlaterne) hung by its bail: a tin font, a glass globe behind two guard wires, a hood. Origin:
 *  the hook; it hangs below. */
prop({
  id: "stable-lantern", items: ["lantern"], size: [0.2, 0.36, 0.18], place: "ceiling", where: "set", tris: 2500,
  parts: () => [
    { mat: "zinc", solid: union(lathe([[0, 0], [0.075, 0], [0.08, 0.05], [0.04, 0.075], [0, 0.075]], 0, -0.34, 0), lathe([[0, 0], [0.065, 0], [0.03, 0.05], [0, 0.055]], 0, -0.16, 0), bar([-0.08, -0.3, 0], [-0.08, -0.16, 0], 0.005), bar([0.08, -0.3, 0], [0.08, -0.16, 0], 0.005)) },
    { mat: "iron", solid: union(ring(0.09, 0.003).trim(0, 1, 0, 0).move(0, -0.13, 0), bar([0, -0.04, 0], [0, 0, 0], 0.003)) },
    { mat: "glass", solid: lathe([[0.035, 0], [0.065, 0.05], [0.06, 0.1], [0.03, 0.13], [0.025, 0.13], [0.055, 0.1], [0.06, 0.05], [0.03, 0]], 0, -0.265, 0) },
  ],
  glow: [{ at: [0, -0.22, 0], lumens: 70, color: "#ffad5c", range: 8, shadow: true, flicker: 0.12 }],
});

/** The stand's drain: a cast-iron cover strip in a cement channel across the floor to a round grate, down to the house
 *  drain and the sewer. Origin: the channel's middle on the floor; it runs 3 m along z, the grate at its +z end. */
prop({
  id: "stable-gutter", items: ["stable-drain"], size: [0.36, 0.02, 3.0], place: "floor", where: "set", tris: 1500,
  parts: () => {
    const slots: Solid[] = [];
    for (let z = -1.4; z < 1.2; z += 0.06) slots.push(box(0.1, 0.012, 0.02, 0, 0, z));
    const grate: Solid[] = [];
    for (let x = -0.12; x <= 0.121; x += 0.04) grate.push(box(0.016, 0.014, 0.3 * Math.sqrt(Math.max(0, 1 - (x / 0.15) ** 2)), x, 0, 1.3));
    return [
      { mat: "cement", solid: box(0.26, 0.004, 2.7, 0, 0, -0.15) },
      { mat: "iron", solid: union(...slots, box(0.14, 0.006, 2.6, 0, 0, -0.1)) },
      { mat: "iron-rust", solid: union(ring(0.15, 0.012).rotate(90, 0, 0).move(0, 0.008, 1.3), ...grate) },
    ];
  },
});

/** A dung fork and a broom leaning on the wall. Origin: floor at the wall, the handles' feet 0.3 m out. */
prop({
  id: "stable-tools", items: ["dung-fork", "broom"], size: [0.6, 1.45, 0.4], place: "wall", where: "set", tris: 2000,
  parts: () => {
    const fork = union(bar([-0.15, 0.32, 0.25], [-0.15, 1.42, 0.02], 0.016));
    const tines: Solid[] = [];
    for (let i = 0; i < 4; i++) tines.push(bar([-0.21 + i * 0.04, 0.32, 0.25], [-0.21 + i * 0.04, 0.02, 0.34], 0.005));
    return [
      { mat: "wood-raw", solid: union(fork, bar([0.18, 0.12, 0.27], [0.18, 1.4, 0.02], 0.014)) },
      { mat: "iron", solid: union(...tines, box(0.14, 0.02, 0.02, -0.15, 0.31, 0.25)) },
      { mat: "jute", solid: sdf.cone([0.18, 0.18, 0.26], [0.18, 0.0, 0.3], 0.06, 0.1).displace(0.008, 30, 2, 4).solid(0.012).simplify(0.003) },
    ];
  },
});

/** The stable's double door onto the court: two ledged and braced leaves, the left standing a third open, a small
 *  glazed light in the right, long strap hinges. Origin: the opening's bottom middle on the room face (1.4 by 2.2 m). */
prop({
  id: "stable-door", items: ["stable-door"], size: [1.45, 2.2, 0.55], place: "wall", where: "set", tris: 2500,
  parts: () => {
    const leaf = (sx: number) => {
      const bd: Solid[] = [];
      for (let i = 0; i < 5; i++) bd.push(box(0.135, 2.18, 0.04, sx * (0.07 + i * 0.137), 0, -0.04));
      return union(...bd, box(0.68, 0.12, 0.03, sx * 0.35, 0.25, -0.005), box(0.68, 0.12, 0.03, sx * 0.35, 1.8, -0.005), bar([sx * 0.08, 0.36, 0.0], [sx * 0.62, 1.78, 0.0], 0.03));
    };
    const light = box(0.36, 0.28, 0.06, 0.35, 1.45, -0.04);
    const swing = (s: Solid) => s.move(0.7, 0, 0.0).rotate(0, -38, 0).move(-0.7, 0, 0.0); // the left leaf round its hinge
    const hinges = (sx: number) => union(box(0.5, 0.04, 0.008, sx * 0.25, 0.35, 0.0), box(0.5, 0.04, 0.008, sx * 0.25, 1.7, 0.0));
    return [
      { mat: "wood-grey", solid: union(swing(leaf(-1).move(0, 0, 0)), leaf(1).minus(light)) },
      { mat: "glass-dark", solid: box(0.36, 0.28, 0.006, 0.35, 1.45, -0.04) },
      { mat: "iron", solid: union(swing(hinges(-1)), hinges(1)) },
    ];
  },
});

export const KIT_PORTER = true;

/** A small outbuilding window: one frame deep in its reveal near the outside face, a mullion and a transom, glass, an
 *  inner sill board (0075's two 50 x 80 cm windows; the stable's 80 x 60 cm ones high in a 51 cm wall). Origin: the
 *  opening's bottom middle on the room face; the wall runs back to z = -depth. */
for (const [w, h, depth] of [[0.5, 0.8, 0.38], [0.8, 0.6, 0.51], [0.9, 1.3, 0.16]] as const) // the last a dormer's, its frame at the front
  prop({
    id: `window-${Math.round(w * 100)}x${Math.round(h * 100)}`, items: ["window-small"], size: [w, h, depth], place: "wall", where: "set", tris: 600,
    parts: () => {
      const z = -depth + 0.1;
      return [
        { mat: "paint-white", solid: union(box(w, 0.05, 0.06, 0, 0, z), box(w, 0.05, 0.06, 0, h - 0.05, z), box(0.05, h, 0.06, -w / 2 + 0.025, 0, z), box(0.05, h, 0.06, w / 2 - 0.025, 0, z), box(0.035, h, 0.05, 0, 0, z), box(w, 0.035, 0.05, 0, h * 0.66, z)) },
        { mat: "glass", solid: box(w - 0.06, h - 0.06, 0.004, 0, 0.03, z) },
        { mat: "wood-soft", solid: box(w, 0.025, depth - 0.14, 0, 0, -(depth - 0.14) / 2 - 0.005) },
      ];
    },
  });

/** What covers the chest in 0075: card boxes stacked, a folded newspaper spread over them, a cloth bundle, a cigar box.
 *  Origin: the chest top's middle. */
prop({
  id: "chest-clutter", items: ["newspaper", "boxes"], size: [0.9, 0.22, 0.45], place: "on", where: "set", tris: 2500,
  parts: () => [
    { mat: "card", solid: union(box(0.3, 0.08, 0.22, -0.25, 0, -0.06).rotate(0, 6, 0), box(0.24, 0.06, 0.18, -0.24, 0.08, -0.05).rotate(0, -9, 0), box(0.2, 0.05, 0.12, 0.3, 0, 0.1)) },
    { mat: "paper", solid: union(box(0.42, 0.006, 0.3, 0.05, 0.002, 0.02).rotate(0, 14, 0), box(0.38, 0.006, 0.26, -0.2, 0.142, 0.0).rotate(0, -4, 3)) },
    { mat: "linen", solid: sdf.ellipsoid(0.16, 0.07, 0.12).move(0.28, 0.06, -0.08).displace(0.01, 8, 2, 31).solid(0.02).simplify(0.005) },
    { mat: "wood-mid", solid: box(0.2, 0.045, 0.12, 0.02, 0.008, 0.16).rotate(0, 20, 0) },
  ],
});
