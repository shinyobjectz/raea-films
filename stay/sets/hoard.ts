// A hoarder's room (the director, 11-11, on the kid's bedroom: "its a hoarder. piles of junk and trash" and "lets have this
// one be the room clutter right now its too barren"). Heaps of the film's own scanned things, from every room's
// library: boxes, crates, pots, bottles, books, baskets, toys, in mounds on the floor, along the walls, on the bed and
// the desk. Each mound is a centre and a spread; a thing nearer the middle of its mound stands higher. They are meant
// to lie through one another (`overlap`).
import type { Item } from "../v3/scene";
type V3 = [number, number, number];
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const JUNK: [string, string, number][] = [
  ["cellar", "crate", 0.7], ["cellar", "crate-b", 0.6], ["cellar", "basket", 1], ["cellar", "bucket", 0.7], ["cellar", "gallon", 1], ["cellar", "jug", 1], ["cellar", "bottles", 0.8], ["cellar", "chest", 0.6],
  ["kitchen", "pot", 1], ["kitchen", "pan", 1], ["kitchen", "kettle", 1], ["kitchen", "bowl", 1], ["kitchen", "enamel-pot", 1], ["kitchen", "cutting-board", 1], ["kitchen", "microwave", 0.5], ["kitchen", "bottles", 0.8],
  ["workshop", "crate", 0.7], ["workshop", "propane", 0.8], ["workshop", "spray-paint", 1], ["workshop", "bin", 0.35], ["workshop", "stool", 0.9],
  ["living", "boombox", 0.7], ["living", "chess", 0.7], ["living", "frame", 1], ["living", "television", 0.9], ["living", "ottoman", 0.7],
  ["study", "encyclopedia", 1], ["study", "vase", 0.8], ["study", "laptop", 0.6], ["study", "projector", 1], ["study", "microscope", 0.7], ["study", "mantel-clock", 1],
  ["greenhouse", "clay-pot", 1], ["greenhouse", "boots", 0.8], ["greenhouse", "watering-can", 1], ["greenhouse", "tray", 1], ["greenhouse", "basket", 1], ["greenhouse", "bucket", 0.8],
  ["dining", "goblets", 0.8], ["dining", "plate", 1], ["dining", "lantern", 1], ["dining", "vase", 0.8],
  ["kidsroom", "football", 1], ["kidsroom", "books", 1], ["kidsroom", "duck", 0.8], ["kidsroom", "console", 0.9], ["kidsroom", "gamepad", 1], ["kidsroom", "boombox", 0.7], ["kidsroom", "toy-chest", 0.6],
];
/** mounds: [x, z, floor height, spread, how many, peak height] */
const MOUNDS: [number, number, number, number, number, number][] = [
  [0.2, 0.9, 0, 0.75, 34, 0.75], [1.0, -0.3, 0, 0.6, 26, 0.6], [-0.3, -1.5, 0, 0.55, 22, 0.5], [1.5, 1.6, 0, 0.6, 24, 0.9], [0.4, 2.3, 0, 0.7, 26, 0.7],
  [-1.5, -1.3, 0.62, 0.55, 22, 0.45],        // on the bed
  [1.75, -1.7, 0.9, 0.3, 10, 0.3],           // on the desk
  [-1.8, 1.7, 0.62, 0.35, 10, 0.4],          // on the toy chest
  [1.2, -2.5, 1.1, 0.5, 12, 0.35],           // on the drawers
  [-0.9, 0.2, 0, 0.5, 18, 0.45], [2.0, 0.6, 0, 0.3, 12, 0.8],
];
export function hoard(): Item[] {
  const out: Item[] = [];
  let n = 0;
  for (const [mi, [mx, mz, y0, spread, count, peak]] of MOUNDS.entries()) {
    for (let j = 0; j < count; j++) {
      const i = n++, a = 6.283 * rnd(i, 1), r = spread * Math.sqrt(rnd(i, 2)), [place, file, k] = JUNK[Math.floor(rnd(i, 3) * JUNK.length)];
      const x = Math.max(-2.0, Math.min(2.0, mx + Math.cos(a) * r)), z = Math.max(-2.8, Math.min(2.9, mz + Math.sin(a) * r));
      const up = y0 + peak * Math.max(0, 1 - r / spread) ** 1.3 * (0.35 + 0.65 * rnd(i, 4));
      out.push({ place, file, name: `junk-${mi}-${j}`, at: [x, up, z] as V3, rot: [(rnd(i, 5) - 0.5) * 1.6, 6.283 * rnd(i, 6), (rnd(i, 7) - 0.5) * 1.6] as V3, scale: k * (0.8 + 0.4 * rnd(i, 8)), overlap: true });
    }
  }
  return out;
}
