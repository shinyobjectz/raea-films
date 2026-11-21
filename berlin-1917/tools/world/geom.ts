// Plane geometry for the world bake: rings, simplification, triangulation, and a 1 m class raster of the map
// (street, courtyard, building, water, green) for asking "what is in front of this wall?" in O(1).
import earcut from "earcut";

export type Pt = [number, number];
export type Ring = Pt[];

export const ORIGIN: Pt = [391000, 5819000];
/** Map (east, north, height) to scene (x east, y up, z south), the frame graybox.ts and under.ts share. */
export const P = (e: number, n: number, h: number): [number, number, number] => [e - ORIGIN[0], h, -(n - ORIGIN[1])];
/** A map-frame direction (east, north, up) as a scene normal. */
export const N = (ne: number, nn: number, nu = 0): [number, number, number] => [ne, nu, -nn];

export const area2 = (r: Ring) => r.reduce((s, [x, y], i) => s + x * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * y, 0);
export const openRing = (r: Ring): Ring => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r);

/** Douglas-Peucker on a closed ring. */
export function simplify(r: Ring, tol: number): Ring {
  if (r.length < 5) return r;
  const dp = (p: Ring): Ring => {
    const keep = new Uint8Array(p.length);
    keep[0] = keep[p.length - 1] = 1;
    const stack: [number, number][] = [[0, p.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop()!;
      const [ax, ay] = p[a], [bx, by] = p[b], len = Math.hypot(bx - ax, by - ay) || 1;
      let worst = -1, far = 0;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / len;
        if (d > far) (far = d), (worst = i);
      }
      if (far > tol) (keep[worst] = 1), stack.push([a, worst], [worst, b]);
    }
    return p.filter((_, i) => keep[i]);
  };
  let k = 0;
  for (let i = 1; i < r.length; i++) if (Math.hypot(r[i][0] - r[0][0], r[i][1] - r[0][1]) > Math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1])) k = i;
  const out = [...dp(r.slice(0, k + 1)), ...dp([...r.slice(k), r[0]]).slice(1, -1)];
  return out.length >= 3 ? out : r;
}

/** Drop vertices closer than `min` to the previous one, and collinear ones (within `deg`). */
export function clean(r: Ring, min = 0.4, deg = 4): Ring {
  let out = r.filter((p, i) => Math.hypot(p[0] - r[(i + r.length - 1) % r.length][0], p[1] - r[(i + r.length - 1) % r.length][1]) >= min);
  for (let pass = 0; pass < 3 && out.length > 3; pass++) {
    const keep = out.filter((p, i) => {
      const a = out[(i + out.length - 1) % out.length], b = out[(i + 1) % out.length];
      const t1 = Math.atan2(p[1] - a[1], p[0] - a[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
      let d = Math.abs(t2 - t1) % (2 * Math.PI);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d > (deg * Math.PI) / 180;
    });
    if (keep.length === out.length || keep.length < 3) break;
    out = keep;
  }
  return out.length >= 3 ? out : r;
}

/** Outer ring counter-clockwise (seen from above, north up), holes clockwise. */
export function orient(rings: Ring[], tol = 0.25): Ring[] {
  return rings.map((r0, i) => {
    const r = clean(simplify(openRing(r0), tol));
    const ccw = area2(r) > 0;
    return (i === 0) === ccw ? r : r.slice().reverse();
  });
}

export function triangulate(rings: Ring[]): { flat: Ring; tris: number[] } {
  const flat: Ring = [], holes: number[] = [];
  rings.forEach((r, i) => {
    if (i) holes.push(flat.length);
    flat.push(...r);
  });
  const tris = earcut(flat.flat(), holes, 2);
  for (let t = 0; t < tris.length; t += 3) {
    const [a, b, c] = [flat[tris[t]], flat[tris[t + 1]], flat[tris[t + 2]]];
    if ((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) < 0) [tris[t + 1], tris[t + 2]] = [tris[t + 2], tris[t + 1]];
  }
  return { flat, tris };
}

export function densify(r: Ring, step: number): Ring {
  const out: Ring = [];
  for (let i = 0; i < r.length; i++) {
    const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}

/** Intersection of the lines a1-a2 and b1-b2, or null when parallel. */
export function meet(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt | null {
  const d1x = a2[0] - a1[0], d1y = a2[1] - a1[1], d2x = b2[0] - b1[0], d2y = b2[1] - b1[1];
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-6) return null;
  const t = ((b1[0] - a1[0]) * d2y - (b1[1] - a1[1]) * d2x) / den;
  return [a1[0] + t * d1x, a1[1] + t * d1y];
}

/** Offset a CCW ring inward per edge (edge i runs from r[i] to r[i+1]; off[i] metres, 0 keeps it). Mitred corners,
 *  capped at 3x the larger offset so a sharp corner can't fly away. */
export function insetEdges(r: Ring, off: number[]): Ring {
  const n = r.length;
  const lines = r.map((a, i) => {
    const b = r[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L; // inward (left of travel on a CCW ring)
    return [[a[0] + nx * off[i], a[1] + ny * off[i]], [b[0] + nx * off[i], b[1] + ny * off[i]]] as [Pt, Pt];
  });
  return r.map((p, i) => {
    const prev = lines[(i + n - 1) % n], cur = lines[i];
    const m = meet(prev[0], prev[1], cur[0], cur[1]);
    const cap = 3 * Math.max(off[i], off[(i + n - 1) % n], 0.01);
    if (!m || Math.hypot(m[0] - p[0], m[1] - p[1]) > cap) return cur[0];
    return m;
  });
}

// ---------- the class raster ----------
export const CLS = { none: 0, street: 1, court: 2, building: 3, water: 4, green: 5, rail: 6 } as const;

export class ClassRaster {
  data: Uint8Array;
  id: Int32Array; // building index + 1 where CLS.building
  constructor(public x0: number, public y0: number, public w: number, public h: number, public res = 1) {
    this.data = new Uint8Array(w * h);
    this.id = new Int32Array(w * h);
  }
  /** Scanline even-odd fill of a polygon (all its rings) with a class (and an id for buildings). */
  fill(rings: Ring[], cls: number, id = 0) {
    let minY = Infinity, maxY = -Infinity;
    for (const r of rings) for (const [, y] of r) (minY = Math.min(minY, y)), (maxY = Math.max(maxY, y));
    const j0 = Math.max(0, Math.floor((minY - this.y0) / this.res)), j1 = Math.min(this.h - 1, Math.ceil((maxY - this.y0) / this.res));
    const xs: number[] = [];
    for (let j = j0; j <= j1; j++) {
      const y = this.y0 + (j + 0.5) * this.res;
      xs.length = 0;
      for (const r of rings)
        for (let i = 0, k = r.length - 1; i < r.length; k = i++) {
          const [xi, yi] = r[i], [xk, yk] = r[k];
          if (yi > y !== yk > y) xs.push(xi + ((y - yi) * (xk - xi)) / (yk - yi));
        }
      xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2) {
        const i0 = Math.max(0, Math.ceil((xs[q] - this.x0) / this.res - 0.5)), i1 = Math.min(this.w - 1, Math.floor((xs[q + 1] - this.x0) / this.res - 0.5));
        for (let i = i0; i <= i1; i++) (this.data[j * this.w + i] = cls), cls === CLS.building && (this.id[j * this.w + i] = id);
      }
    }
  }
  at(x: number, y: number): number {
    const i = Math.floor((x - this.x0) / this.res), j = Math.floor((y - this.y0) / this.res);
    return i < 0 || j < 0 || i >= this.w || j >= this.h ? CLS.none : this.data[j * this.w + i];
  }
  idAt(x: number, y: number): number {
    const i = Math.floor((x - this.x0) / this.res), j = Math.floor((y - this.y0) / this.res);
    return i < 0 || j < 0 || i >= this.w || j >= this.h ? 0 : this.id[j * this.w + i];
  }
}

/** A deterministic hash of integers to [0, 1). */
export function hash(...ns: number[]): number {
  let h = 2166136261;
  for (const n of ns) {
    h ^= Math.floor(n) | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 2654435761);
  }
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
