// Building accessories the /goal names (ladders, stairs, rails) and the home front's collecting (catalogue
// exteriors). Sources, all reference only:
// - the billposter's kit: Paul Wilde's "Plakatankleber" (Basel, 1923-24; Commons, CC BY-SA) for the paste brush and
//   pail he carries, the Litfass columns of kit/litfass.ts (R 0.7 m, posters to 3 m) for the ladder's reach.
// - the pole scaffold (Stangengeruest): Deutsche Fotothek df_ps_0000351_002 (a brick block in one, CC BY-SA 3.0 de)
//   and the craft's usual build: one row of fir standards about 3 m apart and 1.3 m from the wall, ledgers lashed
//   with scaffold chains every 2 m, putlogs from the ledgers into the wall, plank decks with toe boards and a guard
//   pole, cross braces on the face, ladders between the lifts, a gin wheel on a gallows arm.
// - front steps: Berlin's sandstone entrance steps with wrought-iron rails (the stair rails of kit/front.ts).
// - the collection points: the Reichsfuttermittelstelle's 1917 poster "Sammelt Eicheln und Kastanien" (Commons,
//   public domain), which leaves a box for the nearest collection point; the war's collections of metals (1915-17),
//   kitchen scraps for the pigs, bones, rags and paper, fruit stones for oil (1917-18). Signs carry generic words.
//   ladder-paste     the billposter's ladder as it leans on a Litfass column (its top at z 0), the paste pail hung on
//                    a rung, the long brush, a roll of posters at its foot
//   ladder-lean      a house ladder of 4.6 m leaning on a wall (place wall), iron-shod, its ties under the rungs
//   ladder-step      a painter's step ladder standing open, its tray with a pot and brush
//   scaffold-bay     a pole scaffold over two bays and three lifts (6 m wide, 9 m high) against a wall
//   steps-front-2/-3/-5  sandstone steps up to a door, worn hollow at the middle; -3 with one rail, -5 with two
//   collect-sign-0..4    the collection points' boards and placards (metals, kitchen scraps, bones and rags, fruit
//                    stones, acorns and chestnuts)
//   scrap-tub        the kitchen-scrap tub on its stand, lidded, its plate lettered
//   metal-crate      a slatted crate of collected copper and brass: a kettle, pans, candlesticks, a mortar, handles
// ASSUMED: the standards' foot on a sole board with wedges (no barrel); the ladders' sizes from the crafts' usual ones.
import type { Solid } from "raea/3d";
import { manifold } from "raea/3d";
import { ball, box, hash, lathe, rbox, ring, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod, sign } from "./outgeo";
import { type Part, prop } from "./prop";
import { Build } from "./vehicles";

const r01 = (s: number, k: number) => hash(s, k, 5501);
const rr = (s: number, k: number, a: number, b: number) => a + (b - a) * r01(s, k);

// ── ladders ──────────────────────────────────────────────────────────────────────────────────────────────────────
/** A ladder L long, upright in its own frame (foot at y 0), the stiles w0 apart at the foot and w1 at the top, rungs
 *  every `step`, iron ties under the second and the last rung, iron shoes at the foot. */
function ladder(b: Build, L: number, w0: number, w1: number, step = 0.28, wood: MatId = "wood-raw"): Solid[] {
  const out: Solid[] = [], wAt = (y: number) => w0 + ((w1 - w0) * y) / L;
  const st = (s: number) => manifold.hull(box(0.035, 0.001, 0.065, s * w0 / 2, 0, 0), box(0.03, 0.001, 0.06, s * w1 / 2, L - 0.001, 0));
  const parts: [MatId, Solid][] = [[wood, st(-1)], [wood, st(1)]];
  const n = Math.floor((L - 0.2) / step);
  for (let k = 1; k <= n; k++) { const y = k * step, w = wAt(y); parts.push([wood, rod([-w / 2, y, 0], [w / 2, y, 0], 0.015)]); }
  for (const k of [2, n]) { const y = k * step - 0.04, w = wAt(y); parts.push(["iron", rod([-w / 2 - 0.02, y, 0], [w / 2 + 0.02, y, 0], 0.005)]); }
  for (const s of [-1, 1]) parts.push(["iron", box(0.045, 0.06, 0.075, s * w0 / 2, 0, 0)]);
  for (const [m, p] of parts) { b.add(m, p); out.push(p); }
  return out;
}
/** Lean a part built upright (foot at the origin) by `deg` from the vertical toward -z, then set its foot at z. */
const lean = (s: Solid, deg: number, z: number) => s.rotate(-deg, 0, 0).move(0, 0, z);

/** A zinc pail of paste: tapered, beaded rim, the bail, the grey paste inside. */
function pail(b: Build, at: V3, bailUp = true) {
  b.add("zinc", lathe([[0, 0], [0.11, 0], [0.135, 0.26], [0.142, 0.27], [0.142, 0.28], [0.13, 0.28], [0.122, 0.26], [0.1, 0.012], [0, 0.012]], ...at, 16));
  b.add("lime-dirty", lathe([[0, 0], [0.126, 0], [0.126, 0.012], [0, 0.012]], at[0], at[1] + 0.2, at[2], 16));
  const top = at[1] + (bailUp ? 0.42 : 0.3);
  b.add("iron", rod([at[0] - 0.14, at[1] + 0.25, at[2]], [at[0] - 0.06, top, at[2]], 0.004), rod([at[0] - 0.06, top, at[2]], [at[0] + 0.06, top, at[2]], 0.004), rod([at[0] + 0.06, top, at[2]], [at[0] + 0.14, at[1] + 0.25, at[2]], 0.004));
}
/** The billposter's brush: a broad flat stock of bristle on a long handle, from `foot` to `head`. */
function pasteBrush(b: Build, foot: V3, head: V3) {
  b.add("wood-raw", rod(foot, head, 0.016));
  const d = [head[0] - foot[0], head[1] - foot[1], head[2] - foot[2]], L = Math.hypot(...d), u = d.map((v) => v / L);
  const c: V3 = [head[0] + u[0] * 0.04, head[1] + u[1] * 0.04, head[2] + u[2] * 0.04];
  const tilt = (Math.atan2(u[2], u[1]) * 180) / Math.PI;
  b.add("wood-mid", manifold.box(0.2, 0.05, 0.05).rotate(tilt, 0, 0).move(...c));
  b.add("jute", manifold.box(0.19, 0.08, 0.04).rotate(tilt, 0, 0).move(c[0] + u[0] * 0.06, c[1] + u[1] * 0.06, c[2] + u[2] * 0.06));
}

prop({
  id: "ladder-paste", items: ["billposter"], size: [0.9, 3.1, 1.3], place: "floor", where: "set", tris: 6000,
  parts: () => {
    const b = new Build(), L = 3.1, A = 17, a = (A * Math.PI) / 180, Z = L * Math.sin(a);
    const tmp = new Build();
    ladder(tmp, L, 0.5, 0.36, 0.28);
    // the top padded with a leather roll where it rests on the column; an S-hook on the right stile for the pail
    tmp.add("leather", rod([-0.2, L - 0.05, -0.04], [0.2, L - 0.05, -0.04], 0.035));
    tmp.add("iron", rod([0.22, 1.96, 0], [0.34, 1.93, 0], 0.005), rod([0.34, 1.93, 0], [0.42, 1.9, 0], 0.005));
    for (const p of tmp.parts()) b.add(p.mat, lean(p.solid, A, Z));
    // the pail hangs plumb from the hook beside the ladder, clear of the column
    const hy = 1.9 * Math.cos(a), hz = Z - 1.9 * Math.sin(a);
    pail(b, [0.42, hy - 0.42, hz], true);
    // the long brush stood against the column on the ladder's left; a roll of posters at its foot, tied; a flat sheaf
    pasteBrush(b, [-0.44, 0.02, 0.38], [-0.4, 1.3, -0.06]);
    b.add("paper-poster", rod([-0.45, 0.05, Z + 0.15], [0.05, 0.05, Z + 0.2], 0.05));
    b.add("jute", ring(0.052, 0.004).rotate(0, 90, 0).move(-0.3, 0.05, Z + 0.165), ring(0.052, 0.004).rotate(0, 90, 0).move(-0.1, 0.05, Z + 0.185));
    b.add("paper", box(0.42, 0.012, 0.3, 0.3, 0, Z + 0.05));
    return b.parts();
  },
});

prop({
  id: "ladder-lean", items: ["ladder"], size: [0.6, 4.5, 1.4], place: "wall", where: "set", tris: 5000,
  parts: () => {
    const b = new Build(), L = 4.6, A = 15, Z = L * Math.sin((A * Math.PI) / 180), tmp = new Build();
    ladder(tmp, L, 0.52, 0.4, 0.28, "wood-grey");
    for (const p of tmp.parts()) b.add(p.mat, lean(p.solid, A, Z + 0.04));
    return b.parts();
  },
});

prop({
  id: "ladder-step", items: ["ladder"], size: [0.75, 1.95, 1.3], place: "floor", where: "set", tris: 6000,
  parts: () => {
    // the front with flat treads, the back a frame with braces, hinged at the top under a small platform; a cord
    // between them; the tray with a pot of distemper and a brush
    const b = new Build(), H = 1.8, A = 14, t = Math.tan((A * Math.PI) / 180), zF = H * t, zB = -H * t;
    for (const s of [-1, 1]) {
      b.add("wood-varnish-worn", manifold.hull(box(0.035, 0.001, 0.08, s * 0.29, 0, zF), box(0.035, 0.001, 0.08, s * 0.22, H - 0.001, 0.02)));
      b.add("wood-varnish-worn", manifold.hull(box(0.03, 0.001, 0.05, s * 0.28, 0, zB), box(0.03, 0.001, 0.05, s * 0.22, H - 0.04, -0.03)));
    }
    for (let k = 1; k <= 5; k++) { const y = k * 0.3, z = zF * (1 - y / H) + 0.02 * (y / H), w = 0.58 - (0.14 * y) / H; b.add("wood-varnish-worn", box(w, 0.025, 0.13, 0, y - 0.0125, z)); }
    for (const y of [0.45, 1.05]) { const z = zB * (1 - y / H) - 0.03 * (y / H), w = 0.56 - (0.14 * y) / H; b.add("wood-varnish-worn", box(w, 0.06, 0.02, 0, y, z)); }
    b.add("wood-varnish-worn", box(0.5, 0.03, 0.2, 0, H, 0));
    b.add("iron", rod([-0.22, H - 0.02, 0.02], [0.22, H - 0.02, 0.02], 0.008));
    for (const s of [-1, 1]) b.add("jute", rod([s * 0.26, 0.55, zF * (1 - 0.55 / H)], [s * 0.26, 0.55, zB * (1 - 0.55 / H)], 0.005));
    b.add("zinc", lathe([[0, 0], [0.1, 0], [0.11, 0.18], [0.1, 0.18], [0.09, 0.012], [0, 0.012]], 0.1, H + 0.03, 0, 14));
    b.add("lime-wash", lathe([[0, 0], [0.104, 0], [0.104, 0.01], [0, 0.01]], 0.1, H + 0.17, 0, 14));
    b.add("wood-raw", rod([0.08, H + 0.16, 0], [-0.15, H + 0.32, 0.05], 0.012));
    b.add("jute", rbox(0.12, 0.08, 0.05, 0.015, -0.17, H + 0.3, 0.06));
    return b.parts();
  },
});

// ── the pole scaffold ────────────────────────────────────────────────────────────────────────────────────────────
prop({
  id: "scaffold-bay", items: ["scaffold"], size: [6.8, 9.2, 2.4], place: "wall", where: "set", tris: 30000,
  parts: () => {
    const b = new Build(), s = 7100, ZP = 1.3, XS = [-3, 0, 3], LIFTS = [2.0, 4.0, 6.0], TOP = 9.0;
    // the standards: peeled fir tapering from 0.085 at the foot to 0.05, a sole board under each with two wedges
    for (const [i, x] of XS.entries()) {
      const h = TOP - rr(s, i, 0, 0.5);
      b.add("wood-grey", lathe([[0, 0], [0.085, 0], [0.075, h * 0.5], [0.05, h], [0, h]], x, 0.05, ZP, 10));
      b.add("wood-raw", box(0.5, 0.05, 0.3, x, 0, ZP), box(0.08, 0.04, 0.12, x - 0.13, 0.05, ZP), box(0.08, 0.04, 0.12, x + 0.13, 0.05, ZP));
    }
    // a chain's lashing at a pole: three turns of iron and the wedge driven under them
    const lash = (x: number, y: number, z: number) => {
      for (let k = 0; k < 3; k++) b.add("iron", ring(0.1, 0.007, 14, 6).rotate(90, 0, 0).move(x, y - 0.05 + k * 0.035, z));
      b.add("wood-raw", box(0.04, 0.12, 0.03, x, y - 0.12, z + 0.1));
    };
    // ledgers along the poles' wall side at each lift, guard poles on their outer side; putlogs to the wall
    for (const [k, y] of LIFTS.entries()) {
      b.add("wood-grey", rod([-3.4, y, ZP - 0.13], [3.4, y + rr(s, k + 20, -0.03, 0.03), ZP - 0.13], 0.055));
      for (const x of XS) lash(x, y, ZP);
      if (k !== 1) {
        b.add("wood-grey", rod([-3.4, y + 1.1, ZP + 0.1], [3.4, y + 1.1, ZP + 0.1], 0.04));
        for (const x of XS) lash(x, y + 1.1, ZP);
      }
      for (let i = 0; i <= 6; i++) { const x = -3 + i; b.add("wood-raw", box(0.1, 0.12, ZP + 0.05, x + 0.15, y + 0.04, (ZP - 0.1) / 2)); }
      // the deck: four planks on the putlogs, butted at the middle pole, a gap left for the ladder; the toe board
      if (k !== 1) {
        for (let p = 0; p < 4; p++) {
          const z = 0.18 + p * 0.25, yb = y + 0.16;
          for (const [x0, x1] of [[-3.3, -0.02], [0.02, 3.3]]) b.add("wood-raw", box(x1 - x0, 0.045, 0.24, (x0 + x1) / 2, yb + rr(s, k * 10 + p, 0, 0.006), z));
        }
        b.add("wood-raw", box(6.6, 0.18, 0.035, 0, y + 0.2, ZP - 0.25));
      }
    }
    // cross braces on the face, each across a bay from one lift to the next
    for (const [x0, x1, y0, y1] of [[-3, 0, 0.3, 4.0], [0, 3, 4.0, 0.3], [-3, 0, 4.0, 7.6], [0, 3, 7.6, 4.0]] as number[][]) b.add("wood-grey", rod([x0, y0, ZP + 0.1], [x1, y1, ZP + 0.1], 0.045));
    // the ladder from the street to the first deck, leaning on the outside of its guard pole, a metre above it
    {
      const tmp = new Build(), L = 3.5, A = 14, LZ = ZP + 0.16;
      ladder(tmp, L, 0.48, 0.42, 0.28, "wood-grey");
      for (const p of tmp.parts()) b.add(p.mat, lean(p.solid, A, L * Math.sin((A * Math.PI) / 180)).move(2.2, 0, LZ));
    }
    // the gin wheel under a gallows arm at the middle standard's head; its rope over the wheel, one fall down to a
    // mortar tub at the top deck's height, the other hanging to the street for the labourer's pull
    const GY = TOP - 0.7, WZ = ZP + 0.72;
    b.add("wood-grey", rod([0, GY, ZP], [0, GY, ZP + 0.85], 0.04), rod([0, GY - 0.6, ZP], [0, GY - 0.02, ZP + 0.6], 0.03));
    b.add("iron", lathe([[0.02, -0.025], [0.11, -0.025], [0.11, -0.012], [0.09, 0], [0.11, 0.012], [0.11, 0.025], [0.02, 0.025]], 0, 0, 0, 16).rotate(0, 0, 90).move(0, GY - 0.13, WZ), rod([0, GY - 0.02, WZ], [0, GY - 0.13, WZ], 0.012));
    b.add("jute", rod([0, GY - 0.13, WZ - 0.11], [0, 6.62, WZ - 0.11], 0.01), rod([0, GY - 0.13, WZ + 0.11], [0, 1.1, WZ + 0.11], 0.01));
    b.add("wood-raw", manifold.hull(box(0.32, 0.001, 0.32, 0, 6.2, WZ - 0.11), box(0.38, 0.001, 0.38, 0, 6.5, WZ - 0.11)).minus(box(0.32, 0.4, 0.32, 0, 6.24, WZ - 0.11)));
    b.add("iron", rod([-0.17, 6.5, WZ - 0.11], [0, 6.62, WZ - 0.11], 0.006), rod([0.17, 6.5, WZ - 0.11], [0, 6.62, WZ - 0.11], 0.006));
    lash(0, GY, ZP);
    return b.parts();
  },
});

// ── front steps ──────────────────────────────────────────────────────────────────────────────────────────────────
/** n sandstone steps up to a door in the wall at z 0: each block with its nosing rounded and a hollow worn at the
 *  middle of its tread; wrought-iron rails (flat handrail, square balusters, a scroll at the foot) on `rails` sides. */
function steps(n: number, rails: number[]): Part[] {
  const b = new Build(), W = 1.7, RI = 0.165, TR = 0.32, LAND = 0.45, s = 7300 + n;
  for (let k = 0; k < n; k++) {
    const z0 = 0, z1 = LAND + (n - 1 - k) * TR, y0 = k * RI;
    let blk = rbox(W, RI + 0.01, z1 - z0 + 0.01, 0.012, 0, y0 - 0.01, (z0 + z1) / 2);
    // the hollow at the middle of the tread, deepest near the nosing, a little off centre
    const hx = rr(s, k, -0.12, 0.12), depth = 0.006 + 0.004 * (n - k);
    blk = blk.minus(ball(1).scale(0.42, depth, 0.16).move(hx, y0 + RI, z1 - 0.12));
    b.add("sandstone", blk);
  }
  const yTop = n * RI, zN = LAND + (n - 1) * TR; // the landing's top, the lowest nosing
  // the stone's top at z, and the rail's line: level over the landing, then 0.9 m above the nosings down the flight
  const stoneY = (z: number) => (z <= LAND ? yTop : (n - Math.ceil((z - LAND) / TR - 1e-6)) * RI);
  const railY = (z: number) => (z <= LAND ? yTop + 0.9 : yTop + 0.9 - ((z - LAND) * RI) / TR);
  for (const side of rails) {
    const x = side * (W / 2 - 0.06);
    const pts: V3[] = [[x, yTop + 0.9, 0.05], [x, yTop + 0.9, LAND], [x, railY(zN), zN]];
    for (let i = 0; i + 1 < pts.length; i++) b.add("iron", manifold.hull(box(0.012, 0.045, 0.001, ...pts[i]), box(0.012, 0.045, 0.001, ...pts[i + 1])));
    // the newel posts: at the wall, at the landing's edge and at the foot, set into the stone, a knob on each
    for (const z of [0.06, LAND - 0.04, zN - 0.06]) b.add("iron", box(0.025, railY(z) - stoneY(z), 0.025, x, stoneY(z), z), ball(0.022).move(x, railY(z) + 0.065, z));
    // balusters every 0.12 m, from the stone up to the rail
    for (let z = 0.18; z < zN - 0.1; z += 0.12) b.add("iron", box(0.013, railY(z) - stoneY(z), 0.013, x, stoneY(z), z));
    // a scroll at the foot: the rail's end curled down in a flat volute
    const vc: V3 = [x, railY(zN) - 0.08, zN + 0.02];
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI * 1.6, a1 = ((i + 1) / 10) * Math.PI * 1.6, r0 = 0.08 - i * 0.005, r1 = 0.08 - (i + 1) * 0.005;
      b.add("iron", manifold.hull(box(0.012, 0.012, 0.012, x, vc[1] + r0 * Math.cos(a0) - 0.006, vc[2] + r0 * Math.sin(a0)), box(0.012, 0.012, 0.012, x, vc[1] + r1 * Math.cos(a1) - 0.006, vc[2] + r1 * Math.sin(a1))));
    }
  }
  return b.parts();
}
for (const [n, rails] of [[2, []], [3, [1]], [5, [-1, 1]]] as [number, number[]][]) prop({
  id: `steps-front-${n}`, items: ["front-steps"], size: [1.7, n * 0.165 + 1.0, 0.45 + (n - 1) * 0.32 + 0.2], place: "wall", where: "set", tris: 6000 + n * 1500, parts: () => steps(n, rails),
});

// ── the collection points ────────────────────────────────────────────────────────────────────────────────────────
/** The boards: a painted board or a pasted placard, "SAMMELSTELLE" over what is taken, hung on two hooks. */
const COLLECT: [MatId, MatId, string, number][] = [
  ["paint-white", "enamel-black", "KUPFER · MESSING · NICKEL", 0.05], ["enamel-black", "paint-white", "KÜCHENABFÄLLE", 0.06],
  ["paper", "enamel-black", "KNOCHEN · LUMPEN · ALTPAPIER", 0.045], ["paper-poster", "enamel-red", "OBSTKERNE", 0.07], ["enamel-yellow", "enamel-black", "EICHELN · KASTANIEN", 0.055],
];
for (const [v, [ground, ink, what, size]] of COLLECT.entries()) prop({
  id: `collect-sign-${v}`, items: ["collection-point"], size: [0.92, 2.4, 0.04], place: "wall", where: "set", tris: 12000,
  parts: () => {
    const b = new Build(), s = 7400 + v, W = 0.9, H = 0.46, Y = 1.85, paper = ground.startsWith("paper");
    if (paper) b.add(ground, box(W, H, 0.003, 0, Y, 0.002).rotate(0, 0, rr(s, 1, -1.2, 1.2)));
    else b.add(ground, box(W, H, 0.02, 0, Y, 0.01), box(W + 0.03, 0.03, 0.025, 0, Y + H - 0.015, 0.012));
    const zf = paper ? 0.004 : 0.02;
    b.add(ink, sign("SAMMELSTELLE", 0.085).move(0, Y + H * 0.66, zf), sign(what, size).move(0, Y + H * 0.33, zf));
    b.add(ink, box(W - 0.08, 0.008, 0.002, 0, Y + H * 0.5, zf));
    if (!paper) for (const x of [-W / 2 + 0.08, W / 2 - 0.08]) b.add("iron", rod([x, Y + H + 0.02, 0.0], [x, Y + H + 0.02, 0.03], 0.006), rod([x, Y + H + 0.02, 0.03], [x, Y + H - 0.01, 0.03], 0.005));
    else for (const [x, y] of [[-W / 2 + 0.02, Y + H - 0.02], [W / 2 - 0.02, Y + H - 0.02], [-W / 2 + 0.02, Y + 0.02], [W / 2 - 0.02, Y + 0.02]]) b.add("iron", ball(0.006).move(x, y, 0.004));
    // a hand-written slip under it: the hours, in chalk on a scrap of board
    if (v % 2 === 0) { b.add("board-chalk", box(0.32, 0.14, 0.012, 0.2, Y - 0.2, 0.006)); b.add("chalk", sign("MI · SA", 0.04).move(0.2, Y - 0.13, 0.012)); }
    return b.parts();
  },
});

prop({
  id: "scrap-tub", items: ["collection-point"], size: [0.8, 1.05, 0.8], place: "floor", where: "set", tris: 5000,
  parts: () => {
    // a zinc tub on a low wooden stand, two handles, the lid ajar, a lettered plate riveted on its front
    const b = new Build();
    b.add("wood-grey", box(0.7, 0.06, 0.7, 0, 0.18, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.06, 0.18, 0.06, sx * 0.3, 0, sz * 0.3))));
    b.add("zinc", lathe([[0, 0], [0.3, 0], [0.33, 0.62], [0.345, 0.63], [0.345, 0.65], [0.325, 0.65], [0.315, 0.62], [0.285, 0.015], [0, 0.015]], 0, 0.24, 0, 20));
    for (const y of [0.42, 0.72]) b.add("zinc", ring(0.3 + (y - 0.24) * 0.048, 0.008, 24, 6).rotate(90, 0, 0).move(0, y, 0));
    for (const s of [-1, 1]) b.add("iron", rod([s * 0.33, 0.75, -0.06], [s * 0.38, 0.75, 0], 0.008), rod([s * 0.38, 0.75, 0], [s * 0.33, 0.75, 0.06], 0.008));
    b.add("zinc", lathe([[0, 0], [0.355, 0], [0.355, 0.02], [0.2, 0.06], [0, 0.07]], 0, 0, 0, 20).rotate(0, 0, 9).move(0.05, 0.9, 0));
    b.add("iron", rod([-0.03, 0.99, -0.06], [-0.03, 0.99, 0.06], 0.01));
    b.add("dung", lathe([[0, 0], [0.32, 0], [0.32, 0.01], [0, 0.04]], 0, 0.82, 0, 16));
    b.add("enamel", box(0.36, 0.12, 0.006, 0, 0.5, 0.321));
    b.add("enamel-black", sign("KÜCHENABFÄLLE", 0.032).move(0, 0.56, 0.324));
    return b.parts();
  },
});

prop({
  id: "metal-crate", items: ["collection-point"], size: [0.95, 0.75, 0.65], place: "floor", where: "set", tris: 12000,
  parts: () => {
    // the slatted crate and what the households gave: a kettle, two pans, candlesticks, a mortar and pestle, door
    // handles, a lamp's font
    const b = new Build(), W = 0.9, D = 0.6, H = 0.42;
    for (const y of [0.04, 0.17, 0.3]) for (const s of [-1, 1]) b.add("wood-raw", box(W, 0.1, 0.018, 0, y, s * (D / 2 - 0.009)), box(0.018, 0.1, D, s * (W / 2 - 0.009), y, 0));
    b.add("wood-raw", box(W, 0.02, D, 0, 0.02, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add("wood-raw", box(0.04, H, 0.04, sx * (W / 2 - 0.03), 0.02, sz * (D / 2 - 0.03)));
    // each thing made at the origin, turned, then set in the crate (floor at y 0.04)
    const set = (s: Solid, rx: number, rz: number, at: V3) => s.rotate(rx, 0, rz).move(...at);
    // the kettle upright at the back left, its spout, the handle over its lid
    b.add("copper", lathe([[0, 0], [0.12, 0], [0.15, 0.1], [0.13, 0.18], [0.06, 0.22], [0.05, 0.25], [0, 0.25]], -0.24, 0.04, -0.1, 16));
    b.add("copper", rod([-0.12, 0.13, -0.1], [-0.02, 0.27, -0.1], 0.012), rod([-0.33, 0.27, -0.1], [-0.24, 0.37, -0.1], 0.008), rod([-0.24, 0.37, -0.1], [-0.15, 0.27, -0.1], 0.008));
    // a copper pan tipped against the kettle, its handle up out of the crate
    b.add("copper", set(manifold.union(lathe([[0, 0], [0.13, 0], [0.14, 0.07], [0.13, 0.07], [0.12, 0.006], [0, 0.006]], 0, 0, 0, 16), rod([0.13, 0.05, 0], [0.42, 0.06, 0], 0.012)), 0, 32, [0.12, 0.1, -0.12]));
    // a brass mortar upright at the front right with its pestle in it
    b.add("brass", lathe([[0, 0], [0.08, 0], [0.085, 0.12], [0.07, 0.12], [0.06, 0.015], [0, 0.015]], 0.27, 0.04, 0.14, 14), rod([0.27, 0.1, 0.14], [0.33, 0.3, 0.1], 0.016));
    // two candlesticks lying, a lamp's font, a bundle of door handles
    const stick = lathe([[0, 0], [0.055, 0], [0.05, 0.02], [0.012, 0.03], [0.015, 0.12], [0.01, 0.2], [0.03, 0.22], [0.03, 0.235], [0, 0.235]], 0, 0, 0, 12);
    b.add("brass", set(stick, 0, 90, [-0.05, 0.1, 0.18]), set(stick, 90, 0, [-0.3, 0.1, 0.02]));
    b.add("brass", lathe([[0, 0], [0.07, 0], [0.08, 0.06], [0.05, 0.1], [0.02, 0.11], [0, 0.11]], 0.05, 0.04, -0.04, 14));
    for (let k = 0; k < 4; k++) b.add("brass", rod([0.02 + k * 0.035, 0.07 + k * 0.012, 0.2], [0.06 + k * 0.035, 0.07 + k * 0.012, 0.06], 0.009));
    b.add("paper", box(0.18, 0.1, 0.004, 0, 0.27, D / 2 + 0.002));
    b.add("enamel-black", sign("SAMMELGUT", 0.024).move(0, 0.32, D / 2 + 0.004));
    return b.parts();
  },
});

export const KIT_ACCESS = true;
