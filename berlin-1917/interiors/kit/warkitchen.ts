// The war kitchen (research/catalogue/outdoor.ts war-kitchen: Kriegsküche, Volksküche): a hall with steaming kettles
// and long tables, the soup carried home in cans. From 1916 the city ran public kitchens against a card; a portion was
// mostly swede (the "turnip winter" of 1916-17 and after). interiors/warkitchen.ts lays the hall out.
import { box, lathe, post, ring, rodX, union } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const WK = ["war-kitchen"];

/** A steam-jacketed soup kettle (Kochkessel) on its iron stand: a riveted drum about a metre across, its domed lid
 *  tipped up on the hinge, the tilting wheel and the tap at the front. Back to the wall. */
prop({
  id: "soup-kettle", items: [...WK, "kettle"], size: [1.15, 1.45, 1.1], place: "wall", tris: 3200,
  parts: () => {
    const R = 0.5, y0 = 0.35, h = 0.75;
    const rivets = Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * 2 * Math.PI;
      return post(0.012, 0.02, Math.cos(a) * (R + 0.005), y0 + h - 0.06, Math.sin(a) * (R + 0.005) + 0.05);
    });
    return [
      { mat: "iron", solid: union(...[-1, 1].flatMap((s) => [box(0.08, y0, 0.08, s * 0.42, 0, -0.3), box(0.08, y0, 0.08, s * 0.42, 0, 0.4)]), box(0.95, 0.06, 0.8, 0, y0 - 0.06, 0.05), ...rivets) },
      { mat: "zinc", solid: union(lathe([[0, 0], [R * 0.85, 0], [R, 0.12], [R, h], [R + 0.03, h], [R + 0.03, h + 0.03], [0, h + 0.03]], 0, y0, 0.05, 28)), overlap: true },
      // the lid on its hinge at the back, tipped open toward the wall
      { mat: "zinc", solid: lathe([[0, 0], [R + 0.03, 0], [R + 0.02, 0.03], [R * 0.6, 0.1], [0, 0.12]], 0, 0, 0, 24).rotate(-70, 0, 0).move(0, y0 + h + 0.03, 0.05 - R), overlap: true },
      { mat: "brass", solid: union(rodX(0.025, 0.18, 0, y0 + 0.12, 0.05 + R + 0.05), post(0.018, 0.08, 0.09, y0 + 0.04, 0.05 + R + 0.05), ring(0.13, 0.012, 16, 6).rotate(0, 90, 0).move(0.52, y0 + h * 0.6, 0.05)), overlap: true },
    ];
  },
});

/** The serving counter: a long scrubbed deal top on trestles, a zinc-lined well for the ladles, a ladle and a pile of
 *  bowls on it. The hatch between the kettles and the queue. */
prop({
  id: "serving-counter", items: [...WK, "serving-counter"], size: [3.0, 0.95, 0.75], place: "floor", tris: 1800,
  parts: () => {
    const legs = [-1.35, -0.45, 0.45, 1.35].flatMap((x) => [box(0.07, 0.9, 0.07, x, 0, -0.3), box(0.07, 0.9, 0.07, x, 0, 0.3)]);
    const bowls = [0, 1, 2, 3, 4].map((i) => lathe([[0, 0], [0.06, 0], [0.09, 0.05], [0.085, 0.05], [0.055, 0.004], [0, 0.004]], -1.0, 0.95 + i * 0.03, 0.1, 14));
    return [
      { mat: "wood-raw", solid: union(box(3.0, 0.05, 0.75, 0, 0.9, 0), ...legs, box(2.9, 0.04, 0.6, 0, 0.18, 0)) },
      { mat: "zinc", solid: box(0.6, 0.01, 0.4, 0.6, 0.95, 0.05), overlap: true },
      { mat: "enamel", solid: union(...bowls), overlap: true },
      { mat: "iron", solid: union(bar([0.4, 0.97, 0.1], [0.75, 1.0, -0.05], 0.008), lathe([[0, 0], [0.05, 0], [0.05, 0.04], [0, 0.04]], 0.36, 0.96, 0.12, 10)), overlap: true },
    ];
  },
});

/** A long deal table on trestles with a bench either side, for those who eat it there. */
prop({
  id: "trestle-table", items: [...WK, "trestle-table"], size: [2.4, 0.76, 1.5], place: "floor", tris: 600,
  parts: () => [
    {
      mat: "wood-raw",
      solid: union(
        box(2.4, 0.04, 0.7, 0, 0.72, 0),
        ...[-0.95, 0.95].flatMap((x) => [box(0.06, 0.72, 0.6, x, 0, 0), box(0.06, 0.45, 0.3, x, 0, -0.6), box(0.06, 0.45, 0.3, x, 0, 0.6)]),
        box(2.3, 0.04, 0.26, 0, 0.45, -0.6), box(2.3, 0.04, 0.26, 0, 0.45, 0.6),
      ),
    },
  ],
});

/** Food carriers (Essenträger): stacked tin pots in a frame with a bail handle, the soup's way home; three on the floor
 *  by the counter, waiting to be filled. */
prop({
  id: "food-carriers", items: [...WK, "food-carrier"], size: [0.7, 0.42, 0.3], place: "floor", tris: 1500,
  parts: () => {
    const one = (x: number) => union(
      ...[0, 1, 2].map((k) => lathe([[0, 0], [0.075, 0], [0.078, 0.1], [0, 0.1]], x, 0.01 + k * 0.105, 0, 14)),
      bar([x - 0.085, 0.02, 0], [x - 0.085, 0.36, 0], 0.005), bar([x + 0.085, 0.02, 0], [x + 0.085, 0.36, 0], 0.005), bar([x - 0.085, 0.36, 0], [x + 0.085, 0.36, 0], 0.006),
    );
    return [{ mat: "zinc", solid: union(one(-0.22), one(0), one(0.22)) }];
  },
});

/** The queue's rail: turned posts and a top rail from the door to the counter, so the line keeps to one side. */
prop({
  id: "queue-rail", items: [...WK, "queue-rail"], size: [2.4, 1.0, 0.08], place: "floor", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(...[-1.15, 0, 1.15].map((x) => lathe([[0, 0], [0.04, 0], [0.04, 0.06], [0.028, 0.08], [0.028, 0.9], [0.035, 0.94], [0, 0.96]], x, 0, 0, 10)), box(2.4, 0.05, 0.07, 0, 0.94, 0)) },
  ],
});

/** A rail over the kettles with the ladles and skimmers hung on it. */
prop({
  id: "ladle-rail", items: [...WK, "ladles"], size: [2.6, 0.55, 0.12], place: "hung", tris: 900,
  parts: () => {
    const tools = [-1.05, -0.6, -0.15, 0.3, 0.75, 1.1].map((x, i) => union(
      bar([x, 0.5, 0.04], [x, 0.12, 0.04], 0.007),
      i % 2 ? box(0.12, 0.012, 0.12, x, 0.06, 0.04) : lathe([[0, 0], [0.045, 0.01], [0.055, 0.06], [0.05, 0.06], [0.04, 0.015], [0, 0.008]], x, 0.06, 0.04, 10),
    ));
    return [
      { mat: "iron", solid: union(rodX(0.012, 2.6, 0, 0.52, 0.04), box(0.03, 0.08, 0.06, -1.25, 0.47, 0.02), box(0.03, 0.08, 0.06, 1.25, 0.47, 0.02)) },
      { mat: "zinc", solid: union(...tools), overlap: true },
    ];
  },
});

/** The day's board: a blackboard in a deal frame, the dish and its price chalked in rows (drawn as chalk strokes). */
prop({
  id: "menu-board", items: [...WK, "menu-board"], size: [0.9, 0.7, 0.03], place: "hung", tris: 300,
  parts: () => {
    const rows = [0.5, 0.4, 0.32, 0.24, 0.14].map((y, i) => box(i === 0 ? 0.56 : 0.3 + 0.08 * ((i * 7) % 4), i === 0 ? 0.045 : 0.025, 0.004, i === 0 ? 0 : -0.12, y, 0.02));
    const prices = [0.4, 0.32, 0.24].map((y) => box(0.1, 0.025, 0.004, 0.28, y, 0.02));
    return [
      { mat: "wood-raw", solid: box(0.9, 0.7, 0.025, 0, 0, 0) },
      { mat: "glass-dark", solid: box(0.8, 0.6, 0.004, 0, 0.05, 0.014), overlap: true },
      { mat: "paper", solid: union(...rows, ...prices), overlap: true },
    ];
  },
});

/** The card desk inside the door: a small deal table where the cards were stamped, the ledger open, a stamp pad and the
 *  tin of meal tickets (Essenmarken). */
prop({
  id: "card-desk", items: [...WK, "card-desk"], size: [1.0, 0.8, 0.6], place: "floor", tris: 700,
  parts: () => [
    { mat: "wood-raw", solid: union(box(1.0, 0.04, 0.6, 0, 0.74, 0), ...[-0.44, 0.44].flatMap((x) => [box(0.05, 0.74, 0.05, x, 0, -0.24), box(0.05, 0.74, 0.05, x, 0, 0.24)])) },
    { mat: "paper", solid: union(box(0.42, 0.012, 0.3, -0.12, 0.78, 0.02).rotate(0, 6, 0)), overlap: true },
    { mat: "cloth-black", solid: union(box(0.22, 0.02, 0.32, -0.34, 0.78, 0.02), box(0.08, 0.02, 0.06, 0.2, 0.78, -0.1)), overlap: true },
    { mat: "iron", solid: union(box(0.18, 0.08, 0.12, 0.34, 0.78, 0.06), post(0.012, 0.06, 0.2, 0.8, 0.08)), overlap: true },
  ],
});

/** A crockery rack: open deal shelves of enamel bowls and mugs, stacked. */
prop({
  id: "crockery-rack", items: [...WK, "crockery"], size: [1.4, 1.9, 0.38], place: "wall", tris: 2600,
  parts: () => {
    const shelves = [0.1, 0.55, 1.0, 1.45, 1.85];
    const bowls = shelves.slice(0, 4).flatMap((y, s) => Array.from({ length: 5 }, (_, i) => {
      // a stack as one turned shape: the bottom bowl's foot, the rims stepping up, the top bowl's hollow
      const t = 0.05 + (1 + ((i * 3 + s) % 4)) * 0.022;
      return lathe([[0, 0], [0.05, 0], [0.08, t], [0.075, t], [0.045, t - 0.046], [0, t - 0.046]], -0.52 + i * 0.26, y + 0.025, 0.02, 10);
    }));
    return [
      { mat: "wood-raw", solid: union(box(0.04, 1.9, 0.36, -0.68, 0, 0), box(0.04, 1.9, 0.36, 0.68, 0, 0), ...shelves.map((y) => box(1.36, 0.025, 0.34, 0, y, 0)), box(1.4, 1.9, 0.015, 0, 0, -0.17)) },
      { mat: "enamel", solid: union(...bowls), overlap: true },
    ];
  },
});

export const KIT_WARKITCHEN = true;
