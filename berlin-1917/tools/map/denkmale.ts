// What the listed monuments say about the 1917 city's buildings: for each monument in the slice (denkmale.sh), its
// entry's date, designer, kind and the facts its text states about the building as built, each kept with the sentence
// it comes from: storeys, roof form and covering, wall materials and their colour, style, and whether the building was
// rebuilt or stripped after the war (so today's front may not be the front of 1917). Each monument is joined to the
// 1917 buildings it covers (map/1917/buildings.geojson), by area on a 1 m grid.
// Facts are read by word lists, not by a model: a word in a sentence is evidence, not proof (a text may name the
// sandstone of a neighbour), so every fact keeps its sentence and the join says how much of each building it covers.
// The sentences are the Landesdenkmalamt's writing: they stay in cache/ (git-ignored) as the evidence to check a fact
// against, and the map layer carries only the facts and each entry's link.
//   bun tools/map/denkmale.ts      -> map/1917/denkmale.geojson (facts), cache/denkmale/evidence.json (sentences),
//                                     out/map/denkmale.txt
//   bun tools/map/denkmale.ts SHEET.json   a city sheet: cache/denkmale/sheets/NAME.json joined to the sheet's buildings,
//                                     -> its map dir's denkmale.geojson, cache/denkmale/evidence-NAME.json, out/map/denkmale-NAME.txt
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slicePaths } from "./paths";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const sheet = process.argv[2] ? await slicePaths(process.argv[2]) : null;
const P = sheet
  ? { list: `cache/denkmale/sheets/${sheet.slice.name}.json`, map: sheet.map, evidence: `cache/denkmale/evidence-${sheet.slice.name}.json`, txt: `out/map/denkmale-${sheet.slice.name}.txt` }
  : { list: "cache/denkmale/slice.json", map: join(root, "map/1917"), evidence: "cache/denkmale/evidence.json", txt: "out/map/denkmale.txt" };
const slice = await Bun.file(join(root, P.list)).json();
const blds = (await Bun.file(join(P.map, "buildings.geojson")).json()).features;

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß", eacute: "é", egrave: "è", bdquo: "„", ldquo: "“", rdquo: "”", sbquo: "‚", lsquo: "‘", rsquo: "’", hellip: "…" };
const text = (h: string) => h.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]*>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&(\w+);/g, (m, n) => ENT[n] ?? m).replace(/[ \t]+/g, " ").trim();

function page(id: string) {
  const f = join(root, "cache/denkmale/pages", `${id}.html`);
  if (!existsSync(f)) return null;
  const h = require("node:fs").readFileSync(f, "utf8") as string;
  const main = h.slice(h.indexOf("<h1>Denkmaldatenbank</h1>"));
  const title = text(main.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] ?? "");
  const rows: Record<string, string> = {};
  for (const m of main.matchAll(/<th scope="row">([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) { const k = text(m[1]); rows[k] = rows[k] ? rows[k] + "; " + text(m[2]) : text(m[2]); }
  const at = main.indexOf(`<div class="denkmal_detail_text">`), end = main.indexOf("Verkehrsanbindungen", at);
  const body = at < 0 ? "" : main.slice(at, end < 0 ? undefined : end);
  return { title, rows, body: text(body.split(/Literatur:/)[0]) };
}

const NUM: Record<string, number> = { ein: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwölf: 12 };
// Word lists: [fact, pattern]. Patterns are matched in one sentence at a time.
const WALL: [string, RegExp][] = [
  ["sandstone", /[Ss]andstein/], ["limestone", /Kalkstein|Muschelkalk|Travertin|Rogenkalk/], ["granite", /[Gg]ranit/], ["marble", /[Mm]armor/], ["basalt lava", /Basaltlava|Tuff/],
  ["render", /\b[Pp]utz|verputzt|Putzfassade|Putzbau/], ["stucco", /[Ss]tuck(?!ateur)/],
  ["brick", /[Bb]ackstein|[Zz]iegel(?!dach)|[Kk]linker|[Vv]erblend/], ["terracotta", /[Tt]errakott|[Tt]errakot/], ["glazed ceramic", /[Kk]eramik|[Mm]ajolik|[Gg]lasiert/],
  ["cast iron", /[Gg]u(ss|ß)eisen|[Ee]isenguss/], ["iron and glass", /[Ee]isen-?\s?(und|&)\s?[Gg]las|[Ss]tahl-?\s?(und|&)\s?[Gg]las|[Gg]lasdach/], ["steel frame", /[Ss]tahlskelett|[Ee]isenskelett|[Ss]kelettbau/],
];
const COLOUR: [string, RegExp][] = [["red", /\brote[nrms]?\b|\brot\b|[Rr]otziegel/], ["yellow", /\bgelbe[nrms]?\b|\bgelb\b/], ["grey", /\bgraue[nrms]?\b|\bgrau\b/], ["white", /\bweiße[nrms]?\b|\bweiß\b/], ["green", /\bgrün/]];
const ROOF: [string, RegExp][] = [
  ["mansard", /[Mm]ansard/], ["hipped", /[Ww]almdach/], ["gabled", /[Ss]atteldach/], ["flat", /[Ff]lachdach|flache[ns]? Dach/], ["lean-to", /[Pp]ultdach/], ["dome", /[Kk]uppel/], ["tower", /\b[Tt]urm|[Tt]ürm/],
  ["slate", /[Ss]chiefer/], ["copper", /[Kk]upfer/], ["zinc", /[Zz]ink/], ["tiles", /[Zz]iegeldach|[Bb]iberschwanz|[Dd]achziegel|[Pp]fannen/], ["wood cement", /[Hh]olzzement/],
];
const STYLE: [string, RegExp][] = [
  ["baroque", /\b[Bb]arock(?!is)/], ["neo-baroque", /[Nn]eobarock|[Nn]eubarock/], ["classicist", /[Kk]lassizis/], ["neo-renaissance", /[Nn]eorenaissance|[Nn]eurenaissance/], ["neo-gothic", /[Nn]eogoti|[Nn]eugoti/],
  ["romanesque revival", /[Nn]eoromani|[Rr]undbogenstil/], ["Jugendstil", /[Jj]ugendstil/], ["reform", /[Rr]eformarchitektur|[Rr]eformstil/], ["historicism", /[Hh]istoris/], ["Schinkel school", /[Ss]chinkelschule/],
  ["modern (after 1918)", /[Nn]eue[nr]? Sachlichkeit|[Ee]xpressionis|[Bb]auhaus/],
];
const AFTER: [string, RegExp][] = [
  ["war damage", /[Kk]riegs(schäd|zerstör|beschäd)|[Bb]omben|zerstört/], ["rebuilt", /[Ww]iederaufbau|wiederaufgebaut|[Rr]ekonstru/], ["stripped", /entstuckt|[Ee]ntstuckung|vereinfacht|abgeschlagen/],
  ["storeys added", /aufgestockt|[Aa]ufstockung/], ["demolished in part", /abgerissen|[Aa]bbruch/],
];

// Sentences end at . ! ? before a capital or a digit, but not after an abbreviation ("St. Hedwig", "Nr. 5", "z. B.").
const sentences = (t: string) => t.split(/(?<!\b(?:St|Nr|Dr|ca|bzw|vgl|usw|Jh|Jhs|Prof|Str|geb|gest|Abb|Abt|Kgl|ehem|sog|[A-Za-zÄÖÜäöü])\.)(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9])/).filter(Boolean);
const facts = (ss: string[], list: [string, RegExp][]) => {
  const out: { fact: string; sentence: string }[] = [];
  for (const [fact, re] of list) { const s = ss.find((x) => re.test(x)); if (s) out.push({ fact, sentence: s.length > 300 ? s.slice(0, 297) + "…" : s }); }
  return out;
};
function storeys(ss: string[]) {
  for (const s of ss) {
    const m = s.match(/\b(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|\d{1,2})[-\s]?(geschossig|stöckig)/i);
    if (m) return { n: NUM[m[1].toLowerCase()] ?? +m[1], sentence: s.length > 300 ? s.slice(0, 297) + "…" : s };
  }
  return null;
}

// Area join on a 1 m grid: share of each 1917 building inside the monument, and of the monument covered by it.
type Ring = number[][];
const rings = (g: any): Ring[] => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
const inside = (rs: Ring[], x: number, y: number) => { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const box = (rs: Ring[]) => { let a = [Infinity, Infinity, -Infinity, -Infinity]; for (const r of rs) for (const [x, y] of r) a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; return a; };
const bx = blds.map((f: any) => { const rs = rings(f.geometry); return { id: f.properties.id, rs, b: box(rs), props: f.properties, area: 0 }; });
// Buildings by 50 m cell, so a point is tested only against the buildings near it.
const CELL = 50, cells = new Map<string, typeof bx>();
for (const k of bx) for (let i = Math.floor(k.b[0] / CELL); i <= Math.floor(k.b[2] / CELL); i++) for (let j = Math.floor(k.b[1] / CELL); j <= Math.floor(k.b[3] / CELL); j++) { const key = i + "," + j; if (!cells.has(key)) cells.set(key, []); cells.get(key)!.push(k); }
const near = (x: number, y: number) => cells.get(Math.floor(x / CELL) + "," + Math.floor(y / CELL)) ?? [];
const areaOf = (k: (typeof bx)[number]) => { if (!k.area) { let a = 0; for (let x = Math.floor(k.b[0]) + 0.5; x < k.b[2]; x++) for (let y = Math.floor(k.b[1]) + 0.5; y < k.b[3]; y++) if (inside(k.rs, x, y)) a++; k.area = Math.max(1, a); } return k.area; };
const BIG = 200000; // m2: a canal, a park or a whole ensemble is not joined to buildings

const out: unknown[] = [];
const tally = new Map<string, number>();
let pre = 0, joined = 0, missing = 0, done = 0;
for (const f of slice.features) {
  const p = f.properties;
  if (p.typ !== "Baudenkmal" && p.typ !== "Denkmalbereich (Gesamtanlage)") continue;
  const e = page(p.id);
  if (!e) { missing++; continue; }
  // The date row's first year. An entry without one gives its dates in the text: a year in a sentence about building
  // it ("1851-56 errichtet") stands in, else the earliest year named, labelled (a text names births and older buildings too).
  const ss = sentences(e.body);
  const dated = e.rows["Datierung"] ?? "", years = [...dated.matchAll(/\b(1[2-9]\d\d|20\d\d)\b/g)].map((m) => +m[1]);
  const YEAR = /\b(1[2-9]\d\d|20[0-2]\d)\b/g, BUILD = /errichtet|erbaut|entstand|gebaut|Bauzeit|Neubau|vollendet|fertiggestellt/;
  const nearVerb = ss.flatMap((x) => (BUILD.test(x) ? [...x.matchAll(YEAR)].map((m) => +m[1]) : []));
  const textYears = [...e.body.matchAll(YEAR)].map((m) => +m[1]);
  const built = years.length ? years[0] : nearVerb.length ? Math.min(...nearVerb) : textYears.length ? Math.min(...textYears) : null;
  const builtBasis = years.length ? "date row" : nearVerb.length ? "earliest year in a sentence about its building (check)" : textYears.length ? "earliest year in the text (check)" : null;
  const rs = rings(f.geometry), b = box(rs);
  const hits = new Map<number, number>();
  let area = 0;
  if (++done % 50 === 0) console.log(`${done} monuments`);
  if ((b[2] - b[0]) * (b[3] - b[1]) <= BIG) for (let x = Math.floor(b[0]) + 0.5; x < b[2]; x++)
    for (let y = Math.floor(b[1]) + 0.5; y < b[3]; y++) {
      if (!inside(rs, x, y)) continue;
      area++;
      for (const k of near(x, y)) if (x >= k.b[0] && x <= k.b[2] && y >= k.b[1] && y <= k.b[3] && inside(k.rs, x, y)) { hits.set(k.id, (hits.get(k.id) ?? 0) + 1); break; }
    }
  const buildings = [...hits].map(([id, n]) => { const k = bx.find((q: any) => q.id === id)!; return { id, share_of_building: +(n / areaOf(k)).toFixed(2), share_of_monument: +(n / Math.max(1, area)).toFixed(2) }; })
    .filter((h) => h.share_of_building >= 0.3 || h.share_of_monument >= 0.3).sort((a, c) => c.share_of_monument - a.share_of_monument);
  const before1918 = built !== null && built <= 1917;
  if (before1918) pre++;
  if (before1918 && buildings.length) joined++;
  const wall = facts(ss, WALL), roof = facts(ss, ROOF), style = facts(ss, STYLE), after = facts(ss, AFTER), colour = facts(ss.filter((s) => WALL.some(([, re]) => re.test(s))), COLOUR);
  if (before1918) for (const x of [...wall, ...roof, ...style, ...after]) tally.set(x.fact, (tally.get(x.fact) ?? 0) + 1);
  out.push({ type: "Feature", geometry: f.geometry, properties: {
    id: p.id, kind: p.typ, title: e.title, what: e.rows["Sachbegriff"] ?? null, address: e.rows["Adressen"] ?? null, dated, built, built_basis: builtBasis, designer: e.rows["Entwurf"] ?? null, link: p.link,
    stood_1917: before1918 ? "built by 1917 by its date (check the text for later changes)" : built ? `built ${built}: not the 1917 building` : "undated",
    storeys: storeys(ss), wall, colour, roof, style, after, buildings_1917: buildings,
    source: "Denkmaldatenbank Berlin (Landesdenkmalamt); facts read by word lists from the entry text (the sentence behind each is in cache/denkmale/evidence.json, not shipped)",
  } });
}
// The shipped layer: each fact by name only; the sentences go to the cache.
type Fact = { fact: string; sentence: string };
const evidence: Record<string, Record<string, Fact[] | { n: number; sentence: string } | null>> = {};
const shipped = out.map((x: any) => {
  const p = x.properties, names = (l: Fact[]) => l.map((y) => y.fact);
  evidence[p.id] = { storeys: p.storeys, wall: p.wall, colour: p.colour, roof: p.roof, style: p.style, after: p.after };
  return { ...x, properties: { ...p, storeys: p.storeys?.n ?? null, wall: names(p.wall), colour: names(p.colour), roof: names(p.roof), style: names(p.style), after: names(p.after) } };
});
await Bun.write(join(root, P.evidence), JSON.stringify(evidence));
await Bun.write(join(P.map, "denkmale.geojson"), JSON.stringify({ type: "FeatureCollection", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } }, features: shipped }));
const lines = [
  `${out.length} monuments read (${missing} pages missing); ${pre} dated to 1917 or before, ${joined} of them on 1917 buildings`,
  "facts among the monuments dated to 1917 or before (count of monuments whose text names it):",
  ...[...tally].sort((a, c) => c[1] - a[1]).map(([k, v]) => `  ${k}\t${v}`),
];
await Bun.write(join(root, P.txt), lines.join("\n") + "\n");
console.log(lines.join("\n"));
