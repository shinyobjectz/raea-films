// Two small fittings the shop and war-kitchen sets hang and stand: a red enamel no-smoking plate, and a standing
// desk with a ledger. (They were first modelled for another set of the project; only these two are used here.)
import { box, union } from "./geo";
import { prop } from "./prop";

/** The no-smoking plate: red enamel, a white border. */
prop({
  id: "enamel-sign", items: ["enamel-signs"], size: [0.6, 0.3, 0.02], place: "hung", tris: 100,
  parts: () => [
    { mat: "paint-red", solid: box(0.6, 0.3, 0.012, 0, 0, 0) },
    { mat: "enamel", solid: union(box(0.54, 0.012, 0.004, 0, 0.03, 0.006), box(0.54, 0.012, 0.004, 0, 0.258, 0.006), box(0.012, 0.24, 0.004, -0.264, 0.03, 0.006), box(0.012, 0.24, 0.004, 0.264, 0.03, 0.006), ...[-0.18, -0.06, 0.06, 0.18].map((x) => box(0.08, 0.05, 0.004, x, 0.13, 0.006))), overlap: true },
  ],
});

/** A standing desk by the door: a sloped top, a ledger, a lamp. */
prop({
  id: "works-desk", items: ["office"], size: [1.2, 1.3, 0.7], place: "wall", tris: 800,
  parts: () => [
    { mat: "wood-dark", solid: union(box(1.2, 0.04, 0.7, 0, 1.05, 0).rotate(10, 0, 0).move(0, 0.06, 0.06), ...[-0.55, 0.55].flatMap((x) => [-0.3, 0.3].map((z) => box(0.06, 1.05, 0.06, x, 0, z))), box(1.1, 0.04, 0.6, 0, 0.25, 0)) },
    { mat: "paper", solid: box(0.5, 0.03, 0.34, -0.15, 1.14, 0.08).rotate(10, 0, 0).move(0, 0.06, 0.06), overlap: true },
    { mat: "card", solid: box(0.36, 0.08, 0.26, 0.35, 0.29, 0), overlap: true },
  ],
});

export const KIT_FITTINGS = true;
