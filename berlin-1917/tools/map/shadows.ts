// How long each building's shadow is in the 1928 photographs, tried as a measure of height. It does not work, and
// is kept so the attempt is not repeated blind; heights.ts takes storeys from the monuments' entries instead.
// The photos: Geoportal luftbild_1928_04, Hansa Luftbild's vertical photo sheets at 1:4,000 scanned at 400 dpi (so the
// WMS's 0.25 m is their own resolution; the 36 MB sheet download is no sharper), mosaics of several photos a sheet.
// What was done, per 500 m tile:
// 1. Building outlines cut into samples every STEP m with outward normals; party walls dropped.
// 2. A first shadow bearing from the brightness 2 m outside each sample against its normal's bearing (a cosine lobe).
// 3. The photo's shift: the one within +-SEARCH m laying the unshaded outlines on the photo's strongest edges. The
//    score is a ridge, not a peak: the shift along the shadows is fixed only to 3-5 m.
// 4. The bearing again on the shifted photo (about 15 degrees east of north where the tile has buildings enough;
//    the Marienkirche's nave and tower shadows agree); BEARING=deg fixes it.
// 5. Rays along the shadows from fronts facing them, two readings: where sunlit ground begins (carries the shift),
//    and the street's width less the sunlit band (free of it, but south-facing roofs are often as bright as the
//    street, so the band's far end is unsure).
// Result on 11-17, all 49 tiles, 8,179 buildings measured: against the storeys of the 164 measured buildings that
// still stand (ALKIS), correlation 0.07 (first reading) and 0.01 (second); 3 to 6 storeys all cast 7-11 m. The sun
// was high (about 10 m of shadow for 5 storeys, so a storey is 2 m of shadow) and the prints' 1 m blur, the shift
// and the bright roofs are each as large. Only buildings of 7 storeys and more stand out (15-18 m).
//   bun shadows.ts [SLICE.json] [--tile ID] [--debug DIR]   writes cache/<slice>/shadows.json; --debug draws each tile
import { slicePaths } from "./paths";
import { fill, polygons, tiles, type Tile } from "./raster";

const args = process.argv.slice(2);
const slicePath = args.find((a) => a.endsWith(".json")) ?? `${import.meta.dir}/slice.json`;
const only = args.includes("--tile") ? args[args.indexOf("--tile") + 1] : null;
const debug = args.includes("--debug") ? args[args.indexOf("--debug") + 1] : null;
const { cache, map } = await slicePaths(slicePath);
const STEP = 0.5, SEARCH = 6, MAXRAY = 40, RUN = 1.5, MPP = 0.25;

type Sample = { b: number; x: number; y: number; nx: number; ny: number };
type Ray = { b: number; D: number; front: number | null; band: number | null };
const out: { tiles: Record<string, object>; buildings: Record<string, object> } = { tiles: {}, buildings: {} };
const blds = (await Bun.file(`${map}/buildings.geojson`).json()).features as any[];
const open = (await Bun.file(`${map}/open.geojson`).json()).features as any[];
const bbox = (g: any) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polygons(g)) for (const r of p) for (const [x, y] of r) (x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y));
  return [x0, y0, x1, y1];
};
const bb = blds.map((f) => bbox(f.geometry)), ob = open.map((f) => bbox(f.geometry));
const near = (b: number[], t: Tile, m: number) => b[2] >= t.x0 - m && b[0] <= t.x1 + m && b[3] >= t.y0 - m && b[1] <= t.y1 + m;

/** A tile with a margin of M m round it, so rays and the shift may run past the tile's edge. */
const M = MAXRAY + SEARCH + 2;
async function photo(t: Tile) {
  const ids: string[] = [];
  for (const dy of [500, 0, -500]) for (const dx of [-500, 0, 500]) ids.push(`${(t.x0 + dx) / 100}_${(t.y0 + dy) / 100}`);
  const files = ids.map((id) => `${cache}/rasters/photo1928/${id}.jpg`);
  const exist = await Promise.all(files.map((f) => Bun.file(f).exists()));
  const parts = files.map((f, k) => (exist[k] ? f : "xc:gray50[2000x2000]"));
  const W = Math.round((500 + 2 * M) / MPP), off = Math.round((500 - M) / MPP);
  const proc = Bun.spawn(["magick", "(", parts[0], parts[1], parts[2], "+append", ")", "(", parts[3], parts[4], parts[5], "+append", ")", "(", parts[6], parts[7], parts[8], "+append", ")", "-append",
    "-crop", `${W}x${W}+${off}+${off}`, "+repage", "-colorspace", "Gray", "-depth", "8", "gray:-"], { stdout: "pipe", stderr: "pipe" });
  const px = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
  if ((await proc.exited) !== 0 || px.length !== W * W) throw new Error(`photo mosaic for ${t.id}: ${await new Response(proc.stderr).text()}`);
  return { px, W, x0: t.x0 - M, y1: t.y1 + M };
}

for (const t of await tiles(slicePath, MPP)) {
  if (only && t.id !== only) continue;
  const P = await photo(t), W = P.W;
  const big: Tile = { id: t.id, x0: P.x0, y0: P.y1 - W * MPP, x1: P.x0 + W * MPP, y1: P.y1, mpp: MPP };
  const lum = (x: number, y: number) => {
    const u = (x - P.x0) / MPP - 0.5, v = (P.y1 - y) / MPP - 0.5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    if (i < 0 || j < 0 || i + 1 >= W || j + 1 >= W) return NaN;
    const k = j * W + i;
    return (P.px[k] * (1 - a) + P.px[k + 1] * a) * (1 - b) + (P.px[k + W] * (1 - a) + P.px[k + W + 1] * a) * b;
  };
  // The map on the mosaic's grid: building index + 1, and open ground (1 street, 2 courtyard).
  const lab = new Int32Array(W * W), ground = new Uint8Array(W * W);
  const here = blds.map((_, k) => k).filter((k) => near(bb[k], big, 0));
  open.forEach((f, k) => { if (near(ob[k], big, 0)) fill(ground, big, polygons(f.geometry), f.properties.kind === "street" ? 1 : 2); });
  for (const k of here) fill(lab, big, polygons(blds[k].geometry), k + 1);
  const at = (x: number, y: number) => {
    const i = Math.floor((x - P.x0) / MPP), j = Math.floor((P.y1 - y) / MPP);
    return i < 0 || j < 0 || i >= W || j >= W ? -1 : j * W + i;
  };

  // 1. Samples on the outlines of the tile's own buildings (by centre), outward normals, party walls dropped.
  const S: Sample[] = [];
  for (const k of here) {
    const [x0, y0, x1, y1] = bb[k], cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (cx < t.x0 || cx >= t.x1 || cy < t.y0 || cy >= t.y1) continue;
    for (const p of polygons(blds[k].geometry)) for (const r of p) for (let i = 0; i + 1 < r.length; i++) {
      const [ax, ay] = r[i], [bx, by] = r[i + 1], L = Math.hypot(bx - ax, by - ay);
      if (L < 2) continue;
      let nx = (by - ay) / L, ny = -(bx - ax) / L; // one side; flipped below if it points inside
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      if (lab[at(mx + nx * 0.4, my + ny * 0.4)] === k + 1) (nx = -nx), (ny = -ny);
      for (let s = 0.75; s <= L - 0.75; s += STEP) {
        const x = ax + ((bx - ax) * s) / L, y = ay + ((by - ay) * s) / L, o = at(x + nx * 0.75, y + ny * 0.75);
        if (o < 0 || lab[o] || !ground[o]) continue;
        S.push({ b: k, x, y, nx, ny });
      }
    }
  }
  if (S.length < 500) { console.error(`${t.id}: ${S.length} samples, skipped`); continue; }

  // The shadows' bearing: brightness 2 m outside each sample against its normal's bearing beta, fitted as
  // a - b max(0, cos(beta - phi)); phi in 1-degree steps, the one whose lobe correlates best with the darkness.
  const bearingAt = (dx: number, dy: number) => {
    const obs: [number, number][] = [];
    for (const s of S) { const v = lum(s.x + dx + s.nx * 2, s.y + dy + s.ny * 2); if (!Number.isNaN(v)) obs.push([Math.atan2(s.nx, s.ny), v]); }
    const my = obs.reduce((t, o) => t + o[1], 0) / obs.length;
    let fit = { deg: 0, r: -Infinity };
    for (let deg = 0; deg < 360; deg++) {
      const p = (deg * Math.PI) / 180;
      let sx = 0, sxx = 0, sxy = 0;
      for (const [beta, v] of obs) { const x = Math.max(0, Math.cos(beta - p)); (sx += x), (sxx += x * x), (sxy += x * (v - my)); }
      const n = obs.length, r = -(sxy / n) / Math.sqrt(sxx / n - (sx / n) ** 2);
      if (r > fit.r) fit = { deg, r };
    }
    return fit;
  };
  // 2. A first bearing with the photo taken as it lies.
  const first = bearingAt(0, 0), fx = Math.sin((first.deg * Math.PI) / 180), fy = Math.cos((first.deg * Math.PI) / 180);
  // 3. The photo's offset: the shift within +-SEARCH m at which the outlines that cast no shadow (normal under 73
  // degrees from the shadows' way) lie on the photo's strongest edges (a Sobel of the photo blurred by 1 px). A shaded
  // front is left out: its shadow's far edge, parallel to it, would pull the outline along the shadows.
  const G = new Float32Array(W * W);
  {
    const B = new Float32Array(W * W);
    for (let j = 1; j < W - 1; j++) for (let i = 1; i < W - 1; i++) { let v = 0; for (let q = -1; q <= 1; q++) for (let p = -1; p <= 1; p++) v += P.px[(j + q) * W + i + p]; B[j * W + i] = v / 9; }
    for (let j = 2; j < W - 2; j++) for (let i = 2; i < W - 2; i++) {
      const k = j * W + i, gx = B[k - W + 1] + 2 * B[k + 1] + B[k + W + 1] - B[k - W - 1] - 2 * B[k - 1] - B[k + W - 1];
      const gy = B[k + W - 1] + 2 * B[k + W] + B[k + W + 1] - B[k - W - 1] - 2 * B[k - W] - B[k - W + 1];
      G[k] = Math.hypot(gx, gy);
    }
  }
  const unshaded = S.filter((q, k) => k % 2 === 0 && q.nx * fx + q.ny * fy < 0.3);
  const edge = (dx: number, dy: number) => {
    let sum = 0;
    for (const q of unshaded) { const o = at(q.x + dx, q.y + dy); if (o >= 0) sum += G[o]; }
    return sum / unshaded.length;
  };
  let best = { dx: 0, dy: 0, v: edge(0, 0) };
  const v0 = best.v;
  for (let dy = -SEARCH; dy <= SEARCH; dy += 0.5) for (let dx = -SEARCH; dx <= SEARCH; dx += 0.5) { const v = edge(dx, dy); if (v > best.v) best = { dx, dy, v }; }
  const c = { ...best };
  for (let dy = c.dy - 0.5; dy <= c.dy + 0.5; dy += 0.25) for (let dx = c.dx - 0.5; dx <= c.dx + 0.5; dx += 0.25) { const v = edge(dx, dy); if (v > best.v) best = { dx, dy, v }; }
  const { dx, dy } = best;
  if (process.env.SCOREGRID) for (let gy = SEARCH; gy >= -SEARCH; gy -= 1) console.log(`dy ${String(gy).padStart(3)}: ${Array.from({ length: 2 * SEARCH + 1 }, (_, q) => edge(q - SEARCH, gy).toFixed(1)).join(" ")}`);

  // 4. The bearing again on the shifted photo.
  const fit = process.env.BEARING ? { deg: +process.env.BEARING } : bearingAt(dx, dy), phi = (fit.deg * Math.PI) / 180, ux = Math.sin(phi), uy = Math.cos(phi), kmin = fit.deg;

  // Levels: shadow just outside the fronts facing the shadows; sunlit open ground with nothing sunward for 30 m.
  const facing = S.filter((s) => s.nx * ux + s.ny * uy > Math.SQRT1_2);
  const darkv = facing.map((s) => lum(s.x + dx + ux * 1, s.y + dy + uy * 1)).filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  const litv: number[] = [];
  for (let j = 0; j < W; j += 8) for (let i = 0; i < W; i += 8) {
    const x = P.x0 + (i + 0.5) * MPP, y = P.y1 - (j + 0.5) * MPP;
    if (!ground[j * W + i] || lab[j * W + i]) continue;
    let free = true;
    for (let r = 1; r <= 30 && free; r += 1) { const o = at(x - ux * r, y - uy * r); if (o < 0 || lab[o]) free = false; }
    if (free) litv.push(lum(x + dx, y + dy));
  }
  litv.sort((a, b) => a - b);
  const dark = darkv[darkv.length >> 1], lit = litv[litv.length >> 1], Tt = (dark + lit) / 2;

  // 5. Rays along the shadows' direction from the fronts facing them, across open ground to the next building, D m
  // away on the map. Along the ray the photo reads: this building's shadow, then sunlit ground, then the next
  // building. Brightness is the mean across the ray over +-0.5 m, smoothed over 1 m along it; bright is above halfway
  // between the profile's 15th and 85th percentiles (at least CONTRAST apart) and above the tile's own halfway mark;
  // gaps under 1 m in the sunlit ground (poles, a tram) are closed. Two readings:
  //   front: where the first sunlit stretch of RUN m begins, from the front on the map (so it carries the photo's
  //     shift along the ray, which the outlines fix only to a few metres);
  //   band: D less the sunlit stretch's length, where it ends in 1 m of darker roof (free of the shift, but a sunlit
  //     roof is often as bright as the street, so it is rarer).
  // No sunlit stretch before the next building: the shadow reaches it (censored, at least D).
  const rays: Ray[] = [];
  const PAD = 6, CONTRAST = 15, vx = uy, vy = -ux;
  for (const q of facing) {
    let D = -1;
    for (let r = 0.5; r <= MAXRAY; r += MPP) {
      const o = at(q.x + ux * r, q.y + uy * r);
      if (o < 0) break;
      if (lab[o]) { D = r; break; }
      if (!ground[o]) break;
    }
    if (D < 4) continue;
    const n = Math.round((D + 2 * PAD) / MPP), raw = new Float64Array(n);
    let bad = false;
    for (let k = 0; k < n && !bad; k++) {
      const r = -PAD + k * MPP, x = q.x + ux * r + dx, y = q.y + uy * r + dy;
      const v = (lum(x, y) + lum(x + vx * 0.5, y + vy * 0.5) + lum(x - vx * 0.5, y - vy * 0.5)) / 3;
      if (Number.isNaN(v)) bad = true;
      raw[k] = v;
    }
    if (bad) continue;
    const prof = raw.map((_, k) => { let t = 0, c = 0; for (let j = Math.max(0, k - 2); j <= Math.min(n - 1, k + 2); j++) (t += raw[j]), c++; return t / c; });
    const sorted = [...prof].sort((a, b) => a - b), lo = sorted[Math.floor(n * 0.15)], hi = sorted[Math.floor(n * 0.85)];
    if (hi - lo < CONTRAST) continue;
    const T = Math.max((lo + hi) / 2, Tt), bright = prof.map((v) => v > T);
    for (let k = 1; k < n - 1; k++) if (!bright[k]) { let j = k; while (j < n && !bright[j]) j++; if (j - k < 1 / MPP && bright[k - 1] && j < n) for (let m = k; m < j; m++) bright[m] = true; k = j; }
    const runs: [number, number][] = [];
    for (let k = 0; k < n; k++) if (bright[k]) { let j = k; while (j < n && bright[j]) j++; if ((j - k) * MPP >= RUN) runs.push([k, j]); k = j; }
    const at0 = PAD / MPP, atD = (PAD + D) / MPP;
    const first = runs.find(([k, j]) => j > at0 + 1 && k < atD);
    if (!first) { rays.push({ b: q.b, D, front: null, band: null }); continue; }
    const front = Math.max(0, (first[0] - at0) * MPP);
    const ends = first[1] + 1 / MPP <= n && bright.slice(first[1], first[1] + 1 / MPP).every((v) => !v) && first[0] > 0;
    const band = ends ? Math.max(0, D - (first[1] - first[0]) * MPP) : null;
    rays.push({ b: q.b, D, front: +front.toFixed(2), band: band === null ? null : +band.toFixed(2) });
  }
  const med = (v: number[]) => (v.length ? +[...v].sort((a, b) => a - b)[v.length >> 1].toFixed(2) : null);
  const fr = rays.filter((r) => r.front !== null), bd = rays.filter((r) => r.band !== null);
  console.log(`${t.id}: ${S.length} samples; shadows toward ${kmin} deg; photo offset ${dx} ${dy} m (edge ${v0.toFixed(1)} -> ${best.v.toFixed(1)}); shadow ${dark?.toFixed(0)}, lit ${lit?.toFixed(0)}; ${facing.length} facing, ${rays.length} rays: front median ${med(fr.map((r) => r.front!))} m, band median ${med(bd.map((r) => r.band!))} m (${bd.length}), ${rays.length - fr.length} censored`);
  const per = new Map<number, Ray[]>();
  for (const r of rays) per.set(r.b, [...(per.get(r.b) ?? []), r]);
  out.tiles[t.id] = { bearing: kmin, dx, dy, dark: +dark.toFixed(1), lit: +lit.toFixed(1) };
  for (const [b, rs] of per) {
    const f = rs.filter((r) => r.front !== null), c = rs.filter((r) => r.front === null);
    out.buildings[blds[b].properties.key] = { tile: t.id, rays: rs.length, front: med(f.map((r) => r.front!)), band: med(rs.filter((r) => r.band !== null).map((r) => r.band!)), bands: rs.filter((r) => r.band !== null).length, censored: c.length, reach: med(c.map((r) => r.D)) };
  }
  if (debug) {
    const img = new Uint8Array(W * W * 3);
    for (let i = 0; i < W * W; i++) img[i * 3] = img[i * 3 + 1] = img[i * 3 + 2] = P.px[i];
    const dot = (x: number, y: number, c: number[]) => { const o = at(x, y); if (o >= 0) (img[o * 3] = c[0]), (img[o * 3 + 1] = c[1]), (img[o * 3 + 2] = c[2]); };
    for (const q of S) dot(q.x + dx, q.y + dy, [80, 140, 255]);
    const p = Bun.spawn(["magick", "-size", `${W}x${W}`, "-depth", "8", "rgb:-", `${debug}/${t.id}.png`], { stdin: "pipe" });
    p.stdin.write(img);
    await p.stdin.end();
    await p.exited;
  }
}
await Bun.write(`${cache}/shadows${only ? "." + only : ""}.json`, JSON.stringify(out));
console.log(`shadows: ${Object.keys(out.buildings).length} buildings measured -> ${cache}/shadows${only ? "." + only : ""}.json`);
