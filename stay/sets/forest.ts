// The forest road, from scanned things (blender/forest.py, blender/forest-trees.py: Poly Haven's firs, saplings, ferns,
// stumps, rocks, forest floor and asphalt). The road runs down -z through the origin at y 0; the firs stand in loose
// rows either side, nearest the verge the saplings and ferns. The car, its spray and the rain are the old road's own
// rigged pieces (media/models/road), standing on this ground.
import type { Part } from "../parts/library";

export type Placed = Part & { place?: string; overlap?: boolean };
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export const LANE = -1.6;                                    // the car's lane
export function forest(): Placed[] {
  const out: Placed[] = [{ file: "ground", at: [0, 0, -25] }, { file: "road", at: [0, 0.01, -25] }];
  // the firs: three rows a side, thinning away from the road, each turned and scaled a little differently
  let n = 0;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 3; row++) {
      for (let z = 14; z > -68; z -= 7.5 + 3 * row) {
        const i = n++;
        const x = side * (6.8 + row * 7.5 + 3.2 * rnd(i, 1));
        const file = row === 0 && rnd(i, 2) > 0.72 ? "fir-a" : rnd(i, 3) > 0.45 ? "fir-b" : "fir-c";
        out.push({ file, at: [x, -0.05, z + 4 * (rnd(i, 4) - 0.5) - (i === 8 ? 1.8 : 0)], yaw: 6.28 * rnd(i, 5), scale: 0.85 + 0.5 * rnd(i, 6), name: `fir-${i}` });
      }
    }
    // saplings, ferns, grass and the odd stump along the verge
    for (let j = 0; j < 9; j++) {
      const i = 200 + j + (side > 0 ? 50 : 0), z = 10 - j * 8.2 + 3 * (rnd(i, 1) - 0.5);
      out.push({ file: rnd(i, 2) > 0.5 ? "sapling-a" : "sapling-b", at: [side * (5.2 + 2.4 * rnd(i, 3)), -0.05, z], yaw: 6.28 * rnd(i, 4), scale: 0.45 + 0.35 * rnd(i, 5), name: `sapling-${i}` });
      out.push({ file: "fern", at: [side * (4.3 + 1.2 * rnd(i, 6)), -0.03, z + 2.6], yaw: 6.28 * rnd(i, 7), scale: 0.8 + 0.5 * rnd(i, 8), name: `fern-${i}` });
      out.push({ file: "grass", at: [side * (4.1 + 0.6 * rnd(i, 9)), -0.03, z - 2.2], yaw: Math.PI / 2 + 0.3 * (rnd(i, 10) - 0.5), name: `grass-${i}` });
      if (j % 3 === 1) out.push({ file: "stump", at: [side * (5.6 + 1.5 * rnd(i, 11)), -0.04, z + 4.5], yaw: 6.28 * rnd(i, 12), scale: 0.8, name: `stump-${i}` });
      if (j % 4 === 2) out.push({ file: "shrub", at: [side * (7.5 + 2 * rnd(i, 13)), -0.04, z - 4], yaw: 6.28 * rnd(i, 14), scale: 0.5, name: `shrub-${i}` });
    }
    out.push({ file: "rocks", at: [side * 9.5, -0.06, -6 - side * 9], yaw: side * 1.1, scale: 0.6, name: `rocks-${side}` });
    out.push({ file: "trunk", at: [side * 5.4, 0.1, 3 - side * 12], yaw: 1.2 * side, name: `trunk-${side}` });
    out.push({ file: "roots", at: [side * 4.8, -0.02, -14 + side * 3], yaw: 0.4, name: `roots-${side}` });
  }
  // the verges: long grass and ferns, tile after tile down both sides (blender/meadow.py), and shorter meadow behind
  // it under the firs (the director, 11-11: "in all the outfoor forrest, park scenes theres no gradss showing really")
  let v = 0;
  for (const side of [-1, 1]) for (let z = 12; z > -64; z -= 3.8) for (const [col, file, place] of [[0, "verge", "forest"], [1, "verge", "forest"], [2, "meadow", "garden"], [3, "meadow", "garden"]] as const) {
    const i = v++;
    out.push({ place, file, at: [side * (5.9 + 3.8 * col + 0.4 * (rnd(i, 31) - 0.5)), 0, z + 0.6 * (rnd(i, 32) - 0.5)], yaw: (Math.PI / 2) * Math.floor(4 * rnd(i, 33)), name: `verge-${i}`, overlap: true } as Placed);
  }
  // the old road's rigged pieces on this ground: the car down its lane, the spray at its wheels, the rain
  out.push({ place: "road", file: "car", at: [LANE, -0.01, -9.36], clip: "drive", name: "car" });
  out.push({ place: "road", file: "spray", at: [LANE + 0.755, -0.02, -2.0], clip: "burst", name: "spray" });
  out.push({ place: "road", file: "spray", at: [LANE - 0.755, -0.03, -2.0], clip: "burst", name: "spray-2" });
  out.push({ place: "road", file: "rain", at: [0.5, 0, 1], clip: "fall", name: "rain" });
  return out;
}
