// The Konditorei and its café (research/catalogue: shop-konditorei, 34 storefronts on the three streets read, and the
// chocolatiers with them): the buffet with its cake case at the back, marble tables on iron feet, bentwood chairs (the
// Thonet No. 14 every Berlin café sat on), a plush banquette under a wall mirror, the newspapers on their holders. Winter 1917-18: cake
// only from war flour and on the days the baking orders allow, sugar rationed, so a few plain cakes on the stands and
// boxes of chocolate for the front (Liebesgaben) in the window.
import { sdf } from "raea/3d";
import { ball, box, lathe, post, ring, union } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const CAFE = ["shop-konditorei", "shop-chocolate"];

/** A café table: a round marble top on a cast-iron column and three splayed feet. */
prop({
  id: "cafe-table", items: [...CAFE, "cafe-table"], size: [0.62, 0.74, 0.62], place: "floor", tris: 1400,
  parts: () => {
    const feet = [0, 1, 2].map((k) => {
      const a = (k * 2 * Math.PI) / 3, x = Math.sin(a) * 0.26, z = Math.cos(a) * 0.26;
      return union(bar([0, 0.16, 0], [x, 0.02, z], 0.014), ball(0.015).move(x, 0.015, z));
    });
    return [
      { mat: "marble", solid: lathe([[0, 0], [0.3, 0], [0.31, 0.012], [0.3, 0.026], [0, 0.026]], 0, 0.714, 0, 28) },
      { mat: "iron", solid: union(post(0.02, 0.56, 0, 0.15, 0), lathe([[0, 0], [0.06, 0], [0.05, 0.02], [0.022, 0.03], [0, 0.03]], 0, 0.684, 0, 12), lathe([[0, 0], [0.04, 0], [0.04, 0.03], [0, 0.05]], 0, 0.13, 0, 12), ...feet), overlap: true },
    ];
  },
});

/** The bentwood café chair (Thonet No. 14): a round caned seat in a steamed-beech rim, four splayed legs braced by a
 *  ring, the back legs running on up into the back's loop with a smaller loop inside it. Faces +z, back toward -z. */
const poly = (pts: [number, number, number][], r: number) => pts.slice(1).map((q, i) => bar(pts[i], q, r));
const arc = (cx: number, cy: number, z: number, rx: number, ry: number, a0: number, a1: number, n: number, lean = 0) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n, y = cy + Math.sin(a) * ry;
    return [cx + Math.cos(a) * rx, y, z - lean * (y - cy)] as [number, number, number];
  });
prop({
  id: "bentwood-chair", items: [...CAFE, "chairs-bent"], size: [0.42, 0.88, 0.5], place: "floor", tris: 2200,
  parts: () => {
    const legs = [-1, 1].flatMap((s) => [bar([s * 0.15, 0.44, 0.12], [s * 0.18, 0, 0.17], 0.012), bar([s * 0.13, 0.44, -0.13], [s * 0.17, 0, -0.21], 0.012)]);
    // the back legs up from the seat's rim, leaning back, closing over the top in a half loop
    const back = poly([[-0.13, 0.44, -0.14], ...arc(0, 0.74, -0.2, 0.13, 0.13, Math.PI, 0, 8, 0.25), [0.13, 0.44, -0.14]], 0.011);
    const inner = poly(arc(0, 0.67, -0.19, 0.075, 0.12, 0, 2 * Math.PI, 12, 0.2), 0.008);
    return [
      { mat: "wood-dark", solid: union(ring(0.2, 0.014, 24, 6).rotate(90, 0, 0).move(0, 0.445, 0), ring(0.165, 0.009, 20, 6).rotate(90, 0, 0).move(0, 0.2, -0.01), ...legs, ...back, ...inner) },
      { mat: "straw", solid: lathe([[0, 0], [0.195, 0], [0.195, 0.012], [0, 0.012]], 0, 0.438, 0, 24), overlap: true },
    ];
  },
});

/** The banquette along the wall: a dark wood plinth and top rail, the seat and back in red plush. Back to the wall. */
prop({
  id: "banquette", items: [...CAFE, "banquette"], size: [2.0, 1.1, 0.6], place: "wall", tris: 3600,
  parts: () => [
    { mat: "wood-dark", solid: union(box(2.0, 0.26, 0.54, 0, 0, -0.03), box(2.0, 0.06, 0.08, 0, 1.04, -0.26), box(0.06, 1.04, 0.08, -0.97, 0, -0.26), box(0.06, 1.04, 0.08, 0.97, 0, -0.26)) },
    {
      mat: "plush",
      solid: union(
        sdf.box(1.88, 0.18, 0.52, 0.05).move(0, 0.34, -0.01).solid(0.06).simplify(0.02),
        sdf.box(1.88, 0.58, 0.14, 0.05).move(0, 0.74, -0.22).solid(0.06).simplify(0.02),
      ),
      overlap: true,
    },
  ],
});

/** The café's wall mirror over the banquette or behind the buffet: plate glass in a gilt frame. Hung. */
prop({
  id: "cafe-mirror", items: [...CAFE, "cafe-mirror"], size: [1.6, 1.0, 0.05], place: "hung", tris: 300,
  parts: () => [
    { mat: "brass", solid: union(box(1.6, 0.07, 0.05), box(1.6, 0.09, 0.05, 0, 0.91, 0), box(0.07, 1.0, 0.05, -0.765, 0, 0), box(0.07, 1.0, 0.05, 0.765, 0, 0), box(0.5, 0.05, 0.04, 0, 1.0 - 0.02, 0.005)) },
    { mat: "glass-dark", solid: box(1.48, 0.86, 0.01, 0, 0.07, -0.005) },
  ],
});

/** A cake étagère: three glass plates on a brass rod; a plain war cake on the bottom one, a few small pastries on the
 *  middle, the top one bare on its paper doily. */
prop({
  id: "cake-stand", items: [...CAFE, "shop-baker"], size: [0.34, 0.46, 0.34], place: "on", tris: 1500,
  parts: () => {
    const plate = (r: number, y: number) => lathe([[0, 0], [r, 0], [r, 0.006], [0, 0.006]], 0, y, 0, 24);
    const pastries = [0, 1, 2].map((k) => {
      const a = k * 2.2 + 0.4;
      return lathe([[0, 0], [0.035, 0], [0.032, 0.022], [0, 0.026]], Math.sin(a) * 0.07, 0.186, Math.cos(a) * 0.07, 10);
    });
    return [
      { mat: "brass", solid: union(post(0.006, 0.44, 0, 0, 0), ball(0.014).move(0, 0.445, 0)) },
      { mat: "glass", solid: union(plate(0.17, 0.02), plate(0.125, 0.18), plate(0.085, 0.33)), overlap: true },
      { mat: "bread", solid: union(lathe([[0, 0], [0.12, 0], [0.118, 0.055], [0.1, 0.065], [0, 0.066]], 0, 0.026, 0, 20), ...pastries), overlap: true },
      { mat: "paper", solid: lathe([[0, 0], [0.07, 0], [0.07, 0.002], [0, 0.002]], 0, 0.336, 0, 16), overlap: true },
    ];
  },
});

/** Chocolate for the front: flat card boxes stacked askew, ribboned, the Liebesgaben a Konditorei's window offered. */
prop({
  id: "praline-boxes", items: [...CAFE, "liebesgaben"], size: [0.42, 0.16, 0.3], place: "on", tris: 400,
  parts: () => [
    { mat: "card", solid: union(box(0.34, 0.045, 0.24, -0.02, 0, 0).rotate(0, 8, 0), box(0.3, 0.04, 0.2, 0.03, 0.045, 0.01).rotate(0, -6, 0), box(0.24, 0.04, 0.17, 0.0, 0.085, 0.0).rotate(0, 14, 0)) },
    { mat: "paint-red", solid: union(box(0.02, 0.05, 0.25, -0.02, 0.0, 0).rotate(0, 8, 0), box(0.02, 0.046, 0.21, 0.03, 0.044, 0.01).rotate(0, -6, 0), box(0.25, 0.046, 0.02, 0.0, 0.084, 0.0).rotate(0, 14, 0)), overlap: true },
  ],
});

export const KIT_CAFE = true;
