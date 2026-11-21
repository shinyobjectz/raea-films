// The building fronts along a street (straight, or bending at one end) in the 1917 map (map/1917/buildings.geojson): from each metre of the
// street's axis a ray goes out to each side, and the first footprint it meets is the front there. Where no front is
// met within reach, something opens off the street (a cross street, a square, a gap between buildings).
import { join } from "node:path";

export type Hit = { s: number; d: number; id: number } | { s: number; d: null; id: null };
export type Opening = { side: string; s0: number; s1: number; mid: number };
/** A street's axis: straight through map point a along unit u (east, north), n its left normal (north of an eastward
 *  street). With a bend, below station bend.at the axis leaves the line on a circular arc of the given radius, turning
 *  toward its left or right as one walks towards s0 (Wilhelmstraße curving east into Belle-Alliance-Platz); s stays the
 *  distance along the axis and n the normal there. */
export type Bend = { at: number; radius: number; toward: "left" | "right" };
export type Axis = { a: number[]; u: number[]; n: number[]; s0: number; s1: number; bend?: Bend };

export function axis(a: number[], u: number[], s0: number, s1: number, bend?: Bend): Axis {
  return { a, u, n: [-u[1], u[0]], s0, s1, bend };
}
/** The axis' point and direction at station s. */
function frame(ax: Axis, s: number): { p: number[]; u: number[] } {
  const b = ax.bend;
  if (!b || s >= b.at) return { p: [ax.a[0] + ax.u[0] * s, ax.a[1] + ax.u[1] * s], u: ax.u };
  const sg = b.toward === "left" ? 1 : -1, phi = Math.atan2(ax.u[1], ax.u[0]), th = (sg * (b.at - s)) / b.radius, R = b.radius / sg;
  const p0 = [ax.a[0] + ax.u[0] * b.at, ax.a[1] + ax.u[1] * b.at];
  return { p: [p0[0] - R * (Math.sin(phi + th) - Math.sin(phi)), p0[1] + R * (Math.cos(phi + th) - Math.cos(phi))], u: [Math.cos(phi + th), Math.sin(phi + th)] };
}
/** The left normal at station s. */
export const normal = (ax: Axis, s: number) => { const { u } = frame(ax, s); return [-u[1], u[0]]; };
export const at = (ax: Axis, s: number, off = 0) => { const { p, u } = frame(ax, s); return [p[0] - u[1] * off, p[1] + u[0] * off]; };
/** A map point as [s, d] on the axis: its station and its offset along the normal (+ left). */
export function project(ax: Axis, q: number[]): number[] {
  const dx = q[0] - ax.a[0], dy = q[1] - ax.a[1], s = dx * ax.u[0] + dy * ax.u[1];
  if (!ax.bend || s >= ax.bend.at) return [s, dx * ax.n[0] + dy * ax.n[1]];
  // On the arc: the station whose normal passes through q (the nearest point), found metre by metre then refined.
  let best = [ax.bend.at, Infinity];
  for (let t = ax.bend.at; t >= ax.s0 - 50; t -= 0.25) { const p = at(ax, t), e = Math.hypot(q[0] - p[0], q[1] - p[1]); if (e < best[1]) best = [t, e]; }
  const p = at(ax, best[0]), n = normal(ax, best[0]);
  return [best[0], (q[0] - p[0]) * n[0] + (q[1] - p[1]) * n[1]];
}

type Ring = number[][];
type Bldg = { id: number; rings: Ring[]; props: Record<string, unknown> };

export async function buildings(map: string, ax: Axis, reach: number): Promise<Bldg[]> {
  const g = await Bun.file(join(map, "1917/buildings.geojson")).json();
  const pts = Array.from({ length: Math.ceil((ax.s1 - ax.s0) / 10) + 1 }, (_, i) => at(ax, Math.min(ax.s1, ax.s0 + i * 10))), pad = reach + 20;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const bx = [Math.min(...xs) - pad, Math.max(...xs) + pad], by = [Math.min(...ys) - pad, Math.max(...ys) + pad];
  const out: Bldg[] = [];
  for (const f of g.features) {
    const polys: Ring[][] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const rings = polys.flat();
    if (!rings.some((r) => r.some(([x, y]) => x > bx[0] && x < bx[1] && y > by[0] && y < by[1]))) continue;
    out.push({ id: f.properties.id, rings, props: f.properties });
  }
  return out;
}

/** Distance along the ray p + t·v (t in [0, max]) to segment q0-q1, or null. */
function cross(p: number[], v: number[], q0: number[], q1: number[], max: number): number | null {
  const ex = q1[0] - q0[0], ey = q1[1] - q0[1], den = v[0] * ey - v[1] * ex;
  if (Math.abs(den) < 1e-9) return null;
  const wx = q0[0] - p[0], wy = q0[1] - p[1];
  const t = (wx * ey - wy * ex) / den, k = (wx * v[1] - wy * v[0]) / den;
  return t >= 0 && t <= max && k >= 0 && k <= 1 ? t : null;
}

/** The first front on one side (sign +1 north, -1 south) at each metre of the axis, out to reach. */
export function fronts(ax: Axis, bs: Bldg[], sign: 1 | -1, reach: number): Hit[] {
  const hits: Hit[] = [];
  for (let s = Math.ceil(ax.s0); s <= ax.s1; s++) {
    const p = at(ax, s), nn = normal(ax, s), v = [nn[0] * sign, nn[1] * sign];
    let best: Hit = { s, d: null, id: null };
    for (const b of bs)
      for (const r of b.rings)
        for (let i = 0; i + 1 < r.length; i++) {
          const t = cross(p, v, r[i], r[i + 1], reach);
          if (t !== null && (best.d === null || t < best.d)) best = { s, d: t, id: b.id };
        }
    hits.push(best);
  }
  return hits;
}

/** Runs of at least minLen metres with no front within line + slack: the openings off the street. */
export function openings(hits: Hit[], side: Opening["side"], line: number | ((s: number) => number), slack: number, minLen: number): Opening[] {
  const out: Opening[] = [];
  let start: number | null = null;
  const lineAt = typeof line === "number" ? () => line : line;
  const open = (h: Hit) => h.d === null || h.d > lineAt(h.s) + slack;
  for (let i = 0; i <= hits.length; i++) {
    const o = i < hits.length && open(hits[i]);
    if (o && start === null) start = hits[i].s;
    if (!o && start !== null) {
      const end = hits[i - 1].s;
      if (end - start + 1 >= minLen) out.push({ side, s0: start, s1: end, mid: (start + end) / 2 });
      start = null;
    }
  }
  return out;
}

export const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

/** The building line near each station: the median front within 75 m (fronts beyond 40 m are courts or squares), so a
 *  street that widens keeps its fronts; the whole street's median where there are too few. */
export function localLine(hits: Hit[]): (s: number) => number {
  const ds = hits.flatMap((h) => (h.d === null || h.d > 40 ? [] : [[h.s, h.d]]));
  const all = median(ds.map(([, d]) => d));
  const cache = new Map<number, number>();
  return (s: number) => {
    const k = Math.round(s);
    if (!cache.has(k)) { const near = ds.filter(([t]) => Math.abs(t - k) <= 75).map(([, d]) => d); cache.set(k, near.length >= 30 ? median(near) : all); }
    return cache.get(k)!;
  };
}
