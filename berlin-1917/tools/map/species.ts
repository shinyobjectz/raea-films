// A species for every tree of 1917 (map/1917/trees.geojson, read from the 1928 aerial), for raea/foliage
// (docs/foliage.feature FO11, research/foliage-1917.md):
//   streets  Berlin planted an avenue with one species, so street crowns are chained into rows (neighbours within
//            ROW m) and each row takes one: the species of a tree planted before 1918 that still stands within
//            SURVIVOR m of the row (Baumbestand Berlin, Strassen- and Anlagenbaeume, dl-de/zero-2.0), else a draw
//            from the 1917 street mix (ASSUMED weights, research/foliage-1917.md) by the row's own number; the
//            Linden's rows are limes by name and history
//   parks    groves: each GROVE m cell draws from the park mix, and a tree keeps its cell's species 70% of the time;
//            within WATER m of water a willow or a poplar (ASSUMED shares)
// Each tree also gets a variant (one of the grown seeds) and its size: crown width from the 1928 crown (in leaf),
// height by the species' habit, clear trunk 3.5 m on streets and 2.5 m in parks (ASSUMED).
// out: map/1917/tree_species.json { source, trees: [[e, n, species, variant, width, height, clear], ...] } in the
//      same order as trees.geojson's features, and a count per species printed.
//   bun species.ts
import { readFileSync, writeFileSync } from "node:fs";
import { GENUS, GROVE, HABIT, PARK, STREET, VARIANTS, draw, hash, parkSpecies, type Species } from "./species-mix";

const MAP = `${import.meta.dir}/../../map/1917`;
const CACHE = `${import.meta.dir}/../../cache/kataster`;
const ROW = 14, SURVIVOR = 5, WATER = 12;

type Pt = [number, number];

const trees = JSON.parse(readFileSync(`${MAP}/trees.geojson`, "utf8")).features as { geometry: { type: string; coordinates: Pt }; properties: { crown_d_m?: number; on?: string; kind?: string } }[];
const points = trees.map((f, i) => ({ i, p: f.geometry.coordinates, d: f.properties.crown_d_m ?? 6, on: f.properties.on ?? "park", crown: f.geometry.type === "Point" && f.properties.kind !== "canopy" }));

// survivors: planted 1917 or before, still standing
const survivors: { p: Pt; s: Species; street: string }[] = [];
for (const file of ["strassenbaeume", "anlagenbaeume"]) {
  for (const f of JSON.parse(readFileSync(`${CACHE}/${file}.json`, "utf8")).features) {
    const y = +f.properties.pflanzjahr;
    const s = GENUS[f.properties.gattung];
    if (y > 0 && y <= 1917 && s) survivors.push({ p: f.geometry.coordinates, s, street: f.properties.strname ?? "" });
  }
}

// water's edges, as segments, for the willows
const segs: [Pt, Pt][] = [];
for (const f of JSON.parse(readFileSync(`${MAP}/water.geojson`, "utf8")).features) {
  const polys: Pt[][][] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) for (let k = 1; k < ring.length; k++) segs.push([ring[k - 1], ring[k]]);
}
const toSeg = (p: Pt, [a, b]: [Pt, Pt]) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const nearWater = (p: Pt) => segs.some((s) => Math.min(s[0][0], s[1][0]) - WATER < p[0] && p[0] < Math.max(s[0][0], s[1][0]) + WATER && Math.min(s[0][1], s[1][1]) - WATER < p[1] && p[1] < Math.max(s[0][1], s[1][1]) + WATER && toSeg(p, s) < WATER);

// a grid of cells for neighbour lookups
function grid<T extends { p: Pt }>(xs: T[], cell: number) {
  const g = new Map<string, T[]>();
  for (const x of xs) {
    const k = `${Math.floor(x.p[0] / cell)},${Math.floor(x.p[1] / cell)}`;
    (g.get(k) ?? g.set(k, []).get(k)!).push(x);
  }
  return (p: Pt, r: number) => {
    const out: T[] = [];
    const [cx, cy] = [Math.floor(p[0] / cell), Math.floor(p[1] / cell)];
    const n = Math.ceil(r / cell);
    for (let dx = -n; dx <= n; dx++) for (let dy = -n; dy <= n; dy++) for (const x of g.get(`${cx + dx},${cy + dy}`) ?? []) if (Math.hypot(x.p[0] - p[0], x.p[1] - p[1]) <= r) out.push(x);
    return out;
  };
}

// street rows: connected street crowns within ROW m of each other (union-find)
const street = points.filter((t) => t.crown && t.on === "street");
const parent = new Map(street.map((t) => [t.i, t.i]));
const find = (i: number): number => (parent.get(i) === i ? i : (parent.set(i, find(parent.get(i)!)), parent.get(i)!));
const nearStreet = grid(street, ROW);
for (const t of street) for (const u of nearStreet(t.p, ROW)) parent.set(find(t.i), find(u.i));
const rows = new Map<number, typeof street>();
for (const t of street) (rows.get(find(t.i)) ?? rows.set(find(t.i), []).get(find(t.i))!).push(t);
const nearSurvivor = grid(survivors, SURVIVOR);
const rowSpecies = new Map<number, { s: Species; why: string }>();
for (const [root, members] of rows) {
  const votes = new Map<Species, number>();
  let linden = 0;
  for (const t of members) {
    for (const v of nearSurvivor(t.p, SURVIVOR)) {
      votes.set(v.s, (votes.get(v.s) ?? 0) + 1);
      if (/Unter den Linden/.test(v.street)) linden++;
    }
  }
  const best = [...votes].sort((a, b) => b[1] - a[1])[0];
  rowSpecies.set(root, linden ? { s: "lime", why: "linden" } : best ? { s: best[0], why: "survivor" } : { s: draw(STREET, hash(root, 17)), why: "mix" });
}

// the Linden by place: the promenade's rows between the Brandenburg Gate and the Schlossbruecke (EPSG:25833, ASSUMED box)
const LINDEN = [389420, 5819930, 390930, 5820130];
const inLinden = (p: Pt) => p[0] > LINDEN[0] && p[0] < LINDEN[2] && p[1] > LINDEN[1] && p[1] < LINDEN[3];

const out: (string | number)[][] = [];
const count = new Map<string, number>();
const why = new Map<string, number>();
for (const t of points) {
  let s: Species;
  if (!t.crown) s = draw(PARK, hash(Math.floor(t.p[0] / GROVE), Math.floor(t.p[1] / GROVE)));
  else if (t.on === "street") {
    const r = rowSpecies.get(find(t.i))!;
    s = inLinden(t.p) ? "lime" : r.s;
    why.set(inLinden(t.p) ? "linden" : r.why, (why.get(inLinden(t.p) ? "linden" : r.why) ?? 0) + 1);
  } else if (nearWater(t.p)) s = hash(t.i, 5) < 0.6 ? "willow" : hash(t.i, 6) < 0.6 ? "poplar" : draw(PARK, hash(t.i, 7));
  else s = parkSpecies(t.p[0], t.p[1], t.i);
  const width = Math.max(3, Math.min(t.d, 22));
  const height = Math.min(width * HABIT[s], s === "poplar" ? 30 : 28);
  const clear = t.on === "street" ? 3.5 : 2.5;
  out.push([Math.round(t.p[0] * 10) / 10, Math.round(t.p[1] * 10) / 10, s, Math.floor(hash(t.i, 9) * VARIANTS[s]), Math.round(width * 10) / 10, Math.round(height * 10) / 10, clear]);
  count.set(s, (count.get(s) ?? 0) + 1);
}
writeFileSync(`${MAP}/tree_species.json`, JSON.stringify({ source: "tools/map/species.ts: rows of the 1928 crowns, Baumbestand Berlin survivors planted by 1917 (dl-de/zero-2.0), the 1917 mixes (ASSUMED)", fields: ["e", "n", "species", "variant", "width", "height", "clear"], trees: out }));
console.log(`${out.length} trees, ${rows.size} street rows, ${survivors.length} survivors; streets by ${[...why].map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log([...count].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", "));
