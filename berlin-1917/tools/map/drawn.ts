// Public or commercial, as the Straube plan draws it. The plan has three building greys (Landesarchiv's notes to the
// Geoportal layer, gdi.berlin.de/data/straubeplan/docs/straubeplan.pdf): dark grey for state and municipal buildings,
// mid grey for commercial private buildings, light grey for housing. On the scan the mid grey is a hatching of lines on
// pale paper (Circus Busch, the Metropol-Theater, the Römischer Hof, the Urania, the electricity works), while the dark
// grey is a solid fill (the ministries, churches, museums, Markthalle III). "Berlin um 1900" files both under
// "öffentliche Gebäude", and the reader learned that, so both arrive here as public.
// Inside each public building, at least EDGE m in from its outline, the share of pixels as pale as paper (luminance at
// least PALE) tells them apart: on 11-17, 841 of 1,187 had under 5% and the named state buildings all under 7%, while
// the named commercial ones had 26-46%, with few between. At HATCH or more a building becomes kind "commercial" (to the
// world and the graybox, a private building: storeys by the private rule unless measured). The 19 pieces over 60% were
// judged by eye on 11-17 against the scan and the 1928 photo: nine are not buildings (courtyards, a garden, a planned
// line), which build.sh drops (not-built.tsv); three are plain housing (kind "private") and three halls take the plan's
// lettering as their name (drawn-fixes.tsv, applied here).
// out: buildings.geojson in place: kind, drawn_pale (null where too small to measure), storeys where from the rule.
//   bun drawn.ts [SLICE.json] [--tsv]   --tsv prints one row per measured building and changes nothing
import { offsetField } from "./offsetfield";
import { slicePaths } from "./paths";
import { fill, polygons, readRGB, tiles, type Tile } from "./raster";
import { chamfer } from "./thin";

const args = process.argv.slice(2), tsv = args.includes("--tsv");
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { cache, map, align } = await slicePaths(slicePath);
const EDGE = 1.0, PALE = 200, HATCH = 0.25, MIN_PX = 40, STOREYS = { public: 4, commercial: 5, private: 5 };
const offset = await offsetField(align); // trace.sh took this off: map = plan - offset

const file = `${map}/buildings.geojson`, fc = await Bun.file(file).json();
// Buildings put up after the plan (source alkis-newer, build.sh) are not on it to measure.
const feats = fc.features.filter((f: any) => (f.properties.kind === "public" || f.properties.kind === "commercial") && f.properties.source !== "alkis-newer");
const pale = new Map<number, { pale: number; px: number }>();
for (const t of await tiles(slicePath, 0.25)) {
  const here = feats.filter((f: any) => {
    const r = polygons(f.geometry)[0][0], cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length;
    return cx >= t.x0 && cx < t.x1 && cy >= t.y0 && cy < t.y1;
  });
  const plan = `${cache}/rasters/straube/${t.id}.png`;
  if (!here.length || !(await Bun.file(plan).exists())) continue;
  const { w, h, px } = await readRGB(plan, 2000, 2000);
  // A map point x lies on the plan's pixel (x + dx - x0) / mpp, so the tile is laid down shifted by -offset (its centre's).
  const [dx, dy] = offset(t.x0 + 250, t.y0 + 250);
  const shifted: Tile = { ...t, x0: t.x0 - dx, x1: t.x1 - dx, y0: t.y0 - dy, y1: t.y1 - dy };
  const lab = new Int32Array(w * h);
  here.forEach((f: any, k: number) => fill(lab, shifted, polygons(f.geometry), k + 1));
  const inside = chamfer(w, h, (i) => lab[i] === 0);
  const n = new Float64Array(here.length + 1), light = new Float64Array(here.length + 1);
  for (let i = 0; i < w * h; i++) {
    const k = lab[i];
    if (!k || inside[i] * t.mpp < EDGE) continue;
    n[k]++;
    if (0.299 * px[i * 3] + 0.587 * px[i * 3 + 1] + 0.114 * px[i * 3 + 2] >= PALE) light[k]++;
  }
  here.forEach((f: any, k: number) => { if (n[k + 1] >= MIN_PX) pale.set(f.properties.id, { pale: +(light[k + 1] / n[k + 1]).toFixed(3), px: n[k + 1] }); });
}

if (tsv) {
  console.log("id\tpale\tpx\tsource\tarea_m2\tuse\tpublic_1910\tname");
  for (const f of feats) {
    const p = f.properties, d = pale.get(p.id);
    if (d) console.log([p.id, d.pale, d.px, p.source, Math.round(p.area_m2), p.use, p.public_1910, p.name ?? ""].join("\t"));
  }
  process.exit(0);
}
type Kind = "public" | "commercial" | "private";
for (const f of feats) {
  const p = f.properties, d = pale.get(p.id);
  p.drawn_pale = d ? d.pale : null;
  if (d) p.kind = d.pale >= HATCH ? "commercial" : "public";
}
// By eye (drawn-fixes.tsv): any building, of any kind, that holds a row's point takes its kind, and its name when it
// has none.
const fixes = (await Bun.file(`${import.meta.dir}/drawn-fixes.tsv`).text()).split("\n").filter((l) => l && !l.startsWith("#") && !l.startsWith("x\t"))
  .map((l) => { const [x, y, kind, name] = l.split("\t"); return { x: +x, y: +y, kind: kind as Kind, name: name?.trim() }; });
const inside = (rs: number[][][], x: number, y: number) => { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const measured = new Set(feats), count: Record<Kind, number[]> = { public: [0, 0], commercial: [0, 0], private: [0, 0] };
let fixed = 0;
for (const f of fc.features) {
  const p = f.properties, h = fixes.find((h) => polygons(f.geometry).some((r) => inside(r, h.x, h.y)));
  if (h) (p.kind = h.kind), fixed++;
  if (h?.name && !p.name) (p.name = h.name), (p.name_from = "plan lettering");
  if ((h || measured.has(f)) && p.storeys_from === "rule") p.storeys = STOREYS[p.kind as Kind];
  if (h || measured.has(f)) count[p.kind as Kind][0]++, (count[p.kind as Kind][1] += p.area_m2);
}
const head = (await Bun.file(file).text()).split('"features"')[0]; // one feature a line, as build.sh and use1910.ts write it
await Bun.write(file, `${head}"features": [\n${fc.features.map((f: any) => JSON.stringify(f)).join(",\n")}\n]\n}\n`);
const km2 = (m2: number) => (m2 / 1e6).toFixed(2);
console.log(`drawn: ${pale.size} of ${feats.length} public buildings measured; public (dark grey) ${count.public[0]}, ${km2(count.public[1])} km2; commercial (hatched) ${count.commercial[0]}, ${km2(count.commercial[1])} km2; ${fixed} set by eye (drawn-fixes.tsv), ${count.private[0]} now housing`);
