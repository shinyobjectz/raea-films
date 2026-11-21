// The roadway of a Straube tile as a PBM mask (black = roadway) on stdout, for potrace. The plan tints streets and
// squares tan (#E1CE9A, yellow = (r+g)/2 - b about 61) and leaves courtyards pale (#EBE3CB, about 28) and buildings
// beige (#D8CEAB, about 40), with thin dark lines round every built part, yard and parcel. So the tile is split into
// the regions its lines enclose (as regions.ts does), and a region is roadway when its mean yellow is at least YEL,
// or when at least SHARE of it is street on the 1910 land-use map (use1910px.ts; streets white or cream, courtyards
// in their block's colour) and it is darker than pale paper (mean luminance under DARK), which catches the U-Bahn's
// blue-grey band that the plan outlines as a region of its own. (The 1910 map is read here without its 2-13 m shift,
// so near a street front its street spills over pale yards; the darkness keeps those out.)
// A region over BIG m2 is the street network run together with yards through gaps in the lines (in Dorotheenstadt,
// 73,000 m2 with a mean yellow of 37), so there each pixel decides: tan after a 1 m blur, or darker than pale paper
// (the band) where the 1910 map has street. A region that is neither but has roadway on at least ISLE of its sides
// (the first pixel of another region within 3 m, across its lines) is an island in the street: the pale strip
// between tram rails (5 m wide on Charlottenstraße), a refuge; build.sh catches the ones this misses. An island is
// thin (no pixel more than ISLEW m from a line) and clear of the tile's edge: a house cut by the edge has lost the
// neighbours that would outvote its street front. The lines
// between roadway (tram rails, kerbs, lettering) are closed by 3 px, and specks under 1 m across are opened away.
// The reader cannot tell roadway from courtyard: "Berlin um 1900", which it learned from, files courtyards, squares
// and the strips along block fronts under "Straßen und Plätze" and leaves the roadway out.
// usage: bun roadway.ts CACHE/rasters/straube/TILE.png > mask.pbm   [YEL=48 SHARE=0.3 LINE=20 BIG=3000 ISLE=0.8 ISLEW=3]
import { readGray, readRGB } from "./raster";
import { classify, STREET } from "./use1910px";
import { chamfer } from "./thin";

const plan = process.argv[2];
const YEL = Number(process.env.YEL ?? 48), SHARE = Number(process.env.SHARE ?? 0.3), LINE = Number(process.env.LINE ?? 20), MINPX = 64;
const BIGPX = Number(process.env.BIG ?? 3000) * 16, DARK = 190, ISLE = Number(process.env.ISLE ?? 0.8), ISLEW = Number(process.env.ISLEW ?? 3) * 4;
const use = plan.replace(/\/straube\/([^/]+)$/, "/use1910/$1");
const u = (await Bun.file(use).exists()) ? await classify(use) : null;
const { w, h, px } = await readRGB(plan, 2000, 2000);
process.env.MAP_PREFILTER = "-blur 0x4";
const blur = (await readRGB(plan, 2000, 2000)).px;
delete process.env.MAP_PREFILTER;
const n = w * h;
const bh = (await readGray(plan, ["-resize", "2000x2000!", "-colorspace", "Gray", "-morphology", "BottomHat", "Disk:3"])).px;

// Regions: 4-connected runs of pixels that are not line.
const lab = new Int32Array(n), stack = new Int32Array(n);
const sum: number[] = [0], cnt: number[] = [0], st: number[] = [0], known: number[] = [0], lum: number[] = [0];
for (let s = 0; s < n; s++) {
  if (bh[s] > LINE || lab[s]) continue;
  const id = sum.length;
  sum.push(0), cnt.push(0), st.push(0), known.push(0), lum.push(0);
  lab[s] = id;
  let top = 0;
  stack[top++] = s;
  while (top) {
    const i = stack[--top], x = i % w;
    sum[id] += (px[i * 3] + px[i * 3 + 1]) / 2 - px[i * 3 + 2];
    lum[id] += 0.299 * px[i * 3] + 0.587 * px[i * 3 + 1] + 0.114 * px[i * 3 + 2];
    cnt[id]++;
    if (u) { const c = u[(((i / w) | 0) >> 1) * 1000 + (x >> 1)]; if (c) (known[id]++, (c & 15) === STREET && st[id]++); }
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= n || bh[j] > LINE || lab[j]) continue;
      lab[j] = id;
      stack[top++] = j;
    }
  }
}
const mask = new Uint8Array(n);
const road = cnt.map((c, r) => r > 0 && c >= MINPX && (sum[r] / c >= YEL || (known[r] > 0 && st[r] / known[r] >= SHARE && lum[r] / c < DARK)));
for (let i = 0; i < n; i++) {
  const r = lab[i];
  if (!r) continue;
  if (cnt[r] < BIGPX) { if (road[r]) mask[i] = 255; continue; }
  const R = blur[i * 3], G = blur[i * 3 + 1], B = blur[i * 3 + 2];
  const street1910 = u ? (u[((((i / w) | 0) >> 1) * 1000) + ((i % w) >> 1)] & 15) === STREET : false;
  if ((R + G) / 2 - B >= YEL || (street1910 && 0.299 * R + 0.587 * G + 0.114 * B < DARK)) mask[i] = 255;
}

// Islands: for each region not yet roadway, from each of its pixels next to a line, the first pixel of another
// region along each axis within 12 px votes by its own state.
const yes = new Float64Array(cnt.length), no = new Float64Array(cnt.length);
const toLine = chamfer(w, h, (i) => lab[i] === 0), deep = new Float32Array(cnt.length), atEdge = new Uint8Array(cnt.length);
for (let i = 0; i < n; i++) {
  const r = lab[i], x = i % w, y = (i / w) | 0;
  if (!r) continue;
  if (toLine[i] > deep[r]) deep[r] = toLine[i];
  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) atEdge[r] = 1;
}
for (let i = 0; i < n; i++) {
  const r = lab[i];
  if (!r || mask[i] || cnt[r] >= BIGPX) continue;
  const x = i % w, y = (i / w) | 0;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h || lab[ny * w + nx]) continue; // only where a line borders it
    for (let k = 2; k <= 12; k++) {
      const px2 = x + dx * k, py2 = y + dy * k;
      if (px2 < 0 || py2 < 0 || px2 >= w || py2 >= h) break;
      const j = py2 * w + px2, lj = lab[j];
      if (!lj) continue;
      if (lj !== r) mask[j] ? yes[r]++ : no[r]++;
      break;
    }
  }
}
for (let i = 0; i < n; i++) {
  const r = lab[i];
  if (r && !mask[i] && cnt[r] < BIGPX && !atEdge[r] && deep[r] <= ISLEW && yes[r] > 0 && yes[r] >= ISLE * (yes[r] + no[r])) mask[i] = 255;
}

// Close by 3 px, open by 2 px (specks of tint) (white = roadway), then out as PBM with roadway black.
const p = Bun.spawn(["magick", "-size", `${w}x${h}`, "-depth", "8", "gray:-", "-morphology", "Close", "Square:3", "-morphology", "Open", "Square:2", "-negate", "pbm:-"], { stdin: "pipe", stdout: "inherit" });
p.stdin.write(mask);
await p.stdin.end();
process.exit(await p.exited);
