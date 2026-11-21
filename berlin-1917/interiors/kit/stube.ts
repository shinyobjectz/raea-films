// Stube kit: the living room of the 1913-20 survey plates and the petty-bourgeois gute Stube (research/interiors.md,
// "The worker's Stube"): beds made up high, the round table under its cloth, the wardrobe with its swan-neck crest, the
// pier mirror between the windows, the Black Forest clock, photographs at one height, the tiled stove.
import { crossSection, sdf, type Solid } from "raea/3d";
import { ball, zcone, zcyl, box, folds, hash, lathe, post, rbox, rodX, rodZ, taper, union, ring } from "./geo";
import type { MatId } from "./mats";
import { prop } from "./prop";

/** A carved crest over a cabinet: a broken pediment, the swan neck the plates show touching the low ceilings. */
const crest = (w: number, h: number, y: number, z: number) =>
  crossSection.polygon([[-w / 2, 0], [w / 2, 0], [w / 2, h * 0.35], [w * 0.12, h], [w * 0.06, h * 0.7], [-w * 0.06, h * 0.7], [-w * 0.12, h], [-w / 2, h * 0.35]]).extrude(0.04).move(0, y, z - 0.02);

prop({
  id: "wardrobe", items: ["wardrobe"], size: [1.3, 2.35, 0.62], place: "wall", tris: 2500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.3, 2.05, 0.6), box(1.38, 0.1, 0.66, 0, 2.05, 0.01), box(1.38, 0.12, 0.66, 0, 0, 0.01), crest(1.1, 0.22, 2.15, 0.31), box(0.6, 1.7, 0.02, -0.31, 0.2, 0.305), box(0.6, 1.7, 0.02, 0.31, 0.2, 0.305), box(0.5, 0.6, 0.015, -0.31, 1.15, 0.318), box(0.5, 0.6, 0.015, 0.31, 1.15, 0.318), box(0.5, 0.6, 0.015, -0.31, 0.4, 0.318), box(0.5, 0.6, 0.015, 0.31, 0.4, 0.318)) },
    { mat: "brass", solid: union(ball(0.015).move(-0.05, 1.1, 0.33), ball(0.015).move(0.05, 1.1, 0.33)) },
  ],
});

prop({
  id: "vertiko", items: ["vertiko", "knick-knacks"], size: [1.1, 1.95, 0.5], place: "wall", tris: 4000,
  parts: () => {
    const nick: Solid[] = [];
    for (let i = 0; i < 6; i++) nick.push(lathe([[0, 0], [0.04, 0], [0.03 + hash(i, 1) * 0.02, 0.05 + hash(i, 2) * 0.12], [0.015, 0.08 + hash(i, 3) * 0.15], [0, 0.09 + hash(i, 3) * 0.15]], -0.45 + i * 0.18, 1.62, -0.05 + hash(i, 4) * 0.12, 16));
    return [
      { mat: "wood-dark", solid: union(box(1.1, 1.55, 0.48), box(1.16, 0.06, 0.52, 0, 1.55, 0.01), box(1.0, 0.18, 0.02, 0, 1.3, 0.245), box(0.48, 1.05, 0.02, -0.26, 0.15, 0.245), box(0.48, 1.05, 0.02, 0.26, 0.15, 0.245), box(1.1, 0.03, 0.04, 0, 1.83, -0.2), crest(1.0, 0.3, 1.61, -0.2)) },
      { mat: "lace", solid: box(1.0, 0.004, 0.42, 0, 1.612, 0.02) },
      { mat: "enamel", solid: union(...nick.slice(0, 3)) },
      { mat: "brass", solid: union(...nick.slice(3)) },
    ];
  },
});

prop({
  id: "pier-mirror", items: ["pier-mirror"], size: [0.7, 2.4, 0.3], place: "wall", tris: 1500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.7, 0.75, 0.3), box(0.66, 1.5, 0.05, 0, 0.75, -0.12), crest(0.66, 0.2, 2.25, -0.12)) },
    { mat: "glass-dark", solid: box(0.54, 1.36, 0.01, 0, 0.82, -0.09) },
  ],
});

// The room's tiled stove is a family now (kit/stoves.ts): seven stoked from the room, three from the corridor.

prop({
  id: "sofa", items: ["sofa-plush", "crochet"], size: [1.85, 1.15, 0.8], place: "wall", tris: 13500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.85, 0.12, 0.75, 0, 0.12, 0), box(1.85, 0.12, 0.08, 0, 0.95, -0.34), crest(0.9, 0.15, 1.02, -0.34), taper(0.03, 0.02, 0.12, -0.85, 0, 0.3), taper(0.03, 0.02, 0.12, 0.85, 0, 0.3), taper(0.03, 0.02, 0.12, -0.85, 0, -0.3), taper(0.03, 0.02, 0.12, 0.85, 0, -0.3)) },
    { mat: "plush", solid: union(sdf.box(1.6, 0.18, 0.62, 0.06).move(0, 0.33, 0.03).solid(0.05).simplify(0.0125), sdf.box(1.6, 0.6, 0.16, 0.06).move(0, 0.62, -0.29).solid(0.05).simplify(0.0125), sdf.box(0.14, 0.32, 0.7, 0.06).move(-0.85, 0.42, 0).solid(0.05).simplify(0.0125), sdf.box(0.14, 0.32, 0.7, 0.06).move(0.85, 0.42, 0).solid(0.05).simplify(0.0125)) },
    { mat: "lace", solid: union(box(0.4, 0.3, 0.004, -0.4, 0.62, -0.2), box(0.4, 0.3, 0.004, 0.4, 0.62, -0.2)) },
  ],
});

prop({
  // (the hand-dressed sets' round table, out of the furnisher's draw since the oblong tables below: the director, v7)
  id: "table-round", items: [], size: [1.05, 0.78, 1.05], place: "floor", tris: 2500,
  parts: () => [
    { mat: "wood-dark", solid: union(post(0.06, 0.6, 0, 0.1, 0), taper(0.25, 0.08, 0.12)) },
    // the white cloth to the floor, its fringe brushing the boards: the one bright thing in a dark Stube
    { mat: "linen", solid: union(lathe([[0, 0.74], [0.53, 0.7], [0.57, 0.02], [0.6, 0.02], [0.58, 0.2], [0.55, 0.7], [0.52, 0.76], [0, 0.76]], 0, 0, 0, 40)), overlap: true },
    { mat: "lace", solid: post(0.3, 0.004, 0, 0.765, 0), overlap: true },
  ],
});


/** The Stube's table as the survey photographs it (research/survey-tally.tsv: oblong in 5 of the 6 tables seen):
 *  a deal or oak table on four turned legs with an apron, under a cloth: white linen to the floor with a crocheted
 *  hem (3 of the 6), white to the knee with a lace edge, or the petty Stube's plush cloth with its fringe (the director on
 *  v7, "is this a real authentic table": the drum it replaces had no legs and no folds). The cloth hangs in folds
 *  from each edge (geo folds). Origin: the floor under the table's middle; its long side along x. */
const TW = 1.1, TD = 0.75, TOP = 0.76;
function stubeTable(drop: number, cloth: "linen" | "plush", hem: "lace" | "fringe" | null) {
  const W = TW, D = TD;
  const legs: Solid[] = [], turned: [number, number][] = [[0, 0], [0.024, 0], [0.028, 0.06], [0.019, 0.16], [0.027, 0.3], [0.03, 0.34], [0.02, 0.46], [0.026, 0.62], [0.028, 0.66], [0, 0.66]];
  for (const [x, z] of [[-W / 2 + 0.07, -D / 2 + 0.07], [W / 2 - 0.07, -D / 2 + 0.07], [-W / 2 + 0.07, D / 2 - 0.07], [W / 2 - 0.07, D / 2 - 0.07]]) legs.push(lathe(turned, x, 0, z, 10));
  const frame = union(box(W, 0.03, D, 0, TOP - 0.03, 0), box(W - 0.1, 0.08, D - 0.1, 0, TOP - 0.11, 0), ...legs);
  // the cloth: a sheet over the top and a fold-hung drop from each edge, 1.5 cm out so it clears the wood
  const o = 0.015, cw = W + 2 * o, cd = D + 2 * o, f = cloth === "plush" ? 16 : 24, a = cloth === "plush" ? 0.008 : 0.011;
  const side = (len: number, h: number) => folds(len, h, 0.003, f, a);
  const y0 = TOP + 0.004 - drop;
  const drops = [side(cw, drop).move(0, y0, cd / 2), side(cw, drop).move(0, y0, -cd / 2), side(cd, drop).rotate(0, 90, 0).move(cw / 2, y0, 0), side(cd, drop).rotate(0, 90, 0).move(-cw / 2, y0, 0)];
  const parts: { mat: MatId; solid: Solid; overlap?: boolean }[] = [{ mat: cloth === "plush" ? "wood-dark" : "wood-mid", solid: frame }, { mat: cloth, solid: union(box(cw, 0.004, cd, 0, TOP, 0), ...drops), overlap: true }];
  if (hem) {
    const hh = hem === "lace" ? 0.07 : 0.05, ho = o + 0.006, hy = y0 - (hem === "fringe" ? hh : 0.002);
    const band = (len: number) => folds(len, hh, 0.003, f, a);
    parts.push({ mat: hem === "lace" ? "lace" : "plush", overlap: true, solid: union(band(cw).move(0, hy, cd / 2 + 0.003), band(cw).move(0, hy, -cd / 2 - 0.003), band(cd).rotate(0, 90, 0).move(cw / 2 + 0.003, hy, 0), band(cd).rotate(0, 90, 0).move(-cw / 2 - 0.003, hy, 0)) });
    void ho;
  }
  return parts;
}
prop({ id: "table-stube-long", items: ["table-round", "crochet"], size: [1.16, 0.78, 0.81], place: "floor", tris: 9000, parts: () => stubeTable(0.73, "linen", "lace") });
prop({ id: "table-stube-knee", items: ["table-round", "crochet"], size: [1.16, 0.78, 0.81], place: "floor", tris: 9000, parts: () => stubeTable(0.34, "linen", "lace") });
prop({ id: "table-stube-plush", items: ["table-round"], size: [1.16, 0.78, 0.81], place: "floor", tris: 9000, parts: () => stubeTable(0.22, "plush", "fringe") });

prop({
  id: "chest-drawers", items: ["chest-drawers"], size: [1.0, 0.88, 0.52], place: "wall", tris: 1500,
  parts: () => [{ mat: "wood-mid", solid: union(box(1.0, 0.82, 0.5), box(1.04, 0.04, 0.54, 0, 0.82, 0.01), box(0.92, 0.22, 0.02, 0, 0.06, 0.25), box(0.92, 0.22, 0.02, 0, 0.32, 0.25), box(0.92, 0.2, 0.02, 0, 0.58, 0.25)) }, { mat: "brass", solid: union(ball(0.014).move(-0.25, 0.17, 0.27), ball(0.014).move(0.25, 0.17, 0.27), ball(0.014).move(-0.25, 0.43, 0.27), ball(0.014).move(0.25, 0.43, 0.27), ball(0.014).move(-0.25, 0.68, 0.27), ball(0.014).move(0.25, 0.68, 0.27)) }],
});

prop({
  id: "washstand", items: ["washstand"], size: [0.9, 0.95, 0.48], place: "wall", tris: 2500,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.9, 0.78, 0.46), box(0.9, 0.15, 0.02, 0, 0.8, -0.22)) },
    { mat: "marble", solid: box(0.92, 0.03, 0.48, 0, 0.78, 0) },
    { mat: "enamel", solid: union(lathe([[0, 0], [0.1, 0], [0.18, 0.08], [0.17, 0.085], [0.09, 0.012], [0, 0.012]], -0.12, 0.81, 0.02), lathe([[0, 0], [0.06, 0], [0.08, 0.12], [0.05, 0.22], [0.06, 0.26], [0, 0.26]], 0.25, 0.81, -0.05)) },
  ],
});

prop({
  id: "bed-wood", items: ["bed-wood", "featherbed-check", "show-pillows"], size: [1.0, 1.35, 2.0], place: "corner", tris: 19500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.0, 1.3, 0.05, 0, 0, -0.975), crest(0.9, 0.12, 1.3, -0.975), box(1.0, 0.85, 0.05, 0, 0, 0.975), box(0.04, 0.3, 1.9, -0.48, 0.25, 0), box(0.04, 0.3, 1.9, 0.48, 0.25, 0)) },
    { mat: "linen-grey", solid: rbox(0.92, 0.18, 1.88, 0.05, 0, 0.35, 0) },
    { mat: "check-blue", solid: sdf.box(0.98, 0.26, 1.35, 0.1).move(0, 0.68, 0.28).displace(0.02, 3, 3, 4).solid(0.05).simplify(0.0125) },
    { mat: "linen", solid: union(sdf.box(0.84, 0.24, 0.5, 0.1).move(0, 0.7, -0.6).displace(0.012, 4, 3, 5).solid(0.04).simplify(0.01), sdf.box(0.7, 0.3, 0.12, 0.05).move(0, 0.92, -0.86).solid(0.04).simplify(0.01)) },
  ],
});

prop({
  id: "sewing-machine", items: ["sewing-machine", "hw-sewing"], size: [0.85, 1.0, 0.45], place: "wall", tris: 3000,
  parts: () => [
    { mat: "iron", solid: union(box(0.04, 0.72, 0.4, -0.38, 0, 0), box(0.04, 0.72, 0.4, 0.38, 0, 0), box(0.6, 0.02, 0.3, 0, 0.12, 0.02).rotate(-8, 0, 0), ring(0.17, 0.012).rotate(0, 90, 0).move(-0.32, 0.38, 0), rodX(0.012, 0.76, 0, 0.4, -0.15), box(0.36, 0.2, 0.1, 0.02, 0.76, 0), box(0.08, 0.14, 0.08, -0.16, 0.76, 0)) },
    { mat: "wood-mid", solid: box(0.84, 0.035, 0.44, 0, 0.72, 0) },
  ],
});

prop({
  id: "birdcage", items: ["birdcage"], size: [0.3, 0.45, 0.3], place: "on", tris: 3000,
  parts: () => {
    const bars: Solid[] = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; bars.push(post(0.003, 0.3, Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13)); }
    return [{ mat: "brass", solid: union(...bars, ring(0.13, 0.005).rotate(90, 0, 0).move(0, 0.33, 0), ball(0.135).trim(0, 1, 0, 0).scale(1, 0.6, 1).minus(ball(0.13).trim(0, 1, 0, 0).scale(1, 0.58, 1)).move(0, 0.33, 0), post(0.005, 0.05, 0, 0.4, 0)) }, { mat: "wood-soft", solid: post(0.15, 0.03, 0, 0, 0) }, { mat: "flower", solid: ball(0.03).scale(1.4, 1, 1).move(0, 0.2, 0) }];
  },
});

prop({
  id: "pram-cradle", items: ["cradle"], size: [0.55, 0.95, 1.0], place: "floor", tris: 14500,
  parts: () => [
    { mat: "wood-raw", solid: union(rbox(0.5, 0.35, 0.85, 0.08, 0, 0.4, 0), ball(0.27).trim(0, 0, -1, 0.1).scale(0.95, 1.1, 1).move(0, 0.72, -0.3).minus(rbox(0.46, 0.4, 0.85, 0.08, 0, 0.45, 0.06))) },
    { mat: "iron", solid: union(ring(0.16, 0.01).rotate(0, 90, 0).move(-0.27, 0.17, 0.3), ring(0.16, 0.01).rotate(0, 90, 0).move(0.27, 0.17, 0.3), ring(0.16, 0.01).rotate(0, 90, 0).move(-0.27, 0.17, -0.3), ring(0.16, 0.01).rotate(0, 90, 0).move(0.27, 0.17, -0.3), rodX(0.01, 0.54, 0, 0.17, 0.3), rodX(0.01, 0.54, 0, 0.17, -0.3)) },
    { mat: "check-blue", solid: sdf.box(0.42, 0.1, 0.6, 0.04).move(0, 0.75, 0.08).displace(0.01, 5, 3, 2).solid(0.035).simplify(0.00875) },
  ],
});

/** The Black Forest clock: a carved house, its pendulum, two pine-cone weights on chains; fir twigs behind in winter. */
prop({
  id: "cuckoo-clock", items: ["cuckoo-clock", "fir-branches"], size: [0.4, 1.4, 0.2], place: "hung", tris: 3000,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.26, 0.3, 0.15), crossSection.polygon([[-0.19, 0], [0.19, 0], [0, 0.14]]).extrude(0.17).move(0, 0.3, -0.085), crest(0.3, 0.1, 0.42, 0.06), box(0.02, 0.4, 0.004, 0, -0.42, 0.02), lathe([[0, 0], [0.03, 0.02], [0.028, 0.12], [0, 0.15]], -0.06, -0.85, 0.02, 12), lathe([[0, 0], [0.03, 0.02], [0.028, 0.12], [0, 0.15]], 0.06, -0.7, 0.02, 12), zcyl(0.05, 0.005).move(0, -0.42, 0.025)).move(0, 0.85, 0) },
    { mat: "enamel", solid: zcyl(0.07, 0.006).move(0, 1.0, 0.078) },
    { mat: "iron", solid: union(post(0.002, 0.7, -0.06, -0.7, 0.02), post(0.002, 0.55, 0.06, -0.55, 0.02)).move(0, 0.85, 0) },
    { mat: "leaf", solid: union(...[-1, 1].flatMap((s) => [zcyl(0.005, 0.2).rotate(0, 90, s * 30).move(s * 0.13, 1.25, -0.07), ...[0, 1, 2, 3].map((j) => ball(0.025).scale(1.6, 0.5, 0.6).rotate(0, 0, s * 30).move(s * (0.07 + j * 0.04), 1.22 + j * 0.022, -0.07))])) },
  ],
});

prop({
  id: "regulator", items: ["regulator"], size: [0.36, 1.05, 0.15], place: "hung", tris: 1500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.36, 0.9, 0.14), crest(0.36, 0.14, 0.9, 0.05), box(0.3, 0.06, 0.16, 0, -0.06, 0)) },
    { mat: "glass", solid: box(0.28, 0.82, 0.005, 0, 0.04, 0.072) },
    { mat: "enamel", solid: zcyl(0.11, 0.006).move(0, 0.72, 0.06) },
    { mat: "brass", solid: union(zcyl(0.05, 0.01).move(0, 0.2, 0.05), post(0.003, 0.4, 0, 0.22, 0.05)) },
  ],
});

/** Photographs in black frames and one oval, hung at one height; the son in field grey, a black ribbon on its corner. */
prop({
  id: "photos", items: ["family-photos", "soldier-portrait", "mourning-crape"], size: [1.1, 0.5, 0.03], place: "hung", tris: 600,
  parts: () => photoWall(),
});
/** Five frames in one row at one height, as a Stube hung them (the director read the old two blank discs over a frame, with a
 *  bar floating across, as "what's going on here", a review note): a small frame, an oval, the son in his field
 *  cap in the middle with the crape across its corner, an oval, a small frame. Each print shows a sitter, head and
 *  shoulders, dark on the sepia. */
function photoWall() {
  const frames: Solid[] = [], prints: Solid[] = [], sitters: Solid[] = [];
  const oval = (x: number, y: number, rx: number) => zcyl(rx, 0.02).scale(1, 1.3, 1).move(x, y, 0);
  const sitter = (x: number, yb: number, w: number, h: number, cap = false) => {
    sitters.push(ball(w * 0.17).scale(1, 1.25, 0.12).move(x, yb + h * 0.62, 0.014), box(w * 0.66, h * 0.34, 0.003, x, yb, 0.0135));
    if (cap) sitters.push(box(w * 0.36, w * 0.09, 0.003, x, yb + h * 0.74, 0.0145));
  };
  for (const s of [-1, 1]) {
    // the small frames at the ends, their prints
    frames.push(box(0.17, 0.23, 0.02, s * 0.46, 0.13, 0)); prints.push(box(0.13, 0.19, 0.004, s * 0.46, 0.15, 0.011)); sitter(s * 0.46, 0.15, 0.13, 0.19);
    // the ovals: a ring of frame round an oval print
    frames.push(oval(s * 0.24, 0.26, 0.085).minus(oval(s * 0.24, 0.26, 0.068).scale(1, 1, 3)));
    prints.push(zcyl(0.068, 0.004).scale(1, 1.3, 1).move(s * 0.24, 0.26, 0.009)); sitter(s * 0.24, 0.18, 0.13, 0.17);
  }
  // the son in field grey, the largest, a black ribbon of crape laid across its top left corner
  frames.push(box(0.27, 0.36, 0.02, 0, 0.07, 0)); prints.push(box(0.21, 0.3, 0.004, 0, 0.1, 0.011)); sitter(0, 0.1, 0.21, 0.3, true);
  // a band across the corner, from the frame's left edge to its top edge (/ over the top left), lying on the frame
  const crape = box(0.04, 0.15, 0.004, 0, -0.075, 0).rotate(0, 0, -45).move(-0.087, 0.382, 0.017);
  return [
    { mat: "wood-dark" as const, solid: union(...frames) },
    { mat: "photo-sepia" as const, solid: union(...prints), overlap: true },
    { mat: "photo-dark" as const, solid: union(...sitters), overlap: true },
    { mat: "cloth-black" as const, solid: crape, overlap: true },
  ];
}
prop({
  id: "oleograph", items: ["oleograph", "religious"], size: [0.7, 0.55, 0.05], place: "hung", tris: 300,
  parts: () => [{ mat: "brass", solid: box(0.7, 0.55, 0.05).minus(box(0.58, 0.43, 0.1, 0, 0.06, 0)) }, { mat: "paper-damask", solid: box(0.58, 0.43, 0.01, 0, 0.06, -0.01) }],
});

prop({
  id: "fan-palm", items: ["fan-palm"], size: [0.9, 1.4, 0.9], place: "corner", tris: 6000,
  parts: () => {
    const fronds: Solid[] = [];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4 * 57.3, tilt = 20 + hash(i, 41) * 35, len = 0.45 + hash(i, 42) * 0.25;
      fronds.push(zcyl(0.006, len).move(0, 0, len / 2).union(zcone(0.22, 0.02, 0.01).scale(1, 1.2, 1).rotate(-90 + 10, 0, 0).move(0, 0.0, len)).rotate(-90 + tilt, a, 0).move(0, 0.4, 0));
    }
    return [{ mat: "terracotta", solid: lathe([[0, 0], [0.13, 0], [0.17, 0.3], [0.19, 0.32], [0, 0.32]]) }, { mat: "leaf", solid: union(...fronds) }];
  },
});

prop({
  id: "aspidistra", items: ["aspidistra"], size: [0.6, 0.8, 0.6], place: "floor", tris: 12500,
  parts: () => {
    const leaves: Solid[] = [];
    for (let i = 0; i < 12; i++) leaves.push(ball(0.5).scale(0.09, 0.006, 0.36).move(0, 0, 0.3).rotate(-55 - hash(i, 43) * 25, i * 137.5, 0).move(0, 0.3, 0));
    return [{ mat: "stoneware", solid: lathe([[0, 0], [0.12, 0], [0.15, 0.25], [0.16, 0.27], [0, 0.27]]) }, { mat: "leaf", solid: union(...leaves) }];
  },
});

prop({
  id: "rug", items: ["rug"], size: [1.8, 0.01, 1.2], place: "floor", tris: 100,
  parts: () => [{ mat: "plush", solid: box(1.8, 0.008, 1.2) }],
});

prop({
  id: "wall-lamp", items: ["petroleum-lamp"], size: [0.2, 0.45, 0.2], place: "hung", tris: 1200,
  parts: () => [{ mat: "brass", solid: union(box(0.04, 0.25, 0.01, 0, 0, -0.08), rodZ(0.006, 0.1, 0, 0.12, -0.04), lathe([[0, 0], [0.06, 0], [0.065, 0.05], [0.02, 0.08], [0, 0.08]], 0, 0.08, 0)) }, { mat: "glass", solid: taper(0.02, 0.015, 0.18, 0, 0.17, 0) }, { mat: "mantle", solid: post(0.01, 0.02, 0, 0.18, 0) }],
  glow: [{ at: [0, 0.2, 0], lumens: 120, color: "#ffc987", range: 6 }],
});
export const KIT_STUBE = true;
