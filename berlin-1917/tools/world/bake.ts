import { renameSync } from "node:fs";
// The world bake: 1917 Berlin's surface as game-ready tiles (world/SOP.md §8, world/budgets.ts).
//   in:  map/1917/{buildings,open,water,green,rail}.geojson, cache/<slice>/streets.json (street skeleton, half-widths),
//        cache/<slice>/graybox/surfaces.geojson (the map lane's ground pieces per 500 m tile), the 1917 ground grid
//   out: assets/world/<slice>/<tile>/{lod0,lod1,lod2}.glb and tile.json; assets/world/<slice>/index.json
// A tile is 250 m, a quarter of the map lane's 500 m tile, named by its south-west corner in 10 m units (38940_58173.. ).
// usage: bun bake.ts [--slice ../map/slice.json] [--only E0,N0,E1,N1] [--lenient]
import { Builder, type Material, type Node, writeGlb } from "./glb";
import { CLS, ClassRaster, type Pt, type Ring, P, N, hash, orient, simplify, triangulate, densify, openRing, area2 } from "./geom";
import { skyline } from "./landmarks";
import { stadtbahn } from "./stadtbahn";
import { archBridge, archLayout, weidendammer } from "./bridges";
import { dressCourt } from "../../interiors/yard";
import { ATLAS } from "../../interiors/atlas";
import { ASSIGN, GLYPHS, REC, ROOMS, SIGNS, STORE, building, type Building, type DoorRec, type EdgeKind, type Lod, type Out, type PaneRec } from "./facade";
import { TILE_BUDGET, VIEW_BYTES, checkTile, lodFor, viewBytes } from "../../world/budgets";

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const root = `${import.meta.dir}/../..`;
const slicePath = opt("--slice") ?? `${root}/tools/map/slice.json`;
const slice = await Bun.file(slicePath).json();
const cache = `${root}/cache/${slice.cache ?? slice.name}`, map = `${root}/map/1917`;
// (--out DIR bakes to a scratch folder, to measure a change while a render reads the slice's tiles)
const outDir = opt("--out") ?? `${root}/assets/world/${slice.name}`;
const lenient = args.includes("--lenient");
const only = opt("--only")?.split(",").map(Number); // a bbox in EPSG:25833
// LOD0 only inside these boxes ("E0,N0,E1,N1;..."), LOD1 and LOD2 everywhere: the full slice at LOD0 is ~7 GB, so
// the finest level is baked where a shot or a play area needs it (a game build bakes it all)
const lod0Boxes = opt("--lod0")?.split(";").map((b) => b.split(",").map(Number));
const wantLod0 = (x0: number, y0: number) => !lod0Boxes || lod0Boxes.some(([a, b, c, d]) => x0 + TILE > a && x0 < c && y0 + TILE > b && y0 < d);
const TILE = 250;
const [BX0, BY0, BX1, BY1] = slice.bbox as number[];
const t0 = performance.now();

// ---------- inputs ----------
const polys = (g: any): number[][][][] => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const readLayer = async (name: string) => (await Bun.file(`${map}/${name}.geojson`).json()).features as any[];
const bFeatures = await readLayer("buildings");
const open = await readLayer("open");
/** Write a file whole or not at all: to a temporary name beside it, then renamed over it, so a render that loads a tile
 *  while the bake runs reads the old file or the new one, never half of one. */
async function put(path: string, data: string | Uint8Array) {
  const tmp = path.replace(/([^/]+)$/, ".$1.tmp");
  await Bun.write(tmp, data);
  renameSync(tmp, path);
}
const raster = new ClassRaster(BX0 - 50, BY0 - 50, BX1 - BX0 + 100, BY1 - BY0 + 100, 1);
for (const f of open) for (const rings of polys(f.geometry)) raster.fill(rings, f.properties.kind === "street" ? CLS.street : CLS.court);
for (const [name, cls] of [["green", CLS.green], ["rail", CLS.rail], ["water", CLS.water]] as const)
  for (const f of await readLayer(name)) for (const rings of polys(f.geometry)) raster.fill(rings, cls);
/** raea-fb's department-store rooms (interiors/atlas.ts: the halls and the sales floor) */
const STORE_ROOMS = new Set(ATLAS.filter((a) => a.shop === "shop-department" || a.shop === "dept-floor").map((a) => a.n));
const blds: { id: number; key: string; rings: Ring[]; storeys: number; pub: boolean; com: boolean; cx: number; cy: number }[] = [];
/** A footprint's seed number from its stable key ("3894015_58179498"), so a rebuild of the map keeps every facade. */
const keyNum = (k: string) => { let h = 2166136261; for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619) >>> 0; return h % 1_000_003; };
bFeatures.forEach((f: any, idx: number) => {
  polys(f.geometry).forEach((rings, part) => {
    const o = orient(rings.map((r: number[][]) => r.map(([x, y]) => [x, y] as Pt)), 0.2);
    if (o[0].length < 3) return;
    let cx = 0, cy = 0;
    for (const [x, y] of o[0]) (cx += x), (cy += y);
    const key = `${f.properties.key ?? `i${idx}`}${part ? `-p${part}` : ""}`;
    blds.push({ id: keyNum(key), key, rings: o, storeys: f.properties.storeys || (f.properties.kind === "public" ? 4 : 5), pub: f.properties.kind === "public", com: f.properties.kind === "commercial", cx: cx / o[0].length, cy: cy / o[0].length });
    raster.fill(o, CLS.building, blds.length);
  });
});
console.log(`inputs: ${blds.length} buildings, ${open.length} open pieces, raster ${raster.w}x${raster.h} (${((performance.now() - t0) / 1000).toFixed(1)} s)`);

// the street skeleton's half-widths, on a 25 m grid of sample points
const streets = await Bun.file(`${cache}/streets.json`).json();
const HW = new Map<string, { x: number; y: number; hw: number }[]>();
const hwKey = (x: number, y: number) => `${Math.floor(x / 25)},${Math.floor(y / 25)}`;
for (const e of streets.edges) for (const [x, y, hw] of e.pts) { const k = hwKey(x, y); (HW.get(k) ?? HW.set(k, []).get(k)!).push({ x, y, hw }); }
for (const nd of streets.nodes) { const k = hwKey(nd.x, nd.y); (HW.get(k) ?? HW.set(k, []).get(k)!).push({ x: nd.x, y: nd.y, hw: nd.hw }); }
function halfWidth(x: number, y: number): number {
  let best = Infinity, hw = 0;
  const i = Math.floor(x / 25), j = Math.floor(y / 25);
  for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++)
    for (const p of HW.get(`${i + di},${j + dj}`) ?? []) { const d = Math.hypot(p.x - x, p.y - y); if (d < best) (best = d), (hw = p.hw); }
  return best < 60 ? hw : 0;
}

// the street skeleton as segments in a 25 m grid: where a point is across its street, and which way the street runs
type Seg = { ax: number; ay: number; bx: number; by: number; ha: number; hb: number };
const SEGS = new Map<string, Seg[]>();
for (const e of streets.edges as { pts: number[][] }[]) for (let i = 0; i + 1 < e.pts.length; i++) {
  const [ax, ay, ha] = e.pts[i], [bx, by, hb] = e.pts[i + 1];
  if (Math.hypot(bx - ax, by - ay) > 400) continue; // the skeleton's few runaway edges
  const sg = { ax, ay, bx, by, ha, hb };
  for (let i0 = Math.floor((Math.min(ax, bx) - 30) / 25); i0 <= Math.floor((Math.max(ax, bx) + 30) / 25); i0++)
    for (let j0 = Math.floor((Math.min(ay, by) - 30) / 25); j0 <= Math.floor((Math.max(ay, by) + 30) / 25); j0++) {
      const k = `${i0},${j0}`;
      (SEGS.get(k) ?? SEGS.set(k, []).get(k)!).push(sg);
    }
}
/** The nearest street's centreline distance d, its half-width hw there and its direction (radians, 0..pi, map frame). */
function streetAt(x: number, y: number): { d: number; hw: number; ang: number } {
  let best = { d: Infinity, hw: 0, ang: 0 };
  for (const sg of SEGS.get(`${Math.floor(x / 25)},${Math.floor(y / 25)}`) ?? []) {
    const dx = sg.bx - sg.ax, dy = sg.by - sg.ay, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - sg.ax) * dx + (y - sg.ay) * dy) / L2));
    const d = Math.hypot(x - sg.ax - dx * t, y - sg.ay - dy * t);
    // the street a point belongs to is the one whose building line is furthest out past it
    const hw = sg.ha + (sg.hb - sg.ha) * t;
    if (d - hw < best.d - best.hw) best = { d, hw, ang: ((Math.atan2(dy, dx) % Math.PI) + Math.PI) % Math.PI };
  }
  return best;
}

// the Adreßbuch's shopping fronts (Leipziger Straße so far): buildings with storefront entries
const shopKeys = new Set<string>();
try {
  const biz = await Bun.file(`${map}/businesses/leipziger.geojson`).json();
  for (const f of biz.features) if (f.properties.building_key != null) shopKeys.add(f.properties.building_key);
} catch { /* not baked yet */ }

// ---------- classify every building's edges ----------
const KIND: Record<number, EdgeKind> = { [CLS.street]: "front", [CLS.court]: "court", [CLS.building]: "party", [CLS.water]: "other", [CLS.green]: "other", [CLS.rail]: "other", [CLS.none]: "other" };
function classify(b: (typeof blds)[number], self: number): Building {
  const r = b.rings[0], n = r.length;
  const kinds: EdgeKind[] = [], shops: boolean[] = [];
  let hwMax = 0;
  for (let i = 0; i < n; i++) {
    const a = r[i], c = r[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const o: Pt = [(c[1] - a[1]) / L, -(c[0] - a[0]) / L];
    const votes = new Map<EdgeKind, number>();
    for (const s of [0.2, 0.5, 0.8]) for (const d of [1.2, 2.5]) {
      const x = a[0] + (c[0] - a[0]) * s + o[0] * d, y = a[1] + (c[1] - a[1]) * s + o[1] * d;
      let cls = raster.at(x, y);
      if (cls === CLS.building && raster.idAt(x, y) === self) cls = CLS.none;
      const k = KIND[cls] ?? "other";
      votes.set(k, (votes.get(k) ?? 0) + 1);
    }
    const kind = [...votes.entries()].sort((p, q) => q[1] - p[1])[0][0];
    kinds.push(kind);
    let shop = false;
    if (kind === "front" && L > 4) {
      const m: Pt = [(a[0] + c[0]) / 2 + o[0] * 6, (a[1] + c[1]) / 2 + o[1] * 6];
      const hw = halfWidth(m[0], m[1]);
      hwMax = Math.max(hwMax, hw);
      const p = shopKeys.has(b.key.replace(/-p\d+$/, "")) ? 0.95 : hw >= 9 ? 0.75 : hw >= 6.5 ? 0.35 : 0.08;
      shop = hash(b.id, i, 999) < p;
    }
    shops.push(shop);
  }
  // the base: the ground floor stands on its street (on its sidewalk, 0.15 m over the carriageway since the 11-17
  // surfaces): the median standing height 0.8 m out from the middle of each street front. Where the house's lowest
  // ground is under that (a house on the river's bank, its back in the water; a slope), facade.ts carries its walls
  // down to it on a socle (`foot`). Before 11-17 the base was the lowest ground: the Spree's bank houses were 5 m
  // under their streets. Each door then meets the pavement before it (facade.ts sillAt)
  const minG = Math.min(...r.map(([x, y]) => g(x, y))), fronts: number[] = [];
  for (let i = 0; i < n; i++) {
    if (kinds[i] !== "front") continue;
    const a = r[i], c = r[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (L < 1) continue;
    const x = (a[0] + c[0]) / 2 + ((c[1] - a[1]) / L) * 0.8, y = (a[1] + c[1]) / 2 - ((c[0] - a[0]) / L) * 0.8;
    fronts.push(stand(x, y));
  }
  const base = fronts.length ? Math.max(minG, median(fronts)) : minG;
  // a commercial house (the plan's hatched grey: hotels, banks, theatres, arcades) is built to be looked at
  const richness = Math.max(b.com ? 0.65 : 0, Math.min(1, (hwMax - 4) / 8 + (hash(b.id, 5) - 0.5) * 0.3));
  return { id: b.id, key: b.key, ring: r, kinds, shops, base, storeys: b.storeys, pub: b.pub, com: b.com, richness, ground: stand, foot: minG };
}

// ---------- the ground ----------
const head = await Bun.file(`${map}/ground1917_2m.json`).json();
const GW = head.width, GH = head.height, CELL = head.cell_m, [GX0, GY1] = head.origin_top_left;
const ground = new Float32Array(await Bun.file(`${cache}/ground1917_2m.f32`).arrayBuffer());
function g(x: number, y: number) {
  const cx = Math.min(GW - 1.001, Math.max(0, (x - GX0) / CELL - 0.5)), cy = Math.min(GH - 1.001, Math.max(0, (GY1 - y) / CELL - 0.5));
  const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, k = j * GW + i;
  return (ground[k] * (1 - fx) + ground[k + 1] * fx) * (1 - fy) + (ground[k + GW] * (1 - fx) + ground[k + GW + 1] * fx) * fy;
}
const surfaces = (await Bun.file(`${cache}/graybox/surfaces.geojson`).json()).features as any[];
const surfByTile = new Map<string, { layer: string; rings: Ring[]; deck?: number }[]>();
for (const f of surfaces) {
  const list = surfByTile.get(f.properties.tile) ?? surfByTile.set(f.properties.tile, []).get(f.properties.tile)!;
  for (const rings of polys(f.geometry)) list.push({ layer: f.properties.layer, rings: rings.map((r: number[][]) => r.map(([x, y]) => [x, y] as Pt)) });
}
/** Every piece with its outer ring's box: a tile takes each piece its box meets, whatever grid the map lane keyed
 *  them by (its 500 m tiles start at 389400 since the 11-16 graybox, and a 250 m tile can straddle two; looking a
 *  tile up by one computed key found none at all, so no tile had its sidewalks, courts, greens or water) */
const surfBoxed = [...surfByTile.values()].flat().map((p) => {
  const r = p.rings[0];
  return { p, box: [Math.min(...r.map((q) => q[0])), Math.min(...r.map((q) => q[1])), Math.max(...r.map((q) => q[0])), Math.max(...r.map((q) => q[1]))] };
});
// Bridge decks at the plan's own figures: map/1917/spots.geojson's "on": "bridge" points are Straube's printed deck
// heights (the map lane's reading; all 10 fall in this slice). The ground grid under a deck is the river, so the old
// rule (the 90th percentile of the ground under the deck, or 2.5 m over the water) set five of the ten 2.1-3.0 m below
// their figures. A deck piece within 25 m of a figure crowns at it and falls as a parabola to the street at its ends:
// h = C + (e - C) t^2, where e is the ground at its land vertices (inverse-distance weighted) and t = dS / (dS + dL),
// the distances to the figure and to the nearest land vertex. Every piece matched to a figure shares the function, so
// a deck split between the 500 m blocks or tiles has no seam. Decks with no figure keep the old rule.
type Deck = { at: Pt; crown: number; land: [number, number, number][]; pieces: number };
const DECKS: Deck[] = (await Bun.file(`${map}/spots.geojson`).json()).features
  .filter((f: any) => f.properties.on === "bridge" && f.properties.confidence >= 0.5)
  .map((f: any) => ({ at: f.geometry.coordinates as Pt, crown: f.properties.printed_m as number, land: [], pieces: 0 }));
{
  // each deck piece (the surfaces come cut at the 500 m blocks) goes with the nearest figure within 40 m of it, tagged
  // before the tiles clip it, so every part of one deck is shaped by the same figure
  const near = (p: Pt, r: Ring) => Math.min(...r.map(([x, y]) => Math.hypot(x - p[0], y - p[1])));
  for (const list of surfByTile.values()) for (const p of list) {
    if (p.layer !== "bridge") continue;
    let best = -1, bd = 40;
    DECKS.forEach((d, i) => { const di = near(d.at, p.rings[0]); if (di < bd) (bd = di), (best = i); });
    if (best < 0) continue;
    p.deck = best;
    DECKS[best].pieces++;
    for (const [x, y] of densify(p.rings[0], 2)) if (raster.at(x, y) !== CLS.water) DECKS[best].land.push([x, y, g(x, y)]);
  }
  console.log(`bridge decks by the plan's figures: ${DECKS.filter((d) => d.land.length).map((d) => `${d.crown} (${d.pieces})`).join(", ")}; no deck within 40 m: ${DECKS.filter((d) => !d.pieces).map((d) => d.crown).join(", ") || "none"}`);
}
// Bridges not standing in winter 1917-18 (map/1917/bridges.geojson: a deck whose state_1917 says it was taken down; the
// Weidendammer Brücke, down 1914-23 for the Nord-Süd-Bahn's tunnel): their deck pieces are drawn as the river, with a
// quay wall only where they meet land. What stood instead is bridges.ts's, baked as bridges.glb below.
const BRIDGES = (await Bun.file(`${map}/bridges.geojson`).json()).features as any[];
const GONE: Ring[] = BRIDGES.filter((f) => f.properties.kind === "bridge" && /^taken down/i.test(f.properties.state_1917 ?? ""))
  .flatMap((f) => polys(f.geometry).map((rs: Ring[]) => rs[0]));
const inRing = (x: number, y: number, r: Ring) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > y) !== (r[j][1] > y) && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  return c;
};
const GONE_BOX = GONE.map((r) => [Math.min(...r.map((p) => p[0])), Math.min(...r.map((p) => p[1])), Math.max(...r.map((p) => p[0])), Math.max(...r.map((p) => p[1]))]);
const gone = (x: number, y: number) => GONE.some((r, i) => { const b = GONE_BOX[i]; return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3] && inRing(x, y, r); });

const centroid = (r: Ring): [number, number] => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// The stone arch bridges standing in 1917 that bridges.ts builds (its ARCH_BRIDGES: the Schloßbrücke first): the
// river runs on under their arches, so the crossing under each deck is water to the labels and the ground grid, the
// deck keeps its roadway but not its walls (the bridge's faces are bridges.ts's), and the river's pieces aren't
// walled along its faces.
const ARCHES = archLayout(BRIDGES);
const spanned = (x: number, y: number) => ARCHES.some((L) => { const [s, w] = L.frame(x, y); return s >= L.s0 && s <= L.s1 && w >= L.w0 - 0.5 && w <= L.w1 + 0.5; });
const archRect = (L: (typeof ARCHES)[number]): Ring => [L.at(L.s0, L.w0 - 0.5), L.at(L.s1, L.w0 - 0.5), L.at(L.s1, L.w1 + 0.5), L.at(L.s0, L.w1 + 0.5)];
/** Each arch bridge's roadway: its plan figure's (deckAt) where one is within 40 m, else straight from the street at
 *  one end to the street at the other (the median ground 4-14 m beyond each end, off the water and the buildings):
 *  the flat rule takes the ground under the deck, which along a river is the quays' slope, and set the Schloßbrücke's
 *  roadway 1.8 m under the Linden at both its ends. Its faces (bridges.ts) and its drape here share it. */
const ARCH_TOP = ARCHES.map((L) => {
  let k = -1, bd = 40;
  DECKS.forEach((d, i) => { const di = Math.min(...L.ring.map(([x, y]) => Math.hypot(x - d.at[0], y - d.at[1]))); if (di < bd) (bd = di), (k = i); });
  if (k >= 0 && DECKS[k].land.length) return { by: `the plan's ${DECKS[k].crown} m`, top: (x: number, y: number) => deckAt(k, x, y) };
  const street = (a: number, b: number) => {
    const zz: number[] = [];
    for (let s = a; s <= b; s += 1) for (let w = L.w0 + 2; w <= L.w1 - 2; w += 2) {
      const [x, y] = L.at(s, w), c = raster.at(x, y);
      if (c !== CLS.water && c !== CLS.building) zz.push(g(x, y));
    }
    return median(zz);
  };
  let e0 = street(L.s0 - 14, L.s0 - 4), e1 = street(L.s1 + 4, L.s1 + 14);
  if (isNaN(e0)) e0 = e1;
  if (isNaN(e1)) e1 = e0;
  return { by: `the streets at its ends, ${e0.toFixed(2)} and ${e1.toFixed(2)} m`, top: (x: number, y: number) => { const t = Math.max(0, Math.min(1, (L.frame(x, y)[0] - L.s0) / (L.s1 - L.s0))); return e0 + (e1 - e0) * t; } };
});
// One level per body of water, so a river that crosses tile borders doesn't step at them (per tile, the Spree stood
// 2.1 m higher in 39040_582030 than in the tile east of it). The raster's water cells, with the decks gone in 1917,
// labelled into connected bodies; a body's level is the median ground along its whole edge less 1.2 m (the tiles' old
// rule, over the body). ASSUMED: no lock is read (the Mühlendamm's), so a body running through one has one level.
const WATER_LABEL = new Int32Array(raster.w * raster.h), WATER_LEVEL: number[] = [NaN];
{
  const { w, h } = raster, goneMask = new ClassRaster(raster.x0, raster.y0, w, h, raster.res);
  for (const r of GONE) goneMask.fill([r], 1);
  for (const L of ARCHES) goneMask.fill([archRect(L)], 1);
  const wet = (k: number) => raster.data[k] === CLS.water || goneMask.data[k] === 1;
  const cx = (k: number) => raster.x0 + ((k % w) + 0.5) * raster.res, cy = (k: number) => raster.y0 + (Math.floor(k / w) + 0.5) * raster.res;
  const stack = new Int32Array(w * h);
  for (let k0 = 0; k0 < w * h; k0++) {
    if (!wet(k0) || WATER_LABEL[k0]) continue;
    const label = WATER_LEVEL.length, edge: number[] = [];
    let top = 0;
    stack[top++] = k0;
    WATER_LABEL[k0] = label;
    while (top) {
      const k = stack[--top], i = k % w, j = (k - i) / w;
      let shore = false;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue;
        const q = jj * w + ii;
        if (!wet(q)) shore = true;
        else if (!WATER_LABEL[q]) (WATER_LABEL[q] = label), (stack[top++] = q);
      }
      // the shore by the river's own cells, not a gone deck's (the deck's ends are the old street's height)
      if (shore && raster.data[k] === CLS.water) edge.push(g(cx(k), cy(k)));
    }
    WATER_LEVEL.push(edge.length ? median(edge) - 1.2 : NaN);
  }
  const big = WATER_LEVEL.map((l, i) => [i, l] as const).filter(([i]) => i > 0);
  console.log(`water: ${big.length} bodies; levels ${[...new Set(big.map(([, l]) => l.toFixed(2)))].slice(0, 8).join(", ")}${big.length > 8 ? ", ..." : ""}`);
}
/** The level of the water at (x, y): its body's, or the nearest body's within 6 m (a piece's ring runs on the shore). */
function levelAt(x: number, y: number): number {
  const i0 = Math.floor((x - raster.x0) / raster.res), j0 = Math.floor((y - raster.y0) / raster.res);
  for (let r = 0; r <= 6; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    const i = i0 + di, j = j0 + dj;
    if (i < 0 || j < 0 || i >= raster.w || j >= raster.h) continue;
    const l = WATER_LABEL[j * raster.w + i];
    if (l) return WATER_LEVEL[l];
  }
  return NaN;
}
// The height a thing stands at: the ground grid plus the lift of the piece it stands on (groundTile's drapes: a
// sidewalk 0.15 m over the carriageway, a green 0.05, a rail bed 0.04, a court 0.03), so a lantern, a Litfaß column or
// a walker's foot on the sidewalk stands on it, not 15 cm into it. At 0.5 m, sidewalks filled last.
const LIFT = [0, 0.15, 0.05, 0.04, 0.03];
const liftMask = new ClassRaster(raster.x0, raster.y0, raster.w * 2, raster.h * 2, 0.5);
for (const [layer, v] of [["courtyard", 4], ["rail", 3], ["green", 2], ["sidewalk", 1]] as const)
  for (const { p } of surfBoxed) if (p.layer === layer && !(layer === "sidewalk" && gone(...centroid(p.rings[0])))) liftMask.fill(p.rings, v);
const stand = (x: number, y: number) => g(x, y) + LIFT[liftMask.at(x, y)];
// the bridges' decks (their surface pieces), and where nothing grows: a house, the river (with the decks gone in 1917
// and the crossings under arch bridges), a deck. The 1928 aerial's crowns read trees on the Schloßbrücke, standing in
// the Kupfergraben under its arches with their crowns through the roadway
const deckMask = new ClassRaster(raster.x0, raster.y0, raster.w, raster.h, 1);
for (const { p } of surfBoxed) if (p.layer === "bridge") deckMask.fill(p.rings, 1);
const growsAt = (x: number, y: number) => raster.at(x, y) !== CLS.building && raster.at(x, y) !== CLS.water && !deckMask.at(x, y) && !spanned(x, y) && !gone(x, y);
/** A water piece's level: the body its ring runs along (the median over its shore, for a piece two bodies touch). */
const pieceLevel = (rings: Ring[]) => median(densify(rings[0], 4).map(([x, y]) => levelAt(x, y)).filter((l) => !isNaN(l)));
/** Deck k's height at (x, y): its figure at the crown, falling to the street at its ends. */
function deckAt(k: number, x: number, y: number): number {
  const d = DECKS[k], dS = Math.hypot(x - d.at[0], y - d.at[1]);
  let w = 0, e = 0, dL = Infinity;
  for (const [lx, ly, lz] of d.land) { const q = Math.hypot(x - lx, y - ly); dL = Math.min(dL, q); const wi = 1 / (q * q + 1); (w += wi), (e += wi * lz); }
  const t = dS / (dS + dL);
  return d.crown + (e / w - d.crown) * t * t;
}
/** Sutherland-Hodgman against an axis-aligned box. */
function clip(r: Ring, x0: number, y0: number, x1: number, y1: number): Ring {
  let out = r;
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  for (const [inside, cut] of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[(i + src.length - 1) % src.length], b = src[i];
      if (inside(b)) { if (!inside(a)) out.push(cut(a, b)); out.push(b); }
      else if (inside(a)) out.push(cut(a, b));
    }
    if (!out.length) return out;
  }
  return out;
}
/** Ground surface kinds, in the ground vertex colour's alpha (world/shaders/ground.wesl). */
const GSURF = { setts: 10, asphalt: 30, sidewalk: 50, kerb: 70, court: 90, green: 110, rail: 130, quay: 150, bridge: 170, bed: 190 } as const;

function groundTile(x0: number, y0: number, x1: number, y1: number, lod: Lod) {
  const GB = new Builder(2, true), WB = new Builder(3, true);
  const s500 = surfBoxed.filter(({ box: b }) => b[0] < x1 && b[2] > x0 && b[1] < y1 && b[3] > y0).map(({ p }) => p);
  const s: { layer: string; rings: Ring[]; deck?: number }[] = [];
  for (const p of s500) {
    const rings = p.rings.map((r) => clip(r, x0, y0, x1, y1)).filter((r, i) => (i === 0 ? r.length >= 3 : r.length >= 3));
    if (rings.length && rings[0].length >= 3) s.push({ layer: p.layer, rings, deck: p.deck });
  }
  const LAT = lod === 0 ? 2 : lod === 1 ? 5 : 12.5;
  const DEN = lod === 0 ? 4 : lod === 1 ? 10 : 25;
  const water = s.filter((p) => p.layer === "water");
  const level = water.length ? median(water.map((p) => pieceLevel(p.rings)).filter((l) => !isNaN(l))) : NaN;
  // the ground's vertex colour carries the street round it to the shader (world/shaders GROUND): r = metres in
  // from the building line over 12, g and b = cos and sin of twice the street's direction; a = the surface kind
  const col = (code: number, x: number, y: number) => {
    const st = streetAt(x, y);
    const inFrom = Number.isFinite(st.d) ? Math.max(0, Math.min(1, (st.hw - st.d) / 12)) : 1;
    // the direction as a doubled angle, so a junction's vertices blend without a seam at 0/pi
    return [Math.round(inFrom * 255), Math.round(((Math.cos(2 * st.ang) + 1) / 2) * 255), Math.round(((Math.sin(2 * st.ang) + 1) / 2) * 255), code];
  };
  // the lattice: the carriageway everywhere, carved under the water (and under a deck gone in 1917, which is river)
  const n = Math.round((x1 - x0) / LAT) + 1;
  const z = new Float32Array(n * n), base = GB.count;
  const wetAt = (x: number, y: number) => raster.at(x, y) === CLS.water || gone(x, y) || spanned(x, y);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = x0 + i * LAT, y = y0 + j * LAT, wet = wetAt(x, y), lv = wet ? levelAt(x, y) : NaN;
    z[j * n + i] = !isNaN(lv) ? lv - 2.5 : wet && !isNaN(level) ? level - 2.5 : g(x, y);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, x = x0 + i * LAT, y = y0 + j * LAT;
    const dx = (z[j * n + Math.min(n - 1, i + 1)] - z[j * n + Math.max(0, i - 1)]) / (2 * LAT);
    const dy = (z[Math.min(n - 1, j + 1) * n + i] - z[Math.max(0, j - 1) * n + i]) / (2 * LAT);
    const l = Math.hypot(dx, dy, 1), wet = wetAt(x, y);
    const hw = halfWidth(x, y);
    GB.vertex(P(x, y, z[k]), N(-dx / l, -dy / l, 1 / l), col(wet ? GSURF.bed : hw >= 9 ? GSURF.asphalt : GSURF.setts, x, y), [x - 389000, y - 5817000]);
  }
  for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++) {
    const a = base + j * n + i;
    GB.tri(a, a + 1, a + n + 1);
    GB.tri(a, a + n + 1, a + n);
  }
  const drape = (b: Builder, rings: Ring[], lift: number, code: number, fixed?: number | ((x: number, y: number) => number)) => {
    const o = orient(rings, 0.05);
    if (o[0].length < 3) return;
    const { flat, tris } = triangulate(o.map((r) => densify(r, DEN)));
    const b0 = b.count;
    const h = typeof fixed === "function" ? fixed : (x: number, y: number) => fixed ?? g(x, y);
    for (const [x, y] of flat) b.vertex(P(x, y, h(x, y) + lift), [0, 1, 0], col(code, x, y), [x - 389000, y - 5817000]);
    for (let t = 0; t < tris.length; t += 3) b.tri(b0 + tris[t], b0 + tris[t + 1], b0 + tris[t + 2]);
  };
  const onBorder = (a: Pt, c: Pt) => (Math.abs(a[0] - c[0]) < 1e-6 && (Math.abs(a[0] - x0) < 1e-3 || Math.abs(a[0] - x1) < 1e-3)) || (Math.abs(a[1] - c[1]) < 1e-6 && (Math.abs(a[1] - y0) < 1e-3 || Math.abs(a[1] - y1) < 1e-3));
  /** vertical faces along a ring's edges, facing into the polygon (inward) or out of it */
  const walls = (b: Builder, rings: Ring[], bot: (x: number, y: number) => number, top: (x: number, y: number) => number, code: number, inward: boolean, keep?: (mx: number, my: number, nx: number, ny: number) => boolean) => {
    for (const r of orient(rings, 0.05)) for (let i = 0; i < r.length; i++) {
      const a = r[i], c = r[(i + 1) % r.length];
      if (onBorder(a, c)) continue;
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (L < 0.05) continue;
      let nx = (c[1] - a[1]) / L, ny = -(c[0] - a[0]) / L;
      if (keep && !keep((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, nx, ny)) continue;
      const [p, q] = inward ? [c, a] : [a, c];
      if (inward) (nx = -nx), (ny = -ny);
      b.quad(P(p[0], p[1], bot(p[0], p[1])), P(q[0], q[1], bot(q[0], q[1])), P(q[0], q[1], top(q[0], q[1])), P(p[0], p[1], top(p[0], p[1])), N(nx, ny), col(code, a[0], a[1]), [[0, 0], [L, 0], [L, 1], [0, 1]]);
    }
  };
  ARCHES.forEach((L, i) => {
    // the river under its arches, and its roadway over the whole crossing, face to face (the deck's own pieces are
    // notched where the street's run onto its ends, and the river is open under those too)
    const r = clip(archRect(L), x0, y0, x1, y1), lv = levelAt(...L.c);
    if (r.length >= 3 && !isNaN(lv)) drape(WB, [r], 0, 0, lv);
    const road = clip([L.at(L.s0, L.w0), L.at(L.s1, L.w0), L.at(L.s1, L.w1), L.at(L.s0, L.w1)], x0, y0, x1, y1);
    if (road.length >= 3) drape(GB, [road], 0, GSURF.bridge, ARCH_TOP[i].top);
  });
  for (const p of s) {
    // a sidewalk or kerb on a deck gone in 1917 is river now
    if ((p.layer === "sidewalk" || p.layer === "carriage") && !isNaN(level) && gone(...centroid(p.rings[0]))) continue;
    if (p.layer === "sidewalk") drape(GB, p.rings, 0.15, GSURF.sidewalk);
    else if (p.layer === "courtyard") drape(GB, p.rings, 0.03, GSURF.court);
    else if (p.layer === "green") drape(GB, p.rings, 0.05, GSURF.green);
    else if (p.layer === "rail") drape(GB, p.rings, 0.04, GSURF.rail);
    else if (p.layer === "carriage" && lod < 2) walls(GB, p.rings, (x, y) => g(x, y) - 0.05, (x, y) => g(x, y) + 0.15, GSURF.kerb, true);
    else if (p.layer === "water" && !isNaN(pieceLevel(p.rings))) {
      // walled only where it meets land: not along a deck gone in 1917, which is the same river
      const pl = pieceLevel(p.rings);
      drape(WB, p.rings, 0, 0, pl);
      walls(GB, p.rings, () => pl - 2.5, (x, y) => Math.max(pl + 0.3, g(x, y)), GSURF.quay, true, (mx, my, nx, ny) => !gone(mx + nx * 1.5, my + ny * 1.5) && !spanned(mx + nx * 1.5, my + ny * 1.5));
    } else if (p.layer === "bridge" && gone(...centroid(p.rings[0])) && !isNaN(pieceLevel(p.rings))) {
      // a deck not standing in 1917: the river, walled where it meets land (1.5 m off the edge, outward: not water)
      const pl = pieceLevel(p.rings);
      drape(WB, p.rings, 0, 0, pl);
      walls(GB, p.rings, () => pl - 2.5, (x, y) => Math.max(pl + 0.3, g(x, y)), GSURF.quay, true, (mx, my, nx, ny) => {
        const x = mx + nx * 1.5, y = my + ny * 1.5;
        return raster.at(x, y) !== CLS.water && !gone(x, y);
      });
    } else if (p.layer === "bridge") {
      const zs = p.rings[0].map(([x, y]) => g(x, y)).sort((a, b) => a - b);
      const flat = Math.max(zs[Math.floor(zs.length * 0.9)], isNaN(level) ? -Infinity : level + 2.5);
      // the plan's figure where one reaches this deck (DECKS), else the old flat rule
      const ai = ARCHES.findIndex((L) => { const [sx, wx] = L.frame(...centroid(p.rings[0])); return sx >= L.s0 && sx <= L.s1 && wx >= L.w0 - 0.5 && wx <= L.w1 + 0.5; });
      const k = p.deck, top = ai >= 0 ? ARCH_TOP[ai].top : k !== undefined && DECKS[k].land.length ? (x: number, y: number) => deckAt(k, x, y) : () => flat;
      if (ai < 0) {
        drape(GB, p.rings, 0, GSURF.bridge, top);
        walls(GB, p.rings, (x, y) => top(x, y) - 1.2, top, GSURF.bridge, false);
      }
    }
  }
  return { ground: GB, water: WB, level };
}


// ---------- dressing (world/SOP.md §5.3): where the street's fixed things stand ----------
// Placements are [x, y, z, yaw, scale, seed] in the scene frame; props.ts models each kind. Rules, not hands:
//   gas-lantern  every 34 m of street, sides staggered, 0.45 m in from the kerb (catalogue: "about every 30-40 m")
//   arc-lamp     Leipziger Straße and Potsdamer/Leipziger Platz only (sourced: 36 Siemens lamps from 1882); masts
//                every 40 m, staggered; their exact stations are ours (plausible)
//   litfass      at a corner of about half the crossings of streets 18 m wide or more, few of the smaller ones
//   pump         one lamp slot in eight on the side streets (768 drinking pumps in 1900; the spacing is ours)
//   manhole      the map's sewer manholes (map/1917/sewer_points.geojson)
// The kerb comes from the real building line: the distance out from the centreline to the first building, less a
// sidewalk of 30% of it (2.5 to 5 m).
type Placed = number[];
const PROPS: Record<string, Placed[]> = { "gas-lantern": [], "arc-lamp": [], litfass: [], pump: [], manhole: [] };
const lineOut = (x: number, y: number, dx: number, dy: number, max = 45) => {
  for (let s = 0; s < max; s += 0.5) if (raster.at(x + dx * s, y + dy * s) === CLS.building) return s;
  return max;
};
const yawToward = (me: number, mn: number) => Math.atan2(me, -mn); // local +z turned to face map direction (me, mn)
const onStreet = (x: number, y: number) => raster.at(x, y) === CLS.street;
// Leipziger Straße's axis from its labels (map/1917/labels.geojson: 390849,5819031 and 391212,5819055)
const LEIP = { x0: 390849, y0: 5819031, dx: 363, dy: 24 };
const isArc = (x: number, y: number, ang: number) => {
  const L = Math.hypot(LEIP.dx, LEIP.dy), ux = LEIP.dx / L, uy = LEIP.dy / L;
  const t = (x - LEIP.x0) * ux + (y - LEIP.y0) * uy, off = Math.abs((x - LEIP.x0) * -uy + (y - LEIP.y0) * ux);
  const along = Math.abs(Math.cos(ang - Math.atan2(uy, ux))) > 0.96;
  const potsdamer = Math.hypot(x - 389990, y - 5818955) < 150; // Potsdamer and Leipziger Platz (ours: the radius)
  return (along && off < 22 && t > -900 && t < 560) || potsdamer;
};
{
  let slot = 0;
  for (const e of streets.edges as { pts: number[][] }[]) {
    const pts = e.pts;
    if (pts.length < 2) continue;
    let run = 0, next = 10, k = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay, ha] = pts[i], [bx, by] = pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay);
      if (L > 400) break;
      const ux = (bx - ax) / L, uy = (by - ay) / L, ang = Math.atan2(uy, ux);
      while (next <= run + L) {
        const t = next - run, x = ax + ux * t, y = ay + uy * t;
        const arc = ha >= 9 && isArc(x, y, ang);
        const side = k % 2 ? 1 : -1;
        const nx = uy * side, ny = -ux * side;
        const B = lineOut(x, y, nx, ny);
        k++;
        next += arc ? 40 : 34;
        if (B >= 45 || B < 3) continue;
        const sw = Math.max(2.5, Math.min(5, B * 0.3)), off = B - sw + 0.45;
        const px = x + nx * off, py = y + ny * off;
        if (!onStreet(px, py)) continue;
        const sd = hash(Math.round(px), Math.round(py), 31);
        PROPS[arc ? "arc-lamp" : "gas-lantern"].push([...P(px, py, stand(px, py)), yawToward(-nx, -ny), 1, sd]);
        if (!arc && ha < 9 && slot++ % 8 === 3) {
          const qx = px + ux * 4, qy = py + uy * 4;
          if (onStreet(qx, qy)) PROPS.pump.push([...P(qx, qy, stand(qx, qy)), yawToward(-nx, -ny), 1, sd]);
        }
      }
      run += L;
    }
  }
  // crossings: nodes where three or more edges meet
  const deg = new Map<number, { hw: number; dirs: number[] }>();
  for (const e of streets.edges as { a: number; b: number; pts: number[][] }[]) {
    if (e.pts.length < 2) continue;
    for (const [nid, p0, p1] of [[e.a, e.pts[0], e.pts[1]], [e.b, e.pts[e.pts.length - 1], e.pts[e.pts.length - 2]]] as [number, number[], number[]][]) {
      const d = deg.get(nid) ?? { hw: 0, dirs: [] };
      d.hw = Math.max(d.hw, p0[2]);
      d.dirs.push(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
      deg.set(nid, d);
    }
  }
  for (const nd of streets.nodes as { id: number; x: number; y: number }[]) {
    const d = deg.get(nd.id);
    if (!d || d.dirs.length < 3) continue;
    // ~1 column per 8 ha of the slice ("many hundreds" in the whole city by 1899): every big crossing, few small ones
    if (d.dirs.length < 3 || (d.hw < 9 ? hash(nd.id, 77) > 0.06 : hash(nd.id, 77) > 0.55)) continue;
    const dirs = [...d.dirs].sort((a, b) => a - b);
    const c = Math.floor(hash(nd.id, 78) * dirs.length);
    const a0 = dirs[c], a1 = c + 1 < dirs.length ? dirs[c + 1] : dirs[0] + 2 * Math.PI;
    const bis = (a0 + a1) / 2, bx = Math.cos(bis), by = Math.sin(bis);
    const B = lineOut(nd.x, nd.y, bx, by, 60);
    if (B >= 60) continue;
    const px = nd.x + bx * (B - 2.3), py = nd.y + by * (B - 2.3);
    if (onStreet(px, py)) PROPS.litfass.push([...P(px, py, stand(px, py)), hash(nd.id, 79) * Math.PI * 2, 1, hash(nd.id, 80)]);
  }
  for (const f of (await readLayer("sewer_points")) as any[]) {
    if (f.properties.kind !== "manhole") continue;
    const [x, y] = f.geometry.coordinates;
    if (raster.at(x, y) !== CLS.street) continue;
    PROPS.manhole.push([...P(x, y, stand(x, y) + 0.005), hash(Math.round(x), Math.round(y), 5) * Math.PI * 2, 1, hash(Math.round(x), 9)]);
  }
  // the courts (map/1917/open.geojson "courtyard", 40 m2 and more), dressed by raea-fb's rule (interiors/yard.ts
  // dressCourt): its walls in the court's frame (metres from its first vertex, x east, z south), the passage the wall
  // whose outward ray crosses the least house (at most 25 m) before it reaches a street, -1 for a closed court
  let courts = 0, closed = 0;
  for (const f of open) {
    if (f.properties.kind !== "courtyard" || (f.properties.area_m2 ?? 0) < 40) continue;
    for (const rings of polys(f.geometry)) {
      const ring = openRing(rings[0].map(([x, y]: number[]) => [x, y] as Pt));
      if (ring.length < 3) continue;
      const [e0, n0] = ring[0], area = Math.abs(area2(ring)) / 2;
      const ccw = area2(ring) > 0;
      let passage = -1, best = 25.01;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], c = ring[(i + 1) % ring.length], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
        if (L < 2) continue;
        // outward: right of the edge's direction for a counter-clockwise ring
        const nx = ((ccw ? 1 : -1) * (c[1] - a[1])) / L, ny = ((ccw ? 1 : -1) * -(c[0] - a[0])) / L;
        const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2;
        for (let d = 0.6; d < best; d += 0.5) {
          const k = raster.at(mx + nx * d, my + ny * d);
          if (k === CLS.building) continue;
          if (k === CLS.street) (best = d), (passage = i);
          break;
        }
      }
      const edges = ring.map(([x, y]) => [x - e0, -(y - n0)] as [number, number]);
      const seed = Math.floor(hash(Math.round(e0 * 10), Math.round(n0 * 10), 17) * 1e6);
      const places = dressCourt(edges, passage, area, seed, true);
      if (!places.length) continue;
      courts++;
      if (passage < 0) closed++;
      for (const pl of places) {
        const e = e0 + pl.at[0], n = n0 - pl.at[2];
        (PROPS[pl.prop] ??= []).push([...P(e, n, stand(e, n) + pl.at[1]), pl.yaw, 1, hash(Math.round(e * 10), Math.round(n * 10), 23)]);
      }
    }
  }
  console.log(`courts dressed: ${courts} (${closed} closed, no passage found)`);
  // the trees (map/1917/trees.geojson, the map lane's: crowns read from the 1928 aerial, each its crown_d_m): each a
  // bare December lime (tools/world/trees.ts, three seeded crowns about 13.5 m across and 18 m tall), scaled to the
  // layer's height where it gives one, else to its crown (its height follows the mesh's proportion: assumed), within
  // 0.35-1.0 (a reading under 5 m across is more often a young tree or the reading's noise). A tree of another
  // species still gets a lime's crown for now, and the log counts them
  const treesFile = Bun.file(`${map}/trees.geojson`);
  if (await treesFile.exists()) {
    let n = 0, other = 0, filled = 0;
    const feats = (await treesFile.json()).features as any[];
    for (const f of feats) {
      if (f.geometry?.type !== "Point") continue;
      const [x, y] = f.geometry.coordinates as number[];
      if (x < BX0 || x > BX1 || y < BY0 || y > BY1 || !growsAt(x, y)) continue;
      const sp = String(f.properties?.species ?? f.properties?.genus ?? "");
      if (sp && !/tilia|linde|lime/i.test(sp)) other++;
      const h = Number(f.properties?.height_m), d = Number(f.properties?.crown_d_m), k = Math.floor(hash(Math.round(x * 10), Math.round(y * 10), 31) * 3);
      const scale = Math.max(0.35, Math.min(1.0, h ? h / 18 : d ? d / 13.5 : 0.8));
      (PROPS[`lime-bare-${k}`] ??= []).push([...P(x, y, stand(x, y)), hash(Math.round(x * 10), Math.round(y * 10), 37) * Math.PI * 2, +scale.toFixed(2), k]);
      n++;
    }
    // the park pieces of closed canopy (kind "canopy", each its canopy_share): there the points are lumps of one
    // canopy, not trees, so each piece is planted up to its share, counting the points already in it. A grown park
    // tree's crown taken as 9 m across (the layer's p90 crown, 64 m²; ASSUMED), its trees at random seeded spots
    const CANOPY_CROWN = 64;
    const pts = feats.filter((f) => f.geometry?.type === "Point").map((f) => f.geometry.coordinates as number[]);
    for (const f of feats) {
      if (f.properties?.kind !== "canopy" || f.geometry?.type !== "Polygon") continue;
      const r = (f.geometry.coordinates[0] as number[][]).map(([x, y]) => [x, y] as Pt);
      const bx0 = Math.min(...r.map((q) => q[0])), by0 = Math.min(...r.map((q) => q[1])), bx1 = Math.max(...r.map((q) => q[0])), by1 = Math.max(...r.map((q) => q[1]));
      if (bx1 < BX0 || bx0 > BX1 || by1 < BY0 || by0 > BY1) continue;
      const area = Number(f.properties.area_m2) || Math.abs(r.reduce((a, q, i) => a + q[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * q[1], 0)) / 2;
      const have = pts.filter(([x, y]) => x >= bx0 && x <= bx1 && y >= by0 && y <= by1 && inRing(x, y, r)).length;
      let need = Math.round((area * (Number(f.properties.canopy_share) || 0)) / CANOPY_CROWN) - have;
      for (let t = 0; need > 0 && t < need * 20; t++) {
        const x = bx0 + hash(Math.round(bx0), Math.round(by0), 211 + t) * (bx1 - bx0), y = by0 + hash(Math.round(by0), Math.round(bx0), 307 + t) * (by1 - by0);
        if (x < BX0 || x > BX1 || y < BY0 || y > BY1 || !inRing(x, y, r) || !growsAt(x, y)) continue;
        const k = Math.floor(hash(Math.round(x * 10), Math.round(y * 10), 31) * 3), scale = 0.6 + hash(Math.round(x * 10), Math.round(y * 10), 41) * 0.25;
        (PROPS[`lime-bare-${k}`] ??= []).push([...P(x, y, stand(x, y)), hash(Math.round(x * 10), Math.round(y * 10), 37) * Math.PI * 2, +scale.toFixed(2), k]);
        need--, filled++;
      }
    }
    console.log(`trees: ${n} placed from crowns, ${filled} more filling the canopy pieces to their share${other ? ` (${other} not limes, drawn as limes for now)` : ""}`);
  }
  for (const k of Object.keys(PROPS)) for (const p of PROPS[k]) for (let i = 0; i < 4; i++) p[i] = Math.round(p[i] * 100) / 100;
  console.log(`dressing: ${Object.entries(PROPS).map(([k, v]) => `${v.length} ${k}`).join(", ")}`);
}

// the 1917 tram ways (map/1917/trams.geojson): a way drawn as one line on a street is a double track, its pairs
// 1.5 m either side (ours, the map lane's rule); a way drawn as a rail pair is one track. Rails: grooved, 1,435 mm.
const TRAMS: { pts: number[][]; offs: number[] }[] = [];
for (const f of (await readLayer("trams")) as any[]) {
  if (f.geometry.type !== "LineString") continue;
  const pair = String(f.properties.tracks ?? "").startsWith("one rail pair");
  TRAMS.push({ pts: f.geometry.coordinates, offs: pair ? [0] : [-1.5, 1.5] });
}
/** Rails into a tile's facade builder (LOD0 and 1), the contact wire and span wires too at LOD0. uv.y = -1 tells the
 *  facade shader to keep snow off (traffic keeps the rail heads bright). */
function railsInto(F: Builder, x0: number, y0: number, x1: number, y1: number, lod: Lod) {
  const HEAD = [150, 152, 156, 230], GROOVE = [20, 20, 22, 110], WIRE = [30, 30, 32, 110];
  for (const tw of TRAMS) {
    for (let i = 0; i + 1 < tw.pts.length; i++) {
      const [ax, ay] = tw.pts[i], [bx, by] = tw.pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay);
      if (L < 0.01) continue;
      const ux = (bx - ax) / L, uy = (by - ay) / L, nx = uy, ny = -ux;
      const steps = Math.max(1, Math.ceil(L / 3));
      for (let k = 0; k < steps; k++) {
        const t0 = (k / steps) * L, t1 = ((k + 1) / steps) * L;
        const mx = ax + ux * (t0 + t1) / 2, my = ay + uy * (t0 + t1) / 2;
        if (mx < x0 || mx >= x1 || my < y0 || my >= y1) continue;
        for (const c of tw.offs) for (const r of [-0.7175, 0.7175]) {
          // the head (6.5 cm) and its groove (3 cm) on the inner side
          for (const [w0, w1, col] of [[0, 0.065, HEAD], [r < 0 ? 0.065 : -0.03, r < 0 ? 0.095 : 0, GROOVE]] as [number, number, number[]][]) {
            const o0 = c + r + (r < 0 ? w0 : -w1), o1 = c + r + (r < 0 ? w1 : -w0);
            const p = (t: number, o: number) => { const x = ax + ux * t + nx * o, y = ay + uy * t + ny * o; return P(x, y, g(x, y) + 0.012); };
            F.quad(p(t0, o1), p(t1, o1), p(t1, o0), p(t0, o0), [0, 1, 0], col, [[t0, -1], [t1, -1], [t1, -1], [t0, -1]]);
          }
        }
        if (lod !== 0) continue;
        for (const c of tw.offs) {
          // the contact wire, 5.8 m over the track's centre: a 1.2 cm strip seen from below and from the side
          const p = (t: number, o: number, h: number) => { const x = ax + ux * t + nx * o, y = ay + uy * t + ny * o; return P(x, y, g(x, y) + h); };
          F.quad(p(t0, c - 0.006, 5.8), p(t1, c - 0.006, 5.8), p(t1, c + 0.006, 5.8), p(t0, c + 0.006, 5.8), [0, -1, 0], WIRE, [[t0, -1], [t1, -1], [t1, -1], [t0, -1]]);
          F.quad(p(t0, c, 5.794), p(t1, c, 5.794), p(t1, c, 5.806), p(t0, c, 5.806), N(nx, ny), WIRE, [[t0, -1], [t1, -1], [t1, -1], [t0, -1]]);
        }
        // a span wire every 36 m, wall to wall (rosettes on the facades), where the street is narrow enough
        const at = Math.floor((ax * 0.37 + ay * 0.11 + t0) / 36) !== Math.floor((ax * 0.37 + ay * 0.11 + t1) / 36);
        if (at) {
          const Bl = lineOut(mx, my, nx, ny, 26), Br = lineOut(mx, my, -nx, -ny, 26);
          if (Bl < 26 && Br < 26) {
            const p = (o: number, h: number) => { const x = mx + nx * o, y = my + ny * o; return P(x, y, g(mx, my) + h); };
            F.quad(p(-Br, 6.4), p(Bl, 6.4), p(Bl, 6.412), p(-Br, 6.412), N(ux, uy), WIRE, [[0, -1], [1, -1], [1, -1], [0, -1]]);
            F.quad(p(Bl, 6.4), p(-Br, 6.4), p(-Br, 6.412), p(Bl, 6.412), N(-ux, -uy), WIRE, [[0, -1], [1, -1], [1, -1], [0, -1]]);
          }
        }
      }
    }
  }
}

// ---------- materials ----------
// Six draws a tile: every opaque built surface, the shop/stair/cellar/door panes, the ground, the water, the room
// panes (front, court and dormer windows with a room behind: raea-fb's windowTileWgsl, uv = pane-local 0..1 from the
// sill, colour = facade.ts paneColor), and at LOD0 the shop signs' letters (facade.ts GLYPHS, uv in the font atlas). The shaders tell the kinds apart by the vertex colour's alpha (facade.ts SURF
// and GLASS, GSURF above).
const MATS: Material[] = [
  { name: "facade", color: [1, 1, 1, 1], roughness: 0.85 },
  { name: "glass", color: [1, 1, 1, 1], roughness: 0.08 },
  { name: "ground", color: [1, 1, 1, 1], roughness: 0.9 },
  { name: "water", color: [0.03, 0.05, 0.06, 1], roughness: 0.05 },
  { name: "rooms", color: [1, 1, 1, 1], roughness: 0.06 },
  { name: "signs", color: [1, 1, 1, 1], roughness: 0.55 },
];
// raea-fb's shop signs and the font they're lettered in (tools/interiors/windows.ts names each shop pane's part)
SIGNS.list = (await Bun.file(`${root}/assets/signs/signs.json`).json()).signs;
SIGNS.font = await Bun.file(`${root}/assets/signs/font.json`).json();

// ---------- tiles ----------
type TileRec = { tile: string; bbox: number[]; center: number[]; buildings: number; lods: { lod: Lod; file: string; tris: number; draws: number; bytes: number }[]; waterLevel: number | null; rail?: boolean; colliders: { building: string; ring: number[][]; base: number; top: number }[]; props: Record<string, number[][]>; doors: DoorRec[]; walks: number[][][]; queues: { door: string; at: number[]; along: number[] }[] };

/** Sidewalk centrelines: each street skeleton edge offset to both sides by its half-width less 2.2 m (the building
 *  line is the skeleton's half-width out; Berlin sidewalks are 3 to 5 m), cut to the tile, in the scene frame. */
function walksIn(x0: number, y0: number, x1: number, y1: number): number[][][] {
  const out: number[][][] = [];
  for (const e of streets.edges as { pts: number[][] }[]) {
    for (const side of [1, -1]) {
      let run: number[][] = [];
      for (let i = 0; i < e.pts.length; i++) {
        const [x, y, hw] = e.pts[i];
        const a = e.pts[Math.max(0, i - 1)], b = e.pts[Math.min(e.pts.length - 1, i + 1)];
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const off = Math.max(1.2, hw - 2.2) * side;
        const px = x + ((b[1] - a[1]) / L) * off, py = y - ((b[0] - a[0]) / L) * off;
        const inside = px >= x0 && px < x1 && py >= y0 && py < y1 && raster.at(px, py) !== CLS.building;
        if (inside) run.push(P(px, py, stand(px, py)).map((v) => Math.round(v * 100) / 100));
        if ((!inside || i === e.pts.length - 1) && run.length > 1) out.push(run);
        if (!inside) run = [];
      }
    }
  }
  return out;
}
const index: TileRec[] = [];
/** Every chimney stack's top in the slice (facade.ts ChimRec): where City's smoke rises from. */
const CHIMNEYS: number[][] = [];
await Bun.$`mkdir -p ${outDir}`;
const tiles: [number, number][] = [];
for (let x = BX0; x < BX1; x += TILE) for (let y = BY0; y < BY1; y += TILE) {
  if (only && (x + TILE <= only[0] || x >= only[2] || y + TILE <= only[1] || y >= only[3])) continue;
  tiles.push([x, y]);
}
const byTile = new Map<string, number[]>();
blds.forEach((b, i) => {
  const k = `${Math.floor((b.cx - BX0) / TILE)},${Math.floor((b.cy - BY0) / TILE)}`;
  (byTile.get(k) ?? byTile.set(k, []).get(k)!).push(i);
});
let failed = 0;
for (const [x0, y0] of tiles) {
  const name = `${Math.round(x0 / 10)}_${Math.round(y0 / 10)}`;
  const dir = `${outDir}/${name}`;
  await Bun.$`mkdir -p ${dir}`;
  const fine = wantLod0(x0, y0);
  const ids = byTile.get(`${Math.floor((x0 - BX0) / TILE)},${Math.floor((y0 - BY0) / TILE)}`) ?? [];
  const lodOut = (): Out => {
    const o = { facade: new Builder(0, true), glass: new Builder(1, true), rooms: new Builder(4, true), signs: new Builder(5, true) };
    ROOMS.set(o.glass, o.rooms);
    GLYPHS.set(o.facade, o.signs);
    return o;
  };
  const out: Record<Lod, Out> = { 0: lodOut(), 1: lodOut(), 2: lodOut() };
  const colliders: TileRec["colliders"] = [];
  REC.on = true;
  REC.panes = [];
  REC.doors = [];
  REC.chimneys = [];
  // raea-fb's room and trade for each pane of this tile, by pane id (none yet for a new tile: the hash stands in)
  const assign = Bun.file(`${root}/assets/interiors/windows/${name}.json`);
  ASSIGN.panes = new Map(Object.entries((await assign.exists()) ? await assign.json() : {}));
  // a department store's front: an edge with any pane raea-fb gives a store's room (facade.ts STORE, storeFront)
  STORE.edges = new Set([...ASSIGN.panes].filter(([, a]) => STORE_ROOMS.has(a.recipe)).map(([id]) => id.replace(/^b(.+-e\d+)-f\d+-k\d+$/, "$1")));
  STORE.keys = new Set([...STORE.edges].map((e) => e.replace(/-e\d+$/, "")));
  for (const i of ids) {
    const bd = classify(blds[i], i + 1);
    REC.key = bd.key;
    const built = building(bd, out, fine ? [0, 1] : [1]);
    // LOD2 from the footprint simplified to 1.5 m (classified again, so its edges keep their kinds); same seeds
    const s2 = simplify(blds[i].rings[0], 1.5);
    const bd2 = s2.length >= 3 && s2.length < bd.ring.length ? classify({ ...blds[i], rings: [s2] }, i + 1) : bd;
    REC.on = false;
    building(bd2, out, [2]);
    REC.on = true;
    colliders.push({ building: bd.key, ring: bd.ring.map(([x, y]) => [+(x - 391000).toFixed(2), +(-(y - 5819000)).toFixed(2)]), base: +((bd.foot ?? bd.base) - 0.4).toFixed(2), top: +built.top.toFixed(2) });
  }
  REC.on = false;
  for (const lod of (fine ? [0, 1] : [1]) as Lod[]) railsInto(out[lod].facade, x0, y0, x0 + TILE, y0 + TILE, lod);
  const panes: PaneRec[] = REC.panes, doors: DoorRec[] = REC.doors;
  CHIMNEYS.push(...REC.chimneys);
  const queues = doors.filter((d) => d.kind === "shop").map((d) => ({ door: d.id, at: d.pos.map((v, k) => Math.round((v + d.normal[k] * 0.9) * 100) / 100), along: d.along }));
  const rec: TileRec = { tile: name, bbox: [x0, y0, x0 + TILE, y0 + TILE], center: P(x0 + TILE / 2, y0 + TILE / 2, g(x0 + TILE / 2, y0 + TILE / 2)), buildings: ids.length, lods: [], waterLevel: null, colliders, props: Object.fromEntries(Object.entries(PROPS).map(([k, v]) => [k, v.filter((p) => { const e = p[0] + 391000, n = -p[2] + 5819000; return e >= x0 && e < x0 + TILE && n >= y0 && n < y0 + TILE; })])), doors, walks: walksIn(x0, y0, x0 + TILE, y0 + TILE), queues };
  for (const lod of (fine ? [0, 1, 2] : [1, 2]) as Lod[]) {
    const gr = groundTile(x0, y0, x0 + TILE, y0 + TILE, lod);
    if (!isNaN(gr.level)) rec.waterLevel = +gr.level.toFixed(2);
    const parts = [out[lod].facade.part(), out[lod].glass.part(), gr.ground.part(), gr.water.part(), out[lod].rooms!.part(), out[lod].signs!.part()].filter(Boolean) as any[];
    const nodes: Node[] = [{ name: `${name}-lod${lod}`, parts }];
    const glb = writeGlb(nodes, MATS);
    const file = `lod${lod}.glb`;
    await put(`${dir}/${file}`, glb);
    const tris = parts.reduce((s, p) => s + p.indices.length / 3, 0);
    rec.lods.push({ lod, file, tris, draws: parts.length, bytes: glb.byteLength });
  }
  await put(`${dir}/tile.json`, JSON.stringify(rec));
  await put(`${dir}/windows.json`, JSON.stringify({ tile: name, frame: "scene (x east, y up, z south from E 391000 N 5819000)", panes }));
  index.push({ ...rec, colliders: [], props: {}, doors: [], walks: [], queues: [] });
  const line = rec.lods.map((l) => `lod${l.lod} ${(l.tris / 1000).toFixed(0)}k tris ${(l.bytes / 1048576).toFixed(1)} MB`).join(", ");
  try {
    checkTile(name, rec.lods.map((l) => ({ lod: l.lod, tris: l.tris, draws: l.draws, bytes: l.bytes })));
    console.log(`${name}: ${ids.length} buildings; ${line}`);
  } catch (e) {
    failed++;
    console.log(`${name}: ${ids.length} buildings; ${line}  OVER BUDGET`);
    if (!lenient) throw e;
  }
}
// the skyline: the landmarks' towers, domes and spires (map/1917/landmarks.geojson) as one mesh drawn at every distance
{
  const lm = (await Bun.file(`${map}/landmarks.geojson`).json()).features;
  const keys = new Set(lm.map((f: any) => f.properties.building));
  const rings = new Map<string, [number, number][]>();
  for (const f of (await Bun.file(`${map}/buildings.geojson`).json()).features) {
    if (!keys.has(f.properties.key)) continue;
    rings.set(f.properties.key, (f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]) as [number, number][]);
  }
  const sky = skyline(lm, rings, [BX0, BY0, BX1, BY1]);
  const part = sky.F.part();
  if (part) await put(`${outDir}/skyline.glb`, writeGlb([{ name: "skyline", parts: [part] }], MATS));
  console.log(`landmarks: ${sky.built.length} built (${sky.built.join(", ")}), ${(part?.indices.length ?? 0) / 3} tris; left out: ${sky.left.join(", ") || "none"}`);
}
// the Stadtbahn (map/1917/stadtbahn.geojson, tools/world/stadtbahn.ts): its brick, girders and the station hall's shell
// as one mesh drawn at every distance (stadtbahn.glb), its detail in each tile it crosses (<tile>/stadtbahn.glb, the
// tile's `rail`), drawn with that tile at its near levels
{
  const tileOf = (e: number, n: number) => `${Math.round((BX0 + Math.floor((e - BX0) / TILE) * TILE) / 10)}_${Math.round((BY0 + Math.floor((n - BY0) / TILE) * TILE) / 10)}`;
  const sb = stadtbahn((await Bun.file(`${map}/stadtbahn.geojson`).json()).features, [BX0, BY0, BX1, BY1], g, tileOf);
  const parts = (b: { F: Builder; G: Builder }) => [b.F.part(), b.G.part()].filter((x): x is NonNullable<typeof x> => x !== null);
  await put(`${outDir}/stadtbahn.glb`, writeGlb([{ name: "stadtbahn", parts: parts(sb) }], MATS));
  let held = 0;
  for (const [tile, b] of sb.detail) {
    const rec = index.find((t) => t.tile === tile);
    if (!rec) continue;
    await put(`${outDir}/${tile}/stadtbahn.glb`, writeGlb([{ name: `stadtbahn-${tile}`, parts: parts(b) }], MATS));
    rec.rail = true;
    held++;
  }
  console.log(`stadtbahn: ${sb.log}; detail in ${held} tiles`);
}
const BRIDGE_PARTS: NonNullable<ReturnType<Builder["part"]>>[] = [];
// what stood at the Spree crossing in 1917 (tools/world/bridges.ts): the Hilfsbrücke and the halted tunnel works,
// drawn at every distance (bridges.glb). The river's level there is its body's (levelAt, at the old axis's middle).
{
  const ax = BRIDGES.find((f) => f.properties.kind === "works" && f.properties.part === "old axis");
  if (ax) {
    const [a, b] = [ax.geometry.coordinates[0], ax.geometry.coordinates[ax.geometry.coordinates.length - 1]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const level = levelAt(m[0], m[1]);
    const wd = weidendammer(BRIDGES, g, level);
    const part = wd.F.part();
    if (part) BRIDGE_PARTS.push(part);
    console.log(`the Spree at Friedrichstraße (river at ${level.toFixed(2)} m, its body's): ${wd.log}`);
  }
  // the stone arch bridges, each on its deck's height by the bake's rule (its plan figure where one is within 40 m,
  // else the ground under it, at least 2.5 m over the water)
  ARCHES.forEach((L, i) => {
    const lv = levelAt(...L.c);
    if (isNaN(lv)) return console.log(`arch bridges: ${L.spec.name} has no water under it, not built`);
    const ab = archBridge(L, ARCH_TOP[i].top, lv), ap = ab.F.part();
    if (ap) BRIDGE_PARTS.push(ap);
    console.log(`arch bridges: ${ab.log}; river ${lv.toFixed(2)} m, its roadway by ${ARCH_TOP[i].by}`);
  });
  if (BRIDGE_PARTS.length) await put(`${outDir}/bridges.glb`, writeGlb([{ name: "bridges", parts: BRIDGE_PARTS }], MATS));
}
// what one street-level camera holds: the day test camera on Friedrichstraße, every tile at its level
{
  const [ce, cn] = [390733, 5818995];
  const held = index.flatMap((t) => {
    const [a, b, c, d] = t.bbox;
    const lod = lodFor(Math.hypot(Math.max(a - ce, 0, ce - c), Math.max(b - cn, 0, cn - d)), null);
    const l = lod === null ? undefined : t.lods.find((x) => x.lod === lod);
    return l ? [{ lod: l.lod, bytes: l.bytes }] : [];
  });
  const vb = viewBytes(held);
  console.log(`view from Friedrichstraße: ${held.filter((h) => h.lod === 0).length}/${held.filter((h) => h.lod === 1).length}/${held.filter((h) => h.lod === 2).length} tiles at LOD0/1/2, ${(vb / 1048576).toFixed(0)} MB of ${(VIEW_BYTES / 1048576).toFixed(0)} MB${vb > VIEW_BYTES ? "  OVER" : ""} (baked tiles only)`);
}
await put(`${outDir}/chimneys.json`, JSON.stringify({ frame: "scene", fields: ["x", "y", "z", "width"], chimneys: CHIMNEYS }));
await put(`${outDir}/props.json`, JSON.stringify({ frame: "scene", fields: ["x", "y", "z", "yaw", "scale", "seed"], props: PROPS }));
await put(`${outDir}/index.json`, JSON.stringify({ origin_epsg25833: [391000, 5819000], frame: "x east, y up (m NHN), z south", tileM: TILE, budget: TILE_BUDGET, tiles: index }, null, 0));
console.log(`baked ${tiles.length} tiles${failed ? `, ${failed} over budget` : ""} in ${((performance.now() - t0) / 1000).toFixed(1)} s -> ${outDir}`);
