// Heights: storeys from the monuments' own entries, and the building code's cap on each front's eaves.
// Storeys: a listed building that stood in 1917 and whose entry states its storeys ("viergeschossig", denkmale.ts),
// covering at least half of one of our buildings, gives it those storeys (storeys_from "denkmal"), over today's
// survey too: where both are known (54 on 11-17) they agree on 20, and the entry is lower on most of the rest, as
// ALKIS counts storeys added since. Left out, as the entry's first "-geschossig" may not be this building's: an
// entry that records storeys added or a rebuilding; one dated after 1917 anywhere (the 1926-28 hall of the
// Buchhaendlerhof substation); a group listed as one (more than GROUP of our buildings at half or more: the Charite's
// "Gesamtanlage" would make every ward one storey); one storey (a gymnasium or a hall beside the school the entry is
// about) or more than six (over the 1887 code's five, so the entry counts an attic or a later floor). Berlin's Baupolizeiordnung of
// 1853, as amended on 12.3.1860, held a front to the width of its street; the code of 15.1.1887 (kept in 1897) let a
// front always rise 12 m and never above 22 m, measured from the pavement to the top of the main cornice, and allowed
// no more than five storeys for people to live or work in (schadenprisma 2/80, quoting the 1887 text, part I para. 3;
// Abgeordnetenhaus Berlin, Drucksache 18/1597 A). So a front on a street W m wide had at most min(22, max(12, W)) m.
// The street's width is read off our street centrelines (skeleton.ts: each point carries the street's half-width, its
// distance to the nearest building, park or water): from each sample every metre along a front that faces street
// ground (open.geojson), the centreline point ahead of it (within 60 degrees of its outward normal) whose half-width
// best matches its distance from the front, within TOL m; the width there is twice the half-width. A front's width is
// the median of its samples, and a building on a corner takes its widest street among its fronts at least a third as
// long as its longest (its main front). Passages and gaps between houses are not on the centrelines (skeleton.ts
// prunes spurs under 25 m), so a house is not held down by the gap beside it. A front with no centreline in reach
// (a lane too short to keep, a square's middle) is left to the rule.
// It is a cap, not a height, and storeys are not taken from it: on 11-17 the 299 buildings that still stand (ALKIS
// storeys today) averaged 4.7 storeys on streets under 15 m, 4.9 on 15-19 m, 5.2 on 19-22 m and 5.7 wider, so the
// cap pulls the right way, but under 15 m ten of fourteen have four or more storeys, more than 12-15 m of front holds
// at the period's 3.5 m a storey (older houses, exemptions, attics converted since). Rear buildings get null.
// The 1928 photographs were tried first for heights (shadows.ts) and do not resolve storeys.
// A house (private or commercial) given more than five storeys by today's survey is held at five (storeys_from "rule",
// storeys_was keeping today's count): the code allowed five, so the rest is an attic converted or a floor added since.
// out: buildings.geojson in place: street_m (null where no street centreline is in reach), eaves_max_m; storeys and
// storeys_from where a monument gives them or the five-storey hold applies.
//   bun heights.ts [SLICE.json] [--tsv]   --tsv prints street widths per building and changes nothing
import { slicePaths } from "./paths";
import { fill, polygons, tiles, type Tile } from "./raster";

const args = process.argv.slice(2), tsv = args.includes("--tsv");
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const { map, own: cache } = await slicePaths(slicePath); // a sheet's own cache: skeleton.ts writes streets.json there
const MPP = 0.5, REACH = 60, STEP = 1, M = 4, TOL = 3, CELL = 25, FIVE = 5;
// Centreline points every 2 m with their half-widths, in a CELL m grid.
const skel = (await Bun.file(`${cache}/streets.json`).json()).edges as { pts: number[][] }[];
const grid = new Map<string, number[][]>();
for (const e of skel) for (let i = 0; i + 1 < e.pts.length; i++) {
  const [ax, ay, ah] = e.pts[i], [bx, by, bh] = e.pts[i + 1], L = Math.hypot(bx - ax, by - ay);
  for (let d = 0; d <= L; d += 2) {
    const t = L ? d / L : 0, p = [ax + (bx - ax) * t, ay + (by - ay) * t, ah + (bh - ah) * t], k = `${Math.floor(p[0] / CELL)},${Math.floor(p[1] / CELL)}`;
    grid.set(k, [...(grid.get(k) ?? []), p]);
  }
}
/** The street's width ahead of a front sample at (x, y) facing (nx, ny), or -1. */
function widthAt(x: number, y: number, nx: number, ny: number) {
  let best = -1, err = TOL;
  const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL), R = Math.ceil(REACH / CELL);
  for (let j = gy - R; j <= gy + R; j++) for (let i = gx - R; i <= gx + R; i++)
    for (const [px, py, hw] of grid.get(`${i},${j}`) ?? []) {
      const dx = px - x, dy = py - y, d = Math.hypot(dx, dy);
      if (d > REACH || d < 0.5 || (dx * nx + dy * ny) / d < 0.5) continue;
      if (Math.abs(d - hw) < err) (err = Math.abs(d - hw)), (best = 2 * hw);
    }
  return best;
}

const file = `${map}/buildings.geojson`, fc = await Bun.file(file).json();
const blds = fc.features as any[];
// Run again, it first puts back what it changed (storeys_was), so it can be rerun without rebuilding.
for (const f of blds) if (f.properties.storeys_was) { Object.assign(f.properties, f.properties.storeys_was); delete f.properties.storeys_was; delete f.properties.denkmal; }
const open = (await Bun.file(`${map}/open.geojson`).json()).features as any[];
const bbox = (g: any) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polygons(g)) for (const r of p) for (const [x, y] of r) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  return [x0, y0, x1, y1];
};
const bb = blds.map((f) => bbox(f.geometry)), ob = open.map((f) => bbox(f.geometry));
const near = (b: number[], t: Tile) => b[2] >= t.x0 && b[0] <= t.x1 && b[3] >= t.y0 && b[1] <= t.y1;
const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1];

/** Per building: the median width of each of its street fronts (an edge of 3 m or more with rays). */
const fronts = new Map<number, { w: number; len: number }[]>();
const GROUP = 3;
// a city sheet has no monuments read yet (denkmale.sh covers friedrichstadt): the building code and ALKIS only
const denk = Bun.file(`${map}/denkmale.geojson`);
const monuments = ((await denk.exists() ? await denk.json() : { features: [] }).features as any[]).filter((m) => m.properties.storeys >= 2 && m.properties.storeys <= 6
  && String(m.properties.stood_1917).startsWith("built by 1917") && !m.properties.after.some((a: string) => a === "storeys added" || a === "rebuilt")
  && !(String(m.properties.dated ?? "").match(/\b(19[2-9]\d|19[1-9][8-9]|20\d\d)\b/) ?? []).some((y) => +y > 1917));
const mb = monuments.map((m) => bbox(m.geometry)), marea = mb.map((b) => (b[2] - b[0]) * (b[3] - b[1]));
const byMonument = new Map<number, { m: number; share: number }>(); // building -> the monument covering most of it
for (const t of await tiles(slicePath, MPP)) {
  const big: Tile = { id: t.id, x0: t.x0 - M, y0: t.y0 - M, x1: t.x1 + M, y1: t.y1 + M, mpp: MPP };
  const W = Math.round((big.x1 - big.x0) / MPP), H = Math.round((big.y1 - big.y0) / MPP);
  const lab = new Int32Array(W * H), street = new Uint8Array(W * H);
  open.forEach((f, k) => { if (f.properties.kind === "street" && near(ob[k], big)) fill(street, big, polygons(f.geometry), 1); });
  const here = blds.map((_, k) => k).filter((k) => near(bb[k], big));
  for (const k of here) fill(lab, big, polygons(blds[k].geometry), k + 1);
  // Monuments, larger first so a single house inside a larger listed group keeps its own entry.
  const mon = new Int32Array(W * H);
  monuments.map((_, m) => m).filter((m) => near(mb[m], big)).sort((a, b) => marea[b] - marea[a]).forEach((m) => fill(mon, big, polygons(monuments[m].geometry), m + 1));
  const cnt = new Map<number, Map<number, number>>(), tot = new Map<number, number>();
  for (let i = 0; i < W * H; i++) {
    const k = lab[i] - 1;
    if (k < 0) continue;
    tot.set(k, (tot.get(k) ?? 0) + 1);
    if (!mon[i]) continue;
    const c = cnt.get(k) ?? new Map<number, number>();
    c.set(mon[i] - 1, (c.get(mon[i] - 1) ?? 0) + 1);
    cnt.set(k, c);
  }
  for (const [k, c] of cnt) {
    const [x0, y0, x1, y1] = bb[k], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (cx < t.x0 || cx >= t.x1 || cy < t.y0 || cy >= t.y1) continue;
    const [m, n] = [...c].sort((a, b) => b[1] - a[1])[0], share = n / tot.get(k)!;
    if (share >= 0.5) byMonument.set(k, { m, share });
  }
  const at = (x: number, y: number) => {
    const i = Math.floor((x - big.x0) / MPP), j = Math.floor((big.y1 - y) / MPP);
    return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i;
  };
  for (const k of here) {
    const [x0, y0, x1, y1] = bb[k], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (cx < t.x0 || cx >= t.x1 || cy < t.y0 || cy >= t.y1) continue;
    for (const p of polygons(blds[k].geometry)) for (const r of p) for (let i = 0; i + 1 < r.length; i++) {
      const [ax, ay] = r[i], [bx, by] = r[i + 1], L = Math.hypot(bx - ax, by - ay);
      if (L < 3) continue;
      let nx = (by - ay) / L, ny = -(bx - ax) / L;
      if (lab[at((ax + bx) / 2 + nx * 0.6, (ay + by) / 2 + ny * 0.6)] === k + 1) (nx = -nx), (ny = -ny);
      const ws: number[] = [];
      for (let s = 1; s <= L - 1; s += STEP) {
        const x = ax + ((bx - ax) * s) / L, y = ay + ((by - ay) * s) / L, o = at(x + nx, y + ny);
        if (o < 0 || lab[o] || !street[o]) continue; // not on a street: a party wall, a courtyard, a park
        const w = widthAt(x, y, nx, ny);
        if (w > 0) ws.push(w);
      }
      if (ws.length < 2) continue;
      const list = fronts.get(k) ?? [];
      list.push({ w: median(ws), len: L });
      fronts.set(k, list);
    }
  }
}

// A building's street: its widest front among those at least a third as long as its longest street front.
type Row = { k: number; street: number | null; eaves: number | null };
const rows: Row[] = blds.map((_, k) => {
  const fs = fronts.get(k);
  if (!fs?.length) return { k, street: null, eaves: null };
  const longest = Math.max(...fs.map((q) => q.len)), main = fs.filter((q) => q.len >= longest / 3).sort((a, b) => b.w - a.w)[0];
  const eaves = Math.min(22, Math.max(12, main.w));
  return { k, street: +main.w.toFixed(1), eaves };
});

if (tsv) {
  console.log("key\tkind\tsource\tstoreys_from\tstoreys\tstreet_m\teaves_max_m\tuse");
  for (const r of rows) { const p = blds[r.k].properties; console.log([p.key, p.kind, p.source, p.storeys_from, p.storeys, r.street ?? "", r.eaves ?? "", p.use ?? ""].join("\t")); }
  process.exit(0);
}
for (const r of rows) (blds[r.k].properties.street_m = r.street), (blds[r.k].properties.eaves_max_m = r.eaves);
const changed = new Map<string, number>(), covers = new Map<number, number>();
for (const { m } of byMonument.values()) covers.set(m, (covers.get(m) ?? 0) + 1);
for (const [k, { m }] of byMonument) if ((covers.get(m) ?? 0) > GROUP) byMonument.delete(k);
for (const [k, { m }] of byMonument) {
  const p = blds[k].properties, n = monuments[m].properties.storeys;
  changed.set(`${p.storeys_from} ${p.storeys} -> ${n}`, (changed.get(`${p.storeys_from} ${p.storeys} -> ${n}`) ?? 0) + 1);
  p.storeys_was = { storeys: p.storeys, storeys_from: p.storeys_from };
  (p.storeys = n), (p.storeys_from = "denkmal"), (p.denkmal = monuments[m].properties.id);
}
// A house (private or commercial) with more than the 1887 code's five storeys from today's survey: the rest is an attic
// converted or a floor added since (Berlin's roofs have been built out since 1990), so it is held at five, the rule.
let held = 0;
for (const f of blds) {
  const p = f.properties;
  if (p.storeys_from !== "alkis" || !(p.storeys > FIVE) || p.kind === "public") continue;
  p.storeys_was = { storeys: p.storeys, storeys_from: p.storeys_from };
  (p.storeys = FIVE), (p.storeys_from = "rule"), held++;
}
// Pumpstation III's buildings (source hobrecht-blatt16, put in by build.sh) take the plate's storeys and heights
// (station3.ts: eaves_m and top_m read off Blatt 16's 1:250 elevation; a part the plate gives no height is one storey,
// ASSUMED, or as the corner house where its note says so). Matched by the part whose outline holds the building's
// mean corner (build.sh puts the plate's outlines in whole, so each building is one part).
const st3 = Bun.file(`${map}/station_iii.geojson`);
let fromPlate = 0;
if (await st3.exists()) {
  const parts = ((await st3.json()).features as any[]).filter((s) => ["building", "chimney"].includes(s.properties.kind));
  const inRing = (r: number[][], x: number, y: number) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
  const mid = (r: number[][]) => r.slice(0, -1).reduce((s, p, _, a) => [s[0] + p[0] / a.length, s[1] + p[1] / a.length], [0, 0]);
  for (const f of blds) {
    if (f.properties.source !== "hobrecht-blatt16") continue;
    const ring = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    const [x, y] = mid(ring), s = parts.find((s) => inRing(s.geometry.coordinates[0], x, y));
    if (!s) throw new Error(`heights: a hobrecht-blatt16 building at ${x.toFixed(1)} ${y.toFixed(1)} is in no part of station_iii.geojson`);
    const q = s.properties, p = f.properties;
    p.storeys_was = { storeys: p.storeys, storeys_from: p.storeys_from };
    const like = /as the corner house/.test(q.note ?? "") ? parts.find((o) => o.properties.part.startsWith("Wohnhaus an der"))?.properties.storeys : null;
    (p.storeys = q.storeys ?? like ?? 1), (p.storeys_from = q.storeys ? "hobrecht-blatt16" : "assumed"), (p.name = `Pumpwerk III: ${q.part}`);
    (p.eaves_m = q.eaves_m ?? null), (p.top_m = q.top_m ?? null), fromPlate++;
  }
}
// The gasholders (source "gasholder", put in by build.sh from research/gasholders-1917.tsv) take the table's heights:
// eaves_m the parapet as measured on the 1933 aerials (or ASSUMED as a measured holder, how "assumed"), top_m with the
// roof's rise. A holder has no storeys; storeys is eaves over 5 m (the world's public storey) only so a reader that
// knows nothing else draws it near its height. Matched by the row whose centre is nearest the building's mean corner.
const gasTsv = Bun.file(`${import.meta.dir}/../../research/gasholders-1917.tsv`);
let gasholders = 0;
if (await gasTsv.exists()) {
  const rows = (await gasTsv.text()).split("\n").filter((l) => l && !l.startsWith("#") && !l.startsWith("id\t")).map((l) => l.split("\t"));
  const mid = (r: number[][]) => r.slice(0, -1).reduce((s, p, _, a) => [s[0] + p[0] / a.length, s[1] + p[1] / a.length], [0, 0]);
  for (const f of blds) {
    if (f.properties.source !== "gasholder") continue;
    const [x, y] = mid(f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]);
    const g = rows.map((r) => ({ r, d: Math.hypot(+r[2] - x, +r[3] - y) })).sort((a, b) => a.d - b.d)[0];
    if (!g || g.d > 6) throw new Error(`heights: a gasholder at ${x.toFixed(1)} ${y.toFixed(1)} has no row in gasholders-1917.tsv`);
    const [id, works, , , dia, eaves, pm, rise, how] = g.r, p = f.properties;
    p.storeys_was = { storeys: p.storeys, storeys_from: p.storeys_from };
    (p.kind = works === "city" ? "public" : "commercial"), (p.storeys = Math.max(1, Math.round(+eaves / 5))), (p.storeys_from = "gasholder");
    (p.name = works === "city" ? "Gasbehälter (II. Städtische Gasanstalt)" : "Gasbehälter (Englische Gas-Anstalt)");
    (p.eaves_m = +eaves), (p.top_m = Math.round((+eaves + +rise) * 10) / 10);
    (p.gasholder = { id, diameter_m: +dia, eaves_plusminus_m: +pm, rise_m: +rise, height: how }), gasholders++;
  }
}
const head = (await Bun.file(file).text()).split('"features"')[0]; // one feature a line, as build.sh writes it
await Bun.write(file, `${head}"features": [\n${blds.map((f) => JSON.stringify(f)).join(",\n")}\n]\n}\n`);
const withStreet = rows.filter((r) => r.street !== null).length;
const capped = rows.filter((r) => r.eaves !== null && r.eaves < 22).length;
console.log(`heights: ${withStreet} of ${blds.length} buildings front a street with a centreline; ${capped} of them held under 22 m by its width; ${byMonument.size} take their storeys from a monument's entry (${[...changed].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k}: ${n}`).join(", ")}); ${held} houses over five storeys today held at five; ${fromPlate} from Hobrecht's Blatt 16 (Pumpwerk III); ${gasholders} gasholders`);
