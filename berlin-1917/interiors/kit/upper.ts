// A shop's upper zone: what filled its walls from about three metres to the cornice. In 1917 Berlin a shop was shelved
// to the ceiling, and its stock stayed in its boxes up there, reached by ladder: the shoe shop's and the hosier's
// cartons, the draper's bolts in their pigeonholes, the grocer's tins and jars over the drawer wall, the bookseller's
// books, enamel advertising plates in a row. Seen from the street, a shop pane looks mostly into this band (a 3.6 m pane
// from eye level shows the back wall's upper half), so without it a shop reads as an empty room
// (plan.org t-ishops003). Wartime: boxes kept on the shelves even emptied, bolts thin, a tin in three gone.
// interiors/shops.ts and interiors/corner.ts run these along every wall over the furniture (upperRun).
// Each is hung: origin at the bottom middle, its back to the wall.
import { box, hash, post, union, zcyl } from "./geo";
import type { MatId } from "./mats";
import { prop } from "./prop";
import { byMat } from "./store";
import { books, wreath, type Mats } from "./trade";

/** The fitted shelving's carcass: back, ends, boards at `ys` and a cornice over the top. */
function carcass(b: Mats, w: number, h: number, d: number, ys: number[], wood: MatId = "wood-mid") {
  b.add(wood, union(
    box(w, h, 0.02, 0, 0, -d / 2 + 0.01),
    box(0.03, h, d, -w / 2 + 0.015, 0, 0), box(0.03, h, d, w / 2 - 0.015, 0, 0),
    ...ys.map((y) => box(w, 0.025, d, 0, y, 0)),
  ));
  b.add("wood-dark", box(w + 0.06, 0.06, d + 0.04, 0, h, 0.02));
}

/** Cartons to the cornice: stacks of flat boxes (shoes, gloves, hats, collars) on two boards, a paper label on each
 *  box's end, now and then a stack sold down or gone. */
const CARTONS = ["shop-baker", "shop-shoes", "shop-small-goods", "shop-hats", "shop-fashion", "shop-menswear", "shop-furs", "shop-tobacco"];
function cartons(s: number) {
    const b = byMat(), W = 2.0, D = 0.38, ys = [0, 0.64];
    carcass(b, W, 1.3, D, [...ys, 1.27]);
    const tones: MatId[] = ["card", "card", "card", "paper-blue", "cloth-cream", "paint-white"];
    ys.forEach((y, row) => {
      let x = -W / 2 + 0.05, i = 0;
      while (x < W / 2 - 0.3) {
        const k = row * 20 + i + s * 500, w = 0.27 + hash(k, 1) * 0.08, n = Math.floor(hash(k, 2) * 5.99), bh = 0.09 + hash(k, 3) * 0.04;
        if (x + w > W / 2 - 0.04) break;
        const n1 = hash(k, 4) < 0.1 ? 0 : Math.max(1, Math.min(n, Math.floor(0.56 / bh))); // a stack sold out now and then
        if (n1) {
          b.add(tones[Math.floor(hash(k, 5) * tones.length)], box(w - 0.01, n1 * bh, D - 0.06, x + w / 2, y + 0.025, 0.01));
          b.add("paper", union(...Array.from({ length: n1 }, (_, j) => box(0.08, bh * 0.45, 0.004, x + w / 2 + (hash(k, j, 6) - 0.5) * 0.08, y + 0.025 + j * bh + bh * 0.3, D / 2 - 0.018))));
        }
        x += w + 0.01; i++;
      }
    });
    return b.parts();
}
for (const [id, s] of [["loft-cartons", 0], ["loft-cartons-b", 1]] as const) prop({ id, items: CARTONS, size: [2.0, 1.3, 0.38], place: "hung", tris: 2200, parts: () => cartons(s) });

/** The draper's pigeonholes: bolts of cloth laid flat, five compartments on two rows, the war's stock thin. */
function bolts(s: number) {
    const b = byMat(), W = 2.0, D = 0.42, ys = [0, 0.64];
    carcass(b, W, 1.3, D, [...ys, 1.27], "wood-dark");
    b.add("wood-dark", union(...[-0.6, -0.2, 0.2, 0.6].map((x) => box(0.025, 1.27, D, x, 0, 0))));
    const cloth: MatId[] = ["cloth-navy", "cloth-brown", "cloth-black", "cloth-field", "cloth-cream", "linen-grey", "check-blue", "wool", "cloth-floral"];
    ys.forEach((y, row) => [-0.8, -0.4, 0, 0.4, 0.8].forEach((x, c) => {
      const k = row * 5 + c + s * 500, n = Math.floor(hash(k, 11) * 6); // none to five
      for (let j = 0; j < n; j++) {
        const t = 0.07 + hash(k, j, 12) * 0.03;
        b.add(cloth[Math.floor(hash(k, j, 13) * cloth.length)], box(0.34 + hash(k, j, 14) * 0.02, t, D - 0.08, x + (hash(k, j, 15) - 0.5) * 0.02, y + 0.025 + j * 0.095, 0.02));
      }
    }));
    return b.parts();
}
for (const [id, s] of [["loft-bolts", 0], ["loft-bolts-b", 1]] as const) prop({ id, items: ["shop-fabric", "shop-menswear"], size: [2.0, 1.3, 0.42], place: "hung", tris: 1600, parts: () => bolts(s) });

/** The grocer's tins and jars over the drawer wall: coffee and cocoa tins, glass jars with their lids, packets; one
 *  in three gone. */
const TINS = ["shop-grocer", "shop-dairy", "shop-drugstore", "shop-tobacco"];
function tins(s: number) {
    const b = byMat(), W = 2.0, D = 0.3, ys = [0, 0.4, 0.8];
    carcass(b, W, 1.2, D, [...ys, 1.17]);
    const tins: MatId[] = ["paint-red", "enamel-blue", "paint-green", "steel-bright", "paint-brown"];
    ys.forEach((y, row) => {
      let x = -W / 2 + 0.07, i = 0;
      while (x < W / 2 - 0.1) {
        const k = row * 30 + i + s * 500, v = hash(k, 21), y0 = y + 0.025;
        if (v < 0.33) { x += 0.11; i++; continue; } // gone
        if (v < 0.62) { const r = 0.04 + hash(k, 22) * 0.012, h = 0.1 + hash(k, 23) * 0.06; b.add(tins[Math.floor(hash(k, 24) * tins.length)], post(r, h, x, y0, 0.02)); b.add("paper-poster", post(r + 0.002, h * 0.45, x, y0 + h * 0.25, 0.02)); x += 2 * r + 0.025; }
        else if (v < 0.82) { const r = 0.05, h = 0.2; b.add("glass", post(r, h, x, y0, 0.02)); b.add("brass", post(r * 0.75, 0.025, x, y0 + h, 0.02)); b.add("pulses", post(r - 0.006, h * (0.15 + hash(k, 25) * 0.5), x, y0 + 0.004, 0.02)); x += 2 * r + 0.03; }
        else { const w = 0.1 + hash(k, 26) * 0.05, h = 0.14 + hash(k, 27) * 0.1; b.add(hash(k, 28) < 0.5 ? "card" : "paper-blue", box(w, h, 0.09, x + w / 2 - 0.05, y0, 0.02)); x += w + 0.02; }
        i++;
      }
    });
    return b.parts();
}
for (const [id, s] of [["loft-tins", 0], ["loft-tins-b", 1]] as const) prop({ id, items: TINS, size: [2.0, 1.2, 0.3], place: "hung", tris: 2400, parts: () => tins(s) });

/** The bookseller's upper shelves, over the book wall: three boards of books to the cornice. */
for (const [id, s] of [["loft-books", 0], ["loft-books-b", 1]] as const) prop({
  id, items: ["shop-books-music"], size: [2.0, 1.3, 0.34], place: "hung", tris: 2600,
  parts: () => {
    const b = byMat(), W = 2.0, D = 0.34, ys = [0, 0.43, 0.86];
    carcass(b, W, 1.3, D, [...ys, 1.27], "wood-dark");
    ys.forEach((y, i) => books(b, -W / 2 + 0.04, W / 2 - 0.04, y + 0.025, 0.36, D - 0.06, 0.02, 700 + s * 211 + i * 31));
    return b.parts();
  },
});

/** Enamel advertising plates in a row, high on a grocer's or a dairy's wall: three plates, each in its colours, with
 *  bands of lettering that read as words from the street (coffee substitute, soap, chocolate, Persil). */
prop({
  id: "ad-frieze", items: ["shop-grocer", "shop-dairy", "shop-baker", "shop-butcher", "shop-tobacco", "shop-barber"], size: [2.0, 0.6, 0.03], place: "hung", tris: 400,
  parts: () => {
    const b = byMat();
    const plates: [MatId, MatId][] = [["enamel-blue", "enamel"], ["paint-red", "enamel"], ["enamel", "enamel-blue"], ["paint-green", "enamel"], ["paper-poster", "paint-red"], ["paint-brown", "brass"]];
    [-0.66, 0, 0.66].forEach((x, i) => {
      const [ground, ink] = plates[Math.floor(hash(i, 31) * plates.length + i * 2) % plates.length];
      const w = 0.56 - 0.06 * hash(i, 32), h = 0.36 + 0.18 * hash(i, 33), y = (0.6 - h) / 2;
      b.add(ground, box(w, h, 0.012, x, y, 0));
      // a rim and two or three lines of lettering, the first the larger
      const lines = 2 + Math.floor(hash(i, 34) * 2);
      b.add(ink, union(
        box(w - 0.04, 0.012, 0.004, x, y + 0.016, 0.008), box(w - 0.04, 0.012, 0.004, x, y + h - 0.028, 0.008),
        box(0.012, h - 0.04, 0.004, x - w / 2 + 0.026, y + 0.02, 0.008), box(0.012, h - 0.04, 0.004, x + w / 2 - 0.026, y + 0.02, 0.008),
        ...Array.from({ length: lines }, (_, j) => box((w - 0.12) * (j ? 0.55 + 0.3 * hash(i, j, 35) : 0.86), j ? 0.022 : 0.05, 0.004, x, y + h - 0.1 - j * ((h - 0.12) / lines), 0.008)),
      ));
    });
    return b.parts();
  },
});

/** The florist's wall in the war winter: mourning wreaths hung high on pegs along a rail. */
prop({
  id: "wreath-rail", items: ["shop-florist"], size: [2.0, 0.8, 0.14], place: "hung", tris: 9500,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", box(2.0, 0.05, 0.03, 0, 0.72, -0.055));
    [-0.62, 0.05, 0.68].forEach((x, i) => { b.add("brass", post(0.008, 0.06, x, 0.74, -0.03)); wreath(b, 0.24 + 0.06 * hash(i, 41), x, 0.4, 0, -4, 900 + i); });
    return b.parts();
  },
});

/** The jeweller's high shelf: mantel and bracket clocks for sale along a bracketed board under the cornice. */
prop({
  id: "clock-shelf", items: ["shop-jeweller"], size: [2.0, 0.66, 0.3], place: "hung", tris: 1800,
  parts: () => {
    const b = byMat(), cases: ReturnType<typeof box>[] = [], dials: ReturnType<typeof box>[] = [], brass: ReturnType<typeof box>[] = [];
    b.add("wood-dark", union(box(2.0, 0.03, 0.3, 0, 0.18, 0), box(0.03, 0.18, 0.22, -0.8, 0, -0.04), box(0.03, 0.18, 0.22, 0.8, 0, -0.04)));
    [-0.72, -0.3, 0.12, 0.55].forEach((x, i) => {
      const w = 0.22 + 0.1 * hash(i, 51), h = 0.26 + 0.16 * hash(i, 52);
      cases.push(box(w, h, 0.14, x, 0.21, 0), box(w + 0.03, 0.025, 0.16, x, 0.21, 0));
      dials.push(zcyl(0.065, 0.008).move(x, 0.21 + h * 0.62, 0.074));
      brass.push(zcyl(0.072, 0.006).move(x, 0.21 + h * 0.62, 0.071));
    });
    b.add("wood-mid", union(...cases));
    b.add("enamel", union(...dials));
    b.add("brass", union(...brass));
    return b.parts();
  },
});

export const KIT_UPPER = true;

/** The upper run along one wall: pieces from `list` in turn from u0 to u1, hung so their tops stop under the cornice
 *  (at least `floor` up, clear of the tallest furniture under them); "-" in the list is 0.8 m of bare wall. Returns [id, u (middle), y] per piece. */
export function upperRun(list: string[], u0: number, u1: number, h: number, sizes: (id: string) => [number, number, number], seed: number, floor = 2.95): [string, number, number][] {
  const out: [string, number, number][] = [];
  let u = u0, i = Math.floor(hash(seed, 61) * list.length);
  while (true) {
    const id = list[i++ % list.length];
    if (id === "-") { u += 0.8; if (u > u1) break; continue; } // a stretch of bare wall
    const [w, sh] = sizes(id);
    if (u + w > u1) break;
    const y = id === "ad-frieze" ? Math.max(floor, h - 0.25 - sh) : Math.max(floor, h - 0.1 - sh);
    out.push([id, u + w / 2, y]);
    u += w + 0.03;
  }
  return out;
}
