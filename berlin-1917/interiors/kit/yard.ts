// The Hinterhof (research/catalogue/outdoor.ts: the court's things): what stood in a Friedrichstadt court in the war's
// winter, after Zille's and the housing survey's courts (research/survey.md) and the 1913-20 plates. The carpet rack
// every court had (beating day by the house rules), the dust chests by the passage, the yard pump, washing on posts
// (frozen stiff in December), the organ grinder's cart (the Leierkastenmann played the courts for coins thrown
// down in paper), a handcart, coal sacks, snow shovelled to the walls, the cellar's neck. The house rules are the stair kit's board (kit/stair.ts).
// interiors/yard.ts lays a court out from these; the kitchen set's court (sets/kitchen.ts) is the hand-built one.
import { sdf } from "raea/3d";
import type { Solid } from "raea/3d";
import { along, tube } from "./forms";
import { ball, box, hash, lathe, lump, post, ring, rodX, union, zcone, type V3 } from "./geo";
import { washing } from "./kitchen";
import { bar } from "./porter";
import { type Part, prop } from "./prop";

const YARD = ["hinterhof"];

/** The carpet rack (Teppichklopfstange): two iron pipes and a bar at 1.75 m, snow along the bar. */
prop({
  id: "carpet-rack", items: [...YARD, "carpet-rack"], size: [2.6, 1.85, 0.1], place: "floor", tris: 500,
  parts: () => [
    { mat: "iron", solid: union(post(0.032, 1.8, -1.25, 0, 0), post(0.032, 1.8, 1.25, 0, 0), rodX(0.024, 2.56, 0, 1.75, 0), post(0.05, 0.04, -1.25, 0, 0), post(0.05, 0.04, 1.25, 0, 0)) },
    { mat: "snow", solid: union(box(2.4, 0.03, 0.05, 0, 1.77, 0), box(0.07, 0.02, 0.07, -1.25, 1.8, 0), box(0.07, 0.02, 0.07, 1.25, 1.8, 0)), overlap: true },
  ],
});

/** A dust chest (Müllkasten): a tarred deal chest lined with zinc, its lid sloping, iron straps, snow on the lid. */
prop({
  id: "dust-chest", items: [...YARD, "dustbin"], size: [1.3, 1.0, 0.8], place: "floor", tris: 400,
  parts: () => {
    const lid = box(1.32, 0.04, 0.84, 0, 0, 0).rotate(-8, 0, 0).move(0, 0.92, -0.01);
    return [
      { mat: "wood-dark", solid: union(box(1.26, 0.88, 0.76, 0, 0.03, 0), box(1.3, 0.03, 0.8, 0, 0, 0)) },
      { mat: "wood-grey", solid: lid, overlap: true },
      { mat: "iron", solid: union(...[-0.4, 0.4].map((x) => box(0.05, 0.9, 0.78, x, 0.02, 0)), box(0.1, 0.03, 0.03, 0, 0.82, 0.4)), overlap: true },
      { mat: "snow", solid: box(1.2, 0.05, 0.74, 0, 0, 0).rotate(-8, 0, 0).move(0, 0.95, -0.01), overlap: true },
    ];
  },
});

/* The court pump (Hofpumpe, Hofbrunnen). Every Berlin plot once had to have its own well; the court pumps stood on
 * into the 1920s, often a step from the privy (de.wikipedia, "Liste ausgewählter Straßenbrunnen im alten Berlin",
 * Hofbrunnen; Bärthel, Wasser für Berlin, "Wasserpumpe und Abort dicht nebeneinander").
 *   court-pump        the cast-iron one, after F. Albert Schwartz's court of Jägerstraße 49-50 (1890) and Georg
 *                     Bartels's court of the Märkisches Provinzialmuseum (1899; both Stadtmuseum Berlin, public
 *                     domain): a fluted column on a plain foot, a hoop clamped round it, a spout cast as a twisted rope,
 *                     a plain band, a cap disc and a turned finial with a spike; a board leaned under the spout to keep
 *                     the splash off the housing
 *   court-pump-wood   the wooden one, after Heinrich Zille's Wilmersdorf court (1901, public domain): a round boarded
 *                     housing, a flat cap over it and an iron finial, iron straps holding the lever's fork, the lever
 *                     hanging at its side at rest; after Schwartz's Große Hamburger Straße 29 (1887), a long outlet
 *                     pipe and so no board
 *   court-pump-ice    the iron one in a hard frost: the spill frozen round its foot and under the spout (as Bartels's
 *                     picture shows), icicles at the spout, snow on the cap and the board
 * ASSUMED: the sizes (the iron column 0.26 m across and 1.26 m to its cap, the proportions read off Bartels's
 * photograph; the wooden housing 0.3 m), the iron one's lever (neither photograph shows it: given the wooden one's).
 * Frame: the column on the origin, the spout toward +z, the lever on +x, a wall behind at -z. */

/** A fluted section: n flutes round radius r, each a groove d deep between narrow fillets. */
function fluted(r: number, n: number, d: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) for (const [f, k] of [[0, 0], [0.2, 0.75], [0.5, 1], [0.8, 0.75]]) { const a = ((i + f) / n) * 2 * Math.PI; pts.push([(r - d * k) * Math.cos(a), (r - d * k) * Math.sin(a)]); }
  return pts;
}

/** The spout's centre line in the y-z plane: out from the column, then bent down to its mouth. */
function spoutPath(y: number, z0: number, run: number, bend: number, drop: number): V3[] {
  const p: V3[] = [[0, y, z0], [0, y, z0 + run]];
  for (let i = 1; i <= 5; i++) { const a = (i / 5) * (Math.PI / 2); p.push([0, y - bend + bend * Math.cos(a), z0 + run + bend * Math.sin(a)]); }
  p.push([0, y - bend - drop, z0 + run + bend]);
  return p;
}

/** The rope-cast spout: a round core r thick with two thin strands wound round it, so it reads as twisted. */
function rope(path: V3[], r: number): Solid[] {
  const fine: V3[] = [];
  for (let i = 0; i + 1 < path.length; i++) for (let k = 0; k < 3; k++) { const t = k / 3, a = path[i], b = path[i + 1]; fine.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
  fine.push(path[path.length - 1]);
  const s: Solid[] = [...tube(path, r)];
  for (let k = 0; k < 2; k++) {
    const pts: V3[] = [];
    let walked = 0;
    for (let i = 0; i < fine.length; i++) {
      const [, y, z] = fine[i], [, y1, z1] = fine[Math.min(i + 1, fine.length - 1)], [, y0, z0] = fine[Math.max(i - 1, 0)];
      const ty = y1 - y0, tz = z1 - z0, l = Math.hypot(ty, tz), by = tz / l, bz = -ty / l;
      if (i) walked += Math.hypot(y - fine[i - 1][1], z - fine[i - 1][2]);
      const a = Math.PI * k + walked * 70;
      pts.push([r * Math.cos(a), y + r * Math.sin(a) * by, z + r * Math.sin(a) * bz]);
    }
    for (let i = 0; i + 1 < pts.length; i++) s.push(bar(pts[i], pts[i + 1], 0.22 * r)); // no joints: too thin to show them
  }
  return s;
}

/** The lever at rest: from its pivot on the housing's +x side, out and hanging down, a knob at its end. */
function lever(x: number, y: number, low: number): Solid[] {
  const p: V3[] = [[x, y, 0], [x + 0.08, y - 0.01, 0], [x + 0.14, y - 0.07, 0], [x + 0.165, y - 0.18, 0], [x + 0.17, y - 0.34, 0], [x + 0.165, low + 0.12, 0], [x + 0.16, low, 0]];
  return [...tube(p, 0.013), ball(0.022).scale(1, 1.4, 1).move(x + 0.16, low - 0.01, 0)];
}

function ironPump(ice: boolean): Part[] {
  const iron: Solid[] = [
    lathe([[0, 0], [0.142, 0], [0.142, 0.02], [0.137, 0.03], [0.137, 0.235], [0.146, 0.245], [0.146, 0.265], [0.134, 0.28], [0, 0.28]], 0, 0, 0, 24),
    along(fluted(0.13, 20, 0.008), 0.27, 1.19).rotate(-90, 0, 0),
    lathe([[0, 1.18], [0.134, 1.18], [0.134, 1.2], [0.13, 1.205], [0.13, 1.25], [0.138, 1.258], [0, 1.258]], 0, 0, 0, 24),
    lathe([[0, 1.256], [0.155, 1.256], [0.158, 1.272], [0.15, 1.292], [0.07, 1.305], [0, 1.305]], 0, 0, 0, 24),
    lathe([[0, 1.3], [0.045, 1.3], [0.045, 1.33], [0.036, 1.34], [0.055, 1.375], [0.06, 1.395], [0.05, 1.42], [0.026, 1.435], [0.026, 1.452], [0.04, 1.462], [0.03, 1.472], [0.012, 1.555], [0, 1.57]], 0, 0, 0, 16),
    ring(0.131, 0.007, 32, 6).rotate(90, 0, 0).move(0, 0.86, 0), box(0.03, 0.03, 0.035, -0.135, 0.845, 0), // the clamped hoop and its bolt lug
    ball(0.034).scale(1, 1, 0.7).move(0, 0.805, 0.125), // the spout's boss
    ...rope(spoutPath(0.805, 0.12, 0.09, 0.08, 0.03), 0.026),
    lathe([[0, 0], [0.03, 0], [0.033, 0.014], [0, 0.014]], 0, 0.683, 0.29, 12), // the mouth
    box(0.012, 0.09, 0.05, 0.137, 1.075, -0.02), box(0.012, 0.09, 0.05, 0.137, 1.075, 0.02), // the lever's fork
    ...lever(0.15, 1.12, 0.42),
  ];
  // the board leaned under the spout against the splash, its foot on the setts
  const board = box(0.19, 0.71, 0.024, 0, 0, 0).rotate(-28, 4, 0).move(0, 0, 0.47);
  const parts: Part[] = [{ mat: "iron-cast", solid: union(...iron) }, { mat: "wood-weathered", solid: board, overlap: true }];
  if (ice) {
    const frozen: Solid[] = [ball(0.3).scale(1.35, 0.05, 1.2).move(0.02, 0, 0.24)];
    for (const [x, l] of [[-0.01, 0.07], [0.006, 0.12], [0.017, 0.05]]) frozen.push(lathe([[0, 0], [0.008, 0], [0, l]], 0, 0, 0, 6).rotate(180, 0, 0).move(x, 0.686, 0.29));
    const snow: Solid[] = [lathe([[0, 0], [0.152, 0], [0.12, 0.02], [0.05, 0.03], [0, 0.03]], 0, 1.3, 0, 16)];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 2 * Math.PI + 0.4; snow.push(lump(0.07 + hash(41, i) * 0.04, 40 + i, 1.4, 0.7, 1).move(0.17 * Math.cos(a), 0.02, 0.17 * Math.sin(a))); }
    parts.push({ mat: "ice-grey", solid: union(...frozen), overlap: true }, { mat: "snow", solid: union(...snow), overlap: true });
  }
  return parts;
}

function woodPump(): Part[] {
  const R = 0.15, ring14: [number, number][] = [];
  // fourteen boards round it, each a little proud or sunk, a V where two meet
  for (let i = 0; i < 14; i++) for (const [f, k] of [[0, -0.005], [0.12, 0], [0.88, 0]]) { const a = ((i + f) / 14) * 2 * Math.PI, r = R + k + (f ? (hash(7, i) - 0.5) * 0.006 : 0); ring14.push([r * Math.cos(a), r * Math.sin(a)]); }
  const band = (y: number) => lathe([[0, y], [R + 0.006, y], [R + 0.006, y + 0.04], [0, y + 0.04]], 0, 0, 0, 20);
  const iron: Solid[] = [band(0.06), band(1.12), lathe([[0, 1.27], [0.06, 1.27], [0.06, 1.3], [0.045, 1.31], [0.07, 1.36], [0.075, 1.39], [0.05, 1.43], [0.025, 1.45], [0.025, 1.47], [0.04, 1.48], [0.028, 1.5], [0.01, 1.58], [0, 1.6]], 0, 0, 0, 16)];
  // the straps down the lever's side that hold its fork, bolted through the boards
  for (const z of [-0.035, 0.035]) { iron.push(box(0.012, 0.36, 0.045, R + 0.004, 0.74, z)); for (const y of [0.8, 0.92, 1.04]) iron.push(ball(0.011).move(R + 0.012, y, z)); }
  iron.push(...lever(R + 0.01, 1.03, 0.3));
  // the long outlet pipe through the boards, bent down at its end
  iron.push(...tube([[0, 0.72, 0.12], [0, 0.72, 0.4], [0, 0.71, 0.43], [0, 0.68, 0.445], [0, 0.64, 0.447]], 0.017), lathe([[0, 0], [0.04, 0], [0.04, 0.012], [0, 0.012]], 0, 0, 0, 12).rotate(90, 0, 0).move(0, 0.72, R + 0.012));
  const wood = [along(ring14, 0, 1.22).rotate(-90, 0, 0), lathe([[0, 1.22], [0.2, 1.22], [0.205, 1.24], [0.19, 1.272], [0, 1.272]], 0, 0, 0, 20)];
  return [{ mat: "wood-weathered", solid: union(...wood) }, { mat: "iron-cast", solid: union(...iron), overlap: true }];
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: [...YARD, "court-pump"], size, place: "floor", tris, parts: f });
P("court-pump", [0.72, 1.57, 1.0], 6000, () => ironPump(false));
P("court-pump-ice", [0.9, 1.57, 1.0], 7000, () => ironPump(true));
P("court-pump-wood", [0.72, 1.6, 0.8], 2600, woodPump);

/** Washing posts and lines: two T-posts 5 m apart with two lines between, the washing on them frozen stiff. */
prop({
  id: "washing-posts", items: [...YARD, "drying-line"], size: [5.2, 2.3, 1.0], place: "floor", tris: 20000,
  parts: () => {
    const span = 4.9, posts = [-span / 2, span / 2].flatMap((x) => [box(0.1, 2.25, 0.1, x, 0, 0), box(0.08, 0.08, 0.95, x, 2.1, 0)]);
    const a = washing(span - 0.1, 21), b = washing(span - 0.1, 37);
    const out = [{ mat: "wood-grey", solid: union(...posts) }] as { mat: string; solid: ReturnType<typeof union>; overlap?: boolean }[];
    for (const [s, z] of [[a, -0.38], [b, 0.38]] as const)
      for (const [k, mat] of [["line", "linen-grey"], ["white", "linen"], ["grey", "linen-grey"], ["blue", "check-blue"], ["pegs", "wood-soft"]] as const) {
        const g = s[k];
        if (g) out.push({ mat, solid: g.move(0, 2.12, z), overlap: true });
      }
    return out;
  },
});

/** washing-posts for the city's thousands of courts (the instanced glb, tools/interiors/yardglb.sh): the same posts and
 *  lines, the washing as flat stiff pieces (frozen, they hang as boards), about 1,000 triangles. The hero court keeps
 *  the cloth. */
prop({
  id: "washing-posts-far", items: [...YARD, "drying-line"], size: [5.2, 2.3, 1.0], place: "floor", tris: 1200,
  parts: () => {
    const span = 4.9, posts = [-span / 2, span / 2].flatMap((x) => [box(0.1, 2.25, 0.1, x, 0, 0), box(0.08, 0.08, 0.95, x, 2.1, 0)]);
    const pieces = (z: number, seed: number) => {
      const white: ReturnType<typeof box>[] = [], grey: ReturnType<typeof box>[] = [];
      for (let x = -span / 2 + 0.3, i = 0; x < span / 2 - 0.5; i++) {
        const w = 0.32 + hash(seed, i) * 0.5, h = 0.45 + hash(seed, i, 1) * 0.4;
        (hash(seed, i, 3) < 0.7 ? white : grey).push(box(w, h, 0.01, x + w / 2, 2.1 - h, z).rotate(0, 0, (hash(seed, i, 4) - 0.5) * 4));
        x += w + 0.08 + hash(seed, i, 2) * 0.2;
      }
      return { white, grey };
    };
    const a = pieces(-0.38, 21), b = pieces(0.38, 37);
    return [
      { mat: "wood-grey", solid: union(...posts) },
      { mat: "linen-grey", solid: union(rodX(0.004, span, 0, 2.12, -0.38), rodX(0.004, span, 0, 2.12, 0.38)), overlap: true },
      { mat: "linen", solid: union(...a.white, ...b.white), overlap: true },
      { mat: "linen-grey", solid: union(...a.grey, ...b.grey), overlap: true },
    ];
  },
});

/** The barrel organ on its cart (Leierkasten): the organ chest with its painted front and a row of pipes behind
 *  fretwork, the crank at the right side, on a two-wheeled cart with handles; a cloth over the top against the cold.
 *  The man is raea-bf's, at the crank's side. */
prop({
  id: "barrel-organ", items: [...YARD, "barrel-organ"], size: [1.4, 1.3, 0.9], place: "floor", tris: 4500,
  parts: () => {
    const R = 0.36, wheel = (x: number) => union(
      ring(R, 0.025, 28, 6).rotate(0, 90, 0).move(x, R, 0),
      ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return bar([x, R, 0], [x, R + Math.sin(a) * (R - 0.02), Math.cos(a) * (R - 0.02)], 0.009); }),
      rodX(0.04, 0.08, x, R, 0),
    );
    const pipes = Array.from({ length: 9 }, (_, i) => post(0.018, 0.22 + 0.06 * (4 - Math.abs(i - 4)) / 4, -0.32 + i * 0.08, 0.86, 0.3));
    return [
      { mat: "iron", solid: union(wheel(-0.5), wheel(0.5), rodX(0.02, 1.1, 0, R, 0), bar([-0.42, 0.55, -0.3], [-0.42, 0.62, -0.85], 0.018), bar([0.42, 0.55, -0.3], [0.42, 0.62, -0.85], 0.018)) },
      { mat: "wood-dark", solid: union(box(0.95, 0.06, 0.62, 0, 0.5, 0), box(0.9, 0.62, 0.5, 0, 0.56, 0)) },
      { mat: "paint-red", solid: box(0.84, 0.5, 0.01, 0, 0.6, 0.252), overlap: true },
      { mat: "brass", solid: union(...pipes, ring(0.06, 0.008, 12, 4).rotate(0, 90, 0).move(0.47, 0.88, 0), rodX(0.012, 0.16, 0.53, 0.88, 0), bar([0.6, 0.88, 0], [0.6, 0.82, 0.12], 0.01)), overlap: true },
      { mat: "cloth-brown", solid: sdf.box(0.98, 0.07, 0.56, 0.03).move(0, 1.2, 0).solid(0.03).simplify(0.01), overlap: true },
      { mat: "snow", solid: box(0.7, 0.02, 0.4, 0, 1.23, 0), overlap: true },
    ];
  },
});

/** A handcart (Handwagen): a plank bed with low sides on two big wheels, the drawbar down in the snow. */
prop({
  id: "handcart", items: [...YARD, "handcart"], size: [1.1, 0.75, 2.2], place: "floor", tris: 1800,
  parts: () => {
    const R = 0.42, wheel = (x: number) => union(
      ring(R, 0.03, 28, 6).rotate(0, 90, 0).move(x, R, 0.1),
      ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return bar([x, R, 0.1], [x, R + Math.sin(a) * (R - 0.02), 0.1 + Math.cos(a) * (R - 0.02)], 0.014); }),
    );
    // tipped forward on its drawbar: the bed tilts down toward the front
    const bed = union(box(0.9, 0.04, 1.5, 0, 0, 0), box(0.04, 0.22, 1.5, -0.45, 0, 0), box(0.04, 0.22, 1.5, 0.45, 0, 0), box(0.9, 0.22, 0.04, 0, 0, -0.75)).rotate(-9, 0, 0).move(0, 0.6, 0.1);
    return [
      { mat: "wood-grey", solid: union(bed, bar([0, 0.5, 0.86], [0, 0.03, 1.08], 0.03), rodX(0.03, 0.36, 0, 0.03, 1.08)) },
      { mat: "iron", solid: union(wheel(-0.52), wheel(0.52), rodX(0.022, 1.1, 0, R, 0.1)), overlap: true },
      { mat: "snow", solid: box(0.82, 0.04, 1.4, 0, 0, 0).rotate(-9, 0, 0).move(0, 0.64, 0.1), overlap: true },
    ];
  },
});

/** Coal sacks against a wall: three jute sacks of briquettes, one slumped open, a few briquettes spilt. */
prop({
  id: "coal-sacks", items: [...YARD, "coal-sack"], size: [1.4, 0.75, 0.6], place: "floor", tris: 4000,
  parts: () => {
    const sack = (x: number, z: number, h: number, k: number) => sdf.smoothUnion(0.08, sdf.ellipsoid(0.22, h * 0.36, 0.18).move(x, h * 0.42, z), sdf.ellipsoid(0.24, 0.12, 0.2).move(x, 0.12, z), sdf.capsule([x, h * 0.7, z], [x + 0.02 * k, h * 0.92, z], 0.05));
    const bricks = Array.from({ length: 7 }, (_, i) => lump(0.04, 70 + i, 1.6, 0.6, 1).move(0.35 + hash(i, 1) * 0.3, 0.025, 0.12 + hash(i, 2) * 0.2));
    return [
      { mat: "jute", solid: sdf.smoothUnion(0.02, sack(-0.45, 0, 0.75, 1), sack(0.0, -0.04, 0.7, -1)).solid(0.035).simplify(0.008) },
      { mat: "jute", solid: sdf.smoothUnion(0.1, sdf.ellipsoid(0.27, 0.15, 0.22).move(0.42, 0.15, 0.05), sdf.ellipsoid(0.15, 0.1, 0.13).move(0.48, 0.27, 0.02)).solid(0.035).simplify(0.008), overlap: true },
      { mat: "briquette", solid: union(...bricks), overlap: true },
      { mat: "snow", solid: box(0.5, 0.025, 0.3, -0.45, 0.72, 0), overlap: true },
    ];
  },
});

/** Snow shovelled to a wall: a bank 3 m long, half a metre high, grey along its foot. */
prop({
  id: "snow-bank", items: [...YARD, "snow-bank"], size: [3.0, 0.55, 0.9], place: "floor", tris: 1500,
  parts: () => [
    { mat: "snow", solid: sdf.smoothUnion(0.25, ...[-1.0, -0.2, 0.6, 1.15].map((x, i) => sdf.ellipsoid(0.55 + 0.15 * hash(i, 3), 0.3 + 0.2 * hash(i, 4), 0.38).move(x, 0.05, -0.05 * i))).solid(0.06).simplify(0.015) },
  ],
});

/** One casement leaf of a court window (the window that opens): frame, two panes, the hinge at its left edge (x = 0), so
 *  a yaw about it opens the leaf. 0.52 x 1.55 m, as the court's 1.05 m windows hang two. */
prop({
  id: "casement-leaf", items: [...YARD, "casement"], size: [0.52, 1.55, 0.05], place: "hung", tris: 200,
  parts: () => [
    { mat: "paint-white", solid: union(box(0.05, 1.55, 0.05, 0.025, 0, 0), box(0.05, 1.55, 0.05, 0.495, 0, 0), box(0.52, 0.05, 0.05, 0.26, 0, 0), box(0.52, 0.05, 0.05, 0.26, 1.5, 0), box(0.44, 0.035, 0.04, 0.26, 0.92, 0)) },
    { mat: "glass", solid: union(box(0.42, 0.85, 0.006, 0.26, 0.05, 0), box(0.42, 0.56, 0.006, 0.26, 0.94, 0)), overlap: true },
  ],
});

/** The cellar's neck (Kellerhals): a low brick surround against the wall and two sloping board doors, snow on them. */
prop({
  id: "cellar-neck", items: [...YARD, "cellar-hatch"], size: [1.3, 0.75, 1.5], place: "wall", tris: 400,
  parts: () => {
    const doors = box(1.1, 0.04, 1.45, 0, 0, 0).rotate(-22, 0, 0).move(0, 0.42, 0.05);
    return [
      { mat: "brick", solid: union(box(0.12, 0.7, 1.4, -0.59, 0, 0), box(0.12, 0.7, 1.4, 0.59, 0, 0), box(1.3, 0.18, 0.12, 0, 0, 0.69)) },
      { mat: "wood-grey", solid: doors, overlap: true },
      { mat: "iron", solid: union(box(0.03, 0.03, 1.3, 0, 0, 0).rotate(-22, 0, 0).move(0, 0.47, 0.05), box(0.12, 0.02, 0.04, 0.18, 0, 0).move(0, 0.2, 0.62)), overlap: true },
      { mat: "snow", solid: box(1.0, 0.03, 1.3, 0, 0, 0).rotate(-22, 0, 0).move(0, 0.47, 0.05), overlap: true },
    ];
  },
});

export const KIT_YARD = true;
