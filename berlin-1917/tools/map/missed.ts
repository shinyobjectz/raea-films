// Houses the 1917 buildings may lack: where "Berlin um 1900" (AISBer, cache/<slice>/berlin1900) has a building and the
// 1917 map has none. The Straube reader (learn.ts) misses some pale houses whole, their beige close to the roadway's tan,
// so the lot comes out as open ground (Friedrichstraße 169-170 at the Französische Straße corner, found 11-17 placing
// the Adreßbuch's houses). A house standing in 1900 is a witness: either it was pulled down by 1910 (the plan then draws
// something else there, which is right) or the reader missed it. Each candidate is checked by eye on the plan
// (scratchpad overlay sheets) before anything enters the map, through a hand table as for not-built.tsv.
// Tried first and dropped (11-17): picking the plan's regions by colour alone. Regions under buildings read yellow
// ((r+g)/2-b) 35-44 and lum 187-211, courtyards 26-33 and 210-226, but street pieces between tram rails, park lawns and
// the Linden's promenade fall in the house range too, and the missed house itself read yellow 33, lum 210 (as pale as a
// yard): of 24 sampled candidates out of 565, none was a missing house.
// Works one 500 m tile at a time on a 0.5 m raster (a few MB): the 1900 buildings, less the 1917 buildings grown by 1 m,
// opened by 1.5 m (the two maps sit within about 1 m; slivers along a shared wall go), in pieces of at least MINM2.
//   bun missed.ts SLICE.json [TILE ...]    writes cache/<slice>/missed.json, one line per candidate on stdout
import { fill, polygons, tiles, type Tile } from "./raster";
import { slicePaths } from "./paths";

const [slicePath, ...only] = process.argv.slice(2);
const { slice, cache, map } = await slicePaths(slicePath);
const MPP = 0.5, GROW = 2, OPEN = 3, MINM2 = Number(process.env.MINM2 ?? 40);

type F = { geometry: any; properties: any };
const read = (p: string) => Bun.file(p).json().then((g) => g.features as F[]);
const b1917 = await read(`${map}/buildings.geojson`), open = await read(`${map}/open.geojson`);
const b1900 = (await read(`${cache}/berlin1900/b_berlin1900_flaechen.json`)).filter((f) => /Gebäude/.test(f.properties.klassenname));
const notBuilt = (await Bun.file(`${import.meta.dir}/not-built.tsv`).text()).split("\n").filter((l) => /^\d/.test(l)).map((l) => l.split("\t").slice(0, 2).map(Number));
const bboxOf = (g: any) => { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const r of polygons(g).flat()) for (const [x, y] of r) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; };
const boxes = new Map<F, number[]>();
const near = (fs: F[], t: Tile) => fs.filter((f) => { let b = boxes.get(f); if (!b) boxes.set(f, (b = bboxOf(f.geometry))); return b[2] > t.x0 && b[0] < t.x1 && b[3] > t.y0 && b[1] < t.y1; });

/** Grow (v = 1) or shrink (v = 0) a mask by k pixels, 4-connected. */
function morph(m: Uint8Array, w: number, h: number, k: number, v: 0 | 1) {
  for (let r = 0; r < k; r++) {
    const src = m.slice();
    for (let i = 0; i < w * h; i++) {
      if (src[i] === v) continue;
      const x = i % w;
      if ((x > 0 && src[i - 1] === v) || (x < w - 1 && src[i + 1] === v) || (i >= w && src[i - w] === v) || (i + w < w * h && src[i + w] === v)) m[i] = v;
    }
  }
}

const out: { tile: string; E: number; N: number; m2: number; was: string; now: string; edge: boolean }[] = [];
for (const t of (await tiles(slicePath, MPP)).filter((t) => !only.length || only.includes(t.id))) {
  const w = Math.round((t.x1 - t.x0) / MPP), h = Math.round((t.y1 - t.y0) / MPP), n = w * h;
  const was = new Uint8Array(n), pub = new Uint8Array(n), now = new Uint8Array(n), ground = new Uint8Array(n);
  for (const f of near(b1900, t)) fill(/öffentlich/.test(f.properties.klassenname) ? pub : was, t, polygons(f.geometry), 1);
  for (let i = 0; i < n; i++) if (pub[i]) was[i] = 1;
  if (!was.some((v) => v)) continue;
  for (const f of near(b1917, t)) fill(now, t, polygons(f.geometry), 1);
  for (const f of near(open, t)) fill(ground, t, polygons(f.geometry), f.properties.kind === "courtyard" ? 2 : f.properties.kind === "street" ? 3 : 4);
  morph(now, w, h, GROW, 1);
  const m = new Uint8Array(n);
  for (let i = 0; i < n; i++) m[i] = was[i] && !now[i] ? 1 : 0;
  morph(m, w, h, OPEN, 0);
  morph(m, w, h, OPEN, 1);
  for (let i = 0; i < n; i++) if (!was[i] || now[i]) m[i] = 0; // the opening must not grow back past the 1900 house
  for (const [E, N] of notBuilt) { const x = Math.floor((E - t.x0) / MPP), y = Math.floor((t.y1 - N) / MPP); if (x >= 0 && x < w && y >= 0 && y < h) m[y * w + x] = 0; }
  const seen = new Uint8Array(n), q = new Int32Array(n);
  for (let s = 0; s < n; s++) {
    if (!m[s] || seen[s]) continue;
    let head = 0, tail = 0, c = 0, sx = 0, sy = 0, p = 0, edge = false, nb = 0;
    const g = [0, 0, 0, 0, 0];
    const hit: number[] = [];
    q[tail++] = s; seen[s] = 1;
    while (head < tail) {
      const i = q[head++], x = i % w, y = (i / w) | 0;
      c++; sx += x; sy += y; g[ground[i]]++; if (pub[i]) p++;
      hit.push(i);
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && m[j] && !seen[j]) { seen[j] = 1; q[tail++] = j; }
    }
    const m2 = c * MPP * MPP;
    if (m2 < MINM2) continue;
    const kinds = ["none", "building", "courtyard", "street", "other"], top = g.indexOf(Math.max(...g));
    nb = hit.length;
    out.push({ tile: t.id, E: +(t.x0 + (sx / nb + 0.5) * MPP).toFixed(1), N: +(t.y1 - (sy / nb + 0.5) * MPP).toFixed(1), m2: Math.round(m2), was: p > c / 2 ? "public" : "private", now: kinds[top], edge });
  }
}
out.sort((a, b) => b.m2 - a.m2);
await Bun.write(`${cache}/missed.json`, JSON.stringify(out));
for (const o of out) console.log(`${o.tile}\t${o.E}\t${o.N}\t${o.m2} m2\t1900 ${o.was}\t1917 ${o.now}${o.edge ? "\t(tile edge)" : ""}`);
const by = (k: string) => out.filter((o) => o.now === k);
console.log(`${out.length} pieces, ${out.reduce((a, o) => a + o.m2, 0)} m2 (${slice.name}): on 1917 street ${by("street").length}, courtyard ${by("courtyard").length}, other or none ${by("other").length + by("none").length}`);
