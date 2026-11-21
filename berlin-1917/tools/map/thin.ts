// Raster line tools shared by skeleton.ts (street centre lines) and hobrechttrace.ts (sewers read off Hobrecht's
// plates): a chamfer distance, opening by distance, connected pieces, Zhang-Suen thinning, and reading a thinned raster
// back as a graph of junctions and the lines between them, with pruning and Douglas-Peucker.
// Rasters are row-major Uint8Array masks of W x H; `at(i)` gives a pixel's map point.

/** Distance from every pixel to the nearest pixel where `zero(i)` holds (chamfer 1 / 1.4142, in pixels). */
export function chamfer(W: number, H: number, zero: (i: number) => boolean): Float32Array {
  const d = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) d[i] = zero(i) ? 0 : 1e9;
  const relax = (i: number, j: number, s: number) => { if (d[j] + s < d[i]) d[i] = d[j] + s; };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      if (x > 0) relax(i, i - 1, 1);
      if (y > 0) { relax(i, i - W, 1); if (x > 0) relax(i, i - W - 1, 1.4142); if (x < W - 1) relax(i, i - W + 1, 1.4142); }
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      if (x < W - 1) relax(i, i + 1, 1);
      if (y < H - 1) { relax(i, i + W, 1); if (x < W - 1) relax(i, i + W + 1, 1.4142); if (x > 0) relax(i, i + W - 1, 1.4142); }
    }
  return d;
}

/** Morphological opening of `img` by r pixels, given its distance to the background: keeps what lies within r of a
 * pixel at least r inside. Cuts every link narrower than 2r. */
export function open(img: Uint8Array, W: number, H: number, dist: Float32Array, r: number) {
  const near = chamfer(W, H, (i) => dist[i] >= r);
  for (let i = 0; i < W * H; i++) if (img[i] && near[i] > r) img[i] = 0;
}

/** 4-connected pieces of `img`; `keep(members)` decides each piece, the rest are cleared. Returns the kept pieces. */
export function pieces(img: Uint8Array, W: number, H: number, keep: (members: number[]) => boolean): number[][] {
  const comp = new Uint8Array(W * H), kept: number[][] = [];
  for (let s = 0; s < W * H; s++) {
    if (!img[s] || comp[s]) continue;
    const members = [s];
    comp[s] = 1;
    for (let k = 0; k < members.length; k++) {
      const c = members[k], x = c % W;
      for (const j of [c - W, c + W, x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1]) if (j >= 0 && j < W * H && img[j] && !comp[j]) { comp[j] = 1; members.push(j); }
    }
    if (keep(members)) kept.push(members);
    else for (const m of members) img[m] = 0;
  }
  return kept;
}

/** Zhang-Suen thinning in place; returns the remaining foreground pixels. */
export function thin(img: Uint8Array, W: number, H: number): number[] {
  const nb = (i: number) => [i - W, i - W + 1, i + 1, i + W + 1, i + W, i + W - 1, i - 1, i - W - 1]; // P2..P9, clockwise from north
  let fg: number[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (img[y * W + x]) fg.push(y * W + x);
  for (let changed = true; changed; ) {
    changed = false;
    for (const step of [0, 1]) {
      const del: number[] = [];
      for (const i of fg) {
        if (!img[i]) continue;
        const p = nb(i).map((j) => img[j]);
        const b = p.reduce((s, v) => s + v, 0);
        if (b < 2 || b > 6) continue;
        let a = 0;
        for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
        if (a !== 1) continue;
        if (step === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue;
        del.push(i);
      }
      for (const i of del) img[i] = 0;
      if (del.length) changed = true;
    }
    fg = fg.filter((i) => img[i]);
  }
  return fg;
}

export type Edge = { a: number; b: number; pts: number[][] };
/** A thinned raster as a graph: junction pixels (not 2 neighbours) merged into nodes [x, y, max val], lines traced
 * between them as points [x, y, val]. */
export function graph(img: Uint8Array, W: number, fg: number[], at: (i: number) => number[], val: (i: number) => number) {
  const nb = (i: number) => [i - W, i - W + 1, i + 1, i + W + 1, i + W, i + W - 1, i - 1, i - W - 1];
  const deg = (i: number) => nb(i).reduce((s, j) => s + img[j], 0);
  const nodeOf = new Map<number, number>();
  const nodes: number[][] = [];
  for (const i of fg) {
    if (deg(i) === 2 || nodeOf.has(i)) continue;
    const id = nodes.length, stack = [i], members: number[] = [];
    nodeOf.set(i, id);
    while (stack.length) {
      const c = stack.pop()!;
      members.push(c);
      for (const j of nb(c)) if (img[j] && deg(j) !== 2 && !nodeOf.has(j)) { nodeOf.set(j, id); stack.push(j); }
    }
    const xy = members.map(at), n = members.length;
    nodes.push([xy.reduce((s, p) => s + p[0], 0) / n, xy.reduce((s, p) => s + p[1], 0) / n, Math.max(...members.map(val))]);
  }
  const edges: Edge[] = [];
  const seen = new Uint8Array(img.length);
  for (const i of fg) {
    if (!nodeOf.has(i)) continue;
    for (const first of nb(i)) {
      if (!img[first] || nodeOf.has(first) || seen[first]) continue;
      const line = [i, first];
      seen[first] = 1;
      let cur = first, prev = i, end = -1;
      for (;;) {
        const next = nb(cur).find((j) => img[j] && j !== prev && !line.includes(j) && (nodeOf.has(j) || !seen[j]));
        if (next === undefined) break;
        if (nodeOf.has(next) && nodeOf.get(next) !== nodeOf.get(i) || nodeOf.has(next) && line.length > 3) { end = next; line.push(next); break; }
        if (nodeOf.has(next)) break;
        seen[next] = 1; line.push(next); prev = cur; cur = next;
      }
      if (end < 0) continue;
      edges.push({ a: nodeOf.get(i)!, b: nodeOf.get(end)!, pts: line.map((p) => [...at(p), val(p)]) });
    }
  }
  return { nodes, edges };
}

export const len = (p: number[][]) => p.reduce((s, q, k) => (k ? s + Math.hypot(q[0] - p[k - 1][0], q[1] - p[k - 1][1]) : 0), 0);
export const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

/** Drops dead ends shorter than `spur` (rounds times; a lone line of at least `lone` stays). Returns the count dropped. */
export function prune(edges: Edge[], spur: number, rounds: number, lone: number): Edge[] {
  for (let round = 0; round < rounds; round++) {
    const d = new Map<number, number>();
    for (const e of edges) { d.set(e.a, (d.get(e.a) ?? 0) + 1); d.set(e.b, (d.get(e.b) ?? 0) + 1); }
    edges = edges.filter((e) => !((d.get(e.a) === 1 || d.get(e.b) === 1) && len(e.pts) < spur && !(d.get(e.a) === 1 && d.get(e.b) === 1 && len(e.pts) >= lone)));
  }
  return edges;
}

/** Joins the two lines at every node with exactly two. */
export function mergeThrough(edges: Edge[]): Edge[] {
  for (let merged = true; merged; ) {
    merged = false;
    const at2 = new Map<number, Edge[]>();
    for (const e of edges) for (const n of [e.a, e.b]) at2.set(n, [...(at2.get(n) ?? []), e]);
    for (const [n, es] of at2) {
      if (es.length !== 2 || es[0] === es[1]) continue;
      const [e, f] = es;
      const ep = e.b === n ? e.pts : [...e.pts].reverse(), fp = f.a === n ? f.pts : [...f.pts].reverse();
      const ea = e.b === n ? e.a : e.b, fb = f.a === n ? f.b : f.a;
      edges = edges.filter((x) => x !== e && x !== f);
      edges.push({ a: ea, b: fb, pts: [...ep, ...fp.slice(1)] });
      merged = true;
      break;
    }
  }
  return edges;
}

/** Douglas-Peucker on x, y within tol (keeps each kept point's other values). */
export function simplify(p: number[][], tol: number): number[][] {
  if (p.length < 3) return p;
  const [a, b] = [p[0], p[p.length - 1]], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  let worst = 0, k = 0;
  for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i][0] - a[0]) * dy - (p[i][1] - a[1]) * dx) / l; if (d > worst) { worst = d; k = i; } }
  return worst <= tol ? [a, b] : [...simplify(p.slice(0, k + 1), tol).slice(0, -1), ...simplify(p.slice(k), tol)];
}

/** Polygons (GeoJSON coordinates of Polygon or MultiPolygon geometries) filled even-odd into a raster of C m cells
 * whose top-left corner is (X0, Y1): each ring's crossings per row, at the cells' centres. */
export function fillPolys(geoms: { type: string; coordinates: unknown }[], X0: number, Y1: number, W: number, H: number, C = 1): Uint8Array {
  const img = new Uint8Array(W * H);
  const rows: number[][] = Array.from({ length: H }, () => []);
  for (const g of geoms)
    for (const poly of (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as number[][][][])
      for (const r of poly)
        for (let k = 0; k + 1 < r.length; k++) {
          const [xa, ya] = r[k], [xb, yb] = r[k + 1];
          if (ya === yb) continue;
          const r0 = Math.max(0, Math.ceil((Y1 - Math.max(ya, yb)) / C - 0.5)), r1 = Math.min(H - 1, Math.floor((Y1 - Math.min(ya, yb)) / C - 0.5));
          for (let j = r0; j <= r1; j++) {
            const y = Y1 - (j + 0.5) * C;
            if ((y < ya) === (y < yb)) continue;
            rows[j].push((xa + ((y - ya) / (yb - ya)) * (xb - xa) - X0) / C);
          }
        }
  for (let j = 0; j < H; j++) {
    const xs = rows[j].sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let i = Math.max(0, Math.ceil(xs[k] - 0.5)); i <= Math.min(W - 1, Math.floor(xs[k + 1] - 0.5)); i++) img[j * W + i] = 1;
  }
  return img;
}
