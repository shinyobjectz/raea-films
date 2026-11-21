// The department store (research/catalogue: shop-department; Wertheim, Leipziger Straße 126-137, and Hermann Tietz,
// 46-50a): what its sales floors hold that the street's shops don't. The counters, vitrines, forms, shelves and lamps
// are the store kit's (interiors/kit/store.ts); interiors/department.ts lays the floors out. Winter 1917-18: the
// windows dressed for the war, an officer's field grey on a form (officers bought their own), parcels for the front
// (Liebesgaben), mourning black; the stock thin and against a permit.
import { box, lathe, post, union, zcyl } from "./geo";
import { prop } from "./prop";

const DEPT = ["shop-department"];

/** A sales floor's cast-iron column, floor to a 4.6 m ceiling: a moulded base, the shaft, a flared capital. */
prop({
  id: "store-column", items: [...DEPT, "cast-iron-column"], size: [0.52, 4.6, 0.52], place: "floor", tris: 700,
  parts: () => [
    {
      mat: "paint-white",
      solid: union(
        lathe([[0, 0], [0.26, 0], [0.26, 0.08], [0.2, 0.12], [0.16, 0.3], [0, 0.3]], 0, 0, 0, 16),
        post(0.12, 4.0, 0, 0.28, 0),
        lathe([[0, 0], [0.13, 0], [0.16, 0.12], [0.24, 0.22], [0.26, 0.3], [0, 0.3]], 0, 4.28, 0, 16),
        box(0.52, 0.02, 0.52, 0, 4.58, 0),
      ),
    },
  ],
});

/** Parcels for the front: brown-paper boxes tied with string, a stack and two leaning, as the store's window offered
 *  them ready to send by field post. */
prop({
  id: "feldpost-parcels", items: [...DEPT, "liebesgaben"], size: [0.6, 0.42, 0.42], place: "on", tris: 500,
  parts: () => {
    const boxes: [number, number, number, number, number, number, number][] = [
      [0.34, 0.16, 0.26, -0.1, 0, 0, 6], [0.28, 0.14, 0.22, -0.08, 0.16, 0.01, -9], [0.22, 0.11, 0.18, -0.1, 0.3, 0, 14],
      [0.2, 0.22, 0.16, 0.18, 0, 0.06, -20], [0.16, 0.12, 0.13, 0.2, 0, -0.12, 30],
    ];
    const card = boxes.map(([w, h, d, x, y, z, a]) => box(w, h, d, 0, 0, 0).rotate(0, a, 0).move(x, y, z));
    const string = boxes.map(([w, h, d, x, y, z, a]) => union(box(w + 0.004, h + 0.004, 0.006, 0, -0.002, 0), box(0.006, h + 0.004, d + 0.004, 0, -0.002, 0)).rotate(0, a, 0).move(x, y, z));
    return [{ mat: "card", solid: union(...card) }, { mat: "linen", solid: union(...string), overlap: true }];
  },
});

/** The Lichthof seen from the hall: the back wall opened in three round-headed arches on stone piers, and beyond them
 *  the glass-roofed court, bright, its grand stair rising in the middle and a balustrade across the side bays (drawn
 *  shallow: the cubemap sees it from 15 m). Against the back wall; the court's daylight comes with it. */
prop({
  id: "lichthof-arcade", items: [...DEPT, "lichthof"], size: [5.6, 4.6, 0.7], place: "wall", tris: 2600,
  parts: () => {
    const pier = 0.44, bay = 1.28, z0 = 0.2;
    const xs = [0, 1, 2].map((i) => -2.8 + pier + bay / 2 + i * (bay + pier));
    const screen = union(...[0, 1, 2, 3].map((i) => box(pier, 4.6, 0.3, -2.8 + pier / 2 + i * (bay + pier), 0, z0)), box(5.6, 1.3, 0.3, 0, 3.3, z0))
      .minus(union(...xs.map((x) => zcyl(bay / 2, 0.5).move(x, 3.3, z0))));
    const steps = Array.from({ length: 9 }, (_, i) => box(bay - 0.1, 0.16 * (i + 1), 0.04, xs[1], 0, -0.02 - i * 0.035));
    const rail = [xs[0], xs[2]].flatMap((x) => [
      box(bay, 0.06, 0.06, x, 0.95, -0.12),
      ...Array.from({ length: 9 }, (_, k) => post(0.022, 0.9, x - bay / 2 + 0.08 + k * ((bay - 0.16) / 8), 0.05, -0.12)),
    ]);
    return [
      { mat: "marble", solid: union(screen, box(5.6, 0.12, 0.34, 0, 0, z0 + 0.02)) },
      { mat: "paint-white", solid: box(5.6, 4.6, 0.02, 0, 0, -0.34), overlap: true },
      { mat: "marble", solid: union(...steps), overlap: true },
      { mat: "brass", solid: union(...rail), overlap: true },
    ];
  },
  glow: [{ at: [0, 3.6, -0.2], lumens: 220, color: "#e6eef6", range: 5 }],
});

export const KIT_DEPT = true;
