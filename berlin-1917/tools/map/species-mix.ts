// The species mixes and habits of 1917's trees, shared by tools/map/species.ts (every tree of the map) and
// tools/foliage/props-species.ts (the world's tree props): see species.ts for where each comes from.

export type Species = "lime" | "elm" | "plane" | "maple" | "chestnut" | "locust" | "oak" | "birch" | "poplar" | "willow";

/** a park grove's cell, m: a tree keeps its cell's species 70% of the time */
export const GROVE = 25;
// the 1917 street mix and the park mix (ASSUMED, research/foliage-1917.md "Street trees")
export const STREET: [Species, number][] = [["lime", 0.4], ["elm", 0.2], ["plane", 0.15], ["maple", 0.1], ["chestnut", 0.1], ["locust", 0.05]];
export const PARK: [Species, number][] = [["lime", 0.2], ["oak", 0.15], ["maple", 0.15], ["elm", 0.1], ["chestnut", 0.1], ["plane", 0.1], ["birch", 0.08], ["poplar", 0.05], ["willow", 0.04], ["locust", 0.03]];
// height over crown width (raea-sys-foliage's height_per_width: the Baumbestand's median for trees of 50 years or more;
// the poplar's a Lombardy's, ASSUMED) and the grown seeds of each
export const HABIT: Record<Species, number> = { lime: 1.39, elm: 1.92, plane: 1.15, maple: 1.42, chestnut: 1.27, locust: 1.89, oak: 1.5, birch: 1.71, poplar: 4.5, willow: 1.19 };
export const VARIANTS: Record<Species, number> = { lime: 3, elm: 2, plane: 2, maple: 2, chestnut: 2, locust: 1, oak: 1, birch: 1, poplar: 1, willow: 1 };
// the Kataster's genera as ours (Sophora, the pagoda tree, reads as a locust; ASSUMED)
export const GENUS: Record<string, Species> = { Tilia: "lime", Ulmus: "elm", Platanus: "plane", Acer: "maple", Aesculus: "chestnut", Robinia: "locust", Sophora: "locust", Quercus: "oak", Betula: "birch", Populus: "poplar", Salix: "willow" };

export const hash = (a: number, b = 0) => {
  let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
};
export const draw = (mix: [Species, number][], r: number): Species => {
  for (const [s, w] of mix) if ((r -= w) < 0) return s;
  return mix[mix.length - 1][0];
};

/** A park tree's species at E, N (EPSG:25833): its grove's, 70% of the time, else its own draw by `i`. */
export function parkSpecies(e: number, n: number, i: number): Species {
  const grove = draw(PARK, hash(Math.floor(e / GROVE), Math.floor(n / GROVE)));
  return hash(i, 3) < 0.7 ? grove : draw(PARK, hash(i, 4));
}
