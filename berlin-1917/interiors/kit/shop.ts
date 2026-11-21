// Shop kit, first the bakery (research/catalogue: shop-baker): "a counter with baskets for rolls and loaves, glass case
// for cakes, the bake-house behind; the war loaf only, against bread cards". In winter 1917-18 the shelves are mostly
// bare by mid-morning: a few dark K-Brot loaves, the coupons cut from bread cards pasted on sheets for the office.
import { manifold } from "raea/3d";
import { ball, zcone, zcyl, box, hash, lathe, post, rbox, rodX, taper, union } from "./geo";
import { prop } from "./prop";

/** The counter: a panelled softwood front painted dark green, a marble top, the customer side toward +z. */
prop({
  id: "shop-counter", items: ["shop-baker"], size: [3.0, 0.95, 0.72], place: "floor", tris: 3000,
  parts: () => {
    const panels = [];
    for (let i = 0; i < 5; i++) panels.push(box(0.5, 0.55, 0.02, -1.2 + i * 0.6, 0.17, 0.355));
    return [
      { mat: "paint-green", solid: union(box(3.0, 0.9, 0.7, 0, 0, 0), box(3.04, 0.1, 0.74, 0, 0, 0), ...panels) },
      { mat: "marble", solid: box(3.06, 0.04, 0.76, 0, 0.9, 0) },
    ];
  },
});

/** The bread shelves on the back wall: slanted slat boards so the loaves show their ends, a cornice with the name. */
prop({
  id: "bread-shelf", items: ["shop-baker"], size: [2.6, 2.4, 0.48], place: "wall", tris: 4000,
  parts: () => {
    const w = 2.6, s = [box(0.05, 2.3, 0.46, -w / 2 + 0.025, 0, 0), box(0.05, 2.3, 0.46, w / 2 - 0.025, 0, 0), box(0.05, 2.3, 0.46, 0, 0, 0), box(w, 2.3, 0.02, 0, 0, -0.22), box(w + 0.1, 0.16, 0.52, 0, 2.3, 0.01)];
    for (const y of [0.45, 0.9, 1.35, 1.8]) s.push(box(w, 0.025, 0.42, 0, y, 0.01).rotate(-14, 0, 0).move(0, 0.04, 0.03), box(w, 0.06, 0.015, 0, y - 0.02, 0.22));
    return [{ mat: "wood-mid", solid: union(...s) }];
  },
});

/** n war loaves (K-Brot, about 25 x 11 x 12 cm, baked in tins), lying slanted on a shelf board as a baker sets them. */
for (const n of [2, 3, 5])
  prop({
    id: `loaves-${n}`, items: ["war-bread", "shop-baker"], size: [n * 0.28, 0.14, 0.26], place: "on", tris: 400 * n,
    parts: () => [{ mat: "bread", solid: union(...Array.from({ length: n }, (_, i) => rbox(0.11, 0.115, 0.25, 0.03, -((n - 1) * 0.14) + i * 0.28 + (hash(n, i) - 0.5) * 0.05, 0, 0).rotate(-14, (hash(n, i, 1) - 0.5) * 10, 0))) }],
  });

prop({
  id: "bread-basket", items: ["shop-baker"], size: [0.5, 0.25, 0.36], place: "on", tris: 2000,
  parts: () => [
    { mat: "wood-raw", solid: lathe([[0, 0], [0.16, 0], [0.22, 0.14], [0.23, 0.15], [0.21, 0.15], [0.15, 0.015], [0, 0.015]], 0, 0, 0, 24).scale(1.1, 1, 0.75) },
    { mat: "bread", solid: union(rbox(0.11, 0.1, 0.24, 0.03, -0.06, 0.02, 0).rotate(0, 20, 8), rbox(0.11, 0.1, 0.24, 0.03, 0.07, 0.03, 0.01).rotate(0, -15, -6)) },
  ],
});

/** The balance: two brass pans on an iron base (a Tafelwaage), and its weights in their block. */
prop({
  id: "scale", items: ["shop-baker", "shop-grocer"], size: [0.5, 0.22, 0.2], place: "on", tris: 2500,
  parts: () => [
    { mat: "iron", solid: union(rbox(0.46, 0.08, 0.16, 0.02), post(0.02, 0.06, -0.12, 0.08, 0), post(0.02, 0.06, 0.12, 0.08, 0)) },
    { mat: "brass", solid: union(lathe([[0, 0], [0.09, 0.005], [0.1, 0.02], [0.095, 0.022], [0, 0.008]], -0.12, 0.14, 0), lathe([[0, 0], [0.09, 0.005], [0.1, 0.02], [0.095, 0.022], [0, 0.008]], 0.12, 0.14, 0), post(0.004, 0.06, 0, 0.08, 0)) },
    { mat: "wood-dark", solid: box(0.14, 0.04, 0.08, 0.32, 0, 0) },
  ],
});

prop({
  id: "till", items: ["shop-baker", "shop-grocer"], size: [0.42, 0.14, 0.36], place: "on", tris: 500,
  parts: () => [{ mat: "wood-dark", solid: union(box(0.42, 0.12, 0.36), box(0.36, 0.06, 0.01, 0, 0.03, 0.18)) }, { mat: "brass", solid: union(ball(0.012).move(0, 0.06, 0.19), box(0.08, 0.02, 0.005, 0, 0.1, 0.18)) }],
});

/** The cake case: glazed on three sides, empty in the war (cake and pastry under the baking restrictions). */
prop({
  id: "cake-case", items: ["shop-baker", "shop-konditorei"], size: [1.0, 0.5, 0.5], place: "on", tris: 800,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.0, 0.04, 0.5), box(1.0, 0.03, 0.5, 0, 0.47, 0), box(0.03, 0.47, 0.03, -0.485, 0, 0.235), box(0.03, 0.47, 0.03, 0.485, 0, 0.235), box(0.03, 0.47, 0.03, -0.485, 0, -0.235), box(0.03, 0.47, 0.03, 0.485, 0, -0.235)) },
    { mat: "glass", solid: union(box(0.96, 0.43, 0.004, 0, 0.04, 0.245), box(0.004, 0.43, 0.46, -0.495, 0.04, 0), box(0.004, 0.43, 0.46, 0.495, 0.04, 0), box(0.96, 0.004, 0.46, 0, 0.2, 0)) },
  ],
});

/** Bread-card coupons cut and pasted in rows on sheets for the bread office: the baker's war paperwork. */
prop({
  id: "coupon-sheets", items: ["ration-cards", "shop-baker"], size: [0.35, 0.03, 0.25], place: "on", tris: 300,
  parts: () => [{ mat: "paper", solid: union(box(0.3, 0.004, 0.21, 0, 0, 0).rotate(0, 6, 0), box(0.3, 0.004, 0.21, 0.02, 0.005, 0.01).rotate(0, -4, 0), box(0.3, 0.004, 0.21, -0.01, 0.01, 0)) }, { mat: "iron", solid: box(0.12, 0.012, 0.03, 0.12, 0.014, -0.07) }],
});

/** A shop's gas pendant: a rod from the ceiling, an upright mantle in a frosted globe. Hook at y = 0, hangs below. */
prop({
  id: "shop-pendant", items: ["gas-pendant"], size: [0.3, 0.9, 0.3], place: "ceiling", tris: 1500,
  parts: () => [
    { mat: "brass", solid: union(post(0.04, 0.03, 0, -0.03, 0), post(0.008, 0.62, 0, -0.65, 0), lathe([[0, 0], [0.07, 0], [0.09, 0.03], [0.03, 0.05], [0, 0.05]], 0, -0.7, 0), rodX(0.006, 0.18, 0, -0.4, 0)) },
    { mat: "lamp-shade", solid: lathe([[0, 0], [0.06, 0.01], [0.11, 0.08], [0.1, 0.16], [0.06, 0.2], [0, 0.2]], 0, -0.9, 0, 28) },
    { mat: "mantle", solid: post(0.018, 0.05, 0, -0.85, 0) },
  ],
  glow: [{ at: [0, -0.82, 0], lumens: 700, color: "#ffd2a0", range: 12, shadow: true }],
});

/** A shopfront in the street wall's opening: a timber frame, a plate-glass window over a panelled riser, a glazed
 *  door with a transom. Origin: the opening's bottom middle on the room face; the street is at -z. */
prop({
  id: "shopfront-bakery", items: ["shop-baker"], size: [4.6, 3.1, 0.3], place: "hung", tris: 3000,
  parts: () => {
    const W = 4.6, Hh = 3.1, winW = 3.0, doorW = 1.1, x0 = -W / 2;
    const fr = [box(W, 0.12, 0.12, 0, Hh - 0.12, -0.15), box(0.12, Hh, 0.12, x0 + 0.06, 0, -0.15), box(0.12, Hh, 0.12, -x0 - 0.06, 0, -0.15), box(0.1, Hh, 0.12, x0 + winW + 0.05, 0, -0.15), box(winW, 0.08, 0.12, x0 + winW / 2, 0.62, -0.15), box(W, 0.08, 0.12, 0, 2.55, -0.15), box(winW, 0.62, 0.08, x0 + winW / 2, 0, -0.2)];
    const door = [box(doorW - 0.1, 0.05, 0.05, -x0 - doorW / 2 - 0.12, 1.05, -0.15), box(doorW - 0.1, 0.9, 0.05, -x0 - doorW / 2 - 0.12, 0.05, -0.15)];
    return [
      { mat: "paint-green", solid: union(...fr, ...door) },
      { mat: "glass", solid: union(box(winW - 0.1, 1.85, 0.008, x0 + winW / 2, 0.68, -0.15), box(doorW - 0.15, 1.4, 0.008, -x0 - doorW / 2 - 0.12, 1.1, -0.15), box(W - 0.2, 0.42, 0.008, 0, 2.62, -0.15)) },
      { mat: "brass", solid: union(rodX(0.012, 0.3, -x0 - doorW + 0.05, 1.05, -0.08), post(0.01, 0.06, -x0 - doorW + 0.02, 2.48, -0.1)) },
    ];
  },
});

/** The notice in the window, pasted on the glass: bread only against cards (the loaf's weight and price by order). */
prop({
  id: "ration-notice", items: ["ration-cards", "shop-baker"], size: [0.3, 0.42, 0.01], place: "hung", tris: 50,
  parts: () => [{ mat: "paper-poster", solid: box(0.3, 0.42, 0.002) }, { mat: "iron", solid: union(box(0.24, 0.03, 0.001, 0, 0.34, 0.0015), box(0.2, 0.01, 0.001, 0, 0.28, 0.0015), box(0.22, 0.01, 0.001, 0, 0.24, 0.0015), box(0.18, 0.01, 0.001, 0, 0.2, 0.0015), box(0.21, 0.01, 0.001, 0, 0.16, 0.0015)) }],
});

/** The display in the window: a board on trestles, a few loaves and a basket, a paper doily. */
prop({
  id: "window-display", items: ["shop-baker"], size: [2.6, 0.75, 0.6], place: "floor", tris: 1200,
  parts: () => [{ mat: "wood-soft", solid: union(box(2.6, 0.03, 0.6, 0, 0.7, 0), box(0.04, 0.7, 0.5, -1.1, 0, 0), box(0.04, 0.7, 0.5, 1.1, 0, 0)) }, { mat: "paper", solid: box(1.6, 0.003, 0.4, 0, 0.73, 0) }],
});

prop({
  id: "barrel", items: ["shop-grocer", "hoard"], size: [0.5, 0.7, 0.5], place: "floor", tris: 1500,
  parts: () => [{ mat: "wood-mid", solid: lathe([[0, 0], [0.2, 0], [0.24, 0.35], [0.2, 0.7], [0, 0.7]], 0, 0, 0, 24) }, { mat: "iron", solid: union(taper(0.215, 0.235, 0.04, 0, 0.12, 0), taper(0.235, 0.215, 0.04, 0, 0.54, 0)) }],
});

export const KIT_SHOP = true;
