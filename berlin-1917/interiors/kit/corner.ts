// Shop kit for the side streets: the shops of every block, where the city queued in the winter of 1917-18
// (research/catalogue/interior.ts: shop-grocer, shop-butcher, shop-dairy, coal-cellar-shop, shop-destille,
// shop-tobacco, shop-barber). The Kolonialwaren with its drawer wall and coffee mill, the tiled butcher's on a meatless
// week, the dairy selling skimmed milk for children only, the coal merchant's cellar, the corner Destille's spirit
// casks, the tobacconist's glazed cases, the barber's chairs. War stock throughout: shelves mostly bare, jars empty,
// a ration notice in every window. interiors/corner.ts lays a shop out from these by its trade.
import type { Solid } from "raea/3d";
import { box, hash, heap, lathe, lump, rbox, rodX, union } from "./geo";
import type { MatId } from "./mats";
import { prop } from "./prop";
import { byMat } from "./store";

const GROCER = ["shop-grocer"], BUTCHER = ["shop-butcher"], DAIRY = ["shop-dairy"], COAL = ["coal-cellar-shop"];
const PUB = ["shop-destille"], TOBACCO = ["shop-tobacco"], BARBER = ["shop-barber"];
const SIDE = [...GROCER, ...BUTCHER, ...DAIRY, ...PUB, ...TOBACCO, ...BARBER];

/** A cylinder standing on y with few sides (a tin, a jar's contents, a knob): manifold's own picks too many for small things. */
const cyl = (r: number, h: number, x = 0, y = 0, z = 0, seg = 10): Solid => lathe([[0, 0], [r, 0], [r, h], [0, h]], x, y, z, seg);
/** A ring of square section in the x-y plane (axis z): a wheel rim, a hoop. */
const ring = (r: number, t: number, seg = 16): Solid => lathe([[r - t, -t], [r + t, -t], [r + t, t], [r - t, t]], 0, 0, 0, seg).rotate(90, 0, 0);
/** Raised panels on a +z face: n across w, h tall from y0. */
const panels = (w: number, h: number, n: number, y0: number, z: number, inset = 0.06): Solid[] =>
  Array.from({ length: n }, (_, i) => box(w / n - inset * 2, h, 0.02, -w / 2 + (i + 0.5) * (w / n), y0, z));
/** A bottle: body, shoulder, neck. */
const bottle = (x: number, y: number, z: number, s = 1): Solid =>
  lathe([[0, 0], [0.034 * s, 0], [0.034 * s, 0.18 * s], [0.012 * s, 0.24 * s], [0.012 * s, 0.29 * s], [0, 0.29 * s]], x, y, z, 8);

// ── shared: the shopfront, the window's podium, the door to the shopkeeper's flat ──────────────────────────────────

/** A side street's shopfront in a 4.2 x 3.6 m opening: one display window (2.5 m) over a panelled riser, a glazed door
 *  beside it, a transom of small lights over both. Origin: the opening's bottom middle on the room face; the street
 *  is at -z. The window is at local x -0.85, the door at +1.25. Painted green or grained brown. */
for (const [paint, mat] of [["green", "paint-green"], ["brown", "wood-dark"]] as const)
  prop({
    id: `shopfront-small-${paint}`, items: [...SIDE, "shopfront"], size: [4.2, 3.6, 0.3], place: "hung", tris: 1500,
    parts: () => {
      const W = 4.2, H = 3.6, z = -0.15, t = 0.1, x0 = -W / 2, xw = x0 + 2.6, tr = 3.0;
      const fr = [box(W, t, 0.12, 0, H - t, z), box(t, H, 0.12, x0 + t / 2, 0, z), box(t, H, 0.12, -x0 - t / 2, 0, z), box(t, tr, 0.12, xw, 0, z),
        box(W, 0.08, 0.12, 0, tr, z), box(2.6 - t, 0.55, 0.08, x0 + 1.3, 0, z), box(2.6 - t, 0.06, 0.16, x0 + 1.3, 0.55, z + 0.02)];
      for (let i = 1; i < 4; i++) fr.push(box(0.05, H - tr - t, 0.1, x0 + (W * i) / 4, tr + 0.08, z));
      const dx = (xw + W / 2) / 2, dw = W / 2 - xw - t * 1.5;
      const door = [box(dw, 0.95, 0.05, dx, 0.02, z), box(dw, 0.1, 0.05, dx, 2.85, z), box(0.1, 2.93, 0.05, dx - dw / 2 + 0.05, 0.02, z), box(0.1, 2.93, 0.05, dx + dw / 2 - 0.05, 0.02, z), box(0.06, 2.93, 0.05, dx, 0.02, z)];
      return [
        { mat, solid: union(...fr, ...door) },
        { mat: "glass", solid: union(box(2.5 - t, 2.35, 0.008, x0 + 1.3, 0.61, z), box(dw - 0.2, 1.88, 0.008, dx, 0.97, z), box(W - 0.2, 0.42, 0.008, 0, tr + 0.08, z)) },
        { mat: "brass", solid: union(rodX(0.012, 0.28, dx - dw / 2 + 0.26, 1.05, z + 0.07), box(0.05, 0.12, 0.012, dx - dw / 2 + 0.14, 1.0, z + 0.03)) },
      ];
    },
  });

/** The window's podium (Schaufensterpodest): a boarded platform at the riser's height, a cloth over it, where the
 *  window's goods stand behind the glass. Its top is 0.55 m up. */
prop({
  id: "window-podium", items: SIDE, size: [2.3, 0.55, 0.7], place: "floor", tris: 200,
  parts: () => [{ mat: "wood-soft", solid: union(box(2.3, 0.52, 0.7), box(2.3, 0.03, 0.7, 0, 0.52, 0)) }, { mat: "linen", solid: box(1.7, 0.004, 0.55, 0, 0.55, 0.02) }],
});

/** The door to the flat behind the shop (the Ladenwohnung): panelled below, glazed above with a gathered curtain on
 *  the far side, so the shopkeeper sees who comes in. Hung in a 0.95 x 2.3 m opening, the shop at +z. */
prop({
  id: "parlour-door", items: [...SIDE, "flat-door"], size: [0.95, 2.3, 0.08], place: "hung", tris: 500,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.95, 0.08, 0.05), box(0.08, 2.3, 0.05, -0.435, 0, 0), box(0.08, 2.3, 0.05, 0.435, 0, 0), box(0.95, 0.12, 0.05, 0, 2.18, 0), box(0.95, 0.1, 0.05, 0, 1.0, 0), box(0.8, 0.9, 0.03, 0, 0.08, 0), ...panels(0.8, 0.7, 2, 0.18, 0.02)) },
    { mat: "glass", solid: box(0.79, 1.07, 0.006, 0, 1.1, 0) },
    { mat: "linen", solid: union(...Array.from({ length: 8 }, (_, i) => box(0.1, 1.05, 0.015, -0.35 + i * 0.1, 1.11, -0.02 + (i % 2) * 0.008))) },
    { mat: "brass", solid: rodX(0.01, 0.12, 0.33, 1.0, 0.05) },
  ],
});

// ── the grocer (Kolonialwarenhandlung) ─────────────────────────────────────────────────────────────────────────────

/** The grocer's counter: brown-varnished, six glass-fronted bins on the customer's side showing what's in them (pulses,
 *  groats, ersatz coffee: most of them low), a dark top worn pale where the goods are weighed. */
prop({
  id: "grocer-counter", items: GROCER, size: [3.2, 0.95, 0.75], place: "floor", tris: 1200,
  parts: () => {
    const b = byMat();
    b.add("wood-mid", union(box(3.2, 0.86, 0.6, 0, 0, -0.05), box(3.24, 0.08, 0.66, 0, 0, -0.04)));
    b.add("wood-dark", box(3.26, 0.06, 0.78, 0, 0.86, 0));
    for (let i = 0; i < 6; i++) {
      const x = -1.33 + i * 0.532;
      b.add("wood-mid", union(box(0.5, 0.05, 0.1, x, 0.2, 0.3), box(0.5, 0.05, 0.1, x, 0.7, 0.3), box(0.04, 0.55, 0.1, x - 0.23, 0.2, 0.3), box(0.04, 0.55, 0.1, x + 0.23, 0.2, 0.3)));
      b.add("glass", box(0.42, 0.45, 0.004, x, 0.25, 0.345));
      b.add("pulses", box(0.42, 0.06 + 0.3 * hash(i, 3), 0.08, x, 0.25, 0.3));
    }
    return b.parts();
  },
});

/** The wall of small drawers (Schubladenregal) behind the grocer's counter: a cupboard, fifty drawers labelled in
 *  white enamel for spices, rice, sago, then an open shelf and a cornice. */
prop({
  id: "drawer-wall", items: GROCER, size: [2.6, 2.6, 0.5], place: "wall", tris: 3600,
  parts: () => {
    const b = byMat(), W = 2.6;
    b.add("wood-mid", union(box(W, 2.45, 0.03, 0, 0, -0.235), box(0.04, 2.45, 0.5, -W / 2 + 0.02, 0, 0), box(0.04, 2.45, 0.5, W / 2 - 0.02, 0, 0), box(W, 0.9, 0.48, 0, 0, -0.01), box(W, 0.03, 0.48, 0, 1.98, -0.01), box(W + 0.12, 0.15, 0.56, 0, 2.45, 0), ...panels(W, 0.66, 4, 0.12, 0.235)));
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 10; c++) {
        const x = -1.05 + c * 0.2333, y = 0.95 + r * 0.205;
        b.add("wood-mid", box(0.215, 0.19, 0.44, x, y, -0.02));
        b.add("enamel", box(0.08, 0.035, 0.004, x, y + 0.13, 0.202));
        b.add("brass", box(0.02, 0.02, 0.025, x, y + 0.06, 0.212));
      }
    return b.parts();
  },
});

/** A wall shelf of glass jars (Bonbongläser): two boards on brackets, twelve jars, most of them empty in 1917, a few
 *  with barley sugar or dried apple. Hung with its bottom at the layout's height. */
prop({
  id: "jar-shelf", items: GROCER, size: [2.0, 0.85, 0.3], place: "hung", tris: 3200,
  parts: () => {
    const b = byMat();
    for (const y of [0, 0.5]) b.add("wood-mid", union(box(2.0, 0.03, 0.28, 0, y, 0), box(0.03, 0.18, 0.2, -0.85, y - 0.18, -0.03), box(0.03, 0.18, 0.2, 0.85, y - 0.18, -0.03)));
    for (let i = 0; i < 12; i++) {
      const y = i < 6 ? 0.03 : 0.53, x = -0.82 + (i % 6) * 0.33, full = hash(i, 7) < 0.3;
      b.add("glass", lathe([[0, 0], [0.07, 0], [0.075, 0.02], [0.075, 0.2], [0.05, 0.23], [0.05, 0.26], [0, 0.26]], x, y, 0, 10));
      b.add("brass", cyl(0.055, 0.025, x, y + 0.26, 0, 10));
      if (full) b.add(hash(i, 8) < 0.5 ? "flower" : "wax", cyl(0.062, 0.04 + 0.1 * hash(i, 9), x, y + 0.008, 0, 8));
    }
    return b.parts();
  },
});

/** The shop's coffee mill: a red cast-iron body, two flywheels, a brass hopper (the grocer grinds roasted barley and
 *  chicory now: real coffee is gone). */
prop({
  id: "shop-coffee-mill", items: GROCER, size: [0.5, 0.66, 0.34], place: "on", tris: 2400,
  parts: () => {
    const b = byMat();
    b.add("paint-red", union(box(0.3, 0.04, 0.26), box(0.18, 0.3, 0.18, 0, 0.04, 0), box(0.06, 0.06, 0.34, 0, 0.38, 0).rotate(0, 90, 0).move(0, 0, 0)));
    for (const x of [-0.17, 0.17]) {
      b.add("paint-red", ring(0.22, 0.012, 24).rotate(0, 90, 0).move(x, 0.41, 0));
      for (let k = 0; k < 5; k++) b.add("paint-red", box(0.012, 0.21, 0.016, 0, 0, 0).rotate((k * 360) / 5, 0, 0).move(x, 0.41, 0));
    }
    b.add("brass", lathe([[0, 0], [0.04, 0], [0.11, 0.13], [0, 0.13]], 0, 0.34, 0, 16));
    b.add("wood-dark", union(box(0.12, 0.07, 0.02, 0, 0.08, 0.09), rodX(0.012, 0.08, 0.2, 0.6, 0)));
    return b.parts();
  },
});

/** A sugar loaf in its blue paper, the white top bare. */
prop({
  id: "sugar-loaf", items: GROCER, size: [0.16, 0.38, 0.16], place: "on", tris: 200,
  parts: () => [{ mat: "paper-blue", solid: lathe([[0, 0], [0.075, 0], [0.032, 0.28], [0, 0.28]], 0, 0, 0, 12) }, { mat: "wax", solid: lathe([[0, 0], [0.032, 0], [0, 0.09]], 0, 0.28, 0, 12) }],
});

/** An open sack of pulses with its rim rolled down and a zinc scoop in it. */
prop({
  id: "sack-open", items: GROCER, size: [0.5, 0.6, 0.45], place: "floor", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("jute", lathe([[0, 0], [0.19, 0], [0.23, 0.2], [0.22, 0.44], [0.2, 0.5], [0, 0.5]], 0, 0, 0, 14).scale(1.08, 1, 0.92));
    b.add("pulses", lathe([[0, 0], [0.19, 0], [0.11, 0.05], [0, 0.065]], 0, 0.46, 0, 14).scale(1.08, 1, 0.92));
    b.add("jute", ring(0.205, 0.025, 14).rotate(90, 0, 0).scale(1.08, 1, 0.92).move(0, 0.5, 0));
    b.add("zinc", rbox(0.08, 0.04, 0.16, 0.01, 0.05, 0.5, 0.02).rotate(-25, 20, 0));
    return b.parts();
  },
});

/** Tins in a pyramid for the window, four rows: what a grocer had left to show (Ersatz cocoa, fish paste). */
prop({
  id: "tin-pyramid", items: GROCER, size: [0.45, 0.44, 0.12], place: "on", tris: 900,
  parts: () => {
    const b = byMat();
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 4 - r; i++) {
        const x = (i - (3 - r) / 2) * 0.105;
        b.add("steel-bright", cyl(0.05, 0.105, x, r * 0.108, 0, 10));
        b.add(r % 2 ? "paper-poster" : "paint-red", cyl(0.0505, 0.06, x, r * 0.108 + 0.022, 0, 10));
      }
    return b.parts();
  },
});

// ── the butcher (Schlächterei) ─────────────────────────────────────────────────────────────────────────────────────

/** The butcher's counter: white tiles to the floor, a thick marble top, a dark plinth. */
prop({
  id: "butcher-counter", items: BUTCHER, size: [3.0, 0.95, 0.8], place: "floor", tris: 300,
  parts: () => [
    { mat: "tile-white", solid: box(3.0, 0.78, 0.72, 0, 0.1, 0) },
    { mat: "wood-dark", solid: box(2.96, 0.1, 0.68, 0, 0, 0) },
    { mat: "marble", solid: box(3.06, 0.07, 0.8, 0, 0.88, 0) },
  ],
});

/** The meat rail on the back wall: a steel bar on brackets with hooks, and what hangs from it. `full`: three rings of
 *  sausage, a ham, a side of bacon, two strings of links; bare: one ring on a meatless week (fleischlose Woche, from
 *  1916). Hung with its bottom at the layout's height; the bar 0.9 m above. */
for (const full of [true, false])
  prop({
    id: full ? "meat-rail" : "meat-rail-bare", items: BUTCHER, size: [3.0, 0.95, 0.3], place: "hung", tris: full ? 2600 : 1000,
    parts: () => {
      const b = byMat();
      b.add("steel-bright", rodX(0.012, 3.0, 0, 0.9, 0.0));
      for (const x of [-1.3, 0, 1.3]) b.add("iron", box(0.03, 0.04, 0.18, x, 0.88, -0.07));
      for (let i = 0; i < 12; i++) b.add("steel-bright", union(box(0.006, 0.12, 0.006, -1.375 + i * 0.25, 0.78, 0), box(0.03, 0.006, 0.006, -1.36 + i * 0.25, 0.78, 0)));
      const hang = full ? [0, 2, 3, 5, 7, 8, 10] : [6];
      hang.forEach((h, k) => {
        const x = -1.375 + h * 0.25;
        const kind = full ? k % 4 : 0;
        if (kind === 0) b.add("sausage", ring(0.07, 0.018, 12).move(x, 0.7, 0));
        else if (kind === 1) b.add("meat", lump(0.1, h, 1, 1.7, 0.9).move(x, 0.6, 0));
        else if (kind === 2) b.add("fat", rbox(0.24, 0.42, 0.04, 0.01, x, 0.36, 0));
        else for (let j = 0; j < 4; j++) b.add("sausage", rbox(0.035, 0.11, 0.035, 0.015, x, 0.66 - j * 0.12, 0));
      });
      return b.parts();
    },
  });

/** The chopping block (Hackklotz): a beech round on three legs, its top dished by years of the cleaver, an iron band,
 *  the cleaver left standing in it. */
prop({
  id: "chopping-block", items: BUTCHER, size: [0.62, 0.95, 0.62], place: "floor", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("wood-raw", lathe([[0, 0], [0.3, 0], [0.3, 0.38], [0.28, 0.4], [0, 0.37]], 0, 0.42, 0, 20));
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; b.add("wood-raw", box(0.08, 0.44, 0.08, Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19)); }
    b.add("iron", ring(0.302, 0.012, 20).rotate(90, 0, 0).move(0, 0.74, 0));
    b.add("steel-bright", box(0.2, 0.11, 0.006, 0.05, 0.74, 0.02).rotate(0, 30, 8));
    b.add("wood-dark", rodX(0.014, 0.14, 0.2, 0.83, -0.04).rotate(0, 30, 8));
    return b.parts();
  },
});

/** The window's marble slab and enamel trays, a few cuts on them and parsley: the butcher's display on a meat day. */
prop({
  id: "meat-trays", items: BUTCHER, size: [0.95, 0.12, 0.45], place: "on", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("marble", box(0.95, 0.03, 0.45));
    for (let i = 0; i < 3; i++) {
      const x = -0.31 + i * 0.31;
      b.add("enamel", rbox(0.28, 0.025, 0.22, 0.008, x, 0.03, 0));
      if (hash(i, 4) < 0.7) b.add("meat", lump(0.06, i * 3 + 1, 1.5, 0.6, 1).move(x - 0.04, 0.07, 0));
      b.add("leaf", lump(0.025, i * 5 + 2, 1.3, 0.6, 1).move(x + 0.08, 0.06, 0.05));
    }
    return b.parts();
  },
});

/** The cashier's desk (Kassenpult): a panelled stand, a sloping top, a glazed screen with a hatch, where the butcher's
 *  wife takes the money and the meat cards' coupons. */
prop({
  id: "cashier-desk", items: [...BUTCHER, ...DAIRY], size: [0.95, 1.4, 0.65], place: "floor", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.9, 1.0, 0.6), box(0.96, 0.04, 0.66, 0, 1.0, 0), box(0.03, 0.36, 0.03, -0.46, 1.04, 0.3), box(0.03, 0.36, 0.03, 0.46, 1.04, 0.3), box(0.96, 0.03, 0.03, 0, 1.4, 0.3), ...panels(0.9, 0.7, 2, 0.15, 0.3)) },
    { mat: "glass", solid: union(box(0.3, 0.33, 0.004, -0.3, 1.06, 0.3), box(0.3, 0.33, 0.004, 0.3, 1.06, 0.3), box(0.3, 0.2, 0.004, 0, 1.19, 0.3)) },
  ],
});

// ── the dairy (Milchgeschäft) ──────────────────────────────────────────────────────────────────────────────────────

/** A 20-litre milk churn (Milchkanne), tinned steel, its lid on. Skimmed milk, for children and the sick on a card. */
prop({
  id: "milk-churn", items: DAIRY, size: [0.36, 0.66, 0.36], place: "floor", tris: 700,
  parts: () => {
    const b = byMat();
    b.add("zinc", lathe([[0, 0], [0.16, 0], [0.17, 0.02], [0.17, 0.42], [0.1, 0.52], [0.09, 0.56], [0.1, 0.58], [0, 0.58]], 0, 0, 0, 18));
    b.add("zinc", lathe([[0, 0], [0.105, 0], [0.1, 0.03], [0.04, 0.05], [0, 0.065]], 0, 0.58, 0, 18));
    for (const x of [-0.15, 0.15]) b.add("iron", box(0.02, 0.08, 0.07, x, 0.4, 0));
    return b.parts();
  },
});

/** The measures on their board: litre, half, quarter, eighth, each on a long handle hung from a hook. */
prop({
  id: "milk-measures", items: DAIRY, size: [0.8, 0.55, 0.14], place: "hung", tris: 800,
  parts: () => {
    const b = byMat();
    b.add("wood-mid", box(0.8, 0.1, 0.02, 0, 0.45, -0.06));
    [[0.07, 0.15], [0.055, 0.11], [0.045, 0.08], [0.035, 0.065], [0.028, 0.05]].forEach(([r, h], i) => {
      const x = -0.32 + i * 0.16;
      b.add("zinc", union(cyl(r, h, x, 0, 0.0, 12), box(0.012, 0.4 - h, 0.006, x, h, -r)));
      b.add("iron", box(0.01, 0.05, 0.03, x, 0.42, -0.04));
    });
    return b.parts();
  },
});

/** A cheese under a glass bell on a plate: a cut wheel, the dome over it. */
prop({
  id: "cheese-bell", items: DAIRY, size: [0.32, 0.3, 0.32], place: "on", tris: 800,
  parts: () => {
    const b = byMat();
    b.add("enamel", lathe([[0, 0], [0.15, 0], [0.16, 0.015], [0, 0.015]], 0, 0, 0, 20));
    b.add("cheese", cyl(0.09, 0.07, 0, 0.015, 0, 16));
    b.add("glass", lathe([[0, 0], [0.14, 0], [0.14, 0.12], [0.1, 0.2], [0.03, 0.23], [0.02, 0.27], [0, 0.27]], 0, 0.015, 0, 20));
    return b.parts();
  },
});

/** A basket of eggs: so few in 1917 that each is counted out against the card. */
prop({
  id: "egg-basket", items: DAIRY, size: [0.36, 0.2, 0.28], place: "on", tris: 700,
  parts: () => {
    const b = byMat();
    b.add("wood-raw", lathe([[0, 0], [0.13, 0], [0.16, 0.11], [0.15, 0.115], [0, 0.03]], 0, 0, 0, 16).scale(1.1, 1, 0.8));
    for (let i = 0; i < 9; i++) b.add("egg", lump(0.024, i + 11, 0.85, 1.15, 0.85).move(-0.08 + (i % 3) * 0.08, 0.08 + (i % 2) * 0.01, -0.05 + Math.floor(i / 3) * 0.05));
    return b.parts();
  },
});

/** The dairy's counter: white-painted panels, a marble top, a blue-tiled plinth. */
prop({
  id: "dairy-counter", items: DAIRY, size: [2.8, 0.95, 0.7], place: "floor", tris: 300,
  parts: () => [
    { mat: "paint-white", solid: union(box(2.8, 0.78, 0.66, 0, 0.1, 0), ...panels(2.8, 0.55, 4, 0.2, 0.33)) },
    { mat: "tile-blue", solid: box(2.76, 0.1, 0.62, 0, 0, 0) },
    { mat: "marble", solid: box(2.86, 0.06, 0.72, 0, 0.88, 0) },
  ],
});

/** The cold room's door: heavy planks, strap hinges, a lever latch and a padlock. */
prop({
  id: "cold-room-door", items: [...DAIRY, ...BUTCHER], size: [1.1, 2.2, 0.14], place: "wall", tris: 300,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.1, 0.08, 0.06, 0, 2.12, -0.04), box(0.08, 2.2, 0.06, -0.51, 0, -0.04), box(0.08, 2.2, 0.06, 0.51, 0, -0.04)) },
    { mat: "wood-grey", solid: box(0.94, 2.1, 0.1, 0, 0, 0) },
    { mat: "iron", solid: union(box(0.55, 0.05, 0.012, -0.2, 0.35, 0.056), box(0.55, 0.05, 0.012, -0.2, 1.7, 0.056), box(0.03, 0.16, 0.05, 0.36, 1.0, 0.07), rodX(0.012, 0.18, 0.32, 1.12, 0.1), box(0.05, 0.06, 0.02, 0.4, 0.92, 0.1)), overlap: true },
  ],
});

// ── the coal merchant's cellar (Kohlenkeller) ──────────────────────────────────────────────────────────────────────

/** A board bin (Verschlag) heaped with coal or coke; its front boards low so the shovel reaches. */
for (const [fill, mat] of [["coal", "coal"], ["coke", "coke"]] as const)
  prop({
    id: `${fill}-bin`, items: COAL, size: [1.4, 1.25, 1.2], place: "wall", where: "cellar", tris: 7000,
    parts: () => [
      { mat: "wood-raw", solid: union(box(1.4, 1.25, 0.04, 0, 0, -0.58), box(0.04, 1.25, 1.2, -0.68, 0, 0), box(0.04, 1.25, 1.2, 0.68, 0, 0), box(1.4, 0.42, 0.04, 0, 0, 0.58), box(0.06, 1.25, 0.06, -0.68, 0, 0.57), box(0.06, 1.25, 0.06, 0.68, 0, 0.57)) },
      { mat, solid: heap(0.6, fill === "coal" ? 0.75 : 0.9, fill === "coal" ? 0.1 : 0.14, fill === "coal" ? 21 : 22).scale(1.08, 1, 0.92).move(0, 0, -0.06), overlap: true },
    ],
  });

/** The decimal scale (Dezimalwaage): a boarded platform on an iron frame, the column and beam with its sliding poise;
 *  coal sold by the hundredweight, against the coal card. */
prop({
  id: "platform-scale", items: COAL, size: [0.9, 1.25, 0.75], place: "floor", tris: 700,
  parts: () => {
    const b = byMat();
    b.add("iron", union(box(0.84, 0.12, 0.64, 0, 0, 0.05), box(0.1, 1.0, 0.1, 0, 0.12, -0.3), box(0.16, 0.08, 0.14, 0, 1.08, -0.3), rodX(0.012, 0.66, 0.2, 1.14, -0.3), box(0.012, 0.36, 0.012, 0.52, 0.78, -0.3), cyl(0.07, 0.012, 0.52, 0.78, -0.3, 12), cyl(0.04, 0.03, 0.52, 0.792, -0.3, 10), cyl(0.03, 0.025, 0.52, 0.822, -0.3, 10)));
    b.add("wood-raw", box(0.8, 0.04, 0.6, 0, 0.12, 0.05));
    b.add("brass", box(0.05, 0.06, 0.04, 0.3, 1.11, -0.3));
    return b.parts();
  },
});

// ── the corner Destille ────────────────────────────────────────────────────────────────────────────────────────────

/** The bar (Tresen): panelled, a zinc top with a raised lip, a brass foot rail. The customers' side is +z. */
prop({
  id: "bar-counter", items: PUB, size: [3.2, 1.06, 0.72], place: "floor", tris: 700,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(3.2, 0.98, 0.6, 0, 0, -0.04), box(3.24, 0.1, 0.64, 0, 0, -0.03), ...panels(3.2, 0.62, 5, 0.2, 0.26)));
    b.add("zinc", union(box(3.26, 0.04, 0.72, 0, 0.98, 0), box(3.26, 0.03, 0.02, 0, 1.02, 0.35)));
    b.add("brass", union(rodX(0.018, 3.0, 0, 0.18, 0.4), ...[-1.3, 0, 1.3].map((x) => box(0.03, 0.18, 0.03, x, 0, 0.36))));
    return b.parts();
  },
});

/** The back bar (Büffet): a cupboard, shelves of bottles either side of a mirror, a cornice. Thin war beer and the last
 *  of the Korn; many bottles are empties kept for show. */
prop({
  id: "back-bar", items: PUB, size: [2.8, 2.6, 0.5], place: "wall", tris: 4200,
  parts: () => {
    const b = byMat(), W = 2.8;
    b.add("wood-dark", union(box(W, 0.9, 0.48, 0, 0, -0.01), box(W + 0.04, 0.04, 0.5, 0, 0.9, 0), box(W, 1.5, 0.03, 0, 0.94, -0.235), box(W + 0.1, 0.16, 0.36, 0, 2.44, -0.07), box(0.05, 1.5, 0.3, -0.45, 0.94, -0.1), box(0.05, 1.5, 0.3, 0.45, 0.94, -0.1), ...panels(W, 0.65, 4, 0.12, 0.235)));
    b.add("mirror", box(0.84, 1.0, 0.01, 0, 1.2, -0.215));
    for (const s of [-1, 1]) for (const y of [1.3, 1.85]) b.add("wood-dark", box(0.85, 0.025, 0.28, s * 0.9, y, -0.1));
    let i = 0;
    for (const s of [-1, 1])
      for (const y of [0.94, 1.325, 1.875])
        for (let k = 0; k < 6; k++, i++) {
          if (hash(i, 31) < 0.2) continue; // gaps on the shelf
          b.add(hash(i, 32) < 0.6 ? "glass-dark" : "glass", bottle(s * (0.55 + k * 0.13), y, -0.12 + (y < 1 ? 0.05 : 0), 0.85 + 0.3 * hash(i, 33)));
        }
    return b.parts();
  },
});

/** The Destille's spirit casks on their rack: five small barrels lying on a cradle, each with a brass tap and a
 *  painted oval for what's in it (Korn, Kümmel, Bitter). Stands on the floor behind the bar. */
prop({
  id: "spirit-casks", items: PUB, size: [1.7, 1.38, 0.5], place: "wall", tris: 3200,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(1.7, 0.06, 0.4, 0, 0.94, 0), box(0.06, 1.0, 0.4, -0.82, 0, 0), box(0.06, 1.0, 0.4, 0.82, 0, 0), box(1.7, 0.06, 0.4, 0, 0.3, 0), box(1.7, 0.8, 0.02, 0, 0.2, -0.19)));
    for (let i = 0; i < 5; i++) {
      const x = -0.66 + i * 0.33;
      b.add("wood-mid", lathe([[0, -0.17], [0.11, -0.17], [0.135, 0], [0.11, 0.17], [0, 0.17]], 0, 0, 0, 14).rotate(90, 0, 0).move(x, 1.13, 0.02));
      b.add("iron", ring(0.124, 0.006, 14).move(x, 1.13, 0.1));
      b.add("enamel", cyl(0.07, 0.004, 0, 0, 0, 12).rotate(90, 0, 0).move(x, 1.13, 0.192));
      b.add("brass", union(rodX(0.008, 0.05, 0, 0, 0).rotate(0, 90, 0).move(x, 1.06, 0.21), box(0.012, 0.05, 0.012, x, 1.0, 0.235)));
    }
    return b.parts();
  },
});

/** The beer engine on the bar: a brass column, two taps, a drip tray. */
prop({
  id: "beer-pump", items: PUB, size: [0.32, 0.45, 0.2], place: "on", tris: 500,
  parts: () => {
    const b = byMat();
    b.add("zinc", box(0.32, 0.02, 0.16));
    b.add("brass", union(lathe([[0, 0], [0.06, 0], [0.05, 0.03], [0.03, 0.05], [0.03, 0.4], [0.04, 0.42], [0, 0.43]], 0, 0.02, -0.03, 12), box(0.2, 0.03, 0.03, 0, 0.3, -0.03), box(0.02, 0.08, 0.02, -0.09, 0.22, 0.0), box(0.02, 0.08, 0.02, 0.09, 0.22, 0.0)));
    b.add("enamel", union(box(0.025, 0.12, 0.025, -0.09, 0.33, -0.03), box(0.025, 0.12, 0.025, 0.09, 0.33, -0.03)));
    return b.parts();
  },
});

/** A row of bottles for the Destille's or the barber's window, on a strip of lace. */
prop({
  id: "bottle-row", items: [...PUB, ...BARBER], size: [0.6, 0.3, 0.12], place: "on", tris: 500,
  parts: () => {
    const b = byMat();
    b.add("lace", box(0.6, 0.003, 0.12));
    for (let i = 0; i < 5; i++) b.add(i % 2 ? "glass" : "glass-dark", bottle(-0.24 + i * 0.12, 0.003, 0, 0.8 + 0.25 * hash(i, 41)));
    return b.parts();
  },
});

// ── the tobacconist (Zigarrenhandlung) ─────────────────────────────────────────────────────────────────────────────

/** The glazed wall case: drawers below, four shelves of cigar boxes behind two glass doors, a cornice. Cigars rationed
 *  from 1917 and stretched with beech leaves; the boxes thin out from the top. */
prop({
  id: "cigar-cabinet", items: TOBACCO, size: [2.4, 2.35, 0.42], place: "wall", tris: 1800,
  parts: () => {
    const b = byMat(), W = 2.4;
    b.add("wood-dark", union(box(W, 0.8, 0.42), box(W, 1.4, 0.03, 0, 0.8, -0.195), box(0.04, 1.4, 0.4, -W / 2 + 0.02, 0.8, 0), box(0.04, 1.4, 0.4, W / 2 - 0.02, 0.8, 0), box(0.04, 1.4, 0.03, 0, 0.8, 0.19), box(W + 0.1, 0.15, 0.48, 0, 2.2, 0), ...panels(W, 0.18, 4, 0.1, 0.21), ...panels(W, 0.18, 4, 0.45, 0.21)));
    for (const y of [1.12, 1.44, 1.76]) b.add("wood-dark", box(W - 0.08, 0.02, 0.36, 0, y, 0));
    b.add("glass-plate", union(box(1.12, 1.32, 0.006, -0.59, 0.84, 0.2), box(1.12, 1.32, 0.006, 0.59, 0.84, 0.2)));
    b.add("brass", union(box(0.02, 0.08, 0.02, -0.06, 1.4, 0.21), box(0.02, 0.08, 0.02, 0.06, 1.4, 0.21)));
    let i = 0;
    for (const [s, y] of [[0, 0.8], [1, 1.14], [2, 1.46], [3, 1.78]] as const)
      for (let k = 0; k < 8; k++, i++) {
        if (hash(i, 51) < 0.12 + s * 0.12) continue;
        const n = 1 + Math.floor(hash(i, 52) * (3 - Math.min(2, s))), x = -1.0 + k * 0.285;
        b.add("wood-mid", box(0.22, 0.05 * n, 0.14, x, y, -0.04));
        b.add("paper", box(0.12, 0.03, 0.004, x, y + 0.05 * n - 0.04, 0.032));
      }
    return b.parts();
  },
});

/** A staggered pile of cigar boxes, one open to show the cigars: the window of the photograph (a "Tabak" shopfront
 *  with its boxes stacked behind the glass, research/refs). */
prop({
  id: "cigar-boxes", items: TOBACCO, size: [0.55, 0.26, 0.3], place: "on", tris: 600,
  parts: () => {
    const b = byMat();
    const at: [number, number, number, number][] = [[-0.14, 0, 0, 4], [0.12, 0, 0.02, -6], [-0.02, 0.05, 0.01, 10], [0.16, 0.05, 0, -2], [0.04, 0.1, 0, 3], [-0.18, 0.05, 0.03, -12], [0.0, 0.15, -0.01, 8]];
    at.forEach(([x, y, z, a]) => { b.add("wood-mid", box(0.22, 0.05, 0.14, 0, 0, 0).rotate(0, a, 0).move(x, y, z)); b.add("paper", box(0.12, 0.003, 0.08, 0, 0.05, 0).rotate(0, a, 0).move(x, y, z)); });
    b.add("wood-mid", box(0.22, 0.004, 0.14, 0, 0, 0).rotate(-60, 0, 0).move(0.2, 0.06, -0.12));
    for (let i = 0; i < 7; i++) b.add("leather", box(0.012, 0.012, 0.13, 0.13 + i * 0.025, 0.012, 0.0).move(0, 0, 0.12));
    return b.parts();
  },
});

/** The counter's lighter: a brass lamp with a little flame always burning, to light the cigar you've just bought. */
prop({
  id: "cigar-lighter", items: TOBACCO, size: [0.12, 0.22, 0.12], place: "on", tris: 300,
  parts: () => [
    { mat: "brass", solid: union(lathe([[0, 0], [0.06, 0], [0.05, 0.02], [0.012, 0.04], [0.012, 0.18], [0.02, 0.19], [0, 0.19]], 0, 0, 0, 12)) },
    { mat: "flame", solid: lathe([[0, 0], [0.006, 0.006], [0, 0.03]], 0, 0.19, 0, 8), overlap: true },
  ],
  glow: [{ at: [0, 0.21, 0], lumens: 10, color: "#ffb15c", range: 1.2, flicker: 0.35 }],
});

/** The pipe rack on the wall: eight pipes hanging bowl up, some briar, some long Bavarian. */
prop({
  id: "pipe-rack", items: TOBACCO, size: [0.6, 0.4, 0.12], place: "hung", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("wood-mid", union(box(0.6, 0.4, 0.02, 0, 0, -0.05), box(0.58, 0.03, 0.08, 0, 0.32, -0.01)));
    for (let i = 0; i < 8; i++) {
      const x = -0.245 + i * 0.07, long = hash(i, 61) < 0.3;
      b.add("wood-dark", union(cyl(0.017, 0.045, x, 0.33, 0.02, 8), box(0.008, long ? 0.3 : 0.12, 0.008, x, 0.33 - (long ? 0.3 : 0.12), 0.02)));
    }
    return b.parts();
  },
});

/** Stoneware tobacco jars with lids. */
prop({
  id: "tobacco-jars", items: TOBACCO, size: [0.6, 0.26, 0.18], place: "on", tris: 900,
  parts: () => {
    const b = byMat();
    for (let i = 0; i < 4; i++) {
      const x = -0.22 + i * 0.15, h = 0.16 + 0.05 * hash(i, 71);
      b.add("stoneware", lathe([[0, 0], [0.06, 0], [0.068, h * 0.6], [0.055, h], [0, h]], x, 0, 0, 12));
      b.add("enamel", lathe([[0, 0], [0.058, 0], [0.05, 0.02], [0.012, 0.03], [0.012, 0.05], [0, 0.05]], x, h, 0, 12));
    }
    return b.parts();
  },
});

// ── the barber (Friseur) ───────────────────────────────────────────────────────────────────────────────────────────

/** The barber's chair: a wooden armchair, a leather seat and back, the headrest on an iron rod, a footrest bar. */
prop({
  id: "barber-chair", items: BARBER, size: [0.66, 1.4, 0.72], place: "floor", tris: 900,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(0.6, 0.06, 0.55, 0, 0.42, 0), ...[[-0.27, -0.24], [0.27, -0.24], [-0.27, 0.24], [0.27, 0.24]].map(([x, z]) => box(0.05, 0.42, 0.05, x, 0, z)), box(0.06, 0.25, 0.5, -0.3, 0.48, 0.02), box(0.06, 0.25, 0.5, 0.3, 0.48, 0.02), box(0.08, 0.04, 0.55, -0.3, 0.73, 0.03), box(0.08, 0.04, 0.55, 0.3, 0.73, 0.03), box(0.58, 0.55, 0.05, 0, 0.48, -0.26).rotate(-8, 0, 0), box(0.56, 0.04, 0.2, 0, 0.12, 0.42)));
    b.add("leather", union(rbox(0.52, 0.06, 0.48, 0.02, 0, 0.48, 0.02), rbox(0.5, 0.45, 0.04, 0.015, 0, 0.55, -0.22).rotate(-8, 0, 0), rbox(0.26, 0.12, 0.06, 0.02, 0, 1.24, -0.3)));
    b.add("iron", union(box(0.02, 0.3, 0.02, 0, 0.98, -0.33), box(0.56, 0.02, 0.02, 0, 0.2, 0.31)));
    return b.parts();
  },
});

/** The barber's place at the wall: a cupboard, a marble top with a porcelain basin and its tap, a framed mirror, a
 *  shelf of bottles, a shaving mug, the strop hanging at the side. */
prop({
  id: "barber-console", items: BARBER, size: [1.3, 2.2, 0.5], place: "wall", tris: 2200,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(1.3, 0.78, 0.45, 0, 0, -0.02), box(1.14, 1.1, 0.04, 0, 1.0, -0.23), box(1.2, 0.03, 0.16, 0, 0.98, -0.17), box(1.24, 0.1, 0.08, 0, 2.1, -0.21), ...panels(1.3, 0.55, 2, 0.12, 0.205)));
    b.add("marble", box(1.34, 0.04, 0.5, 0, 0.78, 0));
    b.add("mirror", box(1.0, 0.94, 0.01, 0, 1.12, -0.205));
    b.add("enamel", union(lathe([[0, 0], [0.11, 0], [0.18, 0.08], [0.19, 0.1], [0, 0.1]], 0, 0.74, 0.04, 18), cyl(0.04, 0.08, 0.38, 0.82, 0.08, 10)));
    b.add("brass", union(box(0.02, 0.16, 0.02, 0, 0.82, -0.17), box(0.02, 0.02, 0.12, 0, 0.96, -0.12), box(0.04, 0.03, 0.03, 0.64, 1.6, -0.2)));
    for (let i = 0; i < 4; i++) b.add(i % 2 ? "glass" : "glass-dark", bottle(-0.45 + i * 0.12, 1.01, -0.17, 0.6));
    b.add("leather", box(0.05, 0.55, 0.004, 0.64, 1.05, -0.2));
    b.add("wood-mid", union(cyl(0.02, 0.06, 0.32, 0.82, -0.05, 8), lathe([[0, 0], [0.025, 0], [0.012, 0.05], [0, 0.05]], 0.32, 0.88, -0.05, 8)));
    return b.parts();
  },
});

/** The gas water heater (Gasbadeofen): a copper cylinder on wall brackets, a flue up, a swing spout, the pilot behind
 *  its mica window. Hung with its bottom at the layout's height. */
prop({
  id: "gas-water-heater", items: BARBER, size: [0.4, 1.2, 0.36], place: "hung", tris: 700,
  parts: () => {
    const b = byMat();
    b.add("copper", lathe([[0, 0], [0.13, 0], [0.13, 0.6], [0.06, 0.7], [0.06, 0.78], [0, 0.78]], 0, 0.15, 0.0, 16));
    b.add("iron", union(cyl(0.04, 0.27, 0, 0.93, 0, 10), box(0.04, 0.04, 0.16, 0, 0.3, -0.1), box(0.04, 0.04, 0.16, 0, 0.7, -0.1), lathe([[0, 0], [0.12, 0], [0.13, 0.15], [0, 0.15]], 0, 0, 0, 16)));
    b.add("copper", rodX(0.01, 0.3, 0.17, 0.2, 0.08).rotate(0, -30, 0));
    b.add("glass", box(0.05, 0.04, 0.004, 0, 0.06, 0.125));
    return b.parts();
  },
});

/** The waiting bench along the wall: plank seat, two back rails. */
prop({
  id: "waiting-bench", items: [...BARBER, ...PUB], size: [1.6, 0.9, 0.45], place: "wall", tris: 300,
  parts: () => [{ mat: "wood-mid", solid: union(box(1.6, 0.04, 0.38, 0, 0.42, 0.02), ...[-0.72, 0.72].flatMap((x) => [box(0.05, 0.42, 0.05, x, 0, 0.17), box(0.05, 0.9, 0.05, x, 0, -0.18)]), box(1.6, 0.08, 0.02, 0, 0.6, -0.18), box(1.6, 0.08, 0.02, 0, 0.8, -0.18)) }],
});

/** Newspapers on their poles (Zeitungshalter), three on a wall rack: the barber's and the Destille's reading. */
prop({
  id: "newspaper-holders", items: [...BARBER, ...PUB], size: [0.55, 0.85, 0.08], place: "hung", tris: 300,
  parts: () => {
    const b = byMat();
    b.add("wood-mid", box(0.55, 0.05, 0.03, 0, 0.8, -0.025));
    for (let i = 0; i < 3; i++) {
      b.add("wood-dark", rodX(0.008, 0.5, 0, 0.78, 0.0 + i * 0.012));
      b.add("paper", box(0.44, 0.62, 0.006, (i - 1) * 0.02, 0.16, 0.012 + i * 0.012));
    }
    return b.parts();
  },
});

// ── the upper walls: a 4.3 m shop shelved to the ceiling, the war on its walls ─────────────────────────────────────

/** Open stock shelves for the upper wall, above the counter's fixtures (reached with the shop ladder): three boards,
 *  card boxes and a few tins spaced out along them, gaps where the stock has run out. Hung with its bottom at the
 *  layout's height. */
prop({
  id: "upper-shelves", items: [...GROCER, ...TOBACCO, ...DAIRY], size: [2.4, 1.1, 0.32], place: "hung", tris: 1200,
  parts: () => {
    const b = byMat();
    b.add("wood-mid", union(box(2.4, 1.1, 0.02, 0, 0, -0.15), box(0.03, 1.1, 0.3, -1.185, 0, 0), box(0.03, 1.1, 0.3, 1.185, 0, 0), ...[0, 0.36, 0.72, 1.08].map((y) => box(2.4, 0.022, 0.3, 0, y, 0))));
    let i = 0;
    for (const y of [0.022, 0.382, 0.742])
      for (let k = 0; k < 9; k++, i++) {
        const v = hash(i, 81);
        if (v < 0.4) continue; // run out
        const x = -1.05 + k * 0.262;
        if (v < 0.75) b.add("card", box(0.2, 0.12 + 0.12 * hash(i, 82), 0.22, x, y, 0));
        else b.add("steel-bright", cyl(0.045, 0.11, x - 0.05, y, 0.02, 8)), b.add("paper-poster", cyl(0.046, 0.06, x - 0.05, y + 0.025, 0.02, 8));
      }
    return b.parts();
  },
});

/** A war-loan poster pasted on the wall (Kriegsanleihe: the seventh loan, autumn 1917), a printed block and a band of
 *  type on yellowed paper, its corners lifting. Hung with its bottom at the layout's height. */
prop({
  id: "war-poster", items: [...SIDE, "war-posters"], size: [0.62, 0.88, 0.01], place: "hung", tris: 100,
  parts: () => [
    { mat: "paper-poster", solid: union(box(0.6, 0.86, 0.002, 0, 0, 0), box(0.06, 0.06, 0.002, -0.27, 0.8, 0.002).rotate(0, 0, 12)) },
    { mat: "iron", solid: union(box(0.46, 0.4, 0.001, 0, 0.36, 0.0015), box(0.5, 0.06, 0.001, 0, 0.18, 0.0015), box(0.4, 0.035, 0.001, 0, 0.1, 0.0015)), overlap: true },
  ],
});

/** A Destille's table: a bare plank top scrubbed pale, four turned legs, a rail. */
prop({
  id: "pub-table", items: PUB, size: [0.8, 0.76, 0.8], place: "floor", tris: 300,
  parts: () => [{ mat: "wood-mid", solid: union(box(0.8, 0.04, 0.8, 0, 0.72, 0), box(0.68, 0.1, 0.68, 0, 0.62, 0), ...[[-0.33, -0.33], [0.33, -0.33], [-0.33, 0.33], [0.33, 0.33]].map(([x, z]) => lathe([[0, 0], [0.03, 0], [0.025, 0.3], [0.032, 0.36], [0.025, 0.62], [0, 0.62]], x, 0, z, 8))) }],
});

export const KIT_CORNER = true;
