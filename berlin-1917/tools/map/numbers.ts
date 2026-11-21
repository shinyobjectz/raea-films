// The house numbers the Straube plan (1910) prints on its lots, read off the scan by Apple Vision (ocr.swift, on this
// Mac, no network). A number sits on the lot of the house it names, mostly on the front building, so a number with no
// 1917 building under it is either on a forecourt or yard (a palace's cour d'honneur), on a lot built over by 1917, or
// on a house the Straube reader missed (Friedrichstraße 169, 204 and 98, found 11-17): numbers.ts lists those for
// checking by eye. The numbers also anchor the Adreßbuch's houses (tools/addr/place.ts) where they are read reliably.
// Reading as spots.ts does: each tile in CROP px pieces overlapping by OVER px, enlarged UP times and levelled to grey
// (30-85%: on a test piece 11 numbers to plain colour 10, partly different ones), at four
// turns (0, 90, 180, 270 degrees), since numbers along a north-south street run up the page. A word that is one or two
// house numbers ("43", "43a", "60. 61", "240/241") at confidence MINCONF or more is kept, at the middle of its box; the
// same text within DUP m (overlaps, turns) is read once. Plan to map by the scan's offset field (offsetfield.ts).
// The reading takes about two minutes a tile, so it is kept in cache/<slice>/numbers/reads.json and reused; --read
// reads again. Recall on one tile (3904_58193, plain colour) against 21 numbers read by eye: 10 read alike, median 1.4 m off; 1 misread.
//   bun numbers.ts [SLICE.json] [--tile ID] [--read]     prints the numbers with no building within FAR m
import { offsetField } from "./offsetfield";
import { slicePaths } from "./paths";
import { fill, polygons, tiles } from "./raster";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const only = args.includes("--tile") ? args[args.indexOf("--tile") + 1] : null, again = args.includes("--read");
const { cache, map, align } = await slicePaths(slicePath);
const CROP = 560, OVER = 80, UP = 2.5, MINCONF = 0.5, DUP = 3, FAR = 3, MPP = 0.25, TILEPX = 2000, S = CROP * UP;

const bin = `${cache}/../bin/ocr`;
if (!(await Bun.file(bin).exists())) {
  const c = Bun.spawnSync(["swiftc", "-O", `${import.meta.dir}/ocr.swift`, "-o", bin], { stderr: "pipe" });
  if (c.exitCode !== 0) throw new Error(`swiftc: ${c.stderr.toString()}`);
}
const offset = await offsetField(align); // map = plan - offset
type Num = { x: number; y: number; text: string; conf: number; turn: number; tile: string };
const work = `${cache}/numbers`, readsPath = `${work}/reads.json`;
await Bun.$`mkdir -p ${work}`.quiet();
let nums: Num[] = (await Bun.file(readsPath).exists()) ? await Bun.file(readsPath).json() : [];

// A turned piece's point (xr, yr) back to the unturned piece (magick -rotate turns clockwise).
const unturn = (turn: number, xr: number, yr: number) =>
  turn === 90 ? [yr, S - 1 - xr] : turn === 180 ? [S - 1 - xr, S - 1 - yr] : turn === 270 ? [S - 1 - yr, xr] : [xr, yr];
const NUMBERISH = /^\d{1,3}\s?[a-eA-E]?(\s?[./\-–]\s?\d{1,3}\s?[a-eA-E]?)?\.?$/;

const starts: number[] = [];
for (let s = 0; s + CROP < TILEPX + CROP - OVER; s += CROP - OVER) starts.push(Math.min(s, TILEPX - CROP));
const todo = (await tiles(slicePath, MPP)).filter((t) => (only ? t.id === only : true) && (again || !nums.some((n) => n.tile === t.id)));
for (const t of todo) {
  const plan = `${cache}/rasters/straube/${t.id}.png`;
  if (!(await Bun.file(plan).exists())) continue;
  nums = nums.filter((n) => n.tile !== t.id);
  const found: Num[] = [];
  for (const py of [...new Set(starts)]) for (const px of [...new Set(starts)]) for (const turn of [0, 90, 180, 270]) {
    const piece = `${work}/piece.png`;
    await Bun.$`magick ${plan} -crop ${CROP}x${CROP}+${px}+${py} +repage -resize ${UP * 100}% -colorspace Gray -level 30%,85% -rotate ${turn} ${piece}`.quiet();
    const out = (await Bun.$`${bin} ${piece}`.quiet().nothrow()).stdout.toString();
    for (const line of out.split("\n")) {
      const [text, conf, box] = line.split("\t");
      const tx = text?.trim() ?? "";
      if (!NUMBERISH.test(tx) || /^\d{2}[,.]\d{2}$/.test(tx) || +conf < MINCONF) continue; // "34,95" is a spot height
      const [x0, y0, x1, y1] = box.split(" ").map(Number), [u, v] = unturn(turn, (x0 + x1) / 2, (y0 + y1) / 2);
      const qx = t.x0 + (px + u / UP + 0.5) * MPP, qy = t.y1 - (py + v / UP + 0.5) * MPP, [dx, dy] = offset(qx, qy);
      found.push({ x: +(qx - dx).toFixed(2), y: +(qy - dy).toFixed(2), text: tx.replace(/\s+/g, ""), conf: +conf, turn, tile: t.id });
    }
  }
  for (const n of found.sort((a, b) => b.conf - a.conf)) if (!nums.some((o) => o.text === n.text && Math.hypot(o.x - n.x, o.y - n.y) < DUP)) nums.push(n);
  await Bun.write(readsPath, JSON.stringify(nums));
  console.error(`${t.id}: ${found.length} words, ${nums.filter((n) => n.tile === t.id).length} numbers`);
}

// Numbers with no 1917 building within FAR m, on a 0.5 m raster per tile.
const blds = (await Bun.file(`${map}/buildings.geojson`).json()).features as { geometry: any }[];
const far: Num[] = [];
for (const t of await tiles(slicePath, 0.5)) {
  const here = nums.filter((n) => n.x >= t.x0 && n.x < t.x1 && n.y >= t.y0 && n.y < t.y1 && (!only || n.tile === only));
  if (!here.length) continue;
  const w = 1000, m = new Uint8Array(w * w);
  for (const f of blds) fill(m, t, polygons(f.geometry), 1);
  const r = Math.ceil(FAR / 0.5);
  for (const n of here) {
    const cx = Math.floor((n.x - t.x0) / 0.5), cy = Math.floor((t.y1 - n.y) / 0.5);
    let hit = false;
    for (let dy = -r; dy <= r && !hit; dy++) for (let dx = -r; dx <= r && !hit; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < w && y < w && dx * dx + dy * dy <= r * r && m[y * w + x]) hit = true;
    }
    if (!hit) far.push(n);
  }
}
for (const n of far) console.log(`${n.tile}\t${n.text}\t${n.x}\t${n.y}\tconf ${n.conf}\tturn ${n.turn}`);
console.log(`${nums.length} numbers read; ${far.length} with no 1917 building within ${FAR} m`);
