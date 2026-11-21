// Views across the street onto the largest commercial houses (kind "commercial" in map/1917/buildings.geojson) for
// compositions/world-commercial.tsx, aimed by the bake's own records: the first-floor panes of the house's front with
// the most of them (windows.json: centre, outward normal) and its doors for the street's level (tile.json).
//   run: bun tools/world/commercial-views.ts [count=6]   (after a bake)   out: compositions/commercial-views.json
import { Glob } from "bun";

const root = `${import.meta.dir}/../..`;
const COUNT = Number(process.argv[2] ?? 6);
const geo = await Bun.file(`${root}/map/1917/buildings.geojson`).json();
const com = new Map<string, { name: string | null; area: number }>();
for (const f of geo.features) if (f.properties.kind === "commercial") com.set(f.properties.key, { name: f.properties.name ?? null, area: f.properties.area_m2 ?? 0 });

type Pane = { building: string; edge: number; floor: number; kind: string; center: number[]; normal: number[] };
const fronts = new Map<string, Pane[]>(); // building|edge -> its first-floor room panes
const doorY = new Map<string, number>();
const doorEdges = new Set<string>(); // building|edge with a door: a street front (doors are only built on fronts)
const slice = `${root}/assets/world/friedrichstadt`;
for await (const path of new Glob("*/windows.json").scan(slice)) {
  const { panes } = (await Bun.file(`${slice}/${path}`).json()) as { panes: Pane[] };
  for (const p of panes) {
    const key = p.building.replace(/-p\d+$/, "");
    if (!com.has(key) || p.floor !== 1 || p.kind !== "room") continue;
    const k = `${p.building}|${p.edge}`;
    fronts.set(k, [...(fronts.get(k) ?? []), p]);
  }
  const tile = await Bun.file(`${slice}/${path.replace("windows.json", "tile.json")}`).json();
  for (const d of tile.doors as { id: string; building: string; pos: number[] }[]) {
    const e = /-e(\d+)-d/.exec(d.id);
    if (e) doorEdges.add(`${d.building}|${e[1]}`);
    const y = doorY.get(d.building);
    doorY.set(d.building, y === undefined ? d.pos[1] : Math.min(y, d.pos[1]));
  }
}

// each house's front with the most panes, the houses largest first
const best = new Map<string, Pane[]>();
for (const [k, ps] of fronts) {
  if (!doorEdges.has(k)) continue; // a court wall's windows, not the street front
  const b = k.split("|")[0];
  if ((best.get(b)?.length ?? 0) < ps.length) best.set(b, ps);
}
const mean = (ps: Pane[], f: (p: Pane) => number[]) => [0, 1, 2].map((i) => ps.reduce((s, p) => s + f(p)[i], 0) / ps.length);
const views = [...best.entries()]
  .filter(([, ps]) => ps.length >= 3)
  .sort((a, b) => (com.get(b[0].replace(/-p\d+$/, ""))!.area - com.get(a[0].replace(/-p\d+$/, ""))!.area))
  .slice(0, COUNT)
  .map(([b, ps]) => {
    const c = mean(ps, (p) => p.center), n0 = mean(ps, (p) => p.normal), nl = Math.hypot(n0[0], n0[2]) || 1;
    const n = [n0[0] / nl, 0, n0[2] / nl];
    const street = (doorY.get(b) ?? c[1] - 6.5) - 0.5;
    const r2 = (x: number) => Math.round(x * 100) / 100;
    return {
      key: b,
      name: com.get(b.replace(/-p\d+$/, ""))!.name,
      panes: ps.length,
      // 12 m out: the far side of a narrow street; further and the eye can stand inside the house opposite
      eye: [c[0] + n[0] * 12, street + 1.7, c[2] + n[2] * 12].map(r2),
      at: [c[0], c[1] + 2.5, c[2]].map(r2),
    };
  });
await Bun.write(`${root}/compositions/commercial-views.json`, JSON.stringify(views, null, 1));
console.log(`${views.length} views of ${com.size} commercial houses (${best.size} with a recorded front):`);
for (const v of views) console.log(`  ${v.key} ${v.name ?? ""} ${v.panes} panes`);
