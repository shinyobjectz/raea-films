// The hotel's hall (research/catalogue: shop-hotel; by the 1917 book 36 on Friedrichstraße, 13 on the Linden, 6 on
// Wilhelmstraße: the Adlon, the Bristol, the Central-Hotel by the station). What the street saw through the ground
// floor's tall windows was the Halle: palms and club chairs on the rugs, the porter at his desk under the board of keys,
// marble columns, electric chandeliers. In the war the halls were full of officers on leave and the ministries'
// callers; the meatless days were posted by the door, and the luggage by the porter's desk was the leave train's.
// interiors/hotel.ts lays the hall out.
import { box, lathe, post, rbox, union } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const HOTEL = ["shop-hotel"];

/** A club chair in leather: the deep seat, the rolled arms, the back, on short feet. */
for (const set of [true, false]) prop({
  // the second, for the furnisher: the leather armchair of an office in the palaces (research/catalogue/rooms.ts ministry)
  id: set ? "club-chair" : "leather-armchair", items: set ? [...HOTEL, "club-chair"] : ["leather-chair"], size: [0.82, 0.82, 0.82], place: "floor", ...(set ? { where: "set" as const } : {}), tris: 1400,
  parts: () => [
    { mat: "leather", solid: union(rbox(0.78, 0.2, 0.78, 0.03, 0, 0.04, 0), rbox(0.46, 0.14, 0.58, 0.05, 0, 0.24, 0.07), rbox(0.78, 0.56, 0.2, 0.06, 0, 0.24, -0.29), rbox(0.16, 0.36, 0.78, 0.06, -0.31, 0.24, 0), rbox(0.16, 0.36, 0.78, 0.06, 0.31, 0.24, 0)) },
    { mat: "wood-dark", solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.05, 0.04, 0.05, sx * 0.33, 0, sz * 0.33)))) },
  ],
});

/** The hall's electric chandelier: a brass body on its rod, six arms with tulip shades, a finial below. */
for (const set of [true, false]) prop({
  // the second, for the furnisher: the electrified chandelier of the palaces' high rooms (never a flat's "electric-light")
  id: set ? "chandelier" : "palais-chandelier", items: set ? [...HOTEL] : ["chandelier"], size: [1.0, 1.1, 1.0], place: "ceiling", ...(set ? { where: "set" as const } : {}), tris: 2600,
  parts: () => {
    const arms = [], shades = [];
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3, x = 0.4 * Math.cos(a), z = 0.4 * Math.sin(a);
      arms.push(bar([0, -0.8, 0], [x, -0.84, z], 0.009), post(0.016, 0.05, x, -0.86, z));
      shades.push(lathe([[0, 0], [0.02, 0], [0.06, 0.09], [0.055, 0.09], [0, 0.02]], x, -0.83, z, 12));
    }
    return [
      { mat: "brass", solid: union(post(0.06, 0.04, 0, -0.04, 0), post(0.01, 0.62, 0, -0.66, 0), lathe([[0, 0], [0.08, 0.02], [0.1, 0.1], [0.06, 0.2], [0, 0.22]], 0, -0.88, 0, 16), lathe([[0, 0], [0.03, 0.06], [0, 0.14]], 0, -1.02, 0, 12), ...arms) },
      { mat: "lamp-shade", solid: union(...shades), overlap: true },
    ];
  },
  // unshadowed: a bulb in every shade casts no hard shadow of the fitting. One shadowed point drew wedges on every wall
  // from inside the ring of shades, and blades on the ceiling from under it
  glow: [{ at: [0, -0.95, 0], lumens: 1800, color: "#ffe2b8", range: 14, shadow: false }],
});

/** A marble column of the hall, floor to the 5.2 m ceiling: the square plinth, the moulded base, the shaft, a gilt
 *  capital and its abacus. */
prop({
  id: "hall-column", items: [...HOTEL, "column"], size: [0.64, 5.2, 0.64], place: "floor", where: "set", tris: 900,
  parts: () => [
    { mat: "marble", solid: union(box(0.62, 0.3, 0.62), lathe([[0, 0], [0.3, 0], [0.3, 0.06], [0.26, 0.1], [0, 0.1]], 0, 0.3, 0, 20), lathe([[0, 0], [0.24, 0], [0.22, 4.3], [0, 4.3]], 0, 0.4, 0, 20)) },
    { mat: "brass", solid: union(lathe([[0, 0], [0.22, 0], [0.3, 0.3], [0.31, 0.36], [0, 0.36]], 0, 4.7, 0, 20), box(0.64, 0.14, 0.64, 0, 5.06, 0)), overlap: true },
  ],
});

/** The porter's desk: a mahogany counter under a marble top, panelled to the hall, the register open, the brass bell. */
prop({
  id: "porter-desk", items: [...HOTEL, "porter"], size: [2.06, 1.15, 0.7], place: "floor", where: "set", tris: 400,
  parts: () => [
    { mat: "wood-dark", solid: box(2.0, 1.05, 0.6) },
    { mat: "wood-mid", solid: union(...[-0.65, 0, 0.65].map((x) => box(0.55, 0.7, 0.01, x, 0.17, 0.302))), overlap: true },
    { mat: "marble", solid: box(2.06, 0.04, 0.66, 0, 1.05, 0) },
    { mat: "leather", solid: box(0.38, 0.03, 0.27, -0.3, 1.09, 0.05), overlap: true },
    { mat: "paper", solid: box(0.35, 0.01, 0.25, -0.3, 1.12, 0.05), overlap: true },
    { mat: "brass", solid: lathe([[0, 0], [0.05, 0], [0.045, 0.03], [0, 0.05]], 0.6, 1.09, 0.1, 12), overlap: true },
  ],
});

/** The board of keys behind the porter: sixty pigeonholes, the keys of the guests who are out hanging on their brass
 *  tags, letters waiting in a few. */
prop({
  id: "key-board", items: [...HOTEL, "porter"], size: [1.2, 0.9, 0.12], place: "hung", where: "set", tris: 1400,
  parts: () => {
    const keys = [], mail = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
      const x = -0.54 + j * 0.12, y = i * 0.15;
      if ((i * 7 + j * 3) % 5 < 3) keys.push(box(0.03, 0.05, 0.006, x, y + 0.03, 0.045));
      else if ((i + j * 5) % 7 === 0) mail.push(box(0.08, 0.05, 0.06, x, y + 0.012, 0));
    }
    return [
      { mat: "wood-dark", solid: union(box(1.2, 0.9, 0.03, 0, 0, -0.045), ...Array.from({ length: 11 }, (_, j) => box(0.012, 0.9, 0.08, -0.6 + j * 0.12, 0, 0)), ...Array.from({ length: 7 }, (_, i) => box(1.2, 0.012, 0.08, 0, i * 0.148, 0))) },
      { mat: "brass", solid: union(...keys), overlap: true },
      { mat: "paper", solid: union(...mail), overlap: true },
    ];
  },
});

/** The window's planter: a trough with a zinc lip and its earth, for the aspidistras the window shows the street. */
prop({
  id: "planter-trough", items: [...HOTEL, "planter"], size: [2.3, 0.53, 0.47], place: "floor", where: "set", tris: 100,
  parts: () => [
    { mat: "wood-dark", solid: box(2.3, 0.5, 0.45) },
    { mat: "zinc", solid: box(2.32, 0.03, 0.47, 0, 0.5, 0) },
    { mat: "earth", solid: box(2.2, 0.01, 0.38, 0, 0.52, 0), overlap: true },
  ],
});

/** A velvet drape inside the tall window: six deep folds to the floor under a pelmet with its gilt fringe. */
for (const set of [true, false]) prop({
  // the second, for the furnisher: a palace window's velvet, 3.5 m, for rooms of 4.4 m and more
  id: set ? "hotel-drape" : "palais-drape", items: set ? [...HOTEL, "drape"] : ["palais-drapes"], size: [1.0, 3.5, 0.25], place: "wall", ...(set ? { where: "set" as const } : {}), tris: 900,
  parts: () => [
    { mat: "plush", solid: union(...Array.from({ length: 6 }, (_, i) => post(0.075, 3.2, -0.35 + i * 0.14, 0.05, 0.02)), box(1.0, 0.25, 0.2, 0, 3.25, 0)) },
    { mat: "brass", solid: box(1.0, 0.04, 0.21, 0, 3.24, 0), overlap: true },
  ],
});

export const KIT_HOTEL = true;
