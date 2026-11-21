// A kit prop: parts (one solid per material), its footprint, the catalogue items it stands for, and any light it
// gives. Built once, on first use, and cached: a set names props by id and the composition instances them.
import type { Solid } from "raea/3d";
import type { MatId } from "./mats";
import type { V3 } from "./geo";

/** `overlap`: it sits into the part before it on purpose (a tie cinching a sack's neck), so the clip check leaves it out */
export type Part = { mat: MatId; solid: Solid; overlap?: boolean };
/** A light a prop gives, in its own frame: a candle, a mantle, a stove's fire door. */
/** `fill`: light the prop throws back off itself (a shade, a hood) that stands in for bounce; never shadowed. */
export type Glow = {
  at: V3; lumens: number; color: string; range: number; shadow?: boolean; flicker?: number; fill?: boolean;
  /** where ray-traced light's emitter sits, when `at` (placed for raster shadow maps, which skip what's within 10 cm of the
   *  light) is inside the prop's own solids: traced, it would be sealed in (SetRooms traced) */
  body?: V3;
};
export type Prop = {
  id: string;
  /** catalogue item ids (research/catalogue) this prop is built for */
  items: string[];
  /** width (x), height (y), depth (z), metres: the footprint a layout keeps clear */
  size: V3;
  parts: Part[];
  glow?: Glow[];
  /** where it goes when a layout places it: against a wall, free on the floor, on a surface, hung, from the ceiling */
  place: "wall" | "floor" | "on" | "hung" | "ceiling" | "corner";
  /** Only in this kind of room (the furnisher reads it): a coal heap belongs in a cellar, not a kitchen. */
  /** cellar: only the cellar's furnisher takes it. set: made for one hand-dressed set (interiors/sets), so the
   *  furnisher never takes it and the generated rooms keep their picks. */
  where?: "cellar" | "set";
  /** triangle budget for LOD0; the bake fails a prop that breaks it */
  tris?: number;
};
type Def = Omit<Prop, "parts"> & { parts: () => Part[] };

const defs = new Map<string, Def>();
const built = new Map<string, Prop>();

export function prop(d: Def): void {
  if (defs.has(d.id)) throw new Error(`kit: two props named ${d.id}`);
  defs.set(d.id, d);
}
/** How far (m) simplifying a built prop may move its surface. */
export const LEAN = 0.0005;
export function get(id: string): Prop {
  const have = built.get(id);
  if (have) return have;
  const d = defs.get(id);
  if (!d) throw new Error(`kit: no prop ${id}`);
  // every part simplified to LEAN: a surface moves at most that far, which is under a pixel from a metre away; it
  // takes the facets a primitive's fixed segment count wastes on a thin rod or a cup (t-ilean0001)
  const p: Prop = { ...d, parts: d.parts().map((q) => ({ ...q, solid: q.solid.simplify(LEAN) })) };
  built.set(id, p);
  return p;
}
export const ids = () => [...defs.keys()];
export const def = (id: string) => defs.get(id);
