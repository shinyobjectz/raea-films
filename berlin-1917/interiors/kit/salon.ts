// Salon kit: the street room of the bel étage, the good flat on the front building's first floor (research/catalogue/
// rooms.ts "salon"). Neo-Rococo plush seating round the sofa, the upright piano in black with its candle sconces and
// the music on the stand, a vitrine of porcelain, the Norfolk pine on its stand and the Makart bouquet in the corners,
// oil paintings; in the war, the newspaper map of the fronts with its little flags, and the son's photograph in crape.
import type { Solid } from "raea/3d";
import { ball, box, lathe, post, rbox, rodX, taper, union } from "./geo";
import { prop } from "./prop";

/** The upright piano (Pianino) in black, the keyboard's shelf on its two consoles, candle sconces either side of the
 *  music desk, a sheet of music open on it; the round stool in front. */
prop({
  id: "piano", items: ["piano"], size: [1.48, 1.3, 1.3], place: "wall", tris: 3200,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(box(1.48, 1.27, 0.5, 0, 0, -0.4), box(1.52, 0.04, 0.54, 0, 1.27, -0.4), box(1.42, 0.08, 0.2, 0, 0.66, -0.05), box(1.42, 0.03, 0.06, 0, 0.74, -0.13), post(0.03, 0.66, -0.66, 0, -0.02), post(0.03, 0.66, 0.66, 0, -0.02), box(1.3, 0.3, 0.02).rotate(-8, 0, 0).move(0, 0.86, -0.13)) },
    { mat: "paint-white" as const, solid: box(1.24, 0.02, 0.14, 0, 0.74, -0.03), overlap: true },
    { mat: "cloth-black" as const, solid: union(...Array.from({ length: 36 }, (_, i) => i).filter((i) => [1, 3, 6, 8, 10].includes(i % 12)).map((i) => box(0.012, 0.012, 0.08, -0.6 + (i * 1.2) / 36, 0.76, -0.06))), overlap: true },
    { mat: "paper" as const, solid: box(0.42, 0.28, 0.006).rotate(-8, 0, 0).move(0, 0.89, -0.11), overlap: true },
    { mat: "brass" as const, solid: union(...[-1, 1].flatMap((s) => [rodX(0.006, 0.16, s * 0.6, 1.0, -0.1), lathe([[0, 0], [0.03, 0], [0.03, 0.012], [0.008, 0.02], [0, 0.02]], s * 0.68, 1.0, -0.08)])), overlap: true },
    { mat: "wax" as const, solid: union(post(0.01, 0.12, -0.68, 1.02, -0.08), post(0.01, 0.12, 0.68, 1.02, -0.08)), overlap: true },
    // the stool: a turned column on three feet, a round plush seat
    { mat: "wood-dark" as const, solid: union(post(0.03, 0.42, 0, 0.04, 0.45), ...[0, 120, 240].map((a) => box(0.03, 0.04, 0.2).move(0, 0, 0.1).rotate(0, a, 0).move(0, 0, 0.45))) },
    { mat: "plush" as const, solid: lathe([[0, 0], [0.17, 0], [0.18, 0.04], [0.15, 0.07], [0, 0.07]], 0, 0.46, 0.45), overlap: true },
  ],
});

/** An armchair of the salon suite (Fauteuil): a carved frame on cabriole-ish legs, a buttoned plush seat and back. */
prop({
  id: "salon-chair", items: ["salon-suite"], size: [0.7, 1.02, 0.7], place: "floor", tris: 2400,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => taper(0.028, 0.02, 0.36, sx * 0.29, 0, sz * 0.27))), ...[-1, 1].map((s) => box(0.05, 0.05, 0.56, s * 0.31, 0.62, 0.0)), box(0.62, 0.06, 0.06, 0, 0.98, -0.3)) },
    { mat: "plush" as const, solid: union(rbox(0.6, 0.14, 0.56, 0.05, 0, 0.36, 0.02), rbox(0.56, 0.5, 0.12, 0.05).rotate(-6, 0, 0).move(0, 0.5, -0.27), ...[-1, 1].map((s) => rbox(0.08, 0.05, 0.48, 0.02, s * 0.31, 0.67, 0.02))), overlap: true },
  ],
});

/** A vitrine: a cabinet glazed on three sides on its short legs, glass shelves of porcelain cups, a figurine, a plate
 *  stood on edge. */
prop({
  id: "salon-vitrine", items: ["vitrine"], size: [0.85, 1.78, 0.42], place: "wall", tris: 3000,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.04, 1.62, 0.04, sx * 0.4, 0.1, sz * 0.18))), box(0.88, 0.1, 0.44, 0, 1.68, 0), box(0.84, 0.12, 0.4, 0, 0.1, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.04, 0.1, 0.04, sx * 0.38, 0, sz * 0.16)))) },
    { mat: "glass-plate" as const, solid: union(box(0.76, 1.48, 0.005, 0, 0.21, 0.19), box(0.005, 1.48, 0.34, -0.395, 0.21, 0), box(0.005, 1.48, 0.34, 0.395, 0.21, 0), box(0.76, 0.008, 0.34, 0, 0.7, 0), box(0.76, 0.008, 0.34, 0, 1.15, 0)), overlap: true },
    { mat: "enamel" as const, overlap: true, solid: union(...[0.23, 0.71, 1.16].flatMap((y, r) => [-0.24, -0.08, 0.08, 0.24].map((x, i) => (i + r) % 3 === 0 ? lathe([[0, 0], [0.05, 0], [0.06, 0.012], [0.11, 0.02], [0, 0.02]], x, y, 0.02) : lathe([[0, 0], [0.025, 0], [0.04, 0.06], [0.038, 0.065], [0, 0.065]], x, y, 0.02))), box(0.2, 0.2, 0.012, 0, 0.71, -0.12)) },
  ],
});

/** The Norfolk pine (Zimmertanne) on its turned plant stand: whorls of flat branches, smaller toward the top. */
prop({
  id: "araucaria", items: ["araucaria"], size: [0.8, 1.7, 0.8], place: "corner", tris: 2600,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(lathe([[0, 0], [0.18, 0], [0.18, 0.03], [0.05, 0.08], [0.04, 0.6], [0.16, 0.62], [0.16, 0.66], [0, 0.66]])) },
    { mat: "terracotta" as const, solid: lathe([[0, 0], [0.1, 0], [0.13, 0.16], [0.14, 0.17], [0, 0.17]], 0, 0.66, 0) },
    { mat: "wood-raw" as const, solid: post(0.012, 0.85, 0, 0.8, 0) },
    { mat: "leaf" as const, overlap: true, solid: union(...[0, 1, 2, 3, 4].flatMap((i) => [0, 1, 2, 3, 4, 5].map((k) => { const len = 0.36 - i * 0.06; return box(0.07, 0.012, len).move(0, 0, len / 2).rotate(8, k * 60 + i * 23, 0).move(0, 0.92 + i * 0.16, 0); }))) },
  ],
});

/** The Makart bouquet: dried grasses, bulrushes, palm fronds and peacock feathers fanned from a tall vase on the floor. */
prop({
  id: "makart-bouquet", items: ["makart-bouquet"], size: [0.6, 1.6, 0.6], place: "corner", tris: 2200,
  parts: () => {
    const stem = (a: number, b: number, len: number) => box(0.008, len, 0.008).rotate(a, 0, 0).rotate(0, b, 0).move(0, 0.55, 0);
    return [
      { mat: "stoneware" as const, solid: lathe([[0, 0], [0.11, 0], [0.15, 0.22], [0.1, 0.48], [0.12, 0.56], [0, 0.56]]) },
      { mat: "straw" as const, overlap: true, solid: union(...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => stem(10 + (i % 4) * 7, i * 30, 0.75 + (i % 3) * 0.15))) },
      { mat: "cloth-brown" as const, overlap: true, solid: union(...[0, 1, 2, 3, 4].map((i) => post(0.014, 0.12, 0, 0, 0).rotate(8 + i * 4, i * 72, 0).move(Math.sin((i * 72 * Math.PI) / 180) * 0.12, 1.2 + (i % 2) * 0.12, Math.cos((i * 72 * Math.PI) / 180) * 0.12))) },
      { mat: "leaf" as const, overlap: true, solid: union(...[0, 1, 2].map((i) => box(0.16, 0.5, 0.01).rotate(18, i * 120 + 20, 0).move(0, 0.75, 0))) },
    ];
  },
});

/** An oil painting in a deep gilt frame: a lake of the Mark under a pale sky, pines on the far shore (the Berlin taste
 *  after Leistikow), its varnish gone amber. The stube's oleograph shows the wall's paper through its frame; this one
 *  is a picture. */
prop({
  id: "salon-painting", items: ["oil-painting"], size: [1.0, 0.8, 0.09], place: "hung", tris: 900,
  parts: () => {
    const pines = [-0.3, -0.24, -0.2, -0.11, 0.02, 0.07, 0.19, 0.26, 0.31].map((x, i) => taper(0.026 + (i % 3) * 0.008, 0.002, 0.09 + ((i * 7) % 5) * 0.03, 0, 0, 0).scale(1, 1, 0.08).move(x, 0.43, -0.012));
    return [
      { mat: "brass" as const, solid: union(box(1.0, 0.8, 0.07, 0, 0, 0).minus(box(0.8, 0.6, 0.2, 0, 0.1, 0)), box(1.0, 0.04, 0.09, 0, 0, 0), box(1.0, 0.04, 0.09, 0, 0.76, 0)) },
      { mat: "wood-dark" as const, solid: box(0.8, 0.6, 0.01, 0, 0.1, -0.025) },
      { mat: "cloth-cream" as const, solid: box(0.78, 0.3, 0.004, 0, 0.4, -0.018), overlap: true },
      { mat: "wood-grey" as const, solid: box(0.78, 0.05, 0.004, 0, 0.42, -0.014), overlap: true },
      { mat: "enamel-blue" as const, solid: box(0.78, 0.13, 0.004, 0, 0.27, -0.016), overlap: true },
      { mat: "leaf" as const, solid: union(...pines, taper(0.09, 0.01, 0.2, 0, 0, 0).scale(1, 1, 0.03).move(0.3, 0.12, -0.012), taper(0.07, 0.008, 0.16, 0, 0, 0).scale(1, 1, 0.03).move(0.22, 0.13, -0.012)), overlap: true },
      { mat: "cloth-brown" as const, solid: box(0.78, 0.15, 0.004, 0, 0.12, -0.016), overlap: true },
    ];
  },
});

/** The stucco rose in the middle of the ceiling that the chandelier hangs from: rings of moulding round a boss, and a
 *  wreath of leaves (Blattkranz) between them: the mouldings in white over the ceiling's distemper (in the ceiling's
 *  own plaster it vanished under the chandelier's light), the leaves picked out in gilt. */
prop({
  id: "ceiling-rose", items: ["ceiling-stucco"], size: [1.1, 0.07, 1.1], place: "ceiling", tris: 1600,
  parts: () => [
    { mat: "paint-white" as const, overlap: true, solid: lathe([[0, -0.06], [0.1, -0.06], [0.13, -0.035], [0.22, -0.03], [0.24, -0.015], [0.4, -0.012], [0.42, -0.028], [0.47, -0.03], [0.5, -0.012], [0.55, -0.006], [0.55, 0], [0, 0]], 0, 0, 0, 32) },
    { mat: "brass" as const, overlap: true, solid: union(...Array.from({ length: 16 }, (_, i) => box(0.05, 0.02, 0.11).move(0, -0.035, 0.31).rotate(0, i * 22.5, 0))) },
  ],
});

/** The home front's war map: a newspaper map of the fronts pinned to the wall, the line traced with little flags on
 *  pins, moved as the reports came. */
prop({
  id: "war-map", items: ["war-map"], size: [0.9, 0.62, 0.03], place: "hung", tris: 600,
  parts: () => [
    { mat: "paper" as const, solid: box(0.9, 0.62, 0.004, 0, 0, 0) },
    { mat: "paper-blue" as const, solid: union(box(0.18, 0.2, 0.002, -0.33, 0.38, 0.003), box(0.12, 0.1, 0.002, -0.38, 0.06, 0.003)) },
    { mat: "paint-red" as const, solid: union(...Array.from({ length: 9 }, (_, i) => ball(0.007).move(-0.12 + i * 0.03 + Math.sin(i * 1.7) * 0.015, 0.52 - i * 0.05, 0.01))) },
    { mat: "cloth-black" as const, solid: union(...[0, 3, 6].map((i) => box(0.025, 0.016, 0.002, -0.1 + i * 0.03 + Math.sin(i * 1.7) * 0.015, 0.53 - i * 0.05, 0.016))) },
  ],
});

/** The good flat's tiled stove (Berliner Kachelofen) as the bel étage had it: stoked from the corridor behind the wall
 *  (a Hinterlader, so the maid never came into the salon), so it shows no fire door and no glow. Cream glazed tiles,
 *  each raised with a relief panel, on pale joints; a moulded plinth, the warming niche (Röhre) behind two brass doors,
 *  a cornice at mid-height and at the top, and a crown with an urn. the director read the stube's plain white column, its
 *  fire door glowing, as a fireplace (a review note). */
prop({
  id: "salon-stove", items: ["stove-hinterlader"], size: [0.92, 2.8, 0.68], place: "corner", tris: 5200,
  parts: () => {
    const tiles: Solid[] = [], relief: Solid[] = [];
    // a face of tiles: nx across by ny up, from y0, w by h each, on the plane z (front) or x (sides)
    const face = (side: "front" | "left" | "right", y0: number, nx: number, ny: number, w: number, h: number, half: number, skip: (i: number, j: number) => boolean = () => false) => {
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        if (skip(i, j)) continue;
        const u = (i - (nx - 1) / 2) * w, y = y0 + j * h + 0.004;
        if (side === "front") { tiles.push(box(w - 0.008, h - 0.008, 0.022, u, y, half)); relief.push(box(w - 0.06, h - 0.06, 0.01, u, y + 0.026, half + 0.014)); }
        else { const x = side === "left" ? -half : half; tiles.push(box(0.022, h - 0.008, w - 0.008, x, y, u)); relief.push(box(0.01, h - 0.06, w - 0.06, x + (side === "left" ? -0.014 : 0.014), y + 0.026, u)); }
      }
    };
    // the lower body 0.8 x 1.04 x 0.58 (4 x 4 tiles in front, 3 x 4 a side); the niche takes the two middle tiles of row 3
    face("front", 0.16, 4, 4, 0.2, 0.26, 0.29, (i, j) => j === 2 && (i === 1 || i === 2));
    face("left", 0.16, 3, 4, 0.193, 0.26, 0.4); face("right", 0.16, 3, 4, 0.193, 0.26, 0.4);
    // the upper body 0.72 x 0.92 x 0.5 (4 x 4 in front, 3 x 4 a side)
    face("front", 1.32, 4, 4, 0.18, 0.23, 0.25); face("left", 1.32, 3, 4, 0.167, 0.23, 0.36); face("right", 1.32, 3, 4, 0.167, 0.23, 0.36);
    return [
      { mat: "stove-joint" as const, solid: union(box(0.79, 1.04, 0.57, 0, 0.16, 0), box(0.71, 0.92, 0.49, 0, 1.32, 0)) },
      { mat: "stove-glaze" as const, overlap: true, solid: union(
        // plinth: a step and a roll moulding
        box(0.9, 0.1, 0.66, 0, 0, 0), box(0.86, 0.06, 0.62, 0, 0.1, 0),
        // mid cornice and the top cornice, each two steps
        box(0.88, 0.05, 0.66, 0, 1.2, 0), box(0.84, 0.07, 0.62, 0, 1.25, 0),
        box(0.8, 0.05, 0.58, 0, 2.24, 0), box(0.88, 0.07, 0.66, 0, 2.29, 0),
        // the crown: an attic with a curved top, an urn on it
        box(0.6, 0.16, 0.42, 0, 2.36, 0), box(0.5, 0.05, 0.36, 0, 2.52, 0),
        lathe([[0, 0], [0.07, 0], [0.04, 0.03], [0.09, 0.12], [0.05, 0.2], [0.03, 0.22], [0, 0.23]], 0, 2.57, 0, 16),
        ...tiles) },
      { mat: "stove-glaze" as const, overlap: true, solid: union(...relief) },
      // the warming niche's two brass doors, pierced, with their knobs
      { mat: "brass" as const, overlap: true, solid: union(box(0.19, 0.24, 0.012, -0.1, 0.69, 0.295), box(0.19, 0.24, 0.012, 0.1, 0.69, 0.295), ball(0.012).move(-0.03, 0.81, 0.31), ball(0.012).move(0.03, 0.81, 0.31)) },
      { mat: "iron" as const, overlap: true, solid: union(...[0, 1, 2].flatMap((k) => [-0.1, 0.1].map((x) => box(0.12, 0.012, 0.004, x, 0.74 + k * 0.05, 0.302)))) },
    ];
  },
});

/** The double door to the Berliner Zimmer (Flügeltür), set in the back wall's opening by the furnisher: two panelled
 *  leaves in white lacquer, brass levers, the architrave round them and an overdoor with its cornice, so the door rises
 *  most of the 3.9 m wall. The leaves stand in the wall's face over the opening (1.4 x 2.9 m), so nothing shows black. */
prop({
  id: "salon-door", items: ["door-panel"], size: [1.76, 3.4, 0.1], place: "wall", tris: 900,
  parts: () => {
    const W = 1.4, H = 2.9, leaf: Solid[] = [], panel: Solid[] = [];
    for (const s of [-1, 1]) {
      const x = (s * W) / 4;
      leaf.push(box(W / 2 - 0.006, H, 0.045, x, 0, -0.045));
      for (const [y, h] of [[0.16, 0.62], [0.95, 1.25], [2.38, 0.36]]) panel.push(box(W / 2 - 0.2, h, 0.012, x, y, -0.016));
    }
    return [
      { mat: "paint-white" as const, solid: union(...leaf,
        // architrave: jambs and head, 12 cm, stood off the wall
        box(0.12, H + 0.12, 0.04, -W / 2 - 0.06, 0, -0.03), box(0.12, H + 0.12, 0.04, W / 2 + 0.06, 0, -0.03), box(W + 0.24, 0.12, 0.04, 0, H, -0.03),
        // the overdoor: a frieze panel and a cornice of two steps over it
        box(W + 0.24, 0.24, 0.025, 0, H + 0.12, -0.035), box(W + 0.36, 0.06, 0.07, 0, H + 0.36, -0.015), box(W + 0.44, 0.06, 0.1, 0, H + 0.42, 0.0)) },
      { mat: "plaster-ceiling" as const, overlap: true, solid: union(...panel, box(W - 0.1, 0.14, 0.01, 0, H + 0.17, -0.02)) },
      { mat: "brass" as const, overlap: true, solid: union(...[-1, 1].flatMap((s) => [box(0.025, 0.12, 0.012, s * 0.06, 1.0, -0.017), box(0.11, 0.018, 0.02, s * 0.11, 1.08, -0.005)])) },
    ];
  },
});

/** A corner étagère (whatnot): four quarter-round shelves on three turned posts, porcelain and a figurine on each. */
prop({
  id: "etagere", items: ["etagere"], size: [0.56, 1.45, 0.56], place: "corner", tris: 2600,
  parts: () => {
    const q = (y: number) => box(0.5, 0.02, 0.5, 0, y, 0).intersect(lathe([[0, -1], [0.5, -1], [0.5, 1], [0, 1]], -0.25, y, -0.25, 24));
    const cups = [0.32, 0.66, 1.0, 1.34].flatMap((y, k) => [[-0.12, 0.12], [0.05, -0.08], [0.12, 0.14]].map(([x, z], i) => (i + k) % 3 === 0
      ? lathe([[0, 0], [0.02, 0], [0.035, 0.08], [0.02, 0.12], [0, 0.12]], x, y + 0.02, z, 12)
      : lathe([[0, 0], [0.02, 0], [0.032, 0.045], [0.03, 0.05], [0, 0.05]], x, y + 0.02, z, 12)));
    return [
      { mat: "wood-dark" as const, solid: union(q(0.3), q(0.64), q(0.98), q(1.32), post(0.014, 1.45, -0.24, 0, -0.24), post(0.014, 1.38, 0.2, 0, -0.24), post(0.014, 1.38, -0.24, 0, 0.2)) },
      { mat: "enamel" as const, overlap: true, solid: union(...cups) },
    ];
  },
});

/** The flower table (Blumentisch) under the window side: a zinc-lined tray on four legs, its pots of winter green and a
 *  cyclamen, an ivy trained up a little trellis. */
prop({
  id: "flower-table", items: ["flower-table"], size: [1.0, 1.25, 0.45], place: "wall", tris: 3600,
  parts: () => {
    const pots = [-0.36, -0.12, 0.12, 0.36].map((x, i) => lathe([[0, 0], [0.06, 0], [0.075, 0.13], [0.08, 0.14], [0, 0.14]], x, 0.72, (i % 2) * 0.06 - 0.03, 12));
    const green = [-0.36, -0.12, 0.12, 0.36].flatMap((x, i) => [0, 1, 2, 3, 4].map((k) => box(0.11, 0.008, 0.05).rotate(25 + k * 6, k * 72 + i * 20, 0).move(x, 0.88 + (k % 2) * 0.05, (i % 2) * 0.06 - 0.03)));
    return [
      { mat: "wood-dark" as const, solid: union(box(1.0, 0.04, 0.42, 0, 0.62, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => taper(0.02, 0.015, 0.62, sx * 0.46, 0, sz * 0.18)))) },
      { mat: "zinc" as const, solid: union(box(0.96, 0.08, 0.38, 0, 0.66, 0)) },
      { mat: "terracotta" as const, overlap: true, solid: union(...pots) },
      { mat: "leaf" as const, overlap: true, solid: union(...green, ...[0, 1, 2, 3].map((k) => box(0.012, 0.36, 0.012).rotate(0, 0, (k - 1.5) * 9).move(-0.36 + k * 0.02, 0.86, -0.18))) },
      { mat: "flower" as const, overlap: true, solid: union(...[0, 1, 2].map((k) => ball(0.025).move(0.12 + (k - 1) * 0.04, 0.97 + (k % 2) * 0.03, 0.04))) },
    ];
  },
});

/** A side table with its electric table lamp: a turned brass column under a silk shade, pleated, with a bead fringe. */
prop({
  id: "lamp-table", items: ["table-lamp"], size: [0.56, 1.42, 0.56], place: "wall", tris: 2600,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(lathe([[0, 0], [0.18, 0], [0.18, 0.02], [0.04, 0.05], [0.03, 0.66], [0.27, 0.68], [0.27, 0.71], [0, 0.71]], 0, 0, 0, 24)) },
    { mat: "brass" as const, overlap: true, solid: lathe([[0, 0], [0.08, 0], [0.08, 0.02], [0.02, 0.06], [0.03, 0.2], [0.012, 0.36], [0, 0.36]], 0, 0.71, 0, 16) },
    { mat: "plush" as const, overlap: true, solid: lathe([[0.08, 0], [0.22, 0], [0.215, 0.012], [0.095, 0.25], [0.08, 0.25]], 0, 1.07, 0, 16) },
    { mat: "brass" as const, overlap: true, solid: union(...Array.from({ length: 16 }, (_, k) => box(0.006, 0.06, 0.006).move(0, 0, 0.215).rotate(0, k * 22.5, 0).move(0, 1.02, 0))) },
  ],
});

/** The sewing table (Nähtisch) by the window: a box on tapering legs, the lid up on its workbasket, and in the war the grey
 *  wool on it, the needles in a half-made sock for the front. */
prop({
  id: "sewing-table", items: ["sewing-table", "knitting-front"], size: [0.62, 0.92, 0.44], place: "wall", tris: 1800,
  parts: () => [
    { mat: "wood-mid" as const, solid: union(box(0.6, 0.16, 0.4, 0, 0.56, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => taper(0.018, 0.012, 0.56, sx * 0.27, 0, sz * 0.17))), box(0.6, 0.015, 0.2, 0, 0.72, -0.19).rotate(-70, 0, 0).move(0, 0.2, -0.12)) },
    { mat: "wool" as const, overlap: true, solid: union(ball(0.05).move(0.14, 0.76, 0.05), ball(0.045).move(0.22, 0.755, -0.04), box(0.1, 0.03, 0.2).rotate(0, 30, 0).move(-0.08, 0.735, 0.04)) },
    { mat: "steel-bright" as const, overlap: true, solid: union(box(0.004, 0.004, 0.24).rotate(0, 30, 10).move(-0.08, 0.765, 0.04), box(0.004, 0.004, 0.24).rotate(0, 40, -8).move(-0.06, 0.765, 0.03)) },
  ],
});

/** A second chair of the suite: the tub-backed fauteuil in green plush, against the wall between the doors. */
prop({
  id: "fauteuil", items: ["fauteuil"], size: [0.72, 1.0, 0.7], place: "wall", tris: 2400,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => taper(0.026, 0.018, 0.34, sx * 0.29, 0, sz * 0.26)))) },
    { mat: "cloth-field" as const, overlap: true, solid: union(rbox(0.66, 0.16, 0.6, 0.05, 0, 0.34, 0.03), rbox(0.66, 0.6, 0.12, 0.05, 0, 0.42, -0.28), ...[-1, 1].map((s) => rbox(0.1, 0.36, 0.56, 0.04, s * 0.3, 0.42, 0.0))) },
  ],
});

/** The grandparents in oils: an oval portrait in a wide gilt frame, the sitter in black with a white collar against a
 *  warm brown ground, the face lit from the left as the painters did. (The first cut's black ground read as a black
 *  oval from across the room.) */
prop({
  id: "oval-portrait", items: ["oil-portrait"], size: [0.56, 0.7, 0.07], place: "hung", tris: 1100,
  parts: () => {
    // an oval disc of radius r (x) by r * 1.27 (y), t thick, centred on z: built about its own middle, so the turn's
    // sign doesn't matter
    const disc = (r: number, t: number, z: number, y = 0.35, sy = 1.27) => lathe([[0, -t / 2], [r, -t / 2], [r, t / 2], [0, t / 2]], 0, 0, 0, 32).rotate(90, 0, 0).scale(1, sy, 1).move(0, y, z);
    return [
      { mat: "brass" as const, solid: disc(0.275, 0.05, 0.035).minus(disc(0.205, 0.2, 0.035)) },
      { mat: "cloth-brown" as const, overlap: true, solid: disc(0.21, 0.01, 0.018) },
      // the sitter: black coat to the shoulders, a white collar, the face
      { mat: "cloth-black" as const, overlap: true, solid: union(box(0.26, 0.15, 0.008, 0, 0.13, 0.026), disc(0.13, 0.008, 0.026, 0.27, 0.45)) },
      { mat: "linen" as const, overlap: true, solid: box(0.07, 0.04, 0.006, 0, 0.29, 0.031) },
      { mat: "wax" as const, overlap: true, solid: disc(0.06, 0.008, 0.03, 0.38, 1.3) },
    ];
  },
});

export const KIT_SALON = true;
