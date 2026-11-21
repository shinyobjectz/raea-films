// Boat hulls lofted from their sections (the barge, the tug).
import { manifold, type Solid } from "raea/3d";
import { box, union } from "./geo";

/** A section at z: its right half's outline points [x, y] from the keel up, mirrored to the left (x 0 kept once). */
export type Station = [number, [number, number][]];

const dots = ([z, p]: Station): Solid[] =>
  p.flatMap(([x, y]) => (x < 0.002 ? [box(0.002, 0.002, 0.002, 0, y, z)] : [box(0.002, 0.002, 0.002, x, y, z), box(0.002, 0.002, 0.002, -x, y, z)]));

/** A hull lofted through its stations (in order along z): each neighbouring pair's convex hull, unioned, so the sheer
 *  dipping amidships and the ends rising follow the stations instead of the whole hull's convex hull bridging them. */
export const loft = (st: Station[]): Solid => union(...st.slice(1).map((s, i) => manifold.hull(...dots(st[i]), ...dots(s))));

/** A band round a hull just under its sheer: the hull grown outward by `grow`, kept from `top` to `top + h` below its
 *  top surface, the inside (`inner`, the hull shrunk and stood tall) taken out so only the ring on the sides is left. */
export function sheerBand(hull: Solid, beam: number, length: number, grow: number, top: number, h: number): Solid {
  const g = hull.scale(1 + (2 * grow) / beam, 1, 1 + (2 * grow) / length);
  const inner = hull.scale(1 - 0.3 / beam, 1.6, 1 - 0.3 / length);
  return g.move(0, -top, 0).minus(g.move(0, -top - h, 0)).intersect(g).minus(inner);
}
