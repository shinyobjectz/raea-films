// The people model's places from the baked world: every door in assets/world/friedrichstadt/<tile>/tile.json is a home
// (a house door) or a shop (its queue line the tile's), at the door's own ground height. A shop's trade is what its
// fascia says (`sign`: the world lane's window rows, assets/interiors/windows/<tile>.json, letter each shop's sign over
// its run of bays from assets/signs/signs.json, and the door takes the trade the camera reads over it, so the bread
// queue forms under BÄCKEREI), else the Adreßbuch's where the map has it (Leipziger Straße's storefronts), both read
// through research/catalogue/trades.ts; else drawn by a share and marked `share`. A house door holds the residents of
// the floor area behind it (residents()). A place the tiles don't carry but a source places is `sourced` (Markthalle
// II); the rest (the Works, depots, barracks, churches, schools, posts, beats, courtyards) are stand-ins, marked by id.
// Writes assets/people/places.json, which people/city.ts reads.
//   bun --tsconfig-override ~/raea/sdk/tsconfig.base.json tools/people/places.ts
import { rng, type Place, type V3 } from "raea/people";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TRADES } from "../../research/catalogue/trades.ts";

const G = join(import.meta.dir, "../..");
const W = join(G, "assets/world/friedrichstadt");
type Door = { id: string; kind: "house" | "shop"; pos: V3; normal: V3; along: V3; width: number };
type Tile = { tile: string; doors: Door[]; queues: { door: string; at: V3; along: V3 }[]; props?: Record<string, number[][]> };
type Row = { sign?: [number, number, number] };
const SIGNS = (JSON.parse(readFileSync(join(G, "assets/signs/signs.json"), "utf8")).signs as { lines: { text: string }[] }[]).map((g) => g.lines.map((l) => l.text).join(" "));
const tiles = (JSON.parse(readFileSync(join(W, "index.json"), "utf8")).tiles as { tile: string }[]).map((t) => JSON.parse(readFileSync(join(W, t.tile, "tile.json"), "utf8")) as Tile);

// Who lives behind each house door. The 1917 buildings (map/1917/buildings.geojson: footprint, storeys, the 1910 land
// use) give each building its floor area; a building's house doors share it, and a building with no street door (a
// Seitenflügel or Hinterhaus, which opened only onto its court: its people came and went by the front house's
// passage) goes to the house door it stands behind, the nearest within 90 m. The floor lived in by the 1910 use
// (LIVED: assumed shares; a public building, a works or the rail none), and the residents a square metre of it
// set so that the Friedrichstadt's house doors hold 38.4 people each on average: Eberstadt, Handbuch des
// Wohnungswesens (1910), Tabelle 1, from the Statistisches Jahrbuch der Stadt Berlin XXXI p. 147, residents to an
// inhabited plot in the Friedrichstadt in 1905 (falling as the City took it: 44.8 in 1867; Berlin's mean 77). A house
// door stands for a plot (its front house's), and the Friedrichstadt's bounds below are assumed.
const LIVED: Record<string, number> = { residential: 1, mixed: 0.5, core: 0.15 };
const FRIEDRICHSTADT = { x: [-800, 0], z: [-650, 900] }, PER_PLOT = 38.4;
function residents(): Map<string, number> {
  type F = { properties: { key: string; storeys: number; area_m2: number; use: string | null }; geometry: { type: string; coordinates: number[][][] | number[][][][] } };
  const feats = JSON.parse(readFileSync(join(G, "map/1917/buildings.geojson"), "utf8")).features as F[];
  // (the map's rebuild writes the buildings before tools/map/use1910.ts adds their use: wait for it, don't house no one)
  if (!feats.some((f) => f.properties.use)) throw new Error("places: map/1917/buildings.geojson has no `use` yet (the map's rebuild is between steps: rerun when tools/map/use1910.ts has run)");
  const doors = tiles.flatMap((t) => t.doors.filter((d) => d.kind === "house"));
  const byB = new Map<string, Door[]>();
  for (const d of doors) { const b = d.id.match(/^b(.+)-e\d+-d\d+$/)?.[1]; if (b) byB.set(b, [...(byB.get(b) ?? []), d]); }
  const floor = new Map<string, number>(doors.map((d) => [d.id, 0]));
  let behind = 0, lost = 0;
  for (const f of feats) {
    const p = f.properties, lived = p.area_m2 * p.storeys * (LIVED[p.use ?? ""] ?? 0);
    if (lived <= 0) continue;
    const own = byB.get(p.key);
    if (own) { for (const d of own) floor.set(d.id, floor.get(d.id)! + lived / own.length); continue; }
    const ring = (f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : (f.geometry.coordinates as number[][][][])[0][0]) as number[][];
    const cx = ring.reduce((a, q) => a + q[0], 0) / ring.length - 391000, cz = -(ring.reduce((a, q) => a + q[1], 0) / ring.length - 5819000);
    let best: Door | undefined, bd = 90;
    for (const d of doors) {
      const dx = cx - d.pos[0], dz = cz - d.pos[2], dd = Math.hypot(dx, dz);
      if (dd < bd && dx * d.normal[0] + dz * d.normal[2] < 0) { bd = dd; best = d; }
    }
    if (best) { floor.set(best.id, floor.get(best.id)! + lived); behind++; } else lost++;
  }
  const inF = doors.filter((d) => d.pos[0] >= FRIEDRICHSTADT.x[0] && d.pos[0] <= FRIEDRICHSTADT.x[1] && d.pos[2] >= FRIEDRICHSTADT.z[0] && d.pos[2] <= FRIEDRICHSTADT.z[1] && floor.get(d.id)! > 0);
  const m2 = inF.reduce((a, d) => a + floor.get(d.id)!, 0) / (PER_PLOT * inF.length);
  console.log(`places: ${behind} court buildings counted at the house door they stand behind (${lost} with none within 90 m); ${m2.toFixed(1)} m2 of floor lived in a resident (${inF.length} inhabited Friedrichstadt doors at ${PER_PLOT})`);
  return new Map([...floor].map(([id, a]) => [id, Math.round(a / m2)]));
}
const RESIDENTS = residents();

const r2 = (v: number) => Math.round(v * 100) / 100;
const v = (p: V3): V3 => [r2(p[0]), r2(p[1]), r2(p[2])];
const facingOf = (n: V3) => r2(Math.atan2(n[0], n[2]));

// Leipziger Straße's storefronts by trade, at their house's front (the scene frame: [e - 391000, h, -(n - 5819000)])
const KIND: Record<string, string> = {
  "shop-baker": "bakery", "shop-butcher": "butcher", "shop-greengrocer": "greengrocer", "shop-konditorei": "konditorei",
  "shop-destille": "destille", "shop-weinstube": "destille", "shop-aschinger": "destille", "office-room": "office",
};
const kindOf = (text: string) => { for (const [re, kit] of TRADES) if (re.test(text)) return KIND[kit] ?? "shop"; return "shop"; };
type House = { p: { front: [number, number][]; storefronts: { text: string }[] } };
const fronts = (JSON.parse(readFileSync(join(G, "compositions/leipziger-houses.json"), "utf8")).features as House[])
  .filter((h) => h.p.storefronts.length)
  .map((h) => { const [a, b] = h.p.front; return { x: (a[0] + b[0]) / 2 - 391000, z: -((a[1] + b[1]) / 2 - 5819000), half: Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, trades: h.p.storefronts.map((s) => kindOf(s.text)) }; });

// a tile's shops by their signs: per building edge, its signed ground-floor bays in order (b<building>-e<edge>-f0-k<bay>),
// each run of a sign's parts (the firm over the first bay, the trade over the next) one shop, its words joined
function signedShops(tile: string): Map<string, string[]> {
  let rows: Record<string, Row>;
  try { rows = JSON.parse(readFileSync(join(G, "assets/interiors/windows", `${tile}.json`), "utf8")); } catch { return new Map(); }
  const bays = new Map<string, [number, [number, number, number]][]>();
  for (const [id, row] of Object.entries(rows)) {
    const m = id.match(/^(b.+-e\d+)-f0-k(\d+)$/);
    if (m && row.sign) bays.set(m[1], [...(bays.get(m[1]) ?? []), [+m[2], row.sign]]);
  }
  const out = new Map<string, string[]>();
  for (const [edge, bs] of bays) {
    const shops: string[] = [];
    for (const [, [i, part]] of bs.sort((a, b) => a[0] - b[0])) {
      if (part === 0 || !shops.length) shops.push(SIGNS[i] ?? "");
      else shops[shops.length - 1] += ` ${SIGNS[i] ?? ""}`;
    }
    out.set(edge, shops);
  }
  return out;
}
// a sign whose words name no trade TRADES knows (a firm's name alone, "Ausschank" is known) is no trade: the next source
const tradeOf = (text: string) => { for (const [re, kit] of TRADES) if (re.test(text)) return KIND[kit] ?? "shop"; return undefined; };

// elsewhere a shop's trade by a share (Berlin's shops by trade are not mapped yet: a stand-in, marked)
// (the war kitchens, Kriegsküchen, fed a district from halls and shops: one in a hundred shop doors)
const SHARE: [string, number][] = [["bakery", 0.06], ["butcher", 0.04], ["greengrocer", 0.05], ["destille", 0.06], ["konditorei", 0.02], ["office", 0.07], ["war-kitchen", 0.01], ["shop", 0.69]];
const r = rng("gambit-places");
const pick = () => { let u = r.next(); for (const [k, s] of SHARE) { if ((u -= s) < 0) return k; } return "shop"; };

const INSIDE = new Set(["home", "bakery", "butcher", "greengrocer", "konditorei", "destille", "shop", "office", "works", "tram-depot", "barracks", "church", "school", "cinema", "war-kitchen", "guard-room", "market-hall"]);
type Out = Place & { src?: "adressbuch" | "share" | "stand-in" | "sign" | "sourced" };
const out: Out[] = [];
let mapped = 0, houses = 0, signed = 0;
for (const t of tiles) {
  const lines = new Map(t.queues.map((q) => [q.door, q]));
  // the shop doors of each building edge in order along it, paired with that edge's signed shops in order
  const shops = signedShops(t.tile), onEdge = new Map<string, Door[]>();
  for (const d of t.doors) { const e = d.id.match(/^(b.+-e\d+)-d\d+$/)?.[1]; if (d.kind === "shop" && e) onEdge.set(e, [...(onEdge.get(e) ?? []), d]); }
  const fascia = new Map<string, string>();
  for (const [e, ds] of onEdge) {
    const ss = shops.get(e); if (!ss?.length) continue;
    const dir = ds[0].along, at = (d: Door) => d.pos[0] * dir[0] + d.pos[2] * dir[2];
    ds.sort((a, b) => at(a) - at(b)).forEach((d, j) => fascia.set(d.id, ss[Math.min(j, ss.length - 1)]));
  }
  t.doors.forEach((d, i) => {
    const facing = facingOf(d.normal), at = v(d.pos);
    if (d.kind === "house") {
      houses++;
      // (a door no one lives behind, into a public building or a works, is no home)
      const n = RESIDENTS.get(d.id) ?? 0;
      if (n >= 1) out.push({ id: d.id, kind: "home", at, facing, holds: n, inside: true });
      // every fifth house door has its courtyard 18 m behind it; every twelfth a Schutzmann's beat at its kerb
      if (houses % 5 === 0) out.push({ id: `court-${d.id}`, kind: "hinterhof", at: v([d.pos[0] - d.normal[0] * 18, d.pos[1], d.pos[2] - d.normal[2] * 18]), facing: r2(facing + Math.PI), src: "stand-in" });
      if (houses % 12 === 0) out.push({ id: `beat-${d.id}`, kind: "beat-corner", at: v([d.pos[0] + d.normal[0] * 3.5, d.pos[1], d.pos[2] + d.normal[2] * 3.5]), facing, src: "stand-in" });
      // a Gemeindeschule behind every 150th house door, a church behind every 400th (stand-ins until the map has them)
      if (houses % 150 === 75) out.push({ id: `school-${d.id}`, kind: "school", at: v([d.pos[0] - d.normal[0] * 30, d.pos[1], d.pos[2] - d.normal[2] * 30]), facing, holds: 400, inside: true, src: "stand-in" });
      if (houses % 400 === 200) out.push({ id: `church-${d.id}`, kind: "church", at: v([d.pos[0] - d.normal[0] * 30, d.pos[1], d.pos[2] - d.normal[2] * 30]), facing, holds: 400, inside: true, src: "stand-in" });
      return;
    }
    // the Adreßbuch's storefront on this stretch of front, when the map has one (the k-th shop door of a front takes
    // its k-th storefront)
    const f = fronts.find((h) => Math.hypot(h.x - d.pos[0], h.z - d.pos[2]) <= h.half + 3);
    let kind: string, src: Out["src"];
    const fs = fascia.get(d.id), fk = fs !== undefined ? tradeOf(fs) : undefined;
    if (fk) { kind = fk; src = "sign"; signed++; }
    else if (f) { kind = f.trades[i % f.trades.length]; src = "adressbuch"; mapped++; } else { kind = pick(); src = "share"; }
    const q = lines.get(d.id);
    out.push({ id: d.id, kind, at, facing, holds: 3, inside: true, ...(q ? { line: { at: v(q.at), along: v(q.along) } } : {}), src });
  });
}

// the stand-ins (x, z in the scene frame), at the ground height of the nearest door
const STAND_IN: [string, string, number, number, number][] = [
  ["stand-in-works", "works", -80, 2470, 4000], ["stand-in-works-gate", "guard-post", -80, 2440, 6], ["stand-in-guard-bridge", "guard-post", 400, -900, 6],
  ["stand-in-guard-room", "guard-room", -80, 2455, 0], ["stand-in-tram-depot", "tram-depot", 1300, 1400, 400], ["stand-in-barracks", "barracks", -1200, -600, 400],
  ["stand-in-church-1", "church", 450, -150, 400], ["stand-in-church-2", "church", -500, 400, 400], ["stand-in-school-1", "school", 300, 350, 400],
  ["stand-in-school-2", "school", -400, -300, 400], ["stand-in-war-kitchen", "war-kitchen", 200, 500, 400], ["stand-in-cinema", "cinema", -300, -100, 400],
  ["stand-in-kiosk-1", "kiosk", -700, 30, 0], ["stand-in-kiosk-2", "kiosk", 900, 30, 0], ["stand-in-square", "square", 1300, 50, 0],
  ["stand-in-cab-1", "cab-rank", -850, 20, 0], ["stand-in-cab-2", "cab-rank", 1350, 60, 0],
];
// Markthalle II (the Lindenhalle), the district's market hall, inside the block north of Belle-Alliance-Platz, entered
// from Friedrichstraße 18 and Lindenstraße 97/98 (de.wikipedia "Markthalle II (Berlin)"; the 1917 Adreßbuch's
// Friedrichstraße 18, owner the City of Berlin, its flower and delicatessen stands and II. Fleischuntersuchungsstation;
// map/1917/businesses/friedrichstrasse.geojson). The 1917 buildings carry its hall (3909185_58181506, 10,093 m2, the
// 130 by 80 m of 550-746 stands); the open-air weekly markets on the squares had closed in 1886 when the halls opened.
// At house 18's street door, and at the hall's own door toward Lindenstraße (no. 97/98 there: assumed, the map has no
// Lindenstraße numbers yet).
const SOURCED: [string, string, string][] = [["market-hall-ii-friedrichstr", "market-hall", "b3908235_58181535-e19-d1"], ["market-hall-ii-lindenstr", "market-hall", "b3909185_58181506-e115-d3"]];
for (const [id, kind, door] of SOURCED) {
  const d = tiles.flatMap((t) => t.doors).find((x) => x.id === door);
  if (!d) { console.log(`places: ${id}: door ${door} not in the tiles`); continue; }
  out.push({ id, kind, at: v(d.pos), facing: facingOf(d.normal), inside: true, src: "sourced" });
}
// the tiles' Litfaß columns, where the official notices were posted in the war (catalogue litfass): a prop row is
// [x, y, z, yaw, ...]
for (const t of tiles) (t.props?.litfass ?? []).forEach((q, k) => out.push({ id: `litfass-${t.tile}-${k}`, kind: "litfass", at: v([q[0], q[1], q[2]]), facing: r2(q[3]) }));
const doors = out.filter((p) => p.kind === "home");
const groundAt = (x: number, z: number) => { let y = doors[0].at[1], bd = Infinity; for (const d of doors) { const dd = Math.hypot(d.at[0] - x, d.at[2] - z); if (dd < bd) { bd = dd; y = d.at[1]; } } return y; };
// squares: the Gendarmenmarkt in front of each Dom's portico, toward the Schauspielhaus (the Doms' towers in
// map/1917/landmarks.geojson at (-90, -468) and (-75, -283); both points open ground in buildings.geojson); and
// Belle-Alliance-Platz where Friedrichstraße meets it, south of no. 1's front (friedrichstrasse.geojson; the round
// Platz's own outline is not in the map yet)
const SQUARES: [string, number, number][] = [["square-gendarmenmarkt-n", -86, -421], ["square-gendarmenmarkt-s", -78, -329], ["square-belle-alliance", -165, 1175]];
for (const [id, x, z] of SQUARES) out.push({ id, kind: "square", at: [x, groundAt(x, z), z], facing: 0, src: "sourced" });
for (const [id, kind, x, z, holds] of STAND_IN) {
  let best = doors[0], bd = Infinity;
  for (const d of doors) { const dd = Math.hypot(d.at[0] - x, d.at[2] - z); if (dd < bd) { bd = dd; best = d; } }
  out.push({ id, kind, at: [x, best.at[1], z], facing: z > 0 ? r2(Math.PI) : 0, ...(holds ? { holds } : {}), ...(INSIDE.has(kind) ? { inside: true } : {}), src: "stand-in" });
}

// compact: a row a place, [kind, x, y, z, facing, holds, src, queue line x, z, along x, z] (inside follows from the kind;
// ids are the row's index, people/city.ts gives them back)
const kinds = [...new Set(out.map((p) => p.kind))], SRC = ["tile", "adressbuch", "share", "stand-in", "sign", "sourced"];
const rows = out.map((p) => {
  const row: (number | string)[] = [kinds.indexOf(p.kind), r2(p.at[0]), r2(p.at[1]), r2(p.at[2]), p.facing ?? 0, p.holds ?? 0, SRC.indexOf(p.src ?? "tile")];
  if (p.line) row.push(p.line.at[0], p.line.at[2], r2(p.line.along[0]), r2(p.line.along[2]));
  return row;
});
writeFileSync(join(G, "assets/people/places.json"), JSON.stringify({ about: "tools/people/places.ts: the people model's places from the baked tiles' doors and queue lines. A row: [kind, x, y, z, facing, holds, src, queue x, z, along x, z]", kinds, src: SRC, inside: [...INSIDE], rows }));
// a resident's family name is never given (world/SOP.md §4): every capitalised word the Adreßbuch prints on the mapped
// houses, for people/city.ts's Folk.avoid
const printed = new Set<string>();
const words = (t?: string | null) => { for (const w of (t ?? "").match(/[A-ZÄÖÜ][a-zäöüß]{2,}/g) ?? []) printed.add(w); };
for (const h of JSON.parse(readFileSync(join(G, "compositions/leipziger-houses.json"), "utf8")).features as { p: { owner?: string; storefronts: { text: string }[] } }[]) { words(h.p.owner); for (const s of h.p.storefronts) words(s.text); }
for (const f of JSON.parse(readFileSync(join(G, "map/1917/businesses/leipziger.geojson"), "utf8")).features) { words(f.properties.owner); for (const e of f.properties.entries ?? []) words(e.text); }
writeFileSync(join(G, "assets/people/avoid.json"), JSON.stringify({ about: "every capitalised word the Adreßbuch prints on the mapped houses: never a family name in the crowd (world/SOP.md §4); tools/people/places.ts", words: [...printed].sort() }));
const by = new Map<string, number>();
for (const p of out) by.set(p.kind, (by.get(p.kind) ?? 0) + 1);
console.log(`places: ${printed.size} printed words avoided as family names (assets/people/avoid.json)`);
console.log(`places: ${out.length} from ${tiles.length} tiles; ${signed} shop trades from their signs, ${mapped} from the Adreßbuch, ${out.filter((p) => p.src === "share").length} by share, ${STAND_IN.length} stand-ins, ${out.filter((p) => p.src === "sourced").length} sourced`);
const homes = out.filter((p) => p.kind === "home"), lives = homes.map((p) => p.holds ?? 0).sort((a, b) => a - b);
console.log(`places: ${homes.length} homes of ${houses} house doors, ${lives.reduce((a, b) => a + b, 0)} residents; a door's median ${lives[lives.length >> 1]}, 90th ${lives[Math.floor(lives.length * 0.9)]}, most ${lives[lives.length - 1]}`);
console.log(`places: ${[...by].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}`);
