// Trade kit for the shops read from the 1917 Adreßbuch that had no room of their own (map/1917/businesses: of the
// storefronts on Friedrich-, Leipziger and Jerusalemer Straße, 60 book and paper shops, Jerusalemer Straße's newspaper
// quarter most; 56 jewellers and watchmakers; 37 florists). Winter 1917-18: gold called in for the war ("Gold gab ich
// für Eisen", an iron ring for a gold one), paper short, cut flowers gone with the coal for the glass houses, so a
// florist's window is wreaths and evergreens: the war dead's. interiors/shops.ts lays each shop out from its profile.
import type { Solid } from "raea/3d";
import { ball, box, hash, lathe, post, rbox, ring, rodX, taper, union, zcyl } from "./geo";
import type { MatId } from "./mats";
import type { Part } from "./prop";
import { bar } from "./porter";
import { prop } from "./prop";
import { byMat } from "./store";

const SPINES: MatId[] = ["cloth-navy", "cloth-brown", "cloth-black", "cloth-field", "leather", "card", "cloth-cream", "paint-red"];
export type Mats = ReturnType<typeof byMat>;
const moved = (ps: Part[], dz: number): Part[] => ps.map((p) => ({ ...p, solid: p.solid.move(0, 0, dz) }));

/** A shelf's run of books from x0 to x1 standing on y, spines out at the front (z the books' middle): widths and
 *  heights vary, a gap where a run was sold. */
export function books(b: Mats, x0: number, x1: number, y: number, hMax: number, d: number, z: number, k: number) {
  let x = x0, i = 0;
  while (x < x1 - 0.03) {
    const w = 0.025 + hash(k, i, 1) * 0.045, h = Math.min(hMax, 0.17 + hash(k, i, 2) * 0.14);
    if (hash(k, i, 3) < 0.07) { x += 0.05 + hash(k, i, 4) * 0.12; i++; continue; }
    if (x + w > x1) break;
    b.add(SPINES[Math.floor(hash(k, i, 5) * SPINES.length)], box(w - 0.003, h, d * (0.8 + 0.2 * hash(k, i, 6)), x + w / 2, y, z));
    x += w; i++;
  }
}

/** A stack of books lying flat, each turned a little: n books from y, about (x, z). */
function stack(b: Mats, n: number, x: number, y: number, z: number, k: number) {
  for (let i = 0; i < n; i++) {
    const t = 0.022 + hash(k, i, 7) * 0.02, w = 0.16 + hash(k, i, 8) * 0.06, d = 0.22 + hash(k, i, 9) * 0.06;
    b.add(SPINES[Math.floor(hash(k, i, 10) * SPINES.length)], box(w, t, d).rotate(0, (hash(k, i, 11) - 0.5) * 14, 0).move(x, y, z));
    y += t;
  }
}

// ---- the book and paper shop (Buch- und Papierhandlung) ----

/** A bookcase to the cornice over a cupboard of stock: six shelves of cloth and leather bindings, gaps sold. With a
 *  library ladder, the brass rail and the ladder leant against it. Origin: floor, its back to the wall. */
function bookWall(ladder: boolean) {
  return () => {
    const b = byMat(), W = 2.0, H = 2.9, B = -0.23, shelves = [0.88, 1.22, 1.56, 1.9, 2.24, 2.58];
    b.add("wood-dark", union(
      box(W, H, 0.02, 0, 0, B + 0.01), box(0.04, H, 0.36, -W / 2 + 0.02, 0, B + 0.18), box(0.04, H, 0.36, W / 2 - 0.02, 0, B + 0.18),
      box(W, 0.84, 0.46, 0, 0, 0), box(W + 0.06, 0.04, 0.48, 0, 0.84, 0.01), ...shelves.slice(1).map((y) => box(W - 0.08, 0.02, 0.34, 0, y - 0.02, B + 0.18)),
      box(W + 0.1, 0.12, 0.42, 0, H - 0.12, B + 0.21),
    ));
    b.add("wood-mid", union(...[-0.5, 0.5].map((x) => box(0.9, 0.7, 0.012, x, 0.08, 0.232))));
    b.add("brass", union(...[-0.08, 0.08].map((x) => ball(0.012).move(x, 0.45, 0.245))));
    shelves.forEach((y, r) => books(b, -W / 2 + 0.05, W / 2 - 0.05, y, Math.min(0.31, (shelves[r + 1] ?? H - 0.12) - y - 0.03), 0.22, B + 0.2, 300 + r));
    if (!ladder) return b.parts();
    // the rail on brackets, the ladder's hooks on it and its feet 0.6 m out
    const rz = 0.16, top = 2.5, foot = 0.76;
    b.add("brass", union(rodX(0.012, W - 0.1, 0, top, rz), ...[-0.85, 0, 0.85].map((x) => box(0.02, 0.02, 0.05, x, top - 0.01, rz - 0.04))));
    const stiles = [0.28, 0.68].map((x) => bar([x, 0, foot], [x, top - 0.05, rz + 0.02], 0.016));
    const rungs = [0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1].map((y) => { const z = foot + (rz + 0.02 - foot) * (y / (top - 0.05)); return rodX(0.012, 0.4, 0.48, y, z); });
    b.add("wood-mid", union(...stiles, ...rungs));
    return moved(b.parts(), -(foot + B) / 2);
  };
}
prop({ id: "book-wall", items: ["shop-books-music"], size: [2.0, 2.9, 0.46], place: "wall", tris: 6000, parts: bookWall(false) });
prop({ id: "book-wall-ladder", items: ["shop-books-music"], size: [2.0, 2.9, 1.0], place: "wall", tris: 6500, parts: bookWall(true) });

/** The stationery side: drawers below, pigeonholes of reams in their wrappers and bundled envelopes, half empty (paper
 *  was rationed from 1916). Origin: floor, its back to the wall. */
prop({
  id: "paper-rack", items: ["shop-books-music"], size: [1.2, 2.2, 0.42], place: "wall", tris: 3000,
  parts: () => {
    const b = byMat(), W = 1.2, rows = [0.88, 1.15, 1.4, 1.65, 1.9], top = 2.16;
    b.add("wood-mid", union(
      box(W, 0.86, 0.42), box(W, 1.32, 0.02, 0, 0.86, -0.2), box(0.03, 1.32, 0.34, -W / 2 + 0.015, 0.86, -0.04), box(0.03, 1.32, 0.34, W / 2 - 0.015, 0.86, -0.04),
      ...rows.map((y) => box(W, 0.02, 0.34, 0, y - 0.02, -0.04)), box(W + 0.04, 0.04, 0.38, 0, top, -0.03), ...[1, 2, 3].map((c) => box(0.015, 1.3, 0.34, -W / 2 + (c * W) / 4, 0.86, -0.04)),
    ));
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 2; c++) { b.add("wood-dark", box(0.54, 0.24, 0.012, -0.29 + c * 0.58, 0.05 + r * 0.27, 0.212)); b.add("brass", box(0.08, 0.02, 0.012, -0.29 + c * 0.58, 0.2 + r * 0.27, 0.222)); }
    rows.forEach((y, r) => {
      for (let c = 0; c < 4; c++) {
        if (hash(r, c, 91) < 0.4) continue;
        const x = -W / 2 + ((c + 0.5) * W) / 4, n = 1 + Math.floor(hash(r, c, 92) * 4), m = (["paper", "card", "paper-blue", "paper"] as MatId[])[Math.floor(hash(r, c, 93) * 4)];
        b.add(m, box(0.24, 0.045 * n, 0.26, x, y, -0.06));
      }
    });
    return b.parts();
  },
});

/** A revolving stand of picture postcards, field-post cards most (Feldpostkarten: a soldier's card home went free).
 *  Origin: its foot's middle. */
prop({
  id: "postcard-stand", items: ["shop-books-music", "field-post"], size: [0.5, 1.75, 0.5], place: "floor", tris: 2500,
  parts: () => {
    const b = byMat(), wire: Solid[] = [], cards: Solid[] = [];
    for (let t = 0; t < 5; t++)
      for (let k = 0; k < 4; k++) {
        const y = 0.6 + t * 0.24, a = k * 90 + t * 20, at = (s: Solid) => s.rotate(0, a, 0).move(0, y, 0);
        wire.push(at(box(0.15, 0.03, 0.008, 0, 0, 0.17)), at(box(0.15, 0.004, 0.05, 0, 0, 0.145)));
        const n = hash(t, k, 95) < 0.2 ? 0 : 1 + Math.floor(hash(t, k, 96) * 3);
        for (let i = 0; i < n; i++) cards.push(at(box(0.14, 0.09, 0.003, 0, 0.005, 0).rotate(-14, 0, 0).move(0, 0, 0.15 + i * 0.006)));
      }
    b.add("iron", union(lathe([[0, 0], [0.22, 0], [0.2, 0.03], [0.03, 0.05], [0, 0.05]]), post(0.012, 1.62, 0, 0.05, 0), ball(0.025).move(0, 1.7, 0), ...wire));
    if (cards.length) b.add("paper-poster", union(...cards));
    return b.parts();
  },
});

/** The table of new books inside the door: stacks lying flat, a few stood up. Origin: its foot's middle. */
prop({
  id: "book-table", items: ["shop-books-music"], size: [1.2, 0.95, 0.7], place: "floor", tris: 2000,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(1.2, 0.04, 0.7, 0, 0.74, 0), box(1.1, 0.1, 0.6, 0, 0.64, 0), ...[-0.55, 0.55].flatMap((x) => [-0.3, 0.3].map((z) => box(0.05, 0.64, 0.05, x, 0, z)))));
    [[-0.4, -0.15], [-0.05, 0.12], [0.3, -0.12], [0.42, 0.18], [-0.38, 0.2]].forEach(([x, z], i) => stack(b, 1 + Math.floor(hash(i, 97) * 5), x, 0.78, z, 330 + i));
    b.add("cloth-field", box(0.16, 0.22, 0.03, 0.05, 0.78, -0.22).rotate(-8, 0, 0));
    return b.parts();
  },
});

/** Books lying in a stack, for a counter or a window. Origin: the bottom middle. */
prop({ id: "book-stack", items: ["shop-books-music"], size: [0.3, 0.2, 0.3], place: "on", tris: 300, parts: () => { const b = byMat(); stack(b, 5, 0, 0, 0, 350); return b.parts(); } });

/** A window easel holding a book up, cover out, its title label on it; one more open before it. Origin: the bottom
 *  middle; the cover faces +z. */
prop({
  id: "book-stand", items: ["shop-books-music"], size: [0.28, 0.32, 0.22], place: "on", tris: 400,
  parts: () => [
    { mat: "wood-mid", solid: union(bar([-0.06, 0, -0.08], [-0.05, 0.27, -0.03], 0.006), bar([0.06, 0, -0.08], [0.05, 0.27, -0.03], 0.006), box(0.2, 0.012, 0.03, 0, 0.03, 0.0)) },
    { mat: "cloth-navy", solid: box(0.17, 0.25, 0.025, 0, 0, 0).rotate(-15, 0, 0).move(0, 0.04, 0.0) },
    { mat: "paper", solid: union(box(0.09, 0.05, 0.003, 0, 0.17, 0.015).rotate(-15, 0, 0).move(0, 0.04, 0.012), box(0.24, 0.012, 0.15, 0, 0, 0.07).rotate(4, 0, 0)), overlap: true },
  ],
});

/** A school globe on a turned foot under its brass meridian. Origin: the bottom middle. */
prop({
  id: "globe", items: ["shop-books-music"], size: [0.32, 0.48, 0.32], place: "on", tris: 1500,
  parts: () => [
    { mat: "wood-dark", solid: lathe([[0, 0], [0.09, 0], [0.09, 0.025], [0.04, 0.04], [0.02, 0.12], [0, 0.12]]) },
    { mat: "brass", solid: union(ring(0.155, 0.006).rotate(0, 90, 0).rotate(0, 0, 23).move(0, 0.29, 0), post(0.008, 0.04, 0, 0.12, 0)) },
    { mat: "paper-blue", solid: ball(0.14).move(0, 0.29, 0) },
  ],
});

/** A bookseller's window riser: three steps of new books stood face out, leaning back, a title label on each.
 *  Origin: the bottom middle; the covers face +z. */
prop({
  id: "book-pyramid", items: ["shop-books-music"], size: [0.7, 0.55, 0.34], place: "on", tris: 900,
  parts: () => {
    const b = byMat(), labels: Solid[] = [];
    b.add("wood-mid", union(box(0.7, 0.04, 0.34), box(0.52, 0.12, 0.22, 0, 0.04, -0.06), box(0.34, 0.12, 0.12, 0, 0.16, -0.11)));
    [[0.04, 0.11, 4], [0.16, 0.0, 3], [0.28, -0.1, 2]].forEach(([y, z, n], s) => {
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 0.165, w = 0.13 + hash(s, i, 125) * 0.03, h = 0.18 + hash(s, i, 126) * 0.05;
        const at = (q: Solid) => q.rotate(-14, 0, 0).move(x, y, z);
        b.add(SPINES[Math.floor(hash(s, i, 127) * SPINES.length)], at(box(w, h, 0.02, 0, 0, 0)));
        labels.push(at(box(w * 0.6, 0.035, 0.002, 0, h * 0.62, 0.011)));
      }
    });
    b.add("paper", union(...labels));
    return b.parts();
  },
});

/** A jeweller's window étagère: a brass frame, three glass shelves, on them pocket watches on stands, silver cups,
 *  ring boxes open on velvet, a mantel clock below. Origin: the bottom middle; it faces +z. */
prop({
  id: "jewel-etagere", items: ["shop-jeweller"], size: [0.6, 0.78, 0.3], place: "on", tris: 2500,
  parts: () => {
    const b = byMat(), shelves = [0.02, 0.27, 0.52], cups: Solid[] = [], watches: Solid[] = [], boxes: Solid[] = [], faces: Solid[] = [];
    b.add("brass", union(...[-0.28, 0.28].flatMap((x) => [-0.12, 0.12].map((z) => post(0.007, 0.76, x, 0, z))), ...[-0.28, 0.28].map((x) => ball(0.014).move(x, 0.77, 0.12))));
    b.add("glass", union(...shelves.map((y) => box(0.58, 0.008, 0.26, 0, y, 0))));
    shelves.forEach((y, s) => {
      for (let i = 0; i < 4; i++) {
        const x = -0.2 + i * 0.135, k = hash(s, i, 128), y0 = y + 0.008;
        if (k < 0.15) continue;
        if (k < 0.4) cups.push(lathe([[0, 0], [0.03, 0], [0.012, 0.015], [0.01, 0.06], [0.035, 0.11], [0.03, 0.115], [0, 0.07]], x, y0, 0.0, 14));
        else if (k < 0.7) { watches.push(union(box(0.05, 0.004, 0.04, x, y0, 0.03), post(0.002, 0.06, x, y0, 0.03), zcyl(0.024, 0.01).move(x, y0 + 0.08, 0.035))); faces.push(zcyl(0.02, 0.002).move(x, y0 + 0.08, 0.041)); }
        else boxes.push(rbox(0.06, 0.035, 0.05, 0.006, x, y0, 0.03), rbox(0.06, 0.035, 0.008, 0.004, x, y0 + 0.035, 0.0).rotate(0, 0, 0));
      }
    });
    if (cups.length) b.add("steel-bright", union(...cups));
    if (watches.length) { b.add("brass", union(...watches)); b.add("enamel", union(...faces)); }
    if (boxes.length) b.add("plush", union(...boxes));
    return b.parts();
  },
});

// ---- the jeweller and watchmaker (Juwelier, Uhrmacher) ----

/** The clock wall: a cupboard of drawers, the panel above it hung with regulators and round office clocks, all set
 *  going. Origin: floor, its back to the wall. */
prop({
  id: "clock-board", items: ["shop-jeweller", "regulator"], size: [1.5, 2.6, 0.46], place: "wall", tris: 3500,
  parts: () => {
    const b = byMat(), cases: Solid[] = [], glass: Solid[] = [], dials: Solid[] = [], brass: Solid[] = [];
    [[-0.5, 1.15, 0.8], [0, 1.08, 0.88], [0.5, 1.15, 0.8]].forEach(([x, y, h]) => {
      cases.push(box(0.26, h, 0.1, x, y, -0.16), box(0.3, 0.05, 0.12, x, y + h, -0.16));
      glass.push(box(0.2, h - 0.08, 0.004, x, y + 0.04, -0.108));
      dials.push(zcyl(0.08, 0.006).move(x, y + h - 0.13, -0.11));
      brass.push(post(0.003, h - 0.35, x, y + 0.12, -0.12), zcyl(0.04, 0.008).move(x, y + 0.14, -0.12));
    });
    for (const x of [-0.25, 0.25]) { cases.push(zcyl(0.11, 0.05).move(x, 2.25, -0.17)); dials.push(zcyl(0.095, 0.004).move(x, 2.25, -0.143)); }
    b.add("wood-dark", union(box(1.5, 0.9, 0.46), box(1.54, 0.04, 0.48, 0, 0.9, 0.01), box(1.5, 1.66, 0.03, 0, 0.94, -0.215), box(1.56, 0.06, 0.08, 0, 2.54, -0.19), ...cases));
    b.add("wood-mid", union(...[0, 1].flatMap((r) => [-0.5, 0, 0.5].map((x) => box(0.44, 0.38, 0.012, x, 0.06 + r * 0.42, 0.232)))));
    b.add("glass", union(...glass));
    b.add("enamel", union(...dials));
    b.add("brass", union(...brass, ...[0, 1].flatMap((r) => [-0.5, 0, 0.5].map((x) => ball(0.012).move(x, 0.27 + r * 0.42, 0.245)))));
    return b.parts();
  },
});

/** A long-case clock (Standuhr) for sale: its pendulum and weights behind the trunk's glass, the dial in the hood.
 *  Origin: floor, its back to the wall. */
prop({
  id: "clock-case", items: ["shop-jeweller"], size: [0.55, 2.2, 0.36], place: "wall", tris: 1500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.55, 0.15, 0.36), box(0.45, 1.3, 0.3, 0, 0.15, -0.02), box(0.53, 0.55, 0.34, 0, 1.45, 0), box(0.55, 0.1, 0.36, 0, 2.0, 0)) },
    { mat: "glass", solid: box(0.3, 1.0, 0.004, 0, 0.3, 0.132), overlap: true },
    { mat: "brass", solid: union(post(0.004, 0.85, 0, 0.55, 0.06), zcyl(0.06, 0.01).move(0, 0.55, 0.06), post(0.02, 0.22, -0.07, 0.95, 0.02), post(0.02, 0.22, 0.07, 1.05, 0.02), ring(0.15, 0.008).move(0, 1.72, 0.172), ...[-0.24, 0.24].map((x) => ball(0.025).move(x, 2.12, 0))), overlap: true },
    { mat: "enamel", solid: zcyl(0.15, 0.008).move(0, 1.72, 0.168), overlap: true },
  ],
});

/** The watchmaker's bench in the shop: high, with its bank of small drawers, a movement under a glass bell, the
 *  turns, a lamp on an arm, the tools racked at the back. Origin: floor, its back to the wall. */
prop({
  id: "watch-bench", items: ["shop-jeweller"], size: [1.2, 1.4, 0.62], place: "wall", tris: 2500,
  parts: () => {
    const b = byMat(), y = 0.92;
    b.add("wood-dark", union(box(0.46, y - 0.02, 0.6, -0.36, 0, 0), box(0.06, y - 0.02, 0.6, 0.57, 0, 0), box(1.2, 0.04, 0.62, 0, y - 0.02, 0), box(1.2, 0.03, 0.03, 0, y + 0.02, -0.295), box(1.0, 0.2, 0.03, 0, y + 0.05, -0.29), box(0.9, 0.03, 0.03, 0.05, 0.12, 0.2)));
    b.add("wood-mid", union(...[0, 1, 2, 3, 4, 5].map((k) => box(0.4, 0.12, 0.012, -0.36, 0.08 + k * 0.14, 0.302))));
    b.add("brass", union(...[0, 1, 2, 3, 4, 5].map((k) => ball(0.008).move(-0.36, 0.14 + k * 0.14, 0.31)), zcyl(0.03, 0.008).rotate(90, 0, 0).move(0.22, y + 0.01, 0.0)));
    b.add("glass", lathe([[0.05, 0], [0.055, 0], [0.055, 0.08], [0.03, 0.11], [0, 0.115], [0, 0.11], [0.025, 0.105], [0.05, 0.078]], 0.22, y + 0.02, 0.0));
    b.add("iron", union(box(0.2, 0.06, 0.06, -0.12, y + 0.02, -0.08), post(0.01, 0.4, -0.5, y + 0.02, -0.2), bar([-0.5, y + 0.42, -0.2], [-0.25, y + 0.38, -0.05], 0.007), ...[-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((x) => post(0.005, 0.1, x, y + 0.1, -0.26))));
    b.add("glass-green", lathe([[0.02, 0.04], [0.08, -0.02], [0.085, -0.015], [0.025, 0.045]], -0.25, y + 0.36, -0.05));
    b.add("cloth-black", zcyl(0.015, 0.03).rotate(90, 0, 0).move(0.05, y + 0.02, 0.15));
    return b.parts();
  },
});

/** A velvet tray of pocket watches, gold and silver and the war's gunmetal. Origin: the bottom middle. */
prop({
  id: "watch-tray", items: ["shop-jeweller"], size: [0.42, 0.05, 0.3], place: "on", tris: 900,
  parts: () => {
    const b = byMat(), M: MatId[] = ["brass", "steel-bright", "iron"];
    b.add("plush", rbox(0.42, 0.025, 0.3, 0.008));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 4; c++) {
        if (hash(r, c, 98) < 0.25) continue;
        b.add(M[Math.floor(hash(r, c, 99) * 3)], union(zcyl(0.024, 0.01).rotate(90, 0, 0).move(-0.15 + c * 0.1, 0.03, -0.065 + r * 0.13), post(0.004, 0.008, -0.15 + c * 0.1, 0.026, -0.065 + r * 0.13 - 0.027)));
      }
    return b.parts();
  },
});

/** A ring tray: rows of slits in velvet, rings standing in them: gold few, iron many (the iron ring given for a gold
 *  one, "Gold gab ich für Eisen"). Origin: the bottom middle. */
prop({
  id: "ring-tray", items: ["shop-jeweller", "iron-ring"], size: [0.3, 0.05, 0.2], place: "on", tris: 1500,
  parts: () => {
    const b = byMat(), gold: Solid[] = [], iron: Solid[] = [];
    b.add("plush", rbox(0.3, 0.025, 0.2, 0.006));
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 7; c++) {
        if (hash(r, c, 101) < 0.3) continue;
        (hash(r, c, 102) < 0.3 ? gold : iron).push(ring(0.009, 0.0024, 10, 4).rotate(0, 90, 0).move(-0.12 + c * 0.04, 0.03, -0.06 + r * 0.06));
      }
    if (gold.length) b.add("brass", union(...gold));
    if (iron.length) b.add("iron", union(...iron));
    return b.parts();
  },
});

/** A window stand of pocket watches on hooks, faces out. Origin: the bottom middle; the faces look +z. */
prop({
  id: "watch-stand", items: ["shop-jeweller"], size: [0.3, 0.38, 0.16], place: "on", tris: 900,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.3, 0.03, 0.16), post(0.008, 0.32, 0, 0.03, -0.04), rodX(0.006, 0.28, 0, 0.34, -0.04)) },
    { mat: "brass", solid: union(...[-0.11, -0.04, 0.04, 0.11].map((x, i) => union(zcyl(0.025, 0.011).move(x, 0.27 - (i % 2) * 0.05, -0.03), post(0.0015, 0.05 + (i % 2) * 0.05, x, 0.295 - (i % 2) * 0.05, -0.035)))) },
    { mat: "enamel", solid: union(...[-0.11, -0.04, 0.04, 0.11].map((x, i) => zcyl(0.021, 0.002).move(x, 0.27 - (i % 2) * 0.05, -0.024))), overlap: true },
  ],
});

/** A marble mantel clock with brass columns. Origin: the bottom middle; the dial looks +z. */
prop({
  id: "mantel-clock", items: ["shop-jeweller"], size: [0.36, 0.34, 0.15], place: "on", tris: 900,
  parts: () => [
    { mat: "marble", solid: union(box(0.36, 0.04, 0.15), box(0.24, 0.24, 0.12, 0, 0.04, 0), box(0.28, 0.03, 0.14, 0, 0.28, 0)) },
    { mat: "brass", solid: union(...[-0.15, 0.15].map((x) => post(0.012, 0.24, x, 0.04, 0.04)), ring(0.062, 0.004).move(0, 0.17, 0.062), lathe([[0, 0], [0.03, 0], [0.02, 0.025], [0, 0.03]], 0, 0.31, 0)) },
    { mat: "enamel", solid: zcyl(0.06, 0.004).move(0, 0.17, 0.06), overlap: true },
  ],
});

/** "Gold gab ich für Eisen": the war-loan placard on an easel, an iron ring and an Iron Cross on a velvet cushion
 *  before it. Origin: the bottom middle; the card faces +z. */
prop({
  id: "gold-for-iron", items: ["shop-jeweller", "iron-ring"], size: [0.3, 0.36, 0.16], place: "on", tris: 600,
  parts: () => [
    { mat: "wood-dark", solid: union(bar([-0.08, 0, -0.06], [-0.07, 0.33, -0.02], 0.005), bar([0.08, 0, -0.06], [0.07, 0.33, -0.02], 0.005), box(0.24, 0.01, 0.025, 0, 0.04, -0.01)) },
    { mat: "paper-poster", solid: box(0.22, 0.29, 0.004, 0, 0, 0).rotate(-10, 0, 0).move(0, 0.05, -0.005) },
    { mat: "plush", solid: rbox(0.12, 0.025, 0.08, 0.008, 0, 0, 0.06), overlap: true },
    { mat: "iron", solid: union(ring(0.011, 0.003, 14, 6).rotate(90, 0, 0).move(-0.03, 0.028, 0.06), box(0.045, 0.004, 0.013, 0.03, 0.025, 0.06), box(0.013, 0.004, 0.045, 0.03, 0.025, 0.06)), overlap: true },
  ],
});

// ---- the florist (Blumengeschäft) ----

/** One evergreen wreath (fir on a straw ring), its ribbons hanging. */
export function wreath(b: Mats, R: number, x: number, y: number, z: number, tilt: number, k: number) {
  const at = (s: Solid) => s.rotate(tilt, 0, 0).move(x, y, z), n = 36, L = ((2 * Math.PI * R) / n) * 3.8;
  b.add("straw", at(ring(R, R * 0.1, 24, 6)));
  // the fir bound on in sprigs along the ring, butts back, two courses (inside and out), each sprig tipped out of the
  // ring's plane: a smooth torus reads as a tyre
  const sprigs: Solid[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI, r = R * (i % 2 ? 1.12 : 0.9);
    sprigs.push(taper(R * 0.11, 0.003, L).rotate((i % 2 ? 22 : -14) + hash(k, i, 124) * 10, 0, 0).rotate(0, 0, (a * 180) / Math.PI).move(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  b.add("leaf", at(union(...sprigs)));
  const M: MatId[] = ["cloth-black", "cloth-cream", "paint-white"], m = M[Math.floor(hash(k, 103) * 3)];
  b.add(m, at(union(box(0.05, R * 1.5, 0.004, -0.04, -R - R * 1.3, R * 0.24).rotate(0, 0, 6), box(0.05, R * 1.4, 0.004, 0.04, -R - R * 1.2, R * 0.24).rotate(0, 0, -6), rbox(0.1, 0.05, 0.02, 0.008, 0, -R - 0.03, R * 0.22))));
  if (hash(k, 104) < 0.6) b.add("flower", at(union(...[0.9, 1.5, 2.1].map((a) => ball(0.022).move(Math.cos(a) * R, Math.sin(a) * R, R * 0.2)))));
}

/** A florist's easel of mourning wreaths, black and white ribbons. Origin: its foot's middle. */
prop({
  id: "wreath-stand", items: ["shop-florist", "mourning-crape"], size: [0.75, 1.75, 0.5], place: "floor", tris: 4500,
  parts: () => {
    const b = byMat();
    b.add("wood-raw", union(bar([-0.3, 0, 0.12], [-0.2, 1.7, -0.06], 0.014), bar([0.3, 0, 0.12], [0.2, 1.7, -0.06], 0.014), bar([0, 0, -0.24], [0, 1.65, -0.08], 0.014), rodX(0.012, 0.5, 0, 1.45, -0.03), rodX(0.012, 0.58, 0, 0.82, 0.03)));
    wreath(b, 0.22, 0, 1.2, 0.02, -8, 1);
    wreath(b, 0.19, 0, 0.58, 0.08, -8, 2);
    return b.parts();
  },
});

/** A small wreath on a wire stand, for a window step or the counter. Origin: the bottom middle. */
prop({
  id: "wreath-small", items: ["shop-florist"], size: [0.4, 0.42, 0.16], place: "on", tris: 2200,
  parts: () => { const b = byMat(); b.add("iron", union(bar([-0.08, 0, -0.06], [0, 0.4, -0.03], 0.003), bar([0.08, 0, -0.06], [0, 0.4, -0.03], 0.003))); wreath(b, 0.15, 0, 0.22, 0.0, -18, 3); return b.parts(); },
});

/** Fir and box in a zinc bucket, a few chrysanthemums: what a florist had that winter. */
function bucket(b: Mats, x: number, y: number, z: number, k: number, full = false) {
  b.add("zinc", taper(0.085, 0.105, 0.24, x, y, z));
  if (!full && hash(k, 105) < 0.2) return; // sold out
  const sprigs = 3 + Math.floor(hash(k, 106) * 3);
  b.add("leaf", union(...Array.from({ length: sprigs }, (_, i) => taper(0.05, 0.004, 0.38 + hash(k, i, 107) * 0.18).rotate(8 + hash(k, i, 108) * 14, 0, 0).rotate(0, (i * 360) / sprigs + hash(k, i, 109) * 40, 0).move(x, y + 0.16, z))));
  if (hash(k, 110) < 0.5) b.add("flower", union(...[0, 1, 2].map((i) => ball(0.032).move(x + (hash(k, i, 111) - 0.5) * 0.1, y + 0.5 + hash(k, i, 112) * 0.12, z + (hash(k, i, 113) - 0.5) * 0.1))));
}

/** A two-step stand of buckets. Origin: floor, its back to the wall. */
prop({
  id: "flower-buckets", items: ["shop-florist"], size: [0.95, 1.2, 0.42], place: "wall", tris: 3500,
  parts: () => {
    const b = byMat();
    b.add("wood-grey", union(box(0.95, 0.25, 0.42), box(0.95, 0.25, 0.21, 0, 0.25, -0.105)));
    [-0.3, 0, 0.3].forEach((x, i) => { bucket(b, x, 0.25, 0.1, 10 + i); bucket(b, x + 0.05, 0.5, -0.1, 20 + i); });
    return b.parts();
  },
});

/** One bucket of fir on the floor or a window step. Origin: the bottom middle. */
prop({ id: "fir-bucket", items: ["shop-florist"], size: [0.36, 0.75, 0.36], place: "floor", tris: 1200, parts: () => { const b = byMat(); bucket(b, 0, 0, 0, 31, true); return b.parts(); } });

/** A plant staging (Blumentreppe): three steps of pot plants, aspidistras and clivias that keep through a coal-less
 *  winter, a cyclamen or two in flower. Origin: floor, its back to the wall. */
prop({
  id: "plant-staging", items: ["shop-florist", "aspidistra"], size: [1.6, 1.4, 0.6], place: "wall", tris: 4000,
  parts: () => {
    const b = byMat(), steps = [[0.35, 0.17], [0.65, 0.0], [0.95, -0.17]], pots: Solid[] = [], blades: Solid[] = [], blooms: Solid[] = [];
    b.add("wood-grey", union(...steps.map(([y, z]) => box(1.6, 0.04, 0.22, 0, y - 0.04, z)), ...[-0.75, 0.75].map((x) => box(0.04, 0.95, 0.58, x, 0, 0))));
    steps.forEach(([y, z], s) => {
      for (let i = 0; i < 4; i++) {
        if (hash(s, i, 114) < 0.2) continue;
        const x = -0.55 + i * 0.37 + (hash(s, i, 115) - 0.5) * 0.08, k = s * 10 + i;
        pots.push(lathe([[0, 0], [0.065, 0], [0.085, 0.13], [0.09, 0.14], [0, 0.14]], x, y, z, 12));
        const n = 5 + Math.floor(hash(k, 116) * 4), cyclamen = hash(k, 117) < 0.25;
        for (let j = 0; j < n; j++) blades.push(box(cyclamen ? 0.05 : 0.035, cyclamen ? 0.1 : 0.3 + hash(k, j, 118) * 0.15, 0.004).rotate(cyclamen ? 60 : 18 + hash(k, j, 119) * 22, 0, 0).rotate(0, (j * 360) / n + hash(k, j, 120) * 30, 0).move(x, y + 0.13, z));
        if (cyclamen) for (let j = 0; j < 4; j++) blooms.push(ball(0.02).move(x + (hash(k, j, 121) - 0.5) * 0.08, y + 0.26 + hash(k, j, 122) * 0.05, z + (hash(k, j, 123) - 0.5) * 0.08));
      }
    });
    b.add("terracotta", union(...pots));
    b.add("leaf", union(...blades));
    if (blooms.length) b.add("flower", union(...blooms));
    return b.parts();
  },
});

/** The counter's roll of wrapping paper on its iron holder, a sheet out, sprigs laid on it. Origin: the bottom
 *  middle. */
prop({
  id: "flower-paper", items: ["shop-florist"], size: [0.48, 0.14, 0.32], place: "on", tris: 600,
  parts: () => [
    { mat: "iron", solid: union(box(0.02, 0.1, 0.06, -0.22, 0, -0.1), box(0.02, 0.1, 0.06, 0.22, 0, -0.1)) },
    { mat: "paper", solid: union(rodX(0.04, 0.4, 0, 0.08, -0.1), box(0.38, 0.003, 0.24, 0, 0, 0.04)) },
    { mat: "leaf", solid: union(...[-0.08, 0.02, 0.1].map((x, i) => taper(0.025, 0.003, 0.22).rotate(90, 0, 0).rotate(0, 70 + i * 12, 0).move(x, 0.02, 0.05))), overlap: true },
  ],
});

export const KIT_TRADE = true;
