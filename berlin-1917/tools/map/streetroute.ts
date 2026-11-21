// A line along the middle of the 1917 street space through given waypoints: a least-cost path on a 1 m raster of
// open.geojson's street polygons (and any extra polygons, a bridge deck), each step costing more the nearer it runs to
// the street's edge, so the line keeps to the middle. For pipes and mains a source names by street but draws no line
// (Hobrecht's Blatt 26); it does not need skeleton.ts's graph, which has holes (none within 280 m of Pumpstation III).
// Bridge decks (bridges.geojson) join the streets over the water, and gaps under CLOSE m are closed. Waypoints are
// snapped to the nearest street cell within SNAP m; the result is simplified to TOL m.
import { fill, polygons, size, type Tile } from "./raster";

const PAD = 120, SNAP = 40, TOL = 1, EDGE = 6, CLOSE = 2;

export async function streetRoute(map: string, way: number[][], extra: any[] = [], loose = false): Promise<number[][]> {
  const xs = way.map((p) => p[0]), ys = way.map((p) => p[1]);
  const t: Tile = { id: "route", x0: Math.floor(Math.min(...xs) - PAD), y0: Math.floor(Math.min(...ys) - PAD), x1: Math.ceil(Math.max(...xs) + PAD), y1: Math.ceil(Math.max(...ys) + PAD), mpp: 1 };
  const { w, h } = size(t), n = w * h, m = new Uint8Array(n);
  for (const f of (await Bun.file(`${map}/open.geojson`).json()).features) if (f.properties.kind === "street" || (loose && f.properties.kind === "courtyard")) fill(m, t, polygons(f.geometry), 1);
  for (const g of extra) fill(m, t, polygons(g), 1);
  // loose: also open ground the reader filed as courtyard and the planted strips (green.geojson), as it did with much of
  // the tree-lined Hallesches Ufer; waypoints then keep the line to the street meant.
  if (loose) for (const g of (await Bun.file(`${map}/green.geojson`).json()).features) fill(m, t, polygons(g.geometry), 1);
  // Bridges carry the streets over the water; the street polygons stop at their ends.
  for (const b of (await Bun.file(`${map}/bridges.geojson`).json()).features) fill(m, t, polygons(b.geometry), 1);
  // Close CLOSE m gaps (slivers between pieces the trace left apart).
  for (const v of [1, 0] as const) for (let r = 0; r < CLOSE; r++) {
    const src = m.slice();
    for (let i = 0; i < n; i++) { if (src[i] === v) continue; const x = i % w; if ((x > 0 && src[i - 1] === v) || (x < w - 1 && src[i + 1] === v) || (i >= w && src[i - w] === v) || (i + w < n && src[i + w] === v)) m[i] = v; }
  }
  // Distance to the street's edge (chamfer 1 / 1.4), in metres.
  const D = new Float32Array(n);
  for (let i = 0; i < n; i++) D[i] = m[i] ? 1e6 : 0;
  for (const dir of [1, -1]) for (let k = 0; k < n; k++) {
    const i = dir === 1 ? k : n - 1 - k, x = i % w, y = (i / w) | 0;
    if (!m[i]) continue;
    for (const [dx, dy, c] of dir === 1 ? [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.4], [1, -1, 1.4]] : [[1, 0, 1], [0, 1, 1], [1, 1, 1.4], [-1, 1, 1.4]]) {
      const X = x + dx, Y = y + dy;
      D[i] = Math.min(D[i], X < 0 || Y < 0 || X >= w || Y >= h ? c : D[Y * w + X] + c);
    }
  }
  const cell = ([x, y]: number[]) => {
    const cx = Math.floor(x - t.x0), cy = Math.floor(t.y1 - y);
    let best = -1, bd = Infinity;
    for (let dy = -SNAP; dy <= SNAP; dy++) for (let dx = -SNAP; dx <= SNAP; dx++) {
      const X = cx + dx, Y = cy + dy, d = dx * dx + dy * dy;
      if (X >= 0 && Y >= 0 && X < w && Y < h && m[Y * w + X] && d < bd) (bd = d), (best = Y * w + X);
    }
    if (best < 0) throw new Error(`no street within ${SNAP} m of ${x.toFixed(1)} ${y.toFixed(1)}`);
    return best;
  };
  // Dijkstra on 8 neighbours with a binary heap.
  const leg = (s: number, e: number) => {
    const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), heap: number[] = [];
    const push = (i: number) => { heap.push(i); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (dist[heap[p]] <= dist[heap[k]]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s2 = k; if (l < heap.length && dist[heap[l]] < dist[heap[s2]]) s2 = l; if (r < heap.length && dist[heap[r]] < dist[heap[s2]]) s2 = r; if (s2 === k) break; [heap[s2], heap[k]] = [heap[k], heap[s2]]; k = s2; } } return top; };
    dist[s] = 0; push(s);
    while (heap.length) {
      const i = pop();
      if (i === e) break;
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy, c] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]) {
        const X = x + dx, Y = y + dy, j = Y * w + X;
        if (X < 0 || Y < 0 || X >= w || Y >= h || !m[j]) continue;
        const nd = dist[i] + c * (1 + EDGE / (1 + D[j]));
        if (nd < dist[j]) (dist[j] = nd), (prev[j] = i), push(j);
      }
    }
    if (prev[e] < 0 && e !== s) throw new Error("waypoints not joined by street space");
    const out: number[][] = [];
    for (let i = e; i !== -1; i = prev[i]) out.unshift([t.x0 + (i % w) + 0.5, t.y1 - ((i / w) | 0) - 0.5]);
    return out;
  };
  const cells = way.map(cell), pts: number[][] = [way[0]];
  for (let k = 1; k < cells.length; k++) pts.push(...leg(cells[k - 1], cells[k]).slice(k === 1 ? 0 : 1));
  return simplify(pts, TOL).map((p) => [+p[0].toFixed(2), +p[1].toFixed(2)]);
}

/** Douglas-Peucker. */
function simplify(p: number[][], tol: number): number[][] {
  if (p.length < 3) return p;
  const [a, b] = [p[0], p[p.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  let k = 0, dm = 0;
  for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / L; if (d > dm) (dm = d), (k = i); }
  return dm <= tol ? [a, b] : [...simplify(p.slice(0, k + 1), tol).slice(0, -1), ...simplify(p.slice(k), tol)];
}
