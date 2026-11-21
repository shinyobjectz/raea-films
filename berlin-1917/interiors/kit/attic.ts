// Attic kit: what a mansard's rooms add to the others (interiors/attic.ts): the rafters down the slope, the chimney
// breast that runs up through the loft, a wicker trunk of what isn't needed till spring.
import { MANSARD, LOFT } from "../attic";
import { box, hash, rbox, union } from "./geo";
import { prop } from "./prop";

/** A rafter down the mansard's slope, 6 cm proud of it, on a stud from the floor to the knee (the Drempel). Origin: the
 *  front wall's face at the floor; the room is +z. */
prop({
  id: "rafter-mansard", items: ["rafters"], size: [0.1, 2.45, 0.95], place: "wall", tris: 300,
  parts: () => {
    const { knee, run } = MANSARD, rise = LOFT.h - knee, L = Math.hypot(run, rise), a = (Math.atan2(run, rise) * 180) / Math.PI;
    return [{ mat: "wood-raw", solid: union(box(0.08, L, 0.12).rotate(a, 0, 0).move(0, knee, 0.07), box(0.1, knee, 0.14, 0, 0, 0.07)) }];
  },
});

/** The chimney breast where the house's flues run up through the loft: raw brick, a soot door to sweep it. Origin:
 *  floor, its back to the wall at z = -0.2. */
prop({
  id: "chimney-breast", items: ["chimney-breast"], size: [0.64, 2.45, 0.4], place: "wall", tris: 200,
  parts: () => [
    { mat: "brick", solid: box(0.64, 2.45, 0.4, 0, 0, 0) },
    { mat: "iron-rust", solid: box(0.22, 0.26, 0.02, 0.08, 0.55, 0.205) },
  ],
});

/** A wicker hamper with a lid and two leather straps (Reisekorb): bedding, winter clothes, a soldier son's things.
 *  Origin: its foot's middle. */
prop({
  id: "attic-trunk", items: ["trunk"], size: [0.82, 0.5, 0.5], place: "floor", tris: 1500,
  parts: () => {
    const straps = [-0.22, 0.22].map((x) => box(0.04, 0.5, 0.5, x, -0.002, 0));
    return [
      { mat: "jute", solid: union(rbox(0.8, 0.4, 0.46, 0.03, 0, 0, 0), rbox(0.82, 0.1, 0.48, 0.03, 0, 0.39, 0).rotate(0, 0, (hash(3, 1) - 0.5) * 2)) },
      { mat: "leather", solid: union(...straps).minus(rbox(0.78, 0.48, 0.44, 0.03, 0, 0.005, 0)), overlap: true },
    ];
  },
});

export const KIT_ATTIC = true;
