// The lit walls and the rooms behind them. A Berlin house has windows only where a wall faces a street or a court (its
// party walls, the Brandmauern, are blind), and every room but a corridor, a pantry or a dark Kammer has a window. So a
// floor is planned from its lit walls inward: each facade (a straight stretch of the footprint's own outline, at
// whatever angle it runs) claims the cells behind it along rays square to it, as deep as a room goes, and is cut
// along its length into rooms a window or two wide. What no facade reaches is the core: corridors, the dark middle.
//   front building, street and court both lit, deeper than 10 m: street rooms to 6.5 m, court rooms to 5 m, the
//     corridor between (the Korridor of a front flat)
//   a wing or a house 10 m deep or less, lit both sides: each side takes its half
//   lit one side only (a side wing against the neighbour's Brandmauer): rooms to 7.5 m, the rest dark core
import { COURT, type Frame, GAP, type Grid, type Poly, STEP, STREET, toLocal, type XY } from "./grid";

export type Lit = "street" | "court";
/** A lit stretch of the outline: from `p` along `t` for `len` metres; `n` points out of the house. */
export interface Facade { id: number; kind: Lit; p: XY; t: XY; n: XY; len: number }

export const cellAt = (grid: Grid, x: number, z: number) => {
  const i = Math.floor((x - grid.x0) / grid.g), j = Math.floor((z - grid.z0) / grid.g);
  return i < 0 || j < 0 || i >= grid.nx || j >= grid.nz ? -1 : j * grid.nx + i;
};
export const valAt = (grid: Grid, x: number, z: number) => { const c = cellAt(grid, x, z); return c < 0 ? GAP : grid.v[c]; };
const open = (v: number) => v === STREET || v === COURT || v === GAP;

/** What's outside a point of the outline, looking along `n`: a street or a court at least 2 m clear, else blind. */
export function outside(grid: Grid, x: number, z: number, n: XY): Lit | null {
  let first = 0;
  for (const d of [0.35, 0.9, 1.5, 2.1]) {
    const v = valAt(grid, x + n[0] * d, z + n[1] * d);
    if (!open(v)) return null;
    if (!first && v !== GAP) first = v;
  }
  if (first) return first === STREET ? "street" : "court";
  // only unmapped ground by the wall (the survey's street edge stops short of the houses): a street if one lies on
  // this line within 12 m, else a court the map hasn't drawn
  for (let d = 2.6; d <= 12; d += 0.5) {
    const v = valAt(grid, x + n[0] * d, z + n[1] * d);
    if (v === STREET) return "street";
    if (v !== GAP) break;
  }
  return "court";
}

/** Douglas-Peucker: the survey reader's outlines jog by up to 0.7 m where the 1910 plan's line was thick; a Berlin wall is
 *  straight, so to 0.8 m. */
function simplify(r: XY[], eps: number): XY[] {
  if (r.length < 4) return r;
  // a closed ring starts and ends on one point: split it at the point farthest from there first
  let far = 1, fd = -1;
  for (let k = 1; k < r.length - 1; k++) { const d = Math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1]); if (d > fd) { fd = d; far = k; } }
  const keep = new Uint8Array(r.length); keep[0] = keep[r.length - 1] = keep[far] = 1;
  const st: [number, number][] = [[0, far], [far, r.length - 1]];
  while (st.length) {
    const [a, b] = st.pop()!;
    const [ax, az] = r[a], [bx, bz] = r[b], L = Math.hypot(bx - ax, bz - az) || 1e-9;
    let m = -1, md = eps;
    for (let k = a + 1; k < b; k++) { const d = Math.abs((bx - ax) * (az - r[k][1]) - (ax - r[k][0]) * (bz - az)) / L; if (d > md) { md = d; m = k; } }
    if (m > 0) { keep[m] = 1; st.push([a, m], [m, b]); }
  }
  return r.filter((_, k) => keep[k]);
}

/** Every lit stretch of the house's outline (its holes' too: a light well is a court), 1.5 m or longer. */
export function facades(grid: Grid, f: Frame, poly: Poly, min = 1.5): Facade[] {
  const out: Facade[] = [];
  for (const ring of poly) {
    const r = simplify(ring.map((p) => toLocal(f, p)), 0.8);
    for (let k = 0; k + 1 < r.length; k++) {
      const [ax, az] = r[k], [bx, bz] = r[k + 1], L = Math.hypot(bx - ax, bz - az);
      if (L < min) continue;
      const t: XY = [(bx - ax) / L, (bz - az) / L];
      // outward: the side whose near point isn't this house
      let n: XY = [t[1], -t[0]];
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      if (valAt(grid, mx + n[0] * 0.3, mz + n[1] * 0.3) === 0) n = [-n[0], -n[1]];
      // walk the edge in half metres; a run of one kind is one facade
      let run: { kind: Lit; s0: number } | null = null;
      const close = (s1: number) => {
        if (run && s1 - run.s0 >= min) out.push({ id: out.length, kind: run.kind, p: [ax + t[0] * run.s0, az + t[1] * run.s0], t, n, len: s1 - run.s0 });
        run = null;
      };
      for (let s = 0.25; s < L; s += 0.5) {
        const kind = outside(grid, ax + t[0] * s, az + t[1] * s, n);
        if (kind !== run?.kind) { close(s - 0.25); if (kind) run = { kind, s0: s - 0.25 }; }
      }
      close(L);
    }
  }
  return out;
}

export interface Claim {
  /** per cell: the facade that owns it, -1 a cell of the house no facade reaches (core), -9 not the house */
  owner: Int32Array;
  /** per cell: metres behind its facade, and along it */
  depth: Float32Array; along: Float32Array;
}

/** Where cell `c`'s centre lies in facade F's frame: [along, depth]. */
export function inFacade(grid: Grid, F: Facade, c: number): XY {
  const x = grid.x0 + ((c % grid.nx) + 0.5) * grid.g, z = grid.z0 + (Math.floor(c / grid.nx) + 0.5) * grid.g;
  const dx = x - F.p[0], dz = z - F.p[1];
  return [dx * F.t[0] + dz * F.t[1], -(dx * F.n[0] + dz * F.n[1])];
}

/** Each facade's rays inward, every quarter metre; a cell goes to the nearest facade (a street one on a tie). */
export function claim(grid: Grid, fs: Facade[]): Claim {
  const n = grid.nx * grid.nz, h = grid.g / 2;
  const owner = new Int32Array(n).fill(-9), depth = new Float32Array(n), along = new Float32Array(n), key = new Float32Array(n).fill(1e9);
  for (let c = 0; c < n; c++) if (grid.v[c] === 0) owner[c] = -1;
  for (const F of fs) {
    for (let s = h / 2; s < F.len; s += h) {
      const x0 = F.p[0] + F.t[0] * s, z0 = F.p[1] + F.t[1] * s;
      const pt = (d: number): XY => [x0 - F.n[0] * d, z0 - F.n[1] * d];
      // the wall's line can fall in a cell the raster gave to the outside: start at the first cell of the house
      let d0 = h / 2;
      while (d0 < 0.75 && valAt(grid, ...pt(d0)) !== 0) d0 += h / 2;
      if (d0 >= 0.75) continue;
      let T = d0;
      while (T < 60 && valAt(grid, ...pt(T + h / 2)) === 0) T += h;
      const far = outside(grid, ...pt(T + h / 2), [-F.n[0], -F.n[1]]);
      let lim: number;
      if (!far) lim = Math.min(T, 7.5);
      else if (T <= 10) lim = T;
      else if (F.kind === far) lim = Math.min(6.0, (T - 1.25) / 2);
      else if (F.kind === "street") lim = Math.min(6.5, T / 2);
      else lim = Math.max(2.5, Math.min(5.0, T - Math.min(6.5, T / 2) - 1.25));
      for (let d = d0; d < Math.min(lim, T); d += h) {
        const c = cellAt(grid, ...pt(d));
        if (c < 0 || grid.v[c] !== 0) continue;
        const kk = d + (F.kind === "street" ? 0 : 0.01);
        if (kk < key[c]) { key[c] = kk; owner[c] = F.id; }
      }
    }
  }
  for (let c = 0; c < n; c++) if (owner[c] >= 0) { const [a, d] = inFacade(grid, fs[owner[c]], c); along[c] = a; depth[c] = d; }
  // cells a ray skipped between two of its own (a quarter-metre ray grid on a half-metre cell grid at an angle): give
  // a core cell boxed in by one facade's cells to it
  for (let pass = 0; pass < 2; pass++) for (let c = 0; c < n; c++) {
    if (owner[c] !== -1) continue;
    const i = c % grid.nx, j = Math.floor(c / grid.nx), seen = new Map<number, number>();
    for (const [dx, dz] of STEP) { const ii = i + dx, jj = j + dz; if (ii >= 0 && jj >= 0 && ii < grid.nx && jj < grid.nz) { const o = owner[jj * grid.nx + ii]; if (o >= 0) seen.set(o, (seen.get(o) ?? 0) + 1); } }
    const best = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 3) { owner[c] = best[0]; const [a, d] = inFacade(grid, fs[best[0]], c); along[c] = a; depth[c] = d; }
  }
  return { owner, depth, along };
}

/** A room of the floor: its cells, which facade it's behind (-1 for the core) and its span along that facade. */
export interface Cells { id: number; facade: number; cells: number[]; s0: number; s1: number; stair?: boolean }

/** Cut each facade's claim along its length into rooms (seeded widths) around `reserve`d spans (the stairs), and the
 *  core into its connected parts. Spans are metres along the facade. */
export function rooms(grid: Grid, fs: Facade[], cl: Claim, rnd: (k: number) => number, reserve: Map<number, [number, number][]> = new Map()): { list: Cells[]; of: Int32Array } {
  const of = new Int32Array(grid.nx * grid.nz).fill(-1), list: Cells[] = [];
  const byFacade = new Map<number, number[]>();
  for (let c = 0; c < of.length; c++) if (cl.owner[c] >= 0) (byFacade.get(cl.owner[c]) ?? byFacade.set(cl.owner[c], []).get(cl.owner[c])!).push(c);
  for (const F of fs) {
    const cells = byFacade.get(F.id);
    if (!cells?.length) continue;
    const spans: [number, number, boolean][] = [];
    const res = (reserve.get(F.id) ?? []).slice().sort((x, y) => x[0] - y[0]);
    let s = 0, k = 0;
    const fillTo = (end: number) => {
      while (end - s > 0.05) {
        const [lo, hi] = F.kind === "street" ? [3.4, 6.2] : [2.6, 4.4];
        let w = lo + (hi - lo) * rnd(F.id * 97 + k++);
        if (end - s - w < 2.4) w = end - s;
        spans.push([s, s + w, false]); s += w;
      }
    };
    for (const [r0, r1] of res) { if (r0 > s) fillTo(r0); spans.push([r0, r1, true]); s = r1; }
    fillTo(F.len);
    spans[spans.length - 1][1] = Infinity;
    spans[0][0] = -Infinity;
    for (const [a, b, st] of spans) {
      const mine = cells.filter((c) => cl.along[c] >= a && cl.along[c] < b);
      if (!mine.length) continue;
      const id = list.length;
      for (const c of mine) of[c] = id;
      list.push({ id, facade: F.id, cells: mine, s0: Math.max(0, a), s1: Math.min(F.len, b), stair: st });
    }
  }
  // the core: what no facade reached, in connected parts
  for (let c = 0; c < of.length; c++) {
    if (cl.owner[c] !== -1 || of[c] !== -1) continue;
    const id = list.length, stack = [c], mine: number[] = [];
    of[c] = id;
    while (stack.length) {
      const q = stack.pop()!; mine.push(q);
      const i = q % grid.nx, j = Math.floor(q / grid.nx);
      for (const [dx, dz] of STEP) {
        const ii = i + dx, jj = j + dz;
        if (ii < 0 || jj < 0 || ii >= grid.nx || jj >= grid.nz) continue;
        const nb = jj * grid.nx + ii;
        if (cl.owner[nb] === -1 && of[nb] === -1) { of[nb] = id; stack.push(nb); }
      }
    }
    list.push({ id, facade: -1, cells: mine, s0: 0, s1: 0 });
  }
  return { list, of };
}
