// Today's measured 3D buildings (Berlin LoD2, CityGML, dl-de/zero-2.0: ALKIS footprints, laser-measured roofs fitted
// with standard roof shapes) reduced to one row per solid: a building without parts, or each part of one (a church's
// tower is its own part). Each row: the building's ALKIS id, roof type, its ground (lowest point of its floor), eaves
// (lowest roof point) and top (highest), all m above NHN, and its footprint. Used for what still stands as it stood
// in 1917 (landmarks.ts); it is today's city, so never for anything changed since.
//   in:  cache/lod2/LoD2_<x>_<y>.zip (1 km tiles, fetched by lod2fetch in fetch.sh or by hand)
//   out: cache/lod2/units.json
//   bun lod2.ts
import { readdirSync } from "node:fs";

const dir = `${import.meta.dir}/../../cache/lod2`;
type Unit = { b: string; part: boolean; roof: string; h: number; ground: number; eaves: number; top: number; rings: number[][][] };
const units: Unit[] = [];
const nums = (s: string) => s.trim().split(/\s+/).map(Number);
for (const zip of readdirSync(dir).filter((f) => /^LoD2_\d+_\d+\.zip$/.test(f)).sort()) {
  const xml = (await Bun.$`unzip -p ${dir}/${zip}`.quiet()).stdout.toString();
  // Chunks from each Building or BuildingPart tag to the next: a part's surfaces lie inside its own chunk.
  const marks = [...xml.matchAll(/<bldg:(Building|BuildingPart) gml:id="([^"]+)"/g)];
  let building = "";
  marks.forEach((m, k) => {
    const chunk = xml.slice(m.index!, k + 1 < marks.length ? marks[k + 1].index : xml.length);
    if (m[1] === "Building") building = m[2];
    const surf = (kind: string) => [...chunk.matchAll(new RegExp(`<bldg:${kind}[\\s\\S]*?</bldg:${kind}>`, "g"))].flatMap((s) => [...s[0].matchAll(/<gml:posList[^>]*>([^<]+)</g)].map((p) => nums(p[1])));
    const ground = surf("GroundSurface"), roofs = surf("RoofSurface");
    if (!ground.length || !roofs.length) return;
    const zs = (ls: number[][]) => ls.flatMap((l) => l.filter((_, i) => i % 3 === 2));
    const gz = zs(ground), rz = zs(roofs);
    units.push({
      b: building, part: m[1] === "BuildingPart",
      roof: chunk.match(/<bldg:roofType>(\d+)</)?.[1] ?? "", h: +(chunk.match(/<bldg:measuredHeight[^>]*>([\d.]+)</)?.[1] ?? NaN),
      ground: +Math.min(...gz).toFixed(2), eaves: +Math.min(...rz).toFixed(2), top: +Math.max(...rz).toFixed(2),
      rings: ground.map((l) => { const r: number[][] = []; for (let i = 0; i < l.length; i += 3) r.push([+l[i].toFixed(2), +l[i + 1].toFixed(2)]); return r; }),
    });
  });
  console.error(`${zip}: ${units.length} solids so far`);
}
await Bun.write(`${dir}/units.json`, JSON.stringify(units));
console.log(`lod2: ${units.length} solids (${units.filter((u) => u.part).length} building parts) from ${new Set(units.map((u) => u.b)).size} buildings`);
