// The Stadtbahn in the city graybox: the slice's and every sheet's stadtbahn.geojson (tools/map/stadtbahn.ts, each
// clipped to its own frame) drawn by the world lane's stadtbahn() (tools/world/stadtbahn.ts: the brick viaduct on its
// arches, the girder bridges and Friedrichstrasse's hall, its figures cited there and in the layer) as one mesh over
// the tiles, on each sheet's 1917 ground. The graybox tiles (graybox.ts) carry no viaduct.
//   bun stadtbahn-city.ts   out: assets/graybox/city/stadtbahn.glb
import { stadtbahn } from "../world/stadtbahn";
import { writeGlb, type Material } from "../world/glb";
import { loadGround } from "./groundgrid";
import { slicePaths } from "./paths";

const root = `${import.meta.dir}/../..`;
const sheets = [`${import.meta.dir}/slice.json`, ...[...new Bun.Glob("*.json").scanSync(`${import.meta.dir}/sheets`)].map((f) => `${import.meta.dir}/sheets/${f}`)];
const parts: NonNullable<ReturnType<ReturnType<typeof stadtbahn>["F"]["part"]>>[] = [];
const logs: string[] = [];
for (const path of sheets) {
  const { slice, map, own } = await slicePaths(path);
  const f = Bun.file(`${map}/stadtbahn.geojson`);
  if (!(await f.exists())) continue;
  const ground = await loadGround(map, own);
  const r = stadtbahn((await f.json()).features, slice.bbox, ground);
  for (const p of [r.F.part(), r.G.part()]) if (p) parts.push(p);
  logs.push(`${slice.name}: ${r.log}`);
}
if (!parts.length) throw new Error("stadtbahn-city: nothing built");
const MATS: Material[] = [
  { name: "facade", color: [1, 1, 1, 1], roughness: 0.85 },
  { name: "glass", color: [1, 1, 1, 1], roughness: 0.08 },
];
await Bun.write(`${root}/assets/graybox/city/stadtbahn.glb`, writeGlb([{ name: "stadtbahn", parts }], MATS));
console.log(logs.join("\n"));
console.log(`stadtbahn-city: ${logs.length} frames, ${parts.reduce((n, p) => n + p.indices.length / 3, 0)} tris`);
