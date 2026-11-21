// Finds how far a scanned map sits from a reference, per tile: the shift (in metres) that puts the most reference
// outlines on the map's dark lines. Reference: "Berlin um 1900" outlines where it covers the tile, otherwise the
// outlines of today's ALKIS buildings (only buildings that survive share edges with the old map, which is enough).
// Writes cache/<slice>/align_<map>.json: { tileId: { dx, dy, score, score0, ref, points } }, dx east and dy north.
// usage: bun align.ts SLICE.json MAP [TILE_ID ...]   (MAP = straube | use1910 | photo1928)
import { fill, polygons, readRGB, size, tiles, type Tile } from "./raster";
import { AISBER } from "./learn-classes";

const [slicePath, map, ...only] = process.argv.slice(2);
const slice = await Bun.file(slicePath).json();
const cache = `${import.meta.dir}/../../cache/${slice.name}`;
const mpp = 0.5, R = 24; // search +-12 m in 0.5 m steps
// the 1900 vectors: the slice's own, or the ones a city slice borrows (berlin1900, relative to this folder)
const b1900 = slice.berlin1900 ? `${import.meta.dir}/${slice.berlin1900}` : `${cache}/berlin1900`;
const aisber = (await Bun.file(`${b1900}/b_berlin1900_flaechen.json`).json()).features;
const ext = { png: "png", jpg: "jpg" } as const;
const file = (id: string) => {
  const r = slice.rasters.find((x: any) => x.key === map);
  return `${cache}/rasters/${map}/${id}.${r.ext as keyof typeof ext}`;
};

/** Class raster of a reference on the tile, with a margin of R pixels so shifted lookups stay inside. */
function reference(t: Tile, feats: any[], cls: (f: any) => number) {
  const big: Tile = { ...t, x0: t.x0 - R * mpp, y0: t.y0 - R * mpp, x1: t.x1 + R * mpp, y1: t.y1 + R * mpp, mpp };
  const { w, h } = size(big);
  const v = new Uint8Array(w * h);
  for (const order of [1, 6, 5, 4, 2, 3, 9])
    fill(v, big, feats.filter((f) => cls(f) === order).flatMap((f) => polygons(f.geometry)), order);
  return { v, w, h };
}

/** Pixels where the class changes: the outlines. Points are in the tile's own pixel grid. */
function outline(ref: { v: Uint8Array; w: number; h: number }) {
  const pts: number[] = [];
  const { v, w, h } = ref;
  for (let y = R; y < h - R; y++)
    for (let x = R; x < w - R; x++) {
      const c = v[y * w + x];
      if (c !== v[y * w + x + 1] || c !== v[(y + 1) * w + x]) pts.push(x - R, y - R);
    }
  return pts;
}

/** The map's darkest pixels (lines and lettering), widened by one pixel. */
function dark(px: Uint8Array, w: number, h: number, share: number) {
  const lum = new Uint8Array(w * h);
  const hist = new Array(256).fill(0);
  for (let i = 0; i < w * h; i++) {
    lum[i] = Math.round(0.299 * px[i * 3] + 0.587 * px[i * 3 + 1] + 0.114 * px[i * 3 + 2]);
    hist[lum[i]]++;
  }
  let cut = 0;
  for (let acc = 0; cut < 256 && acc < share * w * h; cut++) acc += hist[cut];
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (lum[y * w + x] >= cut) continue;
      for (let k = -1; k <= 1; k++) {
        if (x + k >= 0 && x + k < w) m[y * w + x + k] = 1;
        if (y + k >= 0 && y + k < h) m[(y + k) * w + x] = 1;
      }
    }
  return m;
}

const out: Record<string, any> = {};
const outPath = `${cache}/align_${map}${process.env.MAP_REF ? "_" + process.env.MAP_REF : ""}.json`;
const prev = Bun.file(outPath);
if (await prev.exists()) Object.assign(out, await prev.json());

for (const t of (await tiles(slicePath, mpp)).filter((t) => !only.length || only.includes(t.id))) {
  const { w, h } = size(t);
  // Prefer Berlin um 1900 where it labels a good part of the tile.
  let ref = reference(t, aisber, (f) => AISBER[f.properties.klassenname] ?? 0);
  let labelled = 0;
  for (let i = 0; i < ref.v.length; i++) if (ref.v[i]) labelled++;
  let refName = "berlin1900";
  const force = process.env.MAP_REF;
  if (force === "alkis" || (force !== "berlin1900" && labelled < 0.25 * ref.v.length)) {
    const alkis = (await Bun.file(`${cache}/alkis/${t.id}.json`).json()).features;
    ref = reference(t, alkis, () => 9);
    refName = "alkis";
  }
  const pts = outline(ref);
  const img = await readRGB(file(t.id), w, h);
  const m = dark(img.px, w, h, 0.12);
  // Score every shift: the share of outline points that land on a dark pixel of the map.
  let best = { dx: 0, dy: 0, score: -1 }, score0 = 0;
  const n = pts.length / 2;
  for (let sy = -R; sy <= R; sy++)
    for (let sx = -R; sx <= R; sx++) {
      let hit = 0;
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i] + sx, y = pts[i + 1] + sy;
        if (x >= 0 && y >= 0 && x < w && y < h && m[y * w + x]) hit++;
      }
      const s = hit / n;
      if (sx === 0 && sy === 0) score0 = s;
      if (s > best.score) best = { dx: sx, dy: sy, score: s };
    }
  // A map feature at pixel p matches the reference at p - shift, so the map sits at +shift: dx east, dy north.
  out[t.id] = { dx: best.dx * mpp, dy: -best.dy * mpp, score: +best.score.toFixed(3), score0: +score0.toFixed(3), ref: refName, points: n };
  console.log(`${t.id} ${refName.padEnd(10)} shift ${out[t.id].dx.toFixed(1)} E ${out[t.id].dy.toFixed(1)} N   hit ${(100 * best.score).toFixed(1)}% (unshifted ${(100 * score0).toFixed(1)}%)  ${n} outline px`);
}
await Bun.write(outPath, JSON.stringify(out, null, 1));
