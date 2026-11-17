// Two places from scanned things alone (blender/outdoors.py: Poly Haven, CC0), for the main shots that were still
// hand-modelled: a garden at dusk (a jacaranda, a picnic table, a street lamp, a lantern) and a harbour (a wooden pier,
// a Dutch ship moored along it, a pinnace out in the bay, the coast's rocks). Both look down -z from near the origin.
import type { Part } from "../parts/library";

export type Placed = Part & { place?: string; overlap?: boolean };
/** a meadow: the 4 m grass tiles (blender/meadow.py) laid edge to edge over x0..x1, z0..z1, each turned a quarter and
 *  nudged so no two rows line up; every `flowers`th one is the tile with flowers standing in it */
export function meadow(x0: number, x1: number, z0: number, z1: number, flowers = 3, name = "meadow"): Placed[] {
  const out: Placed[] = [];
  let i = 0;
  for (let x = x0 + 2; x < x1 + 0.1; x += 3.7) for (let z = z0 - 2; z > z1 - 0.1; z -= 3.7, i++)
  {
    out.push({ place: "garden", file: flowers && i % flowers === 1 ? "meadow-flowers" : "meadow", at: [x + 0.5 * (rnd(i, 21) - 0.5), 0, z + 0.5 * (rnd(i, 22) - 0.5)], yaw: (Math.PI / 2) * Math.floor(4 * rnd(i, 23)), scale: 1.15, name: `${name}-${i}`, overlap: true });
    // a second tile over the first, half a tile along and turned: one layer left the ground showing between the clumps
    out.push({ place: "garden", file: "meadow", at: [x + 1.85, 0, z - 1.85], yaw: (Math.PI / 2) * Math.floor(4 * rnd(i, 24)) + 0.6, scale: 1.25, name: `${name}-b${i}`, overlap: true });
  }
  return out;
}
/** a third layer of the meadow's tiles where the lens is close to the ground: at a closer pitch and each turned its own
 *  way, so the clumps of the layers under it fill each other's gaps (the director, 11-11, on the garden at 0:46.3: "moe grass
 *  no patches") */
function thick(x0: number, x1: number, z0: number, z1: number): Placed[] {
  const out: Placed[] = [];
  let i = 0;
  for (let x = x0; x < x1 + 0.1; x += 2.3) for (let z = z0; z > z1 - 0.1; z -= 2.3, i++)
    out.push({ place: "garden", file: "meadow", at: [x + 0.6 * (rnd(i, 31) - 0.5), 0, z + 0.6 * (rnd(i, 32) - 0.5)], yaw: 6.283 * rnd(i, 33), scale: 1.05 + 0.2 * rnd(i, 34), name: `meadow-n${i}`, overlap: true });
  return out;
}
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- the garden ---------------------------------------------------------------------------------------------------
export const TABLE: [number, number, number] = [0.3, 0, -3.3];
export const TABLE_TOP = 0.75;
export const LAMP_POST: [number, number, number] = [3.0, 0, -6.4];
export function garden(): Placed[] {
  const out: Placed[] = [
    // (a lawn: the ground is grass and a meadow of scanned grass stands on it. It was forest dirt with forty-six tufts:
    // the director, 11-11, "theres no gradss showing really")
    { file: "lawn", at: [0, 0, -8] },
    ...meadow(-11, 11, 3, -27, 4),
    ...thick(-5.5, 6.5, 3, -8.5),
    { file: "tree", at: [-8.5, -0.05, -17], yaw: 0.7, scale: 0.75, name: "jacaranda" },
    { file: "small-tree", at: [6.4, -0.03, -9.5], yaw: 1.9, name: "tree-right" },
    { file: "small-tree", at: [-5.6, -0.03, -5.2], yaw: 4.1, scale: 0.85, name: "tree-left" },
    { file: "small-tree", at: [10.5, -0.03, -19], yaw: 0.4, scale: 1.2, name: "tree-far" },
    { file: "picnic-table", at: TABLE, yaw: 0.42, name: "picnic-table" },
    { file: "bench", at: [-2.7, 0, -5.4], yaw: 0.95, name: "bench" },
    { file: "street-lamp", at: LAMP_POST, yaw: -0.5, name: "street-lamp" },
    { file: "fire-pit", at: [2.5, 0, -1.9], name: "fire-pit" },
    { file: "gnome", at: [-1.55, 0, -2.5], yaw: 0.7, name: "gnome" },
    { file: "watering-can", at: [-1.15, 0, -2.2], yaw: 2.2, name: "watering-can" },
    { file: "planter", at: [-2.3, 0, -3.0], yaw: 0.5, name: "planter" },
    { file: "planter", at: [3.9, 0, -4.6], yaw: -0.9, name: "planter-2" },
    { file: "rocks", at: [-7.5, -0.1, -9.5], yaw: 0.6, scale: 0.6, name: "rocks" },
    { file: "rocks", at: [9, -0.1, -13], yaw: 2.4, scale: 0.5, name: "rocks-2" },
  ];
  // the lawn's tufts, the shrubs along its back and the flowers by the table: strips of plants, each turned its own way
  for (let i = 0; i < 16; i++) {
    if (i === 2) continue;                                                       // (it stood in the rocks)
    const a = -1.2 + 2.4 * (i / 15), r = 9.5 + 3 * rnd(i, 6);
    out.push({ file: ["shrub", "shrub-b", "shrub-c"][i % 3], at: [Math.sin(a) * r, -0.02, -4 - Math.cos(a) * r * 0.8], yaw: 6.28 * rnd(i, 7), scale: 1.6 + 1.2 * rnd(i, 8), name: `shrub-${i}` });
  }
  for (let i = 0; i < 12; i++) {
    const a = 6.28 * rnd(i, 9), r = 2.2 + 2.2 * rnd(i, 10);
    out.push({ file: i % 2 ? "gazania" : "ursinia", at: [TABLE[0] + Math.sin(a) * r, -0.02, TABLE[2] + Math.cos(a) * r], yaw: 6.28 * rnd(i, 11), name: `flowers-${i}` });
  }
  // the wood the garden is a clearing in: the forest road's scanned firs in two loose rows round its back, so the lawn
  // ends in trunks and not at a horizon
  for (let i = 0; i < 26; i++) {
    if (i === 7) continue;                                                       // (it stood in the rock bank)
    const a = -1.45 + 2.9 * (i / 25), r = (i % 2 ? 24 : 31) + 4 * rnd(i, 12);
    out.push({ place: "forest", file: ["fir-a", "fir-b", "fir-c"][i % 3], at: [Math.sin(a) * r, -0.05, -6 - Math.cos(a) * r], yaw: 6.28 * rnd(i, 13), scale: 0.9 + 0.5 * rnd(i, 14), name: `fir-${i}` });
  }
  // a bank of mossy rock where the lawn meets the wood (it also stands between the lens and the bare horizon)
  for (let i = 0; i < 9; i++) {
    const a = -1.3 + 2.6 * (i / 8), r = i % 2 ? 36 : 27;
    out.push({ file: "rocks", at: [Math.sin(a) * r, -0.25, -6 - Math.cos(a) * r], yaw: -a + 0.3 * (rnd(i, 16) - 0.5), scale: 1.45, name: `bank-${i}` });
  }
  return out;
}

// ---- the harbour --------------------------------------------------------------------------------------------------
/** the pier's deck, metres above the water (the water is y 0). The scan is a kit: four sections end to end, 12.4 m of
 *  deck 2.5 m wide with its top 3.66 m up the model, a gate frame, and spare planks and piles beyond the near end. */
export const DECK = 0.95;
const PIER_Y = DECK - 3.66, PIER_Z = 2;                                      // the deck then runs z -7.5 to 4.9
export const SHIP: [number, number, number] = [5.4, -1.7, -6.5];
/** the lantern, on the second crate's lid */
export const LANTERN: [number, number, number] = [0.7, DECK + 0.38, -2.2];
export function harbour(): Placed[] {
  return [
    { file: "pier", at: [0, PIER_Y, PIER_Z], name: "pier" },
    { file: "ship", at: SHIP, yaw: Math.PI / 2, name: "ship" },
    { file: "pinnace", at: [-30, -2.2, -62], yaw: 0.5, name: "pinnace" },
    { file: "rocks", at: [-46, -1.3, -30], yaw: 0.4, name: "rocks" },
    { file: "rocks-b", at: [38, -1.2, -78], yaw: 2.1, name: "rocks-b" },
    // (the kit's fourth section steps down to the water: everything stands on the first three, z -4.4 to 4.9)
    { file: "barrels", at: [-0.3, DECK + 0.03, -3.1], yaw: 0.3, scale: 0.4, name: "barrels" },
    { file: "bucket", at: [0.75, DECK + 0.02, -0.5], yaw: 0.8, name: "bucket" },
    { file: "basket", at: [-0.8, DECK + 0.02, 0.6], yaw: 0.2, name: "basket" },
    { file: "crate", at: [0.7, DECK + 0.02, -2.2], yaw: 0.6, name: "crate-2" },
    { file: "lantern", at: LANTERN, name: "lantern" },
  ];
}

// ---- the door in the garden ---------------------------------------------------------------------------------------
// the director, 11-11 (assembly 18): "maybe one door could be like something we built way back it was a door in a garden with
// flowers and grass and trees and clouds, we could have some of the door scenes be more surreal like that not just a
// dark room". A meadow in daylight under a sky with clouds in it, and the path leading up it to a door.
// The door is a cottage's (the director, 11-11: "for the garden greenhouse building on the path we shoudl try to rebuild and
// redesign it as a cottage with crafstman style and ivy/vines, flowwers"): a Craftsman bungalow, its porch over the
// door, ivy on its walls and roses on its porch (blender/components/cottage, placed by v3/walk.tsx with its front door
// where the walk's door has always been, on the wall's line at z -3.2). Nothing of the garden stands in it: the meadow,
// beds and shrubs keep off its floor plan and its porch, and beds of flowers stand along its front instead.
/** the cottage's floor plan (its walls, x and z), its porch's floor, and its chimney: what the garden keeps off */
const COTTAGE = { x: 3.95, z0: -10.15, z1: -3.05 }, PORCH = { x: 2.1, z0: -3.2, z1: -0.85 }, CHIMNEY = { x0: -4.6, x1: -3.9, z0: -7.3, z1: -5.8 };
const into = (at: number[], r: number, b: { x0: number; x1: number; z0: number; z1: number }) => at[0] + r > b.x0 && at[0] - r < b.x1 && at[2] + r > b.z0 && at[2] - r < b.z1;
/** whether a thing of half-width r standing at `at` keeps off the cottage (its middle out of the house, all of it off the porch) */
const offCottage = (at: number[], r: number) => !into(at, 0, { x0: -COTTAGE.x, x1: COTTAGE.x, z0: COTTAGE.z0, z1: COTTAGE.z1 }) && !into(at, r, { x0: -PORCH.x, x1: PORCH.x, z0: PORCH.z0, z1: PORCH.z1 }) && !into(at, Math.min(r, 0.6), CHIMNEY);
export function doorGarden(): Placed[] {
  const out: Placed[] = [
    { file: "lawn", at: [0, -0.01, -4], name: "lawn" },
    // in front of the cottage, flowers in every other tile; none down the middle, where the path and its beds are
    ...meadow(-13, 13, 13, -2.9, 2, "meadow-near").filter((m) => Math.abs(m.at[0]) > 3.5),
    ...meadow(-13, -2.9, -3.2, -16, 3, "meadow-left"), ...meadow(2.9, 13, -3.2, -16, 3, "meadow-right"),   // either side of the cottage and behind it
    { file: "tree", at: [-9.5, -0.05, -12.5], yaw: 0.7, scale: 0.7, name: "jacaranda" },
    { file: "small-tree", at: [6.9, -0.03, -5.4], yaw: 1.9, name: "tree-right" },
    { file: "small-tree", at: [-5.2, -0.03, 0.6], yaw: 4.1, scale: 0.8, name: "tree-left" },
    { file: "small-tree", at: [8.5, -0.03, 2.5], yaw: 0.4, scale: 0.9, name: "tree-near" },
    { file: "watering-can", at: [0.45, 0, -0.3], yaw: 2.2, name: "watering-can" },
    // two planters on the porch, either side of the door
    // (they stand on the porch's floor: the clip check reads the cottage's volumes as reaching 6 cm into them, though no
    // part of the house comes within their box)
    { file: "planter", at: [-1.25, 0.017, -2.78], yaw: 0, name: "planter", overlap: true }, { file: "planter", at: [1.25, 0.017, -2.78], yaw: 0, name: "planter-2", overlap: true },
    // a paved path from where we come in to the porch, a flower bed down each side of it, and beds along the cottage's
    // front (the director, 11-11: "too barren of grass, show me flower beds and garden path dense grass and better horizon detail")
    { file: "path", at: [0, 0.012, 5.0], name: "path", overlap: true },
    ...[10.5, 7.2, 3.9].flatMap((z, i) => [-1, 1].map((sd) => ({ file: "flowerbed", at: [sd * 2.05, 0, z - 1.6] as [number, number, number], yaw: (sd > 0 ? 0 : Math.PI) + 0.12 * (rnd(i, 51) - 0.5) + Math.PI / 2, scale: 0.62, name: `bed-${i}-${sd}`, overlap: true }))),
    ...[-1, 1].map((sd) => ({ file: "flowerbed", at: [sd * 1.95, 0, 0.15] as [number, number, number], yaw: (sd > 0 ? 0.2 : Math.PI - 0.2), scale: 0.4, name: `bed-step-${sd}`, overlap: true })),
    ...[-1, 1].flatMap((sd) => [{ file: "flowerbed", at: [sd * 3.05, 0, -2.42] as [number, number, number], yaw: sd > 0 ? 0.05 : 3.1, scale: 0.36, name: `bed-front-${sd}`, overlap: true }]),
    // a third layer of grass over the middle of the meadow, where the lens is nearest it
    ...meadow(-9, 9, 12, -2.9, 0, "meadow-thick").map((m) => ({ ...m, at: [m.at[0] + 0.9, 0, m.at[2] + 0.7] as [number, number, number], scale: 1.35 })).filter((m) => Math.abs(m.at[0]) > 4.0),
    { file: "bench", at: [-3.4, 0, -1.2], yaw: 1.1, name: "bench" },
    { file: "rocks", at: [4.2, -0.1, -1.4], yaw: 0.6, scale: 0.35, name: "rocks" },
  ];
  for (let i = 0; i < 10; i++) out.push({ file: ["shrub", "shrub-b", "shrub-c"][i % 3], at: [(i % 2 ? 1 : -1) * (2.9 + 0.9 * Math.floor(i / 2) + 0.4 * rnd(i, 41)), -0.02, -3.6 - 0.5 * rnd(i, 42)], yaw: 6.28 * rnd(i, 43), scale: 1.3 + 0.8 * rnd(i, 44), name: `shrub-${i}`, overlap: true });
  // shrubs at the cottage's front corners, under its eaves
  for (const [i, sd] of [-1, 1].entries()) out.push({ file: "shrub-b", at: [sd * 4.35, -0.02, -2.75], yaw: 2.1 * i + 0.4, scale: 1.9, name: `shrub-corner-${sd}`, overlap: true });
  // the wood all round, so the meadow ends in trunks and not at a horizon, and a bank of rock under it
  for (let i = 0; i < 30; i++) {
    const a = 6.283 * (i / 30), r = (i % 2 ? 20 : 26) + 4 * rnd(i, 45);
    out.push({ place: "forest", file: ["fir-a", "fir-b", "fir-c"][i % 3], at: [Math.sin(a) * r, -0.05, -3 - Math.cos(a) * r], yaw: 6.28 * rnd(i, 46), scale: 0.9 + 0.5 * rnd(i, 47), name: `fir-${i}` });
  }
  for (let i = 0; i < 12; i++) { const a = 6.283 * (i / 12); out.push({ file: "rocks", at: [Math.sin(a) * 31, -0.25, -3 - Math.cos(a) * 31], yaw: -a, scale: 1.45, name: `bank-${i}`, overlap: true }); }
  // hills beyond the wood: the mossy rocks again, forty times their size and a long way off, over the firs' tops
  for (let i = 0; i < 9; i++) { const a = -1.9 + 3.8 * (i / 8) + 0.1 * (rnd(i, 61) - 0.5), r = 150 + 50 * rnd(i, 62); out.push({ file: "rocks", at: [Math.sin(a) * r, -6 - 8 * rnd(i, 63), -3 - Math.cos(a) * r], yaw: 6.28 * rnd(i, 64), scale: 26 + 16 * rnd(i, 65), name: `hill-${i}`, overlap: true }); }
  // a second ring of firs inside the first, and saplings along the meadow's edge
  for (let i = 0; i < 22; i++) { const a = 6.283 * ((i + 0.5) / 22), r = 15 + 3 * rnd(i, 66); if (Math.abs(Math.sin(a) * r) < 5 && Math.cos(a) < 0) continue; out.push({ place: "forest", file: ["fir-b", "fir-c", "sapling-a", "sapling-b"][i % 4], at: [Math.sin(a) * r, -0.05, -3 - Math.cos(a) * r], yaw: 6.28 * rnd(i, 67), scale: 0.7 + 0.4 * rnd(i, 68), name: `fir-in-${i}` }); }
  // (each ground piece's half-width: a meadow tile's, turned; a bed's; a shrub's)
  const half = (p: Placed) => (/^meadow/.test(p.file) ? 2.9 : p.file === "flowerbed" ? 2.1 * (p.scale ?? 1) : /^shrub/.test(p.file) ? 0.6 * (p.scale ?? 1) : 0.3);
  return out.filter((p) => !/^(meadow|flowerbed|shrub|rocks)/.test(p.file) || p.name.startsWith("bank-") || p.name.startsWith("hill-") || offCottage(p.at, half(p)));
}
