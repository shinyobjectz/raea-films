// The city graybox's skyline: every landmark of the Friedrichstadt and the city sheets (landmarks.geojson, landmarks.ts)
// as one mesh, drawn by the world lane's skyline() (tools/world/landmarks.ts: its shapes and ASSUMED widths, used as
// they are), so a spire 5 km off still stands in the city's silhouette. The graybox tiles (graybox.ts) carry no towers.
// Each landmark comes once: the sheet whose frame holds its point (landmarks.ts keeps rows by frame).
//   bun skyline.ts   in: map/1917/landmarks.geojson, map/1917/sheets/*/landmarks.geojson and their buildings.geojson
//                    out: assets/graybox/city/skyline.glb
import { skyline } from "../world/landmarks";
import { writeGlb } from "../world/glb";

const root = `${import.meta.dir}/../..`;
const dirs = [`${root}/map/1917`, ...[...new Bun.Glob("*/landmarks.geojson").scanSync(`${root}/map/1917/sheets`)].map((p) => `${root}/map/1917/sheets/${p.split("/")[0]}`)];
const landmarks: any[] = [], rings = new Map<string, [number, number][]>();
for (const d of dirs) {
  const lm = (await Bun.file(`${d}/landmarks.geojson`).json()).features as any[];
  const keys = new Set(lm.map((f) => f.properties.building));
  for (const f of (await Bun.file(`${d}/buildings.geojson`).json()).features)
    if (keys.has(f.properties.key)) rings.set(f.properties.key, f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]);
  landmarks.push(...lm);
}
// A row in both the slice's frame and a sheet's (the slice lies inside the sheets' grid) would come twice: by name.
const seen = new Set<string>(), once = landmarks.filter((f) => !seen.has(f.properties.name + f.geometry.coordinates.join()) && seen.add(f.properties.name + f.geometry.coordinates.join()));
const sky = skyline(once, rings, [-Infinity, -Infinity, Infinity, Infinity]);
const part = sky.F.part();
if (!part) throw new Error("skyline: nothing built");
await Bun.write(`${root}/assets/graybox/city/skyline.glb`, writeGlb([{ name: "skyline", parts: [part] }], [{ name: "skyline", color: [1, 1, 1, 1], roughness: 0.85 }]));
console.log(`skyline: ${sky.built.length} built from ${dirs.length} map dirs, ${part.indices.length / 3} tris; left out: ${sky.left.join(", ") || "none"}`);
