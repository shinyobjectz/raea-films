// Shop kit for Leipziger Straße's trades (research/catalogue/trades.ts: of its 213 storefronts, fabric 24, fashion 22,
// furs 15, hats 13, small goods 12, menswear 11, shoes 10). Winter 1917-18: clothes and shoes only against a purchase
// permit (the Bezugsschein, from 1916), shelves thin, paper-yarn cloth in place of wool, wooden soles for want of
// leather, a few good pieces kept back for the window. interiors/shops.ts lays a shop out from these by its trade.
import { crossSection, type Solid } from "raea/3d";
import type { MatId } from "./mats";
import { ball, zcone, zcyl, box, hash, lathe, post, rbox, rodX, taper, union, ring } from "./geo";
import { prop, type Part } from "./prop";

const TEXTILE = ["shop-fabric", "shop-fashion", "shop-menswear", "shop-small-goods", "shop-furs", "shop-hats"];
const CLOTHS: MatId[] = ["cloth-navy", "cloth-field", "cloth-brown", "cloth-black", "cloth-cream"];

/** Solids gathered by material, so a prop with many small pieces is still one part a material. */
export function byMat(): { add: (m: MatId, s: Solid) => void; parts: () => Part[] } {
  const m = new Map<MatId, Solid[]>();
  return {
    add: (k, s) => { m.set(k, [...(m.get(k) ?? []), s]); },
    // after the first, a part is what the first holds or wears (bolts in their pigeonholes, a lid on its box, a band
    // on a hat): it sits into the first on purpose
    parts: () => [...m.entries()].map(([mat, s], i) => ({ mat, solid: union(...s), ...(i > 0 ? { overlap: true } : {}) })),
  };
}

/** The draper's counter: a mahogany case on a plinth, a wide top, a brass yard measure let into the customer's edge. */
prop({
  id: "store-counter", items: TEXTILE, size: [2.8, 0.95, 0.7], place: "floor", tris: 600,
  parts: () => {
    const panels = [0, 1, 2, 3].map((i) => box(0.6, 0.6, 0.02, -1.05 + i * 0.7, 0.15, 0.335));
    return [
      { mat: "wood-dark", solid: union(box(2.8, 0.86, 0.66), box(2.84, 0.08, 0.7), box(2.9, 0.05, 0.74, 0, 0.88, 0), ...panels) },
      { mat: "brass", solid: rodX(0.006, 2.6, 0, 0.935, 0.36) },
    ];
  },
});

/** A glass-topped counter for small goods: a wooden base, a glazed case on it, boxes and gloves inside. */
prop({
  id: "glass-counter", items: ["shop-small-goods", "shop-jeweller", "shop-fancy", "shop-hats"], size: [2.2, 0.95, 0.65], place: "floor", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(2.2, 0.5, 0.65), box(2.24, 0.04, 0.69, 0, 0.5, 0), box(2.24, 0.03, 0.69, 0, 0.92, 0)));
    for (const x of [-1.09, 1.09]) for (const z of [-0.31, 0.31]) b.add("wood-dark", box(0.03, 0.4, 0.03, x, 0.53, z));
    b.add("glass-plate", union(box(2.14, 0.38, 0.006, 0, 0.535, 0.32), box(2.14, 0.006, 0.6, 0, 0.92, 0), box(0.006, 0.38, 0.6, -1.08, 0.535, 0), box(0.006, 0.38, 0.6, 1.08, 0.535, 0)));
    for (let i = 0; i < 6; i++) {
      if (hash(i, 51) < 0.3) continue; // what the war left
      const x = -0.85 + i * 0.34;
      b.add("card", box(0.22, 0.05, 0.16, x, 0.54, -0.05 + 0.1 * hash(i, 52)));
      if (hash(i, 53) < 0.5) b.add("leather", rbox(0.18, 0.012, 0.08, 0.005, x + 0.02, 0.6, 0.12));
    }
    return b.parts();
  },
});

/** The draper's wall: pigeonholes of cloth bolts, folded edge out, a cornice. Half the holes empty in 1917. */
for (const [id, fill] of [["cloth-shelves", 0.55], ["cloth-shelves-bare", 0.25]] as const)
  prop({
    id, items: ["shop-fabric", "shop-fashion", "shop-menswear"], size: [3.0, 2.8, 0.5], place: "wall", tris: 2500,
    parts: () => {
      const b = byMat(), W = 3.0, cols = 4, cw = (W - 0.05 * (cols + 1)) / cols, rows = [0.12, 0.6, 1.08, 1.56, 2.04];
      b.add("wood-dark", union(box(W, 2.6, 0.02, 0, 0, -0.24), box(W + 0.1, 0.16, 0.54, 0, 2.6, 0.01), box(W, 0.1, 0.5, 0, 0, 0), ...Array.from({ length: cols + 1 }, (_, i) => box(0.05, 2.6, 0.48, -W / 2 + 0.025 + i * (cw + 0.05), 0, 0)), ...rows.map((y) => box(W, 0.025, 0.48, 0, y - 0.025, 0))));
      rows.forEach((y, r) => {
        for (let c = 0; c < cols; c++) {
          if (hash(r, c, 61, fill) > fill) continue;
          const n = 1 + Math.floor(hash(r, c, 62) * 4), x = -W / 2 + 0.05 + cw / 2 + c * (cw + 0.05);
          for (let k = 0; k < n; k++) {
            const t = 0.07 + 0.03 * hash(r, c, k, 63);
            b.add(CLOTHS[Math.floor(hash(r, c, k, 64) * CLOTHS.length)], box(cw - 0.06 - 0.04 * hash(r, c, k, 65), t, 0.4, x + 0.02 * (hash(r, c, k, 66) - 0.5), y + k * 0.095, 0.02));
          }
        }
      });
      return b.parts();
    },
  });

/** Bolts on the counter and the yard stick: what the draper has just shown a customer. */
prop({
  id: "bolt-stack", items: ["shop-fabric", "shop-fashion"], size: [0.7, 0.24, 0.45], place: "on", tris: 300,
  parts: () => [
    { mat: "cloth-field", solid: box(0.62, 0.08, 0.4).rotate(0, 4, 0) },
    { mat: "cloth-navy", solid: box(0.6, 0.075, 0.4, 0.02, 0.08, 0).rotate(0, -6, 0) },
    { mat: "cloth-cream", solid: union(box(0.58, 0.07, 0.38, -0.01, 0.155, 0.01), box(0.4, 0.004, 0.3, -0.05, 0.004, 0.32)) }, // paper-yarn, a length run out
    { mat: "wood-mid", solid: rodX(0.008, 0.9, 0.05, 0.24, 0.12) },
  ],
});

/** A tailor's bust on its tripod: linen over the form, a brass pole. `dressed` puts a coat on it. */
function bust(b: ReturnType<typeof byMat>, top = 0.9) {
  for (let i = 0; i < 3; i++) b.add("wood-dark", box(0.035, 0.03, 0.26, 0, 0.02, 0.12).rotate(0, i * 120, 0));
  b.add("brass", post(0.012, top, 0, 0.03, 0));
  b.add("linen-grey", lathe([[0, 0], [0.15, 0], [0.17, 0.1], [0.14, 0.28], [0.18, 0.42], [0.16, 0.56], [0.07, 0.64], [0.05, 0.7], [0, 0.72]], 0, 0, 0, 24).scale(1, 1, 0.72).move(0, top, 0));
}
prop({
  id: "dress-form", items: ["shop-fashion", "shop-fabric"], size: [0.45, 1.65, 0.4], place: "floor", tris: 1500,
  parts: () => { const b = byMat(); bust(b); return b.parts(); },
});
/** A coat on a form in the window: the one good coat kept back for show, ticketed against a permit. */
for (const [id, mat, items] of [["coat-form-navy", "cloth-navy", ["shop-fashion", "shop-menswear"]], ["coat-form-field", "cloth-field", ["shop-menswear", "shop-fashion"]], ["fur-coat-form", "fur", ["shop-furs"]]] as const)
  prop({
    id, items: [...items], size: [0.6, 1.65, 0.5], place: "floor", tris: 2000,
    parts: () => {
      const b = byMat();
      bust(b, 0.85);
      const coat = lathe([[0, 0.15], [0.29, 0.15], [0.25, 0.6], [0.19, 0.95], [0.2, 1.25], [0.19, 1.42], [0.08, 1.52], [0.065, 1.58], [0, 1.58]], 0, 0, 0, 28).scale(1, 1, 0.78);
      b.add(mat, mat === "fur" ? union(coat, ring(0.11, 0.05).rotate(90, 0, 0).scale(1, 0.8, 0.8).move(0, 1.5, 0)) : union(coat, taper(0.085, 0.07, 0.07, 0, 1.52, 0)));
      b.add("card", box(0.07, 0.1, 0.003, 0.12, 1.1, 0.205)); // the price ticket
      return b.parts();
    },
  });

/** A hat on its stand: a turned foot, a brass stem, a felt hat. Ladies' wide brim and band, or a man's homburg. */
function hat(b: ReturnType<typeof byMat>, y: number, wide: boolean) {
  const r = wide ? 0.19 : 0.15;
  b.add("felt", union(lathe([[0, 0], [r, 0], [r, 0.008], [0, 0.012]], 0, y, 0, 28), lathe(wide ? [[0, 0], [0.085, 0], [0.09, 0.05], [0.075, 0.1], [0, 0.11]] : [[0, 0], [0.085, 0], [0.085, 0.09], [0.06, 0.12], [0, 0.11]], 0, y, 0, 24)));
  b.add(wide ? "cloth-cream" : "cloth-black", taper(0.088, 0.086, 0.025, 0, y + 0.006, 0));
}
for (const [id, tall, wide] of [["hat-stand", false, true], ["hat-stand-homburg", false, false], ["hat-stand-tall", true, true]] as const)
  prop({
    id, items: ["shop-hats", "shop-menswear"], size: tall ? [0.4, 1.55, 0.4] : [0.36, 0.45, 0.36], place: tall ? "floor" : "on", tris: 900,
    parts: () => {
      const b = byMat(), stem = tall ? 1.32 : 0.26;
      b.add("wood-dark", lathe(tall ? [[0, 0], [0.16, 0], [0.16, 0.03], [0.05, 0.06], [0, 0.06]] : [[0, 0], [0.07, 0], [0.07, 0.02], [0.03, 0.04], [0, 0.04]], 0, 0, 0, 20));
      b.add("brass", union(post(0.008, stem, 0, 0.03, 0), lathe([[0, 0], [0.06, 0.03], [0.05, 0.06], [0, 0.07]], 0, stem, 0, 16)));
      hat(b, stem + 0.05, wide);
      return b.parts();
    },
  });

/** Round hatboxes, three high, lids on. */
prop({
  id: "hatbox-stack", items: ["shop-hats"], size: [0.5, 0.72, 0.5], place: "floor", tris: 1200,
  parts: () => {
    const b = byMat();
    [[0.24, 0], [0.21, 0.26], [0.18, 0.5]].forEach(([r, y], i) => {
      b.add("card", post(r, 0.22, 0.02 * i, y, -0.01 * i));
      b.add(i === 1 ? "cloth-black" : "paper-poster", post(r + 0.006, 0.05, 0.02 * i, y + 0.18, -0.01 * i));
    });
    return b.parts();
  },
});

/** The shoe shop's wall: shoe boxes end out in rows, a pasted label on each. Half gone: leather is rationed. */
prop({
  id: "shoe-shelves", items: ["shop-shoes"], size: [2.4, 2.6, 0.4], place: "wall", tris: 2500,
  parts: () => {
    const b = byMat(), W = 2.4, rows = [0.1, 0.42, 0.74, 1.06, 1.38, 1.7, 2.02];
    b.add("wood-mid", union(box(W, 2.45, 0.02, 0, 0, -0.19), box(0.04, 2.45, 0.38, -W / 2 + 0.02, 0, 0), box(0.04, 2.45, 0.38, W / 2 - 0.02, 0, 0), box(W + 0.06, 0.1, 0.42, 0, 2.45, 0), ...rows.map((y) => box(W, 0.02, 0.38, 0, y - 0.02, 0))));
    rows.forEach((y, r) => {
      for (let c = 0; c < 6; c++) {
        if (hash(r, c, 71) < 0.45) continue;
        const x = -W / 2 + 0.24 + c * 0.38;
        b.add("card", box(0.34, 0.13, 0.34, x, y, 0));
        b.add("paper", box(0.12, 0.05, 0.002, x, y + 0.04, 0.171));
      }
    });
    return b.parts();
  },
});

/** A pair of ladies' lace-up boots on wooden soles (Holzsohlen): the war shoe. */
prop({
  id: "shoe-pair", items: ["shop-shoes"], size: [0.3, 0.18, 0.28], place: "on", tris: 2600,
  parts: () => {
    const b = byMat();
    for (const x of [-0.06, 0.07]) {
      b.add("wood-mid", union(rbox(0.085, 0.025, 0.25, 0.01, x, 0, 0), box(0.06, 0.035, 0.06, x, 0, -0.09)));
      b.add("leather", union(rbox(0.08, 0.06, 0.2, 0.025, x, 0.02, 0.02), rbox(0.075, 0.15, 0.09, 0.02, x, 0.02, -0.07)));
    }
    return b.parts();
  },
});

/** A glazed cabinet for gloves, ties and collars: a frame, glass all round, glass shelves. */
prop({
  id: "vitrine", items: ["shop-small-goods", "shop-menswear", "shop-jeweller", "shop-fancy", "shop-glass-silver"], size: [0.9, 1.95, 0.45], place: "wall", tris: 1200,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(0.9, 0.35, 0.45), box(0.94, 0.06, 0.49, 0, 1.88, 0), ...[-0.43, 0.43].flatMap((x) => [-0.2, 0.2].map((z) => box(0.035, 1.55, 0.035, x, 0.35, z)))));
    b.add("glass-plate", union(box(0.84, 1.5, 0.006, 0, 0.36, 0.215), box(0.006, 1.5, 0.4, -0.425, 0.36, 0), box(0.006, 1.5, 0.4, 0.425, 0.36, 0), ...[0.8, 1.2, 1.55].map((y) => box(0.82, 0.008, 0.38, 0, y, 0))));
    [0.36, 0.81, 1.21, 1.56].forEach((y, r) => {
      for (let c = 0; c < 3; c++) {
        if (hash(r, c, 81) < 0.35) continue;
        const x = -0.26 + c * 0.26, k = hash(r, c, 82);
        if (k < 0.4) b.add("card", box(0.18, 0.04, 0.12, x, y, 0));
        else if (k < 0.7) b.add("leather", rbox(0.16, 0.014, 0.08, 0.005, x, y, 0.02));
        else b.add(CLOTHS[Math.floor(hash(r, c, 83) * 4)], zcyl(0.03, 0.14).rotate(0, 90, 0).move(x, y + 0.03, 0));
      }
    });
    return b.parts();
  },
});

/** A cheval glass: a full-length mirror tilting in a standing frame. */
prop({
  id: "cheval-mirror", items: ["shop-fashion", "shop-menswear", "shop-furs", "shop-hats", "shop-shoes"], size: [0.65, 1.8, 0.45], place: "floor", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.04, 1.6, 0.04, -0.3, 0, 0), box(0.04, 1.6, 0.04, 0.3, 0, 0), box(0.05, 0.04, 0.45, -0.3, 0, 0), box(0.05, 0.04, 0.45, 0.3, 0, 0), box(0.6, 0.04, 0.04, 0, 0.3, 0), box(0.52, 1.5, 0.035, 0, 0.25, 0).rotate(-5, 0, 0)) },
    { mat: "mirror", solid: box(0.46, 1.42, 0.004, 0, 0.29, 0.02).rotate(-5, 0, 0) },
  ],
});

/** An electric pendant: a frosted bowl on three chains (the street's big shops had electric light by 1917). */
prop({
  id: "store-pendant", items: ["electric-light"], size: [0.45, 0.9, 0.45], place: "ceiling", tris: 900,
  parts: () => [
    { mat: "brass", solid: union(post(0.05, 0.03, 0, -0.03, 0), post(0.006, 0.55, 0, -0.6, 0), ...[0, 120, 240].map((a) => rodX(0.003, 0.22, 0.1, -0.7, 0).rotate(0, 0, -50).rotate(0, a, 0))) },
    { mat: "lamp-shade", solid: lathe([[0, 0], [0.12, 0.02], [0.2, 0.09], [0.21, 0.12], [0, 0.12]], 0, -0.88, 0, 28) },
  ],
  glow: [{ at: [0, -0.8, 0], lumens: 900, color: "#ffe2b8", range: 12, shadow: true }],
});

/** The window's stepped stage, covered in cloth: what the display stands on behind the glass. */
prop({
  id: "display-steps", items: TEXTILE, size: [1.7, 0.55, 1.0], place: "floor", tris: 200,
  // the low step takes what stands (forms, tall stands) in its front 0.65 m; the high one at the back what sits on it
  parts: () => [{ mat: "plush", solid: union(box(1.7, 0.3, 1.0), box(1.4, 0.25, 0.35, 0, 0.3, -0.32)) }],
});

/** A fall of cloth from a T-stand in the window: one length shown in its folds. */
for (const [id, mat] of [["fabric-fall", "cloth-navy"], ["fabric-fall-cream", "cloth-cream"], ["fabric-fall-field", "cloth-field"]] as const)
  prop({
    id, items: ["shop-fabric", "shop-fashion"], size: [0.6, 1.35, 0.3], place: "on", tris: 1200,
    parts: () => {
      const n = 24, top: [number, number][] = [], bottom: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const x = -0.26 + (0.52 * i) / n, z = 0.035 * Math.sin(i * 1.3) + 0.012 * Math.sin(i * 3.1);
        top.push([x, z]);
        bottom.push([x, z - 0.006]);
      }
      const fall = crossSection.polygon([...bottom, ...top.reverse()]).extrude(1.1).rotate(-90, 0, 0).move(0, 0.15, 0);
      return [
        { mat: "brass", solid: union(post(0.008, 1.3, 0, 0.02, -0.1), rodX(0.007, 0.6, 0, 1.31, -0.1), lathe([[0, 0], [0.12, 0], [0.12, 0.02], [0, 0.03]], 0, 0, -0.1, 20)) },
        { mat, solid: fall.move(0, 0.05, -0.05) },
      ];
    },
  });

/** A big shopfront for the fashion street: a mahogany frame and fascia, two plate-glass windows on low risers either
 *  side of a recessed glazed door, transoms over. Origin: the opening's bottom middle on the room face; street at -z. */
for (const leaf of [true, false]) prop({
  // "-open": the frame without its door leaf, for a set that swings the leaf itself (kit/door.ts door-leaf, shot 49)
  id: leaf ? "shopfront-pair" : "shopfront-pair-open", items: TEXTILE.concat(["shop-shoes", "shop-jeweller", "shop-fancy", "shop-glass-silver"]), size: [5.0, 3.3, 0.3], place: "hung", tris: 2500, ...(leaf ? {} : { where: "set" as const }),
  parts: () => {
    const W = 5.0, H = 3.3, door = 1.2, win = (W - door - 0.3) / 2, sill = 0.45, head = 2.65;
    const xw = (s: number) => s * (door / 2 + 0.05 + win / 2);
    const frame = [box(W, 0.1, 0.12, 0, H - 0.1, -0.15), box(0.1, H, 0.12, -W / 2 + 0.05, 0, -0.15), box(0.1, H, 0.12, W / 2 - 0.05, 0, -0.15), box(0.1, H, 0.12, -door / 2 - 0.05, 0, -0.15), box(0.1, H, 0.12, door / 2 + 0.05, 0, -0.15), box(W, 0.08, 0.12, 0, head, -0.15)];
    for (const s of [-1, 1]) frame.push(box(win, sill, 0.1, xw(s), 0, -0.2), box(win, 0.06, 0.16, xw(s), sill, -0.17));
    return [
      { mat: "wood-dark", solid: union(...frame, ...(leaf ? [box(door - 0.12, 0.85, 0.05, 0, 0.05, -0.12)] : [])) },
      { mat: "glass-plate", solid: union(...[-1, 1].map((s) => box(win - 0.06, head - sill - 0.08, 0.008, xw(s), sill + 0.06, -0.15)), ...(leaf ? [box(door - 0.16, 1.6, 0.008, 0, 0.92, -0.12)] : []), box(W - 0.2, H - head - 0.2, 0.008, 0, head + 0.08, -0.15)) },
      { mat: "brass", solid: union(...(leaf ? [rodX(0.012, 0.35, door / 2 - 0.25, 1.05, -0.06)] : []), ...[-1, 1].map((s) => rodX(0.006, win, xw(s), sill + 0.07, -0.08))) },
    ];
  },
});

export const KIT_STORE = true;
