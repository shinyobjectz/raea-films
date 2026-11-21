// The ground-floor shops of the streets nobody has read: a fudge with real weights. Only seven streets of the 1917
// Adreßbuch are read (tools/addr: their houses and storefronts are in map/1917/businesses/); every other street front
// gets shops drawn from what read streets held:
//   a tenement block (use residential, or a building beyond the plan) from Ackerstraße 1917, a working street of
//   163 houses (research/trades/ackerstrasse-1917.json: 51 pubs and drink sellers, 44 shoemakers, 34 butchers, 24 bakers ...);
//   a mixed or core block from the read streets' storefronts (Friedrichstraße, Leipziger Straße and the rest);
//   public, commercial and industrial buildings, and the houses of the read streets themselves, get none.
// Where: a building's street front is its outline where the ground 1.5 m outside is street (open.geojson), sampled
// every metre, in runs facing one way; one shop per SLOT m of a run (Ackerstraße: about 1.9 food and shop entries to a
// house of some 20 m front, ASSUMED most of them storefronts). Where a run meets another street front at 60 degrees or
// more, a corner: its first shop is the corner pub (Eckkneipe) with chance CORNER (ASSUMED: not counted from any source).
// The trade is only the shop's kind and its sign word ("Bäckerei"); no name from the directory is used.
// Seeded by the building's key, so a run again gives the same shops.
//   bun shops.ts SLICE.json   in: map dir buildings.geojson, open.geojson; out: shops.geojson (points on the fronts)
import { polygons, fill, type Tile } from "./raster";
import { slicePaths } from "./paths";

const SLOT = 12, MINFRONT = 6, CORNER = 0.6, OUT = 1.5;
const { slice, map } = await slicePaths(process.argv[2] ?? `${import.meta.dir}/slice.json`);
const root = `${import.meta.dir}/../..`;
const [X0, Y0, X1, Y1] = slice.bbox as number[];

// The sign classes, and the words of the directory that are each.
const CATS: [string, RegExp][] = [
  ["Gastwirtschaft", /Gastw|Schankw|Kneip|Restaur|Destill|Ausschank|Bier|Wein/],
  ["Bäckerei", /Bäcker/], ["Konditorei", /Konditor|Caf[eé]/], ["Fleischerei", /Fleisch|Schlächt|Wurst/],
  ["Kolonialwaren", /Kolonialw|Materialw|Viktual|Lebensm|Delikat|Feinkost/], ["Milchhandlung", /Milch|Molkerei|Butter|Käse/],
  ["Grünkram", /Grünkr|Obst|Gemüse|Kartoffel/], ["Zigarren", /Zigarr|Tabak/], ["Fischhandlung", /Fisch/],
  ["Friseur", /Friseur|Barbier/], ["Schuhmacher", /Schuh/], ["Kohlenhandlung", /Kohlen/], ["Seifen und Drogen", /Seifen|Drog/],
  ["Uhrmacher", /Uhr/], ["Möbel", /Möbel/], ["Apotheke", /Apothek/], ["Papier und Bücher", /Buchh(?!alt)|Papier|Schreibw/],
  ["Wäsche und Konfektion", /Wäsche|Konfekt|Mode(?!ll)|Damen|Herren|Weißw|Kurzw|Posament/], ["Hüte", /Hut/],
  ["Blumen", /Blumen/], ["Glas und Porzellan", /Glas|Porzellan/], ["Juwelier", /Juwel|Gold|Silber/],
  ["Photograph", /Photogr/], ["Bank", /Bank|Wechsel/],
];
const cat = (t: string) => CATS.find(([, re]) => re.test(t))?.[0];
function weights(texts: [string, number][]) {
  const w = new Map<string, number>();
  for (const [t, n] of texts) { const c = cat(t); if (c) w.set(c, (w.get(c) ?? 0) + n); }
  return [...w].sort((a, b) => b[1] - a[1]);
}
const acker = await Bun.file(`${root}/research/trades/ackerstrasse-1917.json`).json();
const TENEMENT = weights(acker.trades.filter((t: any[]) => t[0] === "food" || t[0] === "shop").map((t: any[]) => [t[1], t[2]]));
const readTexts: [string, number][] = [];
const readKeys = new Set<string>();
const bdir = `${root}/map/1917/businesses`;
for (const f of new Bun.Glob("*.geojson").scanSync(bdir)) {
  for (const ft of (await Bun.file(`${bdir}/${f}`).json()).features) {
    const p = ft.properties;
    if (p.building_key) readKeys.add(String(p.building_key).split("~")[0]);
    for (const s of p.storefronts ?? []) readTexts.push([String(s.text ?? s), 1]);
  }
}
const CORE = weights(readTexts);

// A small seeded generator per building (mulberry32 on a hash of the key).
function rng(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => { h = (h + 0x6d2b79f5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pick(w: [string, number][], r: () => number, not: Set<string>) {
  const pool = w.filter(([c]) => !not.has(c)), total = pool.reduce((a, [, n]) => a + n, 0);
  let x = r() * total;
  for (const [c, n] of pool) if ((x -= n) <= 0) return c;
  return pool[pool.length - 1]?.[0] ?? "Kolonialwaren";
}

// The street ground at 1 m.
const t: Tile = { id: slice.name, x0: X0, y0: Y0, x1: X1, y1: Y1, mpp: 1 };
const W = X1 - X0, H = Y1 - Y0, street = new Uint8Array(W * H);
for (const f of (await Bun.file(`${map}/open.geojson`).json()).features)
  if (f.properties.kind === "street") fill(street, t, polygons(f.geometry), 1);
const isStreet = (x: number, y: number) => {
  const c = Math.floor(x - X0), r = Math.floor(Y1 - y);
  return c >= 0 && c < W && r >= 0 && r < H && street[r * W + c] === 1;
};

const shops: any[] = [];
const tally: Record<string, number> = {};
let fronted = 0, corners = 0;
for (const f of (await Bun.file(`${map}/buildings.geojson`).json()).features) {
  const p = f.properties, key = String(p.key ?? p.id);
  const tenement = p.use === "residential" || (p.source === "alkis-outside" && p.kind === "private");
  const core = p.use === "mixed" || p.use === "core";
  if (p.kind !== "private" || !(tenement || core) || readKeys.has(key.split("~")[0])) continue;
  // the front: samples every metre along the outer ring whose outward point is street, in runs by edge direction
  const ring = polygons(f.geometry)[0]?.[0];
  if (!ring) continue;
  let area2 = 0;
  for (let i = 0; i + 1 < ring.length; i++) area2 += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  const ccw = area2 > 0;
  // the outline in order, each metre a street front or not, with its outward direction
  const samples: { x: number; y: number; dir: number; front: boolean }[] = [];
  for (let i = 0; i + 1 < ring.length; i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1], len = Math.hypot(bx - ax, by - ay);
    if (len < 0.5) continue;
    const ux = (bx - ax) / len, uy = (by - ay) / len, nx = ccw ? uy : -uy, ny = ccw ? -ux : ux, dir = Math.atan2(ny, nx);
    for (let s = 0.5; s < len; s += 1) { const x = ax + ux * s, y = ay + uy * s; samples.push({ x, y, dir, front: isStreet(x + nx * OUT, y + ny * OUT) }); }
  }
  // runs: consecutive front metres facing within 30 degrees of the run's start (a jagged outline stays one run)
  const turn = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const runs: { pts: typeof samples; dir: number; start: number; end: number; corner: boolean }[] = [];
  let cur: (typeof runs)[number] | null = null;
  samples.forEach((s, i) => {
    if (!s.front) { cur = null; return; }
    if (cur && turn(cur.dir, s.dir) < Math.PI / 6) { cur.pts.push(s); cur.end = i; return; }
    cur = { pts: [s], dir: s.dir, start: i, end: i, corner: false };
    runs.push(cur);
  });
  // a corner: a long run that starts within 8 m of the end of another long run facing 60 degrees or more away
  // (a Berlin corner is mostly cut at 45 degrees, a short face between the two streets)
  const good = runs.filter((r) => r.pts.length >= MINFRONT);
  good.forEach((g, j) => { const p = good[j - 1]; g.corner = !!p && g.start - p.end <= 8 && turn(p.dir, g.dir) >= Math.PI / 3; });
  if (!good.length) continue;
  fronted++;
  const r = rng(key), used = new Set<string>();
  let hasCorner = false;
  for (const run of good) {
    // one shop per SLOT m, spread along the run; at a corner the first sits at the corner and is the pub with chance CORNER
    const n = Math.max(1, Math.round(run.pts.length / SLOT));
    const isCorner = run.corner;
    if (isCorner) hasCorner = true;
    for (let k = 0; k < n; k++) {
      const at = run.pts[isCorner && k === 0 ? Math.min(run.pts.length - 1, 2) : Math.floor(((k + 0.5) / n) * run.pts.length)];
      const pub = isCorner && k === 0 && r() < CORNER;
      if (used.size >= CATS.length - 2) used.clear();
      const sign = pub ? "Gastwirtschaft" : pick(core ? CORE : TENEMENT, r, used);
      used.add(sign);
      tally[sign] = (tally[sign] ?? 0) + 1;
      shops.push({ type: "Feature", geometry: { type: "Point", coordinates: [+at.x.toFixed(2), +at.y.toFixed(2)] },
        properties: { building_key: key, sign, from: core ? "read streets" : "Ackerstraße", corner: isCorner && k === 0, facing_deg: Math.round((run.dir * 180) / Math.PI), assumed: true } });
    }
  }
  if (hasCorner) corners++;
}
await Bun.write(`${map}/shops.geojson`, JSON.stringify({ type: "FeatureCollection", name: "shops",
  crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } }, features: shops }));
console.log(`shops: ${shops.length} on ${fronted} street fronts (${corners} corner houses): ${Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${v}`).join(", ")}`);
