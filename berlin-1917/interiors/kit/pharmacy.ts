// The Apotheke and the Drogerie (research/catalogue: shop-pharmacy, 9 storefronts on the three streets read, always on
// a good corner; shop-drugstore, 14). The pharmacy's Offizin: carved dark shelving round the walls, small drawers below
// with enamel labels, the white porcelain Standgefäße (jars with their black cartouches) on the shelves above, the
// glass bottles on the top shelf; the Rezeptur, the dispensing counter with its glazed top and a beam balance; the
// poison cabinet behind it. The drugstore keeps the drawers and sells from tins, bottles and packets: soap, paints,
// photographic chemicals. In the war: drugs short (no more quinine from the Dutch, no cotton for dressings), paper
// bandages, and the Kriegsersatz preparations on the shelves. interiors/pharmacy.ts lays both rooms out.
import { box, hash, lathe, post, rodX, union, zcyl } from "./geo";
import { prop } from "./prop";

const PHARMACY = ["shop-pharmacy"], DRUG = ["shop-drugstore"];
const W = 2.4, H = 3.0, D = 0.45, BASE = 0.95, UD = 0.3; // the wall unit: its width, height, depth, the drawer base, the shelves' depth

/** The wall unit's carcass: the drawer base with its labels and knobs, the shelves over it, the cornice. */
function carcass() {
  const labels = [], knobs = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) {
    const x = -W / 2 + 0.15 + j * 0.3, y = 0.14 + i * 0.2;
    labels.push(box(0.12, 0.04, 0.004, x, y + 0.07, D / 2));
    knobs.push(box(0.03, 0.03, 0.02, x, y + 0.02, D / 2));
  }
  const z0 = -D / 2 + UD / 2, shelves = [0, 1, 2, 3].map((k) => box(W - 0.1, 0.025, UD, 0, BASE + 0.48 * k, z0));
  return {
    wood: union(box(W, BASE, D, 0, 0, 0), box(W, H - BASE - 0.12, 0.02, 0, BASE, -D / 2 + 0.01), box(0.05, H - BASE - 0.12, UD, -W / 2 + 0.025, BASE, z0), box(0.05, H - BASE - 0.12, UD, W / 2 - 0.025, BASE, z0), ...shelves, box(W, 0.12, D, 0, H - 0.12, 0)),
    labels: union(...labels),
    knobs: union(...knobs),
    shelfY: (k: number) => BASE + 0.48 * k + 0.025,
    z: z0,
  };
}

const JAR: [number, number][] = [[0, 0], [0.07, 0], [0.075, 0.04], [0.075, 0.2], [0.06, 0.23], [0.04, 0.24], [0.045, 0.26], [0.02, 0.3], [0, 0.31]];
const BOTTLE: [number, number][] = [[0, 0], [0.05, 0], [0.05, 0.2], [0.02, 0.26], [0.02, 0.3], [0.026, 0.31], [0, 0.32]];

/** The Offizin's shelving, 2.4 m of it: 32 drawers, three shelves of porcelain jars, the top shelf in brown and green glass. */
prop({
  id: "apothecary-wall", items: [...PHARMACY, "drawer-wall", "standgefaesse"], size: [W, H, D], place: "wall", tris: 9000,
  parts: () => {
    const c = carcass(), jars = [], cartouches = [], amber = [], green = [];
    for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) {
      if (hash(k, j, 61) < 0.1) continue; // one taken down to dispense from
      const x = -W / 2 + 0.17 + j * 0.257, y = c.shelfY(k), z = c.z + 0.02;
      if (k < 3) { jars.push(lathe(JAR, x, y, z, 10)); cartouches.push(box(0.085, 0.055, 0.006, x, y + 0.1, z + 0.073)); }
      else (hash(k, j, 62) < 0.5 ? amber : green).push(lathe(BOTTLE, x, y, z, 10));
    }
    return [
      { mat: "wood-dark", solid: c.wood },
      { mat: "enamel", solid: union(c.labels, ...jars), overlap: true },
      { mat: "brass", solid: c.knobs, overlap: true },
      { mat: "iron", solid: union(...cartouches), overlap: true },
      { mat: "glass-amber", solid: union(...amber), overlap: true },
      { mat: "glass-green", solid: union(...green), overlap: true },
    ];
  },
});

/** The Drogerie's shelving: the same drawers, and on the shelves tins (soap powder, paint, cocoa), bottles and packets. */
prop({
  id: "drugstore-wall", items: [...DRUG, "drawer-wall"], size: [W, H, D], place: "wall", tris: 7000,
  parts: () => {
    const c = carcass(), tins: Record<string, ReturnType<typeof box>[]> = { "enamel-blue": [], "paint-red": [], "paint-green": [], zinc: [] };
    const packets = [], bottles = [];
    const tinMats = Object.keys(tins);
    for (let k = 0; k < 4; k++) {
      let x = -W / 2 + 0.12;
      while (x < W / 2 - 0.15) {
        const r = hash(k, Math.round(x * 100), 63), y = c.shelfY(k), z = c.z + 0.02;
        if (r < 0.45) { const rad = 0.05 + 0.03 * hash(k, x, 64), h = 0.12 + 0.12 * hash(k, x, 65); tins[tinMats[Math.floor(hash(k, x, 66) * 4)]].push(lathe([[0, 0], [rad, 0], [rad, h], [0, h]], x + rad, y, z, 10)); x += 2 * rad + 0.03; }
        else if (r < 0.75) { const w = 0.1 + 0.08 * hash(k, x, 67), h = 0.16 + 0.14 * hash(k, x, 68); packets.push(box(w, h, 0.12, x + w / 2, y, z)); x += w + 0.02; }
        else if (r < 0.92) { bottles.push(lathe(BOTTLE, x + 0.05, y, z, 10)); x += 0.13; }
        else x += 0.15; // a gap: sold, or not delivered
      }
    }
    return [
      { mat: "wood-dark", solid: c.wood },
      { mat: "enamel", solid: c.labels, overlap: true },
      { mat: "brass", solid: c.knobs, overlap: true },
      ...Object.entries(tins).filter(([, s]) => s.length).map(([mat, s]) => ({ mat, solid: union(...s), overlap: true })),
      { mat: "card", solid: union(...packets), overlap: true },
      { mat: "glass-amber", solid: union(...bottles), overlap: true },
    ];
  },
});

/** The Rezeptur: a counter 2.6 m long under marble, a glazed top at the back (the Aufsatz, the shelf for the day's
 *  prescriptions), a beam balance and a mortar at the dispensing end. */
prop({
  id: "dispensing-counter", items: [...PHARMACY, "rezeptur"], size: [2.6, 1.78, 0.74], place: "floor", tris: 3200,
  parts: () => {
    const zb = -0.27, bx = 0.75; // the Aufsatz's plane, the balance's place
    const posts = [-1.27, -0.42, 0.42, 1.27].map((x) => box(0.04, 0.72, 0.06, x, 0.99, zb));
    return [
      { mat: "wood-dark", solid: union(box(2.6, 0.95, 0.7, 0, 0, 0), ...posts, box(2.6, 0.07, 0.14, 0, 1.71, zb), box(2.5, 0.02, 0.18, 0, 1.36, zb + 0.04)) },
      { mat: "marble", solid: box(2.6, 0.04, 0.74, 0, 0.95, 0), overlap: true },
      { mat: "glass", solid: union(...[-0.845, 0, 0.845].map((x) => box(0.78, 0.66, 0.006, x, 1.02, zb))), overlap: true },
      {
        mat: "brass",
        solid: union(post(0.01, 0.42, bx, 0.99, 0.12), rodX(0.006, 0.42, bx, 1.41, 0.12), ...[-0.2, 0.2].flatMap((dx) => [post(0.002, 0.2, bx + dx, 1.2, 0.12), lathe([[0, 0], [0.065, 0.006], [0.075, 0.025], [0.07, 0.027], [0, 0.01]], bx + dx, 1.18, 0.12, 14)])),
        overlap: true,
      },
      { mat: "stoneware", solid: union(lathe([[0, 0], [0.08, 0], [0.1, 0.06], [0.1, 0.12], [0.085, 0.12], [0.07, 0.03], [0, 0.03]], -0.9, 0.99, 0.15, 14), box(0.03, 0.2, 0.03, -0.87, 1.04, 0.15)), overlap: true },
    ];
  },
});

/** The poison cabinet (Giftschrank): a small locked cupboard behind the counter, its door banded in red. */
prop({
  id: "poison-cabinet", items: [...PHARMACY, "giftschrank"], size: [0.55, 0.75, 0.3], place: "hung", tris: 200,
  parts: () => [
    { mat: "wood-dark", solid: box(0.55, 0.75, 0.28, 0, 0, -0.01) },
    { mat: "paint-red", solid: box(0.4, 0.08, 0.01, 0, 0.55, 0.135), overlap: true },
    { mat: "brass", solid: box(0.04, 0.06, 0.02, 0.2, 0.33, 0.14), overlap: true },
  ],
});

// The window. A pharmacy stood its two show globes (Schaugefäße) in the window, coloured water in blown glass that the
// lamp behind lit into the street; under them, in the war, what a family sent to the front: remedies packed to go in a
// field-post letter, and the paper bandages that stood in for cotton. The drugstore's window is the same goods with soap.

/** A show globe: a blown globe of coloured water on a turned brass foot, a stoppered neck; 0.74 m. Ruby and green. */
for (const [id, glass] of [["show-globe-ruby", "glass-ruby"], ["show-globe-green", "glass-green"]] as const)
  prop({
    id, items: [...PHARMACY, "schaugefaess"], size: [0.34, 0.74, 0.34], place: "on", tris: 1100,
    parts: () => [
      { mat: "brass", solid: lathe([[0, 0], [0.12, 0], [0.12, 0.02], [0.05, 0.05], [0.035, 0.16], [0, 0.16]], 0, 0, 0, 20) },
      { mat: glass, solid: lathe([[0, 0.15], [0.06, 0.16], [0.15, 0.26], [0.17, 0.36], [0.15, 0.46], [0.06, 0.55], [0.04, 0.6], [0, 0.6]], 0, 0, 0, 24), overlap: true },
      { mat: "glass", solid: lathe([[0, 0.59], [0.045, 0.59], [0.04, 0.64], [0.05, 0.66], [0, 0.74]], 0, 0, 0, 16), overlap: true },
    ],
  });

/** Paper bandages (Papierbinden): cotton went to the army, so the shops sold dressings of crêped paper. Ten rolls
 *  stacked 4-3-2-1, ends to the street, each in its blue band. */
prop({
  id: "bandage-rolls", items: [...PHARMACY, ...DRUG, "bandages"], size: [0.38, 0.3, 0.11], place: "on", tris: 900,
  parts: () => {
    const rolls = [], bands = [];
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++) {
      const x = (i - (3 - r) / 2) * 0.085, y = 0.04 + r * 0.07;
      rolls.push(zcyl(0.04, 0.11).move(x, y, 0));
      bands.push(zcyl(0.0405, 0.035).move(x, y, 0));
    }
    return [{ mat: "paper", solid: union(...rolls) }, { mat: "paper-blue", solid: union(...bands), overlap: true }];
  },
});

/** Field-post packs: the small cartons of lice powder, foot powder and cough drops made to go in a field-post letter
 *  (Feldpostpackungen), stacked 5-4-3 with a red band, the show card standing behind with its heading and lines. */
prop({
  id: "feldpost-packs", items: [...PHARMACY, ...DRUG, "field-post"], size: [0.66, 0.62, 0.16], place: "on", where: "set", tris: 400,
  parts: () => {
    const packs = [], bands = [];
    [5, 4, 3].forEach((n, r) => {
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 0.13, y = r * 0.095;
        packs.push(box(0.12, 0.09, 0.07, x, y, 0.03));
        bands.push(box(0.121, 0.025, 0.071, x, y + 0.035, 0.03));
      }
    });
    return [
      { mat: "card", solid: union(...packs) },
      { mat: "paint-red", solid: union(...bands), overlap: true },
      { mat: "paper", solid: box(0.44, 0.62, 0.008, 0, 0, -0.06) },
      { mat: "cloth-black", solid: union(box(0.34, 0.045, 0.002, 0, 0.52, -0.055), ...[0, 1, 2].map((k) => box(0.3, 0.012, 0.002, 0, 0.33 + k * 0.045, -0.055))), overlap: true },
    ];
  },
});

/** War soap: the ration's cakes of soap, more clay than fat, in paper wrappers stacked brick-fashion 6-5-4-3-2. */
prop({
  id: "soap-pyramid", items: [...DRUG, "soap"], size: [0.56, 0.18, 0.07], place: "on", tris: 300,
  parts: () => {
    const a = [], b = [];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 6 - r; i++) (i % 2 ? b : a).push(box(0.088, 0.034, 0.06, (i - (5 - r) / 2) * 0.092, r * 0.036, 0));
    return [{ mat: "paper", solid: union(...a) }, { mat: "paper-blue", solid: union(...b) }];
  },
});

export const KIT_PHARMACY = true;
