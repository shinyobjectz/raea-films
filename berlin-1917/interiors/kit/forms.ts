// Shared forms for the kit's machines (moto.ts, cars.ts): profiles turned, extruded and hulled; curves, tubes, strips,
// springs, tyres and wire wheels; a section swept along a path. Each takes metres and returns a Solid at the origin
// unless it says where.
import { crossSection, manifold, type Solid } from "raea/3d";
import { lathe, type V3 } from "./geo";
import { rod } from "./outgeo";

export type P2 = [number, number];
export const xAxis = (s: Solid) => s.rotate(0, 0, 90);
export const zAxis = (s: Solid) => s.rotate(90, 0, 0);
export const area = (p: P2[]) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
export const ccw = (p: P2[]) => (area(p) < 0 ? [...p].reverse() : p);
export const poly = (p: P2[]) => crossSection.polygon(ccw(p));
/** A revolved profile [r, y], wound either way, about y. */
export const turn = (p: P2[], segments: number) => lathe(ccw(p), 0, 0, 0, segments);
/** A side profile in (z, y) extruded w across x, centred on x. */
export const side = (p: P2[], w: number) => poly(p).extrude(w).rotate(0, -90, 0).move(w / 2, 0, 0);
/** A plan outline in (x, z) extruded up y from y0 to y1. */
export const plan = (p: P2[], y0: number, y1: number) => poly(p).extrude(y1 - y0).rotate(90, 0, 0).move(0, y1, 0);
/** A section in (x, y) extruded along z from z0 to z1. */
export const along = (p: P2[], z0: number, z1: number) => poly(p).extrude(z1 - z0).move(0, 0, z0);
/** A sphere with n segments round and n/2 up (geo's ball is coarse for a hull's rounded edges). */
export const sph = (r: number, n = 16) => { const p: P2[] = [[0, -r]]; for (let i = 1; i < n / 2; i++) { const a = -Math.PI / 2 + (Math.PI * 2 * i) / n; p.push([r * Math.cos(a), r * Math.sin(a)]); } p.push([0, r]); return turn(p, n); };
export const add3 = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
/** A cubic Bezier through four control points, n steps. */
export const bez = (P: V3[], n: number): V3[] => { const o: V3[] = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]; o.push([0, 1, 2].map((k) => P.reduce((s, p, j) => s + p[k] * w[j], 0)) as V3); } return o; };
/** A smooth path through 2D points (Catmull-Rom), n steps between each pair. */
export function smooth(p: P2[], n = 4): P2[] {
  const o: P2[] = [];
  for (let i = 0; i + 1 < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; o.push([0, 1].map((j) => 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3)) as P2); }
  }
  o.push(p[p.length - 1]);
  return o;
}
/** A tube along points, its joints filled by balls so a bend stays round. */
export const tube = (pts: V3[], r: number): Solid[] => { const s: Solid[] = []; for (let i = 0; i + 1 < pts.length; i++) s.push(rod(pts[i], pts[i + 1], r)); for (let i = 1; i + 1 < pts.length; i++) s.push(sph(r, 8).move(...pts[i])); return s; };
/** A flat strip from a to b, w wide in the plane of the run and y, t thick across x. */
export const slat = (a: V3, b: V3, w: number, t: number) => { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); return manifold.box(t, w, L).rotate((-Math.asin(dy / L) * 180) / Math.PI, (Math.atan2(dx, dz) * 180) / Math.PI, 0).move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); };
/** A coil spring standing from `at` along y, h high, r round, of wire w, `turns` turns. */
export const coil = (at: V3, h: number, r: number, w: number, turns = 6, per = 8) => { const p: V3[] = []; const n = turns * per; for (let i = 0; i <= n; i++) { const a = (i / per) * Math.PI * 2; p.push([at[0] + r * Math.cos(a), at[1] + (h * i) / n, at[2] + r * Math.sin(a)]); } return p.slice(0, -1).map((q, i) => rod(q, p[i + 1], w)); };
/** Points inset d from a convex polygon's edges (each corner moved to where its two inset edges meet). */
export function inset(p: P2[], d: number): P2[] {
  const q = ccw(p), n = q.length, lines = q.map((a, i) => { const b = q[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; return { a: [a[0] + nx * d, a[1] + ny * d] as P2, d: [dx, dy] as P2 }; });
  return lines.map((l1, i) => { const l0 = lines[(i + n - 1) % n], den = l0.d[0] * l1.d[1] - l0.d[1] * l1.d[0], t = ((l1.a[0] - l0.a[0]) * l1.d[1] - (l1.a[1] - l0.a[1]) * l1.d[0]) / den; return [l0.a[0] + l0.d[0] * t, l0.a[1] + l0.d[1] * t] as P2; });
}
/** A rounded slab: the convex outline in (z, y), w thick across x, every edge rounded by r (a hull of spheres). */
export const pressed = (p: P2[], w: number, r: number) => manifold.hull(...inset(p, r).flatMap(([z, y]) => [-1, 1].map((s) => sph(r).move(s * (w / 2 - r), y, z))));
/** A tyre: a round section of radius t about radius rc, spun round x. */
export const tyre = (rc: number, t: number, segs = 56) => { const p: P2[] = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.push([rc + t * Math.cos(a), t * Math.sin(a)]); } return xAxis(turn(p, segs)); };

/** The normals of a side path in (z, y), turned to point up over its top whichever way the path runs (a path run
 *  front to back would otherwise turn every section upside down). */
const normals = (path: P2[]) => {
  const dir = Math.sign(path[path.length - 1][0] - path[0][0]) || 1;
  return path.map((_, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], tz = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tz, ty); return [(-dir * ty) / L, (dir * tz) / L] as P2; });
};
/** A sheet's section swept along a side path in (z, y) at x: `sec` lists (across, up) points of the section, across
 *  along x and up along the path's normal; `w(i)` scales the across of station i (a wing that widens), `cx(i)` moves
 *  its middle. Each pair of stations is hulled, so a concave section comes out filled underneath (sweepSheet doesn't). */
export function sweep(path: P2[], sec: P2[], cx: (t: number) => number, w: (t: number) => number = () => 1): Solid[] {
  const n = normals(path);
  const st = path.map(([z, y], i) => { const t = i / (path.length - 1), [nz, ny] = n[i]; return sec.map(([u, v]) => [cx(t) + u * w(t), y + v * ny, z + v * nz] as V3); });
  const out: Solid[] = [];
  for (let i = 0; i + 1 < st.length; i++) out.push(manifold.hull([...st[i], ...st[i + 1]]));
  return out;
}
/** A sheet th thick swept like sweep, its section an open line of (across, up) points: each segment of the line and
 *  its offset (to the underside, or inward on a lip) is hulled alone between each pair of stations, so a crowned,
 *  lipped wing stays a thin sheet instead of filling underneath. */
export function sweepSheet(path: P2[], line: P2[], cx: (t: number) => number, w: (t: number) => number, th: number): Solid[] {
  const n = normals(path);
  const st = path.map(([z, y], i) => {
    const t = i / (path.length - 1), [nz, ny] = n[i], k = w(t), c = cx(t), f = k < 0 ? -1 : 1;
    const m = line.map(([u, v]) => [c + u * k, v] as P2);
    return m.slice(0, -1).map((p, j) => {
      const q = m[j + 1], dx = q[0] - p[0], dv = q[1] - p[1], l = Math.hypot(dx, dv) || 1, ox = ((f * dv) / l) * th, ov = ((-f * dx) / l) * th;
      return ([p, q, [q[0] + ox, q[1] + ov], [p[0] + ox, p[1] + ov]] as P2[]).map(([x, v]) => [x, y + v * ny, z + v * nz] as V3);
    });
  });
  const out: Solid[] = [];
  for (let i = 0; i + 1 < st.length; i++) for (let j = 0; j < st[i].length; j++) out.push(manifold.hull([...st[i][j], ...st[i + 1][j]]));
  return out;
}

/** A profile [r, y] turned about x, its +y pointing along +x. */
export const turnX = (p: P2[], segments: number) => turn(p, segments).rotate(0, 0, -90);
/** A wire wheel of the Rudge kind on its tyre, axis along x, at the origin: the tyre's outside radius R and section
 *  t, a channel rim, a long hub barrel with its knock-off cap outside (+x; turn the wheel 180 degrees about y for the
 *  other side), two rows of tangent spokes. Returns the rubber, the spokes, hub and rim (lacquer) and the cap. */
export function wireWheel(R: number, t: number, n = 30) {
  const rr = R - 2 * t + 0.01, rubber = tyre(R - t, t);
  const rim = turnX([[rr - 0.012, -t * 0.75], [rr + 0.004, -t * 0.8], [rr + 0.006, -t * 0.55], [rr - 0.004, -t * 0.4], [rr - 0.004, t * 0.4], [rr + 0.006, t * 0.55], [rr + 0.004, t * 0.8], [rr - 0.012, t * 0.75]], 48);
  const hub = turnX([[0.03, -0.085], [0.07, -0.085], [0.075, -0.07], [0.05, -0.06], [0.045, 0.04], [0.065, 0.05], [0.065, 0.065], [0.03, 0.07]], 20);
  const spokes: Solid[] = [];
  for (const [fx, lean] of [[-0.065, 1], [0.055, -1]] as [number, number][]) for (let i = 0; i < n; i++) {
    const a = ((i + (fx < 0 ? 0 : 0.5)) / n) * Math.PI * 2, b = a + lean * (i % 2 ? 0.42 : -0.42), r0 = fx < 0 ? 0.068 : 0.06;
    spokes.push(slat([fx, r0 * Math.cos(a), r0 * Math.sin(a)], [0, (rr - 0.008) * Math.cos(b), (rr - 0.008) * Math.sin(b)], 0.0042, 0.0042));
  }
  const cap = turnX([[0, 0], [0.05, 0], [0.05, 0.012], [0.042, 0.03], [0.03, 0.05], [0, 0.05]], 6).move(0.07, 0, 0);
  return { rubber, spokes: manifold.union(rim, hub, ...spokes), cap };
}

/** A semi-elliptic leaf spring of n leaves along z, the longest L, its ends `bow` higher than its middle (where the
 *  axle sits), w wide, each leaf th thick; eyes at the top leaf's ends. At the origin, the middle of the top leaf. */
export function leafSpring(L: number, n: number, bow: number, w = 0.05, th = 0.008): Solid {
  const s: Solid[] = [];
  for (let i = 0; i < n; i++) {
    const l = L * (1 - (i / n) * 0.8), k = 10, y0 = -i * th, f = (z: number) => y0 + bow * (2 * z / L) ** 2;
    for (let j = 0; j < k; j++) { const z0 = -l / 2 + (l * j) / k, z1 = z0 + l / k; s.push(slat([0, f(z0), z0], [0, f(z1), z1], th, w)); }
  }
  for (const e of [-1, 1]) s.push(xAxis(turn([[0.006, -w / 2], [0.014, -w / 2], [0.014, w / 2], [0.006, w / 2]], 10)).move(0, bow + 0.01, e * L / 2));
  return manifold.union(...s);
}
