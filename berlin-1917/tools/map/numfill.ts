// For a house number that fell on no 1917 building (numbers.ts): the patch of the Straube plan it is printed on, as a
// candidate outline of a house the reader missed. From the plan pixel nearest the number that is no line or lettering
// (luminance at least LINE, and no darker pixel beside it: the lines are thickened by a pixel, as a thin anti-aliased
// stretch of line leaks otherwise), the fill spreads 4-connected over every such pixel, so it stops at the plan's drawn lines
// (house outlines, lot lines, street edges); holes left by lettering inside are filled in, and the outline is grown by
// half a line's width (GROW) so it reaches the middle of the line as the reader's own outlines do. A fill that reaches
// the window's edge (R m out) has leaked through a gap in a line and is marked "leak". Plan to map by the scan's offset
// field (offsetfield.ts: map = plan - offset). Nothing is decided here: each outline is judged by eye on a sheet
// (tools/map/missed-add.tsv takes the ones that hold).
// Also the plan's colour inside (mean R-B; on 11-17, 60 known houses read 49.5, 60 courtyards 35.0, 60 street points
// 63.4) and the share of the outline already under a 1917 building.
//   bun numfill.ts CAND.csv OUT.csv [SLICE.json]    CAND: i,x,y (map); OUT: i,m2,leak,rb,built,wkt (map, EPSG:25833)
import { $ } from "bun";
import { offsetField } from "./offsetfield";
import { slicePaths } from "./paths";
import { readRGB } from "./raster";

const [candPath, outPath, slicePath = `${import.meta.dir}/slice.json`] = process.argv.slice(2);
const { cache, map, align } = await slicePaths(slicePath);
const offset = await offsetField(align);
const DIR = `${import.meta.dir}/../../cache/berlin/rasters/straube`, T = 500, PX = 4, OE = 389400, ON = 5814800;
const R = 30, LINE = 165, GROW = 0.6, DISC = 2.5, N = R * 2 * PX;

// The plan's tiles, a few kept at a time (each 2000 x 2000 px).
const tiles = new Map<string, Uint8Array | null>();
async function tile(e: number, n: number) {
  const k = `${e / 100}_${n / 100}`;
  if (!tiles.has(k)) {
    if (tiles.size > 6) tiles.delete(tiles.keys().next().value!);
    const f = `${DIR}/${k}.png`;
    tiles.set(k, (await Bun.file(f).exists()) ? (await readRGB(f, T * PX, T * PX)).px : null);
  }
  return tiles.get(k)!;
}
/** RGB of the plan at plan coordinates, or null off the scan. */
async function rgb(x: number, y: number): Promise<[number, number, number] | null> {
  const e = OE + Math.floor((x - OE) / T) * T, n = ON + Math.floor((y - ON) / T) * T, px = await tile(e, n);
  if (!px) return null;
  const i = Math.floor((x - e) * PX), j = Math.floor((n + T - y) * PX), k = (j * T * PX + i) * 3;
  return [px[k], px[k + 1], px[k + 2]];
}

const rows = (await Bun.file(candPath).text()).trim().split("\n");
const head = rows.shift()!.split(",");
const out: string[] = ["i,m2,leak,rb,wkt"];
for (const line of rows) {
  const c = Object.fromEntries(line.split(",").map((v, k) => [head[k], v]));
  const [dx, dy] = offset(+c.x, +c.y), cx = +c.x + dx, cy = +c.y + dy; // the number on the plan
  const X0 = cx - R, Y1 = cy + R;
  const at = (i: number, j: number) => [X0 + (i + 0.5) / PX, Y1 - (j + 0.5) / PX] as const;
  const open = new Uint8Array(N * N), col = new Int16Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const p = await rgb(...at(i, j));
    if (!p) continue;
    const L = 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
    open[j * N + i] = L >= LINE ? 1 : 0;
    col[j * N + i] = p[0] - p[2];
  }
  // thicken the lines by a pixel
  const ink = open.map((v) => 1 - v);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const p = j * N + i;
    if (ink[p] || (i > 0 && ink[p - 1]) || (i < N - 1 && ink[p + 1]) || (j > 0 && ink[p - N]) || (j < N - 1 && ink[p + N])) open[p] = 0;
  }
  // The regions the open pixels within DISC m of the number belong to, each filled once (label = its number); the
  // number's own is the one covering most of that disc (a number printed against a line touches its neighbour too).
  const lab = new Int32Array(N * N), leaks: boolean[] = [false], inDisc: number[] = [0];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const s = j * N + i;
    if (!open[s] || lab[s] || Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2) > DISC * PX) continue;
    const l = leaks.length, stack = [s];
    leaks.push(false), inDisc.push(0), (lab[s] = l);
    while (stack.length) {
      const p = stack.pop()!, a = p % N, b = (p / N) | 0;
      if (a === 0 || b === 0 || a === N - 1 || b === N - 1) leaks[l] = true;
      for (const q of [a > 0 ? p - 1 : -1, a < N - 1 ? p + 1 : -1, b > 0 ? p - N : -1, b < N - 1 ? p + N : -1])
        if (q >= 0 && open[q] && !lab[q]) (lab[q] = l), stack.push(q);
    }
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (lab[j * N + i] && Math.hypot(i + 0.5 - N / 2, j + 0.5 - N / 2) <= DISC * PX) inDisc[lab[j * N + i]]++;
  const own = inDisc.indexOf(Math.max(...inDisc.slice(1)), 1);
  if (own < 1) continue;
  const inR = lab.map((l) => (l === own ? 1 : 0)), leak = leaks[own], seed = -1;
  // holes (lettering inside): what the outside can't reach
  const outside = new Uint8Array(N * N), st: number[] = [];
  for (let k = 0; k < N; k++) for (const p of [k, (N - 1) * N + k, k * N, k * N + N - 1]) if (!inR[p] && !outside[p]) (outside[p] = 1), st.push(p);
  while (st.length) {
    const p = st.pop()!, i = p % N, j = (p / N) | 0;
    for (const q of [i > 0 ? p - 1 : -1, i < N - 1 ? p + 1 : -1, j > 0 ? p - N : -1, j < N - 1 ? p + N : -1])
      if (q >= 0 && !inR[q] && !outside[q]) (outside[q] = 1), st.push(q);
  }
  // runs of each row, as boxes in map coordinates, for duckdb to join
  const boxes: string[] = [];
  let px = 0, rb = 0;
  for (let j = 0; j < N; j++) {
    let s = -1;
    for (let i = 0; i <= N; i++) {
      const on = i < N && !outside[j * N + i];
      if (on) { px++; rb += col[j * N + i]; if (s < 0) s = i; }
      else if (s >= 0) {
        const xa = X0 + s / PX, xb = X0 + i / PX, ya = Y1 - (j + 1) / PX, yb = Y1 - j / PX;
        const [ox, oy] = offset(xa, ya);
        boxes.push(`POLYGON((${xa - ox} ${ya - oy},${xb - ox} ${ya - oy},${xb - ox} ${yb - oy},${xa - ox} ${yb - oy},${xa - ox} ${ya - oy}))`);
        s = -1;
      }
    }
  }
  const m2 = px / PX ** 2;
  if (process.env.NUMFILL_DEBUG) {
    const img = new Uint8Array(N * N * 3);
    for (let p = 0; p < N * N; p++) { img[p * 3] = outside[p] ? 0 : 255; img[p * 3 + 1] = open[p] ? 200 : 0; img[p * 3 + 2] = p === seed ? 255 : 0; }
    await Bun.write(`${process.env.NUMFILL_DEBUG}/m${c.i}.rgb`, img);
  }
  out.push(`${c.i},${m2.toFixed(0)},${leak ? 1 : 0},${(rb / Math.max(1, px)).toFixed(1)},"${leak || m2 > 3000 ? "" : boxes.join(";")}"`);
}
// union the boxes into one outline each, grown to the line's middle, and simplified
const tmp = `${outPath}.boxes.csv`;
await Bun.write(tmp, out.join("\n") + "\n");
await $`duckdb -c ${`SET memory_limit='2GB'; LOAD spatial;
COPY (WITH r AS (SELECT i, m2, leak, rb, unnest(string_split(wkt, ';')) w FROM read_csv('${tmp}', all_varchar = true) WHERE wkt <> ''),
  u AS (SELECT i, any_value(m2) m2, any_value(leak) leak, any_value(rb) rb,
    ST_SimplifyPreserveTopology(ST_Buffer(ST_Union_Agg(ST_GeomFromText(w)), ${GROW}, 2), 0.3) g FROM r GROUP BY i),
  b AS (SELECT geom FROM ST_Read('${map}/buildings.geojson'))
  SELECT i, m2, leak, rb, round(coalesce((SELECT sum(ST_Area(ST_Intersection(u.g, b.geom))) FROM b WHERE ST_Intersects(u.g, b.geom)), 0) / ST_Area(u.g), 2) built,
    ST_AsText(ST_ReducePrecision(u.g, 0.01)) wkt FROM u
  UNION ALL SELECT i, m2, leak, rb, NULL, '' FROM read_csv('${tmp}', all_varchar = true) WHERE wkt = '' OR wkt IS NULL
  ORDER BY i) TO '${outPath}' (HEADER);`}`.quiet();
await $`rm -f ${tmp}`;
console.log(`numfill: ${rows.length} numbers, ${out.length - 1} filled -> ${outPath}`);
