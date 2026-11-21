// What a plate's polynomial fit (hobrecht.ts) cannot bend to: a smooth field d(p), in metres, such that the warped
// plate's content for map point p sits at p + d. Per WIN m window every STEP m, the shift within +-SEARCH m that best
// lays the plate's distance-to-the-nearest-line onto the map's distance-to-the-nearest-building-line (the edges of
// open.geojson's street space), as the mean absolute difference, both capped at CAP m. Each node then takes the median
// of its 3 x 3 neighbours, and d between nodes is their Gaussian-weighted mean (SIGMA m). This only works from a
// start within a few metres: from 10 m off, the doubled lines (building line and sewer) give wrong minima, which is
// why the blocks come first. On Blatt 4 it moved sewer lying over 3 m inside a building from 3.6% to 2.5%.
import { polygons } from "./raster";
import { chamfer } from "./thin";

export type Node = { x: number; y: number; dx: number; dy: number };
const WIN = 250, STEP = 125, SEARCH = 10, CAP = 15, SIGMA = 80, MINSAMPLES = 600;

/** The field for a north-up plate image (grey, mpp m per px over bbox) against the map's street edges. */
export async function plateField(grey: Uint8Array, w: number, h: number, mpp: number, bbox: number[], map: string): Promise<Node[]> {
  const [bx0, by0, bx1, by1] = bbox, cap = CAP / mpp;
  const plate = chamfer(w, h, (i) => grey[i] < 150);
  const lines = new Uint8Array(w * h);
  const seg = (ax: number, ay: number, bx: number, by: number) => {
    const L = Math.max(Math.hypot(bx - ax, by - ay), 1e-9);
    for (let s = 0; s <= L; s += mpp / 2) {
      const u = Math.floor((ax + ((bx - ax) * s) / L - bx0) / mpp), v = Math.floor((by1 - (ay + ((by - ay) * s) / L)) / mpp);
      if (u >= 0 && v >= 0 && u < w && v < h) lines[v * w + u] = 1;
    }
  };
  for (const f of (await Bun.file(`${map}/open.geojson`).json()).features)
    if (f.properties.kind === "street") for (const p of polygons(f.geometry)) for (const r of p) for (let i = 0; i + 1 < r.length; i++) seg(r[i][0], r[i][1], r[i + 1][0], r[i + 1][1]);
  const ours = chamfer(w, h, (i) => lines[i] === 1);
  const at = (D: Float32Array, i: number) => Math.min(D[i], cap);

  const raw: Node[] = [], R = Math.round(SEARCH / mpp), n = WIN / mpp;
  for (let cy = by0 + WIN / 2; cy <= by1 - WIN / 2; cy += STEP)
    for (let cx = bx0 + WIN / 2; cx <= bx1 - WIN / 2; cx += STEP) {
      const u0 = Math.round((cx - WIN / 2 - bx0) / mpp), v0 = Math.round((by1 - cy - WIN / 2) / mpp), S: number[] = [];
      for (let v = v0 + R; v < v0 + n - R; v += 4) for (let u = u0 + R; u < u0 + n - R; u += 4) {
        const i = v * w + u;
        if (ours[i] < cap && plate[i] < cap) S.push(i);
      }
      if (S.length < MINSAMPLES) continue;
      const score = (du: number, dv: number) => { let s = 0; for (const i of S) s += Math.abs(at(plate, i + dv * w + du) - at(ours, i)); return s / S.length; };
      let best = { du: 0, dv: 0, s: score(0, 0) };
      for (let dv = -R; dv <= R; dv += 2) for (let du = -R; du <= R; du += 2) { const s = score(du, dv); if (s < best.s) best = { du, dv, s }; }
      const c = { ...best };
      for (let dv = c.dv - 1; dv <= c.dv + 1; dv++) for (let du = c.du - 1; du <= c.du + 1; du++) { const s = score(du, dv); if (s < best.s) best = { du, dv, s }; }
      raw.push({ x: cx, y: cy, dx: best.du * mpp, dy: -best.dv * mpp });
    }
  const key = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`, byKey = new Map(raw.map((k) => [key(k.x, k.y), k]));
  const median = (v: number[]) => v.sort((a, b) => a - b)[v.length >> 1];
  return raw.map((k) => {
    const nb: Node[] = [];
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const m = byKey.get(key(k.x + i * STEP, k.y + j * STEP)); if (m) nb.push(m); }
    return { x: k.x, y: k.y, dx: +median(nb.map((m) => m.dx)).toFixed(2), dy: +median(nb.map((m) => m.dy)).toFixed(2) };
  });
}

/** d at (x, y): the nodes' Gaussian-weighted mean within 2 sigma, else no shift. */
export function fieldAt(nodes: Node[], x: number, y: number): [number, number] {
  let wsum = 0, sx = 0, sy = 0;
  for (const k of nodes) {
    const r2 = (k.x - x) ** 2 + (k.y - y) ** 2;
    if (r2 > 4 * SIGMA * SIGMA) continue;
    const g = Math.exp(-r2 / (2 * SIGMA * SIGMA));
    (wsum += g), (sx += g * k.dx), (sy += g * k.dy);
  }
  return wsum ? [sx / wsum, sy / wsum] : [0, 0];
}

/** d on a lattice every `cell` m over bbox, read back bilinearly (the Gaussian is too slow per pixel). */
export function fieldGrid(nodes: Node[], bbox: number[], cell = 10) {
  const [x0, y0, x1, y1] = bbox, gw = Math.ceil((x1 - x0) / cell) + 1, gh = Math.ceil((y1 - y0) / cell) + 1;
  const g = new Float32Array(gw * gh * 2);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const [dx, dy] = fieldAt(nodes, x0 + i * cell, y0 + j * cell); g[(j * gw + i) * 2] = dx; g[(j * gw + i) * 2 + 1] = dy; }
  return (x: number, y: number): [number, number] => {
    const fx = Math.min(Math.max((x - x0) / cell, 0), gw - 1.001), fy = Math.min(Math.max((y - y0) / cell, 0), gh - 1.001);
    const i = Math.floor(fx), j = Math.floor(fy), a = fx - i, b = fy - j, k = (jj: number, ii: number, c: number) => g[(jj * gw + ii) * 2 + c];
    return [0, 1].map((c) => (k(j, i, c) * (1 - a) + k(j, i + 1, c) * a) * (1 - b) + (k(j + 1, i, c) * (1 - a) + k(j + 1, i + 1, c) * a) * b) as [number, number];
  };
}
