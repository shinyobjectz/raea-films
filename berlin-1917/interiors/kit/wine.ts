// The Weinstube and the wine restaurant (research/catalogue: shop-weinstube, 16 storefronts on the three streets read, and
// the wine merchants' tasting rooms with them, 21): panelled walls to above the head, tables under white cloths, the
// bottles lying in their racks, casks on a stillage, the buffet. Kempinski's at Leipziger Straße 25 was the great one.
// Winter 1917-18: meatless days (Tuesday and Friday from 1915), bread only against the card, wine still to be had, at
// a price. corner.ts weinstubeProps lays it out; the chairs and banquettes are the café's (kit/cafe.ts).
import { sdf } from "raea/3d";
import { box, hash, lathe, union, zcyl } from "./geo";
import { prop } from "./prop";

const WINE = ["shop-weinstube", "shop-wine-merchant"];

/** A table under a white cloth hanging a hand's breadth, a carafe of wine and two glasses on it. */
prop({
  id: "wine-table", items: [...WINE, "table-cover"], size: [0.82, 0.92, 0.82], place: "floor", tris: 2600,
  parts: () => [
    { mat: "wood-dark", solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.05, 0.56, 0.05, sx * 0.3, 0, sz * 0.3)))) },
    // the cloth: the top and its fall, one rounded slab hanging 0.2 m (a longer fall reads as a dark skirt under a pendant)
    { mat: "linen", solid: sdf.box(0.8, 0.2, 0.8, 0.03).move(0, 0.66, 0).solid(0.03).simplify(0.008), overlap: true },
    { mat: "glass-ruby", solid: lathe([[0, 0], [0.045, 0], [0.05, 0.08], [0.02, 0.17], [0.018, 0.22], [0, 0.22]], 0.12, 0.76, -0.08, 14), overlap: true },
    {
      mat: "glass",
      solid: union(...[[-0.18, 0.12], [0.2, 0.14]].map(([x, z]) => lathe([[0, 0], [0.03, 0], [0.004, 0.01], [0.004, 0.07], [0.03, 0.1], [0.032, 0.15], [0, 0.15]], x, 0.76, z, 12))),
      overlap: true,
    },
  ],
});

/** A wine rack: deal bins to 2.2 m, the bottles lying in them with their ends out (dark green, a few gaps). */
prop({
  id: "wine-rack", items: [...WINE, "wine-rack"], size: [1.6, 2.2, 0.42], place: "wall", tris: 2800,
  parts: () => {
    const rows = 8, cols = 7, ends: ReturnType<typeof zcyl>[] = [];
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      if (hash(i, j, 41) < 0.18) continue; // drunk, or never delivered
      ends.push(zcyl(0.037, 0.3).move(-0.66 + j * 0.22, 0.2 + i * 0.25, 0.04));
    }
    return [
      { mat: "wood-dark", solid: union(box(1.6, 0.05, 0.42, 0, 0, 0), box(1.6, 0.05, 0.42, 0, 2.15, 0), box(0.05, 2.2, 0.42, -0.775, 0, 0), box(0.05, 2.2, 0.42, 0.775, 0, 0), ...Array.from({ length: rows - 1 }, (_, i) => box(1.5, 0.02, 0.4, 0, 0.32 + i * 0.25, 0)), box(1.6, 2.2, 0.02, 0, 0, -0.2)) },
      { mat: "glass-green", solid: union(...ends), overlap: true },
    ];
  },
});

/** A plate rail along the top of the panelling: a moulded shelf with painted plates and jugs standing on it, 2 m of it. */
prop({
  id: "plate-rail", items: [...WINE, "plate-rail"], size: [2.0, 0.34, 0.14], place: "hung", tris: 1600,
  parts: () => {
    const plates = [-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => (i % 2 ? lathe([[0, 0], [0.06, 0], [0.07, 0.05], [0.06, 0.16], [0.07, 0.2], [0, 0.2]], x, 0.04, 0.02, 12) : zcyl(0.13, 0.015).move(x, 0.17, -0.02)));
    return [
      { mat: "wood-dark", solid: union(box(2.0, 0.04, 0.14, 0, 0, 0), box(2.0, 0.06, 0.03, 0, 0, -0.055)) },
      { mat: "stoneware", solid: union(...plates), overlap: true },
    ];
  },
});

/** The house's notice by the door: the meatless days and the bread card, printed rows under a heading. */
prop({
  id: "meatless-notice", items: [...WINE, "war-notice"], size: [0.34, 0.46, 0.01], place: "hung", tris: 100,
  parts: () => [
    { mat: "paper", solid: box(0.34, 0.46, 0.004, 0, 0, 0) },
    { mat: "paper-poster", solid: union(box(0.24, 0.03, 0.002, 0, 0.39, 0.003), ...Array.from({ length: 9 }, (_, i) => box(0.26 - (i % 3) * 0.04, 0.012, 0.002, 0, 0.06 + i * 0.033, 0.003))), overlap: true },
  ],
});

export const KIT_WINE = true;
