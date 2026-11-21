// Blocks as tie points for fitting a plate (hobrecht.ts). Hobrecht's plates outline every block with its building
// line, so each block is a closed white region; on the map a block is a connected region that is neither street nor
// water. A block's centroid moves with the whole block, so a pair cannot land on the wrong side of a street the way a
// point on a line can (on Blatt 4 the line fit alone left Friedrichstadt 10-17 m off, with 29% of the sewers under
// houses). Pairs are mutual nearest centroids within a radius whose areas agree within 0.7-1.4x.
import { fill, polygons } from "./raster";

export type Block = { x: number; y: number; a: number };

/** 4-connected regions of mask (1 = inside) that never touch `wall` (out of bounds counts as wall). */
function regions(mask: Uint8Array, w: number, h: number, wall: (i: number) => boolean) {
  const lab = new Int32Array(w * h), stack = new Int32Array(w * h), out: Block[] = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || lab[s]) continue;
    let n = 0, sx = 0, sy = 0, touches = false, top = 0;
    lab[s] = 1;
    stack[top++] = s;
    while (top) {
      const i = stack[--top], x = i % w, y = (i / w) | 0;
      n++, (sx += x), (sy += y);
      for (const j of [x ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j < 0 || wall(j)) { touches = true; continue; }
        if (mask[j] && !lab[j]) (lab[j] = 1), (stack[top++] = j);
      }
    }
    if (!touches) out.push({ x: sx / n + 0.5, y: sy / n + 0.5, a: n });
  }
  return out;
}

/** The plate's blocks in plate px: white (grey >= dark, with no dark pixel within 1 px) inside the usable frame. */
export function plateBlocks(grey: Uint8Array, w: number, h: number, dark: number, usable: (x: number, y: number) => boolean) {
  const mask = new Uint8Array(w * h), ok = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!usable(x, y)) continue;
    ok[i] = 1;
    let white = true;
    for (let dy = -1; dy <= 1 && white; dy++) for (let dx = -1; dx <= 1; dx++) if (grey[i + dy * w + dx] < dark) { white = false; break; }
    mask[i] = white ? 1 : 0;
  }
  return regions(mask, w, h, (i) => !ok[i]);
}

/** The map's blocks in metres (EPSG:25833): not street (open.geojson) and not water, rasterised at mpp over bbox. */
export async function mapBlocks(map: string, bbox: number[], mpp = 0.5) {
  const [x0, y0, x1, y1] = bbox, w = Math.round((x1 - x0) / mpp), h = Math.round((y1 - y0) / mpp);
  const mask = new Uint8Array(w * h).fill(1), t = { id: "blocks", x0, y0, x1, y1, mpp };
  const open = (await Bun.file(`${map}/open.geojson`).json()).features.filter((f: any) => f.properties.kind === "street");
  fill(mask, t, open.flatMap((f: any) => polygons(f.geometry)), 0);
  fill(mask, t, (await Bun.file(`${map}/water.geojson`).json()).features.flatMap((f: any) => polygons(f.geometry)), 0);
  return regions(mask, w, h, () => false).map((b) => ({ x: x0 + b.x * mpp, y: y1 - b.y * mpp, a: b.a * mpp * mpp }));
}

/** Mutual-nearest pairs: `ours` already mapped into the plate (px, py, area in px2) against the plate's blocks. */
export function pairBlocks(ours: { px: number; py: number; a: number }[], plate: Block[], radius: number) {
  const nearest = (x: number, y: number, set: { x: number; y: number }[]) => {
    let k = -1, d = Infinity;
    set.forEach((q, j) => { const e = Math.hypot(q.x - x, q.y - y); if (e < d) (d = e), (k = j); });
    return [k, d] as const;
  };
  const mapped = ours.map((o) => ({ x: o.px, y: o.py }));
  const pairs: { i: number; j: number; d: number }[] = [];
  ours.forEach((o, i) => {
    const [j, d] = nearest(o.px, o.py, plate);
    if (j < 0 || d > radius) return;
    const r = plate[j].a / o.a;
    if (r < 0.7 || r > 1.4 || nearest(plate[j].x, plate[j].y, mapped)[0] !== i) return;
    pairs.push({ i, j, d });
  });
  return pairs;
}
