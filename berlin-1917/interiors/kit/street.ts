// Street kit: the outdoor pieces the city shots call for (the director's notes on storyboard v6, all on 20 December
// 1917): the newsboy on his box and a delivery bicycle at a Litfaß column on Leipziger Straße, a removal hoisting a
// wardrobe up a second court's wall, the railings and benches at the Viktoriapark's foot where children sledge. The
// research behind each is in research/catalogue/outdoor.ts (bicycle, bench, garden-railing, newspaper-seller,
// furniture-hoist).
// Each piece stands on the ground at its origin, its front to +z (the bicycle's length runs along x, its front wheel at
// +x); the hoist's frame is the window's (HOIST below). The world lane mounts them like compositions/shot49-door.tsx's
// Moving: get(id).parts at a Transform.
import { manifold, type Solid } from "raea/3d";
import { ball, box, lathe, plate, post, rbox, ring, taper, union, zcyl } from "./geo";
import { type Part, prop } from "./prop";

type V = [number, number, number];

/** A round bar of radius r from a to b. */
const tube = (a: V, b: V, r: number): Solid => {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  return zcyl(r, L)
    .rotate((-Math.asin(d[1] / L) * 180) / Math.PI, 0, 0)
    .rotate(0, (Math.atan2(d[0], d[2]) * 180) / Math.PI, 0)
    .move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
};
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ── the delivery bicycle ────────────────────────────────────────────────────────────────────────────────────────────

/** A black roadster of the 1910s (28-inch wheels, a diamond frame, bars swept back to the rider, a sprung leather
 *  saddle) made a delivery bicycle by a carrier over the front wheel with a wicker basket of parcels. Its tyres are the
 *  war's: rubber was requisitioned in 1916, so the wheels run on Ersatz tyres, here hardwood blocks on a steel band.
 *  A carbide lamp under the carrier, a bell on the bars. Upright; lean it on a wall or kerb by turning it about x. */
prop({
  id: "bicycle", items: ["bicycle"], size: [1.9, 1.08, 0.6], place: "floor", tris: 9000,
  parts: () => {
    const Y = 0.36, R: V = [-0.56, Y, 0], F: V = [0.56, Y, 0], BB: V = [-0.08, 0.28, 0];
    const ST: V = [-0.24, 0.84, 0], HT: V = [0.4, 0.86, 0], HB: V = [0.45, 0.7, 0];
    const frame: Solid[] = [
      tube(ST, HT, 0.014), tube(BB, HB, 0.016), tube(BB, ST, 0.014), tube(HT, HB, 0.019),
      ...[-1, 1].flatMap((s) => [
        tube([BB[0], BB[1], s * 0.04], [R[0], R[1], s * 0.065], 0.009),
        tube([ST[0], ST[1] - 0.02, s * 0.03], [R[0], R[1], s * 0.065], 0.008),
        tube([HB[0] + 0.01, HB[1] - 0.03, s * 0.05], [F[0], F[1], s * 0.05], 0.011),
      ]),
      tube(HT, [0.38, 1.0, 0], 0.012),
    ];
    const wheel = (A: V) => {
      const spokes: Solid[] = [], blocks: Solid[] = [];
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * Math.PI * 2, b = a + (k % 2 ? 0.25 : -0.25);
        spokes.push(tube([A[0] + 0.025 * Math.cos(a), A[1] + 0.025 * Math.sin(a), k % 2 ? 0.035 : -0.035], [A[0] + 0.325 * Math.cos(b), A[1] + 0.325 * Math.sin(b), 0], 0.0022));
      }
      for (let k = 0; k < 22; k++) {
        const a = (k / 22) * 360;
        blocks.push(box(0.085, 0.022, 0.034, 0, -0.011, 0).move(0, 0.349, 0).rotate(0, 0, a).move(A[0], A[1], A[2]));
      }
      return { steel: union(ring(0.33, 0.011, 48, 6).move(...A), zcyl(0.025, 0.1).move(...A), ...spokes), band: ring(0.338, 0.006, 48, 4).move(...A), blocks: union(...blocks) };
    };
    const rw = wheel(R), fw = wheel(F);
    // mudguards: the upper halves of a wide ring over each wheel
    const guard = (A: V) => ring(0.385, 0.028, 48, 6).scale(1, 1, 1.7).intersect(box(1, 0.5, 0.2, 0, 0.02, 0)).move(...A);
    // drive: the chainring and cranks at the bottom bracket, the chain to the rear sprocket
    const drive = union(
      ring(0.095, 0.008, 32, 4).move(BB[0], BB[1], 0.055), ring(0.035, 0.006, 16, 4).move(R[0], R[1], 0.055),
      tube(add(BB, [0, 0.095, 0.055]), add(R, [0, 0.035, 0.055]), 0.005), tube(add(BB, [0, -0.095, 0.055]), add(R, [0, -0.035, 0.055]), 0.005),
      tube(add(BB, [0, 0, 0.07]), add(BB, [0.08, -0.15, 0.07]), 0.011), tube(add(BB, [0, 0, -0.07]), add(BB, [-0.08, 0.15, -0.07]), 0.011),
    );
    const pedals = union(rbox(0.1, 0.022, 0.07, 0.006, BB[0] + 0.08, BB[1] - 0.161, 0.12), rbox(0.1, 0.022, 0.07, 0.006, BB[0] - 0.08, BB[1] + 0.139, -0.12));
    // bars swept back, cork grips, the bell
    const bars = union(tube([0.38, 1.0, -0.27], [0.38, 1.0, 0.27], 0.011), ...[-1, 1].map((s) => tube([0.38, 1.0, s * 0.27], [0.24, 0.98, s * 0.29], 0.011)));
    const grips = union(...[-1, 1].map((s) => tube([0.24, 0.98, s * 0.29], [0.13, 0.97, s * 0.29], 0.017)));
    // the sprung saddle on its pin
    const saddle = union(rbox(0.13, 0.05, 0.19, 0.02, -0.33, 0.965, 0), rbox(0.17, 0.04, 0.07, 0.015, -0.2, 0.975, 0));
    const springs = union(tube(ST, [-0.27, 0.94, 0], 0.011), ...[-1, 1].map((s) => post(0.016, 0.05, -0.36, 0.915, s * 0.06)));
    // the carrier over the front wheel, its struts to the fork ends, the basket of parcels on it
    const carrier = union(
      box(0.42, 0.015, 0.36, 0.68, 0.8, 0), tube([0.47, 0.81, 0], HB, 0.01),
      ...[-1, 1].map((s) => tube([0.78, 0.8, s * 0.17], [F[0] + 0.01, F[1], s * 0.06], 0.008)),
    );
    const basket = rbox(0.44, 0.27, 0.38, 0.03, 0.68, 0.815, 0).minus(box(0.4, 0.3, 0.34, 0.68, 0.84, 0));
    const parcels = union(box(0.2, 0.14, 0.16, 0.62, 0.83, -0.07), box(0.16, 0.2, 0.12, 0.76, 0.83, 0.08), box(0.14, 0.09, 0.2, 0.62, 0.97, 0.05));
    return [
      { mat: "enamel-black" as const, solid: union(...frame, guard(R), guard(F)) },
      { mat: "steel-bright" as const, solid: union(rw.steel, fw.steel, drive, bars, springs), overlap: true },
      { mat: "iron" as const, solid: union(rw.band, fw.band, pedals, carrier), overlap: true },
      { mat: "wood-raw" as const, solid: union(rw.blocks, fw.blocks), overlap: true },
      { mat: "leather" as const, solid: saddle, overlap: true },
      { mat: "wood-mid" as const, solid: grips, overlap: true },
      { mat: "straw" as const, solid: basket, overlap: true },
      { mat: "paper" as const, solid: parcels, overlap: true },
      { mat: "brass" as const, solid: union(ball(0.025).move(0.37, 1.03, 0.14), post(0.035, 0.09, 0.53, 0.6, 0)), overlap: true },
      { mat: "glass" as const, solid: zcyl(0.028, 0.01).rotate(0, 90, 0).move(0.568, 0.645, 0), overlap: true },
    ];
  },
});

// ── the park: bench and railing ─────────────────────────────────────────────────────────────────────────────────────

/** A park bench of the city's gardens: two cast-iron ends (a front leg, a raked back leg, the arm with its scroll)
 *  carrying four seat slats and three back slats painted the parks' green. `park-bench-snow` has the December snow
 *  lying on its seat, its back rail and its arms. */
const bench = (snow: boolean) => () => {
  const ends: Solid[] = [];
  for (const x of [-0.86, 0.86])
    ends.push(
      tube([x, 0, 0.24], [x, 0.44, 0.25], 0.022), tube([x, 0, -0.18], [x, 0.86, -0.32], 0.022), tube([x, 0.44, 0.27], [x, 0.42, -0.22], 0.018),
      tube([x, 0.62, -0.26], [x, 0.63, 0.27], 0.017), tube([x, 0.44, 0.26], [x, 0.63, 0.27], 0.016),
      ring(0.05, 0.011, 16, 4).rotate(0, 90, 0).move(x, 0.66, 0.27),
    );
  const seat = [0.2, 0.09, -0.02, -0.13].map((z) => box(1.86, 0.035, 0.085, 0, 0.44, z));
  const back = [0.56, 0.68, 0.8].map((y) => box(1.86, 0.08, 0.03, 0, -0.04, 0).rotate(-15, 0, 0).move(0, y, -0.2 - ((y - 0.42) * 0.12) / 0.44 - 0.015));
  const parts: Part[] = [
    { mat: "enamel-black" as const, solid: union(...ends) },
    { mat: "paint-green" as const, solid: union(...seat, ...back) },
  ];
  if (snow)
    parts.push({ mat: "snow" as const, solid: union(rbox(1.8, 0.05, 0.4, 0.02, 0, 0.465, 0.035), rbox(1.8, 0.035, 0.07, 0.015, 0, 0.84, -0.33), ...[-0.86, 0.86].map((x) => rbox(0.07, 0.03, 0.5, 0.012, x, 0.64, 0.01))), overlap: true });
  return parts;
};
prop({ id: "park-bench", items: ["bench"], size: [1.9, 0.9, 0.66], place: "floor", tris: 3000, parts: bench(false) });
prop({ id: "park-bench-snow", items: ["bench"], size: [1.9, 0.9, 0.66], place: "floor", tris: 3400, parts: bench(true) });

/** A 2.0 m section of a square garden's railing on its granite kerb: a post with its ball finial at the section's
 *  left end (-x, from -1.0 to -0.93), then fifteen spear-topped bars evenly between it and the next section's post, two
 *  rails and a band of rings that run on to that post's face at +1.0. Sections set every 2.0 m along x join into one
 *  railing (the director on a review note: the first cut's rails stopped 7 cm short of the next post); square-railing-end,
 *  set where the next section would go, closes the run with its last post. Painted black. */
const POST = [box(0.07, 1.26, 0.07, -0.965, 0.21, 0), box(0.1, 0.04, 0.1, -0.965, 1.47, 0), ball(0.045).move(-0.965, 1.54, 0)];
prop({
  id: "square-railing", items: ["garden-railing"], size: [2.0, 1.6, 0.32], place: "floor", tris: 5000,
  parts: () => {
    const p = 1.93 / 16, xs = Array.from({ length: 15 }, (_, i) => -0.93 + (i + 1) * p);
    return [
      { mat: "granite" as const, solid: box(2.0, 0.22, 0.32, 0, 0, 0) },
      { mat: "enamel-black" as const, overlap: true, solid: union(
        ...xs.map((x) => box(0.016, 1.09, 0.016, x, 0.21, 0)),
        ...xs.map((x) => taper(0.02, 0.001, 0.08, x, 1.3, 0)),
        // the rails reach 5 mm into the next post, so the join shows no gap
        box(1.935, 0.03, 0.014, 0.0375, 0.32, 0), box(1.935, 0.03, 0.014, 0.0375, 1.18, 0),
        ...Array.from({ length: 16 }, (_, i) => ring(0.045, 0.006, 12, 4).move(-0.93 + (i + 0.5) * p, 1.11, 0)),
        ...POST,
      ) },
    ];
  },
});
prop({
  id: "square-railing-end", items: ["garden-railing"], size: [0.12, 1.6, 0.32], place: "floor", tris: 400,
  parts: () => [
    { mat: "granite" as const, solid: box(0.12, 0.22, 0.32, -0.94, 0, 0) },
    { mat: "enamel-black" as const, overlap: true, solid: union(...POST) },
  ],
});

// ── the newsboy's box ───────────────────────────────────────────────────────────────────────────────────────────────

/** What the newsboy stands on at the column: an upturned packing crate of rough boards, the tied bundle of the
 *  edition on the pavement beside it, and the Extrablatt pasted on a board leaning on the crate's end (its headline
 *  as black bars; the lettering is the world lane's). The boy and his papers are the people lane's. */
prop({
  id: "newsboy-box", items: ["newspaper-seller"], size: [1.12, 0.65, 0.42], place: "floor", tris: 1500,
  parts: () => {
    // boards of 9 cm with finger gaps on the long sides, solid ends, and the corner cleats nailed over them
    const crate = union(
      ...[-0.13, 0, 0.13].map((z) => box(0.56, 0.022, 0.12, 0, 0.378, z)),
      ...[-1, 1].flatMap((s) => [0.0, 0.095, 0.19, 0.285].map((y) => box(0.52, 0.088, 0.02, 0, y, s * 0.19))),
      ...[-1, 1].map((s) => box(0.02, 0.4, 0.4, s * 0.27, 0, 0)),
      ...[-1, 1].flatMap((s) => [-1, 1].map((t) => box(0.045, 0.4, 0.022, s * 0.235, 0, t * 0.205))),
    );
    const bundle = box(0.32, 0.17, 0.24, 0.5, 0, 0.03);
    const strings = union(...[0.44, 0.56].map((x) => union(box(0.008, 0.004, 0.245, x, 0.17, 0.03), box(0.008, 0.172, 0.004, x, 0, 0.152), box(0.008, 0.172, 0.004, x, 0, -0.092))));
    // the placard: built upright in its own frame (its face to -x), then leant 15 degrees onto the crate's end
    const lean = (s: Solid) => s.rotate(0, 0, -15).move(-0.46, 0, 0);
    const lines = [0.08, 0.12, 0.16, 0.2, 0.24, 0.28].map((y) => box(0.003, 0.012, 0.32, -0.011, y, 0));
    return [
      { mat: "wood-raw" as const, solid: crate },
      { mat: "paper" as const, solid: union(bundle, lean(box(0.003, 0.56, 0.4, -0.009, 0.03, 0))), overlap: true },
      { mat: "jute" as const, solid: strings, overlap: true },
      { mat: "card" as const, solid: lean(box(0.015, 0.62, 0.45, 0, 0, 0)), overlap: true },
      { mat: "cloth-black" as const, solid: lean(union(box(0.003, 0.06, 0.36, -0.011, 0.46, 0), box(0.003, 0.05, 0.3, -0.011, 0.37, 0), ...lines)), overlap: true },
    ];
  },
});

// ── the children's sledge and the removal men's handcart ───────────────────────────────────────────────────────────

/** A child's wooden sledge (Rodelschlitten, the Davos kind): two ash runners curling up at the front, shod with iron,
 *  four slats on two pairs of legs, and the pull cord tied to the front cross bar. Its length along x, the front +x. */
prop({
  id: "rodel", items: ["sledge"], size: [0.95, 0.3, 0.4], place: "floor", tris: 2200,
  parts: () => {
    const curve: V[] = [[-0.44, 0.03, 0], [0.2, 0.03, 0], [0.32, 0.05, 0], [0.4, 0.1, 0], [0.44, 0.17, 0], [0.43, 0.23, 0], [0.38, 0.26, 0]];
    const runner = (z: number, r: number, dy = 0) => union(...curve.slice(1).map((p, i) => tube([curve[i][0], curve[i][1] + dy, z], [p[0], p[1] + dy, z], r)));
    const wood = union(
      ...[-0.15, 0.15].flatMap((z) => [runner(z, 0.018), ...[-0.3, 0.12].map((x) => tube([x, 0.04, z], [x, 0.24, z], 0.014))]),
      ...[-0.3, 0.12].map((x) => box(0.04, 0.025, 0.34, x, 0.24, 0)),
      ...[-0.11, -0.04, 0.03, 0.1].map((z) => box(0.62, 0.018, 0.055, -0.08, 0.265, z)),
      tube([0.38, 0.26, -0.15], [0.38, 0.26, 0.15], 0.014),
    );
    return [
      { mat: "wood-mid" as const, solid: wood },
      { mat: "iron" as const, overlap: true, solid: union(...[-0.15, 0.15].map((z) => runner(z, 0.01, -0.012))) },
      // the cord: tied at the front bar, lying back over the slats and off the side onto the snow
      { mat: "jute" as const, overlap: true, solid: union(tube([0.38, 0.26, 0], [0.1, 0.29, 0.02], 0.005), tube([0.1, 0.29, 0.02], [-0.1, 0.285, 0.14], 0.005), tube([-0.1, 0.285, 0.14], [-0.2, 0.01, 0.24], 0.005)) },
    ];
  },
});

/** The removal men's two-wheeled handcart (Handkarre): spoked wooden wheels with iron tyres, a plank bed with low
 *  side boards, two shafts forward joined by a pull bar, a stand leg under the bed's front so it stands level.
 *  `removal-cart-loaded` carries what goes up after the wardrobe: a chair upside down on a rolled mattress, a bundle of
 *  bedding tied in a sheet and a basket of crockery. Its length along x, the shafts at +x. */
const handcart = (loaded: boolean) => (): Part[] => {
  const A: V = [-0.25, 0.45, 0];
  const wheel = (z: number) => {
    const spokes = Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return tube([A[0] + 0.07 * Math.cos(a), A[1] + 0.07 * Math.sin(a), z], [A[0] + 0.4 * Math.cos(a), A[1] + 0.4 * Math.sin(a), z], 0.016); });
    return { wood: union(ring(0.41, 0.03, 40, 6).scale(1, 1, 1.4).move(A[0], A[1], z), zcyl(0.07, 0.16).move(A[0], A[1], z), ...spokes), tyre: ring(0.445, 0.012, 40, 4).scale(1, 1, 2.6).move(A[0], A[1], z) };
  };
  const wl = wheel(-0.52), wr = wheel(0.52);
  const bed = union(
    box(1.5, 0.04, 0.86, -0.1, 0.6, 0), ...[-1, 1].map((s) => box(1.5, 0.14, 0.03, -0.1, 0.64, s * 0.43)), box(0.03, 0.14, 0.86, -0.835, 0.64, 0),
    ...[-1, 1].map((s) => tube([0.62, 0.62, s * 0.36], [1.75, 0.66, s * 0.3], 0.025)), tube([1.68, 0.66, -0.3], [1.68, 0.66, 0.3], 0.02),
    box(0.06, 0.6, 0.06, 0.55, 0, 0),
  );
  const parts: Part[] = [
    { mat: "wood-grey", solid: union(bed, wl.wood, wr.wood) },
    { mat: "iron", overlap: true, solid: union(wl.tyre, wr.tyre, tube([A[0], A[1], -0.5], [A[0], A[1], 0.5], 0.022)) },
  ];
  if (loaded) {
    // a kitchen chair standing on the bed, its back to the side board
    const chair = union(box(0.42, 0.03, 0.42, 0, 0.42, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => tube([sx * 0.18, 0, sz * 0.18], [sx * 0.19, 0.42, sz * 0.19], 0.016))), box(0.42, 0.45, 0.03, 0, 0.45, 0.2));
    parts.push(
      // the rolled mattress in its ticking along one side, the basket of crockery on it, the bedding tied in a sheet
      { mat: "check-blue", overlap: true, solid: tube([-0.8, 0.81, -0.2], [0.45, 0.81, -0.2], 0.17) },
      { mat: "wood-mid", overlap: true, solid: chair.move(-0.45, 0.64, 0.2) },
      { mat: "linen", overlap: true, solid: rbox(0.5, 0.36, 0.4, 0.12, 0.3, 0.64, 0.2) },
      { mat: "straw", overlap: true, solid: rbox(0.4, 0.2, 0.3, 0.04, 0.0, 0.96, -0.2) },
      { mat: "stoneware", overlap: true, solid: union(post(0.06, 0.12, -0.06, 1.1, -0.24), post(0.05, 0.1, 0.08, 1.1, -0.15)) },
      { mat: "jute", overlap: true, solid: union(...[-0.5, 0.25].map((x) => ring(0.18, 0.008, 24, 4).rotate(0, 90, 0).move(x, 0.81, -0.2))) },
    );
  }
  return parts;
};
prop({ id: "removal-cart", items: ["handcart"], size: [2.65, 0.9, 1.2], place: "floor", tris: 5000, parts: handcart(false) });
prop({ id: "removal-cart-loaded", items: ["handcart"], size: [2.65, 1.5, 1.2], place: "floor", tris: 8000, parts: handcart(true) });

// ── the removal hoist ───────────────────────────────────────────────────────────────────────────────────────────────

/** The hoist's frame: origin at the window's sill middle on the facade's outer face, x along the wall, y up, z out from
 *  the wall. The beam lies through the window under its head (a flat's window, 1.55 m), braced inside, and the block
 *  hangs from its end. The rope runs over the sheave: the load's fall leaves it at `loadFall` and the hauling fall at
 *  `haulFall`, both going down. Draw each fall with `hoist-rope` (1 m, hanging down from its origin) scaled in y to its
 *  length; hang `furniture-hoist-load` by its ring (its origin) at the load fall's lower end. */
export const HOIST = { head: 1.55, sheave: [0, 1.1, 1.42] as V, loadFall: [0, 1.1, 1.34] as V, haulFall: [0, 1.1, 1.5] as V };

/** The gallows beam and its block: a squared timber out through the window with an iron strap and eye at its end, the
 *  block (an elm shell bound in iron, a sheave in it) hung on its hook. */
prop({
  id: "furniture-hoist", items: ["furniture-hoist"], size: [0.2, 1.6, 2.1], place: "hung", tris: 1500,
  parts: () => {
    const [, sy, sz] = HOIST.sheave;
    return [
      { mat: "wood-raw" as const, solid: box(0.14, 0.16, 2.1, 0, HOIST.head - 0.17, 0.45) },
      { mat: "iron" as const, overlap: true, solid: union(
        box(0.16, 0.18, 0.05, 0, HOIST.head - 0.18, 1.42), tube([0, HOIST.head - 0.18, sz], [0, sy + 0.16, sz], 0.009),
        box(0.08, 0.32, 0.024, 0, sy - 0.13, sz), ring(0.08, 0.008, 24, 4).rotate(0, 90, 0).move(0, sy, sz),
      ) },
      { mat: "wood-mid" as const, overlap: true, solid: union(...[-1, 1].map((s) => rbox(0.022, 0.28, 0.22, 0.02, s * 0.03, sy - 0.12, sz))) },
      // the rope over the sheave, down to where the falls leave it
      { mat: "jute" as const, overlap: true, solid: ring(0.08, 0.011, 24, 4).rotate(0, 90, 0).intersect(box(0.1, 0.1, 0.2, 0, 0, 0)).move(0, sy, sz) },
    ];
  },
});

/** One metre of the hoist's hemp rope, hanging down from its origin: scale it in y to a fall's length. */
prop({ id: "hoist-rope", items: ["furniture-hoist"], size: [0.03, 1.0, 0.03], place: "hung", tris: 60, parts: () => [{ mat: "jute" as const, solid: tube([0, 0, 0], [0, -1, 0], 0.011) }] });

/** The load going up: a wardrobe upright in two rope slings, a mover's grey blanket tied over its cornice, hung from the
 *  slings' ring (its origin), the wardrobe's top 0.62 m below it and its foot 2.57 m below. */
prop({
  id: "furniture-hoist-load", items: ["furniture-hoist"], size: [1.25, 2.62, 0.68], place: "hung", tris: 2500,
  parts: () => {
    const bot = -2.57, top = -0.62;
    const slings = union(
      ...[-0.4, 0.4].flatMap((x) => [
        tube([0, 0, 0], [x, top, 0.3], 0.01), tube([0, 0, 0], [x, top, -0.3], 0.01),
        tube([x, top, 0.3], [x, bot - 0.01, 0.3], 0.01), tube([x, top, -0.3], [x, bot - 0.01, -0.3], 0.01),
        tube([x, bot - 0.01, 0.3], [x, bot - 0.01, -0.3], 0.01),
      ]),
    );
    return [
      { mat: "wood-dark" as const, solid: union(box(1.1, 1.75, 0.55, 0, bot, 0), box(1.16, 0.1, 0.6, 0, bot, 0), box(1.2, 0.12, 0.62, 0, bot + 1.75, 0), box(0.9, 0.08, 0.5, 0, top - 0.08, 0)) },
      { mat: "wood-mid" as const, overlap: true, solid: union(...[-1, 1].map((s) => box(0.5, 1.45, 0.012, s * 0.26, bot + 0.15, 0.278))) },
      { mat: "brass" as const, overlap: true, solid: box(0.02, 0.05, 0.01, 0.03, bot + 0.95, 0.287) },
      { mat: "wool" as const, overlap: true, solid: rbox(1.26, 0.34, 0.68, 0.05, 0, top - 0.36, 0) },
      { mat: "jute" as const, overlap: true, solid: union(slings, box(1.28, 0.02, 0.7, 0, top - 0.25, 0)) },
      { mat: "iron" as const, overlap: true, solid: ring(0.04, 0.009, 16, 4).rotate(0, 90, 0) },
    ];
  },
});

// ── the court's working parts, for first-person play (docs/first-person.feature FP10) ─────────────────────────────
// The house drain's inspection shaft under its cast-iron cover, the rear building's door on its hinges, a ground-floor
// window's stone ledge. Each moving part has its pivot at its origin, as kit/door.ts's shop door does, so play and a
// cutscene turn or lift it by its transform.

/** The manhole, as Hobrecht's Berlin standard (Die Canalisation von Berlin, 1884, Atlas Blatt 9; read in
 *  research/sewer-structures-1884.tsv): a round cast-iron lid 0.556 m across, HINGED (a printed hinge of 0.04), with a ring
 *  of curved air slots round two quarter-segments filled with end-grain wood, in a square ribbed cast-iron frame 0.716 m
 *  outside, 0.666 inside and 0.175 deep with a 0.025 flange, set flush in the paving; under it a neck 0.556 wide for about
 *  0.45 m, the brick (one brick, 0.25) corbelled out over about 0.8 m to the 0.95 m shaft; U-shaped iron steps
 *  (Steigeisen, a 0.028 bar) in the wall. ASSUMED: that a house drain's shaft in a court took the city's cover; the lid's
 *  thickness (0.03); the slot ring (12 slots on a 0.205 m circle); which quarters are wood (the two either side of the
 *  hinge line); the lid's ribs underneath; the steps' 0.30 m spacing and 0.24 x 0.15 m size (the plate's 0.15, 0.24 and
 *  0.38 aren't told apart); the 2.5 m depth to a cement bottom with the drain's half-round channel along x.
 *  It opens on its hinge: a hook's arrow tip into the air slot opposite the hinge (MANHOLE.slot), turned 90 degrees,
 *  the near edge lifted, the lid swung over to lie open on the paving (de.wikipedia "Schachthaken" for the hook;
 *  the one-hook swing is ASSUMED from the hinge). FP7's test is compositions/fp-manhole-v3.tsx.
 *  Origins: the frame's and the shaft's at the hole's centre on the paving's top; the cover's on its hinge pin
 *  (MANHOLE.hinge.at from the hole's centre), the lid running from it toward +z, so play turns it about its own x (a
 *  negative turn lifts the near edge) and `manhole-cover-open` is the same lid turned over onto the paving (Place has
 *  only a yaw). The steps are on the hinge side (-z): he steps in facing them. Cut a 0.7 x 0.7 m hatch in the floor
 *  (interiors/shell.ts `hatches`): the frame covers it. */
export const MANHOLE = {
  r: 0.278, lidT: 0.03, frame: 0.716, frameInside: 0.666, frameDepth: 0.175, open: 0.268, shaft: 0.475, depth: 2.5,
  hinge: { at: [0, 0.004, -0.278] as V, axis: [1, 0, 0] as V, open: (178 * Math.PI) / 180 },
  /** the hook's air slot, opposite the hinge, on the lid's top (from the hole's centre) */
  slot: [0, 0, 0.205] as V,
  slots: { ring: 0.205, n: 12 },
  rungs: Array.from({ length: 7 }, (_, k) => -0.32 - k * 0.3),
};
const MH = MANHOLE;
/** the lid in its hinge's frame (the pin at the origin, the lid toward +z), turned about x by -a */
function manholeLid(a: number): Part[] {
  const { r, lidT } = MH, mid: V = [0, -MH.hinge.at[1] - lidT / 2, r];
  const at = (s: Solid) => s.move(...mid).rotate((-a * 180) / Math.PI, 0, 0);
  const disc = zcyl(r, lidT).rotate(90, 0, 0);
  const slot = (c: number) => manifold.hull(...[-0.17, 0, 0.17].map((d) => zcyl(0.008, 0.1).rotate(90, 0, 0).move(MH.slots.ring * Math.sin(c + d), 0, MH.slots.ring * Math.cos(c + d))));
  const slots = union(...Array.from({ length: MH.slots.n }, (_, i) => slot((i * 2 * Math.PI) / MH.slots.n)));
  const pie = (a0: number, a1: number) => {
    const pts: [number, number][] = [[0, 0]];
    for (let i = 0; i <= 10; i++) { const u = a0 + ((a1 - a0) * i) / 10; pts.push([0.165 * Math.sin(u), -0.165 * Math.cos(u)]); }
    return plate(pts, 0.012).rotate(-90, 0, 0).move(0, lidT / 2 - 0.006 + 0.0004, 0);
  };
  const wood = union(pie(Math.PI / 4, (3 * Math.PI) / 4), pie((5 * Math.PI) / 4, (7 * Math.PI) / 4));
  // underneath: a ring rib and four spokes; at the hinge edge its lug
  const ribs = union(ring(0.2, 0.007, 32, 4).rotate(90, 0, 0).move(0, -lidT / 2 - 0.005, 0), ...[0, 1, 2, 3].map((k) => box(0.012, 0.012, 0.36, 0, -lidT / 2 - 0.012, 0).rotate(0, k * 45, 0)));
  const lug = box(0.07, 0.024, 0.04, 0, -0.012, -r + 0.008);
  return [
    { mat: "iron" as const, solid: at(union(disc, ribs, lug).minus(slots).minus(wood.move(0, 0.001, 0))) },
    { mat: "wood-grey" as const, solid: at(wood), overlap: true },
  ];
}
prop({
  id: "manhole-frame", items: ["manhole"], size: [MH.frame, MH.frameDepth, MH.frame], place: "floor", tris: 900,
  parts: () => {
    const top = box(MH.frame, 0.025, MH.frame, 0, -0.025, 0).minus(zcyl(MH.r + 0.004, 0.2).rotate(90, 0, 0));
    const skirt = box(MH.frame, MH.frameDepth, MH.frame, 0, -MH.frameDepth, 0).minus(box(MH.frameInside, 0.5, MH.frameInside, 0, -0.4, 0));
    // the seat the lid rests on, and the ribs from the seat out to the skirt's corners
    const seat = lathe([[MH.open, -MH.lidT - 0.016], [MH.frameInside / 2, -MH.lidT - 0.016], [MH.frameInside / 2, -MH.lidT - 0.004], [MH.open, -MH.lidT - 0.004]], 0, 0, 0, 40);
    const ribs = union(...[45, 135, 225, 315].map((d) => box(0.016, 0.12, 0.2, 0, -0.145, 0.38).rotate(0, d, 0)));
    const lug = box(0.12, 0.03, 0.03, 0, -0.022, MH.hinge.at[2] - 0.018);
    // set into the paving: its skirt passes through the court's floor round the hatch, as a frame in a street does
    return [{ mat: "iron-rust" as const, solid: union(top, skirt, seat, ribs, lug), overlap: true }];
  },
});
prop({ id: "manhole-cover", items: ["manhole"], size: [0.56, 0.06, 0.56], place: "floor", tris: 2600, parts: () => manholeLid(0) });
prop({ id: "manhole-cover-open", items: ["manhole"], size: [0.56, 0.06, 0.56], place: "floor", tris: 2600, parts: () => manholeLid(MH.hinge.open) });
prop({
  id: "manhole-shaft", items: ["manhole"], size: [1.45, MH.depth + 0.1, 1.45], place: "floor", tris: 2600,
  parts: () => {
    const D = MH.depth, w = 0.25, top = -MH.frameDepth, coneTop = -0.45, coneBot = -1.25;
    // the neck, the corbelled cone and the shaft, as one turned profile (inner face down, outer face up)
    const wall = lathe([[MH.r, top], [MH.r, coneTop], [MH.shaft, coneBot], [MH.shaft, -D], [MH.shaft + w, -D], [MH.shaft + w, coneBot], [MH.r + w, coneTop], [MH.r + w, top]], 0, 0, 0, 32);
    const bottom = zcyl(MH.shaft + w, 0.12).rotate(90, 0, 0).move(0, -D - 0.06, 0).minus(zcyl(0.1, 2.0).rotate(0, 90, 0).move(0, -D, 0));
    const rAt = (y: number) => (y > coneTop ? MH.r : y > coneBot ? MH.r + ((coneTop - y) / (coneTop - coneBot)) * (MH.shaft - MH.r) : MH.shaft);
    // Steigeisen on the hinge side (-z): two arms into the brick and the tread 0.15 out from the wall
    const rungs = union(...MH.rungs.map((y) => {
      const z = -rAt(y);
      return union(tube([-0.12, y, z - 0.04], [-0.12, y, z + 0.15], 0.014), tube([0.12, y, z - 0.04], [0.12, y, z + 0.15], 0.014), tube([-0.12, y, z + 0.15], [0.12, y, z + 0.15], 0.014));
    }));
    return [
      { mat: "brick" as const, solid: wall },
      { mat: "cement" as const, solid: bottom },
      { mat: "iron-rust" as const, solid: rungs, overlap: true },
    ];
  },
});

/** The rear building's door off the court (the way to its stair): a pine leaf painted brown, panelled below, glazed
 *  above behind a wrought grille, a lever each side. `court-door-leaf` has its origin on the hinge axis at the floor
 *  and runs +x to the latch, the court at +z; turn it about y to open (it opens inward, away from the court: a
 *  positive turn, as a Place's yaw). `court-door-surround` is the opening's plastered surround and its granite step, its origin at the
 *  opening's bottom middle on the wall's court face, z into the court. The opening is COURT_DOOR.w x COURT_DOOR.h. */
export const COURT_DOOR = { w: 1.05, h: 2.35, leaf: [1.02, 2.33] as [number, number], handle: [0.9, 1.05] as [number, number] };
prop({
  id: "court-door-leaf", items: ["court-door"], size: [1.02, 2.33, 0.12], place: "wall", where: "set", tris: 1600,
  parts: () => {
    const [W, H] = COURT_DOOR.leaf, m = W / 2;
    const light = box(W - 0.26, 0.82, 0.2, m, 1.32, 0);
    const leaf = box(W, H, 0.05, m, 0.01, 0).minus(light);
    const panels = union(...[0.16, 0.66].map((y) => box(W - 0.26, 0.4, 0.07, m, y, 0)));
    const grille = union(...[0.25, 0.42, 0.59, 0.76].map((x) => box(0.012, 0.82, 0.012, x, 1.32, 0.02)), box(W - 0.26, 0.012, 0.012, m, 1.72, 0.02));
    const levers = union(...[-1, 1].flatMap((s) => [box(0.04, 0.16, 0.008, COURT_DOOR.handle[0], 0.97, s * 0.03), box(0.012, 0.012, 0.06, COURT_DOOR.handle[0], 1.05, s * 0.05), box(0.12, 0.018, 0.018, COURT_DOOR.handle[0] - 0.06, 1.05, s * 0.08)]));
    return [
      { mat: "paint-brown" as const, solid: union(leaf, panels) },
      { mat: "glass-frost" as const, solid: box(W - 0.26, 0.82, 0.006, m, 1.32, 0), overlap: true },
      { mat: "iron" as const, solid: union(grille, levers), overlap: true },
    ];
  },
});
prop({
  id: "court-door-surround", items: ["court-door"], size: [1.5, 2.6, 0.4], place: "wall", where: "set", tris: 300,
  parts: () => {
    const { w, h } = COURT_DOOR;
    return [
      { mat: "lime-dirty" as const, solid: union(box(0.16, h + 0.16, 0.04, -w / 2 - 0.08, 0, 0.02), box(0.16, h + 0.16, 0.04, w / 2 + 0.08, 0, 0.02), box(w + 0.32, 0.16, 0.04, 0, h, 0.02)) },
      { mat: "granite" as const, solid: box(w + 0.3, 0.15, 0.38, 0, 0, 0.17) },
    ];
  },
});

/** A ground-floor window's ledge (the outer sill, Sohlbank) in granite, deep enough to sit on: 1.25 m by 0.34 m, its
 *  top at its origin (the window's sill on the wall's court face), running 0.29 m out into the court. */
prop({
  id: "court-sill", items: ["window-sill"], size: [1.25, 0.08, 0.34], place: "wall", where: "set", tris: 100,
  parts: () => [{ mat: "granite" as const, solid: box(1.25, 0.075, 0.34, 0, -0.075, 0.12) }],
});

export const KIT_STREET = true;
