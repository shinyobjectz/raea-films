// The ground under the 1917 city, from the drilling logs of the slice's boreholes sunk before 1946 (Geoportal Berlin,
// Bohrdaten, dl-de/zero-2.0): before post-war rubble was spread, so the fill they record is the fill of 1917, and the
// natural layers under it have not changed since.
// Besides soils, a layer can be "cellar" (the hole began in a cellar, a shaft or on concrete) or "water" (drilled
// through standing water). The logs print no water table as text, so none is read.
// Each log is a typeset drawing (Landesgeologie): the depth of each layer's base, in m below ground with two decimals,
// left of the drawn column, and the layer's description ("Sand (scharf) / grau") right of it on the same line. Apple
// Vision reads it on this Mac (ocr.swift); only the read text is kept, in cache/<slice>/borelogs/KEY.ocr.txt, the
// image is fetched again when a log is first read and then dropped (about 200 KB each).
// A layer runs from the base above it (0 at the top) to its own base. Its class comes from the description's first
// words (CLASSES below, first match wins); its colour and the rest of the words are kept as written.
// out: map/1917/soil.geojson, a Point per borehole: key, year, ground_nhn, depth_m, layers [{top_m, base_m, class,
// text}], water_m when the log notes water, and complete=false when depths and descriptions don't pair up.
//   bun soil.ts [SLICE.json] [--limit N]
import { slicePaths } from "./paths";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const limit = args.includes("--limit") ? +args[args.indexOf("--limit") + 1] : Infinity;
const { cache, map } = await slicePaths(slicePath);
const slice = await Bun.file(slicePath).json();
const [X0, Y0, X1, Y1] = slice.bbox;
const bin = `${cache}/../bin/ocr`, logs = `${cache}/borelogs`, POOL = 4;
if (!(await Bun.file(bin).exists())) Bun.spawnSync(["swiftc", "-O", `${import.meta.dir}/ocr.swift`, "-o", bin]);
await Bun.$`mkdir -p ${logs}`.quiet();

// Logs written up later name the unit first ("Saale-II-Glazial / Ton, Schluff, Sand, Kies / Geschiebemergel / grau"):
// that part goes to `unit`, and the material is read from the part after it. Whatever is said anywhere about how
// the layer was made wins first (fill, till, peat, mud): "Ton / Geschiebemergel" is till, not clay.
const UNIT = /^(Holoz|Pleistoz|Weichsel|Saale|Elster|Holstein|Eem|Rupel|Terti|Mioz|Oligoz|Plioz|Quart|L Saale)/i;
const MADE: [string, RegExp][] = [
  ["cellar", /^(Keller|Kellersohle|Schacht|Schachtsohle|Lichtschacht|Beton|Mauerwerk|Fundament)\b/i],
  ["water", /^Wasser$/i],
  ["fill", /Au[ft]{1,3}r?[üu]?l+ung|Aufschüttung|künstlich|Bauschutt|Schutt\b|Anschüttung/i],
  ["till", /Geschiebemergel|Geschiebelehm/i],
  ["organic mud", /Mudde|Faulschlamm|Schlick|Moorerde|Modder|Wiesenkalk|Wiesenmergel|Anmoor/i],
  ["peat", /\bTorf|^Moor\b/i],
];
export const CLASSES: [string, RegExp][] = [
  ["topsoil", /^(Mutterboden|Humus|Oberboden|Ackerboden|Gartenerde|Sand \(humos|Lockergestein \(humos)/i],
  ["boulders", /^(Geschiebe|Steine|Blöcke|Findling|Feinsteinstücke|Steinschicht|Geröll|Steingeröll)/i],
  ["till", /^(Ton, Schluff, Sand, Kies|Lehm)/i],
  ["marl", /^(Mergel|Kalk)/i],
  ["gravel", /^(Kies|Grand|Grobkies|Feinkies|Mittelkies)/i],
  ["coarse sand", /^(Grobsand|Sand \(grob|grober Sand)/i],
  ["sharp sand", /^(Sand \(scharf|scharfer Sand)/i],
  ["fine sand", /^(Feinstsand|Feinsand|Sand \(fein|feiner Sand|Mehlsand|Glimmersand)/i],
  ["sand", /^(Mittelsand|Sand)/i],
  ["silt", /^(Schluff|Silt)/i],
  ["clay", /^(Ton|Letten|Septarienton)/i],
  ["lignite", /^(Braunkohle|Kohle)/i],
];
export function classify(t: string): { cls: string; unit: string | null } {
  const parts = t.split("/").map((p) => p.trim()).filter(Boolean);
  const unit = parts.length > 1 && UNIT.test(parts[0]) ? parts.shift()! : null;
  const made = MADE.find(([, re]) => re.test(t))?.[0];
  if (made) return { cls: made, unit };
  const petro = parts[0] ?? "";
  const cls = CLASSES.find(([, re]) => re.test(petro))?.[0]
    ?? parts.slice(1).map((p) => CLASSES.find(([, re]) => re.test(p))?.[0]).find(Boolean)
    ?? CLASSES.find(([, re]) => new RegExp(re.source.replace("^", "(?:^|[\\s,(])"), "i").test(petro))?.[0] ?? "other";
  return { cls, unit };
}

type Line = { t: string; c: number; x0: number; y0: number; x1: number; y1: number };
function parse(ocr: string) {
  const lines: Line[] = ocr.trim().split("\n").filter(Boolean).map((l) => { const [t, c, b] = l.split("\t"); const [x0, y0, x1, y1] = b.split(" ").map(Number); return { t, c: +c, x0, y0, x1, y1 }; });
  const gi = lines.findIndex((l) => /Geländeoberkante/.test(l.t));
  const ground = gi >= 0 ? lines.slice(gi, gi + 3).map((l) => l.t.match(/(-?\d+,\d+)\s*m\s*NHN/)).find(Boolean) : null;
  // Depth labels: two decimals, right of the NHN scale (whose labels have one), above the footer.
  const foot = lines.find((l) => /Höhenmaßstab/.test(l.t))?.y0 ?? Infinity;
  const top0 = (lines[gi]?.y1 ?? 0) + 40;
  const depths = lines.filter((l) => /^\d{1,3},\d\d\b/.test(l.t) && !/NHN/.test(l.t) && l.x0 > 330 && l.y0 > top0 && l.y1 < foot).map((l) => ({ d: +l.t.match(/^(\d{1,3},\d\d)/)![1].replace(",", "."), y: (l.y0 + l.y1) / 2, x1: l.x1 }))
    .sort((a, b) => a.y - b.y);
  const right = depths.length ? Math.max(...depths.map((d) => d.x1)) + 60 : Infinity;
  const descs = lines.filter((l) => l.x0 > right && l.y1 < foot && l.y0 > top0 && /[A-Za-zÄÖÜäöüß]{3}/.test(l.t) && !/NHN|UTM|Rechtswert|Hochwert|BERLIN|Landesgeologie|Senatsverwaltung|Mobilität|Klimaschutz/.test(l.t))
    .map((l) => ({ t: l.t.replace(/^[\\/_|\s]+/, "").replace(/[\\/_|\s]+$/, "").trim(), y: (l.y0 + l.y1) / 2 }));
  const layers: { top_m: number; base_m: number; class: string; unit: string | null; text: string }[] = [];
  let top = 0, missing = 0;
  for (const d of depths) {
    const near = descs.filter((x) => Math.abs(x.y - d.y) < 14).sort((a, b) => Math.abs(a.y - d.y) - Math.abs(b.y - d.y))[0];
    if (!near) missing++;
    const text = near?.t ?? "?", c = near ? classify(text) : { cls: "unread", unit: null };
    if (d.d > top) layers.push({ top_m: +top.toFixed(2), base_m: d.d, class: c.cls, unit: c.unit, text }), (top = d.d);
  }
  const water = lines.map((l) => l.t.match(/(?:GW|Grundwasser|Wasser(?:stand|spiegel)?)\D{0,12}(\d{1,2},\d{1,2})/i)).find(Boolean);
  return { ground_nhn: ground ? +ground[1].replace(",", ".") : null, layers, water_m: water ? +water[1].replace(",", ".") : null, complete: missing === 0 && layers.length > 0 && depths.length === new Set(depths.map((d) => d.d)).size };
}

const all = (await Bun.file(`${cache}/boreholes.json`).json()).features.map((f: any) => f.properties)
  .filter((p: any) => (p.bohrbeginn ?? "9999") < "1946" && p.xcoord >= X0 && p.xcoord <= X1 && p.ycoord >= Y0 && p.ycoord <= Y1)
  .slice(0, limit);
let fetched = 0;
async function ocrOf(p: any): Promise<string> {
  const f = `${logs}/${p.schluessel}.ocr.txt`;
  if (await Bun.file(f).exists()) return Bun.file(f).text();
  const img = `${logs}/${p.schluessel}.jpg`;
  const r = await fetch(p.profil);
  if (!r.ok) throw new Error(`${p.schluessel}: HTTP ${r.status}`);
  await Bun.write(img, await r.arrayBuffer());
  const o = Bun.spawnSync([bin, img], { stderr: "pipe" });
  await Bun.$`rm -f ${img}`.quiet();
  if (o.exitCode !== 0) throw new Error(`${p.schluessel}: ocr failed ${o.stderr}`);
  await Bun.write(f, o.stdout.toString());
  fetched++;
  return o.stdout.toString();
}
const feats: any[] = [], failed: string[] = [];
for (let i = 0; i < all.length; i += POOL) {
  await Promise.all(all.slice(i, i + POOL).map(async (p: any) => {
    try {
      const r = parse(await ocrOf(p));
      feats.push({ type: "Feature", geometry: { type: "Point", coordinates: [p.xcoord, p.ycoord] }, properties: { key: p.schluessel, year: +p.bohrbeginn.slice(0, 4), ground_nhn: r.ground_nhn ?? (+p.ansatzhoehe || null), depth_m: +p.endteufe, ...r } });
    } catch (e) { failed.push(String(e)); }
  }));
  if ((i / POOL) % 25 === 0) console.error(`soil: ${Math.min(i + POOL, all.length)}/${all.length} (${fetched} fetched)`);
}
feats.sort((a, b) => a.properties.key.localeCompare(b.properties.key));
await Bun.write(limit === Infinity ? `${map}/soil.geojson` : `${cache}/soil.sample.geojson`, JSON.stringify({ type: "FeatureCollection", name: "soil_boreholes_pre1946", crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "drilling logs of the boreholes sunk before 1946 (Geoportal Berlin, Bohrdaten, dl-de/zero-2.0), read by Apple Vision; tools/map/soil.ts", features: feats }));
const cls = new Map<string, number>();
for (const f of feats) for (const l of f.properties.layers) cls.set(l.class, (cls.get(l.class) ?? 0) + 1);
const fillT = feats.map((f) => f.properties.layers.filter((l: any) => l.class === "fill").reduce((s: number, l: any) => Math.max(s, l.base_m), 0)).sort((a, b) => a - b);
console.log(`soil: ${feats.length} logs read (${feats.filter((f) => f.properties.complete).length} complete, ${fetched} fetched now, ${failed.length} failed${failed.length ? ": " + failed.slice(0, 3).join("; ") : ""})`);
console.log(`soil: layers by class: ${[...cls].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ")}`);
console.log(`soil: fill at the top p10/p50/p90 ${[0.1, 0.5, 0.9].map((q) => fillT[Math.floor(q * (fillT.length - 1))]).join(" / ")} m; water noted in ${feats.filter((f) => f.properties.water_m != null).length}`);
