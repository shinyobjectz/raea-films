// Home kit: the things that say who lives in a flat (interiors/plan/identity.ts picks them, interiors/plan/dress.ts
// puts them in rooms). Faith: the Catholic crucifix over the bed and the holy-water font by the door, the pair of
// Sacred Heart prints, the Madonna (the Black Madonna of Częstochowa for the Polish), the guardian angel over the
// children's beds; the Protestant Luther, confirmation certificate and embroidered blessing; the Jewish mezuzah,
// Sabbath candlesticks, Hanukkah lamp, Misrach plaque on the east wall, the shelf of holy books, the two sets of
// dishes; a prayer room's ark, desk and benches. Politics and the war: the party leader's portrait (Bebel's with the
// black ribbon since 1913), the Kaiser, Hindenburg, the reservist's print, the Iron Cross in its frame, the officer's
// helmet and sabre. Music (no wireless: German broadcasting began at the Vox-Haus on 29 October 1923, and private
// receivers were banned through the war): gramophone, zither, accordion, violin, the Wandervogel's guitar. Pastimes:
// chess, skat, the shelf of a workers' library, an aquarium, the bicycle, the allotment's tools, the pigeon basket,
// needlework, an easel.
//
// Sources for what hung where (research/catalogue/interior.ts has them as items): Weber 1892 in Saul et al.,
// Arbeiterfamilien im Kaiserreich (GHDI document 482): oleographs, the man's soldier picture, Lassalle or Marx, the
// first Kaiser, confirmation pictures, saints for Catholics and Luther for Protestants, embroidered verses with Social
// Democratic words in place of the Christian ones. Every prop stands on y = 0 centred on x and z, its front to +z.
import { crossSection, type Solid } from "raea/3d";
import { ball, box, hash, lathe, post, rbox, ring, rodX, taper, union, zcyl } from "./geo";
import type { MatId } from "./mats";
import { prop, type Part } from "./prop";

/** A picture frame w x h, its moulding t wide and d deep, centred on x, its foot at y, centred on z. */
export const frame = (w: number, h: number, t: number, d: number, y = 0): Solid =>
  union(box(w, t, d, 0, y, 0), box(w, t, d, 0, y + h - t, 0), box(t, h - 2 * t, d, -w / 2 + t / 2, y + t, 0), box(t, h - 2 * t, d, w / 2 - t / 2, y + t, 0));
/** The print or canvas behind a frame's opening, near the frame's back. */
export const sheet = (w: number, h: number, t: number, d: number, y = 0): Solid => box(w - 2 * t + 0.01, h - 2 * t + 0.01, 0.004, 0, y + t - 0.005, -d / 2 + 0.004);
/** A flat oval on a print, centred at (x, y), rx by ry, layer k proud of the sheet. */
const oval = (rx: number, ry: number, x: number, y: number, d: number, k = 1): Solid => zcyl(rx, 0.003).scale(1, ry / rx, 1).move(x, y, -d / 2 + 0.008 + 0.0015 * k);
/** A trapezoid on a print (a coat, a robe, a mantle): a wide at the foot, b at the top, h tall. */
const trap = (a: number, b: number, h: number, x: number, y: number, d: number, k = 1): Solid =>
  crossSection.polygon([[-a, 0], [a, 0], [b, h], [-b, h]]).extrude(0.003).move(x, y, -d / 2 + 0.007 + 0.0015 * k);
/** A portrait's sitter on its print: coat to the shoulders and the face, for a print whose opening runs y0 to y1. */
export const bust = (w: number, y0: number, y1: number, d: number, coat: MatId, face: MatId = "wax"): Part[] => {
  const h = y1 - y0;
  return [
    { mat: coat, solid: trap(w * 0.36, w * 0.17, h * 0.42, 0, y0, d), overlap: true },
    { mat: face, solid: oval(w * 0.12, w * 0.155, 0, y0 + h * 0.6, d, 2), overlap: true },
  ];
};
/** A heart on a print: a square on its corner and two discs. */
const heart = (r: number, x: number, y: number, d: number): Solid =>
  union(box(r * 1.4, r * 1.4, 0.003).move(0, -r * 0.7, 0).rotate(0, 0, 45).move(x, y, -d / 2 + 0.011), zcyl(r * 0.72, 0.003).move(x - r * 0.5, y + r * 0.5, -d / 2 + 0.011), zcyl(r * 0.72, 0.003).move(x + r * 0.5, y + r * 0.5, -d / 2 + 0.011));
/** A row of book spines on a board at y, from x0 to x1, d deep, at depth z; heights and widths by seed. */
const books = (x0: number, x1: number, y: number, d: number, z: number, hMax: number, seed: number): Solid[] => {
  const out: Solid[] = [];
  for (let x = x0, k = 0; x < x1 - 0.02; k++) {
    const w = 0.022 + hash(seed, k, 1) * 0.03, h = hMax * (0.7 + hash(seed, k, 2) * 0.3);
    if (x + w > x1) break;
    out.push(box(w - 0.002, h, d * (0.8 + hash(seed, k, 3) * 0.2), x + w / 2, y, z));
    x += w;
  }
  return out;
};

// ---- faith ----

/** A crucifix over the bed: a dark wooden cross, the corpus in brass, a sprig of Palm Sunday's box tucked behind. */
prop({
  id: "crucifix", items: ["crucifix", "palm-sprig"], size: [0.26, 0.42, 0.05], place: "hung", tris: 400,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.03, 0.4, 0.022), box(0.2, 0.03, 0.022, 0, 0.27, 0)) },
    { mat: "brass", solid: union(box(0.022, 0.15, 0.01, 0, 0.11, 0.015), box(0.16, 0.016, 0.01, 0, 0.262, 0.015), ball(0.013).move(0, 0.3, 0.017)), overlap: true },
    { mat: "leaf", solid: union(box(0.012, 0.24, 0.006).rotate(0, 0, -28).move(0.07, 0.14, -0.016), box(0.012, 0.2, 0.006).rotate(0, 0, -40).move(0.08, 0.12, -0.02)), overlap: true },
  ],
});

/** The holy-water font by the door (Weihwasserkessel): a little stoneware basin on a plate with a cross. */
prop({
  id: "holy-water-font", items: ["holy-water-font"], size: [0.1, 0.2, 0.07], place: "hung", tris: 300,
  parts: () => [
    { mat: "stoneware", solid: union(box(0.075, 0.15, 0.012, 0, 0.03, -0.028), lathe([[0, 0], [0.026, 0], [0.034, 0.03], [0.03, 0.034], [0.022, 0.012], [0, 0.012]], 0, 0, 0.002)) },
    { mat: "brass", solid: union(box(0.008, 0.045, 0.006, 0, 0.12, -0.02), box(0.026, 0.008, 0.006, 0, 0.145, -0.02)), overlap: true },
  ],
});

/** The Sacred Heart of Jesus and the Immaculate Heart of Mary, a pair in gilt frames over the marriage bed. */
prop({
  id: "heart-prints", items: ["heart-prints"], size: [0.72, 0.46, 0.035], place: "hung", tris: 900,
  parts: () => {
    const d = 0.03, f: Solid[] = [], s: Solid[] = [], red: Solid[] = [], blue: Solid[] = [], face: Solid[] = [];
    for (const x of [-0.19, 0.19]) {
      f.push(frame(0.3, 0.44, 0.035, d).move(x, 0, 0));
      s.push(sheet(0.3, 0.44, 0.035, d).move(x, 0, 0));
      (x < 0 ? red : blue).push(trap(0.1, 0.05, 0.24, x, 0.04, d));
      face.push(oval(0.035, 0.045, x, 0.32, d, 2));
      red.push(heart(0.022, x, 0.2, d));
    }
    return [{ mat: "brass", solid: union(...f) }, { mat: "paper-poster", solid: union(...s), overlap: true }, { mat: "paint-red", solid: union(...red), overlap: true }, { mat: "cloth-navy", solid: union(...blue), overlap: true }, { mat: "wax", solid: union(...face), overlap: true }];
  },
});

/** The Madonna in a gilt frame; for a Polish family the Black Madonna of Częstochowa, her face dark, a gold halo. */
prop({
  id: "madonna-print", items: ["madonna-print", "black-madonna"], size: [0.4, 0.52, 0.035], place: "hung", tris: 500,
  parts: () => {
    const d = 0.03;
    return [
      { mat: "brass", solid: union(frame(0.38, 0.5, 0.04, d), zcyl(0.08, 0.003).move(0, 0.33, -d / 2 + 0.007)) },
      { mat: "paper-poster", solid: sheet(0.38, 0.5, 0.04, d), overlap: true },
      { mat: "cloth-navy", solid: trap(0.13, 0.07, 0.3, 0, 0.04, d), overlap: true },
      { mat: "wood-dark", solid: oval(0.04, 0.052, 0, 0.33, d, 2), overlap: true },
    ];
  },
});

/** The guardian angel over the children's bed: a white-winged figure by two children on a bridge, in a plain frame. */
prop({
  id: "angel-print", items: ["guardian-angel"], size: [0.5, 0.36, 0.03], place: "hung", tris: 400,
  parts: () => {
    const d = 0.026;
    return [
      { mat: "wood-dark", solid: frame(0.48, 0.34, 0.03, d) },
      { mat: "paper-blue", solid: sheet(0.48, 0.34, 0.03, d), overlap: true },
      { mat: "paint-white", solid: union(oval(0.06, 0.1, -0.06, 0.2, d), oval(0.06, 0.1, 0.06, 0.2, d), trap(0.05, 0.03, 0.18, 0, 0.05, d, 2)), overlap: true },
      { mat: "cloth-brown", solid: union(trap(0.025, 0.015, 0.08, 0.12, 0.05, d, 2), trap(0.02, 0.012, 0.065, 0.16, 0.05, d, 2)), overlap: true },
    ];
  },
});

/** Luther's portrait, the Protestant household's: a black gown, a pale face, a plain dark frame. */
prop({
  id: "luther-print", items: ["luther-print"], size: [0.36, 0.46, 0.03], place: "hung", tris: 400,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.34, 0.44, 0.03, 0.026) },
    { mat: "paper-poster", solid: sheet(0.34, 0.44, 0.03, 0.026), overlap: true },
    ...bust(0.34, 0.03, 0.41, 0.026, "cloth-black"),
  ],
});

/** An embroidered blessing or motto in a frame (Haussegen: "Wo Glaube, da Liebe ..."), or the same work with a Social
 *  Democratic verse in red: rows of cross-stitch letters on linen under a garland. */
prop({
  id: "wall-motto", items: ["haussegen", "spd-spruch"], size: [0.52, 0.32, 0.03], place: "hung", tris: 700,
  parts: () => {
    const d = 0.026, letters: Solid[] = [];
    for (let row = 0; row < 3; row++) for (let k = 0; k < 9 - row * 2; k++) letters.push(box(0.022, 0.03, 0.003, -0.16 + row * 0.05 + k * 0.04, 0.17 - row * 0.05, -d / 2 + 0.009));
    return [
      { mat: "wood-dark", solid: frame(0.5, 0.3, 0.028, d) },
      { mat: "linen", solid: sheet(0.5, 0.3, 0.028, d), overlap: true },
      { mat: "paint-red", solid: union(...letters), overlap: true },
      { mat: "leaf", solid: union(box(0.36, 0.012, 0.003, 0, 0.23, -d / 2 + 0.009), box(0.36, 0.012, 0.003, 0, 0.045, -d / 2 + 0.009)), overlap: true },
    ];
  },
});

/** The family Bible or hymnal on the Vertiko: black boards, a brass clasp. */
prop({
  id: "bible", items: ["bible"], size: [0.17, 0.05, 0.23], place: "on", tris: 100,
  parts: () => [
    { mat: "cloth-black", solid: box(0.16, 0.045, 0.22) },
    { mat: "paper", solid: box(0.15, 0.035, 0.005, 0, 0.005, 0.108), overlap: true },
    { mat: "brass", solid: box(0.03, 0.03, 0.01, 0.06, 0.008, 0.11), overlap: true },
  ],
});

/** The mezuzah on the doorpost, at shoulder height, its top leaning in toward the room. */
prop({
  id: "mezuzah", items: ["mezuzah"], size: [0.05, 0.13, 0.025], place: "hung", tris: 60,
  parts: () => [{ mat: "brass", solid: box(0.022, 0.11, 0.016).rotate(0, 0, -15).move(0, 0.005, 0) }],
});

/** The Sabbath candlesticks on a white cloth, and the Kiddush cup between them. */
prop({
  id: "sabbath-candles", items: ["sabbath-candlesticks", "kiddush-cup"], size: [0.32, 0.33, 0.12], place: "on", tris: 900,
  parts: () => {
    const stick = (x: number) => lathe([[0, 0], [0.045, 0], [0.045, 0.01], [0.015, 0.025], [0.012, 0.15], [0.02, 0.16], [0.03, 0.17], [0.012, 0.175], [0, 0.175]], x, 0.003, 0);
    return [
      { mat: "linen", solid: box(0.32, 0.003, 0.12) },
      { mat: "brass", solid: union(stick(-0.11), stick(0.11), lathe([[0, 0], [0.025, 0], [0.008, 0.015], [0.006, 0.05], [0.025, 0.07], [0.03, 0.1], [0, 0.1]], 0, 0.003, 0)) },
      { mat: "wax", solid: union(post(0.01, 0.15, -0.11, 0.175, 0), post(0.01, 0.15, 0.11, 0.175, 0)), overlap: true },
    ];
  },
});

/** A brass Hanukkah lamp of the bench kind: eight cups on a ledge, the servant light raised on the back plate. */
prop({
  id: "hanukkah-lamp", items: ["hanukkah-lamp"], size: [0.3, 0.25, 0.08], place: "on", tris: 600,
  parts: () => {
    const cups: Solid[] = [];
    for (let k = 0; k < 8; k++) cups.push(box(0.022, 0.018, 0.022, -0.12 + k * 0.034, 0.05, 0.012));
    return [{ mat: "brass", solid: union(box(0.29, 0.18, 0.006, 0, 0.035, -0.03), zcyl(0.06, 0.006).move(0, 0.2, -0.03), box(0.29, 0.008, 0.06, 0, 0.042, 0.0), ...cups, box(0.022, 0.02, 0.03, 0.12, 0.17, -0.015), box(0.02, 0.04, 0.05, -0.12, 0, 0), box(0.02, 0.04, 0.05, 0.12, 0, 0)) }];
  },
});

/** The Misrach on the east wall: a framed papercut, an arch over two columns and a lattice, to face when praying. */
prop({
  id: "misrach", items: ["misrach"], size: [0.46, 0.36, 0.03], place: "hung", tris: 600,
  parts: () => {
    const d = 0.026, lat: Solid[] = [];
    for (let k = 0; k < 6; k++) lat.push(box(0.012, 0.16, 0.003, -0.1 + k * 0.04, 0.06, -d / 2 + 0.009));
    return [
      { mat: "wood-dark", solid: frame(0.44, 0.34, 0.028, d) },
      { mat: "paper", solid: sheet(0.44, 0.34, 0.028, d), overlap: true },
      { mat: "cloth-navy", solid: union(...lat, box(0.3, 0.02, 0.003, 0, 0.23, -d / 2 + 0.009), box(0.02, 0.2, 0.003, -0.15, 0.04, -d / 2 + 0.009), box(0.02, 0.2, 0.003, 0.15, 0.04, -d / 2 + 0.009)), overlap: true },
      { mat: "paint-red", solid: union(box(0.18, 0.025, 0.003, 0, 0.27, -d / 2 + 0.011), zcyl(0.02, 0.003).move(0, 0.235, -d / 2 + 0.011)), overlap: true },
    ];
  },
});

/** The shelf of holy books (Seforim): dark bindings with gilt on the spines, five boards high. */
prop({
  id: "seforim-shelf", items: ["seforim"], size: [0.92, 1.82, 0.34], place: "wall", tris: 4000,
  parts: () => {
    const boards: Solid[] = [box(0.03, 1.8, 0.32, -0.445, 0, 0), box(0.03, 1.8, 0.32, 0.445, 0, 0), box(0.92, 0.03, 0.32, 0, 1.79, 0), box(0.88, 1.8, 0.01, 0, 0, -0.155)];
    const bk: Solid[] = [];
    for (let s = 0; s < 5; s++) {
      boards.push(box(0.86, 0.022, 0.3, 0, 0.06 + s * 0.35, 0));
      bk.push(...books(-0.42, 0.42, 0.082 + s * 0.35, 0.22, 0.01, 0.28, 31 + s));
    }
    return [{ mat: "wood-dark", solid: union(...boards) }, { mat: "leather", solid: union(...bk), overlap: true }];
  },
});

/** A hanging bookshelf (Bücherbord) with a workers' library on it: cloth bindings, a few paperbacks. */
prop({
  id: "book-board", items: ["books-shelf"], size: [0.8, 0.42, 0.2], place: "hung", tris: 1600,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.8, 0.02, 0.18, 0, 0, 0), box(0.8, 0.02, 0.18, 0, 0.2, 0), box(0.02, 0.42, 0.18, -0.39, 0, 0), box(0.02, 0.42, 0.18, 0.39, 0, 0)) },
    { mat: "cloth-brown", solid: union(...books(-0.37, 0.05, 0.02, 0.14, 0, 0.17, 7), ...books(-0.37, 0.37, 0.22, 0.14, 0, 0.18, 9)), overlap: true },
    { mat: "paper-blue", solid: union(...books(0.06, 0.37, 0.02, 0.13, 0, 0.16, 8)), overlap: true },
  ],
});

/** A brass samovar on its tray, the teapot on the crown: brought from the east. */
prop({
  id: "samovar", items: ["samovar"], size: [0.32, 0.56, 0.32], place: "on", tris: 1400,
  parts: () => [
    { mat: "brass", solid: union(lathe([[0, 0], [0.15, 0], [0.15, 0.008], [0.06, 0.012], [0.05, 0.06], [0.09, 0.08], [0.12, 0.2], [0.11, 0.33], [0.05, 0.36], [0.03, 0.4], [0, 0.4]]), rodX(0.008, 0.06, 0, 0.1, 0.12).rotate(0, 90, 0), ring(0.035, 0.007).move(-0.13, 0.28, 0), ring(0.035, 0.007).move(0.13, 0.28, 0)) },
    { mat: "stoneware", solid: union(ball(0.07).scale(1, 0.8, 1).move(0, 0.45, 0), box(0.06, 0.012, 0.012, 0.08, 0.45, 0)), overlap: true },
  ],
});

/** The kitchen's two sets of dishes kept apart, for meat and for milk: a two-board rack, blue above, red below. */
prop({
  id: "dish-shelf", items: ["two-dish-sets"], size: [0.8, 0.56, 0.18], place: "hung", tris: 1200,
  parts: () => {
    const plates = (y: number) => Array.from({ length: 6 }, (_, k) => zcyl(0.09, 0.012).rotate(-12, 0, 0).move(-0.3 + k * 0.12, y + 0.095, -0.02));
    return [
      { mat: "wood-soft", solid: union(box(0.8, 0.02, 0.16, 0, 0, 0), box(0.8, 0.02, 0.16, 0, 0.27, 0), box(0.02, 0.56, 0.16, -0.39, 0, 0), box(0.02, 0.56, 0.16, 0.39, 0, 0), box(0.76, 0.015, 0.01, 0, 0.06, 0.06), box(0.76, 0.015, 0.01, 0, 0.33, 0.06)) },
      { mat: "enamel-blue", solid: union(...plates(0.27)), overlap: true },
      { mat: "paint-red", solid: union(...plates(0)), overlap: true },
    ];
  },
});

/** A prayer room's reading desk (Schtender): a sloped top on a pedestal, a cloth over it. */
prop({
  id: "prayer-desk", items: ["prayer-desk"], size: [0.62, 1.25, 0.52], place: "floor", tris: 300,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.4, 0.04, 0.4), box(0.08, 1.0, 0.08, 0, 0.04, 0), box(0.6, 0.03, 0.5).rotate(-20, 0, 0).move(0, 1.12, 0)) },
    { mat: "plush", solid: box(0.62, 0.008, 0.42).rotate(-20, 0, 0).move(0, 1.15, 0), overlap: true },
  ],
});

/** A prayer room's ark (Aron ha-Kodesch): a tall cabinet behind a velvet curtain with a crown worked on it. */
prop({
  id: "ark", items: ["torah-ark"], size: [1.02, 2.0, 0.5], place: "wall", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.0, 1.9, 0.45), crossSection.polygon([[-0.5, 0], [0.5, 0], [0, 0.12]]).extrude(0.45).move(0, 1.88, -0.225)) },
    { mat: "plush", solid: box(0.8, 1.5, 0.02, 0, 0.25, 0.235), overlap: true },
    { mat: "brass", solid: union(box(0.2, 0.12, 0.006, 0, 1.45, 0.25), box(0.6, 0.03, 0.006, 0, 0.35, 0.25)), overlap: true },
  ],
});

/** A plain bench for a prayer room or a club's back room. */
prop({
  id: "bench", items: ["prayer-bench", "club-bench"], size: [1.6, 0.46, 0.36], place: "floor", tris: 120,
  parts: () => [{ mat: "wood-mid", solid: union(box(1.6, 0.04, 0.34, 0, 0.42, 0), box(0.04, 0.42, 0.3, -0.7, 0, 0), box(0.04, 0.42, 0.3, 0.7, 0, 0), box(1.4, 0.06, 0.03, 0, 0.12, 0)) }],
});

// ---- politics, state and the war ----

/** The party's leader in a black frame (Bebel, dead since August 1913, with the black ribbon across the corner). */
prop({
  id: "leader-print", items: ["spd-portrait"], size: [0.44, 0.57, 0.04], place: "hung", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.42, 0.55, 0.035, 0.03) },
    { mat: "paper-poster", solid: sheet(0.42, 0.55, 0.035, 0.03), overlap: true },
    ...bust(0.42, 0.035, 0.515, 0.03, "cloth-black"),
    { mat: "linen-grey", solid: oval(0.04, 0.035, 0, 0.27, 0.03, 3), overlap: true },
    { mat: "cloth-black", solid: box(0.06, 0.26, 0.006).rotate(0, 0, 45).move(-0.13, 0.36, 0.017), overlap: true },
  ],
});

/** The Kaiser in a gilt frame: field grey, the spiked helmet, the moustache. */
prop({
  id: "kaiser-print", items: ["kaiser-print"], size: [0.48, 0.62, 0.04], place: "hung", tris: 600,
  parts: () => [
    { mat: "brass", solid: union(frame(0.46, 0.6, 0.045, 0.034), taper(0.004, 0.0008, 0.03, 0, 0.53, -0.006)) },
    { mat: "paper-poster", solid: sheet(0.46, 0.6, 0.045, 0.034), overlap: true },
    ...bust(0.46, 0.045, 0.555, 0.034, "cloth-field"),
    { mat: "iron", solid: oval(0.06, 0.04, 0, 0.425, 0.034, 3), overlap: true },
    { mat: "wood-dark", solid: box(0.06, 0.01, 0.003, 0, 0.34, -0.017 + 0.014), overlap: true },
  ],
});

/** Hindenburg, the war's idol since Tannenberg: a charcoal head in a plain frame. */
prop({
  id: "hindenburg-print", items: ["hindenburg-print"], size: [0.4, 0.5, 0.03], place: "hung", tris: 400,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.38, 0.48, 0.03, 0.026) },
    { mat: "paper", solid: sheet(0.38, 0.48, 0.03, 0.026), overlap: true },
    ...bust(0.38, 0.03, 0.45, 0.026, "cloth-field", "linen-grey"),
  ],
});

/** The Iron Cross in a frame with its certificate and the black-and-white ribbon. */
prop({
  id: "iron-cross-frame", items: ["iron-cross"], size: [0.28, 0.36, 0.03], place: "hung", tris: 300,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.26, 0.34, 0.025, 0.026) },
    { mat: "paper", solid: sheet(0.26, 0.34, 0.025, 0.026), overlap: true },
    { mat: "enamel-black", solid: union(box(0.07, 0.022, 0.004, 0, 0.19, -0.002), box(0.022, 0.07, 0.004, 0, 0.165, -0.002)), overlap: true },
    { mat: "paint-white", solid: box(0.025, 0.08, 0.003, 0, 0.06, -0.003), overlap: true },
  ],
});

/** An officer's helmet (the Pickelhaube) on its hook and his sabre hung beneath it. */
prop({
  id: "helmet-sabre", items: ["officer-kit"], size: [0.9, 0.46, 0.16], place: "hung", tris: 800,
  parts: () => [
    { mat: "steel-bright", solid: box(0.8, 0.02, 0.006).rotate(0, 0, 12).move(0, 0.1, 0.02) },
    { mat: "brass", solid: union(box(0.07, 0.05, 0.03).rotate(0, 0, 12).move(-0.38, 0.0, 0.02), post(0.008, 0.07, 0.25, 0.39, 0)) },
    { mat: "leather", solid: ball(0.1).trim(0, 1, 0, 0).scale(1, 1.1, 1.2).move(0.25, 0.28, 0) },
  ],
});

/** The reservist's picture (Reservistenbild): the man in his regiment's colours, its barracks and battles round him. */
prop({
  id: "reservist-print", items: ["reservist-print"], size: [0.52, 0.67, 0.035], place: "hung", tris: 600,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.5, 0.65, 0.04, 0.03) },
    { mat: "paper-poster", solid: sheet(0.5, 0.65, 0.04, 0.03), overlap: true },
    ...bust(0.3, 0.12, 0.5, 0.03, "cloth-navy"),
    { mat: "paint-red", solid: union(box(0.4, 0.04, 0.003, 0, 0.55, -0.004), box(0.08, 0.08, 0.003, -0.16, 0.06, -0.004), box(0.08, 0.08, 0.003, 0.16, 0.06, -0.004)), overlap: true },
  ],
});

/** A confirmation certificate, its chromolithographed border of vines round the verse. */
prop({
  id: "confirmation-cert", items: ["confirmation-cert", "veterans-cert", "society-cert"], size: [0.34, 0.44, 0.03], place: "hung", tris: 300,
  parts: () => [
    { mat: "wood-dark", solid: frame(0.32, 0.42, 0.025, 0.026) },
    { mat: "paper", solid: sheet(0.32, 0.42, 0.025, 0.026), overlap: true },
    { mat: "leaf", solid: union(box(0.24, 0.02, 0.003, 0, 0.33, -0.004), box(0.24, 0.02, 0.003, 0, 0.05, -0.004), box(0.02, 0.26, 0.003, -0.11, 0.07, -0.004), box(0.02, 0.26, 0.003, 0.11, 0.07, -0.004)), overlap: true },
  ],
});

/** A tear-off calendar on its card, the year's date on the block. */
prop({
  id: "calendar", items: ["calendar"], size: [0.22, 0.32, 0.02], place: "hung", tris: 60,
  parts: () => [{ mat: "card", solid: box(0.22, 0.32, 0.006) }, { mat: "paper", solid: box(0.12, 0.1, 0.014, 0, 0.05, 0.004), overlap: true }],
});

// ---- music (no wireless in 1917: see the head of the file) ----

/** A horn gramophone: the oak box, the turntable, the brass horn tilted up and out. */
prop({
  id: "gramophone", items: ["gramophone"], size: [0.36, 0.62, 0.66], place: "on", tris: 1400,
  parts: () => [
    { mat: "wood-mid", solid: box(0.32, 0.15, 0.32, 0, 0, -0.15) },
    { mat: "felt", solid: zcyl(0.13, 0.008).rotate(90, 0, 0).move(0, 0.155, -0.15), overlap: true },
    { mat: "brass", solid: union(taper(0.012, 0.17, 0.4).minus(taper(0.004, 0.162, 0.41).move(0, 0.006, 0)).rotate(38, 0, 0).move(0, 0.16, -0.27), rodX(0.006, 0.1, 0.06, 0.18, -0.12)) },
  ],
});

/** A zither on the table: the trapezoid box, the sound hole, the strings. */
prop({
  id: "zither", items: ["zither"], size: [0.56, 0.06, 0.32], place: "on", tris: 400,
  parts: () => {
    const strings: Solid[] = [];
    for (let k = 0; k < 10; k++) strings.push(box(0.46, 0.002, 0.002, 0, 0.042, -0.1 + k * 0.022));
    return [
      { mat: "wood-mid", solid: crossSection.polygon([[-0.27, -0.15], [0.27, -0.15], [0.27, 0.15], [-0.1, 0.15], [-0.27, 0.0]]).extrude(0.04).rotate(-90, 0, 0) },
      { mat: "wood-dark", solid: zcyl(0.04, 0.002).rotate(90, 0, 0).move(0.05, 0.041, 0.05), overlap: true },
      { mat: "steel-bright", solid: union(...strings), overlap: true },
    ];
  },
});

/** An accordion: the two ends, the black bellows in pleats, the keys. */
prop({
  id: "accordion", items: ["accordion"], size: [0.36, 0.32, 0.2], place: "on", tris: 500,
  parts: () => {
    const pleats: Solid[] = [];
    for (let k = 0; k < 7; k++) pleats.push(box(0.026, 0.28, 0.17, -0.09 + k * 0.03, 0.01, 0));
    return [
      { mat: "paint-red", solid: union(box(0.07, 0.3, 0.19, -0.14, 0, 0), box(0.07, 0.3, 0.19, 0.14, 0, 0)) },
      { mat: "cloth-black", solid: union(...pleats), overlap: true },
      { mat: "paint-white", solid: union(...Array.from({ length: 6 }, (_, k) => box(0.02, 0.03, 0.01, 0.14, 0.04 + k * 0.042, 0.1))), overlap: true },
    ];
  },
});

/** A violin in its black case, shut, on the wardrobe or the chest. */
prop({
  id: "violin-case", items: ["violin"], size: [0.76, 0.1, 0.26], place: "on", tris: 100,
  parts: () => [{ mat: "cloth-black", solid: crossSection.polygon([[-0.37, -0.06], [0.0, -0.12], [0.37, -0.12], [0.37, 0.12], [0.0, 0.12], [-0.37, 0.06]]).extrude(0.09).rotate(-90, 0, 0) }],
});

/** A Wandervogel's guitar (the Klampfe) on a nail, its coloured ribbons hanging from the head. */
prop({
  id: "guitar", items: ["guitar"], size: [0.38, 1.0, 0.1], place: "hung", tris: 600,
  parts: () => [
    { mat: "wood-mid", solid: union(zcyl(0.17, 0.08).move(0, 0.2, 0), zcyl(0.13, 0.08).move(0, 0.43, 0), box(0.05, 0.4, 0.03, 0, 0.5, 0.01), box(0.07, 0.12, 0.02, 0, 0.88, 0.0)) },
    { mat: "wood-dark", solid: zcyl(0.045, 0.004).move(0, 0.34, 0.041), overlap: true },
    { mat: "paint-red", solid: box(0.015, 0.3, 0.004, -0.04, 0.6, 0.02), overlap: true },
    { mat: "enamel-blue", solid: box(0.015, 0.25, 0.004, 0.045, 0.65, 0.02), overlap: true },
  ],
});

// ---- pastimes ----

/** A chessboard with a game standing on it. */
prop({
  id: "chessboard", items: ["chess"], size: [0.38, 0.08, 0.38], place: "on", tris: 900,
  parts: () => {
    const dark: Solid[] = [];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) dark.push(box(0.04, 0.002, 0.04, -0.14 + i * 0.04, 0.02, -0.14 + j * 0.04));
    const men = (s: number, z: number) => Array.from({ length: 5 }, (_, k) => post(0.009, 0.03 + hash(s, k) * 0.02, -0.14 + Math.floor(hash(s, k, 2) * 8) * 0.04, 0.022, z + Math.floor(hash(s, k, 3) * 2) * 0.04));
    return [
      { mat: "wood-mid", solid: box(0.36, 0.02, 0.36) },
      { mat: "wood-dark", solid: union(...dark, ...men(3, 0.1)), overlap: true },
      { mat: "paint-white", solid: union(...men(5, -0.14)), overlap: true },
    ];
  },
});

/** A skat pack and the slate the score is kept on, chalk beside it. */
prop({
  id: "skat", items: ["skat"], size: [0.26, 0.02, 0.16], place: "on", tris: 120,
  parts: () => [
    { mat: "card", solid: union(box(0.06, 0.012, 0.09, -0.08, 0, 0), box(0.06, 0.002, 0.09).rotate(0, 25, 0).move(-0.02, 0, 0.02)) },
    { mat: "enamel-black", solid: box(0.12, 0.006, 0.09, 0.07, 0, 0) },
    { mat: "paint-white", solid: box(0.04, 0.008, 0.008, 0.07, 0.006, 0.055), overlap: true },
  ],
});

/** An aquarium on the chest: a glass tank in an iron frame, sand, weed. */
prop({
  id: "aquarium", items: ["aquarium"], size: [0.48, 0.34, 0.28], place: "on", tris: 400,
  parts: () => [
    { mat: "glass", solid: box(0.44, 0.3, 0.24, 0, 0.02, 0) },
    { mat: "iron", solid: union(box(0.46, 0.02, 0.26), box(0.46, 0.012, 0.26, 0, 0.31, 0).minus(box(0.42, 0.02, 0.22, 0, 0.305, 0))) },
    { mat: "sand", solid: box(0.43, 0.03, 0.23, 0, 0.02, 0), overlap: true },
    { mat: "leaf", solid: union(box(0.01, 0.2, 0.004, -0.12, 0.05, 0).rotate(0, 0, 8), box(0.01, 0.16, 0.004, 0.1, 0.05, 0.05).rotate(0, 0, -6)), overlap: true },
  ],
});

/** The allotment's tools by the door: spade, rake and zinc watering can (the war's vegetables grew in the Laube). */
prop({
  id: "allotment-tools", items: ["allotment"], size: [0.7, 1.3, 0.36], place: "wall", tris: 700,
  parts: () => [
    { mat: "wood-raw", solid: union(post(0.016, 1.1, 0, 0.2, 0).rotate(0, 0, 6).move(-0.22, 0, -0.06), post(0.014, 1.2, 0, 0.1, 0).rotate(0, 0, -5).move(0.0, 0, -0.08)) },
    { mat: "iron", solid: union(box(0.18, 0.26, 0.012, -0.28, 0.0, -0.05), box(0.3, 0.02, 0.05, 0.11, 1.26, -0.08)) },
    { mat: "zinc", solid: union(lathe([[0, 0], [0.12, 0], [0.11, 0.24], [0, 0.24]], 0.2, 0, 0.1), rodX(0.012, 0.3).rotate(0, 0, 30).move(0.36, 0.2, 0.1)) },
  ],
});

/** A pigeon fancier's wicker travelling basket (racing pigeons were registered for the army in the war). */
prop({
  id: "pigeon-basket", items: ["pigeons"], size: [0.56, 0.38, 0.38], place: "floor", tris: 300,
  parts: () => [
    { mat: "straw", solid: union(rbox(0.54, 0.3, 0.36, 0.03), box(0.56, 0.05, 0.38, 0, 0.3, 0)) },
    { mat: "leather", solid: box(0.03, 0.06, 0.4, -0.15, 0.3, 0), overlap: true },
  ],
});

/** Needlework on the table: the hoop with its linen, the red thread. */
prop({
  id: "needlework", items: ["needlework"], size: [0.28, 0.03, 0.28], place: "on", tris: 400,
  parts: () => [
    { mat: "wood-mid", solid: ring(0.12, 0.006).rotate(90, 0, 0).move(0, 0.008, 0) },
    { mat: "linen", solid: zcyl(0.118, 0.002).rotate(90, 0, 0).move(0, 0.008, 0), overlap: true },
    { mat: "paint-red", solid: box(0.06, 0.003, 0.02, 0.02, 0.01, 0.0), overlap: true },
  ],
});

/** A painter's easel with a canvas on it: the bohème's room. */
prop({
  id: "easel", items: ["easel"], size: [0.76, 1.86, 0.76], place: "floor", tris: 300,
  parts: () => [
    { mat: "wood-raw", solid: union(box(0.04, 1.8, 0.03).rotate(-6, 0, 8).move(-0.15, 0, 0.1), box(0.04, 1.8, 0.03).rotate(-6, 0, -8).move(0.15, 0, 0.1), box(0.04, 1.7, 0.03).rotate(25, 0, 0).move(0, 0, -0.25), box(0.6, 0.03, 0.06, 0, 0.75, 0.04)) },
    { mat: "canvas", solid: box(0.55, 0.7, 0.02).rotate(-6, 0, 0).move(0, 0.8, 0.07), overlap: true },
  ],
});

/** The household's paper, folded open on the table: two leaves of newsprint, a fold across, the masthead up. */
prop({
  id: "newspaper", items: ["newspaper"], size: [0.44, 0.02, 0.32], place: "on", tris: 60,
  parts: () => [
    { mat: "paper-poster", solid: union(box(0.42, 0.004, 0.3, 0, 0, 0), box(0.4, 0.004, 0.28, 0.01, 0.004, 0.01).rotate(0, 6, 0)) },
    { mat: "enamel-black", solid: box(0.3, 0.001, 0.03, -0.02, 0.009, -0.11), overlap: true },
  ],
});

/** A war Christmas tree (Kriegsweihnacht, 1914-18): a small fir in its wooden cross foot, wax candles clipped to the
 *  branch tips (wax was short by 1917: a dozen at most, lit on Christmas Eve and the holidays), glass baubles and red
 *  apples, two Iron Cross ornaments of the kind sold for the war Christmases, a brass spike on top. A Christian
 *  household's Stube or salon from Christmas Eve to Epiphany (interiors/cityroom.ts by its `when`). Origin: the foot. */
prop({
  id: "christmas-tree", items: ["christmas-tree"], size: [0.9, 1.45, 0.9], place: "corner", tris: 9000,
  glow: [{ at: [0, 0.85, 0], lumens: 60, color: "#ffc070", range: 4, flicker: 0.15 }],
  parts: () => {
    const fir: Solid[] = [], wax: Solid[] = [], flames: Solid[] = [], gilt: Solid[] = [], red: Solid[] = [], iron: Solid[] = [];
    const T = 7, droop = 12;
    for (let t = 0; t < T; t++) {
      const y = 0.26 + t * 0.155, len = 0.42 * (1 - t / (T + 0.6)), n = 7 - Math.floor(t / 3);
      for (let k = 0; k < n; k++) {
        const a = (360 / n) * k + t * 23, r = len * 0.85, s = Math.sin((a * Math.PI) / 180), c = Math.cos((a * Math.PI) / 180);
        // a branch: a flat bough from the trunk, its tip sagging (+x about X sends +z down)
        fir.push(box(0.11 - t * 0.008, 0.03, len, 0, -0.015, len / 2).rotate(droop, 0, 0).rotate(0, a, 0).move(0, y, 0));
        const tip: [number, number, number] = [s * r, y - r * Math.sin((droop * Math.PI) / 180), c * r];
        if (t >= 1 && t <= 5 && k % 2 === 0) {
          wax.push(post(0.007, 0.075, tip[0], tip[1] + 0.012, tip[2]));
          flames.push(ball(0.009).scale(1, 1.8, 1).move(tip[0], tip[1] + 0.1, tip[2]));
        } else if (t < T - 1) {
          if ((k + t) % 5 === 0 && iron.length < 8) iron.push(box(0.05, 0.016, 0.004, tip[0], tip[1] - 0.06, tip[2]), box(0.016, 0.05, 0.004, tip[0], tip[1] - 0.077, tip[2]));
          else ((k + t) % 2 ? gilt : red).push(ball(0.024).move(tip[0], tip[1] - 0.045, tip[2]));
        }
      }
    }
    const top = 0.26 + (T - 1) * 0.155;
    return [
      { mat: "wood-raw" as MatId, solid: union(box(0.5, 0.05, 0.07), box(0.07, 0.05, 0.5), taper(0.035, 0.012, top + 0.02, 0, 0.05, 0)) },
      { mat: "fir" as MatId, overlap: true, solid: union(...fir) },
      { mat: "wax" as MatId, overlap: true, solid: union(...wax) },
      { mat: "flame" as MatId, overlap: true, solid: union(...flames) },
      { mat: "brass" as MatId, overlap: true, solid: union(...gilt, taper(0.022, 0.003, 0.16, 0, top + 0.04, 0)) },
      { mat: "apple-red" as MatId, overlap: true, solid: union(...red) },
      { mat: "iron" as MatId, overlap: true, solid: union(...iron) },
    ];
  },
});

export const KIT_HOME = true;
