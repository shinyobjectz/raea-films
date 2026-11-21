// The Straube plan's spot heights (Höhenpunkte: a cross and the height in metres above Normal-Null, "× 34,95", at street
// crossings, squares, bridges and quays), read off the scan and set against our 1917 ground (ground1917.ts) and
// today's (DGM1). The plan's heights are its own surveyed figures, so they check the ground grid everywhere.
// Reading: each tile in CROP px pieces overlapping by OVER px, enlarged UP times, through Apple Vision's text reader
// (ocr.swift, on this Mac); a word that is a height ("34,95", with or without the cross read as x) between LO and HI
// m at confidence MINCONF or more is kept. The cross stands just left of the figure, so the point is put half a
// character height left of the word's box, at its middle (good to a few metres; the ground is near flat). The same
// figure read twice within DUP m (overlapping pieces) is one. Points are moved from the scan onto the map by the
// scan's offset field (offsetfield.ts). Vision reads about half of a tile's figures: lettering across linework
// splits or drops them, so the set is a sample, not a list.
// Placing the point is the weak part: a figure on a bridge or quay lands a few metres off, on the river's surface. So
// beside the ground at the point, near_m is the ground within NEAR m that comes closest to the figure, and a figure no
// ground within NEAR m matches to 1 m is either misread (3 for 8, 1 for 4) or a real change since; those are listed.
// Misreads checked by eye are in spots-fixes.tsv: corrected, dropped, or (fix "@X Y") moved to the cross where the
// plan prints it right of the figure and the reader left it out, X Y in plan metres (it goes onto the map like a read). A figure on a bridge is its deck, over water
// in the ground grid and in today's survey alike (it sees the water under the deck): a figure with 1917 water within
// BRIDGE m and both grounds at the point more than 1.5 m below it is marked on "bridge" and not compared. The rest are on "street",
// and ground1917.ts bends its ground to those that disagree (use: true).
// Datum: the plan's Normal-Null (1879) and DGM1's NHN (DHHN2016) differ in Berlin by a few centimetres, below what
// this checks.
// out: map/1917/spots.geojson (printed_m, ground1917_m, today_m, off_m = printed - ground1917), and a summary line.
// The reading takes a while (about 15 s a tile), so it is kept in cache/<slice>/spots/reads.json and reused; --read reads
// the scans again.
//   bun spots.ts [SLICE.json] [--tile ID] [--read]
import { loadGround } from "./groundgrid";
import { offsetField } from "./offsetfield";
import { slicePaths } from "./paths";
import { tiles } from "./raster";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const only = args.includes("--tile") ? args[args.indexOf("--tile") + 1] : null, again = args.includes("--read") || !!only;
const { cache, map, align } = await slicePaths(slicePath);
const CROP = 560, OVER = 80, UP = 2.5, LO = 28, HI = 48, MINCONF = 0.5, DUP = 4, NEAR = 10, BRIDGE = 25, MPP = 0.25, TILEPX = 2000;

// The reader, compiled once.
const bin = `${cache}/../bin/ocr`;
if (!(await Bun.file(bin).exists())) {
  const c = Bun.spawnSync(["swiftc", "-O", `${import.meta.dir}/ocr.swift`, "-o", bin], { stderr: "pipe" });
  if (c.exitCode !== 0) throw new Error(`swiftc: ${c.stderr.toString()}`);
}
const offset = await offsetField(align); // map = plan - offset
const g1917 = await loadGround(map, cache);
// Today's bare earth, 2 m, 16-bit centimetres (ground.sh).
const th = await Bun.file(`${map}/ground_2m.json`).json();
const today = new Uint16Array(await Bun.file(`${cache}/ground_2m.u16`).arrayBuffer());
const gToday = (x: number, y: number) => {
  const i = Math.floor((x - th.origin_top_left[0]) / th.cell_m), j = Math.floor((th.origin_top_left[1] - y) / th.cell_m);
  return i < 0 || j < 0 || i >= th.width || j >= th.height ? NaN : today[j * th.width + i] / 100;
};

type Spot = { x: number; y: number; m: number; conf: number; text: string; tile: string };
const work = `${cache}/spots`, reads = `${work}/reads.json`;
await Bun.$`mkdir -p ${work}`.quiet();
const spots: Spot[] = !again && (await Bun.file(reads).exists()) ? await Bun.file(reads).json() : [];
const starts: number[] = [];
for (let s = 0; s + CROP < TILEPX + CROP - OVER; s += CROP - OVER) starts.push(Math.min(s, TILEPX - CROP));
for (const t of again || !spots.length ? await tiles(slicePath, MPP) : []) {
  if (only && t.id !== only) continue;
  const plan = `${cache}/rasters/straube/${t.id}.png`;
  if (!(await Bun.file(plan).exists())) continue;
  const found: Spot[] = [];
  for (const py of [...new Set(starts)]) for (const px of [...new Set(starts)]) {
    const piece = `${work}/piece.png`;
    await Bun.$`magick ${plan} -crop ${CROP}x${CROP}+${px}+${py} +repage -resize ${UP * 100}% ${piece}`.quiet();
    const out = (await Bun.$`${bin} ${piece}`.quiet().nothrow()).stdout.toString();
    for (const line of out.split("\n")) {
      const [text, conf, box] = line.split("\t");
      const m = text?.trim().match(/^[x×X*+]?\s?(\d{2})[,.](\d{2})$/);
      if (!m || +conf < MINCONF) continue;
      const v = +`${m[1]}.${m[2]}`;
      if (v < LO || v > HI) continue;
      const [x0, y0, , y1] = box.split(" ").map((n) => +n / UP), h = y1 - y0, cross = /^[x×X*+]/.test(text.trim());
      const u = px + x0 + (cross ? h * 0.5 : -h * 0.5), v2 = py + (y0 + y1) / 2;
      // Plan pixel to plan metres, then onto the map.
      const qx = t.x0 + (u + 0.5) * MPP, qy = t.y1 - (v2 + 0.5) * MPP, [dx, dy] = offset(qx, qy);
      found.push({ x: qx - dx, y: qy - dy, m: v, conf: +conf, text: text.trim(), tile: t.id });
    }
  }
  for (const s of found.sort((a, b) => b.conf - a.conf)) if (!spots.some((o) => o.m === s.m && Math.hypot(o.x - s.x, o.y - s.y) < DUP)) spots.push(s);
  console.error(`${t.id}: ${found.length} read, ${spots.filter((s) => s.tile === t.id).length} kept`);
}

if (again && !only) await Bun.write(reads, JSON.stringify(spots));
// Hand fixes, and which figures stand on water.
const fixes = (await Bun.file(`${import.meta.dir}/spots-fixes.tsv`).text()).split("\n").filter((l) => l && !l.startsWith("#")).map((l) => {
  const [xy, read, fix] = l.split("\t"), [x, y] = xy.split(" ").map(Number);
  return { x, y, read, fix };
});
const water = (await Bun.file(`${map}/water.geojson`).json()).features.flatMap((f: any) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates));
const inside = (rs: number[][][], x: number, y: number) => { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) if (r[i][1] > y !== r[j][1] > y && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const fixed = spots.flatMap((s) => {
  const h = fixes.find((x) => x.read === s.text.replace(/^[x×X*+]\s?/, "") && Math.hypot(x.x - s.x, x.y - s.y) < 5);
  if (!h) return [s];
  if (h.fix === "drop") return [];
  if (h.fix.startsWith("@")) {
    const [qx, qy] = h.fix.slice(1).trim().split(/\s+/).map(Number), [dx, dy] = offset(qx, qy);
    return [{ ...s, x: qx - dx, y: qy - dy, text: `${s.text} (cross by eye)` }];
  }
  return [{ ...s, m: +h.fix, text: `${s.text} (by eye ${h.fix})` }];
});
const feats = fixed.map((s) => {
  const g = g1917(s.x, s.y), d = gToday(s.x, s.y);
  let best = g;
  for (let r = 2; r <= NEAR; r += 2) for (let a = 0; a < 16; a++) {
    const h = g1917(s.x + r * Math.cos((a * Math.PI) / 8), s.y + r * Math.sin((a * Math.PI) / 8));
    if (Math.abs(s.m - h) < Math.abs(s.m - best)) best = h;
  }
  return { type: "Feature", geometry: { type: "Point", coordinates: [+s.x.toFixed(1), +s.y.toFixed(1)] },
    properties: { on: s.m - g > 1.5 && !(s.m - d <= 1.5) && Array.from({ length: 16 }, (_, a) => [0, 5, 10, 15, 20, BRIDGE].some((r) => water.some((p: number[][][]) => inside(p, s.x + r * Math.cos((a * Math.PI) / 8), s.y + r * Math.sin((a * Math.PI) / 8))))).some(Boolean) ? "bridge" : "street", printed_m: s.m, ground1917_m: +g.toFixed(2), today_m: Number.isNaN(d) ? null : +d.toFixed(2), off_m: +(s.m - g).toFixed(2), near_m: +best.toFixed(2), near_off_m: +(s.m - best).toFixed(2), read: s.text, confidence: s.conf } };
});
for (const f of feats) (f.properties as any).use = f.properties.on === "street";
await Bun.write(`${map}/spots${only ? "." + only : ""}.geojson`, JSON.stringify({ type: "FeatureCollection", name: "spot_heights_1910",
  crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::25833" } },
  source: "Straube, Übersichtsplan von Berlin 1:4000 (1910; Geoportal Berlin straubeplan, dl-de/zero-2.0): spot heights in m above Normal-Null, read with Apple Vision on this Mac (tools/map/spots.ts)",
  features: feats }));
const off = feats.filter((f) => f.properties.on === "street").map((f) => f.properties.off_m).sort((a, b) => a - b), abs = off.map(Math.abs).sort((a, b) => a - b);
const q = (v: number[], p: number) => v[Math.min(v.length - 1, Math.floor(v.length * p))];
const far = feats.filter((f) => f.properties.on === "street" && Math.abs(f.properties.near_off_m) > 1);
console.log(`spots: ${fixes.length} fixed or dropped by eye; ${feats.filter((f) => f.properties.on === "bridge").length} on bridges`);
console.log(`spots: ${feats.length} spot heights; printed - 1917 ground at the point: median ${q(off, 0.5)} m, |off| median ${q(abs, 0.5)} m, 90% ${q(abs, 0.9)} m, ${abs.filter((a) => a <= 0.5).length} within 0.5 m; with the ground within ${NEAR} m, ${off.length - far.length} of ${off.length} within 1 m; ${far.length} not (misread or changed):`);
for (const f of far) console.log(`  ${f.geometry.coordinates.join(" ")}  printed ${f.properties.printed_m} (read "${f.properties.read}"), ground ${f.properties.ground1917_m}, today ${f.properties.today_m}`);
